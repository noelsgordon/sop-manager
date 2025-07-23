/**
 * @fileoverview SOPDetail Component - Displays detailed view of an SOP with role-based controls
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MessageSquare } from "lucide-react";
import { useRoleBasedUI } from "../utils/hooks/useRoleBasedUI";
import { PERMISSION_LEVELS } from "../utils/permissions";

/**
 * SOPDetail Component
 * 
 * Displays a detailed view of an SOP with role-based action buttons.
 * Features include:
 * - Step-by-step instructions
 * - Role-based action buttons
 * - Image viewing capabilities
 * 
 * @param {Object} props
 * @param {Array} props.steps - Array of SOP steps
 * @param {Function} props.onImageClick - Handler for image clicks
 * @param {Object} props.user - Current user object
 * @param {string} props.departmentId - Current department ID
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onSuggest - Suggestion handler
 * @param {Function} props.onRestore - Restore handler
 * @param {string} props.currentRole - Current user role
 * @param {boolean} props.isDeleted - Indicates if the SOP is deleted
 */
export default function SOPDetail({ 
  steps, 
  onImageClick, 
  user, 
  departmentId,
  onEdit,
  onDelete,
  onSuggest,
  onRestore,
  currentRole,
  isDeleted
}) {
  // Get role-based UI helpers
  const { canShowFeature, getFeatureProps, FEATURE_PERMISSIONS } = useRoleBasedUI(user, departmentId);
  const canRestore = currentRole === 'manage' || currentRole === 'superadmin';

  // Debug logging
  console.log('[SOPDetail Debug]', {
    user,
    currentRole,
    isDeleted,
    canShowEdit: canShowFeature(FEATURE_PERMISSIONS.EDIT_SOP),
    canShowSuggest: canShowFeature(FEATURE_PERMISSIONS.SUGGEST_CHANGES),
    canShowDelete: canShowFeature(FEATURE_PERMISSIONS.DELETE_SOP),
    FEATURE_PERMISSIONS
  });

  if (!steps || !Array.isArray(steps)) {
    return <p className="text-red-500">Error loading SOP details.</p>;
  }

  return (
    <div>
      {/* Action Buttons */}
      <div className="mb-4 flex gap-2">
        {/* Restore Button - Only for deleted SOPs and manage/superadmin roles */}
        {isDeleted && canRestore && (
          <Button
            onClick={onRestore}
            variant="success"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Restore SOP
          </Button>
        )}

        {/* Edit Button - Requires BUILD permission and not deleted */}
        {console.log('[SOPDetail Debug] Edit button condition:', { isDeleted, canShowEdit: canShowFeature(FEATURE_PERMISSIONS.EDIT_SOP) })}
        {!isDeleted && canShowFeature(FEATURE_PERMISSIONS.EDIT_SOP) && (
          <Button
            onClick={() => {
              console.log('[SOPDetail] Edit button clicked');
              onEdit();
            }}
            {...getFeatureProps(FEATURE_PERMISSIONS.EDIT_SOP)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit SOP
          </Button>
        )}

        {/* Suggest Changes Button - Requires TWEAK permission and not deleted */}
        {console.log('[SOPDetail Debug] Suggest button condition:', { isDeleted, canShowSuggest: canShowFeature(FEATURE_PERMISSIONS.SUGGEST_CHANGES) })}
        {!isDeleted && canShowFeature(FEATURE_PERMISSIONS.SUGGEST_CHANGES) && (
          <Button
            onClick={onSuggest}
            variant="outline"
            {...getFeatureProps(FEATURE_PERMISSIONS.SUGGEST_CHANGES)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Suggest Changes
          </Button>
        )}

        {/* Delete Button - Requires MANAGE permission and not deleted */}
        {!isDeleted && canShowFeature(FEATURE_PERMISSIONS.DELETE_SOP) && (
          <Button
            onClick={onDelete}
            variant="destructive"
            {...getFeatureProps(FEATURE_PERMISSIONS.DELETE_SOP)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete SOP
          </Button>
        )}
      </div>

      {/* Deleted Status Banner */}
      {isDeleted && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800">
          This SOP is currently deleted. {canRestore && 'Click "Restore SOP" to reinstate it.'}
        </div>
      )}

      {/* Steps Display */}
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
    </div>
  );
}