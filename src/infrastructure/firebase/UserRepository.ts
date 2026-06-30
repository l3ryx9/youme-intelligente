/**
 * Repository Firebase : Utilisateurs
 * Implémente IUserRepository avec Firestore.
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';
import type { IUserRepository } from '@domain/repositories/IUserRepository';
import type { User, UserProfile, CreateUserDTO, UpdateUserDTO } from '@domain/entities/User';

export class UserRepository implements IUserRepository {
  private usersRef = collection(db, COLLECTIONS.USERS);

  async createUser(data: CreateUserDTO & { id: string }): Promise<User> {
    const now = new Date();
    const user: User = {
      id: data.id,
      email: data.email,
      username: data.username.toLowerCase(),
      displayName: data.displayName,
      isOnline: true,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
      isEmailVerified: false,
      aiEnabled: true,
    };

    await setDoc(doc(db, COLLECTIONS.USERS, data.id), {
      ...user,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, id));
    if (!snap.exists()) return null;
    return this.mapDocToUser(snap.id, snap.data());
  }

  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const q = query(this.usersRef, where('username', '==', username.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return this.mapDocToProfile(docSnap.id, docSnap.data());
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const updated = await this.getUserById(id);
    if (!updated) throw new Error('Utilisateur introuvable après mise à jour.');
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.USERS, id));
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const q = query(this.usersRef, where('username', '==', username.toLowerCase()));
    const snap = await getDocs(q);
    return snap.empty;
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), {
      isOnline,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async updateFcmToken(id: string, token: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    });
  }

  async updateAiEnabled(id: string, enabled: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), {
      aiEnabled: enabled,
      updatedAt: serverTimestamp(),
    });
  }

  async searchUsersByUsername(queryStr: string): Promise<UserProfile[]> {
    const lower = queryStr.toLowerCase();
    const q = query(
      this.usersRef,
      where('username', '>=', lower),
      where('username', '<=', lower + '\uf8ff')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.mapDocToProfile(d.id, d.data()));
  }

  private mapDocToUser(id: string, data: any): User {
    return {
      id,
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      photoURL: data.photoURL,
      bio: data.bio,
      isOnline: data.isOnline ?? false,
      lastSeen: data.lastSeen instanceof Timestamp ? data.lastSeen.toDate() : new Date(),
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      isEmailVerified: data.isEmailVerified ?? false,
      aiEnabled: data.aiEnabled ?? true,
      fcmToken: data.fcmToken,
    };
  }

  private mapDocToProfile(id: string, data: any): UserProfile {
    return {
      id,
      username: data.username,
      displayName: data.displayName,
      photoURL: data.photoURL,
      bio: data.bio,
      isOnline: data.isOnline ?? false,
      lastSeen: data.lastSeen instanceof Timestamp ? data.lastSeen.toDate() : new Date(),
    };
  }
}

export const userRepository = new UserRepository();
