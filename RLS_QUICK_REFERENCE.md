# RLS Quick Reference Guide

## 🚀 Quick Start

### Current Status
- ✅ **All 6 tables secured** with RLS
- ✅ **24/24 tests passing** (100%)
- ✅ **Production ready** and operational

### Tables with RLS
1. `user_profiles` - User accounts
2. `departments` - Department data
3. `user_departments` - User-department relationships
4. `invite_codes` - Invitation system
5. `sops` - Standard Operating Procedures
6. `sop_steps` - SOP steps

## 🧪 Testing

### RLS Test Environment
**Access**: SuperAdmin → RLS Test Environment

**Quick Test**:
1. Click "Run All Tests"
2. Check all 24 tests pass
3. Use "Copy Test Results" for debugging

**Expected Results**:
```
user_profiles:    2/2 tests passed (READ, UPDATE)
departments:      4/4 tests passed (READ, INSERT, UPDATE, DELETE)
user_departments: 4/4 tests passed (READ, INSERT, UPDATE, DELETE)
invite_codes:     4/4 tests passed (READ, INSERT, UPDATE, DELETE)
sops:            4/4 tests passed (READ, INSERT, UPDATE, DELETE)
sop_steps:       4/4 tests passed (READ, INSERT, UPDATE, DELETE)
Total:           24/24 tests passed (100%)
```

## 🔧 Common Operations

### Add New Table with RLS
1. Create RLS policies following existing patterns
2. Add to `RlsTestEnvironment.jsx` in `getTestRecord()` function
3. Test all CRUD operations
4. Update documentation

### Emergency RLS Disable
```sql
-- Disable RLS on all tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE sops DISABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps DISABLE ROW LEVEL SECURITY;
```

### Re-enable RLS
```sql
-- Re-enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps ENABLE ROW LEVEL SECURITY;
```

## 🚨 Common Issues

### Issue: "Failed to load user data"
**Cause**: RLS blocking login flow
**Solution**: Ensure `user_profiles` SELECT policy allows `USING (true)`

### Issue: "duplicate key value violates unique constraint"
**Cause**: Test data conflicts with constraints
**Solution**: Use dynamic constraint checking in test environment

### Issue: "violates foreign key constraint"
**Cause**: Test data references non-existent records
**Solution**: Use valid foreign key values from database

## 📊 Policy Patterns

### Basic User Ownership
```sql
-- Users can only access their own data
CREATE POLICY "Users own data" ON table_name 
FOR ALL USING (user_id = auth.uid());
```

### Department-Based Access
```sql
-- Users can access department data
CREATE POLICY "Department access" ON table_name 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_departments 
          WHERE user_id = auth.uid() AND department_id = table_name.department_id)
);
```

### SuperAdmin Override
```sql
-- SuperAdmins have full access
CREATE POLICY "SuperAdmin access" ON table_name 
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() AND is_superadmin = true)
);
```

## 🔍 Debugging

### RLS Test Environment Features
- ✅ Tests all CRUD operations
- ✅ Comprehensive console logging
- ✅ Dynamic constraint handling
- ✅ Detailed error reporting
- ✅ Copy results with metadata

### Console Logs
- 📖 READ test logs
- ➕ INSERT test logs
- ✏️ UPDATE test logs
- 🗑️ DELETE test logs
- ✅ Completion logs

### Copy Results Format
```json
{
  "table_name": {
    "tests": {
      "read": { "success": true, "count": 5 },
      "insert": { "success": true, "data": {...} },
      "update": { "success": true, "debug": {...} },
      "delete": { "success": true, "debug": {...} }
    }
  },
  "metadata": {
    "userProfile": {...},
    "environment": {...},
    "consoleLogs": [...]
  }
}
```

## 📚 Key Files

### Implementation
- `src/components/admin/RlsTestEnvironment.jsx` - Testing interface
- `src/production_rls_implementation.sql` - Complete RLS setup
- `src/clean_and_apply_production_rls.sql` - Clean application

### Documentation
- `RLS_IMPLEMENTATION_COMPLETE.md` - Complete documentation
- `RLS_IMPLEMENTATION_GUIDE.md` - Implementation guide
- `RLS_IMPLEMENTATION_ANALYSIS.md` - Analysis and lessons learned

### Emergency Scripts
- `src/emergency_rollback_all_rls.sql` - Emergency procedures
- `src/force_rollback_all_rls.sql` - Force rollback
- `src/enable_rls_on_tables.sql` - Re-enable RLS

## 🎯 Best Practices

### DO ✅
- Test RLS policies before deployment
- Use RLS Test Environment for validation
- Document all policy changes
- Have emergency rollback procedures
- Respect database constraints

### DON'T ❌
- Skip testing phases
- Remove tests to avoid failures
- Apply RLS to critical tables first
- Ignore constraint violations
- Deploy without testing

## 🔮 Future Maintenance

### Monthly Tasks
- Run RLS Test Environment
- Review test results
- Check for any failed tests
- Update documentation if needed

### Quarterly Tasks
- Review RLS policies for optimization
- Check performance impact
- Update emergency procedures
- Security audit of policies

---

**Status**: ✅ **PRODUCTION READY**  
**Last Updated**: 2025-07-24  
**Version**: 1.11 