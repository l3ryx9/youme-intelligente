# YouMe Intelligente 🤖💬

Application de messagerie privée 1-to-1 avec **IA locale** — transcription vocale (Whisper Tiny), analyse émotionnelle (DistilBERT), extraction d'entités (Gemma/Qwen), et détection d'incohérences probabiliste.

**Stack :** React Native + Expo SDK 51 · Firebase · Clean Architecture · SQLite · MMKV

---

## Fonctionnalités

### 💬 Messagerie
- Messages texte et vocaux en temps réel (Firebase Firestore)
- Accusés de réception et de lecture (✓✓ bleu style WhatsApp)
- Suppression de messages (soft delete)
- Indicateur de statut en ligne
- Design sombre inspiré de WhatsApp

### 🎙️ Messages Vocaux
- Enregistrement avec pause/reprise
- Stockage **exclusivement local** (jamais envoyé en cloud)
- Lecture avec barre de progression et visualisation waveform
- Transcription automatique avec Whisper Tiny

### 🤖 Intelligence Artificielle Locale
- **Whisper Tiny** : transcription des messages vocaux
- **DistilBERT Emotion** : analyse émotionnelle (6 émotions, scores probabilistes)
- **Gemma 2B / Qwen 0.5B** : extraction d'entités (personnes, lieux, dates, tâches, projets...)
- **Mémoire IA** : SQLite local avec résumés et timeline
- **Recherche sémantique** : requêtes en langage naturel sur la mémoire

### 🔍 Détection d'Incohérences
- Analyse probabiliste — jamais de certitudes, toujours des indicateurs
- Formulation éthique obligatoire : "incohérence potentielle", "vérification recommandée"
- Module Gemini optionnel pour analyse approfondie (API gratuite)

### 🔐 Sécurité & Confidentialité
- Authentification Firebase (email + vérification)
- CAPTCHA à l'inscription et connexion
- Règles Firestore strictes (données privées par défaut)
- Données IA 100% locales (SQLite, FileSystem)
- Export et suppression des données à la demande

---

## Installation Rapide

### Prérequis
- Node.js >= 20
- Expo CLI : `npm install -g expo-cli`
- EAS CLI : `npm install -g eas-cli`
- Un projet Firebase avec Auth, Firestore et FCM activés

### 1. Cloner et installer

```bash
git clone https://github.com/votre-org/youme-intelligente.git
cd youme-intelligente
bash scripts/setup.sh   # Installation guidée
```

Ou manuellement :

```bash
npm install --legacy-peer-deps
cp .env.example .env
```

### 2. Configurer Firebase

1. Créer un projet sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activer : **Authentication** (Email/Password), **Firestore**, **Cloud Messaging**
3. Télécharger `google-services.json` (Android) et `GoogleService-Info.plist` (iOS)
4. Placer ces fichiers à la racine du projet
5. Renseigner les variables dans `.env` :

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Déployer les règles Firestore

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

### 4. Lancer l'application

```bash
npx expo start          # QR code pour Expo Go
npx expo start --android # Émulateur Android
npx expo start --ios    # Simulateur iOS
```

---

## Installation des Modèles IA

Les modèles ne sont PAS inclus dans le dépôt (trop volumineux). Ils fonctionnent **entièrement hors ligne** sur l'appareil.

### Whisper Tiny — Transcription Vocale (~75 MB)

```bash
# Option 1 : Hugging Face Hub (Python)
pip install huggingface_hub
python -c "from huggingface_hub import hf_hub_download; hf_hub_download('onnx-community/whisper-tiny', 'onnx/model.onnx', local_dir='models/', local_dir_use_symlinks=False)"
mv models/onnx/model.onnx models/whisper-tiny.onnx

# Option 2 : Direct Download
wget -O models/whisper-tiny.onnx \
  "https://huggingface.co/onnx-community/whisper-tiny/resolve/main/onnx/model.onnx"
```

### DistilBERT Emotion — Analyse Émotionnelle (~260 MB)

```bash
# Conversion depuis HuggingFace (requiert optimum)
pip install optimum[onnxruntime]
optimum-cli export onnx \
  --model bhadresh-savani/distilbert-base-uncased-emotion \
  --task text-classification \
  models/emotion-distilbert/
cp models/emotion-distilbert/model.onnx models/emotion-distilbert.onnx
```

### Gemma 2B Q4 — Analyse Sémantique (~1.5 GB, optionnel)

```bash
# Via huggingface_hub (requiert accès au modèle Gemma)
python -c "
from huggingface_hub import hf_hub_download
hf_hub_download('google/gemma-2b-it-GGUF', 'gemma-2b-it-q4_k_m.gguf',
                local_dir='models/', local_dir_use_symlinks=False)
"
mv models/gemma-2b-it-q4_k_m.gguf models/gemma-2b-it-q4.gguf
```

> **Alternative légère (recommandée) :** Qwen2.5-0.5B-Instruct-GGUF (~400 MB)
> ```bash
> wget -O models/gemma-2b-it-q4.gguf \
>   "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf"
> ```

Mettre à jour `.env` :
```bash
EXPO_PUBLIC_WHISPER_MODEL_PATH=./models/whisper-tiny.onnx
EXPO_PUBLIC_EMOTION_MODEL_PATH=./models/emotion-distilbert.onnx
EXPO_PUBLIC_LLM_MODEL_PATH=./models/gemma-2b-it-q4.gguf
```

> ℹ️ L'application fonctionne **sans les modèles** avec un fallback heuristique automatique.

---

## Configuration Gemini (Optionnel)

Le module d'analyse avancée des incohérences utilise l'API Gemini (gratuit jusqu'à 15 req/min).

1. Créer une clé sur [aistudio.google.com](https://aistudio.google.com)
2. Ajouter dans `.env` :
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_GEMINI_TRIGGER_COUNT=3   # Nb min d'incohérences pour déclencher
```

---

## Tests

```bash
npm test                  # Tests unitaires
npm run test:watch        # Mode watch
npm run test:coverage     # Rapport de couverture (objectif : 60%+)
```

Les tests couvrent :
- Validateurs Zod (loginSchema, registerSchema, passwordStrength)
- EmotionAnalysisService (heuristique + ONNX mock)
- LLMService (extraction rule-based)
- InconsistencyDetector (patterns de contradiction)
- VoiceMessageStorage (Expo FileSystem mock)

---

## Build Production (EAS Build)

```bash
# Configurer EAS
eas login
eas build:configure

# Build Android APK de preview
eas build --profile preview --platform android

# Build Android AAB pour Play Store
eas build --profile production --platform android

# Build iOS pour App Store
eas build --profile production --platform ios
```

---

## Déploiement

```bash
# Soumettre au Google Play Store
eas submit --platform android

# Soumettre à l'App Store Connect
eas submit --platform ios
```

---

## Structure du Projet

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour la documentation technique complète.

---

## Éthique & IA

YouMe Intelligente respecte les principes suivants :

- **Probabiliste, jamais certain** : toutes les analyses IA sont présentées avec des formulations probabilistes ("potentielle", "suggère", "possible")
- **Citations obligatoires** : chaque extraction est justifiée par une citation exacte du message source
- **Zéro hallucination** : les modèles n'inventent pas d'informations — si l'information n'est pas dans le texte, elle n'est pas extraite
- **Séparation faits/interprétations** : l'UI distingue toujours les observations vérifiables des hypothèses du modèle
- **Vérification manuelle recommandée** : pour toute incohérence détectée

---

## Licence

MIT — Voir [LICENSE](LICENSE)

---

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md)
