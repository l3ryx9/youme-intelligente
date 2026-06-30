/**
 * Validateurs Zod — Authentification
 * Validation de tous les formulaires d'authentification.
 */
import { z } from 'zod';

const USERNAME_REGEX = /^[a-zA-Z0-9_\.]{3,20}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])[A-Za-z\d@$!%*?&._\-]{8,}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  captchaToken: z
    .string()
    .min(1, 'Veuillez compléter le CAPTCHA'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(
      PASSWORD_REGEX,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
    ),
  confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  username: z
    .string()
    .min(3, 'Le username doit contenir au moins 3 caractères')
    .max(20, 'Le username ne peut pas dépasser 20 caractères')
    .regex(
      USERNAME_REGEX,
      'Le username ne peut contenir que des lettres, chiffres, points et underscores'
    ),
  displayName: z
    .string()
    .min(2, 'Le surnom doit contenir au moins 2 caractères')
    .max(50, 'Le surnom ne peut pas dépasser 50 caractères'),
  captchaToken: z
    .string()
    .min(1, 'Veuillez compléter le CAPTCHA'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Le mot de passe est requis'),
  confirmation: z
    .string()
    .refine((val) => val === 'SUPPRIMER', {
      message: 'Tapez SUPPRIMER pour confirmer',
    }),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Le surnom doit contenir au moins 2 caractères')
    .max(50, 'Le surnom ne peut pas dépasser 50 caractères'),
  bio: z.string().max(200, 'La bio ne peut pas dépasser 200 caractères').optional(),
});

/**
 * Calcule la force d'un mot de passe (0-100).
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[@$!%*?&._\-]/.test(password)) score += 20;
  if (password.length >= 16) score += 5;

  if (score < 30) return { score, label: 'Très faible', color: '#F44336' };
  if (score < 50) return { score, label: 'Faible', color: '#FF5722' };
  if (score < 70) return { score, label: 'Moyen', color: '#FF9800' };
  if (score < 90) return { score, label: 'Fort', color: '#8BC34A' };
  return { score, label: 'Très fort', color: '#4CAF50' };
}

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
