"use client";
import { useState, useEffect } from "react";
import { FaRegCalendarAlt, FaClock } from "react-icons/fa";

export default function FechaHoraEmision({ onFechaHoraChange }) {
  const [fechaEmision, setFechaEmision] = useState("");
  const [horaEmision, setHoraEmision] = useState("");

  const obtenerFechaHoraElSalvador = () => {
    const ahora = new Date();
    
    // Obtener la hora UTC actual en milisegundos
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    
    // Ajustar a UTC-6 (El Salvador)
    const offsetElSalvador = -6;
    const horaElSalvador = new Date(utc + (3600000 * offsetElSalvador));
    
    return horaElSalvador;
  };

  useEffect(() => {
    const horaElSalvador = obtenerFechaHoraElSalvador();

    // Formatear fecha manualmente para evitar problemas con toISOString()
    const año = horaElSalvador.getFullYear();
    const mes = String(horaElSalvador.getMonth() + 1).padStart(2, '0');
    const dia = String(horaElSalvador.getDate()).padStart(2, '0');
    const fecha = `${año}-${mes}-${dia}`;

    // Formatear hora
    const horas = String(horaElSalvador.getHours()).padStart(2, '0');
    const minutos = String(horaElSalvador.getMinutes()).padStart(2, '0');
    const segundos = String(horaElSalvador.getSeconds()).padStart(2, '0');
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
        <FaRegCalendarAlt className="text-blue-600 mr-2" />
        <label htmlFor="fechaEmision" className="text-sm font-medium text-blue-800 mr-2">
          Fecha:
        </label>
        <input
          type="date"
          id="fechaEmision"
          value={fechaEmision}
          onChange={handleFechaChange}
          className="p-1 border border-blue-300 rounded text-sm"
        />
      </div>
      
      <div className="flex items-center">
        <FaClock className="text-blue-600 mr-2" />
        <label htmlFor="horaEmision" className="text-sm font-medium text-blue-800 mr-2">
          Hora:
        </label>
        <input
          type="time"
          id="horaEmision"
          value={horaEmision}
          onChange={handleHoraChange}
          step="1"
          className="p-1 border border-blue-300 rounded text-sm"
        />
      </div>
    </div>
  );
}