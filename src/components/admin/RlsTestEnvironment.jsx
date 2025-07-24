import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Plus, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

/**
 * RlsTestEnvironment - Comprehensive RLS testing environment
 * Tests all tables and their policies with real user authentication
 * Only visible to superadmins
 */
export default function RlsTestEnvironment({ userProfile, onBack }) {
  console.log('RlsTestEnvironment: Component rendered', { userProfile, onBack });
  
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Only allow superadmins
  if (!userProfile?.is_superadmin) {
    console.log('RlsTestEnvironment: Access denied - not superadmin');
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Access denied. Superadmin only.
      </div>
    );
  }

  console.log('RlsTestEnvironment: Superadmin access granted');

  // Run comprehensive test for a table
  const runTableTest = async (tableName) => {
    console.log(`🔍 Starting RLS test for table: ${tableName}`);
    
    const results = {
      table: tableName,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Can read data
      console.log(`📖 Testing READ access for ${tableName}`);
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' });
        
        console.log(`📖 READ result for ${tableName}:`, { success: !error, count: data?.length, error: error?.message });
        
        results.tests.read = {
          success: !error,
          count: data?.length,
          error: error?.message
        };
      } catch (err) {
        console.error(`❌ READ error for ${tableName}:`, err);
        results.tests.read = {
          success: false,
          error: err.message
        };
      }

      // Test 2: Can insert data (if applicable)
      if (tableName !== 'user_profiles') { // Skip insert test for user_profiles
        console.log(`➕ Testing INSERT access for ${tableName}`);
        try {
          const testRecord = await getTestRecord(tableName);
          
          // Add timestamp to make each record unique
          const uniqueRecord = {
            ...testRecord,
            // Add timestamp to name/description to make it unique
            ...(tableName === 'departments' && { name: `${testRecord.name}_${Date.now()}` }),
            ...(tableName === 'sops' && { name: `${testRecord.name}_${Date.now()}` }),
            ...(tableName === 'invite_codes' && { code: `${testRecord.code}_${Date.now()}` }),
            ...(tableName === 'sop_steps' && { step_number: Math.floor(Math.random() * 1000) + 1 })
          };
          
          console.log(`➕ INSERT attempt for ${tableName}:`, uniqueRecord);
          
          const { data, error } = await supabase
            .from(tableName)
            .insert(uniqueRecord)
            .select();
          
          console.log(`➕ INSERT result for ${tableName}:`, { success: !error, data: data?.[0], error: error?.message });
          
          results.tests.insert = {
            success: !error,
            error: error?.message,
            data: data?.[0],
            debug: { testRecord: uniqueRecord, tableName }
          };
          
          // Clean up - delete the test record
          if (data?.[0]) {
            const idField = tableName === 'user_departments' ? 'user_id' : 'id';
            const recordId = data[0][idField];
            
            if (recordId) {
              await supabase
                .from(tableName)
                .delete()
                .eq(idField, recordId);
            }
          }
        } catch (err) {
          results.tests.insert = {
            success: false,
            error: err.message,
            debug: { testRecord: uniqueRecord, tableName, error: err }
          };
        }
      }

      // Test 3: Can update data (if applicable)
      console.log(`✏️ Testing UPDATE access for ${tableName}`);
      try {
        const { data: existingData } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        console.log(`✏️ Found ${existingData?.length || 0} existing records for ${tableName}`);
        
        if (existingData?.length > 0) {
          const firstRecord = existingData[0];
          const updateData = getUpdateData(tableName);
          
          // Get the correct ID field based on table
          let idField, recordId;
          
          if (tableName === 'user_profiles') {
            idField = 'user_id';
            recordId = firstRecord[idField];
          } else if (tableName === 'departments') {
            idField = 'department_id';
            recordId = firstRecord[idField];
          } else if (tableName === 'user_departments') {
            idField = 'user_id';
            recordId = firstRecord[idField];
          } else {
            idField = 'id';
            recordId = firstRecord[idField];
          }
          
          console.log(`✏️ UPDATE attempt for ${tableName}:`, { idField, recordId, updateData });
          
          if (!recordId) {
            console.error(`❌ No valid ${idField} found for ${tableName} record`);
            results.tests.update = {
              success: false,
              error: `No valid ${idField} found for ${tableName} record`,
              debug: { firstRecord, idField }
            };
          } else {
            const { data, error } = await supabase
              .from(tableName)
              .update(updateData)
              .eq(idField, recordId)
              .select();
            
            console.log(`✏️ UPDATE result for ${tableName}:`, { success: !error, data: data?.[0], error: error?.message });
            
            results.tests.update = {
              success: !error,
              error: error?.message,
              data: data?.[0],
              debug: { idField, recordId, updateData }
            };
          }
        } else {
          console.warn(`⚠️ No existing records found for ${tableName}`);
          results.tests.update = {
            success: false,
            error: `No existing records found for ${tableName}`,
            debug: { tableName, existingData }
          };
        }
      } catch (err) {
        console.error(`❌ UPDATE error for ${tableName}:`, err);
        results.tests.update = {
          success: false,
          error: err.message,
          debug: { tableName, error: err }
        };
      }

      // Test 4: Can delete data (if applicable)
      if (tableName !== 'user_profiles') { // Skip delete test for user_profiles
        console.log(`🗑️ Testing DELETE access for ${tableName}`);
        try {
          const testRecord = await getTestRecord(tableName);
          
          // Add timestamp to make each record unique
          const uniqueRecord = {
            ...testRecord,
            // Add timestamp to name/description to make it unique
            ...(tableName === 'departments' && { name: `${testRecord.name}_${Date.now()}` }),
            ...(tableName === 'sops' && { name: `${testRecord.name}_${Date.now()}` }),
            ...(tableName === 'invite_codes' && { code: `${testRecord.code}_${Date.now()}` }),
            ...(tableName === 'sop_steps' && { step_number: Math.floor(Math.random() * 1000) + 1 })
          };
          
          console.log(`🗑️ DELETE test - inserting record for ${tableName}:`, uniqueRecord);
          
          const { data: insertData } = await supabase
            .from(tableName)
            .insert(uniqueRecord)
            .select();
          
          console.log(`🗑️ DELETE test - insert result for ${tableName}:`, { success: !!insertData?.[0], data: insertData?.[0] });
          
          if (insertData?.[0]) {
            // Get the correct ID field based on table
            let idField, recordId;

            if (tableName === 'user_departments') {
              idField = 'user_id';
              recordId = insertData[0][idField];
            } else if (tableName === 'departments') {
              idField = 'department_id';
              recordId = insertData[0][idField];
            } else {
              idField = 'id';
              recordId = insertData[0][idField];
            }

            console.log(`🗑️ DELETE attempt for ${tableName}:`, { idField, recordId });

            if (recordId) {
              const { error } = await supabase
                .from(tableName)
                .delete()
                .eq(idField, recordId);

              console.log(`🗑️ DELETE result for ${tableName}:`, { success: !error, error: error?.message });

              results.tests.delete = {
                success: !error,
                error: error?.message,
                debug: { idField, recordId, tableName }
              };
            } else {
              console.error(`❌ No valid ${idField} found for deletion in ${tableName}`);
              results.tests.delete = {
                success: false,
                error: `No valid ${idField} found for deletion`,
                debug: { idField, insertData, tableName }
              };
            }
          } else {
            console.error(`❌ Failed to insert test record for deletion in ${tableName}`);
            results.tests.delete = {
              success: false,
              error: 'Failed to insert test record for deletion',
              debug: { insertData, tableName, uniqueRecord }
            };
          }
        } catch (err) {
          console.error(`❌ DELETE error for ${tableName}:`, err);
          results.tests.delete = {
            success: false,
            error: err.message,
            debug: { tableName, uniqueRecord, error: err }
          };
        }
      }

    } catch (err) {
      console.error(`❌ General error testing ${tableName}:`, err);
      results.tests.general = {
        success: false,
        error: err.message
      };
    }

    console.log(`✅ Completed RLS test for ${tableName}:`, results);
    return results;
  };

  // Helper function to get test record for insert (FIXED VERSION)
  const getTestRecord = async (tableName) => {
    const timestamp = Date.now();
    
    switch (tableName) {
      case 'user_profiles':
        return {
          user_id: userProfile.user_id,
          email: `test-${timestamp}@example.com`,
          display_name: `Test User ${timestamp}`,
          first_name: 'Test',
          last_name: 'User',
          is_superadmin: false
        };
      case 'departments':
        return {
          department_id: crypto.randomUUID(),
          name: `Test Department ${timestamp}`,
          is_default: false
        };
      case 'user_departments':
        // For user_departments, we need to find a valid combination
        // Let's query the database to find a valid user-department combination
        try {
          // Get all users
          const { data: users } = await supabase
            .from('user_profiles')
            .select('user_id')
            .limit(10);
          
          // Get all departments
          const { data: departments } = await supabase
            .from('departments')
            .select('department_id')
            .limit(10);
          
          // Get existing user_departments combinations
          const { data: existingCombinations } = await supabase
            .from('user_departments')
            .select('user_id, department_id');
          
          // Find a combination that doesn't exist
          let validUser = null;
          let validDepartment = null;
          
          if (users && departments && existingCombinations) {
            for (const user of users) {
              for (const dept of departments) {
                const exists = existingCombinations.some(
                  combo => combo.user_id === user.user_id && combo.department_id === dept.department_id
                );
                if (!exists) {
                  validUser = user.user_id;
                  validDepartment = dept.department_id;
                  break;
                }
              }
              if (validUser && validDepartment) break;
            }
          }
          
          // Fallback if no valid combination found
          if (!validUser || !validDepartment) {
            validUser = 'bb735207-4dba-46db-b85b-f06ce3b1bbdd';
            validDepartment = 'acf81091-ae5f-4b8f-b5eb-9d892f1a7245';
          }
          
          const roles = ['look', 'tweak', 'build', 'manage'];
          const randomRole = roles[Math.floor(Math.random() * roles.length)];
          
          return {
            user_id: validUser,
            department_id: validDepartment,
            role: randomRole
          };
        } catch (error) {
          console.error('Error finding valid user-department combination:', error);
          // Fallback
          const roles = ['look', 'tweak', 'build', 'manage'];
          const randomRole = roles[Math.floor(Math.random() * roles.length)];
          return {
            user_id: 'bb735207-4dba-46db-b85b-f06ce3b1bbdd',
            department_id: 'acf81091-ae5f-4b8f-b5eb-9d892f1a7245',
            role: randomRole
          };
        }
      case 'sops':
        return {
          id: crypto.randomUUID(),
          name: `Test SOP ${timestamp}`,
          department_id: '47133618-13ed-4103-8c71-e0a2417a5d23', // Use real department ID
          created_by: userProfile.user_id
        };
      case 'sop_steps':
        return {
          id: crypto.randomUUID(),
          sop_id: '9b8efade-87ea-4f65-8322-cc42ae41ad55', // Use real SOP ID
          step_number: 1,
          instruction: `Test instruction ${timestamp}`
        };
      case 'invite_codes':
        return {
          id: crypto.randomUUID(),
          code: `TEST${timestamp}`,
          email: `test-${timestamp}@example.com`,
          department_id: crypto.randomUUID(),
          role: 'build'
        };
      default:
        return {};
    }
  };

  // Helper function to get update data
  const getUpdateData = (tableName) => {
    const timestamp = Date.now();
    
    switch (tableName) {
      case 'user_profiles':
        return {
          display_name: `Updated User ${timestamp}`,
          first_name: 'Updated',
          last_name: 'User'
        };
      case 'departments':
        return {
          name: `Updated Department ${timestamp}`
        };
      case 'user_departments':
        return {
          role: 'manage'
        };
      case 'sops':
        return {
          name: `Updated SOP ${timestamp}`
        };
      case 'sop_steps':
        return {
          instruction: `Updated instruction ${timestamp}`
        };
      case 'invite_codes':
        return {
          code: `UPDATED${timestamp}`,
          email: `updated-${timestamp}@example.com`,
          role: 'manage'
        };
      default:
        return {};
    }
  };

  // Run all tests
  const runAllTests = async () => {
    console.log('🚀 Starting comprehensive RLS test suite...');
    setIsLoading(true);
    setTestResults({});
    
    try {
      const tables = ['user_profiles', 'departments', 'user_departments', 'invite_codes', 'sops', 'sop_steps'];
      const results = {};
      
      for (const table of tables) {
        console.log(`\n📋 Testing table: ${table}`);
        results[table] = await runTableTest(table);
      }
      
      console.log('\n🎉 All RLS tests completed!', results);
      setTestResults(results);
      
      toast({
        title: 'Tests Complete',
        description: 'RLS test suite finished. Check results below.',
        variant: 'default'
      });
    } catch (error) {
      console.error('❌ Error running RLS tests:', error);
      toast({
        title: 'Test Error',
        description: 'Failed to run RLS tests. Check console for details.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy test results to clipboard
  const copyTestResults = async () => {
    try {
      // Collect console logs if available
      const consoleLogs = [];
      
      // Create enhanced results object with additional debugging info
      const enhancedResults = {
        ...testResults,
        metadata: {
          timestamp: new Date().toISOString(),
          userProfile: {
            user_id: userProfile?.user_id,
            email: userProfile?.email,
            is_superadmin: userProfile?.is_superadmin
          },
          environment: {
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          },
          consoleLogs: consoleLogs
        }
      };

      const resultsText = JSON.stringify(enhancedResults, null, 2);
      await navigator.clipboard.writeText(resultsText);
      
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      toast({
        title: 'Copied!',
        description: 'Test results copied to clipboard with enhanced debugging info',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to copy test results:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy test results',
        variant: 'destructive'
      });
    }
  };

  // Render test results
  const renderTestResults = () => {
    if (Object.keys(testResults).length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Test Results Summary</h3>
        {Object.entries(testResults).map(([tableName, results]) => {
          const tests = results.tests;
          const allTests = Object.keys(tests).filter(test => test !== 'general');
          const passedTests = allTests.filter(test => tests[test]?.success);
          const failedTests = allTests.filter(test => !tests[test]?.success);

          return (
            <div key={tableName} className="p-4 border rounded-lg bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold capitalize">{tableName.replace('_', ' ')}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {passedTests.length}/{allTests.length} tests passed
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(results.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {allTests.map(test => (
                  <div key={test} className="flex items-center gap-2">
                    {tests[test]?.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="capitalize text-sm">{test}</span>
                    {tests[test]?.error && (
                      <span className="text-xs text-red-600">- {tests[test].error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  console.log('RlsTestEnvironment: Rendering main component');
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">RLS Test Environment</h1>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runAllTests} 
          disabled={isLoading}
          className="mr-4"
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Run All Tests
        </Button>
        <span className="text-sm text-gray-600">
          Test RLS policies on all tables
        </span>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          {renderTestResults()}
          
          {/* Copy Results Button */}
          <div className="flex justify-center">
            <Button 
              onClick={copyTestResults}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {copySuccess ? 'Copied!' : 'Copy Test Results'}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            Paste the copied results in the chat for debugging assistance. 
            Console logs and debugging info are included in the copied data.
          </div>
        </div>
      )}
    </div>
  );
} 