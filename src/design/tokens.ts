/**
 * Design System 2.0 Tokens for Wasla Link
 * Inspired by Linear, Framer, Talabat, and Noon.
 */

export const tokens = {
  colors: {
    // Primary / Brand Accents
    primary: {
      light: '#FF7A00', // Wasla Orange
      hover: '#E06B00',
      active: '#C25D00',
      glow: 'rgba(255, 122, 0, 0.15)',
    },
    // Surface Levels for Midnight/Dark/Light Modern look
    surfaces: {
      light: {
        bg: '#F8FAFC',       // Pure off-white
        card: '#FFFFFF',     // Clean white cards
        cardHover: '#F1F5F9',// Muted gray on hover
        border: '#E2E8F0',   // Thin slate borders
        borderHover: '#CBD5E1',
        text: '#0F172A',     // Deep slate text
        textMuted: '#64748B',// Cool gray muted text
        glow: 'rgba(255, 255, 255, 0.8)',
      },
      dark: {
        bg: '#080C14',       // Pitch deep void background
        card: '#111827',     // Solid dark grey cards (Gray-900)
        cardHover: '#1F2937',// Slightly lighter slate (Gray-800)
        border: '#1F2937',   // Slate borders
        borderHover: '#374151',
        text: '#F9FAFB',     // Clean near-white text
        textMuted: '#9CA3AF',// Soft silver gray
        glow: 'rgba(17, 24, 39, 0.85)',
      }
    },
    // Gradients
    gradients: {
      brand: 'linear-gradient(135deg, #FF9E46 0%, #FF7A00 100%)',
      brandHover: 'linear-gradient(135deg, #FFB066 0%, #E06B00 100%)',
      glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)',
      glassDark: 'linear-gradient(135deg, rgba(17, 24, 39, 0.6) 0%, rgba(17, 24, 39, 0.3) 100%)',
      success: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
      error: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
      premium: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', // Indigo glow
      golden: 'linear-gradient(135deg, #FCD34D 0%, #D97706 100%)', // Gold/Bronze tier
    },
    // Success/Warning/Error/Info System
    status: {
      success: {
        bg: 'rgba(16, 185, 129, 0.12)',
        text: '#10B981',
        border: 'rgba(16, 185, 129, 0.2)',
      },
      warning: {
        bg: 'rgba(245, 158, 11, 0.12)',
        text: '#F59E0B',
        border: 'rgba(245, 158, 11, 0.2)',
      },
      error: {
        bg: 'rgba(239, 68, 68, 0.12)',
        text: '#EF4444',
        border: 'rgba(239, 68, 68, 0.2)',
      },
      info: {
        bg: 'rgba(59, 130, 246, 0.12)',
        text: '#3B82F6',
        border: 'rgba(59, 130, 246, 0.2)',
      }
    }
  },
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    full: '9999px',
  },
  shadows: {
    soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 20px rgba(0, 0, 0, 0.08)',
    premium: '0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
    glow: '0 0 20px rgba(255, 122, 0, 0.2)',
    inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    glass: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
  },
  typography: {
    fontFamily: "'Outfit', 'Cairo', system-ui, -apple-system, sans-serif",
    sizes: {
      xs: '10px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '24px',
      heading: '32px',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    tracking: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      spring: '450ms',
    },
    timing: {
      easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth linear drop-in
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Soft spring bounce
      hover: 'ease-in-out',
    }
  },
  zIndex: {
    header: 50,
    overlay: 100,
    modal: 200,
    toast: 300,
  }
};

export type DesignTokens = typeof tokens;
