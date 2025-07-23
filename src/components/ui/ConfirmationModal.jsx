/**
 * @fileoverview ConfirmationModal Component - A reusable modal for confirming user actions
 * with customizable messages, labels, and loading states.
 */

import React from 'react';
import { Button } from './button';
import { Loader2 } from 'lucide-react';

/**
 * ConfirmationModal Component
 * 
 * A modal dialog that requires user confirmation before proceeding with an action.
 * Features include:
 * - Customizable title and message
 * - Custom button labels
 * - Loading state handling
 * - Danger state styling
 * - Accessible button states
 * 
 * @param {Object} props
 * @param {string} props.title - Modal title text
 * @param {string} props.message - Modal message/description
 * @param {string} [props.confirmLabel='Confirm'] - Text for confirm button
 * @param {string} [props.cancelLabel='Cancel'] - Text for cancel button
 * @param {Function} props.onConfirm - Callback when user confirms
 * @param {Function} props.onCancel - Callback when user cancels
 * @param {boolean} [props.isLoading=false] - Whether the confirm action is processing
 * @param {boolean} [props.isDanger=false] - Whether to show danger styling
 */
export function ConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  isDanger = false
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Modal Header */}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {/* Modal Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            style={{ position: 'relative', zIndex: 10000 }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
            style={{ position: 'relative', zIndex: 10000 }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
} 