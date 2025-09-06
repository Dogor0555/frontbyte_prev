"use client";

export default function DeleteConfirmModal({
  show,
  onClose,
  onConfirm,
  message = "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Confirmar Eliminación
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}