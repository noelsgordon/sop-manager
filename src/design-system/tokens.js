/**
 * SOP Manager Design System - Centralized Design Tokens
 * 
 * This file serves as the single source of truth for all design values.
 * Changes here will automatically propagate across all platforms.
 * 
 * Last Updated: December 2024
 * Version: 1.0
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Semantic Colors
  semantic: {
    background: '#ffffff',
    surface: '#f8fafc',
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
    },
    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
      dark: '#94a3b8',
    },
    shadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
  },
};

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },

  // Font Sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  // Base spacing units
  px: '1px',
  0: '0px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

// ============================================================================
// BORDER RADIUS SYSTEM
// ============================================================================

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// ============================================================================
// ANIMATION SYSTEM
// ============================================================================

export const animation = {
  // Duration
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Easing
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Transitions
  transition: {
    all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 300ms cubic-bezier(0.4, 0, 0.2, 1), fill 300ms cubic-bezier(0.4, 0, 0.2, 1), stroke 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================================================
// BREAKPOINTS SYSTEM
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// Z-INDEX SYSTEM
// ============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  // Button variants
  button: {
    variants: {
      primary: {
        background: colors.primary[500],
        color: colors.semantic.text.inverse,
        hover: {
          background: colors.primary[600],
        },
        active: {
          background: colors.primary[700],
        },
        disabled: {
          background: colors.neutral[300],
          color: colors.neutral[500],
        },
      },
      secondary: {
        background: colors.semantic.surface,
        color: colors.semantic.text.primary,
        border: `1px solid ${colors.semantic.border.medium}`,
        hover: {
          background: colors.neutral[50],
        },
      },
      danger: {
        background: colors.error[500],
        color: colors.semantic.text.inverse,
        hover: {
          background: colors.error[600],
        },
      },
    },
    sizes: {
      sm: {
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSize.sm,
      },
      md: {
        padding: `${spacing[3]} ${spacing[4]}`,
        fontSize: typography.fontSize.base,
      },
      lg: {
        padding: `${spacing[4]} ${spacing[6]}`,
        fontSize: typography.fontSize.lg,
      },
    },
  },

  // Input variants
  input: {
    border: `1px solid ${colors.semantic.border.medium}`,
    borderRadius: borderRadius.md,
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    focus: {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
    error: {
      borderColor: colors.error[500],
      boxShadow: `0 0 0 3px ${colors.error[100]}`,
    },
  },

  // Card variants
  card: {
    background: colors.semantic.background,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    boxShadow: colors.semantic.shadow.md,
    border: `1px solid ${colors.semantic.border.light}`,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a color value with opacity
 * @param {string} color - The color key (e.g., 'primary.500')
 * @param {number} opacity - The opacity value (0-1)
 * @returns {string} - CSS color with opacity
 */
export function getColorWithOpacity(color, opacity) {
  const colorPath = color.split('.');
  let colorValue = colors;
  
  for (const key of colorPath) {
    colorValue = colorValue[key];
  }
  
  // Convert hex to rgba
  const hex = colorValue.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get a responsive value
 * @param {Object} values - Object with breakpoint keys
 * @returns {string} - CSS custom property or responsive class
 */
export function getResponsiveValue(values) {
  return Object.entries(values)
    .map(([breakpoint, value]) => {
      if (breakpoint === 'base') return value;
      return `${breakpoint}:${value}`;
    })
    .join(' ');
}

/**
 * Generate CSS custom properties for design tokens
 * @returns {string} - CSS custom properties
 */
export function generateCSSVariables() {
  // Temporarily disabled to fix build issues
  return ':root {\n  /* CSS variables temporarily disabled */\n}';
  
  /*
  const variables = [];
  
  // Color variables
  Object.entries(colors).forEach(([category, shades]) => {
    if (typeof shades === 'object') {
      Object.entries(shades).forEach(([shade, value]) => {
        variables.push(`--color-${category}-${shade}: ${value};`);
      });
    } else {
      variables.push(`--color-${category}: ${shades};`);
    }
  });
  
  // Spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    variables.push(`--spacing-${key}: ${value};`);
  });
  
  // Border radius variables
  Object.entries(borderRadius).forEach(([key, value]) => {
    variables.push(`--radius-${key}: ${value};`);
  });
  
  return `:root {\n  ${variables.join('\n  ')}\n}`;
  */
}

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  animation,
  breakpoints,
  zIndex,
  components,
  getColorWithOpacity,
  getResponsiveValue,
  generateCSSVariables,
};

export default designTokens; 