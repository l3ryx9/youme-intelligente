/**
 * Écran Insights IA
 * Affiche l'analyse IA complète d'un message.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { YOUME_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../src/shared/constants/theme';
import { useConversationStore } from '../../../src/presentation/stores/conversationStore';
import { emotionService } from '../../../src/ai/emotion/EmotionAnalysisService';
import type { AIAnalysisResult } from '../../../src/domain/entities/Message';

export default function AIInsightsScreen() {
  const { id: messageId } = useLocalSearchParams<{ id: string }>();
  const { messages } = useConversationStore();

  const message = Object.values(messages)
    .flat()
    .find((m) => m.id === messageId);

  const analysis = message?.aiAnalysis;

  if (!analysis) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={YOUME_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights IA</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={56} color={YOUME_COLORS.textMuted} />
          <Text style={styles.emptyText}>Analyse IA non disponible pour ce message.</Text>
        </View>
      </View>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={YOUME_COLORS.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="sparkles" size={18} color={YOUME_COLORS.primary} />
        <Text style={styles.headerTitle}>Insights IA</Text>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={YOUME_COLORS.warning} />
        <Text style={styles.disclaimerText}>
          Analyse probabiliste — résultats non définitifs. Toujours vérifier manuellement.
        </Text>
      </View>

      {/* Transcription Whisper (message vocal) */}
      {analysis.transcription && (
        <Section title="📝 Transcription Whisper">
          <View style={styles.card}>
            <Text style={styles.transcriptionText}>"{analysis.transcription}"</Text>
            {analysis.language && (
              <Text style={styles.metaText}>
                Langue : {analysis.language} • Durée : {analysis.audioDuration?.toFixed(1)}s
              </Text>
            )}
          </View>
        </Section>
      )}

      {/* Émotions */}
      <Section title="💭 Analyse Émotionnelle">
        <View style={styles.card}>
          <View style={styles.emotionHeader}>
            <View
              style={[
                styles.emotionDot,
                { backgroundColor: emotionService.getEmotionColor(analysis.emotions.primary) },
              ]}
            />
            <Text style={[
              styles.emotionPrimary,
              { color: emotionService.getEmotionColor(analysis.emotions.primary) },
            ]}>
              {analysis.emotions.label}
            </Text>
          </View>
          <Text style={styles.confidenceText}>
            Confiance : {Math.round(analysis.emotions.primaryScore * 100)}%
          </Text>
          {analysis.emotions.secondary.length > 0 && (
            <View style={styles.secondaryEmotions}>
              {analysis.emotions.secondary.map((e) => (
                <View key={e.emotion} style={styles.secondaryChip}>
                  <Text style={styles.secondaryChipText}>
                    {e.emotion} ({Math.round(e.score * 100)}%)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Section>

      {/* Résumé */}
      {analysis.summary && (
        <Section title="📋 Résumé">
          <View style={styles.card}>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>
        </Section>
      )}

      {/* Sujets */}
      {analysis.topics && analysis.topics.length > 0 && (
        <Section title="🏷️ Sujets détectés">
          <View style={styles.card}>
            <View style={styles.tagList}>
              {analysis.topics.map((topic) => (
                <View key={topic} style={styles.tag}>
                  <Text style={styles.tagText}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        </Section>
      )}

      {/* Entités extraites */}
      {analysis.entities && (
        <>
          {analysis.entities.tasks.length > 0 && (
            <Section title="✅ Tâches identifiées">
              {analysis.entities.tasks.map((t, i) => (
                <View key={i} style={styles.entityCard}>
                  <Text style={styles.entityValue}>{t.value}</Text>
                  <Text style={styles.entityCitation}>Citation : "{t.citation}"</Text>
                </View>
              ))}
            </Section>
          )}
          {analysis.entities.persons.length > 0 && (
            <Section title="👤 Personnes mentionnées">
              {analysis.entities.persons.map((p, i) => (
                <View key={i} style={styles.entityCard}>
                  <Text style={styles.entityValue}>{p.value}</Text>
                  <Text style={styles.entityCitation}>"{p.citation}"</Text>
                </View>
              ))}
            </Section>
          )}
        </>
      )}

      {/* Date d'analyse */}
      <Text style={styles.analysisDate}>
        Analysé le {analysis.processedAt.toLocaleString('fr-FR')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: YOUME_COLORS.background },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: 48,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: YOUME_COLORS.secondary,
  },
  headerTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: '700', color: YOUME_COLORS.textPrimary },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    margin: SPACING.md,
    backgroundColor: `${YOUME_COLORS.warning}22`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: `${YOUME_COLORS.warning}44`,
  },
  disclaimerText: { flex: 1, fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.warning, lineHeight: 18 },
  section: { marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '700', color: YOUME_COLORS.textSecondary, marginBottom: SPACING.xs },
  card: {
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  transcriptionText: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textPrimary, fontStyle: 'italic', lineHeight: 22 },
  metaText: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted },
  emotionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  emotionDot: { width: 12, height: 12, borderRadius: 6 },
  emotionPrimary: { fontSize: TYPOGRAPHY.size.lg, fontWeight: '600' },
  confidenceText: { fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.textSecondary },
  secondaryEmotions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  secondaryChip: {
    backgroundColor: YOUME_COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  secondaryChipText: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textSecondary },
  summaryText: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textPrimary, lineHeight: 22 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tag: {
    backgroundColor: `${YOUME_COLORS.primary}22`,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.primary },
  entityCard: {
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: YOUME_COLORS.primary,
  },
  entityValue: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textPrimary, fontWeight: '500' },
  entityCitation: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textSecondary, fontStyle: 'italic', marginTop: 4 },
  analysisDate: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted, textAlign: 'center', marginTop: SPACING.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.xl },
  emptyText: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textSecondary, textAlign: 'center' },
});
