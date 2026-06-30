/**
 * Tests Unitaires — Validateurs d'authentification
 */
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  getPasswordStrength,
} from '../../../src/shared/validators/authValidators';

describe('loginSchema', () => {
  it('valide des identifiants corrects', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'Password123!',
      captchaToken: 'token123',
    });
    expect(result.success).toBe(true);
  });

  it('rejette un email invalide', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'Password123!',
      captchaToken: 'token123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('email');
  });

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
      captchaToken: 'token123',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe trop court', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '1234567',
      captchaToken: 'token123',
    });
    expect(result.success).toBe(false);
  });

  it('rejette sans captcha token', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'Password123!',
      captchaToken: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const validData = {
    email: 'test@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    username: 'testuser',
    displayName: 'Test User',
    captchaToken: 'token123',
  };

  it('valide des données d\'inscription correctes', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejette quand les mots de passe ne correspondent pas', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPassword123!',
    });
    expect(result.success).toBe(false);
    const error = result.error?.issues.find((i) => i.path[0] === 'confirmPassword');
    expect(error).toBeDefined();
  });

  it('rejette un username trop court', () => {
    const result = registerSchema.safeParse({ ...validData, username: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejette un username avec des caractères invalides', () => {
    const result = registerSchema.safeParse({ ...validData, username: 'test user!' });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe sans majuscule', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'password123!',
      confirmPassword: 'password123!',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un mot de passe sans caractère spécial', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un displayName vide', () => {
    const result = registerSchema.safeParse({ ...validData, displayName: 'A' });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('valide un email correct', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'test@example.com' }).success).toBe(true);
  });

  it('rejette un email invalide', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'invalid' }).success).toBe(false);
  });
});

describe('getPasswordStrength', () => {
  it('retourne "Très faible" pour un mot de passe simple', () => {
    const result = getPasswordStrength('abc');
    expect(result.score).toBeLessThan(30);
    expect(result.label).toBe('Très faible');
  });

  it('retourne "Fort" pour un bon mot de passe', () => {
    const result = getPasswordStrength('Password123!');
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('retourne "Très fort" pour un mot de passe excellent', () => {
    const result = getPasswordStrength('V3ryStr0ng&SecureP@ssw0rd!');
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.label).toBe('Très fort');
  });
});
