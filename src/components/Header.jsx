// Header.jsx - updated with spacing and separator
import React from "react";

export default function Header({ userRole, setUserRole, setViewMode }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-bold hidden md:block">Computer SOPs</h1>
      <hr className="my-4 border-gray-300 hidden md:block" />
      <div className="flex flex-row sm:flex-col sm:space-y-2 space-x-2 sm:space-x-0 mt-4">
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