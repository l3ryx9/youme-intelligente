/**
 * Écran de Chat
 * Messagerie temps réel avec texte et vocal, accusés et analyse IA.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { YOUME_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../src/shared/constants/theme';
import { MessageBubble } from '../../../src/presentation/components/chat/MessageBubble';
import { VoiceRecorder } from '../../../src/presentation/components/chat/VoiceRecorder';
import { Avatar } from '../../../src/presentation/components/common/Avatar';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useConversationStore } from '../../../src/presentation/stores/conversationStore';
import { messageRepository } from '../../../src/infrastructure/firebase/MessageRepository';
import { voiceStorage } from '../../../src/infrastructure/storage/VoiceMessageStorage';
import { aiOrchestrator } from '../../../src/ai/memory/AIOrchestrator';
import { useUIStore } from '../../../src/presentation/stores/uiStore';
import { formatMessageDay, isSameDay } from '../../../src/shared/utils/dateUtils';
import type { Message } from '../../../src/domain/entities/Message';

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { aiEnabled } = useUIStore();
  const { messages, setMessages, addMessage, updateMessage } = useConversationStore();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const conversationMessages = messages[conversationId ?? ''] ?? [];

  // Partenaire simulé (à récupérer depuis les conversations store)
  const partnerName = 'Partenaire';
  const partnerIsOnline = false;

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = messageRepository.subscribeToMessages(conversationId, (msgs) => {
      setMessages(conversationId, msgs);
      // Marquer comme lu
      if (user) {
        messageRepository.markMessagesAsRead(conversationId, user.id);
      }
    });
    return () => unsubscribe();
  }, [conversationId]);

  const sendTextMessage = useCallback(async () => {
    if (!text.trim() || !user || !conversationId || isSending) return;
    const content = text.trim();
    setText('');
    setIsSending(true);

    try {
      const msg = await messageRepository.sendMessage({
        conversationId,
        senderId: user.id,
        receiverId: 'partner_id',
        type: 'text',
        content,
      });
      addMessage(conversationId, msg);

      // Analyse IA en arrière-plan
      if (aiEnabled) {
        aiOrchestrator.analyzeMessageAsync(msg, aiEnabled).then((analysis) => {
          if (analysis) {
            updateMessage(conversationId, msg.id, { aiAnalysis: analysis });
            messageRepository.updateMessageInConversation(conversationId, msg.id, { aiAnalysis: analysis });
          }
        });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setIsSending(false);
    }
  }, [text, user, conversationId, aiEnabled]);

  const sendVoiceMessage = useCallback(
    async (uri: string, duration: number) => {
      if (!user || !conversationId) return;
      setIsRecording(false);

      try {
        const fileInfo = await voiceStorage.save(uri, duration);
        const msg = await messageRepository.sendMessage({
          conversationId,
          senderId: user.id,
          receiverId: 'partner_id',
          type: 'voice',
          content: '🎤 Message vocal',
          voiceLocalPath: fileInfo.localPath,
          voiceDuration: duration,
        });
        addMessage(conversationId, msg);

        // Pipeline IA complet (Whisper → émotion → LLM → mémoire)
        if (aiEnabled) {
          aiOrchestrator.analyzeMessageAsync(msg, aiEnabled).then((analysis) => {
            if (analysis) {
              updateMessage(conversationId, msg.id, { aiAnalysis: analysis });
            }
          });
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal');
      }
    },
    [user, conversationId, aiEnabled]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isOwn = item.senderId === user?.id;
      const showDayHeader =
        index === 0 ||
        !isSameDay(
          conversationMessages[index - 1].createdAt,
          item.createdAt
        );

      return (
        <>
          {showDayHeader && (
            <View style={styles.dayHeader}>
              <View style={styles.dayHeaderPill}>
                <Text style={styles.dayHeaderText}>
                  {formatMessageDay(item.createdAt)}
                </Text>
              </View>
            </View>
          )}
          <MessageBubble
            message={item}
            isOwn={isOwn}
            onLongPress={(msg) => {
              Alert.alert('Message', 'Options', [
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => {
                    messageRepository.deleteMessageInConversation(conversationId!, msg.id);
                    updateMessage(conversationId!, msg.id, { isDeleted: true });
                  },
                },
                { text: 'Annuler', style: 'cancel' },
              ]);
            }}
            onAIPress={(msg) => {
              if (msg.aiAnalysis) {
                router.push(`/(app)/ai-insights/${msg.id}`);
              }
            }}
          />
        </>
      );
    },
    [user, conversationMessages, conversationId]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={YOUME_COLORS.textPrimary} />
        </TouchableOpacity>
        <Avatar displayName={partnerName} size={38} isOnline={partnerIsOnline} showStatus />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{partnerName}</Text>
          <Text style={styles.headerStatus}>
            {partnerIsOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="videocam-outline" size={24} color={YOUME_COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="call-outline" size={24} color={YOUME_COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={YOUME_COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Dites bonjour ! 👋</Text>
          </View>
        }
      />

      {/* Zone de saisie */}
      <View style={styles.inputArea}>
        {isRecording ? (
          <VoiceRecorder
            onRecordingComplete={sendVoiceMessage}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle-outline" size={26} color={YOUME_COLORS.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor={YOUME_COLORS.placeholder}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={4000}
            />

            {text.trim() ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendTextMessage}
                disabled={isSending}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={() => setIsRecording(true)}
              >
                <Ionicons name="mic" size={22} color={YOUME_COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: YOUME_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: YOUME_COLORS.secondary,
    gap: SPACING.sm,
  },
  backButton: { padding: SPACING.xs },
  headerInfo: { flex: 1 },
  headerName: { fontSize: TYPOGRAPHY.size.md, fontWeight: '600', color: YOUME_COLORS.textPrimary },
  headerStatus: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textSecondary },
  headerButton: { padding: SPACING.xs },
  messageList: { paddingVertical: SPACING.sm, flexGrow: 1 },
  dayHeader: { alignItems: 'center', marginVertical: SPACING.md },
  dayHeaderPill: {
    backgroundColor: `${YOUME_COLORS.secondary}CC`,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  dayHeaderText: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textMuted },
  inputArea: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: YOUME_COLORS.secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  attachButton: { padding: SPACING.xs, marginBottom: 4 },
  textInput: {
    flex: 1,
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: YOUME_COLORS.textPrimary,
    fontSize: TYPOGRAPHY.size.md,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: YOUME_COLORS.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: { padding: SPACING.xs, marginBottom: 4 },
});
