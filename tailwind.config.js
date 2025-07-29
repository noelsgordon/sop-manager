/** @type {import('tailwindcss').Config} */
import { designTokens } from './src/design-system/tokens.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      // Colors from design tokens
      colors: {
        primary: designTokens.colors.primary,
        secondary: designTokens.colors.secondary,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        error: designTokens.colors.error,
        neutral: designTokens.colors.neutral,
        semantic: designTokens.colors.semantic,
      },
      
      // Typography from design tokens
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      lineHeight: designTokens.typography.lineHeight,
      letterSpacing: designTokens.typography.letterSpacing,
      
      // Spacing from design tokens
      spacing: designTokens.spacing,
      
      // Border radius from design tokens
      borderRadius: designTokens.borderRadius,
      
      // Animation from design tokens
      transitionDuration: designTokens.animation.duration,
      transitionTimingFunction: designTokens.animation.easing,
      
      // Breakpoints from design tokens
      screens: designTokens.breakpoints,
      
      // Z-index from design tokens
      zIndex: designTokens.zIndex,
      
      // Custom CSS variables for design tokens
      extend: {
        '--color-primary': designTokens.colors.primary[500],
        '--color-secondary': designTokens.colors.secondary[500],
        '--color-success': designTokens.colors.success[500],
        '--color-warning': designTokens.colors.warning[500],
        '--color-error': designTokens.colors.error[500],
        '--color-neutral': designTokens.colors.neutral[500],
      },
    },
  },
  plugins: [
    // Custom plugin to generate CSS variables
    function({ addBase }) {
      addBase({
        ':root': {
          // Generate all CSS custom properties from design tokens
          ...Object.entries(designTokens.colors).reduce((acc, [category, shades]) => {
            if (typeof shades === 'object') {
              Object.entries(shades).forEach(([shade, value]) => {
                acc[`--color-${category}-${shade}`] = value;
              });
            } else {
              acc[`--color-${category}`] = shades;
            }
            return acc;
          }, {}),
          
          // Spacing variables
          ...Object.entries(designTokens.spacing).reduce((acc, [key, value]) => {
            acc[`--spacing-${key}`] = value;
            return acc;
          }, {}),
          
          // Border radius variables
          ...Object.entries(designTokens.borderRadius).reduce((acc, [key, value]) => {
            acc[`--radius-${key}`] = value;
            return acc;
          }, {}),
          
          // Typography variables
          '--font-family-sans': designTokens.typography.fontFamily.sans.join(', '),
          '--font-family-mono': designTokens.typography.fontFamily.mono.join(', '),
        },
      });
    },
  ],
};
