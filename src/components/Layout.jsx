// Layout.jsx
import React, { useState } from "react";
import { Menu } from "lucide-react";
import version from "../../version.json";

export default function Layout({ sidebar, topbar, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden p-2 border-b shadow flex justify-between items-center bg-gray-100">
        <h1 className="font-bold text-lg">
          SOP Platform
          <span className="ml-2 text-[10px] italic text-gray-400">v{version.version}</span>
        </h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block md:w-64 bg-gray-100 p-4 border-r shadow-lg md:shadow-none`}
      >
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        <div>{topbar}</div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {React.Children.toArray(children)
            .filter((child) => React.isValidElement(child))
            .map((child, idx) => (
              <div
                key={idx}
                className="w-full min-w-[260px] md:min-w-[468px] lg:min-w-[624px] mx-auto"
              >
                {React.cloneElement(child, {
                  className: `${child.props.className || ""} w-full h-auto rounded`,
                })}
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
