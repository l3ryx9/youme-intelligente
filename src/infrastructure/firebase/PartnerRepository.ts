/**
 * Repository Firebase : Partenaires
 * Gère les demandes et relations de partenariat.
 */
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';
import type { IPartnerRepository } from '@domain/repositories/IPartnerRepository';
import type { Partner, PartnerRequest, SendPartnerRequestDTO } from '@domain/entities/Partner';
import { userRepository } from './UserRepository';
import { v4 as uuidv4 } from 'uuid';

export class PartnerRepository implements IPartnerRepository {
  async sendPartnerRequest(data: SendPartnerRequestDTO): Promise<PartnerRequest> {
    const receiver = await userRepository.getUserByUsername(data.receiverUsername);
    if (!receiver) throw new Error('Utilisateur introuvable avec ce username.');

    const sender = await userRepository.getUserById(data.senderId);
    if (!sender) throw new Error('Utilisateur expéditeur introuvable.');

    const alreadyPartner = await this.isPartner(data.senderId, receiver.id);
    if (alreadyPartner) throw new Error('Vous êtes déjà partenaires.');

    const existing = await getDocs(
      query(
        collection(db, COLLECTIONS.PARTNER_REQUESTS),
        where('senderId', '==', data.senderId),
        where('receiverId', '==', receiver.id),
        where('status', '==', 'pending')
      )
    );
    if (!existing.empty) throw new Error('Une demande est déjà en attente.');

    const ref = await addDoc(collection(db, COLLECTIONS.PARTNER_REQUESTS), {
      senderId: data.senderId,
      senderUsername: sender.username,
      senderDisplayName: sender.displayName,
      senderPhotoURL: sender.photoURL ?? null,
      receiverId: receiver.id,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: ref.id,
      senderId: data.senderId,
      senderUsername: sender.username,
      senderDisplayName: sender.displayName,
      senderPhotoURL: sender.photoURL,
      receiverId: receiver.id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async acceptPartnerRequest(requestId: string): Promise<void> {
    const reqSnap = await getDoc(doc(db, COLLECTIONS.PARTNER_REQUESTS, requestId));
    if (!reqSnap.exists()) throw new Error('Demande introuvable.');

    const reqData = reqSnap.data();
    const senderId = reqData.senderId as string;
    const receiverId = reqData.receiverId as string;

    const sender = await userRepository.getUserById(senderId);
    const receiver = await userRepository.getUserById(receiverId);
    if (!sender || !receiver) throw new Error('Utilisateurs introuvables.');

    const conversationId = [senderId, receiverId].sort().join('_');
    const batch = writeBatch(db);

    batch.update(doc(db, COLLECTIONS.PARTNER_REQUESTS, requestId), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
      participantIds: [senderId, receiverId],
      lastMessage: null,
      unreadCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, COLLECTIONS.PARTNERS, `${senderId}_${receiverId}`), {
      userId: senderId,
      partnerId: receiverId,
      partnerUsername: receiver.username,
      partnerDisplayName: receiver.displayName,
      partnerPhotoURL: receiver.photoURL ?? null,
      conversationId,
      createdAt: serverTimestamp(),
    });

    batch.set(doc(db, COLLECTIONS.PARTNERS, `${receiverId}_${senderId}`), {
      userId: receiverId,
      partnerId: senderId,
      partnerUsername: sender.username,
      partnerDisplayName: sender.displayName,
      partnerPhotoURL: sender.photoURL ?? null,
      conversationId,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  }

  async rejectPartnerRequest(requestId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.PARTNER_REQUESTS, requestId), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
  }

  async getPartners(userId: string): Promise<Partner[]> {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.PARTNERS), where('userId', '==', userId))
    );
    return snap.docs.map((d) => this.mapPartner(d.data()));
  }

  async getPendingRequests(userId: string): Promise<PartnerRequest[]> {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.PARTNER_REQUESTS),
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
      )
    );
    return snap.docs.map((d) => this.mapRequest(d.id, d.data()));
  }

  async getSentRequests(userId: string): Promise<PartnerRequest[]> {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.PARTNER_REQUESTS),
        where('senderId', '==', userId),
        where('status', '==', 'pending')
      )
    );
    return snap.docs.map((d) => this.mapRequest(d.id, d.data()));
  }

  async removePartner(userId: string, partnerId: string): Promise<void> {
    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTIONS.PARTNERS, `${userId}_${partnerId}`));
    batch.delete(doc(db, COLLECTIONS.PARTNERS, `${partnerId}_${userId}`));
    await batch.commit();
  }

  async isPartner(userId: string, partnerId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, COLLECTIONS.PARTNERS, `${userId}_${partnerId}`));
    return snap.exists();
  }

  subscribeToPartners(userId: string, callback: (partners: Partner[]) => void): () => void {
    return onSnapshot(
      query(collection(db, COLLECTIONS.PARTNERS), where('userId', '==', userId)),
      (snap) => callback(snap.docs.map((d) => this.mapPartner(d.data())))
    );
  }

  subscribeToRequests(userId: string, callback: (requests: PartnerRequest[]) => void): () => void {
    return onSnapshot(
      query(
        collection(db, COLLECTIONS.PARTNER_REQUESTS),
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
      ),
      (snap) => callback(snap.docs.map((d) => this.mapRequest(d.id, d.data())))
    );
  }

  private mapPartner(data: any): Partner {
    return {
      userId: data.userId,
      partnerId: data.partnerId,
      partnerUsername: data.partnerUsername,
      partnerDisplayName: data.partnerDisplayName,
      partnerPhotoURL: data.partnerPhotoURL ?? undefined,
      partnerIsOnline: data.partnerIsOnline ?? false,
      partnerLastSeen: data.partnerLastSeen instanceof Timestamp
        ? data.partnerLastSeen.toDate()
        : new Date(),
      conversationId: data.conversationId,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    };
  }

  private mapRequest(id: string, data: any): PartnerRequest {
    return {
      id,
      senderId: data.senderId,
      senderUsername: data.senderUsername,
      senderDisplayName: data.senderDisplayName,
      senderPhotoURL: data.senderPhotoURL ?? undefined,
      receiverId: data.receiverId,
      status: data.status,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }
}

export const partnerRepository = new PartnerRepository();
