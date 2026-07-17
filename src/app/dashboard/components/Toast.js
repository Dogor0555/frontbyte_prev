'use client';
import { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

let toastId = 0;
let addToastFn = null;
let showConfirmFn = null;

export function addToast(message, type = 'success', duration = 4000) {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type, duration });
  }
}

export function showConfirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
  return new Promise((resolve) => {
    if (showConfirmFn) {
      showConfirmFn({ title, message, confirmText, cancelText, resolve });
    } else {
      resolve(window.confirm(message || title));
    }
  });
}

const icons = {
  success: <FaCheckCircle className="text-green-400" />,
  error: <FaExclamationTriangle className="text-red-400" />,
  warning: <FaExclamationTriangle className="text-yellow-400" />,
  info: <FaInfoCircle className="text-blue-400" />,
};

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

const textColors = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = (toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    showConfirmFn = (opts) => {
      setConfirmState(opts);
    };
    return () => {
      addToastFn = null;
      showConfirmFn = null;
    };
  }, []);

  const handleConfirmClose = (confirmed) => {
    if (confirmState) {
      confirmState.resolve(confirmed);
      setConfirmState(null);
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            icon={icons[toast.type] || icons.info}
            bgColor={bgColors[toast.type] || bgColors.info}
            textColor={textColors[toast.type] || textColors.info}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </div>

      {confirmState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border-t-4 border-yellow-500">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaExclamationTriangle className="text-3xl text-yellow-500 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {confirmState.title || 'Confirmar'}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">{confirmState.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleConfirmClose(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {confirmState.cancelText}
                </button>
                <button
                  onClick={() => handleConfirmClose(true)}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToastItem({ toast, icon, bgColor, textColor, onClose, duration }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        transition-all duration-300 ease-out
        ${bgColor} ${textColor}
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <FaTimes />
      </button>
    </div>
  );
}
