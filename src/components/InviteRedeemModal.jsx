// InviteRedeemModal.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InviteRedeemModal({ email, onComplete, onClose }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleRedeem = async () => {
    setStatus("loading");
    setErrorMsg("");

    const trimmedCode = code.trim().toUpperCase();

    // Start a Supabase transaction
    const { data: invite, error: inviteError } = await supabase
      .from("invite_codes")
      .select("department_id, role, email")
      .eq("code", trimmedCode)
      .single();

    if (inviteError || !invite) {
      setStatus("error");
      setErrorMsg("Invalid invite code.");
      return;
    }

    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      setStatus("error");
      setErrorMsg("Email does not match invite.");
      return;
    }

    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;

    if (!userId) {
      setStatus("error");
      setErrorMsg("No active user session found.");
      return;
    }

    // Check if department exists
    const { data: deptCheck } = await supabase
      .from("departments")
      .select("id")
      .eq("id", invite.department_id)
      .single();

    if (!deptCheck) {
      setStatus("error");
      setErrorMsg("Invalid department. Please contact your administrator.");
      return;
    }

    // Check if user already has access to this department
    const { data: existingAccess } = await supabase
      .from("user_departments")
      .select("id")
      .eq("user_id", userId)
      .eq("department_id", invite.department_id)
      .single();

    if (existingAccess) {
      setStatus("error");
      setErrorMsg("You already have access to this department.");
      return;
    }

    // Insert user_departments record
    const { error: joinError } = await supabase.from("user_departments").insert({
      user_id: userId,
      department_id: invite.department_id,
      role: invite.role,
    });

    if (joinError) {
      setStatus("error");
      setErrorMsg("Failed to join department. Please try again.");
      return;
    }

    // Delete the used invite code
    const { error: deleteError } = await supabase
      .from("invite_codes")
      .delete()
      .eq("code", trimmedCode)
      .eq("email", email.toLowerCase());

    if (deleteError) {
      console.error("Failed to delete invite code:", deleteError);
      // Don't fail the operation if delete fails
    }

    setStatus("success");
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Enter Invite Code</h2>

        <input
          className="border p-2 w-full rounded mb-2"
          placeholder="Invite Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={status === "loading"}
        />

        {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onClose} disabled={status === "loading"}>
            Cancel
          </Button>
          <Button onClick={handleRedeem} disabled={status === "loading"}>
            {status === "loading" ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin mr-2" size={16} />
                Verifying...
              </span>
            ) : (
              "Submit"
            )}
          </Button>
        </div>

        {status === "success" && (
          <p className="text-green-600 text-sm mt-3">
            Invite accepted! You've been linked to your department.
          </p>
        )}
      </div>
    </div>
  );
}
