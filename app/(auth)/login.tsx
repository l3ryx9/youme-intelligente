/**
 * Écran de Connexion
 * Email + mot de passe + CAPTCHA
 */
import React, { useState, useRef } from 'react';
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
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { YOUME_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/shared/constants/theme';
import { loginSchema, type LoginFormData } from '../../src/shared/validators/authValidators';
import { useAuth } from '../../src/presentation/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('mock_captcha_token');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', captchaToken: 'mock_captcha_token' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error: any) {
      Alert.alert('Erreur de connexion', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="chatbubbles" size={56} color={YOUME_COLORS.primary} />
          </View>
          <Text style={styles.appName}>YouMe Intelligente</Text>
          <Text style={styles.tagline}>Messagerie privée avec IA locale</Text>
        </Animated.View>

        {/* Formulaire */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Adresse email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                mode="outlined"
                style={styles.input}
                outlineStyle={styles.inputOutline}
                textColor={YOUME_COLORS.textPrimary}
                placeholderTextColor={YOUME_COLORS.placeholder}
                left={<TextInput.Icon icon="email-outline" color={YOUME_COLORS.textSecondary} />}
                error={!!errors.email}
              />
            )}
          />
          {errors.email && (
            <HelperText type="error" style={styles.helperText}>
              {errors.email.message}
            </HelperText>
          )}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                autoComplete="password"
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
          {errors.password && (
            <HelperText type="error" style={styles.helperText}>
              {errors.password.message}
            </HelperText>
          )}

          {/* CAPTCHA placeholder */}
          <View style={styles.captchaContainer}>
            <View style={styles.captchaBox}>
              <Ionicons name="shield-checkmark" size={20} color={YOUME_COLORS.success} />
              <Text style={styles.captchaText}>Je ne suis pas un robot ✓</Text>
            </View>
            <Text style={styles.captchaNote}>
              Intégrer react-native-recaptcha-that-works avec votre clé hCaptcha
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            labelStyle={styles.loginButtonLabel}
            buttonColor={YOUME_COLORS.primary}
          >
            Se connecter
          </Button>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Lien inscription */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: YOUME_COLORS.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  header: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${YOUME_COLORS.primary}22`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '700',
    color: YOUME_COLORS.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: TYPOGRAPHY.size.sm,
    color: YOUME_COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: { gap: SPACING.xs },
  input: { backgroundColor: YOUME_COLORS.inputBackground },
  inputOutline: { borderColor: YOUME_COLORS.divider, borderRadius: BORDER_RADIUS.md },
  helperText: { color: YOUME_COLORS.error },
  captchaContainer: { marginTop: SPACING.sm },
  captchaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: YOUME_COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: YOUME_COLORS.success,
  },
  captchaText: { color: YOUME_COLORS.success, fontSize: TYPOGRAPHY.size.md },
  captchaNote: { fontSize: TYPOGRAPHY.size.xs, color: YOUME_COLORS.textMuted, marginTop: 4 },
  loginButton: { marginTop: SPACING.md, borderRadius: BORDER_RADIUS.md },
  loginButtonContent: { height: 50 },
  loginButtonLabel: { fontSize: TYPOGRAPHY.size.md, fontWeight: '600' },
  forgotPassword: { alignSelf: 'center', marginTop: SPACING.md },
  forgotPasswordText: { color: YOUME_COLORS.primary, fontSize: TYPOGRAPHY.size.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,
    gap: SPACING.xs,
  },
  footerText: { color: YOUME_COLORS.textSecondary, fontSize: TYPOGRAPHY.size.md },
  registerLink: { color: YOUME_COLORS.primary, fontSize: TYPOGRAPHY.size.md, fontWeight: '600' },
});
