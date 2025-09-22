"use client";
import { useState, useEffect } from "react";
import { FaRegCalendarAlt, FaClock } from "react-icons/fa";

export default function FechaHoraEmision({ onFechaHoraChange }) {
  const [fechaEmision, setFechaEmision] = useState("");
  const [horaEmision, setHoraEmision] = useState("");

  useEffect(() => {
    const ahora = new Date();
    
    const fecha = ahora.toISOString().split('T')[0];

    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    const hora = `${horas}:${minutos}:${segundos}`;
    
    setFechaEmision(fecha);
    setHoraEmision(hora);

    if (onFechaHoraChange) {
      onFechaHoraChange({
        fechaEmision: `${fecha}T00:00:00Z`,
        horaEmision: hora
      });
    }
  }, []);

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    setFechaEmision(nuevaFecha);
    
    if (onFechaHoraChange) {
      onFechaHoraChange({
        fechaEmision: `${nuevaFecha}T00:00:00Z`,
        horaEmision: horaEmision
      });
    }
  };

  const handleHoraChange = (e) => {
    const nuevaHora = e.target.value;
    setHoraEmision(nuevaHora);
    
    if (onFechaHoraChange) {
      onFechaHoraChange({
        fechaEmision: `${fechaEmision}T00:00:00Z`,
        horaEmision: nuevaHora
      });
    }
  };

  return (
    <div className="flex items-center space-x-4 p-3 rounded-lg">
      <div className="flex items-center">
        <FaRegCalendarAlt className="text-green-600 mr-2" />
        <label htmlFor="fechaEmision" className="text-sm font-medium text-green-800 mr-2">
          Fecha:
        </label>
        <input
          type="date"
          id="fechaEmision"
          value={fechaEmision}
          onChange={handleFechaChange}
          className="p-1 border border-green-300 rounded text-sm"
        />
      </div>
      
      <div className="flex items-center">
        <FaClock className="text-green-600 mr-2" />
        <label htmlFor="horaEmision" className="text-sm font-medium text-green-800 mr-2">
          Hora:
        </label>
        <input
          type="time"
          id="horaEmision"
          value={horaEmision}
          onChange={handleHoraChange}
          step="1"
          className="p-1 border border-green-300 rounded text-sm"
        />
      </div>
    </div>
  );
}