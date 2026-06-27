import { colors } from './colors';
import { shadows } from './shadows';
import { radius } from './radius';
import { motion } from './motion';

export const themes = {
  orange: {
    '--color-primary': colors.orange.primary,
    '--color-primary-hover': colors.orange.primaryHover,
    '--color-primary-glow': colors.orange.primaryGlow,
    '--color-secondary': colors.orange.secondary,
    '--color-accent': colors.orange.accent,
    '--color-accent-text': colors.orange.accentText,
    '--color-bg': colors.orange.bg,
    '--color-bg-card': colors.orange.bgCard,
    '--color-text': colors.orange.text,
    '--color-text-muted': colors.orange.textMuted,
    '--color-border': colors.orange.border,
    '--color-border-hover': colors.orange.borderHover,
    '--glass-bg': colors.orange.glassBg,
    '--glass-border': colors.orange.glassBorder,
    '--glass-shadow': colors.orange.glassShadow,
    
    // Shadows / Elevation System
    '--shadow-level-1': shadows.elevation1,
    '--shadow-level-2': shadows.elevation2,
    '--shadow-level-3': shadows.elevation3,
    '--shadow-level-4': shadows.elevation4,
    '--shadow-sm': shadows.sm,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--shadow-glass': shadows.glass,
    
    // Radius
    '--radius-xs': radius.xs,
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-xl': radius.xl,
    '--radius-xxl': radius.xxl,
    '--radius-full': radius.full,
    
    // Motion
    '--motion-duration-fast': motion.duration.fast,
    '--motion-duration-normal': motion.duration.normal,
    '--motion-duration-slow': motion.duration.slow,
    '--motion-timing-ease-out': motion.timing.easeOut,
    '--motion-timing-spring': motion.timing.spring
  },
  midnight: {
    '--color-primary': colors.midnight.primary,
    '--color-primary-hover': colors.midnight.primaryHover,
    '--color-primary-glow': colors.midnight.primaryGlow,
    '--color-secondary': colors.midnight.secondary,
    '--color-accent': colors.midnight.accent,
    '--color-accent-text': colors.midnight.accentText,
    '--color-bg': colors.midnight.bg,
    '--color-bg-card': colors.midnight.bgCard,
    '--color-text': colors.midnight.text,
    '--color-text-muted': colors.midnight.textMuted,
    '--color-border': colors.midnight.border,
    '--color-border-hover': colors.midnight.borderHover,
    '--glass-bg': colors.midnight.glassBg,
    '--glass-border': colors.midnight.glassBorder,
    '--glass-shadow': colors.midnight.glassShadow,
    
    // Shadows / Elevation System
    '--shadow-level-1': shadows.elevation1,
    '--shadow-level-2': shadows.elevation2,
    '--shadow-level-3': shadows.elevation3,
    '--shadow-level-4': shadows.elevation4,
    '--shadow-sm': shadows.sm,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--shadow-glass': shadows.glass,
    
    // Radius
    '--radius-xs': radius.xs,
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-xl': radius.xl,
    '--radius-xxl': radius.xxl,
    '--radius-full': radius.full,
    
    // Motion
    '--motion-duration-fast': motion.duration.fast,
    '--motion-duration-normal': motion.duration.normal,
    '--motion-duration-slow': motion.duration.slow,
    '--motion-timing-ease-out': motion.timing.easeOut,
    '--motion-timing-spring': motion.timing.spring
  },
  'purple-glass': {
    '--color-primary': colors.purpleGlass.primary,
    '--color-primary-hover': colors.purpleGlass.primaryHover,
    '--color-primary-glow': colors.purpleGlass.primaryGlow,
    '--color-secondary': colors.purpleGlass.secondary,
    '--color-accent': colors.purpleGlass.accent,
    '--color-accent-text': colors.purpleGlass.accentText,
    '--color-bg': colors.purpleGlass.bg,
    '--color-bg-card': colors.purpleGlass.bgCard,
    '--color-text': colors.purpleGlass.text,
    '--color-text-muted': colors.purpleGlass.textMuted,
    '--color-border': colors.purpleGlass.border,
    '--color-border-hover': colors.purpleGlass.borderHover,
    '--glass-bg': colors.purpleGlass.glassBg,
    '--glass-border': colors.purpleGlass.glassBorder,
    '--glass-shadow': colors.purpleGlass.glassShadow,
    
    // Shadows / Elevation System
    '--shadow-level-1': '0 4px 12px rgba(168, 85, 247, 0.1)',
    '--shadow-level-2': '0 8px 24px rgba(168, 85, 247, 0.15)',
    '--shadow-level-3': '0 16px 32px rgba(168, 85, 247, 0.2)',
    '--shadow-level-4': '0 24px 48px rgba(168, 85, 247, 0.25)',
    '--shadow-sm': shadows.sm,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--shadow-glass': '0 8px 32px 0 rgba(168, 85, 247, 0.2)',
    
    // Radius
    '--radius-xs': radius.xs,
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-xl': radius.xl,
    '--radius-xxl': radius.xxl,
    '--radius-full': radius.full,
    
    // Motion
    '--motion-duration-fast': motion.duration.fast,
    '--motion-duration-normal': motion.duration.normal,
    '--motion-duration-slow': motion.duration.slow,
    '--motion-timing-ease-out': motion.timing.easeOut,
    '--motion-timing-spring': motion.timing.spring
  }
};

export type ThemeName = 'orange' | 'midnight' | 'purple-glass';
