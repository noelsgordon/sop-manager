# SOP Manager Design System

## 🎯 **Overview**

This design system serves as the **single source of truth** for all design values across the SOP Manager platform. Changes made here automatically propagate to all platforms, ensuring consistent aesthetics, colors, typography, and user experience.

## 📁 **File Structure**

```
src/design-system/
├── tokens.js              # Centralized design tokens
├── components/            # Reusable component styles
│   ├── Button.jsx        # Button component with variants
│   ├── Input.jsx         # Input component with variants
│   ├── Card.jsx          # Card component with variants
│   └── index.js          # Component exports
├── hooks/                # Design system hooks
│   ├── useTheme.js       # Theme management hook
│   └── useDesignTokens.js # Design token utilities
├── utils/                # Design utilities
│   ├── colorUtils.js     # Color manipulation utilities
│   ├── responsiveUtils.js # Responsive design utilities
│   └── animationUtils.js # Animation utilities
└── README.md             # This documentation
```

## 🎨 **Design Tokens**

### **Colors**

All colors are defined in `tokens.js` and automatically available as Tailwind classes:

```javascript
// Primary brand colors
bg-primary-500    // Main brand blue
text-primary-600  // Darker blue for text
border-primary-200 // Light blue for borders

// Semantic colors
bg-success-500    // Green for success states
bg-warning-500    // Orange for warnings
bg-error-500      // Red for errors

// Neutral colors
bg-neutral-50     // Very light gray
text-neutral-900  // Very dark gray
```

### **Typography**

```javascript
// Font families
font-sans         // Inter font stack
font-mono         // JetBrains Mono font stack

// Font sizes
text-xs           // 12px
text-sm           // 14px
text-base         // 16px
text-lg           // 18px
text-xl           // 20px
text-2xl          // 24px
text-3xl          // 30px

// Font weights
font-light        // 300
font-normal       // 400
font-medium       // 500
font-semibold     // 600
font-bold         // 700
```

### **Spacing**

```javascript
// Consistent spacing scale
p-1              // 4px
p-2              // 8px
p-3              // 12px
p-4              // 16px
p-5              // 20px
p-6              // 24px
p-8              // 32px
p-12             // 48px
```

### **Border Radius**

```javascript
rounded-sm        // 2px
rounded           // 4px
rounded-md        // 6px
rounded-lg        // 8px
rounded-xl        // 12px
rounded-2xl       // 16px
rounded-full      // 9999px
```

## 🔧 **Usage Guidelines**

### **1. Always Use Design Tokens**

✅ **Correct:**
```jsx
<button className="bg-primary-500 text-white px-4 py-2 rounded-lg">
  Submit
</button>
```

❌ **Incorrect:**
```jsx
<button className="bg-blue-500 text-white px-4 py-2 rounded-lg">
  Submit
</button>
```

### **2. Use Semantic Colors**

✅ **Correct:**
```jsx
<div className="bg-success-100 text-success-800 border border-success-200">
  Success message
</div>
```

❌ **Incorrect:**
```jsx
<div className="bg-green-100 text-green-800 border border-green-200">
  Success message
</div>
```

### **3. Consistent Spacing**

✅ **Correct:**
```jsx
<div className="p-6 space-y-4">
  <h2 className="text-2xl font-semibold">Title</h2>
  <p className="text-base">Content</p>
</div>
```

❌ **Incorrect:**
```jsx
<div className="p-8 space-y-6">
  <h2 className="text-3xl font-bold">Title</h2>
  <p className="text-lg">Content</p>
</div>
```

## 🚀 **Making Changes**

### **Adding New Colors**

1. **Edit `src/design-system/tokens.js`:**
```javascript
export const colors = {
  primary: {
    // ... existing colors
    550: '#1e40af', // New color
  },
  // ... other color categories
};
```

2. **Update automatically available as:**
```jsx
<div className="bg-primary-550 text-white">
  New color usage
</div>
```

### **Adding New Component Variants**

1. **Edit `src/design-system/tokens.js`:**
```javascript
export const components = {
  button: {
    variants: {
      // ... existing variants
      outline: {
        background: 'transparent',
        color: colors.primary[500],
        border: `1px solid ${colors.primary[500]}`,
      },
    },
  },
};
```

2. **Create component in `src/design-system/components/`:**
```jsx
// Button.jsx
export function Button({ variant = 'primary', children, ...props }) {
  const variantStyles = components.button.variants[variant];
  return (
    <button 
      className={`px-4 py-2 rounded-lg ${getVariantClasses(variantStyles)}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

## 📱 **Cross-Platform Consistency**

### **Web Platform**
- Uses Tailwind CSS classes
- Responsive design with breakpoints
- CSS custom properties for dynamic theming

### **Mobile Platform (Future)**
- React Native with styled-components
- Same design tokens exported as JavaScript objects
- Platform-specific implementations

### **Desktop Platform (Future)**
- Electron with CSS-in-JS
- Same design tokens for consistency
- Native desktop styling

## 🎯 **Component Guidelines**

### **Button Components**

```jsx
// Primary button
<Button variant="primary" size="md">
  Primary Action
</Button>

// Secondary button
<Button variant="secondary" size="md">
  Secondary Action
</Button>

// Danger button
<Button variant="danger" size="md">
  Delete
</Button>
```

### **Input Components**

```jsx
// Standard input
<Input 
  type="text"
  placeholder="Enter text"
  variant="default"
/>

// Error state
<Input 
  type="text"
  placeholder="Enter text"
  variant="error"
  errorMessage="This field is required"
/>
```

### **Card Components**

```jsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

## 🔄 **Version Control**

### **Design Token Changes**

1. **Update `tokens.js`**
2. **Test across all components**
3. **Update documentation**
4. **Commit with descriptive message**

```bash
git commit -m "feat(design): add new primary color variant for better contrast"
```

### **Breaking Changes**

1. **Create migration guide**
2. **Update all components**
3. **Test thoroughly**
4. **Update version number**

## 📊 **Quality Assurance**

### **Design Token Validation**

```javascript
// Validate color contrast ratios
import { validateContrast } from './utils/colorUtils';

const isValid = validateContrast(colors.primary[500], colors.semantic.text.inverse);
console.log('Primary button contrast:', isValid);
```

### **Component Testing**

```javascript
// Test component variants
import { render, screen } from '@testing-library/react';
import { Button } from './components/Button';

test('Button renders with correct variant styles', () => {
  render(<Button variant="primary">Test</Button>);
  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-primary-500');
});
```

## 🎨 **Design Principles**

### **1. Consistency**
- All visual elements follow the same design language
- Consistent spacing, typography, and colors
- Predictable component behavior

### **2. Accessibility**
- WCAG 2.1 AA compliance
- Proper color contrast ratios
- Keyboard navigation support
- Screen reader compatibility

### **3. Scalability**
- Design tokens scale across different screen sizes
- Components work in different contexts
- Easy to extend and modify

### **4. Performance**
- Minimal CSS bundle size
- Efficient rendering
- Optimized for mobile devices

## 📚 **Resources**

### **Design Tools**
- **Figma**: Design system documentation
- **Storybook**: Component library
- **Chromatic**: Visual regression testing

### **Development Tools**
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **Cypress**: Integration testing

### **Documentation**
- **Storybook**: Interactive component documentation
- **Design Tokens**: JSON export for design tools
- **CSS Variables**: Runtime theming support

## 🚀 **Getting Started**

### **For Developers**

1. **Import design tokens:**
```javascript
import { colors, typography, spacing } from '@/design-system/tokens';
```

2. **Use Tailwind classes:**
```jsx
<div className="bg-primary-500 text-white p-4 rounded-lg">
  Content
</div>
```

3. **Use component variants:**
```jsx
import { Button } from '@/design-system/components';

<Button variant="primary" size="md">
  Click me
</Button>
```

### **For Designers**

1. **Access design tokens:**
```javascript
// Export for design tools
import { designTokens } from '@/design-system/tokens';
console.log(JSON.stringify(designTokens, null, 2));
```

2. **Use CSS custom properties:**
```css
.my-component {
  background-color: var(--color-primary-500);
  color: var(--color-white);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
}
```

## 📞 **Support**

For questions about the design system:

1. **Check this documentation**
2. **Review existing components**
3. **Ask in team chat**
4. **Create an issue**

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: Design System Team 