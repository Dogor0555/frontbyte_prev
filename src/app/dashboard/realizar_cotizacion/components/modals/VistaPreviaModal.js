import { FaTimes, FaSpinner, FaCheckCircle } from 'react-icons/fa';

export default function VistaPreviaModal({ isOpen, onClose, htmlContent, onConfirm, isSaving }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Vista Previa de Factura</h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Contenido de la Vista Previa */}
        <div className="flex-grow overflow-y-auto p-2">
          <iframe
            srcDoc={htmlContent}
            title="Vista Previa de Factura"
            className="w-full h-full border-0"
          />
        </div>

        {/* Pie del Modal con Botones */}
        <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 mr-4"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className={`flex items-center justify-center px-6 py-2 rounded-md text-white ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSaving ? (
              <><FaSpinner className="animate-spin mr-2" /> Procesando...</>
            ) : (
              <><FaCheckCircle className="mr-2" /> Confirmar y Guardar Factura</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}