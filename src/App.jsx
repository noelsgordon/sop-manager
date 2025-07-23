// App.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XCircle, Pencil } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import "./index.css";

import Layout from "./components/Layout.jsx";
import Header from "./components/Header.jsx";
import Controls from "./components/Controls.jsx";
import SOPCard from "./components/SOPCard.jsx";
import Wizard from "./components/Wizard.jsx";
import SOPDetail from "./components/SOPDetail.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import SuperAdminPanel from "./components/admin/SuperAdminPanel";
import BackupManager from "./components/admin/BackupManager/index.jsx";
import DepartmentJoinOrCreateModal from "./components/DepartmentJoinOrCreateModal.jsx";
import { compressImage } from "./utils/imageCompression.js";
import Login from "./components/Login.jsx";
import ResetPassword from './components/ResetPassword';
import { departmentCache } from './utils/departmentCache';
import { useUserState } from './utils/hooks/useUserState';
import { PERMISSION_LEVELS } from './utils/permissions';
import { isAdminOrSuper, isSuperAdmin } from './utils/roleHelpers';
import { isValidSteps } from './utils/validation';
import { SupabaseProvider } from './utils/supabaseContext';
import { Toaster } from './components/ui/toaster';
import { useRoleBasedUI } from './utils/hooks/useRoleBasedUI';
import { toast } from './components/ui/use-toast';

function MainApp({ session, setSession }) {
  // 📄 Initialize all state first
  const [activePanel, setActivePanel] = useState("library");
  const [activeSop, setActiveSop] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sops, setSops] = useState([]);
  const [sopThumbnails, setSopThumbnails] = useState({});
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [prevPanel, setPrevPanel] = useState("library");
  const [isEditing, setIsEditing] = useState(false);
  const [editSopId, setEditSopId] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sopToDelete, setSopToDelete] = useState(null);
  const [showDeletedSOPs, setShowDeletedSOPs] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState(null);
  const [draftSop, setDraftSop] = useState(null);
  
  // Debug admin view mode changes
  useEffect(() => {
    console.log('adminViewMode changed:', adminViewMode);
  }, [adminViewMode]);

  // 🔄 User State Management
  const {
    userProfile,
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    isSuperAdmin: userIsSuperAdmin,
    isLoading,
    error: userError,
    changeRole,
    changeViewRole,
    getCurrentRole,
    getActualRole,
    getDebugState,
    roleLoading,
    viewRole
  } = useUserState(session);

  // Get role-based permissions at component level
  const { canShowFeature, FEATURE_PERMISSIONS } = useRoleBasedUI(
    { 
      ...userProfile, 
      role: getCurrentRole(),
      is_superadmin: userIsSuperAdmin 
    },
    selectedDepartmentId
  );

  // Enhanced Debug Logger
  const logStateDebug = useCallback((location, data, type = 'info') => {
    const debugInfo = {
      ...data,
      timestamp: new Date().toISOString(),
      component: 'App',
      location,
      type,
      state: {
        activePanel,
        userRole: getCurrentRole(),
        actualRole: getActualRole(),
        viewRole,
        isSuperAdmin: userIsSuperAdmin,
        isLoading,
        roleLoading,
        departments,
        userProfile
      }
    };
    console.log(`[App Debug ${location}]`, debugInfo);
    
    if (!window._appDebugHistory) {
      window._appDebugHistory = [];
    }
    window._appDebugHistory.push(debugInfo);
  }, [
    activePanel,
    getCurrentRole,
    getActualRole,
    viewRole,
    userIsSuperAdmin,
    isLoading,
    roleLoading,
    departments,
    userProfile
  ]);

  // Memoized callback functions for Wizard component
  const onDeleteStep = useCallback((index) => setActiveSop(sop => ({ ...sop, steps: sop.steps.filter((_, i) => i !== index) })), [setActiveSop]);
  const onMoveStepUp = useCallback((index) => setActiveSop(sop => {
    if (index === 0) return sop;
    const newSteps = [...sop.steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    return { ...sop, steps: newSteps };
  }), [setActiveSop]);
  const onMoveStepDown = useCallback((index) => setActiveSop(sop => {
    if (index === sop.steps.length - 1) return sop;
    const newSteps = [...sop.steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    return { ...sop, steps: newSteps };
  }), [setActiveSop]);
  const setProcessName = useCallback(name => setActiveSop(sop => ({ ...sop, name })), [setActiveSop]);
  const setDescription = useCallback(desc => setActiveSop(sop => ({ ...sop, description: desc })), [setActiveSop]);
  const setTags = useCallback(tags => setActiveSop(sop => ({ ...sop, tags })), [setActiveSop]);

  // Track render count
  // useEffect(() => {
  //   setRenderCount(prev => prev + 1);
  // }, []);

  // 🎯 View Mode Management
  const setViewMode = useCallback((mode) => {
    try {
      logStateDebug('setViewMode Entry', {
        requestedMode: mode,
        currentPanel: activePanel,
        isSuperAdmin: userIsSuperAdmin,
        currentRole: getCurrentRole(),
        viewRole,
        stack: new Error().stack
      }, 'function');

      // Prevent unnecessary transitions
      if (mode === activePanel) {
        logStateDebug('Skipping transition - already in requested panel', {
          mode,
          activePanel,
          stack: new Error().stack
        }, 'warning');
        return;
      }

      if (mode === "superadmin") {
        if (!userIsSuperAdmin) {
          logStateDebug('SuperAdmin Access Denied', {
            reason: 'Not SuperAdmin',
            userRole: getCurrentRole(),
            stack: new Error().stack
          }, 'error');
          return;
        }

        logStateDebug('Setting SuperAdmin Panel', {
          previousPanel: activePanel,
          userRole: getCurrentRole(),
          stack: new Error().stack
        }, 'function');

        setActivePanel("superadmin");
        window.location.hash = "superadmin";
        setActiveSop(null);
        
        logStateDebug('SuperAdmin Panel Set', {
          newPanel: 'superadmin',
          hash: window.location.hash
        }, 'success');
        return;
      }

      logStateDebug('Setting Regular Panel', {
        requestedMode: mode,
        previousPanel: activePanel,
        stack: new Error().stack
      }, 'function');

      setPrevPanel(activePanel);
      setActivePanel(mode);
      window.location.hash = mode;
      setActiveSop(null);

      logStateDebug('Panel Set Complete', {
        newPanel: mode,
        hash: window.location.hash
      }, 'success');
    } catch (error) {
      logStateDebug('setViewMode Error', {
        error: error.message,
        stack: error.stack
      }, 'error');
      console.error('View mode change failed:', error);
    }
  }, [
    activePanel,
    userIsSuperAdmin,
    getCurrentRole,
    viewRole,
    logStateDebug
  ]);

  // Panel change effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      logStateDebug('Panel Change Effect', {
        newPanel: activePanel,
        userRole: getCurrentRole(),
        viewRole,
        isSuperAdmin: userIsSuperAdmin,
        hash: window.location.hash,
        stack: new Error().stack
      }, 'effect');
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [activePanel, getCurrentRole, viewRole, userIsSuperAdmin, logStateDebug]);

  // Initialize panel from URL hash
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validPanels = ['library', 'search', 'admin', 'superadmin', 'wizard', 'detail'];
      if (!hash) {
        if (activePanel !== 'library') {
          setActivePanel('library');
          window.location.hash = 'library';
        }
        return;
      }
      if (hash !== activePanel && validPanels.includes(hash)) {
        if (hash === 'superadmin') {
          if (userIsSuperAdmin) {
            setActivePanel('superadmin');
          } else {
            setActivePanel('library');
            window.location.hash = 'library';
          }
        } else {
          setActivePanel(hash);
        }
      }
    };
    window.addEventListener('hashchange', onHashChange);
    // Run once on mount
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activePanel, userIsSuperAdmin]);

  // 🆕 New SOP Button Handler
  const handleNewSop = () => {
    console.log('[App Debug] handleNewSop called');
    if (!canShowFeature(FEATURE_PERMISSIONS.CREATE_SOP)) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to create SOPs",
        variant: "destructive"
      });
      return;
    }
    const newSop = {
      id: null,
      name: '',
      description: '',
      tags: [],
      steps: [{
        id: uuidv4(),
        step_number: 1,
        instruction: '',
        tools: '',
        parts: '',
        photo: ''
      }],
      department_id: selectedDepartmentId
    };
    console.log('[App Debug] New SOP initialized:', newSop);
    setDraftSop(newSop);
    setIsEditing(false);
    setEditSopId(null);
    // If only one department, auto-select it
    if (departments && departments.length === 1) {
      setSelectedDepartmentId(departments[0].department_id);
    }
    setActivePanel('wizard');
    window.location.hash = 'wizard'; // Ensure hash matches panel
  };

  // 🔄 Debug Mode Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugState = () => {
        const state = getDebugState();
        console.log('Current State:', state);
        return {
          ...state,
          changeRole: async (newRole) => {
            console.log('Attempting role change to:', newRole);
            const success = await changeRole(newRole);
            console.log('Role change success:', success);
            return window.debugState();
          }
        };
      };

      // Add permission test function
      window.testPermissions = () => {
        const { testPermissions } = require('./utils/permissions');
        return testPermissions();
      };
    }
  }, [getDebugState, changeRole]);

  // 🔄 SOP Fetch Function
  const fetchSops = async () => {
    if (!departments.length) {
      setSops([]);
      return;
    }

    // Fetch active SOPs
    const { data: activeSopData, error: activeSopError } = await supabase
      .from("sops")
      .select("*")
      .in("department_id", departments.map(d => d.department_id))
      .is('deleted_at', null);

    if (activeSopError) {
      console.error("Error fetching active SOPs:", activeSopError);
      return;
    }

    // Fetch deleted SOPs if user has permission and showDeletedSOPs is true
    let deletedSopData = [];
    if (showDeletedSOPs && (getCurrentRole() === 'manage' || getCurrentRole() === 'superadmin')) {
      const { data: deleted, error: deletedError } = await supabase
        .from("sops")
        .select("*")
        .in("department_id", departments.map(d => d.department_id))
        .not('deleted_at', 'is', null);

      if (deletedError) {
        console.error("Error fetching deleted SOPs:", deletedError);
      } else {
        deletedSopData = deleted || [];
      }
    }

    // Get department details using the cache
    const allSops = [...activeSopData, ...deletedSopData];
    const deptIds = allSops.map(s => s.department_id) || [];
    const deptDetails = await departmentCache.getDepartments(deptIds);
    const deptNameMap = new Map(deptDetails?.map(d => [d?.department_id, d?.name]) || []);
    
    const enrichedSops = allSops.map(sop => ({
      ...sop,
      departments: { name: deptNameMap.get(sop.department_id) ?? 'Unknown Department' }
    }));
    
    setSops(enrichedSops || []);

    // Fetch thumbnails
    const thumbs = {};
    for (const sop of allSops) {
      const { data: stepData } = await supabase
        .from("sop_steps")
        .select("photo")
        .eq("sop_id", sop.id)
        .is('deleted_at', null)
        .order("step_number")
        .limit(1);
      if (stepData?.[0]?.photo) thumbs[sop.id] = stepData[0].photo;
    }
    setSopThumbnails(thumbs);
  };

  // 🔄 SOP Fetch Effect - Only fetch SOPs for library and search panels
  useEffect(() => {
    if (["library", "search"].includes(activePanel)) {
      console.log("Fetching SOPs. showDeletedSOPs=", showDeletedSOPs, "userRole=", getCurrentRole());
      fetchSops();
    }
  }, [departments, showDeletedSOPs, activePanel]);

  // 📸 Image Upload Handler
  const handleFileUpload = async (index, file) => {
    if (!file) return;
    try {
      const compressedFile = await compressImage(file);
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from("sop-images").upload(filePath, compressedFile);
      if (uploadError) {
        alert("Image upload failed");
        return;
      }
      const { data } = supabase.storage.from("sop-images").getPublicUrl(filePath);
      handleStepChange(index, "photo", data.publicUrl);
    } catch (err) {
      console.error("Error compressing or uploading image:", err);
    }
  };

  // 📝 SOP Step Management
  const handleStepChange = (index, field, value) => {
    setActiveSop(sop => {
      if (!sop || !Array.isArray(sop.steps)) return sop;
      const updatedSteps = [...sop.steps];
      updatedSteps[index][field] = value;
      return { ...sop, steps: updatedSteps };
    });
  };

  const handleAddStep = () => {
    setActiveSop(sop => {
      if (!sop || !Array.isArray(sop.steps)) return sop;
      return {
        ...sop,
        steps: [...sop.steps, { step_number: sop.steps.length + 1, instruction: '', tools: '', parts: '', photo: '' }]
      };
    });
  };

  // 💾 SOP Save Handler
  const handleSaveSop = async () => {
    console.log('[App Debug] handleSaveSop called');
    if (!draftSop || !selectedDepartmentId) {
      alert("Please select a department before saving.");
      return;
    }
    try {
      console.log('[App Debug] Saving SOP:', draftSop);
      console.log('[App Debug] Current user:', userProfile);
      console.log('[App Debug] Current department:', selectedDepartmentId);
      console.log('[App Debug] Permissions:', userProfile?.permissions);
      const tagString = Array.isArray(draftSop.tags) ? draftSop.tags.join(",") : draftSop.tags;
      
      // Update step numbers to match their current order
      const updatedSteps = draftSop.steps.map((step, index) => ({
        ...step,
        step_number: index + 1
      }));
      const sopToSave = { ...draftSop, steps: updatedSteps };

      if (isEditing && editSopId) {
        const { error: updateError } = await supabase
          .from("sops")
          .update({ 
            name: sopToSave.name, 
            description: sopToSave.description, 
            tags: tagString 
          })
          .eq("id", editSopId);
        
        if (updateError) {
          console.error('[App Debug] Error updating SOP:', updateError);
          alert("Failed to update SOP");
          return;
        }

        // Fetch all existing step IDs for this SOP
        const { data: existingSteps, error: fetchStepsError } = await supabase
          .from("sop_steps")
          .select("id")
          .eq("sop_id", editSopId)
          .is("deleted_at", null);
        if (fetchStepsError) {
          alert("Failed to fetch existing SOP steps");
          return;
        }
        const existingStepIds = new Set((existingSteps || []).map(s => s.id));
        const draftStepIds = new Set(sopToSave.steps.map(s => s.id).filter(Boolean));

        // Mark as deleted any step in DB not in draft
        for (const oldId of existingStepIds) {
          if (!draftStepIds.has(oldId)) {
            await supabase
              .from("sop_steps")
              .update({ deleted_at: new Date().toISOString() })
              .eq("id", oldId);
          }
        }

        // Upsert (update or insert) each step in the draft
        for (const [idx, step] of sopToSave.steps.entries()) {
          if (step.id && existingStepIds.has(step.id)) {
            // Update existing step
            const { error: updateStepError } = await supabase
              .from("sop_steps")
              .update({
                ...step,
                step_number: idx + 1,
                deleted_at: null
              })
              .eq("id", step.id);
            if (updateStepError) {
              alert("Failed to update a SOP step");
              return;
            }
          } else {
            // Insert new step
            const { error: insertStepError } = await supabase
              .from("sop_steps")
              .insert({ ...step, id: uuidv4(), sop_id: editSopId, step_number: idx + 1 });
            if (insertStepError) {
              alert("Failed to insert a SOP step");
              return;
            }
          }
        }
      } else {
        // New SOP creation
        const sopId = uuidv4();
        console.log('[App Debug] Creating new SOP with id:', sopId);
        const { error: sopError, data: sopInsertData } = await supabase
          .from("sops")
          .insert({
            id: sopId,
            name: sopToSave.name || "Untitled SOP",
            description: sopToSave.description,
            tags: tagString,
            department_id: selectedDepartmentId,
            created_by: session.user.id,
          });

        if (sopError) {
          console.error('[App Debug] Error creating SOP:', sopError);
          alert("Failed to save SOP");
          return;
        }
        console.log('[App Debug] SOP insert response:', sopInsertData);
        for (const step of sopToSave.steps) {
          const { error: stepError, data: stepInsertData } = await supabase
            .from("sop_steps")
            .insert({ ...step, sop_id: sopId });
          
          if (stepError) {
            console.error('[App Debug] Error inserting step:', stepError);
            alert("Failed to save SOP steps");
            return;
          }
          console.log('[App Debug] Step insert response:', stepInsertData);
        }
      }

      await fetchSops();  // Refresh the SOP list
      // Re-fetch the just-edited SOP for detail view
      if (isEditing && editSopId) {
        await handleSopSelect({ ...draftSop, id: editSopId });
      }
      setActiveSop(null);
      setDraftSop(null);
      setIsEditing(false);
      setEditSopId(null);
      setActivePanel("library");
      window.location.hash = "library";  // Ensure URL hash matches
    } catch (error) {
      console.error('[App Debug] Exception in handleSaveSop:', error);
      alert("An unexpected error occurred while saving the SOP");
    }
  };

  // 📝 SOP Selection Handler
  const handleSopSelect = async (sop) => {
    // Prevent re-selecting if already editing
    if (activePanel === 'wizard' || isEditing) {
      console.log('[handleSopSelect] Ignored because already editing');
      return;
    }
    console.log('[App Debug] handleSopSelect called for SOP:', sop);
    setPrevPanel(activePanel);
    try {
      const { data: steps, error } = await supabase
        .from("sop_steps")
        .select("*")
        .eq("sop_id", sop.id)
        .is("deleted_at", null)
        .order("step_number");
      if (error) {
        console.error('[App Debug] Error fetching SOP steps:', error);
      } else {
        console.log('[App Debug] Fetched SOP steps:', steps);
      }
      setActiveSop({ ...sop, steps: steps || [] });
    } catch (err) {
      console.error('[App Debug] Exception in handleSopSelect:', err);
    }
    setIsEditing(false);
    setEditSopId(null);
    console.log('[App Debug] Setting panel to detail');
    setActivePanel('detail');
    console.log('[App Debug] window.location.hash before:', window.location.hash);
    window.location.hash = 'detail';
    console.log('[App Debug] window.location.hash after:', window.location.hash);
  };

  // ❌ SOP Close Handler
  const handleCloseSopDetail = () => {
    setActiveSop(null);
    setActivePanel(prevPanel);
  };

  // 🖼️ Image Click Handler
  const handleImageClick = (url) => {
    setEnlargedImage(enlargedImage === url ? null : url);
  };

  // ✏️ SOP Edit Handler (robust, uses draft)
  const handleEditSop = () => {
    console.log('[EditSop Handler] called', { activeSop, steps: activeSop?.steps });
    if (!activeSop || !Array.isArray(activeSop.steps)) return;
    // Deep clone SOP and steps for editing
    const deepClone = sop => JSON.parse(JSON.stringify(sop));
    setDraftSop(deepClone(activeSop));
    setIsEditing(true);
    setEditSopId(activeSop.id);
    setSelectedDepartmentId(activeSop.department_id || activeSop.company_id || "");
    setActivePanel("wizard");
    window.location.hash = "wizard";
  };

  // Cancel Edit Handler
  const handleCancelEdit = () => {
    setDraftSop(null);
    setIsEditing(false);
    setEditSopId(null);
    setActivePanel("detail");
    // Do NOT clear activeSop so detail view can show
  };

  // 🗑️ Delete SOP Handler
  const handleDeleteSop = async () => {
    if (!activeSop) return;
    setSopToDelete(activeSop);
    setShowDeleteConfirm(true);
  };

  // 🗑️ Actual Delete Function
  const confirmDelete = async () => {
    try {
      // Soft delete the SOP and its steps
      const { error: sopError } = await supabase
        .from("sops")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", sopToDelete.id);

      if (sopError) {
        console.error("Error soft deleting SOP:", sopError);
        alert("Failed to delete SOP");
        return;
      }

      const { error: stepsError } = await supabase
        .from("sop_steps")
        .update({ deleted_at: new Date().toISOString() })
        .eq("sop_id", sopToDelete.id);

      if (stepsError) {
        console.error("Error soft deleting SOP steps:", stepsError);
        alert("Failed to delete SOP steps");
        return;
      }

      setShowDeleteConfirm(false);
      setSopToDelete(null);
      setActiveSop(null);
      setActivePanel("library");
      await fetchSops();
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("An unexpected error occurred while deleting the SOP");
    }
  };

  // 🔄 Restore SOP Function
  const handleRestoreSop = async (sop) => {
    try {
      console.log("Attempting to restore SOP:", sop.id);
      
      // Call the restore_sop function
      const { data, error } = await supabase
        .rpc('restore_sop', { 
          target_sop_id: sop.id  // Updated parameter name
        });

      if (error) {
        console.error("Error restoring SOP:", error);
        alert(`Failed to restore SOP: ${error.message}`);
        return;
      }

      await fetchSops();
      setActivePanel("library");  // Return to library view
      setActiveSop(null);  // Clear active SOP
      alert("SOP restored successfully!");
    } catch (error) {
      console.error("Error during restoration:", error);
      alert("An unexpected error occurred while restoring the SOP");
    }
  };

  // 💭 SOP Suggestion Handler
  const handleSuggestChanges = () => {
    // TODO: Implement suggestion functionality
    console.log('Suggest changes for SOP:', activeSop.id);
  };

  // 🔍 SOP Search with deleted filter
  const filteredSops = searchTerm
    ? sops.filter((sop) => {
        const term = searchTerm.toLowerCase();
        return (
          sop.name?.toLowerCase().includes(term) ||
          sop.description?.toLowerCase().includes(term) ||
          sop.tags?.toLowerCase().includes(term)
        );
      })
    : sops;

  // Filter deleted/non-deleted SOPs
  const displayedSops = filteredSops.filter(sop => 
    showDeletedSOPs ? sop.deleted_at : !sop.deleted_at
  );

  // Centralized permission logic for visible buttons (copied from Header)
  // Permission logic is now handled directly in the Controls component

  // Place all handleDraft* functions here, before the return of MainApp
  const handleDraftStepChange = (index, field, value) => {
    setDraftSop(sop => {
      if (!sop || !Array.isArray(sop.steps)) return sop;
      const updatedSteps = [...sop.steps];
      updatedSteps[index][field] = value;
      return { ...sop, steps: updatedSteps };
    });
  };
  const handleDraftAddStep = () => {
    setDraftSop(sop => {
      if (!sop || !Array.isArray(sop.steps)) return sop;
      return {
        ...sop,
        steps: [...sop.steps, { step_number: sop.steps.length + 1, instruction: '', tools: '', parts: '', photo: '' }]
      };
    });
  };
  const handleDraftDeleteStep = (index) => {
    setDraftSop(sop => ({ ...sop, steps: sop.steps.filter((_, i) => i !== index) }));
  };
  const handleDraftMoveStepUp = (index) => {
    setDraftSop(sop => {
      if (index === 0) return sop;
      const newSteps = [...sop.steps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      return { ...sop, steps: newSteps };
    });
  };
  const handleDraftMoveStepDown = (index) => {
    setDraftSop(sop => {
      if (index === sop.steps.length - 1) return sop;
      const newSteps = [...sop.steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      return { ...sop, steps: newSteps };
    });
  };
  const handleDraftFileUpload = async (index, file) => {
    if (!file) return;
    try {
      const compressedFile = await compressImage(file);
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from("sop-images").upload(filePath, compressedFile);
      if (uploadError) {
        alert("Image upload failed");
        return;
      }
      const { data } = supabase.storage.from("sop-images").getPublicUrl(filePath);
      setDraftSop(sop => {
        const updatedSteps = [...sop.steps];
        updatedSteps[index].photo = data.publicUrl;
        return { ...sop, steps: updatedSteps };
      });
    } catch (err) {
      alert("Error compressing or uploading image");
    }
  };

  return (
    <SupabaseProvider>
      <Layout
        sidebar={
          <Header 
            userRole={getActualRole()}
            viewRole={viewRole}
            changeViewRole={changeViewRole}
            getActualRole={getActualRole}
            setViewMode={setViewMode}
            isSuperAdmin={userIsSuperAdmin}
            isLoading={isLoading}
            roleLoading={roleLoading}
            showDeletedSOPs={showDeletedSOPs}
            setShowDeletedSOPs={setShowDeletedSOPs}
            activePanel={activePanel}
            onNewSop={handleNewSop}
            canCreateSop={canShowFeature(FEATURE_PERMISSIONS.CREATE_SOP)}
          />
        }
        topbar={null}
      >
        {userError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {userError}
          </div>
        )}

        {activePanel === "library" && !activeSop && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayedSops.map((sop) => (
                <div key={sop.id} className="relative">
                  <SOPCard
                    sop={sop}
                    thumbnail={sopThumbnails[sop.id]}
                    onClick={() => handleSopSelect(sop)}
                    onImageClick={handleImageClick}
                  />
                  {sop.deleted_at && (getCurrentRole() === 'manage' || getCurrentRole() === 'super') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreSop(sop);
                      }}
                      className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activePanel === "search" && (
          <>
            <div className="mb-4">
              <Input
                className="w-full mb-4"
                placeholder="Search SOPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayedSops.map((sop) => (
                  <div key={sop.id} className="relative">
                    <SOPCard
                      sop={sop}
                      thumbnail={sopThumbnails[sop.id]}
                      onClick={() => handleSopSelect(sop)}
                      onImageClick={handleImageClick}
                    />
                    {sop.deleted_at && (getCurrentRole() === 'manage' || getCurrentRole() === 'super') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreSop(sop);
                        }}
                        className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activePanel === "admin" && (
          <div style={{ gridColumn: '1 / -1', width: '100%' }}>
            {!adminViewMode ? (
              <AdminPanel
                userProfile={userProfile}
                departments={departments}
                visibleDepartmentIds={[selectedDepartmentId]}
                setVisibleDepartmentIds={setSelectedDepartmentId}
                setViewMode={setAdminViewMode}
                currentUserId={session.user.id}
                userRole={getCurrentRole()}
              />
            ) : adminViewMode === 'users' ? (
              <div className="space-y-4">

                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">User Management</h2>

                                      <Button 
                      onClick={() => setAdminViewMode(null)} 
                      variant="outline"
                    >
                      ← Back to Admin Panel
                    </Button>
                </div>
                <p className="text-gray-600">User management functionality coming soon...</p>
              </div>
            ) : adminViewMode === 'departments' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Department Management</h2>
                  <Button onClick={() => {
                    console.log('Back button clicked, setting adminViewMode to null');
                    setAdminViewMode(null);
                  }} variant="outline">
                    ← Back to Admin Panel
                  </Button>
                </div>
                <p className="text-gray-600">Department management functionality coming soon...</p>
              </div>
            ) : adminViewMode === 'backup' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Backup System</h2>
                  <Button onClick={() => setAdminViewMode(null)} variant="outline">
                    ← Back to Admin Panel
                  </Button>
                </div>
                <BackupManager departmentId={selectedDepartmentId} />
              </div>
            ) : null}
          </div>
        )}

        {activePanel === "superadmin" && userIsSuperAdmin && (
          <div className="w-full" style={{ gridColumn: '1 / -1', width: '100%' }}>
            <SuperAdminPanel
              currentUserId={session.user.id}
              userProfile={{
                ...userProfile,
                role: 'superadmin',
                is_superadmin: true
              }}
              departments={departments}
              setViewMode={setViewMode}
            />
          </div>
        )}

        {activePanel === "detail" && activeSop && (
          <div className="mt-6">
            <SOPDetail 
              steps={activeSop.steps} 
              onImageClick={handleImageClick}
              user={{...userProfile, role: getCurrentRole()}}
              departmentId={activeSop.department_id}
              onEdit={handleEditSop}
              onDelete={handleDeleteSop}
              onSuggest={handleSuggestChanges}
              onRestore={() => handleRestoreSop(activeSop)}
              currentRole={getCurrentRole()}
              isDeleted={!!activeSop.deleted_at}
            />
            <Button onClick={handleCloseSopDetail} className="mt-4" variant="destructive">
              <XCircle className="inline-block mr-2" size={18} /> Close
            </Button>
          </div>
        )}

        {activePanel === "wizard" && (
          <>
            {draftSop && Array.isArray(draftSop.steps) ? (
              <Wizard
                sop={draftSop}
                setSop={setDraftSop}
                onChangeStep={handleDraftStepChange}
                onAddStep={handleDraftAddStep}
                onDeleteStep={handleDraftDeleteStep}
                onMoveStepUp={handleDraftMoveStepUp}
                onMoveStepDown={handleDraftMoveStepDown}
                onUpload={handleDraftFileUpload}
                onSave={handleSaveSop}
                onUpdate={handleSaveSop}
                setProcessName={name => setDraftSop(sop => ({ ...sop, name }))}
                setDescription={desc => setDraftSop(sop => ({ ...sop, description: desc }))}
                setTags={tags => setDraftSop(sop => ({ ...sop, tags }))}
                onImageClick={handleImageClick}
                isUpdateMode={isEditing}
                userCompanies={departments}
                selectedCompanyId={selectedDepartmentId}
                setSelectedCompanyId={setSelectedDepartmentId}
                onCancel={handleCancelEdit}
              />
            ) : (
              <div>Loading SOP...</div>
            )}
          </>
        )}

        {showCompanyModal && (
          <DepartmentJoinOrCreateModal
            email={session.user.email}
            userId={session.user.id}
            onClose={() => {
              setShowCompanyModal(false);
              window.location.reload();
            }}
          />
        )}

        {enlargedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onClick={() => setEnlargedImage(null)}
          >
            <img
              src={enlargedImage}
              className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg border border-white"
              alt="enlarged"
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Delete SOP</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{sopToDelete?.name}"? This action can be undone by a Manager or SuperAdmin.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSopToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info - Only visible in development */}
        {false && process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-0 right-0 bg-black bg-opacity-80 text-white p-2 text-xs z-[9998]">
            <pre>
              {JSON.stringify({
                panel: activePanel,
                role: getCurrentRole(),
                viewRole,
                isSuperAdmin: userIsSuperAdmin
              }, null, 2)}
            </pre>
          </div>
        )}
      </Layout>
      <Toaster />
    </SupabaseProvider>
  );
}

export default function App() {
  // 🔐 Authentication State
  const [session, setSession] = useState(null);

  // 🔄 Authentication Effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Wrap every setActivePanel call with a debug log
  const debugSetActivePanel = (panel) => {
    console.log('[App Debug setActivePanel] Setting panel to', panel, 'hash:', window.location.hash);
    // Note: This function is not used in the root App component
  };

  // Replace all setActivePanel(panel) with debugSetActivePanel(panel)
  // Replace all window.location.hash = ... with a console.log before setting

  return (
    <Router>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/*"
          element={
            session ? (
              <MainApp session={session} setSession={setSession} />
            ) : (
              <Login
                onLogin={() =>
                  supabase.auth.getSession().then(({ data }) => setSession(data.session))
                }
              />
            )
          }
        />
      </Routes>
    </Router>
  );
}
