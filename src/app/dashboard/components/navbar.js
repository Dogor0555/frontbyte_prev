// src/app/dashboard/components/navbar.js
'use client';

import { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaBars, 
  FaTimes,
  FaBuilding,
  FaWhatsapp,
  FaExternalLinkAlt,
  FaSync,
  FaFlag,
  FaStar,
  FaArrowRight
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    const adInterval = setInterval(() => {
      const nextIndex = currentAdIndex === empresasPublicitarias.length - 1 ? 0 : currentAdIndex + 1;
      setNextAdIndex(nextIndex);
      
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentAdIndex(nextIndex);
        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      }, 400);
      
    }, 8000);

    return () => clearInterval(adInterval);
  }, [currentAdIndex, empresasPublicitarias.length]);

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
      const response = await fetch('http://localhost:3000/hacienda/token-check', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setHaciendaConnection({
          connected: true,
          expiresIn: data.expires_in || 3600
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
        await fetch('http://localhost:3000/clearTokenhacienda', {
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

  const openAdModal = () => {
    setShowAdModal(true);
  };

  const closeAdModal = () => {
    setShowAdModal(false);
  };

  const prevAd = () => {
    setCurrentAdIndex((prevIndex) => 
      prevIndex === 0 ? empresasPublicitarias.length - 1 : prevIndex - 1
    );
  };

  const nextAd = () => {
    setCurrentAdIndex((prevIndex) => 
      prevIndex === empresasPublicitarias.length - 1 ? 0 : prevIndex + 1
    );
  };

  const enviarWhatsApp = (empresa) => {
    const mensaje = encodeURIComponent("MENSAJE ENVIADO DESDE EL FACTURADOR DE BYTE FUSION SOLUCIONES");
    const url = `https://wa.me/${empresa.whatsapp}?text=${mensaje}`;
    window.open(url, '_blank');
  };

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
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                
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
                </div>

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

          <div className="flex items-center space-x-3">
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
        </div>

        <div className="h-1 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
      </header>

      {showAdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform animate-slideInUp">
            <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
              <img 
                src={currentAd.banner} 
                alt={`Banner de ${currentAd.nombre}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              
              <div className={`absolute inset-0 bg-gradient-to-br ${currentAd.colores.from} ${currentAd.colores.to} hidden items-center justify-center`}>
                <div className="text-white text-center p-4">
                  <IconComponent className="h-16 w-16 mx-auto mb-2" />
                  <h2 className="text-2xl font-bold">{currentAd.nombre}</h2>
                  <p className="text-lg opacity-90">{currentAd.slogan}</p>
                </div>
              </div>
              
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
              
              <button 
                onClick={closeAdModal}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white rounded-full p-2 transition-all backdrop-blur-sm"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
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
                  Información de Contacto:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <p className="text-gray-600 font-medium">Email: {currentAd.contacto}</p>
                  <p className="text-gray-600 font-medium">Teléfono: {currentAd.telefono}</p>
                  <p className="text-gray-600 font-medium">WhatsApp: {currentAd.whatsapp}</p>
                  <p className="text-gray-600 font-medium">Web: {currentAd.website.replace('https://', '')}</p>
                </div>
              </div>
              
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
            
            <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={prevAd}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all shadow-sm hover:shadow-md"
              >
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
              </button>
            </div>
          </div>
        </div>
      )}

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