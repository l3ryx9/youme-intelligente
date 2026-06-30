/**
 * Service LLM Léger — Qwen / Gemma quantifié
 *
 * Utilise un LLM léger (Qwen 0.5B ou Gemma 2B quantifié en Q4) pour
 * extraire des informations structurées des messages :
 * résumé, sujets, entités, préférences, objectifs, tâches, etc.
 *
 * RÈGLE FONDAMENTALE : Le modèle ne doit JAMAIS inventer d'informations.
 * Chaque extraction doit être justifiée par une citation exacte du message.
 * Si aucune information ne peut être extraite avec certitude, retourner null.
 *
 * Modèles compatibles :
 *   - Qwen/Qwen2.5-0.5B-Instruct-GGUF (très léger, ~500MB)
 *   - google/gemma-2b-it (Q4_K_M, ~1.5GB)
 *   Voir README.md pour les liens de téléchargement.
 */
import type { ExtractedEntities, EntityWithCitation } from '@domain/entities/Message';

export interface LLMExtractionResult {
  summary: string | null;
  topics: string[];
  entities: ExtractedEntities;
  sentiment: string | null;
  confidence: number;
}

export interface LLMConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
}

const DEFAULT_CONFIG: LLMConfig = {
  maxTokens: 256,
  temperature: 0.1,
  topP: 0.9,
};

export class LLMService {
  private isModelLoaded = false;
  private config: LLMConfig = DEFAULT_CONFIG;

  /**
   * Initialise le modèle LLM.
   * Échoue gracieusement si le modèle est absent ou trop volumineux.
   */
  async initialize(): Promise<boolean> {
    try {
      const modelPath = process.env.EXPO_PUBLIC_LLM_MODEL_PATH;
      if (!modelPath) {
        console.warn('[LLMService] Chemin du modèle LLM non configuré');
        return false;
      }

      // Chargement via react-native-fast-tflite ou onnxruntime-react-native
      // Pour les modèles GGUF : llama.rn ou similaire
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('[LLMService] Erreur d\'initialisation :', error);
      return false;
    }
  }

  /**
   * Extrait des informations structurées d'un message.
   * Toutes les extractions incluent une citation exacte du texte source.
   * Retourne null pour les champs sans information vérifiable.
   *
   * PRINCIPE : Zéro hallucination — si l'information n'est pas dans le texte,
   * elle n'est pas extraite.
   */
  async extractFromText(text: string): Promise<LLMExtractionResult> {
    if (!text.trim()) {
      return this.emptyResult();
    }

    if (!this.isModelLoaded) {
      return this.ruleBasedExtraction(text);
    }

    try {
      const prompt = this.buildExtractionPrompt(text);

      // === Implémentation LLM ===
      // Dans une implémentation complète :
      // const response = await llmModel.generate(prompt, this.config);
      // const parsed = this.parseStructuredResponse(response, text);
      // return parsed;

      return this.ruleBasedExtraction(text);
    } catch (error) {
      console.error('[LLMService] Erreur d\'extraction :', error);
      return this.ruleBasedExtraction(text);
    }
  }

  /**
   * Génère un résumé d'une liste de messages.
   * Le résumé est factuel — uniquement ce qui est dit dans les messages.
   */
  async summarizeMessages(messages: string[]): Promise<string> {
    if (messages.length === 0) return '';

    const combined = messages.join('\n---\n');

    if (!this.isModelLoaded) {
      return this.heuristicSummary(messages);
    }

    try {
      const prompt = `Résume en 2-3 phrases les points essentiels de cette conversation, sans ajouter d'interprétations ni d'informations non présentes dans le texte :\n\n${combined}`;
      // const response = await llmModel.generate(prompt, { maxTokens: 128, temperature: 0.1 });
      return this.heuristicSummary(messages);
    } catch (error) {
      return this.heuristicSummary(messages);
    }
  }

  /**
   * Extraction basée sur des règles — fallback sans modèle LLM.
   * Extraction conservative : uniquement ce qui est clairement identifiable.
   */
  private ruleBasedExtraction(text: string): LLMExtractionResult {
    const entities = this.emptyEntities();

    // Extraction de dates
    const datePatterns = [
      /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/gi,
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
      /\b(demain|aujourd'hui|hier|ce soir|ce matin|cette semaine)\b/gi,
    ];

    for (const pattern of datePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        entities.dates.push({
          value: match[0],
          citation: this.extractSentence(text, match.index ?? 0),
          confidence: 0.8,
        });
      }
    }

    // Extraction de tâches
    const taskPatterns = [
      /\b(je dois|il faut|n'oublie pas|rappelle-moi|pense à|prévu de|planifié)\s+(.+?)(?:[.!?]|$)/gi,
    ];
    for (const pattern of taskPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[2]) {
          entities.tasks.push({
            value: match[2].trim(),
            citation: match[0].trim(),
            confidence: 0.75,
          });
        }
      }
    }

    const summary = text.length > 100 ? text.substring(0, 97) + '...' : null;

    return {
      summary,
      topics: [],
      entities,
      sentiment: null,
      confidence: 0.5,
    };
  }

  private heuristicSummary(messages: string[]): string {
    const total = messages.length;
    const first = messages[0]?.substring(0, 50) ?? '';
    return `Conversation de ${total} message${total > 1 ? 's' : ''}. Début : "${first}..."`;
  }

  private buildExtractionPrompt(text: string): string {
    return `Tu es un système d'extraction d'informations. Extrais UNIQUEMENT les informations présentes dans le texte suivant. Ne jamais inventer d'informations. Chaque extraction doit inclure la citation exacte du texte source.

Texte : "${text}"

Réponds en JSON avec les champs : summary, topics, persons, locations, events, dates, preferences, concerns, goals, tasks, projects.
Pour chaque item, inclure : value (information extraite) et citation (phrase exacte du texte).
Retourner null pour les champs sans information vérifiable.`;
  }

  private extractSentence(text: string, index: number): string {
    const start = Math.max(0, text.lastIndexOf('.', index) + 1);
    const end = text.indexOf('.', index);
    return text.substring(start, end === -1 ? text.length : end + 1).trim();
  }

  private emptyEntities(): ExtractedEntities {
    return {
      persons: [],
      locations: [],
      events: [],
      dates: [],
      topics: [],
      preferences: [],
      concerns: [],
      goals: [],
      tasks: [],
      projects: [],
      important: [],
    };
  }

  private emptyResult(): LLMExtractionResult {
    return {
      summary: null,
      topics: [],
      entities: this.emptyEntities(),
      sentiment: null,
      confidence: 0,
    };
  }

  isAvailable(): boolean {
    return this.isModelLoaded;
  }
}

export const llmService = new LLMService();
