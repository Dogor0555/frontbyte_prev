"use client";
import { useState, useEffect } from "react";

export default function DatosEntrega({ 
  onDatosEntregaChange,
  receptorDocumento = "",
  receptorNombre = ""
}) {
  const [datosEntrega, setDatosEntrega] = useState({
    emisorDocumento: "",
    emisorNombre: "",
    receptorDocumento: receptorDocumento,
    receptorNombre: receptorNombre
  });

  useEffect(() => {
    setDatosEntrega(prev => ({
      ...prev,
      receptorDocumento: receptorDocumento,
      receptorNombre: receptorNombre
    }));
  }, [receptorDocumento, receptorNombre]);

  const handleChange = (field, value) => {
    const nuevosDatos = {
      ...datosEntrega,
      [field]: value
    };
    
    setDatosEntrega(nuevosDatos);

    if (onDatosEntregaChange) {
      onDatosEntregaChange(nuevosDatos);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-black">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos adicionales entrega</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Responsable de Emitir (editable) */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Responsable de emitir documento</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. Documento
            </label>
            <input
              type="text"
              value={datosEntrega.emisorDocumento}
              onChange={(e) => handleChange("emisorDocumento", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Número de documento"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={datosEntrega.emisorNombre}
              onChange={(e) => handleChange("emisorNombre", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre completo"
            />
          </div>
        </div>
        
        {/* Responsable de Recibir (automático) */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Responsable de recibir documento</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. Documento
            </label>
            <input
              type="text"
              value={datosEntrega.receptorDocumento}
              onChange={(e) => handleChange("receptorDocumento", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              placeholder="Número de documento"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={datosEntrega.receptorNombre}
              onChange={(e) => handleChange("receptorNombre", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              placeholder="Nombre completo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}