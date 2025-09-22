// src/app/dashboard/components/navbar.js
'use client';

import { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaBars, 
  FaTimes,
  FaUserCircle,
  FaCog,
  FaBell
} from 'react-icons/fa';

export default function Navbar({ user, hasHaciendaToken, haciendaStatus, onToggleSidebar, sidebarOpen }) {
  const [haciendaConnection, setHaciendaConnection] = useState({
    connected: hasHaciendaToken,
    expiresIn: haciendaStatus?.seconds_left || 0
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setHaciendaConnection({
      connected: hasHaciendaToken,
      expiresIn: haciendaStatus?.seconds_left || 0
    });
  }, [hasHaciendaToken, haciendaStatus]);

  // Detectar si estamos en un dispositivo móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatTimeLeft = (seconds) => {
    if (!seconds || seconds <= 0) return 'Expirado';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getConnectionStatus = () => {
    if (!haciendaConnection.connected) {
      return { status: 'error', text: 'Desconectado' };
    }
    
    if (haciendaConnection.expiresIn <= 300) { // 5 minutos
      return { status: 'warning', text: `Expira en ${formatTimeLeft(haciendaConnection.expiresIn)}` };
    }
    
    return { status: 'success', text: `Conectado · ${formatTimeLeft(haciendaConnection.expiresIn)}` };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <header className={`
      sticky top-0 z-40 transition-all duration-300 ease-out
      ${isScrolled 
        ? 'bg-white/95 backdrop-blur-lg shadow-lg shadow-blue-900/5' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50/80 backdrop-blur-sm'
      }
    `}>
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {/* Botón de menú hamburguesa */}
          <button
            className={`
              p-2 rounded-xl transition-all duration-300 ease-out
              hover:bg-gradient-to-r hover:from-sky-500/20 hover:to-cyan-500/20
              hover:shadow-md hover:scale-105
              ${isMobile ? 'flex' : 'lg:hidden flex'}
            `}
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {sidebarOpen ? (
              <FaTimes className="h-5 w-5 text-blue-700" />
            ) : (
              <FaBars className="h-5 w-5 text-blue-700" />
            )}
          </button>
          
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center justify-center h-10 w-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text text-transparent">
                Sistema de Facturación
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Byte Fusion Soluciones
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Estado de conexión con Hacienda */}
          <div className={`
            flex items-center px-4 py-2 rounded-xl transition-all duration-300 ease-out
            border backdrop-blur-sm shadow-sm
            ${connectionStatus.status === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700' 
              : connectionStatus.status === 'warning'
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700'
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700'
            }
            hover:shadow-md hover:scale-105 cursor-pointer group
          `}>
            <div className={`
              w-2 h-2 rounded-full mr-2 animate-pulse
              ${connectionStatus.status === 'success' 
                ? 'bg-green-500 group-hover:bg-green-600' 
                : connectionStatus.status === 'warning'
                ? 'bg-amber-500 group-hover:bg-amber-600'
                : 'bg-red-500 group-hover:bg-red-600'
              }
            `} />
            
            {connectionStatus.status === 'success' ? (
              <FaCheckCircle className="mr-2 text-green-500" />
            ) : (
              <FaExclamationTriangle className="mr-2" />
            )}
            
            <span className="text-sm font-medium whitespace-nowrap">
              Hacienda: {connectionStatus.text}
            </span>
          </div>

          
          
        </div>
      </div>

      {/* Efecto de borde inferior */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
    </header>
  );
}