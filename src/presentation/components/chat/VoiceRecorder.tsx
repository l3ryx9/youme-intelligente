/**
 * Composant Enregistreur de Message Vocal
 * Enregistrement, pause et envoi de messages audio.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated as RNAnimated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { YOUME_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@shared/constants/theme';
import { formatVoiceDuration } from '@shared/utils/dateUtils';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pulseAnim = RNAnimated.loop(
    RNAnimated.sequence([
      RNAnimated.timing(new RNAnimated.Value(1), {
        toValue: 1.3,
        duration: 600,
        useNativeDriver: true,
      }),
      RNAnimated.timing(new RNAnimated.Value(1.3), {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ])
  );
  const pulseScale = new RNAnimated.Value(1);
  const pulseLoop = RNAnimated.loop(
    RNAnimated.sequence([
      RNAnimated.timing(pulseScale, { toValue: 1.2, duration: 600, useNativeDriver: true }),
      RNAnimated.timing(pulseScale, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])
  );

  useEffect(() => {
    startRecording();
    return () => {
      recording?.stopAndUnloadAsync();
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setDuration((d) => d + 1), 1000);
      pulseLoop.start();
    } else {
      pulseLoop.stop();
    }
    return () => {
      clearInterval(interval);
      pulseLoop.stop();
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.warn('Permission microphone refusée');
        onCancel();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setDuration(0);
    } catch (error) {
      console.error('[VoiceRecorder] Erreur démarrage :', error);
      onCancel();
    }
  };

  const handlePauseResume = async () => {
    if (!recording) return;
    if (isPaused) {
      await recording.startAsync();
      setIsPaused(false);
    } else {
      await recording.pauseAsync();
      setIsPaused(true);
    }
  };

  const handleSend = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (uri) {
      onRecordingComplete(uri, duration);
    }
    setRecording(null);
    setIsRecording(false);
  };

  const handleCancel = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
    }
    setRecording(null);
    setIsRecording(false);
    onCancel();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
        <Ionicons name="trash-outline" size={22} color={YOUME_COLORS.error} />
      </TouchableOpacity>

      <View style={styles.center}>
        <RNAnimated.View style={[styles.pulse, { transform: [{ scale: pulseScale }] }]} />
        <Text style={styles.duration}>{formatVoiceDuration(duration)}</Text>
        <Text style={styles.status}>{isPaused ? '⏸ En pause' : '🔴 Enregistrement...'}</Text>
      </View>

      <TouchableOpacity onPress={handlePauseResume} style={styles.pauseButton}>
        <Ionicons
          name={isPaused ? 'play-circle' : 'pause-circle'}
          size={32}
          color={YOUME_COLORS.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
        <Ionicons name="send" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  cancelButton: { padding: SPACING.xs },
  center: { flex: 1, alignItems: 'center', position: 'relative' },
  pulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${YOUME_COLORS.error}33`,
  },
  duration: {
    fontSize: TYPOGRAPHY.size.xl,
    color: YOUME_COLORS.textPrimary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  status: {
    fontSize: TYPOGRAPHY.size.xs,
    color: YOUME_COLORS.textSecondary,
    marginTop: 2,
  },
  pauseButton: {},
  sendButton: {
    backgroundColor: YOUME_COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
