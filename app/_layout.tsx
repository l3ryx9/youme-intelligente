/**
 * Layout Racine — Expo Router
 * Configure le thème, les fonts, les providers globaux et l'état d'auth.
 */
import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../src/infrastructure/firebase/AuthService';
import { userRepository } from '../src/infrastructure/firebase/UserRepository';
import { useAuthStore } from '../src/presentation/stores/authStore';
import { useUIStore } from '../src/presentation/stores/uiStore';
import { YOUME_DARK_THEME, YOUME_LIGHT_THEME } from '../src/shared/constants/theme';
import { aiOrchestrator } from '../src/ai/memory/AIOrchestrator';
import { notificationService } from '../src/infrastructure/notifications/NotificationService';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

export default function RootLayout() {
  const { setUser, isAuthenticated } = useAuthStore();
  const { isDarkMode, loadPersistedState } = useUIStore();
  const theme = isDarkMode ? YOUME_DARK_THEME : YOUME_LIGHT_THEME;

  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    loadPersistedState();

    // Initialiser l'orchestrateur IA
    aiOrchestrator.initialize().catch(console.error);

    // Écoute les changements d'état Firebase Auth
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await userRepository.getUserById(firebaseUser.uid);
          if (user) {
            setUser(user);
            await userRepository.updateOnlineStatus(firebaseUser.uid, true);
            // Enregistrer les notifications push
            await notificationService.registerForPushNotifications(firebaseUser.uid);
          }
        } catch (error) {
          console.error('[RootLayout] Erreur chargement utilisateur :', error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Redirection basée sur l'état d'auth
    if (isAuthenticated) {
      router.replace('/(app)/(tabs)/');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar style="light" backgroundColor="#111B21" />
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack>
          </View>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
