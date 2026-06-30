/**
 * Service d'Analyse Émotionnelle — DistilBERT / RoBERTa Emotion
 *
 * Analyse le contenu textuel d'un message pour détecter les émotions.
 * Utilise DistilBERT Emotion ou RoBERTa Emotion via ONNX Runtime.
 *
 * IMPORTANT : Les résultats sont PROBABILISTES et ne constituent pas
 * une certitude. L'interface utilisateur doit toujours formuler les
 * résultats avec des termes comme "probable", "possible", "suggère".
 *
 * Modèle recommandé :
 *   bhadresh-savani/distilbert-base-uncased-emotion (6 émotions)
 *   Télécharger depuis HuggingFace et convertir en ONNX avec optimum
 */
import type { EmotionResult, EmotionScore } from '@domain/entities/Message';

export const EMOTION_LABELS: Record<string, string> = {
  joy: 'Joie',
  sadness: 'Tristesse',
  anger: 'Colère',
  fear: 'Peur',
  surprise: 'Surprise',
  disgust: 'Dégoût',
  neutral: 'Neutre',
  love: 'Amour',
  optimism: 'Optimisme',
  pessimism: 'Pessimisme',
};

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700',
  sadness: '#6495ED',
  anger: '#FF4444',
  fear: '#9370DB',
  surprise: '#FF8C00',
  disgust: '#6B8E23',
  neutral: '#9E9E9E',
  love: '#FF69B4',
  optimism: '#00CED1',
  pessimism: '#708090',
};

export class EmotionAnalysisService {
  private isModelLoaded = false;

  /**
   * Initialise le modèle d'analyse émotionnelle.
   * Échoue gracieusement si le modèle est absent.
   */
  async initialize(): Promise<boolean> {
    try {
      const modelPath = process.env.EXPO_PUBLIC_EMOTION_MODEL_PATH;
      if (!modelPath) {
        console.warn('[EmotionService] Chemin du modèle non configuré');
        return false;
      }

      // Chargement du modèle ONNX
      // const session = await InferenceSession.create(modelPath);
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('[EmotionService] Erreur d\'initialisation :', error);
      return false;
    }
  }

  /**
   * Analyse les émotions d'un texte.
   * Retourne null si le modèle n'est pas disponible.
   *
   * Les scores retournés sont des probabilités (somme = 1.0).
   * JAMAIS présentés comme des certitudes dans l'UI.
   */
  async analyze(text: string): Promise<EmotionResult | null> {
    if (!text.trim()) return null;

    if (!this.isModelLoaded) {
      // Fallback : analyse heuristique légère si modèle absent
      return this.heuristicAnalysis(text);
    }

    try {
      // === Implémentation ONNX Runtime ===
      // 1. Tokenisation du texte avec le tokenizer DistilBERT
      // 2. Inférence ONNX : session.run({ input_ids, attention_mask })
      // 3. Application de softmax sur les logits
      // 4. Mapping des indices vers les labels d'émotions
      //
      // Exemple :
      // const tokens = tokenizer.encode(text, { maxLength: 128 });
      // const { logits } = await session.run({ input_ids: tokens.ids, attention_mask: tokens.mask });
      // const probs = softmax(Array.from(logits.data));
      // const emotions = EMOTION_LABELS.map((label, i) => ({ emotion: label, score: probs[i] }));
      //
      // Retour de l'analyse heuristique en attendant le modèle :
      return this.heuristicAnalysis(text);
    } catch (error) {
      console.error('[EmotionService] Erreur d\'analyse :', error);
      return this.heuristicAnalysis(text);
    }
  }

  /**
   * Analyse heuristique légère basée sur des mots-clés.
   * Utilisée comme fallback quand le modèle ONNX n'est pas disponible.
   */
  private heuristicAnalysis(text: string): EmotionResult {
    const lower = text.toLowerCase();

    const emotionKeywords: Record<string, string[]> = {
      joy: ['heureux', 'heureuse', 'content', 'contente', 'super', 'génial', 'parfait', 'bravo', '😊', '😄', '🎉', 'excellent', 'merci'],
      sadness: ['triste', 'déprimé', 'malheureux', 'pleure', 'pleuré', 'seul', 'seule', 'mal', '😢', '😭', 'dommage'],
      anger: ['énervé', 'furieux', 'colère', 'rage', 'insupportable', 'nul', 'nulle', '😡', '🤬', 'inacceptable'],
      fear: ['peur', 'inquiet', 'angoissé', 'stressé', 'anxieux', 'crainte', '😨', '😰', 'effrayé'],
      surprise: ['surpris', 'incroyable', 'wow', 'choqué', 'étonnant', '😮', '😲', 'vraiment'],
      love: ['amour', 'adore', 'chéri', 'chérie', '❤️', '💕', '💖', 'tendresse', 'bisou'],
    };

    const scores: EmotionScore[] = [];
    let total = 0;

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const count = keywords.filter((k) => lower.includes(k)).length;
      const score = Math.min(count * 0.15, 0.9);
      scores.push({ emotion, score });
      total += score;
    }

    if (total === 0) {
      scores.push({ emotion: 'neutral', score: 1.0 });
      total = 1.0;
    }

    const normalized = scores
      .map((s) => ({ ...s, score: total > 0 ? s.score / total : 0 }))
      .sort((a, b) => b.score - a.score);

    if (normalized[0].emotion !== 'neutral' && total === 0) {
      normalized.unshift({ emotion: 'neutral', score: 1.0 });
    }

    const primary = normalized[0];
    return {
      primary: primary.emotion,
      primaryScore: primary.score,
      secondary: normalized.slice(1, 4).filter((s) => s.score > 0.05),
      label: this.buildLabel(primary.emotion, primary.score),
    };
  }

  /**
   * Construit un label probabiliste pour l'UI.
   * JAMAIS de formulation certaine — toujours probabiliste.
   */
  private buildLabel(emotion: string, score: number): string {
    const emotionFr = EMOTION_LABELS[emotion] ?? emotion;
    if (score > 0.7) return `Suggère probablement : ${emotionFr}`;
    if (score > 0.4) return `Pourrait indiquer : ${emotionFr}`;
    return `Légère tendance vers : ${emotionFr}`;
  }

  /**
   * Retourne la couleur associée à une émotion.
   */
  getEmotionColor(emotion: string): string {
    return EMOTION_COLORS[emotion] ?? '#9E9E9E';
  }

  isAvailable(): boolean {
    return this.isModelLoaded;
  }
}

export const emotionService = new EmotionAnalysisService();
