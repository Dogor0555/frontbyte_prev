"use client";
import { useState, useEffect } from "react";
import { FaTimes, FaDollarSign } from "react-icons/fa";

export default function DiscountModal({ 
  isOpen, 
  onClose, 
  onApplyDiscounts,
  currentGrabadasDiscount = 0,
  currentExentasDiscount = 0
}) {
  const [grabadasDiscount, setGrabadasDiscount] = useState(currentGrabadasDiscount);
  const [exentasDiscount, setExentasDiscount] = useState(currentExentasDiscount);

  useEffect(() => {
    setGrabadasDiscount(currentGrabadasDiscount);
    setExentasDiscount(currentExentasDiscount);
  }, [currentGrabadasDiscount, currentExentasDiscount]);

  const handleApply = () => {
    onApplyDiscounts({
      grabadas: parseFloat(grabadasDiscount) || 0,
      exentas: parseFloat(exentasDiscount) || 0
    });
    onClose();
  };

  const handleReset = () => {
    setGrabadasDiscount(0);
    setExentasDiscount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Aplicar Descuentos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descuento en Ventas Gravadas ($)
            </label>
            <div className="relative">
              <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={grabadasDiscount}
                onChange={(e) => setGrabadasDiscount(e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descuento en Ventas Exentas ($)
            </label>
            <div className="relative">
              <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={exentasDiscount}
                onChange={(e) => setExentasDiscount(e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Reiniciar
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}