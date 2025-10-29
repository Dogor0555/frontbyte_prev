import { FaTimes } from "react-icons/fa";

export default function ClientListModal({ 
  isOpen, 
  onClose, 
  clients, 
  onSelectClient 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Cliente</h2>
        <div className="max-h-60 overflow-y-auto">
          {clients.length > 0 ? (
            clients.map((cliente) => (
              <div
                key={cliente.id}
                onClick={() => onSelectClient(cliente)}
                className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer text-gray-800"
              >
                <div className="font-medium">{cliente.nombre}</div>
                <div className="text-sm text-gray-800">
                  {cliente.nit || cliente.dui || "Sin documento"}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              No se encontraron clientes
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}