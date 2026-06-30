/**
 * Écran Principal — Liste des Conversations
 * Style WhatsApp : liste avec dernier message, heure, accusés et statut en ligne.
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Searchbar, FAB } from 'react-native-paper';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { YOUME_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../src/shared/constants/theme';
import { Avatar } from '../../../src/presentation/components/common/Avatar';
import { formatConversationDate } from '../../../src/shared/utils/dateUtils';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useConversationStore } from '../../../src/presentation/stores/conversationStore';
import type { ConversationWithPartner } from '../../../src/domain/entities/Conversation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../../src/infrastructure/firebase/config';

export default function ConversationsScreen() {
  const { user } = useAuthStore();
  const { conversations, setConversations, isLoading } = useConversationStore();
  const [search, setSearch] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, COLLECTIONS.CONVERSATIONS),
      where('participantIds', 'array-contains', user.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const convs: ConversationWithPartner[] = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const partnerId = (data.participantIds as string[]).find((id) => id !== user.id);
        if (!partnerId) continue;

        convs.push({
          id: docSnap.id,
          participantIds: data.participantIds,
          lastMessage: data.lastMessage,
          unreadCount: data.unreadCount ?? 0,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          partnerId,
          partnerUsername: data.partnerUsername ?? partnerId,
          partnerDisplayName: data.partnerDisplayName ?? partnerId,
          partnerPhotoURL: data.partnerPhotoURL,
          partnerIsOnline: data.partnerIsOnline ?? false,
          partnerLastSeen: data.partnerLastSeen?.toDate() ?? new Date(),
        });
      }
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = conversations.filter(
    (c) =>
      c.partnerDisplayName.toLowerCase().includes(search.toLowerCase()) ||
      c.partnerUsername.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ConversationWithPartner; index: number }) => (
      <Animated.View entering={FadeInUp.delay(index * 30)} layout={Layout.springify()}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push(`/(app)/chat/${item.id}`)}
          activeOpacity={0.7}
        >
          <Avatar
            displayName={item.partnerDisplayName}
            photoURL={item.partnerPhotoURL}
            size={52}
            isOnline={item.partnerIsOnline}
          />
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.partnerDisplayName}
              </Text>
              <Text style={styles.itemTime}>
                {item.lastMessage ? formatConversationDate(item.lastMessage.createdAt?.toDate?.() ?? item.updatedAt) : ''}
              </Text>
            </View>
            <View style={styles.itemFooter}>
              <Text style={styles.itemLastMessage} numberOfLines={1}>
                {item.lastMessage?.type === 'voice'
                  ? '🎤 Message vocal'
                  : item.lastMessage?.content ?? 'Commencer la conversation'}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YouMe</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="camera-outline" size={24} color={YOUME_COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={24} color={YOUME_COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Rechercher..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={YOUME_COLORS.textSecondary}
          placeholderTextColor={YOUME_COLORS.placeholder}
        />
      </View>

      {/* Liste des conversations */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(false)}
            tintColor={YOUME_COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color={YOUME_COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySubtitle}>
              Ajoutez des partenaires pour commencer à discuter
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: YOUME_COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 48,
    paddingBottom: SPACING.sm,
    backgroundColor: YOUME_COLORS.secondary,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: YOUME_COLORS.textPrimary,
  },
  headerActions: { flexDirection: 'row', gap: SPACING.sm },
  headerButton: { padding: SPACING.xs },
  searchContainer: { padding: SPACING.sm, backgroundColor: YOUME_COLORS.secondary },
  searchBar: { backgroundColor: YOUME_COLORS.surface, elevation: 0 },
  searchInput: { color: YOUME_COLORS.textPrimary, fontSize: TYPOGRAPHY.size.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
    backgroundColor: YOUME_COLORS.background,
  },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: TYPOGRAPHY.size.md, fontWeight: '600', color: YOUME_COLORS.textPrimary, flex: 1 },
  itemTime: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted, marginLeft: SPACING.sm },
  itemFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  itemLastMessage: { flex: 1, fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.textSecondary },
  unreadBadge: {
    backgroundColor: YOUME_COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: { fontSize: TYPOGRAPHY.size.xs, color: '#FFFFFF', fontWeight: '700' },
  separator: { height: 1, backgroundColor: YOUME_COLORS.divider, marginLeft: 80 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.size.lg, color: YOUME_COLORS.textSecondary, fontWeight: '600' },
  emptySubtitle: { fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.textMuted, textAlign: 'center' },
});
