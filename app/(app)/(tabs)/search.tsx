/**
 * Écran Recherche Intelligente IA
 * Recherche sémantique dans la mémoire avec citations exactes.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from 'react-native-paper';
import { YOUME_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../src/shared/constants/theme';
import { intelligentSearch } from '../../../src/ai/search/IntelligentSearch';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useUIStore } from '../../../src/presentation/stores/uiStore';
import type { SearchResult } from '../../../src/domain/entities/Memory';
import type { MemoryCategory } from '../../../src/domain/entities/Memory';

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  topic: 'Sujet',
  person: 'Personne',
  location: 'Lieu',
  event: 'Événement',
  date: 'Date',
  preference: 'Préférence',
  concern: 'Préoccupation',
  goal: 'Objectif',
  task: 'Tâche',
  project: 'Projet',
  important: 'Important',
  emotion: 'Émotion',
};

const QUICK_QUERIES = [
  'sujets fréquents',
  'projets mentionnés',
  'tâches à faire',
  'lieux évoqués',
  'préférences',
  'objectifs',
];

export default function SearchScreen() {
  const { user } = useAuthStore();
  const { aiEnabled } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | undefined>();

  const handleSearch = async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await intelligentSearch.search({
        text: searchQuery,
        category: selectedCategory,
      });
      setResults(response.results);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('[Search] Erreur :', error);
    } finally {
      setIsSearching(false);
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.memoryEntry ? CATEGORY_LABELS[item.memoryEntry.category] : 'Message'}
          </Text>
        </View>
        <Text style={styles.resultDate}>
          {item.timestamp.toLocaleDateString('fr-FR')}
        </Text>
      </View>

      {item.memoryEntry && (
        <Text style={styles.resultValue}>{item.memoryEntry.value}</Text>
      )}

      <View style={styles.citationContainer}>
        <Ionicons name="quote" size={12} color={YOUME_COLORS.textMuted} />
        <Text style={styles.citation} numberOfLines={3}>
          {item.citation}
        </Text>
      </View>

      <View style={styles.resultFooter}>
        <Text style={styles.relevanceText}>
          Pertinence : {Math.round(item.relevanceScore * 100)}%
        </Text>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Voir le message</Text>
          <Ionicons name="arrow-forward" size={12} color={YOUME_COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!aiEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recherche IA</Text>
        </View>
        <View style={styles.disabledContainer}>
          <Ionicons name="sparkles-outline" size={64} color={YOUME_COLORS.textMuted} />
          <Text style={styles.disabledTitle}>IA désactivée</Text>
          <Text style={styles.disabledText}>
            Activez l'IA dans les paramètres pour utiliser la recherche intelligente.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color={YOUME_COLORS.primary} />
        <Text style={styles.headerTitle}>Recherche IA</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans la mémoire IA..."
            placeholderTextColor={YOUME_COLORS.placeholder}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleSearch()}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="search" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Requêtes rapides */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickQueries}>
          {QUICK_QUERIES.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.quickChip}
              onPress={() => { setQuery(q); handleSearch(q); }}
            >
              <Text style={styles.quickChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtre par catégorie */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              Tout
            </Text>
          </TouchableOpacity>
          {(Object.keys(CATEGORY_LABELS) as MemoryCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat === selectedCategory ? undefined : cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Résultats */}
      {results.length > 0 && (
        <Text style={styles.resultCount}>
          {totalCount} résultat{totalCount > 1 ? 's' : ''} — citations exactes affichées
        </Text>
      )}

      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(item, index) => `${item.conversationId}-${index}`}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          !isSearching && query ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color={YOUME_COLORS.textMuted} />
              <Text style={styles.noResultsText}>Aucun résultat pour "{query}"</Text>
            </View>
          ) : !query ? (
            <View style={styles.placeholder}>
              <Ionicons name="bulb-outline" size={48} color={YOUME_COLORS.primary} />
              <Text style={styles.placeholderTitle}>Recherche sémantique</Text>
              <Text style={styles.placeholderText}>
                Posez des questions comme "sujets fréquents" ou "projets mentionnés".
                Chaque résultat inclut la citation exacte du message.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: YOUME_COLORS.background },
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
  searchContainer: { backgroundColor: YOUME_COLORS.secondary, paddingBottom: SPACING.sm },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    color: YOUME_COLORS.textPrimary,
    fontSize: TYPOGRAPHY.size.md,
  },
  searchButton: {
    backgroundColor: YOUME_COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickQueries: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  quickChip: {
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginRight: SPACING.sm,
  },
  quickChipText: { fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.textSecondary },
  categoryFilters: { paddingHorizontal: SPACING.md, paddingTop: SPACING.xs },
  categoryChip: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: YOUME_COLORS.divider,
  },
  categoryChipActive: { backgroundColor: YOUME_COLORS.primary, borderColor: YOUME_COLORS.primary },
  categoryChipText: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted },
  categoryChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  resultCount: {
    fontSize: TYPOGRAPHY.size.xs,
    color: YOUME_COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  resultsList: { padding: SPACING.md, gap: SPACING.sm },
  resultCard: {
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: {
    backgroundColor: `${YOUME_COLORS.primary}22`,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.primary, fontWeight: '600' },
  resultDate: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted },
  resultValue: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textPrimary, fontWeight: '500' },
  citationContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    backgroundColor: YOUME_COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: YOUME_COLORS.primary,
  },
  citation: { flex: 1, fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.textSecondary, fontStyle: 'italic' },
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  relevanceText: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewButtonText: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.primary },
  noResults: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  noResultsText: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textSecondary },
  placeholder: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl, gap: SPACING.md },
  placeholderTitle: { fontSize: TYPOGRAPHY.size.lg, color: YOUME_COLORS.textPrimary, fontWeight: '600' },
  placeholderText: { fontSize: TYPOGRAPHY.size.sm, color: YOUME_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  disabledContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  disabledTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: '600', color: YOUME_COLORS.textSecondary },
  disabledText: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textMuted, textAlign: 'center' },
});
