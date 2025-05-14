import React from "react";

export default function SOPCard({ sop, thumbnail, onClick, onImageClick }) {
  return (
    <div
      className="border rounded-lg p-2 shadow cursor-pointer hover:shadow-md transition duration-150 bg-white"
      onClick={onClick}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt="SOP thumbnail"
          className="w-24 h-24 object-cover mx-auto rounded mb-2 border border-gray-300"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(thumbnail);
          }}
        />
      ) : (
        <div className="w-24 h-24 bg-gray-200 flex items-center justify-center mx-auto rounded mb-2">
          <span className="text-gray-500 text-sm">No Image</span>
        </div>
      )}
      <h2 className="font-semibold text-center text-gray-800 text-sm">{sop.name}</h2>
      {sop.description && (
        <p className="text-xs text-gray-500 text-center mt-1">{sop.description}</p>
      )}
    </div>
  );
}
