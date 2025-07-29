// Wizard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion"; // Removed to fix build issues
import TagInput from "./TagInput";

export default function Wizard({
  sop,
  onChangeStep, onAddStep, onDeleteStep, onMoveStepUp, onMoveStepDown,
  onUpload, onSave, onUpdate, onCancel,
  setProcessName, setDescription, setTags,
  onImageClick,
  isUpdateMode,
  userCompanies,
  selectedCompanyId,
  setSelectedCompanyId
}) {
  // Validate SOP object
  if (!sop) {
    console.error("No SOP object provided to Wizard");
    return <div className="p-4 text-red-600">Error: No SOP data available</div>;
  }

  if (!Array.isArray(sop.steps)) {
    console.error("SOP steps is not an array:", sop.steps);
    return <div className="p-4 text-red-600">Error: Invalid SOP data structure</div>;
  }

  const bottomRef = useRef();
  const initializedRef = useRef(false);
  const previousStepCount = useRef(sop.steps.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Example: processName, description, tags are now from sop
  const processName = sop.name || "";
  const description = sop.description || "";
  const tags = Array.isArray(sop.tags) ? sop.tags : (typeof sop.tags === 'string' ? sop.tags.split(",").filter(tag => tag.trim()) : []);

  useEffect(() => {
    if (isUpdateMode && sop && !initializedRef.current) {
      setProcessName(sop.name || "");
      setDescription(sop.description || "");
      setTags(Array.isArray(sop.tags) ? sop.tags : (typeof sop.tags === 'string' ? sop.tags.split(",") : []));
      // Use prop for company selection
      setSelectedCompanyId(sop.company_id || sop.department_id || "");
      initializedRef.current = true;
    }
    if (!isUpdateMode && userCompanies && userCompanies.length === 1) {
      setSelectedCompanyId(userCompanies[0].department_id);
    }
  }, [isUpdateMode, sop?.name, sop?.description, sop?.tags, sop?.company_id, sop?.department_id, userCompanies, setProcessName, setDescription, setTags, setSelectedCompanyId]);

  useEffect(() => {
    if (sop.steps.length > previousStepCount.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    previousStepCount.current = sop.steps.length;
  }, [sop.steps.length]);

  const handleSave = async () => {
    setError("");
    if (!selectedCompanyId) {
      setError("⚠ Please assign a company before saving.");
      return;
    }
    setLoading(true);
    try {
      await (isUpdateMode ? onUpdate() : onSave());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {(isUpdateMode || !isUpdateMode) && (
        <div className="flex items-center justify-between bg-yellow-100 border border-yellow-300 rounded p-2 mb-4">
          <span className="font-bold text-yellow-800">{isUpdateMode ? 'Edit Mode' : 'New SOP'}</span>
          <div className="flex gap-2">
            {isUpdateMode && (
              <Button variant="outline" onClick={onCancel} className="border-yellow-500 text-yellow-700">Cancel</Button>
            )}
            <Button onClick={handleSave} className={isUpdateMode ? "bg-yellow-600 text-white" : "bg-blue-700 text-white"}>
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  {isUpdateMode ? "Updating..." : "Saving..."}
                </span>
              ) : (
                isUpdateMode ? "Save Changes" : "Save SOP"
              )}
            </Button>
          </div>
        </div>
      )}
      {userCompanies && userCompanies.length > 1 && (
        <div className="mb-2">
          <label className="block mb-1 font-medium">Assign SOP to a company:</label>
          <select
            value={selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Select a company --</option>
            {userCompanies.map((company) => (
              <option key={company.id || company.department_id} value={company.id || company.department_id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <input
        className="border p-2 w-full mb-2"
        placeholder="Process Name"
        value={processName}
        onChange={(e) => setProcessName(e.target.value)}
      />
      <textarea
        className="border p-2 w-full mb-2"
        placeholder="Brief Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <TagInput tags={tags} setTags={setTags} placeholder="Add tags here... e.g. department, boat model, alternate part/product names, etc" />
      <div>
        {sop.steps.map((step, index) => (
          <div
            key={step.id || index}
            className="border-2 border-gray-300 bg-gray-50 p-2 mb-4 rounded"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Step {index + 1}</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onMoveStepUp(index)}><ArrowUp size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => onMoveStepDown(index)}><ArrowDown size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteStep(index)}><Trash2 size={16} /></Button>
              </div>
            </div>
            <textarea
              className="border p-2 w-full mb-1"
              placeholder="Instruction"
              value={step.instruction}
              onChange={(e) => onChangeStep(index, "instruction", e.target.value)}
            />
            <textarea
              className="border p-2 w-full mb-1"
              placeholder="Tools"
              value={step.tools}
              onChange={(e) => onChangeStep(index, "tools", e.target.value)}
            />
            <textarea
              className="border p-2 w-full mb-1"
              placeholder="Parts"
              value={step.parts}
              onChange={(e) => onChangeStep(index, "parts", e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                onUpload(index, e.target.files[0]);
                e.target.value = null;
              }}
            />
            {step.photo && step.photo.includes("http") ? (
              <img
                src={step.photo}
                onClick={() => onImageClick(step.photo)}
                className="w-24 h-24 object-cover rounded mx-auto cursor-pointer mt-2"
                alt="uploaded"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 flex items-center justify-center mx-auto rounded mt-2">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div ref={bottomRef} />

      {error && <p className="text-red-600 font-medium mb-2">{error}</p>}

      <button onClick={onAddStep} className="bg-gray-600 text-white px-3 py-1 rounded mr-2">Add Step</button>
    </div>
  );
}
