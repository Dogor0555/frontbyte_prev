import { FaPlus, FaShoppingCart, FaMoneyBill, FaPercent } from "react-icons/fa";

export default function SelectorModal({ 
  isOpen, 
  onClose, 
  onSelectTipoDetalle 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Agregar Detalle</h2>
        <p className="text-gray-600 mb-6">Seleccione el tipo de detalle que desea agregar:</p>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => onSelectTipoDetalle("producto")}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <FaShoppingCart className="text-blue-800" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Producto o Servicio</h3>
                <p className="text-sm text-gray-500">Agregar un producto o servicio</p>
              </div>
            </div>
            <FaPlus className="text-blue-800" />
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}