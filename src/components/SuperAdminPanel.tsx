import React, { Component, useEffect, useState } from 'react';

interface SuperAdminPanelProps {}

const SuperAdminPanel = () => {
  const [activeSection, setActiveSection] = useState('');
  const [sections] = useState(['User Management', 'Admin Panel', 'Backup']);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced Debug Logger
  const logDebug = (location: string, data: any, type: 'info' | 'warning' | 'error' | 'function' | 'effect' | 'success' = 'info') => {
    const debugInfo = {
      ...data,
      timestamp: new Date().toISOString(),
      component: 'SuperAdminPanel',
      location,
      type,
      state: {
        activeSection,
        sections,
        isLoading
      }
    };
    console.log(`[SuperAdminPanel Debug ${location}]`, debugInfo);
    
    // Log to debug history for tracing
    if (!(window as any)._superAdminDebugHistory) {
      (window as any)._superAdminDebugHistory = [];
    }
    (window as any)._superAdminDebugHistory.push(debugInfo);
  };

  // Debug utility to trace state change history
  const getDebugHistory = () => {
    return (window as any)._superAdminDebugHistory || [];
  };

  // Clear debug history
  const clearDebugHistory = () => {
    (window as any)._superAdminDebugHistory = [];
  };

  // Add debug utilities to window for console access
  useEffect(() => {
    (window as any)._superAdminDebug = {
      getHistory: getDebugHistory,
      clearHistory: clearDebugHistory,
      getCurrentState: () => ({
        activeSection,
        sections,
        isLoading
      })
    };
  }, [activeSection, sections, isLoading]);

  // Section change handler with enhanced debugging
  const handleSectionChange = (section: string) => {
    try {
      logDebug('handleSectionChange Entry', {
        requestedSection: section,
        currentSection: activeSection,
        stack: new Error().stack
      }, 'function');

      if (section === activeSection) {
        logDebug('Section Change Skipped', {
          reason: 'Already in requested section',
          section
        }, 'warning');
        return;
      }

      logDebug('Changing Section', {
        from: activeSection,
        to: section
      }, 'function');

      setActiveSection(section);
      
      logDebug('Section Change Complete', {
        newSection: section
      }, 'success');
    } catch (error: any) {
      logDebug('Section Change Error', {
        error: error.message,
        stack: error.stack
      }, 'error');
      console.error('Section change failed:', error);
    }
  };

  // Section change effect
  useEffect(() => {
    logDebug('Section Change Effect', {
      activeSection,
      sections,
      stack: new Error().stack
    }, 'effect');
  }, [activeSection, sections]);

  // Initial section setup effect
  useEffect(() => {
    try {
      logDebug('Initial Section Setup', {
        sections,
        defaultSection: sections[0],
        stack: new Error().stack
      }, 'effect');

      if (!activeSection && sections.length > 0) {
        setActiveSection(sections[0]);
        logDebug('Default Section Set', {
          section: sections[0]
        }, 'success');
      }
    } catch (error: any) {
      logDebug('Initial Setup Error', {
        error: error.message,
        stack: error.stack
      }, 'error');
      console.error('Initial section setup failed:', error);
    }
  }, []);

  return (
    <div className="super-admin-panel">
      <div className="section-navigation">
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => handleSectionChange(section)}
            className={`section-button ${activeSection === section ? 'active' : ''}`}
          >
            {section}
          </button>
        ))}
      </div>

      <div className="section-content">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div>
            {activeSection === 'User Management' && <div>User Management Content</div>}
            {activeSection === 'Admin Panel' && <div>Admin Panel Content</div>}
            {activeSection === 'Backup' && <div>Backup Content</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel; 