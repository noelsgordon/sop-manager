// Header.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Archive, Home, Search as SearchIcon, Shield, UserCog } from "lucide-react";
import version from "../version.json";
import { useRoleBasedUI } from "../utils/hooks/useRoleBasedUI";
import { Checkbox } from "./ui/checkbox";

const NAV_ITEMS = [
  { key: "library", label: "Library", icon: Home },
  { key: "search", label: "Search", icon: SearchIcon },
  { key: "admin", label: "Admin Panel", icon: Shield, feature: "VIEW_ADMIN_PANEL" },
  { key: "superadmin", label: "SuperAdmin Panel", icon: UserCog, feature: "VIEW_ADMIN_PANEL", superOnly: true },
];

const Header = React.memo(({ 
  userRole,
  viewRole,
  changeViewRole,
  getActualRole,
  setViewMode, 
  isSuperAdmin: isSuperAdminProp,
  isLoading = false,
  roleLoading = false,
  showDeletedSOPs,
  setShowDeletedSOPs,
  activePanel,
  onNewSop,
  canCreateSop,
  onSidebarNav // <-- add this prop
}) => {
  // Remove visual confirmation and excessive debug logs to prevent render loop
  // document.body.style.background = '#ffeedd';
  // Top-level debug log for all props (log only once per mount)
  useEffect(() => {
    console.log('[Header Debug] Render', { activePanel, isSuperAdminProp, onNewSopType: typeof onNewSop, userRole, viewRole });
    console.log('[Header Debug] canShowFeature CREATE_SOP:', canShowFeature(FEATURE_PERMISSIONS.CREATE_SOP));
  }, []);

  // Use viewRole for UI visibility, but keep actual permissions for functionality
  const {
    canShowFeature,
    FEATURE_PERMISSIONS,
    switchableRoles,
  } = useRoleBasedUI({ 
    is_superadmin: isSuperAdminProp,
    role: viewRole || userRole
  }, null);

  // Get switchable roles based on actual user role (not view role)
  const { switchableRoles: actualSwitchableRoles } = useRoleBasedUI({
    is_superadmin: isSuperAdminProp,
    role: userRole
  }, null);

  // Debug canShowFeature for CREATE_SOP
  // console.log('[Header Debug] canShowFeature CREATE_SOP:', canShowFeature(FEATURE_PERMISSIONS.CREATE_SOP));

  // Navigation click handler
  const handleNav = (key) => {
    if (key === activePanel) return;
    if (key === "superadmin" && !isSuperAdminProp) return;
    if (key === "admin" && !canShowFeature(FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL)) return;
    setViewMode(key);
    if (typeof onSidebarNav === 'function') onSidebarNav(); // <-- auto-hide sidebar on mobile
  };

  // Role change handler
  const handleRoleChange = async (role) => {
    if (roleLoading || isLoading) return;
          await changeViewRole(role);
    setViewMode("library");
  };

  if (isLoading) {
    return (
      <aside className="flex flex-col h-full p-4 bg-white border-r items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span>Loading...</span>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full min-h-screen p-4 bg-white border-r justify-between">
      {/* Top: App Title/Logo */}
      <div>
        <div className="mb-8 text-center">
          <h1 className="font-bold text-2xl tracking-tight">Malibu SOPs</h1>
          <span className="text-xs text-gray-400">v{version.version}</span>
        </div>
        {/* Navigation */}
        <nav className="flex flex-col gap-2 mb-8">
          {NAV_ITEMS.map((item, idx) => {
            // Insert New SOP button after Search
            if (item.key === "search") {
              const canCreate = canShowFeature(FEATURE_PERMISSIONS.CREATE_SOP);
              // Only log once per mount
              if (typeof onNewSop === 'function' && canCreate) {
                return [
                  <button
                    key="new-sop"
                    onClick={onNewSop}
                    className="flex items-center gap-2 px-3 py-2 rounded transition hover:bg-green-100 text-green-700 font-semibold"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    New SOP
                  </button>,
                  renderNavButton(item, idx, activePanel, isSuperAdminProp, canShowFeature, FEATURE_PERMISSIONS, handleNav)
                ];
              }
            }
            return renderNavButton(item, idx, activePanel, isSuperAdminProp, canShowFeature, FEATURE_PERMISSIONS, handleNav);
          })}
        </nav>
        {/* Role Switcher & Toggles */}
        <div className="mb-8">
          <label className="block text-xs text-gray-500 mb-1">View Role</label>
        <select
          value={viewRole || userRole}
            onChange={e => handleRoleChange(e.target.value)}
          disabled={roleLoading}
            className="w-full border rounded px-2 py-1 mb-2"
        >
            {actualSwitchableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
          ))}
        </select>
          <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="showDeleted"
            checked={showDeletedSOPs}
            onCheckedChange={setShowDeletedSOPs}
          />
          <label htmlFor="showDeleted" className="text-sm cursor-pointer">
            Show Deleted SOPs
          </label>
          <Archive className="w-4 h-4" />
        </div>
      </div>
      </div>
      {/* Bottom: Version Info */}
      <div className="text-xs text-gray-400 text-center mt-auto">
        Version {version.version}
      </div>
    </aside>
  );
});

Header.displayName = 'Header';

export default Header;

// Helper to render nav button
function renderNavButton(item, idx, activePanel, isSuperAdminProp, canShowFeature, FEATURE_PERMISSIONS, handleNav) {
  // Hide SuperAdmin panel when view role is not superadmin
  if (item.key === "superadmin" && !isSuperAdminProp) return null;
  
  // Hide Admin panel when view role doesn't have admin access
  if (item.key === "admin" && !canShowFeature(FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL)) {
    return (
      <button key={item.key} className="flex items-center gap-2 px-3 py-2 rounded text-gray-400 bg-gray-100 cursor-not-allowed" disabled>
        <item.icon className="h-5 w-5" />
        {item.label}
      </button>
    );
  }
  
  return (
    <button
      key={item.key}
      onClick={() => handleNav(item.key)}
      className={`flex items-center gap-2 px-3 py-2 rounded transition ${activePanel === item.key ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}
      disabled={item.key === "admin" && !canShowFeature(FEATURE_PERMISSIONS.VIEW_ADMIN_PANEL)}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </button>
  );
}
