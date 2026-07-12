import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Shared Confirmation Modal
 * Props:
 *   isOpen       - boolean: whether to show the modal
 *   onConfirm    - function: called when Confirm is clicked
 *   onCancel     - function: called when Cancel or X is clicked
 *   title        - string: modal heading
 *   message      - string/node: explanation text
 *   confirmLabel - string: label for confirm button (default "Confirm")
 *   cancelLabel  - string: label for cancel button (default "Cancel")
 *   danger       - boolean: if true, confirm button uses red/danger styling
 */
export default function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-text-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${danger ? 'bg-status-danger-bg text-status-danger-text' : 'bg-status-warning-bg text-status-warning-text'}`}>
              <AlertTriangle size={16} />
            </div>
            <h3 className="font-bold text-neutral-text-primary">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-neutral-text-muted hover:text-neutral-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-neutral-text-secondary leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-neutral-text-secondary font-medium hover:bg-neutral-surface rounded-lg transition-colors border border-neutral-border"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors ${
              danger
                ? 'bg-status-danger-text hover:bg-red-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
