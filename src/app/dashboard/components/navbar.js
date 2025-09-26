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
  FaBell,
  FaFlag,
  FaStar,
  FaArrowRight,
  FaBuilding,
  FaWhatsapp,
  FaExternalLinkAlt,
  FaSignal
} from 'react-icons/fa';

export default function Navbar({ user, hasHaciendaToken, haciendaStatus, onToggleSidebar, sidebarOpen }) {
  const [haciendaConnection, setHaciendaConnection] = useState({
    connected: hasHaciendaToken,
    expiresIn: haciendaStatus?.seconds_left || 0
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nextAdIndex, setNextAdIndex] = useState(1);
  const [showHaciendaTooltip, setShowHaciendaTooltip] = useState(false);

  // Datos de las empresas publicitarias con colores personalizados
  const empresasPublicitarias = [
    {
      id: 1,
      nombre: "Byte Fusion Soluciones",
      slogan: "Innovación que transforma",
      descripcion: "Especialistas en desarrollo de software empresarial y soluciones tecnológicas integrales para el crecimiento de tu negocio.",
      servicios: ["Desarrollo a medida", "Consultoría TI", "Soporte técnico", "Apps móviles"],
      contacto: "info@bytefusion.com",
      telefono: "+50363082613",
      whatsapp: "+50363082613",
      banner: "/api/placeholder/600/200", // URL del banner de la empresa
      logo: "/api/placeholder/100/100", // URL del logo de la empresa
      website: "https://bytefusion.com",
      colores: {
        from: "from-blue-500",
        to: "to-purple-600",
        accent: "bg-blue-100",
        text: "text-blue-700"
      },
      icon: FaBuilding,
    },
    {
      id: 2,
      nombre: "CloudTech Solutions",
      slogan: "El futuro es la nube",
      descripcion: "Líderes en servicios de computación en la nube y transformación digital. Llevamos tu empresa al siguiente nivel tecnológico.",
      servicios: ["Migración a la nube", "Infraestructura IT", "Ciberseguridad", "DevOps"],
      contacto: "ventas@cloudtech.cr",
      telefono: "+506 2444-5555",
      whatsapp: "+50624445555",
      banner: "/api/placeholder/600/200",
      logo: "/api/placeholder/100/100",
      website: "https://cloudtech.cr",
      colores: {
        from: "from-cyan-500",
        to: "to-teal-600",
        accent: "bg-cyan-100",
        text: "text-cyan-700"
      },
      icon: FaFlag,
    },
    {
      id: 3,
      nombre: "DataFlow Analytics",
      slogan: "Datos que impulsan decisiones",
      descripcion: "Expertos en análisis de datos e inteligencia empresarial. Convertimos tus datos en ventajas competitivas.",
      servicios: ["Business Intelligence", "Big Data", "Machine Learning", "Dashboards"],
      contacto: "consultas@dataflow.cr",
      telefono: "+506 2666-7777",
      whatsapp: "+50626667777",
      banner: "/api/placeholder/600/200",
      logo: "/api/placeholder/100/100",
      website: "https://dataflow.cr",
      colores: {
        from: "from-emerald-500",
        to: "to-green-600",
        accent: "bg-emerald-100",
        text: "text-emerald-700"
      },
      icon: FaStar,
    },
    {
      id: 4,
      nombre: "TechPro Marketing",
      slogan: "Marketing digital efectivo",
      descripcion: "Agencia especializada en marketing digital y posicionamiento online. Hacemos crecer tu presencia digital.",
      servicios: ["SEO/SEM", "Redes Sociales", "E-commerce", "Publicidad Online"],
      contacto: "hola@techpro.cr",
      telefono: "+506 2888-9999",
      whatsapp: "+50628889999",
      banner: "/api/placeholder/600/200",
      logo: "/api/placeholder/100/100",
      website: "https://techpro.cr",
      colores: {
        from: "from-pink-500",
        to: "to-rose-600",
        accent: "bg-pink-100",
        text: "text-pink-700"
      },
      icon: FaArrowRight,
    }
  ];

  const currentAd = empresasPublicitarias[currentAdIndex];
  const IconComponent = currentAd.icon;

  useEffect(() => {
    setHaciendaConnection({
      connected: hasHaciendaToken,
      expiresIn: haciendaStatus?.seconds_left || 0
    });
  }, [hasHaciendaToken, haciendaStatus]);

  // Detectar si estamos en un dispositivo móvil y tamaño específico
  useEffect(() => {
    const checkIsMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsSmallMobile(width < 480); // Para dispositivos muy pequeños
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

  // Rotar anuncios cada 8 segundos con animación
  useEffect(() => {
    const adInterval = setInterval(() => {
      // Preparar el siguiente anuncio
      const nextIndex = currentAdIndex === empresasPublicitarias.length - 1 ? 0 : currentAdIndex + 1;
      setNextAdIndex(nextIndex);
      
      // Iniciar animación de salida
      setIsAnimating(true);
      
      // Después de 400ms cambiar al siguiente anuncio
      setTimeout(() => {
        setCurrentAdIndex(nextIndex);
        // Después de cambiar, terminar la animación
        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      }, 400);
      
    }, 8000); // Cambia cada 8 segundos

    return () => clearInterval(adInterval);
  }, [currentAdIndex, empresasPublicitarias.length]);

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
    
    if (haciendaConnection.expiresIn <= 300) { // 5 minutos
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

  // Función para abrir el modal de publicidad
  const openAdModal = () => {
    setShowAdModal(true);
  };

  // Función para cerrar el modal
  const closeAdModal = () => {
    setShowAdModal(false);
  };

  // Función para cambiar al anuncio anterior
  const prevAd = () => {
    setCurrentAdIndex((prevIndex) => 
      prevIndex === 0 ? empresasPublicitarias.length - 1 : prevIndex - 1
    );
  };

  // Función para cambiar al siguiente anuncio
  const nextAd = () => {
    setCurrentAdIndex((prevIndex) => 
      prevIndex === empresasPublicitarias.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Función para enviar mensaje por WhatsApp
  const enviarWhatsApp = (empresa) => {
    const mensaje = encodeURIComponent("MENSAJE ENVIADO DESDE EL FACTURADOR DE BYTE FUSION SOLUCIONES");
    const url = `https://wa.me/${empresa.whatsapp}?text=${mensaje}`;
    window.open(url, '_blank');
  };

  // Función para visitar el website de la empresa
  const visitarWebsite = (url) => {
    window.open(url, '_blank');
  };

  return (
    <>
      <header className={`
        sticky top-0 z-40 transition-all duration-300 ease-out
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-lg shadow-blue-900/5' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50/80 backdrop-blur-sm'
        }
      `}>
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Left Section - Sistema de Facturación */}
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
            
            {/* Logo y título - Versión responsive */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-10 w-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div className={isSmallMobile ? 'hidden' : 'block'}>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text text-transparent">
                  Sistema de Facturación
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Byte Fusion Soluciones
                </p>
              </div>
            </div>
          </div>

          {/* Center Section - Banner Publicitario Animado (oculto en móviles pequeños) */}
          {!isSmallMobile && (
            <div className="flex-1 flex justify-center mx-4 relative overflow-hidden">
              <div 
                className={`
                  relative flex items-center justify-center space-x-3 px-6 py-3 rounded-2xl shadow-lg cursor-pointer
                  transition-all duration-700 ease-out transform hover:scale-105 hover:shadow-2xl
                  bg-gradient-to-r ${currentAd.colores.from} ${currentAd.colores.to}
                  ${isAnimating ? 'animate-pulse scale-95 opacity-80' : 'scale-100 opacity-100'}
                  min-w-0 max-w-sm
                `}
                onClick={openAdModal}
              >
                {/* Efecto de brillo animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                
                {/* Contenido del banner */}
                <div className="relative flex items-center space-x-3 z-10">
                  <div className="flex-shrink-0 bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm md:text-base truncate">
                      {currentAd.nombre}
                    </div>
                    <div className="text-white/80 text-xs font-medium truncate hidden sm:block">
                      {currentAd.slogan}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-white/90 text-xs font-semibold ml-1">
                      {currentAd.rating}
                    </span>
                  </div>
                </div>

                {/* Indicadores de progreso */}
                <div className="absolute bottom-0 left-0 right-0 flex space-x-1 p-1">
                  {empresasPublicitarias.map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                        index === currentAdIndex 
                          ? 'bg-white animate-pulse' 
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right Section - Estado de Hacienda con diseño responsive */}
          <div className="flex items-center space-x-2">
            {/* Estado de conexión con Hacienda - Versión compacta para móviles */}
            <div 
              className={`
                flex items-center px-3 py-2 rounded-xl transition-all duration-300 ease-out
                border backdrop-blur-sm shadow-sm relative
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
              {/* Indicador de estado */}
              <div className={`
                w-2 h-2 rounded-full mr-2 animate-pulse flex-shrink-0
                ${connectionStatus.status === 'success' 
                  ? 'bg-green-500 group-hover:bg-green-600' 
                  : connectionStatus.status === 'warning'
                  ? 'bg-amber-500 group-hover:bg-amber-600'
                  : 'bg-red-500 group-hover:bg-red-600'
                }
              `} />
              
              {/* Icono según estado */}
              {connectionStatus.status === 'success' ? (
                <FaCheckCircle className={`${isSmallMobile ? 'mr-1' : 'mr-2'} text-green-500 flex-shrink-0`} />
              ) : (
                <FaExclamationTriangle className={`${isSmallMobile ? 'mr-1' : 'mr-2'} flex-shrink-0`} />
              )}
              
              {/* Texto según tamaño de pantalla */}
              <span className={`font-medium whitespace-nowrap ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                {isSmallMobile ? connectionStatus.shortText : `Hacienda: ${connectionStatus.text}`}
              </span>

              {/* Tooltip para mostrar información completa en móviles */}
              {showHaciendaTooltip && isSmallMobile && (
                <div className="absolute top-full right-0 mt-2 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-50 shadow-lg whitespace-nowrap">
                  <div className="font-semibold">Estado Hacienda:</div>
                  <div>{connectionStatus.text}</div>
                  <div className="w-3 h-3 bg-gray-800 absolute -top-1 right-3 transform rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Efecto de borde inferior */}
        <div className="h-1 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
      </header>

      {/* Modal de Publicidad Mejorado */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform animate-slideInUp">
            {/* Header del Modal con Banner de la Empresa */}
            <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
              {/* Banner de la empresa */}
              <img 
                src={currentAd.banner} 
                alt={`Banner de ${currentAd.nombre}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              
              {/* Fallback si no carga el banner */}
              <div className={`absolute inset-0 bg-gradient-to-br ${currentAd.colores.from} ${currentAd.colores.to} hidden items-center justify-center`}>
                <div className="text-white text-center p-4">
                  <IconComponent className="h-16 w-16 mx-auto mb-2" />
                  <h2 className="text-2xl font-bold">{currentAd.nombre}</h2>
                  <p className="text-lg opacity-90">{currentAd.slogan}</p>
                </div>
              </div>
              
              {/* Logo de la empresa */}
              <div className="absolute bottom-4 left-6 bg-white p-2 rounded-2xl shadow-lg">
                <img 
                  src={currentAd.logo} 
                  alt={`Logo de ${currentAd.nombre}`}
                  className="w-16 h-16 object-contain rounded-xl"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className={`w-16 h-16 ${currentAd.colores.accent} rounded-xl hidden items-center justify-center`}>
                  <IconComponent className={`h-8 w-8 ${currentAd.colores.text}`} />
                </div>
              </div>
              
              {/* Botón cerrar */}
              <button 
                onClick={closeAdModal}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white rounded-full p-2 transition-all backdrop-blur-sm"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            {/* Contenido del Modal */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{currentAd.nombre}</h2>
                  <p className="text-lg text-gray-600">{currentAd.slogan}</p>
                </div>
                <button 
                  onClick={() => visitarWebsite(currentAd.website)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                >
                  <span>Visitar</span>
                  <FaExternalLinkAlt className="h-3 w-3" />
                </button>
              </div>
              
              <p className="text-gray-700 text-base mb-6 leading-relaxed">
                {currentAd.descripcion}
              </p>
              
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 text-lg">Servicios destacados:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {currentAd.servicios.map((servicio, index) => (
                    <div key={index} className={`
                      flex items-center space-x-2 ${currentAd.colores.accent} ${currentAd.colores.text} 
                      px-3 py-2 rounded-xl font-medium
                    `}>
                      <div className="w-2 h-2 bg-current rounded-full"></div>
                      <span className="text-sm">{servicio}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border-l-4 border-blue-500 mb-6">
                <h3 className="font-bold text-gray-800 mb-2 text-lg flex items-center">
                  <FaBell className="mr-2 text-blue-500" />
                  Información de Contacto:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <p className="text-gray-600 font-medium">Email: {currentAd.contacto}</p>
                  <p className="text-gray-600 font-medium">Teléfono: {currentAd.telefono}</p>
                  <p className="text-gray-600 font-medium">WhatsApp: {currentAd.whatsapp}</p>
                  <p className="text-gray-600 font-medium">Web: {currentAd.website.replace('https://', '')}</p>
                </div>
              </div>
              
              {/* Botón de WhatsApp */}
              <div className="flex justify-center">
                <button 
                  onClick={() => enviarWhatsApp(currentAd)}
                  className="flex items-center space-x-3 px-8 py-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl w-full max-w-md justify-center"
                >
                  <FaWhatsapp className="h-6 w-6" />
                  <span className="font-bold text-lg">Contactar por WhatsApp</span>
                </button>
              </div>
            </div>
            
            {/* Footer del Modal con controles mejorados */}
            <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={prevAd}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all shadow-sm hover:shadow-md"
              >
                <FaArrowRight className="rotate-180" />
                <span>Anterior</span>
              </button>
              
              <div className="flex space-x-2">
                {empresasPublicitarias.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAdIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentAdIndex 
                        ? `${currentAd.colores.from.replace('from-', 'bg-')} shadow-lg` 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <button 
                onClick={nextAd}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all shadow-sm hover:shadow-md"
              >
                <span>Siguiente</span>
                <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS adicionales para animaciones */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(50px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
}