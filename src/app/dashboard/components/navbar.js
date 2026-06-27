// src/app/dashboard/components/navbar.js
'use client';

import { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaBars, 
  FaTimes,
  FaSync
} from 'react-icons/fa';
import { usePathname } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function Navbar({ user, hasHaciendaToken, haciendaStatus, onToggleSidebar, sidebarOpen }) {
  const [haciendaConnection, setHaciendaConnection] = useState({
    connected: hasHaciendaToken,
    expiresIn: haciendaStatus?.seconds_left || 0
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHaciendaTooltip, setShowHaciendaTooltip] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pathname = usePathname();

  const routeLabels = {
    'dashboard': 'Dashboard',
    'facturas': 'Facturas',
    'creditos': 'Créditos Fiscales',
    'notas_remision': 'Notas de Remisión',
    'facturas_sujeto_excluido': 'Sujeto Excluido',
    'facturas_exportacion': 'Exportación',
    'comprobantes_liquidacion': 'Liquidación',
    'comprobantes_retención': 'Retención',
    'comprobantes_retencion': 'Retención',
    'nota_debito': 'Nota de Débito',
    'nota_credito': 'Nota de Crédito',
    'dte_factura': 'Nueva Factura',
    'dte_credito': 'Nuevo Crédito Fiscal',
    'dte_exportacion': 'Nueva Exportación',
    'dte_liquidacion': 'Nueva Liquidación',
    'dte_nota_remision': 'Nueva Nota de Remisión',
    'anular_factura': 'Anular Factura',
    'anular_credito': 'Anular Crédito',
    'anular_nota_remision': 'Anular Nota de Remisión',
    'anular_sujeto_excluido': 'Anular Sujeto Excluido',
    'anular_exportacion': 'Anular Exportación',
    'anular_liquidacion': 'Anular Liquidación',
    'anular_retencion': 'Anular Retención',
    'anular_nota_debito': 'Anular Nota de Débito',
    'anular_nota_credito': 'Anular Nota de Crédito',
    'clientes': 'Clientes',
    'productos': 'Productos',
    'inventario': 'Inventario',
    'sucursal': 'Sucursal',
    'sucursales': 'Sucursales',
    'editar_sucursal': 'Editar Sucursal',
    'persona_natural': 'Persona Natural',
    'sujeto_excluido': 'Sujeto Excluido',
    'realizar_cotizacion': 'Cotización',
    'realizar_compra': 'Compra',
    'registro-eventos': 'Eventos',
    'registro_compras': 'Registro Compras',
    'configurar-pdf': 'Configurar PDF',
    'libro_de_ventas': 'Libro de Ventas',
    'libro_contribuyente': 'Libro Contribuyente',
    'libro_consumidor_final': 'Libro Consumidor Final',
    'libro_sujeto_excluido': 'Libro Sujeto Excluido',
    'anexo_consumidor_final': 'Anexo Consumidor Final',
    'anexo_contribuyente': 'Anexo Contribuyente',
    'anexo_sujeto_excluido': 'Anexo Sujeto Excluido',
    'detalle_documentos_consumidor_final': 'Detalle Documentos',
    'detalle_documentos_contribuyentes': 'Detalle Documentos',
    'detalle_documentos_sujeto_excluido': 'Detalle Documentos',
    'emitir': 'Emitir',
    'soporte': 'Soporte',
    'nota_detalle': 'Detalle',
  };

  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, i, arr) => {
      if (/^\d+$/.test(segment)) return { label: 'Detalle', href: null };
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, ' ');
      const href = '/' + arr.slice(0, i + 1).join('/');
      return { label, href };
    });

  useEffect(() => {
    setHaciendaConnection({
      connected: hasHaciendaToken,
      expiresIn: haciendaStatus?.seconds_left || 0
    });
  }, [hasHaciendaToken, haciendaStatus]);

  useEffect(() => {
    const checkIsMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsSmallMobile(width < 480);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHaciendaConnection(prev => ({
        ...prev,
        expiresIn: Math.max(0, prev.expiresIn - 1)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const refreshHaciendaToken = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/hacienda/token-check`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setHaciendaConnection({
          connected: true,
          expiresIn: data.expires_in || 86400
        });
      } else {
        setHaciendaConnection({
          connected: false,
          expiresIn: 0
        });
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setHaciendaConnection({
        connected: false,
        expiresIn: 0
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleHaciendaConnection = async () => {
    if (haciendaConnection.connected) {
      try {
        await fetch(`${API_BASE_URL}/clearTokenhacienda`, {
          method: 'DELETE',
          credentials: 'include',
        });
        setHaciendaConnection({
          connected: false,
          expiresIn: 0
        });
      } catch (error) {
        console.error('Error clearing token:', error);
      }
    } else {
      await refreshHaciendaToken();
    }
  };

  const formatTimeLeft = (seconds) => {
    if (!seconds || seconds <= 0) return 'Expirado';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTimeLeftShort = (seconds) => {
    if (!seconds || seconds <= 0) return 'Exp.';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  const getConnectionStatus = () => {
    if (!haciendaConnection.connected) {
      return { status: 'error', text: 'Desconectado', shortText: 'Descon.' };
    }
    
    if (haciendaConnection.expiresIn <= 300) {
      return { 
        status: 'warning', 
        text: `Expira en ${formatTimeLeft(haciendaConnection.expiresIn)}`,
        shortText: `Exp. ${formatTimeLeftShort(haciendaConnection.expiresIn)}`
      };
    }
    
    return { 
      status: 'success', 
      text: `Conectado · ${formatTimeLeft(haciendaConnection.expiresIn)}`,
      shortText: `Con. ${formatTimeLeftShort(haciendaConnection.expiresIn)}`
    };
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
        <div className="flex items-center space-x-3">
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

          <nav className="hidden sm:flex items-center text-sm text-gray-500 ml-2 space-x-1.5 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center min-w-0">
                {i > 0 && <span className="mx-1.5 text-gray-300 flex-shrink-0">›</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-blue-600 transition-colors truncate whitespace-nowrap">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-800 font-medium truncate whitespace-nowrap">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
            <div 
              className={`
                flex items-center px-3 py-2 rounded-xl transition-all duration-300 ease-out
                border backdrop-blur-sm shadow-sm
                ${connectionStatus.status === 'success' 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700' 
                  : connectionStatus.status === 'warning'
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700'
                  : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700'
                }
                hover:shadow-md hover:scale-105 cursor-pointer group
                ${isSmallMobile ? 'px-2 py-1' : ''}
              `}
              onMouseEnter={() => setShowHaciendaTooltip(true)}
              onMouseLeave={() => setShowHaciendaTooltip(false)}
              onClick={() => setShowHaciendaTooltip(!showHaciendaTooltip)}
            >
              <div className={`
                w-2 h-2 rounded-full mr-2 animate-pulse flex-shrink-0
                ${connectionStatus.status === 'success' 
                  ? 'bg-green-500 group-hover:bg-green-600' 
                  : connectionStatus.status === 'warning'
                  ? 'bg-amber-500 group-hover:bg-amber-600'
                  : 'bg-red-500 group-hover:bg-red-600'
                }
              `} />
              
              {connectionStatus.status === 'success' ? (
                <FaCheckCircle className={`${isSmallMobile ? 'mr-1' : 'mr-2'} text-green-500 flex-shrink-0`} />
              ) : (
                <FaExclamationTriangle className={`${isSmallMobile ? 'mr-1' : 'mr-2'} flex-shrink-0`} />
              )}
              
              <span className={`font-medium whitespace-nowrap ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                {isSmallMobile ? connectionStatus.shortText : `Hacienda: ${connectionStatus.text}`}
              </span>

              {showHaciendaTooltip && isSmallMobile && (
                <div className="absolute top-full right-0 mt-2 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-50 shadow-lg whitespace-nowrap">
                  <div className="font-semibold">Estado Hacienda:</div>
                  <div>{connectionStatus.text}</div>
                  <div className="w-3 h-3 bg-gray-800 absolute -top-1 right-3 transform rotate-45"></div>
                </div>
              )}
            </div>

            {/* Toggle Switch para Hacienda */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleHaciendaConnection}
                disabled={isRefreshing}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-out
                  ${haciendaConnection.connected 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                  }
                  ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-out
                  ${haciendaConnection.connected ? 'translate-x-6' : 'translate-x-1'}
                  ${isRefreshing ? 'animate-pulse' : ''}
                `} />
              </button>

              <button
                onClick={refreshHaciendaToken}
                disabled={isRefreshing || !haciendaConnection.connected}
                className={`
                  p-2 rounded-lg transition-all duration-300 ease-out
                  bg-gradient-to-r from-blue-50 to-cyan-100 text-blue-600 
                  hover:from-blue-100 hover:to-cyan-200 border border-blue-200
                  hover:shadow-md hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed
                  ${isSmallMobile ? 'w-7 h-7' : 'w-8 h-8'}
                `}
                title="Refrescar conexión con Hacienda"
              >
                <FaSync className={`${isRefreshing ? 'animate-spin' : ''} ${isSmallMobile ? "text-xs" : "text-sm"}`} />
              </button>
            </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
    </header>
  );
}