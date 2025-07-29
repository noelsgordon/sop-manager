/**
 * Cross-Platform Design System Exports
 * 
 * This file provides platform-specific exports of design tokens
 * to ensure consistency across web, mobile, and desktop platforms.
 */

import { designTokens } from '../tokens.js';

// ============================================================================
// WEB PLATFORM EXPORTS (Tailwind CSS)
// ============================================================================

export const webTokens = {
  // CSS Custom Properties for runtime theming
  cssVariables: designTokens.generateCSSVariables(),
  
  // Tailwind-compatible color palette
  colors: {
    primary: designTokens.colors.primary,
    secondary: designTokens.colors.secondary,
    success: designTokens.colors.success,
    warning: designTokens.colors.warning,
    error: designTokens.colors.error,
    neutral: designTokens.colors.neutral,
    semantic: designTokens.colors.semantic,
  },
  
  // Typography for web
  typography: {
    fontFamily: designTokens.typography.fontFamily,
    fontSize: designTokens.typography.fontSize,
    fontWeight: designTokens.typography.fontWeight,
    lineHeight: designTokens.typography.lineHeight,
    letterSpacing: designTokens.typography.letterSpacing,
  },
  
  // Spacing for web
  spacing: designTokens.spacing,
  
  // Border radius for web
  borderRadius: designTokens.borderRadius,
  
  // Animation for web
  animation: designTokens.animation,
  
  // Breakpoints for responsive design
  breakpoints: designTokens.breakpoints,
  
  // Z-index for layering
  zIndex: designTokens.zIndex,
};

// ============================================================================
// MOBILE PLATFORM EXPORTS (React Native)
// ============================================================================

export const mobileTokens = {
  // Colors for React Native (no hex values, use RGB)
  colors: {
    primary: {
      50: 'rgb(239, 246, 255)',
      100: 'rgb(219, 234, 254)',
      200: 'rgb(191, 219, 254)',
      300: 'rgb(147, 197, 253)',
      400: 'rgb(96, 165, 250)',
      500: 'rgb(59, 130, 246)', // Main brand blue
      600: 'rgb(37, 99, 235)',
      700: 'rgb(29, 78, 216)',
      800: 'rgb(30, 64, 175)',
      900: 'rgb(30, 58, 138)',
      950: 'rgb(23, 37, 84)',
    },
    secondary: {
      50: 'rgb(248, 250, 252)',
      100: 'rgb(241, 245, 249)',
      200: 'rgb(226, 232, 240)',
      300: 'rgb(203, 213, 225)',
      400: 'rgb(148, 163, 184)',
      500: 'rgb(100, 116, 139)',
      600: 'rgb(71, 85, 105)',
      700: 'rgb(51, 65, 85)',
      800: 'rgb(30, 41, 59)',
      900: 'rgb(15, 23, 42)',
      950: 'rgb(2, 6, 23)',
    },
    success: {
      50: 'rgb(240, 253, 244)',
      100: 'rgb(220, 252, 231)',
      200: 'rgb(187, 247, 208)',
      300: 'rgb(134, 239, 172)',
      400: 'rgb(74, 222, 128)',
      500: 'rgb(34, 197, 94)',
      600: 'rgb(22, 163, 74)',
      700: 'rgb(21, 128, 61)',
      800: 'rgb(22, 101, 52)',
      900: 'rgb(20, 83, 45)',
      950: 'rgb(5, 46, 22)',
    },
    warning: {
      50: 'rgb(255, 251, 235)',
      100: 'rgb(254, 243, 199)',
      200: 'rgb(253, 230, 138)',
      300: 'rgb(252, 211, 77)',
      400: 'rgb(251, 191, 36)',
      500: 'rgb(245, 158, 11)',
      600: 'rgb(217, 119, 6)',
      700: 'rgb(180, 83, 9)',
      800: 'rgb(146, 64, 14)',
      900: 'rgb(120, 53, 15)',
      950: 'rgb(69, 26, 3)',
    },
    error: {
      50: 'rgb(254, 242, 242)',
      100: 'rgb(254, 226, 226)',
      200: 'rgb(254, 202, 202)',
      300: 'rgb(252, 165, 165)',
      400: 'rgb(248, 113, 113)',
      500: 'rgb(239, 68, 68)',
      600: 'rgb(220, 38, 38)',
      700: 'rgb(185, 28, 28)',
      800: 'rgb(153, 27, 27)',
      900: 'rgb(127, 29, 29)',
      950: 'rgb(69, 10, 10)',
    },
    neutral: {
      50: 'rgb(250, 250, 250)',
      100: 'rgb(245, 245, 245)',
      200: 'rgb(229, 229, 229)',
      300: 'rgb(212, 212, 212)',
      400: 'rgb(163, 163, 163)',
      500: 'rgb(115, 115, 115)',
      600: 'rgb(82, 82, 82)',
      700: 'rgb(64, 64, 64)',
      800: 'rgb(38, 38, 38)',
      900: 'rgb(23, 23, 23)',
      950: 'rgb(10, 10, 10)',
    },
  },
  
  // Typography for React Native
  typography: {
    fontFamily: {
      sans: 'Inter',
      mono: 'JetBrainsMono',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  // Spacing for React Native (numbers instead of strings)
  spacing: {
    px: 1,
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
  },
  
  // Border radius for React Native
  borderRadius: {
    none: 0,
    sm: 2,
    base: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },
  
  // Shadows for React Native
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.1,
      shadowRadius: 25,
      elevation: 8,
    },
  },
};

// ============================================================================
// DESKTOP PLATFORM EXPORTS (Electron)
// ============================================================================

export const desktopTokens = {
  // Colors for desktop (same as web but with additional desktop-specific colors)
  colors: {
    ...designTokens.colors,
    // Desktop-specific colors
    desktop: {
      titlebar: designTokens.colors.neutral[800],
      sidebar: designTokens.colors.neutral[100],
      toolbar: designTokens.colors.neutral[50],
      statusbar: designTokens.colors.neutral[200],
    },
  },
  
  // Typography for desktop
  typography: designTokens.typography,
  
  // Spacing for desktop
  spacing: designTokens.spacing,
  
  // Border radius for desktop
  borderRadius: designTokens.borderRadius,
  
  // Animation for desktop
  animation: designTokens.animation,
  
  // Z-index for desktop (with desktop-specific layers)
  zIndex: {
    ...designTokens.zIndex,
    titlebar: 2000,
    sidebar: 1900,
    toolbar: 1800,
    statusbar: 1700,
  },
};

// ============================================================================
// UNIVERSAL UTILITIES
// ============================================================================

/**
 * Get platform-specific tokens
 * @param {string} platform - 'web', 'mobile', or 'desktop'
 * @returns {Object} - Platform-specific design tokens
 */
export function getPlatformTokens(platform) {
  switch (platform) {
    case 'web':
      return webTokens;
    case 'mobile':
      return mobileTokens;
    case 'desktop':
      return desktopTokens;
    default:
      return webTokens; // Default to web
  }
}

/**
 * Convert web tokens to mobile format
 * @param {Object} webTokens - Web design tokens
 * @returns {Object} - Mobile-compatible tokens
 */
export function convertToMobile(webTokens) {
  return {
    colors: Object.entries(webTokens.colors).reduce((acc, [category, shades]) => {
      acc[category] = Object.entries(shades).reduce((shadeAcc, [shade, value]) => {
        // Convert hex to RGB
        const hex = value.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        shadeAcc[shade] = `rgb(${r}, ${g}, ${b})`;
        return shadeAcc;
      }, {});
      return acc;
    }, {}),
    spacing: Object.entries(webTokens.spacing).reduce((acc, [key, value]) => {
      // Convert rem to pixels (assuming 16px base)
      const remValue = parseFloat(value.replace('rem', ''));
      acc[key] = Math.round(remValue * 16);
      return acc;
    }, {}),
    borderRadius: Object.entries(webTokens.borderRadius).reduce((acc, [key, value]) => {
      // Convert rem to pixels
      const remValue = parseFloat(value.replace('rem', ''));
      acc[key] = Math.round(remValue * 16);
      return acc;
    }, {}),
  };
}

/**
 * Export design tokens for external tools (Figma, Sketch, etc.)
 * @returns {Object} - JSON-compatible design tokens
 */
export function exportForDesignTools() {
  return {
    version: '1.0.0',
    name: 'SOP Manager Design System',
    tokens: {
      colors: designTokens.colors,
      typography: designTokens.typography,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      animation: designTokens.animation,
    },
    platforms: {
      web: webTokens,
      mobile: mobileTokens,
      desktop: desktopTokens,
    },
  };
}

/**
 * Generate CSS custom properties for runtime theming
 * @returns {string} - CSS custom properties
 */
export function generateCSSVariables() {
  return designTokens.generateCSSVariables();
}

/**
 * Validate design tokens across platforms
 * @returns {Object} - Validation results
 */
export function validateTokens() {
  const results = {
    web: true,
    mobile: true,
    desktop: true,
    errors: [],
  };

  // Validate color consistency
  const webColors = Object.keys(webTokens.colors);
  const mobileColors = Object.keys(mobileTokens.colors);
  const desktopColors = Object.keys(desktopTokens.colors);

  if (webColors.length !== mobileColors.length) {
    results.errors.push('Color count mismatch between web and mobile');
    results.mobile = false;
  }

  if (webColors.length !== desktopColors.length) {
    results.errors.push('Color count mismatch between web and desktop');
    results.desktop = false;
  }

  return results;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  web: webTokens,
  mobile: mobileTokens,
  desktop: desktopTokens,
  universal: designTokens,
  getPlatformTokens,
  convertToMobile,
  exportForDesignTools,
  generateCSSVariables,
  validateTokens,
}; 