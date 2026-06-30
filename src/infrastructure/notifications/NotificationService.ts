/**
 * Service de Notifications Push
 * Intègre Expo Notifications avec Firebase Cloud Messaging.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userRepository } from '@infrastructure/firebase/UserRepository';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private unsubscribeRef: (() => void) | null = null;

  /**
   * Demande les permissions de notification et enregistre le token FCM.
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('[NotificationService] Émulateur — notifications non disponibles');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationService] Permission de notification refusée');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00A884',
        sound: 'notification.wav',
      });
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      await userRepository.updateFcmToken(userId, token.data);
      return token.data;
    } catch (error) {
      console.error('[NotificationService] Erreur token :', error);
      return null;
    }
  }

  /**
   * Configure les listeners de notifications.
   */
  setupListeners(
    onNotification: (notification: Notifications.Notification) => void,
    onResponse: (response: Notifications.NotificationResponse) => void
  ): () => void {
    const notifSub = Notifications.addNotificationReceivedListener(onNotification);
    const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

    return () => {
      notifSub.remove();
      responseSub.remove();
    };
  }

  /**
   * Envoie une notification locale (pour les messages reçus en foreground).
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: 'notification.wav',
      },
      trigger: null,
    });
  }

  /**
   * Efface toutes les notifications affichées.
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Met à jour le badge de l'application.
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = new NotificationService();
