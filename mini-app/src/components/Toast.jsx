import { useEffect } from 'react';

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const COLORS = {
  success: 'bg-green-50 border-green-500 text-green-900',
  error: 'bg-red-50 border-red-500 text-red-900',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
  info: 'bg-blue-50 border-blue-500 text-blue-900',
};

/**
 * Toast Notification Component
 *
 * @param {Object} props
 * @param {string} props.message - Toast message
 * @param {string} props.type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} props.duration - Duration in ms (default: 4000)
 * @param {Function} props.onClose - Callback when toast closes
 * @param {string} props.action - Optional action button text
 * @param {Function} props.onAction - Optional action button handler
 */
export default function Toast({
  message,
  type = 'info',
  duration = 4000,
  onClose,
  action,
  onAction,
}) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleAction = (e) => {
    e.stopPropagation();
    onAction?.();
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 mb-3 rounded-lg border-l-4 shadow-lg
        animate-slide-in-right ${COLORS[type]}
      `}
      onClick={() => onClose?.()}
      role="alert"
    >
      <div className="text-2xl flex-shrink-0">{ICONS[type]}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{message}</p>
      </div>

      {action && onAction && (
        <button
          onClick={handleAction}
          className="px-3 py-1 text-sm font-semibold rounded hover:opacity-80
                     bg-white bg-opacity-50 flex-shrink-0"
        >
          {action}
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="text-xl font-bold hover:opacity-70 flex-shrink-0"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Toast Container - Fixed position at top-right
 */
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-md pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            action={toast.action}
            onAction={toast.onAction}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
