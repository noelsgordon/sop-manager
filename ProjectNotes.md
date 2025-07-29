# Project Notes

## Current Status
- Version: v2.6.0
- Authentication: Supabase with email/password
- Database: Supabase with RLS policies
- Frontend: React + Vite + Tailwind CSS
- Deployment: Vercel

## Recent Fixes
- ✅ Fixed authentication flow (CreateUserModal now uses proper password-based signup)
- ✅ Fixed RLS policies for admin user creation
- ✅ Enhanced backup system with all core tables
- ✅ Added revision control notes feature
- ✅ Improved project snapshot system

## Known Issues
- Test scripts may corrupt live data (needs safeguarding)
- Some UI components need refinement
- Department management needs expansion

## Future Improvements

### PWA Implementation Plan (High Priority)
Transform the SOP Manager web app into a Progressive Web App (PWA) for Android tablets and other devices.

#### Phase 1: Core PWA Infrastructure
1. **Web App Manifest** (`public/manifest.json`)
   - App metadata, icons, display behavior
   - Fields: name, short_name, start_url, display, orientation, theme_color, icons
   - Display: "standalone" for fullscreen mode

2. **HTML Meta Tags** (`index.html`)
   - `<link rel="manifest" href="/manifest.json">`
   - `<meta name="theme-color" content="#3B82F6">`
   - Apple-specific meta tags for iOS compatibility

3. **App Icons** (`public/icons/`)
   - icon-192x192.png, icon-512x512.png
   - icon-maskable-192x192.png, icon-maskable-512x512.png
   - Design: Document/checklist icon with blue theme

#### Phase 2: Service Worker Implementation
1. **Service Worker** (`public/sw.js`)
   - Cache static assets (CSS, JS, images)
   - Cache API responses for offline access
   - Handle offline fallbacks

2. **Service Worker Registration** (`src/main.jsx`)
   - Register service worker
   - Handle updates and notifications

#### Phase 3: PWA-Specific Enhancements
1. **Install Prompt** (`src/components/PWAInstallPrompt.jsx`)
   - "Add to Home Screen" functionality
   - Installation event handling

2. **Offline Support** (`src/components/OfflineIndicator.jsx`)
   - Online/offline status detection
   - Offline indicator and reconnection handling

#### Phase 4: Testing & Verification
- Chrome DevTools Lighthouse testing
- PWA Builder validation
- Android device testing
- HTTPS configuration for local development

#### Technical Considerations
- **Authentication**: Cache auth state, queue actions for offline
- **Real-time Features**: Show offline indicator, sync when online
- **File Uploads**: Queue uploads, show pending status
- **Platform Support**: Android Chrome (primary), iOS Safari (limited)

#### Success Criteria
- App installable on Android via "Add to Home Screen"
- Fullscreen mode without browser UI
- Correct app icons on home screen
- Basic offline functionality
- Lighthouse PWA score 90+

### Department Management Expansion
1. **SuperAdmin Department Tools**
   - Create, edit, delete departments
   - Department hierarchy management
   - Department-specific settings

2. **SOP Department Assignment**
   - Default department assignment for new SOPs
   - "Nomad" department for unassigned SOPs
   - Department filtering and management

3. **Multi-Company Future-Proofing**
   - Company_id layer for multi-tenancy
   - Data isolation between companies
   - Company-specific configurations

### Admin Panel User Management
1. **Role Restrictions**
   - Admins can only promote up to "Build" level
   - No admin or superadmin creation by regular admins
   - Department-scoped user visibility

2. **Department-Scoped Access**
   - Admins only see users in their departments
   - Filtered department columns
   - Restricted role assignment

### Suggest Changes Workflow
1. **Tweaker Interface**
   - "Suggest Changes" button on SOPs
   - Speech bubble icon for comments
   - Text box for suggestion submission

2. **Admin Review System**
   - Notification system for admins
   - Approve/reject/comment functionality
   - Audit trail for all suggestions

3. **Workflow Management**
   - Status tracking (pending, approved, rejected)
   - Admin control over suggestion states
   - Integration with editing process

### Backup System Enhancements
1. **Import/Restore Module**
   - Frontend import tool for Superadmins
   - ZIP file upload and processing
   - Data reconciliation for overlaps

2. **Advanced Features** (Future)
   - Dry run mode
   - Selective import
   - Image restore functionality
   - Per-record conflict resolution
   - Detailed reporting and audit logs

### Test Code Safeguarding
1. **Environment Detection**
   - Separate test and production environments
   - Environment-specific data handling
   - Clear test vs production indicators

2. **Data Protection**
   - Test data isolation
   - Production data safeguards
   - Clear testing procedures

### UI/UX Improvements
1. **Component Refinement**
   - Consistent styling across components
   - Better error handling and user feedback
   - Improved loading states

2. **Mobile Optimization**
   - Touch-friendly interfaces
   - Responsive design improvements
   - Tablet-specific optimizations

### Performance Optimizations
1. **Caching Strategy**
   - Department data caching
   - User permissions caching
   - API response optimization

2. **Bundle Optimization**
   - Code splitting
   - Lazy loading
   - Tree shaking

## Development Priorities
1. **PWA Implementation** (High Priority)
2. **Department Management Tools** (Medium Priority)
3. **Suggest Changes Workflow** (Medium Priority)
4. **Test Code Safeguarding** (High Priority)
5. **UI/UX Refinements** (Low Priority)

## Technical Debt
- Some components need refactoring
- Error handling could be more consistent
- Test coverage needs improvement
- Documentation needs updating

## Deployment Notes
- Vercel deployment working well
- Environment variables properly configured
- HTTPS enabled for PWA requirements
- Build process optimized

## Security Considerations
- RLS policies properly implemented
- Authentication flow secure
- Admin permissions properly restricted
- Data isolation maintained 