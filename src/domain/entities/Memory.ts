/**
 * Entité domaine : Mémoire IA
 * Représente les données mémorisées par le système IA local.
 */
export type MemoryCategory =
  | 'topic'
  | 'person'
  | 'location'
  | 'event'
  | 'date'
  | 'preference'
  | 'concern'
  | 'goal'
  | 'task'
  | 'project'
  | 'important'
  | 'emotion';

export interface MemoryEntry {
  id: string;
  conversationId: string;
  partnerId: string;
  category: MemoryCategory;
  value: string;
  citation: string;
  messageId: string;
  emotion?: string;
  emotionScore?: number;
  embedding?: number[];
  confidence: number;
  timestamp: Date;
  createdAt: Date;
}

export interface ConversationSummary {
  id: string;
  conversationId: string;
  partnerId: string;
  summary: string;
  keyPoints: string[];
  emotions: string[];
  topics: string[];
  fromDate: Date;
  toDate: Date;
  messageCount: number;
  createdAt: Date;
}

export interface InconsistencyRecord {
  id: string;
  conversationId: string;
  partnerId: string;
  statement1: string;
  statement2: string;
  citation1: string;
  citation2: string;
  messageId1: string;
  messageId2: string;
  date1: Date;
  date2: Date;
  inconsistencyType: 'contradiction' | 'version_change' | 'chronological' | 'factual';
  explanation: string;
  coherenceScore: number;
  isReviewed: boolean;
  geminiAnalysis?: GeminiAnalysisResult;
  detectedAt: Date;
}

export interface GeminiAnalysisResult {
  timeline: TimelineEntry[];
  contradictions: ContradictionDetail[];
  emotionalVariations: EmotionalVariation[];
  hypotheses: string[];
  overallCoherenceScore: number;
  deceptionRiskEstimate: number;
  deceptionRiskLabel: string;
  facts: string[];
  interpretations: string[];
  analyzedAt: Date;
}

export interface TimelineEntry {
  date: Date;
  statement: string;
  citation: string;
  emotion?: string;
}

export interface ContradictionDetail {
  subject: string;
  version1: string;
  version2: string;
  citation1: string;
  citation2: string;
  explanation: string;
}

export interface EmotionalVariation {
  date: Date;
  emotion: string;
  score: number;
  context: string;
}

export interface SearchResult {
  type: 'memory' | 'message' | 'summary';
  relevanceScore: number;
  citation: string;
  messageId?: string;
  memoryEntry?: MemoryEntry;
  conversationId: string;
  partnerId: string;
  timestamp: Date;
}
