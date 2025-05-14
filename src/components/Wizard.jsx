import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TagInput from "./TagInput";

export default function Wizard({
  processName, description, tags, steps,
  onChangeStep, onAddStep, onDeleteStep, onMoveStepUp, onMoveStepDown,
  onUpload, onSave, onUpdate,
  setProcessName, setDescription, setTags,
  onImageClick,
  isUpdateMode,
  selectedSop
}) {
  useEffect(() => {
    if (isUpdateMode && selectedSop) {
      setProcessName(selectedSop.name || "");
      setDescription(selectedSop.description || "");
      setTags(selectedSop.tags ? selectedSop.tags.split(",") : []);
    }
  }, [isUpdateMode, selectedSop]);

  return (
    <div>
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
      <TagInput tags={tags} setTags={setTags} />
      <AnimatePresence>
        {steps.map((step, index) => (
          <motion.div
            key={step.id || index}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
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
          </motion.div>
        ))}
      </AnimatePresence>
      <button onClick={onAddStep} className="bg-gray-600 text-white px-3 py-1 rounded mr-2">Add Step</button>
      {isUpdateMode ? (
        <button onClick={onUpdate} className="bg-yellow-600 text-white px-3 py-1 rounded">Update SOP</button>
      ) : (
        <button onClick={onSave} className="bg-blue-700 text-white px-3 py-1 rounded">Save SOP</button>
      )}
    </div>
  );
}
