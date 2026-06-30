/**
 * Repository Firebase : Messages
 * Implémente IMessageRepository avec Firestore.
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
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';
import type { IMessageRepository } from '@domain/repositories/IMessageRepository';
import type { Message, SendMessageDTO, AIAnalysisResult, MessageStatus } from '@domain/entities/Message';

export class MessageRepository implements IMessageRepository {
  async sendMessage(data: SendMessageDTO): Promise<Message> {
    const now = new Date();
    const msgData = {
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      type: data.type,
      content: data.content,
      voiceLocalPath: data.voiceLocalPath ?? null,
      voiceDuration: data.voiceDuration ?? null,
      status: 'sent',
      isDeleted: false,
      aiAnalysis: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(
      collection(db, COLLECTIONS.CONVERSATIONS, data.conversationId, 'messages'),
      msgData
    );

    await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, data.conversationId), {
      lastMessage: {
        id: ref.id,
        type: data.type,
        content: data.content,
        senderId: data.senderId,
        createdAt: serverTimestamp(),
        status: 'sent',
      },
      updatedAt: serverTimestamp(),
    });

    return {
      id: ref.id,
      ...data,
      status: 'sent',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getMessageById(id: string): Promise<Message | null> {
    return null;
  }

  async getConversationMessages(
    conversationId: string,
    msgLimit = 50,
    before?: Date
  ): Promise<Message[]> {
    let q = query(
      collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(msgLimit)
    );

    const snap = await getDocs(q);
    return snap.docs
      .map((d) => this.mapDoc(d.id, conversationId, d.data()))
      .reverse();
  }

  async updateMessageStatus(id: string, status: MessageStatus): Promise<void> {
    // Note: requires conversationId to update sub-collection document
  }

  async updateMessageAIAnalysis(
    id: string,
    analysis: AIAnalysisResult
  ): Promise<void> {
    // Note: requires conversationId
  }

  async updateMessageInConversation(
    conversationId: string,
    messageId: string,
    data: Partial<{ status: MessageStatus; aiAnalysis: AIAnalysisResult }>
  ): Promise<void> {
    await updateDoc(
      doc(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages', messageId),
      { ...data, updatedAt: serverTimestamp() }
    );
  }

  async deleteMessage(id: string): Promise<void> {
    // Soft delete — requires conversationId; see deleteMessageInConversation
  }

  async deleteMessageInConversation(
    conversationId: string,
    messageId: string
  ): Promise<void> {
    await updateDoc(
      doc(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages', messageId),
      { isDeleted: true, content: 'Ce message a été supprimé.', updatedAt: serverTimestamp() }
    );
  }

  async searchMessages(conversationId: string, queryStr: string): Promise<Message[]> {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages'),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      )
    );
    const lower = queryStr.toLowerCase();
    return snap.docs
      .map((d) => this.mapDoc(d.id, conversationId, d.data()))
      .filter((m) => m.content.toLowerCase().includes(lower));
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages'),
        where('receiverId', '==', userId),
        where('status', '!=', 'read')
      )
    );
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { status: 'read', updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }

  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const messages = snap.docs.map((d) => this.mapDoc(d.id, conversationId, d.data()));
      callback(messages);
    });
  }

  private mapDoc(id: string, conversationId: string, data: any): Message {
    return {
      id,
      conversationId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      type: data.type,
      content: data.content,
      voiceLocalPath: data.voiceLocalPath ?? undefined,
      voiceDuration: data.voiceDuration ?? undefined,
      status: data.status,
      aiAnalysis: data.aiAnalysis ?? undefined,
      isDeleted: data.isDeleted ?? false,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }
}

export const messageRepository = new MessageRepository();
