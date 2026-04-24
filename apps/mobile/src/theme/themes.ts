export type ThemeMode = 'light' | 'dark'
export type ThemePreference = ThemeMode | 'system'

type ColorPalette = {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  neutral0: string
  neutral50: string
  neutral100: string
  neutral200: string
  neutral300: string
  neutral400: string
  neutral500: string
  neutral700: string
  neutral900: string
}

type TypographyScale = {
  display: number
  h1: number
  h2: number
  h3: number
  bodyLg: number
  body: number
  bodySm: number
  caption: number
}

export type AppTheme = {
  palette: ColorPalette
  colors: {
    screenBackground: string
    surfacePrimary: string
    surfaceSecondary: string
    surfaceAttention: string
    textOnAttention: string
    textAttentionMuted: string
    textPrimary: string
    textSecondary: string
    textMuted: string
    textOnPrimaryButton: string
    buttonPrimaryBackground: string
    buttonPrimaryDisabled: string
    buttonSecondaryBackground: string
    borderPrimary: string
    feedbackError: string
    feedbackSuccess: string
    feedbackWarning: string
    borderSubtle: string
    tabActive: string
    tabInactive: string
  }
  spacing: {
    xxs: number
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
  radius: {
    sm: number
    md: number
    lg: number
    xl: number
    pill: number
  }
  typography: {
    size: TypographyScale
    weight: {
      regular: '400'
      medium: '500'
      semibold: '600'
      bold: '700'
    }
    lineHeight: {
      compact: number
      normal: number
      relaxed: number
    }
  }
}

export const lightTheme: AppTheme = {
  palette: {
    primary: '#2563eb',
    secondary: '#0f172a',
    accent: '#fde047',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    neutral0: '#ffffff',
    neutral50: '#f8fafc',
    neutral100: '#f1f5f9',
    neutral200: '#e2e8f0',
    neutral300: '#cbd5e1',
    neutral400: '#94a3b8',
    neutral500: '#64748b',
    neutral700: '#334155',
    neutral900: '#0f172a',
  },
  colors: {
    screenBackground: '#f8fafc',
    surfacePrimary: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    surfaceAttention: '#fde047',
    textOnAttention: '#111827',
    textAttentionMuted: '#78350f',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    textOnPrimaryButton: '#ffffff',
    buttonPrimaryBackground: '#0f172a',
    buttonPrimaryDisabled: '#475569',
    buttonSecondaryBackground: '#ffffff',
    borderPrimary: '#cbd5e1',
    feedbackError: '#dc2626',
    feedbackSuccess: '#16a34a',
    feedbackWarning: '#d97706',
    borderSubtle: '#e2e8f0',
    tabActive: '#2563eb',
    tabInactive: '#64748b',
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  typography: {
    size: {
      display: 30,
      h1: 24,
      h2: 20,
      h3: 18,
      bodyLg: 16,
      body: 14,
      bodySm: 13,
      caption: 12,
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      compact: 18,
      normal: 20,
      relaxed: 24,
    },
  },
}

export const darkTheme: AppTheme = {
  palette: {
    primary: '#60a5fa',
    secondary: '#f8fafc',
    accent: '#facc15',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    neutral0: '#020617',
    neutral50: '#0f172a',
    neutral100: '#111827',
    neutral200: '#1e293b',
    neutral300: '#334155',
    neutral400: '#64748b',
    neutral500: '#94a3b8',
    neutral700: '#cbd5e1',
    neutral900: '#f8fafc',
  },
  colors: {
    screenBackground: '#0f172a',
    surfacePrimary: '#111827',
    surfaceSecondary: '#1e293b',
    surfaceAttention: '#facc15',
    textOnAttention: '#111827',
    textAttentionMuted: '#422006',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    textOnPrimaryButton: '#ffffff',
    buttonPrimaryBackground: '#111827',
    buttonPrimaryDisabled: '#334155',
    buttonSecondaryBackground: '#1e293b',
    borderPrimary: '#334155',
    feedbackError: '#f87171',
    feedbackSuccess: '#4ade80',
    feedbackWarning: '#fbbf24',
    borderSubtle: '#1e293b',
    tabActive: '#60a5fa',
    tabInactive: '#94a3b8',
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  typography: {
    size: {
      display: 30,
      h1: 24,
      h2: 20,
      h3: 18,
      bodyLg: 16,
      body: 14,
      bodySm: 13,
      caption: 12,
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      compact: 18,
      normal: 20,
      relaxed: 24,
    },
  },
}
