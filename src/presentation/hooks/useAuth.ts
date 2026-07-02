/**
 * Hook useAuth
 * Gère l'état d'authentification et les opérations d'auth.
 */
import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '@infrastructure/firebase/AuthService';
import { userRepository } from '@infrastructure/firebase/UserRepository';
import type { RegisterFormData, LoginFormData } from '@shared/validators/authValidators';

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    setUser,
    setLoading,
    setError,
    clearError,
    reset,
  } = useAuthStore();

  const register = useCallback(
    async (data: RegisterFormData): Promise<void> => {
      setLoading(true);
      clearError();

      let authUid: string | null = null;

      try {
        // 1. Créer le compte Firebase Auth en premier
        //    (l'utilisateur est maintenant authentifié → les règles Firestore s'appliquent)
        const authResult = await authService.register(data.email, data.password);
        authUid = authResult.uid;

        // 2. Vérifier la disponibilité du username (maintenant authentifié ✓)
        const isAvailable = await userRepository.isUsernameAvailable(data.username);
        if (!isAvailable) {
          // Supprimer le compte Auth créé pour ne pas laisser de compte orphelin
          await authService.deleteCurrentUser();
          throw new Error('Ce username est déjà utilisé. Choisissez-en un autre.');
        }

        // 3. Créer le profil Firestore
        const newUser = await userRepository.createUser({
          id: authResult.uid,
          email: data.email,
          username: data.username,
          displayName: data.displayName,
        });

        setUser(newUser);
      } catch (err: any) {
        // Si le profil Firestore échoue après la création Auth → nettoyer le compte Auth
        if (authUid) {
          try { await authService.deleteCurrentUser(); } catch (_) {}
        }
        setError(err.message ?? 'Erreur lors de l\'inscription');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setUser, setError]
  );

  const login = useCallback(
    async (data: LoginFormData): Promise<void> => {
      setLoading(true);
      clearError();
      try {
        const authResult = await authService.login(data.email, data.password);
        const dbUser = await userRepository.getUserById(authResult.uid);
        if (!dbUser) throw new Error('Profil utilisateur introuvable.');
        setUser(dbUser);
        await userRepository.updateOnlineStatus(authResult.uid, true);
      } catch (err: any) {
        setError(err.message ?? 'Erreur lors de la connexion');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setUser, setError]
  );

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      if (user) {
        await userRepository.updateOnlineStatus(user.id, false);
      }
      await authService.logout();
      reset();
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, reset]);

  const deleteAccount = useCallback(
    async (password: string): Promise<void> => {
      setLoading(true);
      try {
        if (user) {
          await userRepository.deleteUser(user.id);
        }
        await authService.deleteAccount(password);
        reset();
      } catch (err: any) {
        setError(err.message ?? 'Erreur lors de la suppression du compte');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, setLoading, setError, reset]
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<void> => {
      setLoading(true);
      clearError();
      try {
        await authService.sendPasswordReset(email);
      } catch (err: any) {
        setError(err.message ?? 'Erreur lors de l\'envoi de l\'email');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setError]
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    register,
    login,
    logout,
    deleteAccount,
    sendPasswordReset,
    clearError,
  };
}
