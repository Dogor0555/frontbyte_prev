"use client";

export default function ErrorModal({
  show,
  onClose,
  message = "Ocurrió un error inesperado. Por favor, inténtelo de nuevo."
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Error</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}