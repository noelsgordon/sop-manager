/**
 * Design System Export Script
 * 
 * Exports design tokens for external tools (Figma, Sketch, etc.)
 * and generates platform-specific files for consistency.
 */

import { designTokens } from './tokens.js';
import { exportForDesignTools, validateTokens } from './platforms/index.js';
import fs from 'fs';
import path from 'path';

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export design tokens as JSON for external tools
 * @param {string} outputPath - Output file path
 */
export function exportDesignTokens(outputPath = './design-tokens.json') {
  try {
    const tokens = exportForDesignTools();
    fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
    console.log(`✅ Design tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting design tokens:', error);
  }
}

/**
 * Export CSS custom properties
 * @param {string} outputPath - Output file path
 */
export function exportCSSVariables(outputPath = './css-variables.css') {
  try {
    const cssVariables = designTokens.generateCSSVariables();
    fs.writeFileSync(outputPath, cssVariables);
    console.log(`✅ CSS variables exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting CSS variables:', error);
  }
}

/**
 * Export for React Native (styled-components)
 * @param {string} outputPath - Output file path
 */
export async function exportForReactNative(outputPath = './react-native-tokens.js') {
  try {
    const { mobileTokens } = await import('./platforms/index.js');
    
    const content = `/**
 * React Native Design Tokens
 * Auto-generated from SOP Manager Design System
 */

export const colors = ${JSON.stringify(mobileTokens.colors, null, 2)};

export const typography = ${JSON.stringify(mobileTokens.typography, null, 2)};

export const spacing = ${JSON.stringify(mobileTokens.spacing, null, 2)};

export const borderRadius = ${JSON.stringify(mobileTokens.borderRadius, null, 2)};

export const shadows = ${JSON.stringify(mobileTokens.shadows, null, 2)};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ React Native tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting React Native tokens:', error);
  }
}

/**
 * Export for Electron (desktop app)
 * @param {string} outputPath - Output file path
 */
export async function exportForElectron(outputPath = './electron-tokens.js') {
  try {
    const { desktopTokens } = await import('./platforms/index.js');
    
    const content = `/**
 * Electron Design Tokens
 * Auto-generated from SOP Manager Design System
 */

export const colors = ${JSON.stringify(desktopTokens.colors, null, 2)};

export const typography = ${JSON.stringify(desktopTokens.typography, null, 2)};

export const spacing = ${JSON.stringify(desktopTokens.spacing, null, 2)};

export const borderRadius = ${JSON.stringify(desktopTokens.borderRadius, null, 2)};

export const animation = ${JSON.stringify(desktopTokens.animation, null, 2)};

export const zIndex = ${JSON.stringify(desktopTokens.zIndex, null, 2)};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  animation,
  zIndex,
};
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ Electron tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting Electron tokens:', error);
  }
}

/**
 * Export for Figma plugin
 * @param {string} outputPath - Output file path
 */
export function exportForFigma(outputPath = './figma-tokens.json') {
  try {
    const figmaTokens = {
      version: '1.0.0',
      name: 'SOP Manager Design System',
      tokens: {
        colors: designTokens.colors,
        typography: designTokens.typography,
        spacing: designTokens.spacing,
        borderRadius: designTokens.borderRadius,
      },
      metadata: {
        description: 'SOP Manager Design System for Figma',
        author: 'SOP Manager Team',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
      },
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(figmaTokens, null, 2));
    console.log(`✅ Figma tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting Figma tokens:', error);
  }
}

/**
 * Export for Sketch
 * @param {string} outputPath - Output file path
 */
export function exportForSketch(outputPath = './sketch-tokens.json') {
  try {
    const sketchTokens = {
      colors: Object.entries(designTokens.colors).reduce((acc, [category, shades]) => {
        acc[category] = Object.entries(shades).reduce((shadeAcc, [shade, value]) => {
          // Convert hex to RGB for Sketch
          const hex = value.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16) / 255;
          const g = parseInt(hex.substr(2, 2), 16) / 255;
          const b = parseInt(hex.substr(4, 2), 16) / 255;
          shadeAcc[shade] = { r, g, b, a: 1 };
          return shadeAcc;
        }, {});
        return acc;
      }, {}),
      typography: designTokens.typography,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(sketchTokens, null, 2));
    console.log(`✅ Sketch tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting Sketch tokens:', error);
  }
}

/**
 * Export for Adobe XD
 * @param {string} outputPath - Output file path
 */
export function exportForAdobeXD(outputPath = './adobe-xd-tokens.json') {
  try {
    const xdTokens = {
      colors: Object.entries(designTokens.colors).reduce((acc, [category, shades]) => {
        acc[category] = Object.entries(shades).reduce((shadeAcc, [shade, value]) => {
          // Convert hex to RGB for Adobe XD
          const hex = value.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          shadeAcc[shade] = { r, g, b };
          return shadeAcc;
        }, {});
        return acc;
      }, {}),
      typography: designTokens.typography,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(xdTokens, null, 2));
    console.log(`✅ Adobe XD tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting Adobe XD tokens:', error);
  }
}

/**
 * Export for Tailwind CSS config
 * @param {string} outputPath - Output file path
 */
export function exportForTailwind(outputPath = './tailwind-tokens.js') {
  try {
    const content = `/**
 * Tailwind CSS Design Tokens
 * Auto-generated from SOP Manager Design System
 */

export default {
  colors: ${JSON.stringify(designTokens.colors, null, 2)},
  fontFamily: ${JSON.stringify(designTokens.typography.fontFamily, null, 2)},
  fontSize: ${JSON.stringify(designTokens.typography.fontSize, null, 2)},
  fontWeight: ${JSON.stringify(designTokens.typography.fontWeight, null, 2)},
  lineHeight: ${JSON.stringify(designTokens.typography.lineHeight, null, 2)},
  letterSpacing: ${JSON.stringify(designTokens.typography.letterSpacing, null, 2)},
  spacing: ${JSON.stringify(designTokens.spacing, null, 2)},
  borderRadius: ${JSON.stringify(designTokens.borderRadius, null, 2)},
  animation: ${JSON.stringify(designTokens.animation, null, 2)},
  screens: ${JSON.stringify(designTokens.breakpoints, null, 2)},
  zIndex: ${JSON.stringify(designTokens.zIndex, null, 2)},
};
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ Tailwind tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting Tailwind tokens:', error);
  }
}

/**
 * Export for CSS-in-JS (styled-components, emotion)
 * @param {string} outputPath - Output file path
 */
export function exportForCSSInJS(outputPath = './css-in-js-tokens.js') {
  try {
    const content = `/**
 * CSS-in-JS Design Tokens
 * Auto-generated from SOP Manager Design System
 */

export const colors = ${JSON.stringify(designTokens.colors, null, 2)};

export const typography = ${JSON.stringify(designTokens.typography, null, 2)};

export const spacing = ${JSON.stringify(designTokens.spacing, null, 2)};

export const borderRadius = ${JSON.stringify(designTokens.borderRadius, null, 2)};

export const animation = ${JSON.stringify(designTokens.animation, null, 2)};

export const breakpoints = ${JSON.stringify(designTokens.breakpoints, null, 2)};

export const zIndex = ${JSON.stringify(designTokens.zIndex, null, 2)};

// Utility functions
export const getColor = (colorPath) => {
  const path = colorPath.split('.');
  let value = colors;
  for (const key of path) {
    value = value[key];
  }
  return value;
};

export const getSpacing = (size) => {
  return spacing[size] || size;
};

export const getBorderRadius = (size) => {
  return borderRadius[size] || size;
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  animation,
  breakpoints,
  zIndex,
  getColor,
  getSpacing,
  getBorderRadius,
};
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ CSS-in-JS tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting CSS-in-JS tokens:', error);
  }
}

/**
 * Export for Storybook
 * @param {string} outputPath - Output file path
 */
export function exportForStorybook(outputPath = './storybook-tokens.js') {
  try {
    const content = `/**
 * Storybook Design Tokens
 * Auto-generated from SOP Manager Design System
 */

export const designTokens = ${JSON.stringify(designTokens, null, 2)};

export const colorPalette = {
  primary: Object.entries(designTokens.colors.primary).map(([key, value]) => ({
    name: \`primary-\${key}\`,
    value,
    category: 'primary',
  })),
  secondary: Object.entries(designTokens.colors.secondary).map(([key, value]) => ({
    name: \`secondary-\${key}\`,
    value,
    category: 'secondary',
  })),
  success: Object.entries(designTokens.colors.success).map(([key, value]) => ({
    name: \`success-\${key}\`,
    value,
    category: 'success',
  })),
  warning: Object.entries(designTokens.colors.warning).map(([key, value]) => ({
    name: \`warning-\${key}\`,
    value,
    category: 'warning',
  })),
  error: Object.entries(designTokens.colors.error).map(([key, value]) => ({
    name: \`error-\${key}\`,
    value,
    category: 'error',
  })),
  neutral: Object.entries(designTokens.colors.neutral).map(([key, value]) => ({
    name: \`neutral-\${key}\`,
    value,
    category: 'neutral',
  })),
};

export const typographyScale = Object.entries(designTokens.typography.fontSize).map(([key, value]) => ({
  name: key,
  value,
  category: 'typography',
}));

export const spacingScale = Object.entries(designTokens.spacing).map(([key, value]) => ({
  name: key,
  value,
  category: 'spacing',
}));

export const borderRadiusScale = Object.entries(designTokens.borderRadius).map(([key, value]) => ({
  name: key,
  value,
  category: 'borderRadius',
}));

export default {
  designTokens,
  colorPalette,
  typographyScale,
  spacingScale,
  borderRadiusScale,
};
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ Storybook tokens exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting Storybook tokens:', error);
  }
}

/**
 * Export for documentation
 * @param {string} outputPath - Output file path
 */
export function exportForDocumentation(outputPath = './design-system-docs.md') {
  try {
    const content = `# SOP Manager Design System Documentation

## Colors

### Primary Colors
${Object.entries(designTokens.colors.primary).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

### Secondary Colors
${Object.entries(designTokens.colors.secondary).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

### Success Colors
${Object.entries(designTokens.colors.success).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

### Warning Colors
${Object.entries(designTokens.colors.warning).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

### Error Colors
${Object.entries(designTokens.colors.error).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

### Neutral Colors
${Object.entries(designTokens.colors.neutral).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

## Typography

### Font Sizes
${Object.entries(designTokens.typography.fontSize).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

### Font Weights
${Object.entries(designTokens.typography.fontWeight).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

### Line Heights
${Object.entries(designTokens.typography.lineHeight).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

## Spacing

${Object.entries(designTokens.spacing).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

## Border Radius

${Object.entries(designTokens.borderRadius).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

## Animation

### Durations
${Object.entries(designTokens.animation.duration).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

### Easing
${Object.entries(designTokens.animation.easing).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

## Breakpoints

${Object.entries(designTokens.breakpoints).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

## Z-Index

${Object.entries(designTokens.zIndex).map(([key, value]) => `- \`${key}\`: \`${value}\``).join('\n')}

---

*Generated on ${new Date().toISOString()}*
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ Documentation exported to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting documentation:', error);
  }
}

/**
 * Validate all design tokens
 */
export function validateDesignTokens() {
  try {
    const validation = validateTokens();
    
    if (validation.errors.length > 0) {
      console.error('❌ Design token validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      return false;
    }
    
    console.log('✅ Design tokens validation passed');
    return true;
  } catch (error) {
    console.error('❌ Error validating design tokens:', error);
    return false;
  }
}

/**
 * Export all formats
 * @param {string} outputDir - Output directory
 */
export async function exportAllFormats(outputDir = './design-system-exports') {
  try {
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log('🚀 Exporting design system to all formats...');
    
    // Export all formats
    await exportDesignTokens(path.join(outputDir, 'design-tokens.json'));
    await exportCSSVariables(path.join(outputDir, 'css-variables.css'));
    await exportForReactNative(path.join(outputDir, 'react-native-tokens.js'));
    await exportForElectron(path.join(outputDir, 'electron-tokens.js'));
    await exportForFigma(path.join(outputDir, 'figma-tokens.json'));
    await exportForSketch(path.join(outputDir, 'sketch-tokens.json'));
    await exportForAdobeXD(path.join(outputDir, 'adobe-xd-tokens.json'));
    await exportForTailwind(path.join(outputDir, 'tailwind-tokens.js'));
    await exportForCSSInJS(path.join(outputDir, 'css-in-js-tokens.js'));
    await exportForStorybook(path.join(outputDir, 'storybook-tokens.js'));
    await exportForDocumentation(path.join(outputDir, 'design-system-docs.md'));
    
    // Validate tokens
    const isValid = validateDesignTokens();
    
    console.log('✅ All exports completed successfully!');
    console.log(`📁 Files saved to: ${outputDir}`);
    
    return isValid;
  } catch (error) {
    console.error('❌ Error exporting design system:', error);
    return false;
  }
}

// ============================================================================
// CLI SUPPORT
// ============================================================================

/**
 * Run exports from command line
 */
async function runExports() {
  const args = process.argv.slice(2);
  const command = args[0];
  const outputPath = args[1];
  
  switch (command) {
    case 'all':
      await exportAllFormats(outputPath);
      break;
    case 'json':
      exportDesignTokens(outputPath);
      break;
    case 'css':
      exportCSSVariables(outputPath);
      break;
    case 'react-native':
      await exportForReactNative(outputPath);
      break;
    case 'electron':
      await exportForElectron(outputPath);
      break;
    case 'figma':
      exportForFigma(outputPath);
      break;
    case 'sketch':
      exportForSketch(outputPath);
      break;
    case 'adobe-xd':
      exportForAdobeXD(outputPath);
      break;
    case 'tailwind':
      exportForTailwind(outputPath);
      break;
    case 'css-in-js':
      exportForCSSInJS(outputPath);
      break;
    case 'storybook':
      exportForStorybook(outputPath);
      break;
    case 'docs':
      exportForDocumentation(outputPath);
      break;
    case 'validate':
      validateDesignTokens();
      break;
    default:
      console.log(`
Usage: node export.js <command> [output-path]

Commands:
  all              Export all formats
  json             Export JSON design tokens
  css              Export CSS variables
  react-native     Export for React Native
  electron         Export for Electron
  figma            Export for Figma
  sketch           Export for Sketch
  adobe-xd         Export for Adobe XD
  tailwind         Export for Tailwind CSS
  css-in-js        Export for CSS-in-JS
  storybook        Export for Storybook
  docs             Export documentation
  validate         Validate design tokens

Examples:
  node export.js all ./exports
  node export.js json ./tokens.json
  node export.js validate
      `);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExports();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  exportDesignTokens,
  exportCSSVariables,
  exportForReactNative,
  exportForElectron,
  exportForFigma,
  exportForSketch,
  exportForAdobeXD,
  exportForTailwind,
  exportForCSSInJS,
  exportForStorybook,
  exportForDocumentation,
  validateDesignTokens,
  exportAllFormats,
}; 