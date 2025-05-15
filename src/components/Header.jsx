// Header.jsx
import React from "react";
import version from "../../version.json";

export default function Header({ userRole, setUserRole, setViewMode }) {
  return (
    <header className="mb-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold hidden md:block">
          Computer SOPs
          <span className="ml-2 text-xs italic text-gray-400 align-baseline">v{version.version}</span>
        </h1>
      </div>
      <div className="flex flex-row sm:flex-col sm:space-y-2 space-x-2 sm:space-x-0">
        {["Viewer", "Updater", "Creator"].map((role) => (
          <button
            key={role}
            className={`w-[30%] sm:w-full px-3 py-1 rounded text-sm ${
              userRole === role ? "bg-blue-600 text-white" : "bg-gray-300"
            }`}
            onClick={() => {
              setUserRole(role);
              setViewMode(null);
            }}
          >
            {role}
          </button>
        ))}
      </div>
    </header>
  );
}
