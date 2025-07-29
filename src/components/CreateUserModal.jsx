/**
 * @fileoverview CreateUserModal Component - Provides a form interface for creating new users
 * with department assignments and permission levels.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { PERMISSION_LEVELS } from '../utils/permissions';
import { toast } from '@/components/ui/use-toast';

/**
 * Permission levels available in the system.
 * Ordered from least to most privileged.
 */
const AVAILABLE_PERMISSION_LEVELS = [
  { value: PERMISSION_LEVELS.LOOK, label: 'Look' },
  { value: PERMISSION_LEVELS.TWEAK, label: 'Tweak' },
  { value: PERMISSION_LEVELS.BUILD, label: 'Build' },
  { value: PERMISSION_LEVELS.MANAGE, label: 'Admin' }
];

/**
 * CreateUserModal Component
 * 
 * A modal component for creating new users with department assignments and permissions.
 * Features include:
 * - Form validation
 * - Department selection
 * - Permission level assignment
 * - Real-time feedback
 * 
 * @param {Object} props
 * @param {Array} props.departments - List of available departments
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSuccess - Callback after successful user creation
 */
export function CreateUserModal({ departments, onClose, onSuccess }) {
  // 📝 Form State
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    permissionLevel: PERMISSION_LEVELS.LOOK,
    selectedDepartments: []
  });
  
  // ⚠️ Error Handling
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form
      const validationErrors = {};
      if (!formData.email) validationErrors.email = 'Email is required';
      if (!formData.firstName) validationErrors.firstName = 'First name is required';
      if (!formData.lastName) validationErrors.lastName = 'Last name is required';
      if (!formData.password) validationErrors.password = 'Password is required';
      if (formData.password && formData.password.length < 6) validationErrors.password = 'Password must be at least 6 characters';
      if (!formData.selectedDepartments.length) validationErrors.departments = 'Select at least one department';

      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        throw new Error('Please fill in all required fields');
      }

      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password, // Use the password from form
        options: { emailRedirectTo: 'https://sop-manager.vercel.app/' }
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
        });

      if (profileError) throw profileError;

      // Create department permissions
      const departmentPermissions = formData.selectedDepartments.map(deptId => ({
        user_id: authData.user.id,
        department_id: deptId,
        role: formData.permissionLevel
      }));

      const { error: permError } = await supabase
        .from('user_departments')
        .insert(departmentPermissions);

      if (permError) throw permError;

      toast({
        title: "Success",
        description: "User created successfully. They will receive a confirmation email to activate their account.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      if (!Object.keys(errors).length) {
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className={errors.password ? 'border-red-500' : ''}
              placeholder="Minimum 6 characters"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Permission Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Permission Level</label>
            <div className="space-y-2">
              {AVAILABLE_PERMISSION_LEVELS.map(level => (
                <label key={level.value} className="flex items-center">
                  <input
                    type="radio"
                    name="permissionLevel"
                    value={level.value}
                    checked={formData.permissionLevel === level.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, permissionLevel: e.target.value }))}
                    className="mr-2"
                  />
                  {level.label}
                </label>
              ))}
            </div>
          </div>

          {/* Departments */}
          <div>
            <label className="block text-sm font-medium mb-2">Departments</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {departments.map(dept => (
                <label key={dept.department_id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedDepartments.includes(dept.department_id)}
                    onChange={(e) => {
                      const deptId = dept.department_id;
                      setFormData(prev => ({
                        ...prev,
                        selectedDepartments: e.target.checked
                          ? [...prev.selectedDepartments, deptId]
                          : prev.selectedDepartments.filter(id => id !== deptId)
                      }));
                    }}
                    className="mr-2"
                  />
                  {dept.name}
                </label>
              ))}
            </div>
            {errors.departments && <p className="text-red-500 text-sm mt-1">{errors.departments}</p>}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              style={{ position: 'relative', zIndex: 10000 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ position: 'relative', zIndex: 10000 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 