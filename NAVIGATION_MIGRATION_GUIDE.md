# Navigation System Migration Guide

## 🎯 **Overview**

This guide explains how to migrate from the current **hash-based navigation** to the new **centralized navigation system** that provides a **single source of truth** for navigation state.

## 🔄 **Current vs. New System**

### **Current System (Hash-Based)**
```javascript
// Multiple sources of truth - causes sync issues
const [activePanel, setActivePanel] = useState("library");
window.location.hash = "library";
setActivePanel("library");

// Scattered styling
<button className="bg-blue-100 text-blue-700 font-semibold">Library</button>
<button className="bg-blue-100 text-blue-700 font-semibold">Search</button>
```

### **New System (Centralized)**
```javascript
// Single source of truth
const { currentRoute, navigateTo, getNavigationStyles } = useNavigation();

// Consistent styling with design system
<button className={getNavigationStyles('library', isActive, isAccessible)}>
  Library
</button>
```

## 🚀 **Migration Steps**

### **Step 1: Update App.jsx**

Replace the current navigation logic with the centralized system:

```javascript
// BEFORE (current App.jsx)
function MainApp({ session, setSession }) {
  const [activePanel, setActivePanel] = useState("library");
  
  const setViewMode = useCallback((mode) => {
    setActivePanel(mode);
    window.location.hash = mode;
  }, []);

  // ... rest of component
}

// AFTER (with centralized navigation)
function MainApp({ session, setSession }) {
  const { currentRoute, navigateTo } = useNavigation();
  
  // Navigation is now handled by the centralized system
  // No more manual state management needed
  
  // ... rest of component
}
```

### **Step 2: Update Header.jsx**

Replace the current navigation with the new Navigation component:

```javascript
// BEFORE (current Header.jsx)
const NAV_ITEMS = [
  { key: "library", label: "Library", icon: Home },
  { key: "search", label: "Search", icon: SearchIcon },
  // ... more items
];

// Manual navigation handling
const handleNav = (key) => {
  setViewMode(key);
};

// AFTER (with centralized navigation)
import { Navigation } from '../utils/navigation';

// Navigation component handles everything
<Navigation 
  userPermissions={userPermissions}
  isSuperAdmin={isSuperAdmin}
  onNavigate={(route) => {
    // Optional: handle navigation events
    console.log('Navigated to:', route);
  }}
/>
```

### **Step 3: Update Layout.jsx**

Add breadcrumb support:

```javascript
// BEFORE (current Layout.jsx)
export default function Layout({ sidebar, topbar, children }) {
  // ... existing code
}

// AFTER (with centralized navigation)
import { Breadcrumb } from '../utils/navigation';

export default function Layout({ sidebar, topbar, children }) {
  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {/* ... existing sidebar code */}
      
      <main className="flex-1 p-6">
        <Breadcrumb />
        {children}
      </main>
    </div>
  );
}
```

## 🔧 **Integration with Design System**

### **Automatic Styling Integration**

The new navigation system automatically uses your design system:

```javascript
// Design system colors are automatically applied
const styling = {
  active: 'bg-primary-100 text-primary-700 font-semibold', // Uses design tokens
  inactive: 'hover:bg-gray-100 text-gray-700',
  disabled: 'text-gray-400 bg-gray-100 cursor-not-allowed',
};
```

### **Cross-Platform Compatibility**

The navigation system works across all platforms:

```javascript
// Web (React)
<Navigation userPermissions={permissions} />

// Mobile (React Native) - Future
<MobileNavigation userPermissions={permissions} />

// Desktop (Electron) - Future
<DesktopNavigation userPermissions={permissions} />
```

## 📱 **Mobile Navigation Support**

### **Responsive Design**

The navigation system includes mobile-specific components:

```javascript
// Desktop navigation
<Navigation userPermissions={permissions} />

// Mobile navigation (automatically responsive)
<MobileNavigation userPermissions={permissions} />
```

### **Mobile-Specific Features**

- **Touch-friendly** button sizes
- **Swipe gestures** (future enhancement)
- **Bottom navigation** (future enhancement)
- **Collapsible menus** (future enhancement)

## 🔒 **Permission Integration**

### **Automatic Permission Checking**

The navigation system automatically handles permissions:

```javascript
// Routes are automatically filtered based on permissions
const availableRoutes = getAvailableRoutes(userPermissions, isSuperAdmin);

// Inaccessible routes are automatically disabled
<button 
  disabled={!isAccessible}
  className={getNavigationStyles(route.key, isActive, isAccessible)}
>
  {route.label}
</button>
```

### **Permission-Based Styling**

Routes are styled based on accessibility:

```javascript
// Accessible route
className="bg-primary-100 text-primary-700 font-semibold"

// Inaccessible route
className="text-gray-400 bg-gray-100 cursor-not-allowed"
```

## 🎨 **Design System Integration**

### **Consistent Styling**

All navigation components use the design system:

```javascript
// Colors from design tokens
active: 'bg-primary-100 text-primary-700 font-semibold'

// Spacing from design tokens
className="flex items-center gap-2 px-3 py-2 rounded transition"

// Typography from design tokens
className="text-sm font-medium"
```

### **Theme Support**

Navigation automatically supports themes:

```javascript
// Light theme
className="bg-white text-gray-900"

// Dark theme (future)
className="bg-gray-900 text-white"
```

## 🔄 **Backward Compatibility**

### **Gradual Migration**

You can migrate gradually without breaking existing functionality:

```javascript
// Step 1: Add new navigation alongside existing
<div className="flex">
  <div className="w-64">
    {/* Old navigation - can be removed later */}
    <OldNavigation />
  </div>
  <div className="w-64">
    {/* New navigation */}
    <Navigation userPermissions={permissions} />
  </div>
</div>

// Step 2: Remove old navigation
<div className="w-64">
  <Navigation userPermissions={permissions} />
</div>
```

### **State Migration**

The new system can read existing state:

```javascript
// The new system automatically detects current route
const { currentRoute } = useNavigation();

// No manual state migration needed
// The system reads from URL automatically
```

## 🧪 **Testing the Migration**

### **Test Current Functionality**

```javascript
// Test that navigation still works
const { navigateTo, currentRoute } = useNavigation();

// Navigate to library
await navigateTo('library');
console.log('Current route:', currentRoute); // Should be 'library'

// Navigate to search
await navigateTo('search');
console.log('Current route:', currentRoute); // Should be 'search'
```

### **Test Permissions**

```javascript
// Test permission-based navigation
const { getAvailableRoutes } = useNavigation();

const availableRoutes = getAvailableRoutes(['CREATE_SOP'], false);
console.log('Available routes:', availableRoutes);

// Should only show routes user has permission for
```

### **Test Styling**

```javascript
// Test design system integration
const { getNavigationStyles } = useNavigation();

const styles = getNavigationStyles('library', true, true);
console.log('Navigation styles:', styles);

// Should use design system colors and spacing
```

## 🚀 **Benefits After Migration**

### **1. Single Source of Truth**
- **No more sync issues** between hash and state
- **Consistent navigation** across all components
- **Predictable behavior** for users

### **2. Design System Integration**
- **Consistent styling** across all navigation
- **Automatic theme support** (future)
- **Cross-platform compatibility**

### **3. Better Developer Experience**
- **Type-safe navigation** with IntelliSense
- **Centralized configuration** for all routes
- **Easy to add new routes** and features

### **4. Future-Proof Architecture**
- **Mobile navigation** ready
- **Desktop navigation** ready
- **PWA navigation** ready

## 📋 **Migration Checklist**

- [ ] **Install new navigation system**
- [ ] **Update App.jsx** to use centralized navigation
- [ ] **Update Header.jsx** to use Navigation component
- [ ] **Update Layout.jsx** to include Breadcrumb
- [ ] **Test all navigation flows**
- [ ] **Test permission-based navigation**
- [ ] **Test mobile responsiveness**
- [ ] **Remove old navigation code**
- [ ] **Update documentation**

## 🎯 **Next Steps**

1. **Implement the migration** following this guide
2. **Test thoroughly** to ensure no functionality is lost
3. **Update components** to use the new navigation system
4. **Remove old navigation code** once migration is complete
5. **Add new features** like breadcrumbs and mobile navigation

The new navigation system provides a **solid foundation** for your current SOP Manager and future platforms, ensuring **consistent user experience** across all devices and **maintainable code** for developers. 