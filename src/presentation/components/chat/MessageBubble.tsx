/**
 * Composant Bulle de Message
 * Affiche un message texte ou vocal avec accusés d'envoi et analyse IA.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { YOUME_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@shared/constants/theme';
import { formatMessageTime } from '@shared/utils/dateUtils';
import type { Message } from '@domain/entities/Message';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { EmotionBadge } from '../ai/EmotionBadge';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onLongPress?: (message: Message) => void;
  onAIPress?: (message: Message) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onLongPress,
  onAIPress,
}) => {
  const [showAI, setShowAI] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handleLongPress = () => {
    onLongPress?.(message);
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case 'sending':
        return <Ionicons name="time-outline" size={12} color={YOUME_COLORS.textMuted} />;
      case 'sent':
        return <Ionicons name="checkmark" size={12} color={YOUME_COLORS.textMuted} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={12} color={YOUME_COLORS.textMuted} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={12} color={YOUME_COLORS.delivered} />;
      default:
        return null;
    }
  };

  if (message.isDeleted) {
    return (
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={styles.deletedText}>
          <Ionicons name="ban-outline" size={12} /> Ce message a été supprimé.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
      <AnimatedPressable
        style={animatedStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          {message.type === 'voice' ? (
            <VoiceMessagePlayer
              localPath={message.voiceLocalPath ?? ''}
              duration={message.voiceDuration ?? 0}
              isOwn={isOwn}
            />
          ) : (
            <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
              {message.content}
            </Text>
          )}

          {/* Transcription Whisper pour messages vocaux */}
          {message.type === 'voice' && message.aiAnalysis?.transcription && (
            <Text style={styles.transcription}>
              "{message.aiAnalysis.transcription}"
            </Text>
          )}

          <View style={styles.footer}>
            {message.aiAnalysis && (
              <TouchableOpacity
                onPress={() => {
                  setShowAI(!showAI);
                  onAIPress?.(message);
                }}
                style={styles.aiButton}
              >
                <Ionicons name="sparkles" size={12} color={YOUME_COLORS.primary} />
              </TouchableOpacity>
            )}
            <Text style={styles.time}>{formatMessageTime(message.createdAt)}</Text>
            {getStatusIcon()}
          </View>
        </View>
      </AnimatedPressable>

      {/* Badge émotion IA */}
      {showAI && message.aiAnalysis?.emotions && (
        <EmotionBadge emotion={message.aiAnalysis.emotions} isOwn={isOwn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.md,
    marginVertical: 2,
  },
  wrapperOwn: { alignItems: 'flex-end' },
  wrapperOther: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: BORDER_RADIUS.bubble,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 80,
  },
  ownBubble: {
    backgroundColor: YOUME_COLORS.bubbleOwn,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: YOUME_COLORS.bubbleOther,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: TYPOGRAPHY.size.md,
    lineHeight: 20,
  },
  ownText: { color: YOUME_COLORS.bubbleOwnText },
  otherText: { color: YOUME_COLORS.bubbleOtherText },
  transcription: {
    fontSize: TYPOGRAPHY.size.xs,
    color: YOUME_COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: TYPOGRAPHY.size.xs,
    color: YOUME_COLORS.textMuted,
  },
  aiButton: { padding: 2 },
  deletedText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: YOUME_COLORS.textMuted,
    fontStyle: 'italic',
  },
});
