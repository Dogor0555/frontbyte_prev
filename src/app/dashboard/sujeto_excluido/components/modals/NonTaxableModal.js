import { useState } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";

export default function NonTaxableModal({
  isOpen,
  onClose,
  onAddItem
}) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState(0);

  if (!isOpen) return null;

  const handleAgregarItem = () => {
    if (!descripcion.trim() || monto <= 0) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    onAddItem({
      descripcion: descripcion.trim(),
      cantidad: 1,
      precioUnitario: monto,
      descuento: 0,
      unidadMedida: "99" // Unidad de medida para "Otra"
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold">Item DTE</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Subtítulo */}
        <div className="px-6 pt-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">Adición detalle de DTE</h3>
        </div>

        {/* Contenido principal */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-6 text-xl">Otros montos No Afectos</h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Columna izquierda - Descripción */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-lg font-semibold text-gray-900">Descripción</label>
                  <span className="text-sm text-red-600 font-medium">Requerido</span>
                </div>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="Descripción"
                />
              </div>

              {/* Columna derecha - Monto */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-lg font-semibold text-gray-900">Monto</label>
                  <span className="text-sm text-red-600 font-medium">Requerido</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="Monto"
                />
              </div>
            </div>
          </div>

          {/* Resumen del monto */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6 max-w-4xl mx-auto">
            <h5 className="font-semibold text-gray-900 mb-3">Resumen</h5>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-lg font-bold text-blue-700">
                ${monto.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center"
            >
              <FaTimes className="mr-2" />
              Cancelar
            </button>

            <button
              onClick={handleAgregarItem}
              className="px-10 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center shadow-md"
            >
              <FaPlus className="mr-2" />
              Agregar Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}