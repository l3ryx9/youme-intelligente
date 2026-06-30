/**
 * Entité domaine : Message
 * Représente un message dans une conversation YouMe Intelligente.
 */
export type MessageType = 'text' | 'voice' | 'system';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface AIAnalysisResult {
  emotions: EmotionResult;
  summary?: string;
  topics?: string[];
  entities?: ExtractedEntities;
  transcription?: string;
  language?: string;
  audioDuration?: number;
  processedAt: Date;
}

export interface EmotionResult {
  primary: string;
  primaryScore: number;
  secondary: EmotionScore[];
  label: string;
}

export interface EmotionScore {
  emotion: string;
  score: number;
}

export interface ExtractedEntities {
  persons: EntityWithCitation[];
  locations: EntityWithCitation[];
  events: EntityWithCitation[];
  dates: EntityWithCitation[];
  topics: EntityWithCitation[];
  preferences: EntityWithCitation[];
  concerns: EntityWithCitation[];
  goals: EntityWithCitation[];
  tasks: EntityWithCitation[];
  projects: EntityWithCitation[];
  important: EntityWithCitation[];
}

export interface EntityWithCitation {
  value: string;
  citation: string;
  confidence: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content: string;
  voiceLocalPath?: string;
  voiceDuration?: number;
  status: MessageStatus;
  aiAnalysis?: AIAnalysisResult;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SendMessageDTO = {
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content: string;
  voiceLocalPath?: string;
  voiceDuration?: number;
};
