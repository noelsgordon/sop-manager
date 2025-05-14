// SOPDetail.jsx - updated with fallback "No Image" placeholder
import React from "react";

export default function SOPDetail({ steps, onImageClick }) {
  if (!steps || !Array.isArray(steps)) return <p className="text-red-500">Error loading SOP details.</p>;

  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div key={index} className="border p-4 rounded shadow-sm bg-white">
          <h3 className="text-lg font-semibold mb-2">Step {step.step_number}</h3>

          {step.instruction && (
            <p><span className="font-semibold">Instruction:</span> {step.instruction}</p>
          )}

          {step.tools && (
            <p><span className="font-semibold">Tools:</span> {step.tools}</p>
          )}

          {step.parts && (
            <p><span className="font-semibold">Parts:</span> {step.parts}</p>
          )}

            {step.photo && step.photo.includes("http") ? (
              <img
                src={step.photo}
                alt="Step visual"
                className="w-24 h-24 object-cover mt-2 rounded cursor-pointer mx-auto"
                onClick={() => onImageClick(step.photo)}
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 flex items-center justify-center mx-auto rounded mt-2">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}

        </div>
      ))}
    </div>
  );
}