/**
 * Écran d'Inscription
 * Email, mot de passe, username unique, surnom, CAPTCHA
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  registerSchema,
  type RegisterFormData,
} from '../../src/shared/validators/authValidators';
import { YOUME_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/shared/constants/theme';
import { useAuth } from '../../src/presentation/hooks/useAuth';
import { PasswordStrengthBar } from '../../src/presentation/components/common/PasswordStrengthBar';

export default function RegisterScreen() {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      displayName: '',
      captchaToken: 'mock_captcha_token',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      Alert.alert(
        'Compte créé !',
        'Un email de vérification a été envoyé à votre adresse. Veuillez le vérifier avant de vous connecter.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={YOUME_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez YouMe Intelligente</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.form}>
          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Adresse email *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
                outlineStyle={styles.inputOutline}
                textColor={YOUME_COLORS.textPrimary}
                left={<TextInput.Icon icon="email-outline" color={YOUME_COLORS.textSecondary} />}
                error={!!errors.email}
              />
            )}
          />
          {errors.email && <HelperText type="error">{errors.email.message}</HelperText>}

          {/* Username */}
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Username unique *"
                value={value}
                onChangeText={(t) => onChange(t.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                onBlur={onBlur}
                autoCapitalize="none"
                mode="outlined"
                style={[styles.input, { marginTop: SPACING.sm }]}
                outlineStyle={styles.inputOutline}
                textColor={YOUME_COLORS.textPrimary}
                left={<TextInput.Icon icon="at" color={YOUME_COLORS.textSecondary} />}
                error={!!errors.username}
                helperText="3-20 caractères, lettres, chiffres, . et _"
              />
            )}
          />
          {errors.username && <HelperText type="error">{errors.username.message}</HelperText>}

          {/* Surnom */}
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Surnom affiché *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                style={[styles.input, { marginTop: SPACING.sm }]}
                outlineStyle={styles.inputOutline}
                textColor={YOUME_COLORS.textPrimary}
                left={<TextInput.Icon icon="account-outline" color={YOUME_COLORS.textSecondary} />}
                error={!!errors.displayName}
              />
            )}
          />
          {errors.displayName && <HelperText type="error">{errors.displayName.message}</HelperText>}

          {/* Mot de passe */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Mot de passe *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                mode="outlined"
                style={[styles.input, { marginTop: SPACING.sm }]}
                outlineStyle={styles.inputOutline}
                textColor={YOUME_COLORS.textPrimary}
                left={<TextInput.Icon icon="lock-outline" color={YOUME_COLORS.textSecondary} />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    color={YOUME_COLORS.textSecondary}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                error={!!errors.password}
              />
            )}
          />
          <PasswordStrengthBar password={password} />
          {errors.password && <HelperText type="error">{errors.password.message}</HelperText>}

          {/* Confirmation */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Confirmer le mot de passe *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showConfirm}
                mode="outlined"
                style={[styles.input, { marginTop: SPACING.sm }]}
                outlineStyle={styles.inputOutline}
                textColor={YOUME_COLORS.textPrimary}
                left={<TextInput.Icon icon="lock-check-outline" color={YOUME_COLORS.textSecondary} />}
                right={
                  <TextInput.Icon
                    icon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    color={YOUME_COLORS.textSecondary}
                    onPress={() => setShowConfirm(!showConfirm)}
                  />
                }
                error={!!errors.confirmPassword}
              />
            )}
          />
          {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword.message}</HelperText>}

          {/* CAPTCHA */}
          <View style={styles.captchaBox}>
            <Ionicons name="shield-checkmark" size={20} color={YOUME_COLORS.success} />
            <Text style={styles.captchaText}>Je ne suis pas un robot ✓</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={YOUME_COLORS.primary}
          >
            Créer mon compte
          </Button>

          <Text style={styles.terms}>
            En vous inscrivant, vous acceptez notre politique de confidentialité.
            Vos données sont stockées localement sur votre appareil.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: YOUME_COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xl },
  header: { marginBottom: SPACING.xl },
  backButton: { marginBottom: SPACING.md },
  title: { fontSize: TYPOGRAPHY.size.xxl, fontWeight: '700', color: YOUME_COLORS.textPrimary },
  subtitle: { fontSize: TYPOGRAPHY.size.md, color: YOUME_COLORS.textSecondary, marginTop: 4 },
  form: { gap: SPACING.xs },
  input: { backgroundColor: YOUME_COLORS.inputBackground },
  inputOutline: { borderColor: YOUME_COLORS.divider, borderRadius: BORDER_RADIUS.md },
  captchaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: YOUME_COLORS.success,
    marginTop: SPACING.sm,
  },
  captchaText: { color: YOUME_COLORS.success, fontSize: TYPOGRAPHY.size.md },
  button: { marginTop: SPACING.md, borderRadius: BORDER_RADIUS.md },
  buttonContent: { height: 50 },
  buttonLabel: { fontSize: TYPOGRAPHY.size.md, fontWeight: '600' },
  terms: {
    fontSize: TYPOGRAPHY.size.xs,
    color: YOUME_COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
  },
  footerText: { color: YOUME_COLORS.textSecondary },
  loginLink: { color: YOUME_COLORS.primary, fontWeight: '600' },
});
