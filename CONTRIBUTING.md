# Contributing to SOP Manager

## 🌟 Development Guidelines

### Code Style
- Use ESLint and Prettier configurations
- Follow React best practices
- Write meaningful commit messages
- Document code changes

### Branch Strategy
1. **Main Branches**
   - `main` - Production-ready code
   - `develop` - Development branch

2. **Feature Branches**
   - Format: `feature/description`
   - Branch from: `develop`
   - Merge to: `develop`

3. **Hotfix Branches**
   - Format: `hotfix/description`
   - Branch from: `main`
   - Merge to: `main` and `develop`

### Version Control
- Follow [Semantic Versioning](https://semver.org/)
- Use version bump scripts:
  ```bash
  npm run bump:minor   # X.Y -> X.Y+1
  npm run bump:major   # X.Y -> X+1.0
  ```

## 🔄 Development Workflow

1. **Setup**
   ```bash
   git clone https://github.com/noelsgordon/sop-manager
   cd sop-manager
   npm install
   cp .env.example .env
   ```

2. **Feature Development**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature
   # Make changes
   git commit -m "feat: description"
   git push origin feature/your-feature
   ```

3. **Code Review**
   - Create Pull Request to `develop`
   - Address review comments
   - Update documentation if needed
   - Ensure tests pass

## 📝 Documentation

### Required Updates
1. Update relevant .md files:
   - DEPLOYMENT.md for version changes
   - MIGRATION_NOTES.md for DB changes
   - README.md for feature changes
   - SECURITY.md for security updates

2. Code Documentation
   - Add JSDoc comments
   - Update component props
   - Document new features
   - Update API documentation

## 🧪 Testing

### Test Requirements
- Write unit tests for new features
- Update existing tests if needed
- Ensure all tests pass locally
- Test in development environment

### Test Types
1. **Unit Tests**
   - Component tests
   - Utility function tests
   - Hook tests

2. **Integration Tests**
   - API integration
   - Database operations
   - Authentication flows

## 🚀 Deployment

### Staging Deployment
1. Merge to `develop`
2. Automatic deployment to staging
3. Test in staging environment
4. Document any issues

### Production Deployment
1. Create PR from `develop` to `main`
2. Review deployment checklist
3. Merge after approval
4. Monitor deployment

## 🐛 Bug Reports

### Reporting Process
1. Check existing issues
2. Use issue template
3. Provide reproduction steps
4. Include relevant logs

### Issue Template
```markdown
**Description**
[Clear description of the issue]

**Steps to Reproduce**
1. [First Step]
2. [Second Step]
3. [Additional Steps...]

**Expected Behavior**
[What you expected to happen]

**Actual Behavior**
[What actually happened]

**Environment**
- Version: [e.g., 1.6]
- Browser: [e.g., Chrome 91]
- OS: [e.g., Windows 10]
```

## 🤝 Pull Requests

### PR Guidelines
1. Link related issues
2. Describe changes clearly
3. Include tests
4. Update documentation
5. Follow code style

### PR Template
```markdown
**Related Issue**
Fixes #[issue number]

**Changes Made**
- [Change 1]
- [Change 2]
- [Additional changes...]

**Testing**
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

**Documentation**
- [ ] README.md updated
- [ ] API docs updated
- [ ] Comments added/updated
```

---
*Last updated: Version 1.6* 