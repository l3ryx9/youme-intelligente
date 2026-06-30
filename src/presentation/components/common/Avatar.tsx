/**
 * Composant Avatar
 * Affiche la photo de profil d'un utilisateur avec indicateur de statut en ligne.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar as PaperAvatar } from 'react-native-paper';
import { YOUME_COLORS, BORDER_RADIUS } from '@shared/constants/theme';

interface AvatarProps {
  displayName: string;
  photoURL?: string;
  size?: number;
  isOnline?: boolean;
  showStatus?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  displayName,
  photoURL,
  size = 48,
  isOnline = false,
  showStatus = true,
}) => {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      {photoURL ? (
        <PaperAvatar.Image size={size} source={{ uri: photoURL }} />
      ) : (
        <PaperAvatar.Text
          size={size}
          label={initials}
          style={styles.placeholder}
          labelStyle={styles.placeholderLabel}
        />
      )}
      {showStatus && (
        <View
          style={[
            styles.statusDot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: (size * 0.28) / 2,
              backgroundColor: isOnline
                ? YOUME_COLORS.online
                : YOUME_COLORS.textMuted,
              right: -1,
              bottom: -1,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  placeholder: {
    backgroundColor: YOUME_COLORS.primary,
  },
  placeholderLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: YOUME_COLORS.background,
  },
});
