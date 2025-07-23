/**
 * @fileoverview SOPCard Component - Displays a card view of an SOP with role-based actions
 */

import React from "react";
import { useRoleBasedUI } from "../utils/hooks/useRoleBasedUI";

/**
 * SOPCard Component
 * 
 * Displays a card view of an SOP with role-based action buttons.
 * Features include:
 * - Thumbnail display
 * - Basic SOP info
 * - Role-based action buttons
 * 
 * @param {Object} props
 * @param {Object} props.sop - SOP data object
 * @param {string} props.thumbnail - URL of the thumbnail image
 * @param {Function} props.onClick - Click handler for the card
 * @param {Function} props.onImageClick - Click handler for the thumbnail
 * @param {Object} props.user - Current user object
 * @param {string} props.departmentId - Current department ID
 */
export default function SOPCard({ 
  sop, 
  thumbnail, 
  onClick, 
  onImageClick,
  user,
  departmentId
}) {
  const hasHighlight = sop._highlighted;
  const { canShowFeature, getFeatureProps } = useRoleBasedUI(user, departmentId);

  return (
    <div
      className="border rounded-lg p-2 shadow hover:shadow-md transition duration-150 bg-white cursor-pointer"
      onClick={() => onClick(sop)}
      tabIndex={0}
      role="button"
      aria-label={`View SOP: ${sop.name}`}
      onKeyPress={e => { if (e.key === 'Enter') onClick(sop); }}
    >
      {/* Thumbnail */}
      <div className="relative">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt="SOP thumbnail"
            className="w-24 h-24 object-cover mx-auto rounded mb-2 border border-gray-300"
            onClick={e => {
              e.stopPropagation();
              onImageClick(thumbnail);
            }}
          />
        ) : (
          <div className="w-24 h-24 bg-gray-200 flex items-center justify-center mx-auto rounded mb-2">
            <span className="text-gray-500 text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* SOP Info */}
      <h2
        className="font-semibold text-center text-gray-800 text-sm"
        dangerouslySetInnerHTML={{
          __html: hasHighlight ? sop._highlighted.name : sop.name,
        }}
      />

      {sop.description && (
        <p
          className="text-xs text-gray-500 text-center mt-1"
          dangerouslySetInnerHTML={{
            __html: hasHighlight ? sop._highlighted.description : sop.description,
          }}
        />
      )}
    </div>
  );
}
