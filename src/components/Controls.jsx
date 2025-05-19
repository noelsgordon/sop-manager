// Controls.jsx
import React from "react";

export default function Controls({ userRole, setViewMode, setProcessName, setDescription, setTags, setSteps, setIsEditing, setEditSopId }) {
  return (
    <div className="flex space-x-2 mt-4">
      <button onClick={() => setViewMode("library")} className="bg-green-500 text-white px-3 py-1 rounded">Library</button>
      <button onClick={() => setViewMode("search")} className="bg-yellow-500 text-white px-3 py-1 rounded">Search</button>
      {userRole === "Creator" && (
        <button
          onClick={() => {
            setProcessName("");
            setDescription("");
            setTags([]);
            setSteps([{ step_number: 1, instruction: "", tools: "", parts: "", photo: "" }]);
            setIsEditing(false);
            setEditSopId(null);
            setViewMode("wizard");
          }}
          className="bg-purple-600 text-white px-3 py-1 rounded"
        >
          New
        </button>
      )}
    </div>
  );
}
