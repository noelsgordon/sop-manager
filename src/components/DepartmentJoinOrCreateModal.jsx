import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../supabaseClient";
import { Loader2 } from "lucide-react";

// Function to fix the primary key constraint
async function fixPrimaryKeyConstraint() {
  try {
    // First try to drop the old constraint
    await supabase.rpc('drop_constraint', {
      table_name: 'user_departments',
      constraint_name: 'user_companies_pkey'
    });
    
    // Then add the correct primary key
    await supabase.rpc('add_primary_key', {
      table_name: 'user_departments',
      column_names: ['user_id', 'department_id']
    });
    
    return true;
  } catch (error) {
    console.error('Error fixing constraint:', error);
    return false;
  }
}

export default function DepartmentJoinOrCreateModal({ email, userId, onClose }) {
  const [inviteCode, setInviteCode] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("join"); // "join" or "create"
  const [loading, setLoading] = useState(false);

  // Function to normalize role values
  const normalizeRole = (role) => {
    const roleMap = {
      'look': 'look',
      'tweak': 'tweak',
      'build': 'build',
      'manage': 'manage',
      'viewer': 'look',
      'updater': 'tweak',
      'creator': 'build',
      'admin': 'manage',
      'superadmin': 'manage'
    };
    return roleMap[role.toLowerCase()] || 'look';
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Log the current user's email for debugging
      console.log("Current user email:", email);
      console.log("Current user ID:", userId);
      console.log("Searching for invite code:", inviteCode);

      // Get all invite codes for this user and code
      const { data: invites, error: inviteError } = await supabase
        .from("invite_codes")
        .select("id, department_id, role, email, code")
        .eq("code", inviteCode)
        .eq("email", email.toLowerCase());

      if (inviteError) {
        console.error("Invite code error:", inviteError);
        setError(`Invalid invite code: ${inviteError.message}`);
        return;
      }

      if (!invites || invites.length === 0) {
        console.error("No matching invites found");
        setError("Invalid invite code or email does not match");
        return;
      }

      console.log("Found matching invites:", invites);

      // Join all departments
      let joinErrors = [];
      let joinedCount = 0;
      for (const invite of invites) {
        console.log(`Attempting to join department: ${invite.department_id}`);
        
        // Check if already a member
        const { data: existingMembers } = await supabase
          .from("user_departments")
          .select("*")
          .eq("user_id", userId)
          .eq("department_id", invite.department_id);

        if (existingMembers && existingMembers.length > 0) {
          console.log(`Already a member of department ${invite.department_id}`);
          continue;
        }

        // Delete any existing memberships for this department
        const { error: deleteError } = await supabase
          .from("user_departments")
          .delete()
          .eq("user_id", userId)
          .eq("department_id", invite.department_id);

        if (deleteError) {
          console.error(`Failed to delete existing membership: ${deleteError.message}`);
        }

        // Wait a moment to ensure deletion is processed
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Normalize the role before inserting
        const normalizedRole = normalizeRole(invite.role);
        console.log(`Normalizing role from ${invite.role} to ${normalizedRole}`);

        // Insert new membership
        const { error: joinError } = await supabase
          .from("user_departments")
          .insert({
            user_id: userId,
            department_id: invite.department_id,
            role: normalizedRole
          });

        if (joinError) {
          console.error(`Failed to join department ${invite.department_id}:`, joinError);
          joinErrors.push(joinError.message);
        } else {
          console.log(`Successfully joined department ${invite.department_id}`);
          joinedCount++;
          
          // Delete the used invite code
          const { error: deleteError } = await supabase
            .from("invite_codes")
            .delete()
            .eq("id", invite.id);

          if (deleteError) {
            console.error(`Failed to delete invite code ${invite.id}:`, deleteError);
          }
        }
      }

      if (joinErrors.length > 0) {
        if (joinErrors.length === invites.length) {
          setError(`Failed to join departments: ${joinErrors.join(", ")}`);
          return;
        } else if (joinedCount === 0) {
          setError("You are already a member of all these departments");
          return;
        }
      }

      onClose();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!departmentName.trim()) {
        setError("Department name is required");
        return;
      }

      console.log("Creating department:", departmentName);
      const { data: department, error: deptError } = await supabase
        .from("departments")
        .insert({
          name: departmentName.trim(),
          created_by: userId
        })
        .select()
        .single();

      if (deptError) {
        console.error("Department creation error:", deptError);
        setError(`Failed to create department: ${deptError.message}`);
        return;
      }

      if (!department) {
        console.error("No department returned after creation");
        setError("Failed to create department: No department returned");
        return;
      }

      console.log("Department created:", department);
      console.log("Attempting to join as super user");

      // Delete any existing memberships for this department
      const { error: deleteError } = await supabase
        .from("user_departments")
        .delete()
        .eq("user_id", userId)
        .eq("department_id", department.department_id);

      if (deleteError) {
        console.error(`Failed to delete existing membership: ${deleteError.message}`);
      }

      // Wait a moment to ensure deletion is processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { error: joinError } = await supabase
        .from("user_departments")
        .insert({
          user_id: userId,
          department_id: department.department_id,
          role: "manage"
        });

      if (joinError) {
        console.error("Join error:", joinError);
        setError(`Failed to join department: ${joinError.message}`);
        return;
      }

      console.log("Successfully joined as super user");
      onClose();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    setLoading(true);
    try {
      // Verify the invite code
      const { data: invites, error: inviteError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inviteCode)
        .eq('email', email.toLowerCase());

      if (inviteError) throw inviteError;
      if (!invites || invites.length === 0) {
        setError('Invalid invite code');
        return;
      }

      const invite = invites[0];

      // Add user to department
      const { error: membershipError } = await supabase
        .from('user_departments')
        .insert({
          user_id: userId,
          department_id: invite.department_id,
          role: invite.role || 'look'
        });

      if (membershipError) throw membershipError;

      // Delete the used invite code
      const { error: deleteError } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', invite.id);

      if (deleteError) {
        console.error('Failed to delete invite code:', deleteError);
        // Don't throw here, as the user is already added to the department
      }

      onClose();
    } catch (err) {
      console.error('Error joining department:', err);
      setError('Failed to join department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Join or Create Department</h2>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Select Mode:</label>
          <label className="block">
            <input 
              type="radio" 
              name="mode" 
              value="join" 
              checked={mode === "join"} 
              onChange={() => {
                setMode("join");
                setError("");
              }} 
              className="mr-2" 
            />
            Use Invite Code
          </label>
          <label className="block mt-1">
            <input 
              type="radio" 
              name="mode" 
              value="create" 
              checked={mode === "create"} 
              onChange={() => {
                setMode("create");
                setError("");
              }} 
              className="mr-2" 
            />
            Create New Department
          </label>
        </div>

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium mb-1">Invite Code</label>
              <Input
                id="inviteCode"
                name="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.trim())}
                placeholder="Enter invite code"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} />Joining...</> : "Join Department"}
            </Button>
          </form>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="departmentName" className="block text-sm font-medium mb-1">Department Name</label>
              <Input
                id="departmentName"
                name="departmentName"
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Enter department name"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} />Creating...</> : "Create Department"}
            </Button>
          </form>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" className="mr-2" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
