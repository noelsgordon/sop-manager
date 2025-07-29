# SOP PLATFORM DEPLOYMENT & REVISION CONTROL GUIDE

## 🔄 Current Version Status
**Version:** 1.6 (Compression Live)
**Last Updated:** February 2024
**Status:** Active Development

## 🧾 REVISION CONTROL
### Version Format
- Format: `Revision X.Y` (e.g., Revision 1.6)
- Major Updates (X): Architecture changes, table restructures, breaking changes
- Minor Updates (Y): Feature additions, UI updates, bug fixes

### Milestone History
- ✅ SOP Revision A – Initial stable build
- ✅ Revision 1.6 – Compression Live (client-side image compression)
- 🛠️ Revision 1.9 – Invite System (in progress)

## 💻 DEVELOPMENT

### Local Development
```bash
# Unix/Linux/Mac and Windows
# Start development server
npm run dev

# Create production build
npm run build

# Version bumping
npm run bump:minor   # for minor changes (X.Y -> X.Y+1)
npm run bump:major   # for major changes (X.Y -> X+1.0)
```

### Environment Setup
```bash
# Unix/Linux/Mac:
cp .env.example .env

# Windows PowerShell:
Copy-Item .env.example .env
```

### Database Architecture
For detailed database information, see [MIGRATION_NOTES.md](./MIGRATION_NOTES.md)

#### Current Structure
- **Departments Table** (Primary organizational unit)
  - `department_id` (UUID, primary key)
  - `name` (text)
  - `company_id` (UUID, foreign key)
  - `is_default` (boolean)
  - `created_at` (timestamp)
  - `metadata` (jsonb)

#### Access Control
- Role system:
  - Look (previously Viewer)
  - Tweak (previously Updater)
  - Build (previously Creator)
  - Manage (previously Admin)
  - Super (previously SuperAdmin)

### Migration Scripts
For migration scripts and utilities, see [src/README.md](./src/README.md)
- Database verification scripts
- Migration utilities
- Testing tools

## 🚀 DEPLOYMENT PLATFORMS

### GitHub
- Repository: https://github.com/noelsgordon/sop-manager
- Primary Branch: main (auto-deploys to Vercel)

### Vercel Configuration
- Build Command: `vite build`
- Output Directory: `dist`
- Framework Preset: Vite + React
- Auto-deploy: Enabled on main branch
- Domain: Managed in Vercel dashboard

## 🔒 SECURITY & ENVIRONMENT

### Required Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Environment Variable Locations
- Local: `.env` file
- Production: Vercel Dashboard
- CI/CD: GitHub Secrets (Settings > Secrets and variables > Actions)

## 🔐 AUTHENTICATION & ACCESS

### Authentication Method
- Email/Password authentication via Supabase
- Role-based access control

### Access Control
- Stored in user_departments table
- RLS policies enforce department-scoped access
- Role hierarchy implemented

## 📦 ROADMAP & ENHANCEMENTS

### Completed
1. ✅ Client-side image compression (browser-image-compression)
2. ✅ Basic invite system foundation
3. ✅ Migration to department-centric model

### In Progress
4. 🛠️ Restrict invite codes by department + role
5. 🛠️ Login-based invite code redemption flow

### Planned
6. 👥 Multi-department user support
7. 🔑 Super Admin department management tools
8. 🏢 Department-scoped SOPs
9. 🔄 Company to Department terminology update
10. 👤 Role name updates (complete)
11. 📊 Analytics & usage monitoring dashboard

---
*Last updated: Based on version.json v1.6* 