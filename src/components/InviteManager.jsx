import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { departmentCache } from '../utils/departmentCache';

export default function InviteManager({ currentUserId, departments }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("look");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [linkedDepartmentCount, setLinkedDepartmentCount] = useState(0);
  const [inviteList, setInviteList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);

  const fetchInvites = async () => {
    if (!departments?.length) return;
    
    setIsLoadingInvites(true);
    try {
      const { data: invites, error: inviteError } = await supabase
        .from("invite_codes")
        .select("*")
        .in("department_id", departments.map((d) => d.department_id))
        .order("created_at", { ascending: false });

      if (inviteError) {
        console.error("Error fetching invites:", inviteError);
        setError("Failed to fetch invites. Please try again.");
        return;
      }

      // Get department details using the cache
      const deptIds = invites?.map(i => i.department_id) || [];
      const deptDetails = await departmentCache.getDepartments(deptIds);

      // Create a map of department IDs to names
      const deptNameMap = new Map(deptDetails?.map(d => [d?.department_id, d?.name]) || []);

      // Add department names to invites
      const enrichedInvites = (invites || []).map(invite => ({
        ...invite,
        departments: { name: deptNameMap.get(invite.department_id) ?? 'Unknown Department' }
      }));

      setInviteList(enrichedInvites);
      setError("");
    } catch (err) {
      console.error("Error in fetchInvites:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [departments]);

  const generateCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

  const handleToggleDepartment = (departmentId) => {
    setSelectedDepartments((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const handleSendInvite = async () => {
    if (!email) {
      setError("Please enter an email.");
      return;
    }

    if (selectedDepartments.length === 0) {
      setError("Please select at least one department.");
      return;
    }

    setLoading(true);
    setError("");
    const code = generateCode();
    let success = true;
    let atLeastOneInserted = false;

    try {
      for (const departmentId of selectedDepartments) {
        const { data: existing } = await supabase
          .from("invite_codes")
          .select("id")
          .eq("email", email.toLowerCase())
          .eq("department_id", departmentId)
          .maybeSingle();

        if (existing) {
          console.warn(`⚠️ Invite already exists for ${email} in ${departmentId}`);
          continue;
        }

        const payload = {
          code,
          email: email.toLowerCase(),
          role,
          department_id: departmentId,
          created_by: currentUserId,
        };

        console.log("📤 Inserting payload:", payload);

        const { error } = await supabase.from("invite_codes").insert(payload);

        if (error) {
          console.error("❌ Insert failed for department:", departmentId, error);
          success = false;
        } else {
          atLeastOneInserted = true;
        }

        await new Promise((res) => setTimeout(res, 100));
      }

      if (atLeastOneInserted) {
        setGeneratedCode(code);
        setLinkedDepartmentCount(selectedDepartments.length);
        setEmail("");
        setRole("look");
        setSelectedDepartments([]);
        await fetchInvites();
        setError("");
      } else {
        setError("No new invites were created (they may already exist).");
      }
    } catch (err) {
      console.error("Error in handleSendInvite:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("invite_codes")
        .delete()
        .eq("id", inviteId);

      if (error) {
        console.error("Failed to delete invite:", error);
        setError("Failed to delete invite. Please try again.");
        return;
      }

      await fetchInvites();
      setError("");
    } catch (err) {
      console.error("Error in handleDeleteInvite:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!departments?.length) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">No departments available. Please create a department first.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
      <h3 className="text-lg font-semibold">Invite a New User</h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <input
        className="border w-full p-2 rounded"
        placeholder="Invitee Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />

      <select
        className="border w-full p-2 rounded"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={loading}
      >
        <option value="look">Look</option>
        <option value="tweak">Tweak</option>
        <option value="build">Build</option>
        <option value="manage">Manage</option>
      </select>

      <div className="border p-2 rounded">
        <p className="font-medium mb-2">Select Departments:</p>
        {departments.map((d) => (
          <label key={d.department_id} className="flex items-center mb-1">
            <input
              type="checkbox"
              checked={selectedDepartments.includes(d.department_id)}
              onChange={() => handleToggleDepartment(d.department_id)}
              className="mr-2"
              disabled={loading}
            />
            {d.name}
          </label>
        ))}
      </div>

      <Button
        onClick={handleSendInvite}
        className="w-full"
        disabled={loading || !email || selectedDepartments.length === 0}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2" size={16} />
            Generating...
          </>
        ) : (
          "Generate Invite Code"
        )}
      </Button>

      {generatedCode && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-medium">Invite Code Generated!</p>
          <p className="text-sm text-green-600 mt-1">
            Code: <span className="font-mono font-bold">{generatedCode}</span>
          </p>
          <p className="text-xs text-green-600 mt-1">
            This code will give access to {linkedDepartmentCount} department(s)
          </p>
        </div>
      )}

      {isLoadingInvites ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : inviteList.length > 0 ? (
        <div className="mt-6">
          <h4 className="font-medium mb-2">Active Invite Codes</h4>
          <div className="space-y-2">
            {inviteList.map((invite) => (
              <div
                key={invite.id}
                className="p-2 border rounded text-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-mono">{invite.code}</p>
                  <p className="text-gray-600 text-xs">
                    {invite.email} • {invite.role} • {invite.departments?.name}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteInvite(invite.id)}
                  disabled={loading}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
