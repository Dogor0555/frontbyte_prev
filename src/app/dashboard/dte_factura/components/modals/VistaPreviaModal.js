import { FaTimes } from "react-icons/fa";

export default function VistaPreviaModal({ isOpen, onClose, htmlContent }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-lg p-6 w-full max-w-6xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl z-10"
        >
          <FaTimes />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex-shrink-0">Vista Previa de Factura</h2>
        
        <div className="bg-white p-4 rounded-md shadow-inner overflow-auto flex-grow">
          {/* Renderizar el HTML de la plantilla de forma segura */}
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>

        <div className="mt-6 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}