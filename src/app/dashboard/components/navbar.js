'use client';

import { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function Navbar({ user, hasHaciendaToken, haciendaStatus }) {
  const [haciendaConnection, setHaciendaConnection] = useState({
    connected: hasHaciendaToken,
    expiresIn: haciendaStatus?.seconds_left || 0
  });

  useEffect(() => {
    setHaciendaConnection({
      connected: hasHaciendaToken,
      expiresIn: haciendaStatus?.seconds_left || 0
    });
  }, [hasHaciendaToken, haciendaStatus]);

  const formatTimeLeft = (seconds) => {
    if (!seconds || seconds <= 0) return 'Expirado';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutos`;
  };

    return (
    <header className="sticky top-0 bg-white backdrop-blur-md bg-opacity-90 shadow-sm z-20">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">Sistema de Facturación</h1>
        </div>

        <div
            className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            haciendaConnection.connected && haciendaConnection.expiresIn > 0
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
        >
            {haciendaConnection.connected && haciendaConnection.expiresIn > 0 ? (
            <FaCheckCircle className="mr-1" />
            ) : (
            <FaExclamationTriangle className="mr-1" />
            )}
            <span>
            {haciendaConnection.connected && haciendaConnection.expiresIn > 0
                ? `Hacienda: ${formatTimeLeft(haciendaConnection.expiresIn)}`
                : "Hacienda: Desconectado"}
            </span>
        </div>
        </div>
    </header>
);
}