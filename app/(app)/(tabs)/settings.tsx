/**
 * Écran Paramètres
 * Profil, IA, confidentialité, thème, suppression de compte.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { Switch, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { YOUME_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../src/shared/constants/theme';
import { Avatar } from '../../../src/presentation/components/common/Avatar';
import { useAuth } from '../../../src/presentation/hooks/useAuth';
import { useUIStore } from '../../../src/presentation/stores/uiStore';
import { memoryRepository } from '../../../src/infrastructure/storage/LocalMemoryRepository';
import { userRepository } from '../../../src/infrastructure/firebase/UserRepository';

interface SettingRow {
  icon: string;
  label: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode, aiEnabled, notificationsEnabled, toggleDarkMode, setAiEnabled, setNotificationsEnabled } = useUIStore();
  const [exportingData, setExportingData] = useState(false);
  const [deletingMemory, setDeletingMemory] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    setExportingData(true);
    try {
      const data = await memoryRepository.exportMemory();
      await Share.share({
        title: 'YouMe Intelligente — Mes données',
        message: data,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteMemory = () => {
    Alert.alert(
      'Supprimer la mémoire IA',
      'Cette action supprimera définitivement toutes les données analysées par l\'IA (résumés, émotions, entités). Les messages ne sont pas affectés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingMemory(true);
            try {
              await memoryRepository.deleteAllMemory();
              Alert.alert('Mémoire IA supprimée', 'Toutes les données IA ont été effacées.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la mémoire');
            } finally {
              setDeletingMemory(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const handleAiToggle = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Désactiver l\'IA',
        'L\'analyse IA sera désactivée. Les messages ne seront plus analysés automatiquement. La mémoire existante est conservée.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Désactiver', onPress: () => {
            setAiEnabled(false);
            if (user) userRepository.updateAiEnabled(user.id, false);
          }},
        ]
      );
    } else {
      setAiEnabled(true);
      if (user) userRepository.updateAiEnabled(user.id, true);
    }
  };

  const Section = ({ title, rows }: { title: string; rows: SettingRow[] }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {rows.map((row, index) => (
          <TouchableOpacity
            key={row.label}
            style={[
              styles.row,
              index < rows.length - 1 && styles.rowBorder,
            ]}
            onPress={row.onPress}
            disabled={!row.onPress}
            activeOpacity={row.onPress ? 0.7 : 1}
          >
            <View style={[styles.rowIcon, row.danger && styles.rowIconDanger]}>
              <Ionicons
                name={row.icon as any}
                size={20}
                color={row.danger ? YOUME_COLORS.error : YOUME_COLORS.primary}
              />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, row.danger && styles.rowLabelDanger]}>
                {row.label}
              </Text>
              {row.description && (
                <Text style={styles.rowDescription}>{row.description}</Text>
              )}
            </View>
            {row.rightElement ?? (
              row.onPress && (
                <Ionicons name="chevron-forward" size={16} color={YOUME_COLORS.textMuted} />
              )
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      {/* Profil */}
      {user && (
        <TouchableOpacity style={styles.profileCard}>
          <Avatar displayName={user.displayName} photoURL={user.photoURL} size={60} showStatus={false} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.displayName}</Text>
            <Text style={styles.profileUsername}>@{user.username}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={YOUME_COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* Préférences */}
      <Section
        title="Préférences"
        rows={[
          {
            icon: 'moon-outline',
            label: 'Mode sombre',
            description: 'Activé par défaut',
            rightElement: (
              <Switch value={isDarkMode} onValueChange={toggleDarkMode} color={YOUME_COLORS.primary} />
            ),
          },
          {
            icon: 'notifications-outline',
            label: 'Notifications',
            rightElement: (
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} color={YOUME_COLORS.primary} />
            ),
          },
        ]}
      />

      {/* Intelligence Artificielle */}
      <Section
        title="Intelligence Artificielle"
        rows={[
          {
            icon: 'sparkles-outline',
            label: 'Analyse IA activée',
            description: 'Analyse émotionnelle et extraction d\'entités',
            rightElement: (
              <Switch value={aiEnabled} onValueChange={handleAiToggle} color={YOUME_COLORS.primary} />
            ),
          },
          {
            icon: 'information-circle-outline',
            label: 'Modèles IA',
            description: 'Whisper Tiny, DistilBERT, Gemma 2B',
            onPress: () => Alert.alert(
              'Modèles IA',
              'Whisper Tiny : transcription vocale\nDistilBERT Emotion : analyse émotionnelle\nGemma 2B Q4 : analyse sémantique\n\nTous les modèles fonctionnent localement sur votre appareil. Voir README pour l\'installation.'
            ),
          },
        ]}
      />

      {/* Confidentialité */}
      <Section
        title="Confidentialité & Données"
        rows={[
          {
            icon: 'download-outline',
            label: 'Exporter mes données',
            description: 'Exporter la mémoire IA en JSON',
            onPress: handleExportData,
            rightElement: exportingData ? <ActivityIndicator size="small" color={YOUME_COLORS.primary} /> : undefined,
          },
          {
            icon: 'trash-outline',
            label: 'Supprimer la mémoire IA',
            description: 'Efface tous les résumés et analyses',
            onPress: handleDeleteMemory,
            rightElement: deletingMemory ? <ActivityIndicator size="small" color={YOUME_COLORS.error} /> : undefined,
            danger: true,
          },
        ]}
      />

      {/* Compte */}
      <Section
        title="Compte"
        rows={[
          {
            icon: 'log-out-outline',
            label: 'Se déconnecter',
            onPress: handleLogout,
          },
          {
            icon: 'person-remove-outline',
            label: 'Supprimer le compte',
            description: 'Action irréversible',
            onPress: () => router.push('/(app)/account-deletion'),
            danger: true,
          },
        ]}
      />

      {/* À propos */}
      <View style={styles.about}>
        <Text style={styles.aboutTitle}>YouMe Intelligente</Text>
        <Text style={styles.aboutVersion}>Version 1.0.0</Text>
        <Text style={styles.aboutDesc}>
          Messagerie privée avec IA locale — 100% gratuit et open source.
          Vos données restent sur votre appareil.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: YOUME_COLORS.background },
  scroll: { paddingBottom: 40 },
  header: {
    paddingTop: 48,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: YOUME_COLORS.secondary,
  },
  headerTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: '700', color: YOUME_COLORS.textPrimary },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: YOUME_COLORS.surface,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: TYPOGRAPHY.size.lg, fontWeight: '700', color: YOUME_COLORS.textPrimary },
  profileUsername: { fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.primary },
  profileEmail: { fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.textSecondary },
  section: { marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: YOUME_COLORS.primary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: YOUME_COLORS.divider },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${YOUME_COLORS.primary}22`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconDanger: { backgroundColor: `${YOUME_COLORS.error}22` },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textPrimary },
  rowLabelDanger: { color: YOUME_COLORS.error },
  rowDescription: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted, marginTop: 2 },
  about: { alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xl, gap: SPACING.xs },
  aboutTitle: { fontSize: TYPOGRAPHY.size.md, fontWeight: '700', color: YOUME_COLORS.textSecondary },
  aboutVersion: { fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.textMuted },
  aboutDesc: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
});
