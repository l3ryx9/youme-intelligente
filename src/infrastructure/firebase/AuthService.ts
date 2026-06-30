/**
 * Service Firebase Authentication
 * Gère toutes les opérations d'authentification.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';
import type { CreateUserDTO } from '@domain/entities/User';

export interface AuthResult {
  uid: string;
  email: string;
  emailVerified: boolean;
}

export class AuthService {
  /**
   * Inscrit un nouvel utilisateur avec email et mot de passe.
   */
  async register(email: string, password: string): Promise<AuthResult> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      return {
        uid: credential.user.uid,
        email: credential.user.email!,
        emailVerified: credential.user.emailVerified,
      };
    } catch (error: any) {
      throw this.mapAuthError(error.code);
    }
  }

  /**
   * Connecte un utilisateur existant.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: credential.user.uid,
        email: credential.user.email!,
        emailVerified: credential.user.emailVerified,
      };
    } catch (error: any) {
      throw this.mapAuthError(error.code);
    }
  }

  /**
   * Déconnecte l'utilisateur courant.
   */
  async logout(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Envoie un email de réinitialisation de mot de passe.
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.mapAuthError(error.code);
    }
  }

  /**
   * Renvoie l'email de vérification.
   */
  async resendEmailVerification(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Aucun utilisateur connecté');
    await sendEmailVerification(user);
  }

  /**
   * Supprime le compte de l'utilisateur après réauthentification.
   */
  async deleteAccount(password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Aucun utilisateur connecté');

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await deleteUser(user);
  }

  /**
   * Retourne l'utilisateur Firebase courant.
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * S'abonne aux changements d'état d'authentification.
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Traduit les codes d'erreur Firebase en messages lisibles.
   */
  private mapAuthError(code: string): Error {
    const errorMap: Record<string, string> = {
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
      'auth/invalid-email': 'Adresse email invalide.',
      'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée.',
      'auth/weak-password': 'Le mot de passe est trop faible (minimum 8 caractères).',
      'auth/user-disabled': 'Ce compte a été désactivé.',
      'auth/user-not-found': 'Aucun compte associé à cet email.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
      'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',
    };
    return new Error(errorMap[code] || 'Une erreur inattendue est survenue.');
  }
}

export const authService = new AuthService();
