/**
 * Layout Application — écrans authentifiés
 */
import { Stack } from 'expo-router';
import { YOUME_COLORS } from '../../src/shared/constants/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: YOUME_COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="ai-insights/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
