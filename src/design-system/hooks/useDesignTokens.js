/**
 * Design System Hook
 * 
 * Provides easy access to design tokens and ensures consistent usage
 * across all components in the SOP Manager platform.
 */

import { useMemo } from 'react';
import { designTokens } from '../tokens.js';
import { getPlatformTokens, convertToMobile } from '../platforms/index.js';

/**
 * Hook for accessing design tokens
 * @param {string} platform - 'web', 'mobile', or 'desktop'
 * @returns {Object} - Design tokens and utilities
 */
export function useDesignTokens(platform = 'web') {
  return useMemo(() => {
    const tokens = getPlatformTokens(platform);
    
    return {
      // Platform-specific tokens
      colors: tokens.colors,
      typography: tokens.typography,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      animation: tokens.animation,
      breakpoints: tokens.breakpoints,
      zIndex: tokens.zIndex,
      
      // Utility functions
      getColor: (colorPath) => {
        const path = colorPath.split('.');
        let value = tokens.colors;
        for (const key of path) {
          value = value[key];
        }
        return value;
      },
      
      getSpacing: (size) => {
        return tokens.spacing[size] || size;
      },
      
      getBorderRadius: (size) => {
        return tokens.borderRadius[size] || size;
      },
      
      getTypography: (variant) => {
        return tokens.typography[variant] || {};
      },
      
      // Platform detection
      platform,
      
      // Conversion utilities
      convertToMobile: () => convertToMobile(tokens),
      
      // Validation
      validate: () => {
        // Basic validation
        const errors = [];
        
        if (!tokens.colors) errors.push('Colors not found');
        if (!tokens.typography) errors.push('Typography not found');
        if (!tokens.spacing) errors.push('Spacing not found');
        
        return {
          isValid: errors.length === 0,
          errors,
        };
      },
    };
  }, [platform]);
}

/**
 * Hook for theme management
 * @returns {Object} - Theme utilities
 */
export function useTheme() {
  return useMemo(() => {
    return {
      // Get current theme
      getTheme: () => {
        // Check for user preference
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('sop-theme');
          if (saved) return saved;
          
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          return prefersDark ? 'dark' : 'light';
        }
        return 'light';
      },
      
      // Set theme
      setTheme: (theme) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sop-theme', theme);
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
      
      // Toggle theme
      toggleTheme: () => {
        const current = this.getTheme();
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
      },
      
      // Theme-aware color getter
      getThemeColor: (colorPath, theme = 'light') => {
        const tokens = getPlatformTokens('web');
        const baseColor = tokens.getColor(colorPath);
        
        if (theme === 'dark') {
          // Convert to dark variant
          return designTokens.getColorWithOpacity(baseColor, 0.8);
        }
        
        return baseColor;
      },
    };
  }, []);
}

/**
 * Hook for responsive design
 * @returns {Object} - Responsive utilities
 */
export function useResponsive() {
  return useMemo(() => {
    return {
      // Breakpoint utilities
      breakpoints: designTokens.breakpoints,
      
      // Responsive class generator
      getResponsiveClass: (baseClass, responsiveClasses) => {
        const classes = [baseClass];
        
        Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
          classes.push(`${breakpoint}:${className}`);
        });
        
        return classes.join(' ');
      },
      
      // Responsive value getter
      getResponsiveValue: (values) => {
        return designTokens.getResponsiveValue(values);
      },
      
      // Screen size detection
      getScreenSize: () => {
        if (typeof window === 'undefined') return 'lg';
        
        const width = window.innerWidth;
        const { breakpoints } = designTokens;
        
        if (width >= parseInt(breakpoints['2xl'])) return '2xl';
        if (width >= parseInt(breakpoints.xl)) return 'xl';
        if (width >= parseInt(breakpoints.lg)) return 'lg';
        if (width >= parseInt(breakpoints.md)) return 'md';
        if (width >= parseInt(breakpoints.sm)) return 'sm';
        return 'xs';
      },
      
      // Responsive spacing
      getResponsiveSpacing: (sizes) => {
        const tokens = getPlatformTokens('web');
        return Object.entries(sizes).reduce((acc, [breakpoint, size]) => {
          acc[breakpoint] = tokens.spacing[size] || size;
          return acc;
        }, {});
      },
    };
  }, []);
}

/**
 * Hook for component styling
 * @param {string} component - Component name
 * @param {string} variant - Component variant
 * @param {string} size - Component size
 * @returns {Object} - Component styles
 */
export function useComponentStyles(component, variant = 'default', size = 'md') {
  return useMemo(() => {
    const tokens = designTokens.components[component];
    
    if (!tokens) {
      console.warn(`Component styles not found for: ${component}`);
      return {};
    }
    
    const variantStyles = tokens.variants?.[variant] || {};
    const sizeStyles = tokens.sizes?.[size] || {};
    
    return {
      ...variantStyles,
      ...sizeStyles,
      
      // Generate CSS classes
      getClasses: () => {
        const classes = [];
        
        // Add variant classes
        if (variantStyles.background) {
          classes.push(`bg-${component}-${variant}`);
        }
        if (variantStyles.color) {
          classes.push(`text-${component}-${variant}`);
        }
        if (variantStyles.border) {
          classes.push(`border-${component}-${variant}`);
        }
        
        // Add size classes
        if (sizeStyles.padding) {
          classes.push(`p-${size}`);
        }
        if (sizeStyles.fontSize) {
          classes.push(`text-${sizeStyles.fontSize}`);
        }
        
        return classes.join(' ');
      },
      
      // Generate inline styles
      getStyles: () => {
        return {
          ...variantStyles,
          ...sizeStyles,
        };
      },
    };
  }, [component, variant, size]);
}

/**
 * Hook for animation utilities
 * @returns {Object} - Animation utilities
 */
export function useAnimation() {
  return useMemo(() => {
    return {
      // Animation durations
      duration: designTokens.animation.duration,
      
      // Animation easing
      easing: designTokens.animation.easing,
      
      // Transition utilities
      transition: designTokens.animation.transition,
      
      // Generate transition class
      getTransitionClass: (properties = 'all') => {
        const duration = designTokens.animation.duration.normal;
        const easing = designTokens.animation.easing.inOut;
        return `${properties} ${duration} ${easing}`;
      },
      
      // Animation variants
      variants: {
        fadeIn: {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3 },
        },
        slideIn: {
          initial: { x: -20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { duration: 0.3 },
        },
        scaleIn: {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { duration: 0.2 },
        },
      },
    };
  }, []);
}

/**
 * Hook for accessibility utilities
 * @returns {Object} - Accessibility utilities
 */
export function useAccessibility() {
  return useMemo(() => {
    return {
      // Focus styles
      getFocusStyles: () => ({
        outline: 'none',
        boxShadow: `0 0 0 3px ${designTokens.colors.primary[100]}`,
        borderColor: designTokens.colors.primary[500],
      }),
      
      // Screen reader only
      srOnly: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      },
      
      // High contrast mode
      getHighContrastStyles: () => ({
        backgroundColor: designTokens.colors.neutral[900],
        color: designTokens.colors.neutral[50],
        borderColor: designTokens.colors.neutral[700],
      }),
      
      // Reduced motion
      getReducedMotionStyles: () => ({
        transition: 'none',
        animation: 'none',
      }),
    };
  }, []);
}

// Export all hooks (no duplicates)
export default {
  useDesignTokens,
  useTheme,
  useResponsive,
  useComponentStyles,
  useAnimation,
  useAccessibility,
}; 