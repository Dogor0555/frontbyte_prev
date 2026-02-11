"use client";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import Image from "next/image";
import {
  FaHome,
  FaFileInvoiceDollar,
  FaUsers,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaUserAlt,
  FaBuilding,
  FaBoxOpen,
  FaFileContract,
  FaFileInvoice,
  FaFileAlt,
  FaUserTie,
  FaCreditCard,
  FaBook,
  FaChartLine,
  FaEdit,
  FaEye,
  FaBan,
  FaChevronDown,
  FaChevronRight,
  FaArrowCircleUp,
  FaArrowCircleDown,
  FaExclamationTriangle,
  FaTruck,
  FaReceipt,
  FaClipboardList,
  FaHistory,
  FaUserCheck,
  FaFileExport,
  FaTicketAlt,
  FaGlobe,
  FaFilePdf,
  FaWrench,
  FaShoppingCart,
  FaCartPlus,
  FaBriefcase,
  FaStore,
  FaMapMarkerAlt
} from "react-icons/fa";
import logo from "../../../app/images/logoo.png";
import { logout, isAdmin } from "../../services/auth";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { usePathname } from "next/navigation";

export default function Sidebar({ onOpenPerfil }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [sucursal, setSucursal] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    dtes: false,
    facturas: false,
    creditos: false,
    remision: false,
    retencion: false,
    liquidacion: false,
    admin: false,
    consumidorfinal: false,
    contribuyentes: false,
    exportacion: false,
    compras: false,
  });

  useEffect(() => {
    const empleadoData = localStorage.getItem("empleado");
    const empresaData = localStorage.getItem("empresa");
    const sucursalData = localStorage.getItem("sucursal");
    
    if (empleadoData) {
      const empleadoParsed = JSON.parse(empleadoData);
      setEmpleado(empleadoParsed);
      console.log('Empleado cargado:', empleadoParsed.nombre);
    }
    
    if (empresaData) {
      const empresaParsed = JSON.parse(empresaData);
      setEmpresa(empresaParsed);
      console.log('Empresa cargada:', empresaParsed.nombre);
    }
    
    // 🟢 CORREGIDO: SOLO USA LA SUCURSAL DEL LOCALSTORAGE, NUNCA LA CREES GENÉRICA
    if (sucursalData) {
      const sucursalParsed = JSON.parse(sucursalData);
      setSucursal(sucursalParsed);
      console.log('✅ Sucursal cargada:', sucursalParsed.nombre);
      console.log('📦 Datos completos sucursal:', sucursalParsed);
    } else {
      console.warn('⚠️ No hay sucursal en localStorage. El backend no la envió o no se guardó correctamente.');
      // NO CREES UNA SUCURSAL GENÉRICA AQUÍ
    }
    
    cargarPermisos();
  }, []);

  // 👇 MEJORADO: Determinar qué menú abrir basado en la ruta actual
  useEffect(() => {
    const determineOpenMenu = () => {
      const newOpenMenus = { ...openMenus };
      
      // Resetear todos los menús a false
      Object.keys(newOpenMenus).forEach(key => {
        newOpenMenus[key] = false;
      });

      // DTE y sus variantes
      if (pathname.includes('/dte_factura') || 
          pathname.includes('/dte_credito') || 
          pathname.includes('/dte_nota_remision') || 
          pathname.includes('/dte_exportacion') || 
          pathname.includes('/dte_liquidacion')) {
        newOpenMenus.dtes = true;
      }
      
      // Facturas
      else if (pathname.includes('/facturas') && 
               !pathname.includes('sujeto_excluido') && 
               !pathname.includes('exportacion')) {
        newOpenMenus.facturas = true;
      }
      
      // Créditos
      else if (pathname.includes('/creditos') || 
               pathname.includes('/nota_debito')) {
        newOpenMenus.creditos = true;
      }
      
      // Notas de Remisión
      else if (pathname.includes('/notas_remision') || 
               pathname.includes('/anular_nota_remision')) {
        newOpenMenus.remision = true;
      }
      
      // Sujeto Excluido
      else if (pathname.includes('/facturas_sujeto_excluido') || 
               pathname.includes('/anular_facturas_sujeto_excluido') ||
               pathname.includes('/sujeto_excluido')) {
        newOpenMenus.sujeto_excluido = true;
      }
      
      // Liquidación
      else if (pathname.includes('/liquidacion') || 
               pathname.includes('/comprobantes_liquidacion') ||
               pathname.includes('/anular_liquidacion')) {
        newOpenMenus.liquidacion = true;
      }
      
      // Exportación
      else if (pathname.includes('/exportacion') || 
               pathname.includes('/facturas_exportacion') ||
               pathname.includes('/anular_factura_exportacion')) {
        newOpenMenus.exportacion = true;
      }
      
      // Contribuyentes
      else if (pathname.includes('/contribuyente') || 
               pathname.includes('/libro_contribuyente') ||
               pathname.includes('/anexo_contribuyente') ||
               pathname.includes('/detalle_documentos_contribuyentes')) {
        newOpenMenus.contribuyentes = true;
      }
      
      // Consumidor Final
      else if (pathname.includes('/consumidor_final') || 
               pathname.includes('/libro_consumidor_final') ||
               pathname.includes('/anexo_consumidor_final') ||
               pathname.includes('/detalle_documentos_consumidor_final')) {
        newOpenMenus.consumidorfinal = true;
      }
      
      // Compras
      else if (pathname.includes('/compras') || 
               pathname.includes('/realizar_compra') ||
               pathname.includes('/registro_compras')) {
        newOpenMenus.compras = true;
      }
      
      // Administración
      else if (pathname.includes('/empleados') || 
               pathname.includes('/productos') || 
               pathname.includes('/clientes') ||
               pathname.includes('/registro-eventos') ||
               pathname.includes('/configurar-pdf') ||
               pathname.includes('/configurar-tickets')) {
        newOpenMenus.admin = true;
      }

      setOpenMenus(newOpenMenus);
    };

    determineOpenMenu();
  }, [pathname]);

  const cargarPermisos = async () => {
    try {
      setLoadingPermisos(true);
      const response = await fetch(`${API_BASE_URL}/permisos/`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setPermisos(data.permisos || []);
      } else {
        console.error('Error al cargar permisos:', response.status);
        setPermisos([]);
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      setPermisos([]);
    } finally {
      setLoadingPermisos(false);
    }
  };

  const tienePermiso = (nombrePermiso) => {
    if (loadingPermisos) return false;
    return permisos.includes(nombrePermiso);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      localStorage.removeItem("empleado");
      localStorage.removeItem("empresa");
      localStorage.removeItem("sucursal");
      router.push("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMenu = (menu) => {
    setOpenMenus((prevState) => ({
      ...prevState,
      [menu]: !prevState[menu],
    }));
  };

  const isActive = (href) => {
    return pathname === href;
  };

  const todosLosMenuItems = [
    { 
      name: "Inicio", 
      icon: <FaHome />, 
      href: "/dashboard",
      permiso: "Inicio" 
    },
    { 
      name: "Realizar Cotización", 
      icon: <FaFileContract />, 
      href: "/dashboard/realizar_cotizacion",
      permiso: "Realizar Cotización" 
    },
    {
      name: "DTES",
      icon: <FaFileInvoiceDollar />,
      href: "#",
      subMenu: [
        { 
          name: "DTE Factura", 
          icon: <FaFileInvoice />, 
          href: "/dashboard/dte_factura",
          permiso: "DTE Factura" 
        },
        { 
          name: "DTE Crédito", 
          icon: <FaFileContract />, 
          href: "/dashboard/dte_credito",
          permiso: "DTE Crédito" 
        },
        { 
          name: "DTE Nota de Remisión", 
          icon: <FaTruck />, 
          href: "/dashboard/dte_nota_remision",
          permiso: "DTE Nota de Remisión" 
        },
        { 
          name: "DTE Sujeto Excluido", 
          icon: <FaClipboardList />, 
          href: "/dashboard/sujeto_excluido",
          permiso: "DTE Sujeto Excluido" 
        },
        { 
          name: "DTE Exportación", 
          icon: <FaFileExport />, 
          href: "/dashboard/dte_exportacion",
          permiso: "DTE Exportación" 
        },
        { 
          name: "DTE Liquidación", 
          icon: <FaClipboardList />, 
          href: "/dashboard/dte_liquidacion",
          permiso: "DTE Liquidacion" 
        },
      ],
      menuKey: "dtes",
      permiso: "DTES"
    },
    {
      name: "Facturas",
      icon: <FaFileInvoice />,
      href: "#",
      subMenu: [
        { 
          name: "Ver Facturas", 
          icon: <FaEye />, 
          href: "/dashboard/facturas",
          permiso: "Ver Facturas" 
        },
        { 
          name: "Anular Facturas", 
          icon: <FaBan />, 
          href: "/dashboard/anular_facturas",
          permiso: "Anular Facturas" 
        },
      ],
      menuKey: "facturas",
      permiso: "Facturas"
    },
    {
      name: "Créditos",
      icon: <FaCreditCard />,
      href: "#",
      subMenu: [
        { 
          name: "Ver Créditos", 
          icon: <FaEye />, 
          href: "/dashboard/creditos",
          permiso: "Ver Créditos" 
        },
        { 
          name: "Anular Créditos", 
          icon: <FaBan />, 
          href: "/dashboard/anular_creditos",
          permiso: "Anular Créditos" 
        },
        { 
          name: "Enviar Nota de Crédito/Débito", 
          icon: <FaArrowCircleUp />, 
          href: "/dashboard/nota_debito",
          permiso: "Enviar Nota de Crédito/Débito" 
        },
      ],
      menuKey: "creditos",
      permiso: "Créditos"
    },
    {
      name: "Notas de Remisión",
      icon: <FaTruck />,
      href: "#",
      subMenu: [
        { 
          name: "Ver Notas de Remisión", 
          icon: <FaEye />, 
          href: "/dashboard/notas_remision",
          permiso: "Ver Notas de Remisión" 
        },
        { 
          name: "Anular Notas de Remisión", 
          icon: <FaBan />, 
          href: "/dashboard/anular_nota_remision",
          permiso: "Anular Nota de Remision" 
        },
      ],
      menuKey: "remision",
      permiso: "Notas de Remisión"
    },
    {
      name: "Sujeto Excluido",
      icon: <FaClipboardList />,
      href: "#",
      subMenu: [
        { 
          name: "Ver Facturas Sujeto Excluido", 
          icon: <FaEye />, 
          href: "/dashboard/facturas_sujeto_excluido",
          permiso: "Ver Facturas Sujeto Excluido" 
        },
        { 
          name: "Anular Factura Sujeto Excluido", 
          icon: <FaBan />, 
          href: "/dashboard/anular_facturas_sujeto_excluido",
          permiso: "Anular Factura Sujeto Excluido" 
        },
      ],
      menuKey: "sujeto_excluido",
      permiso: "Facturas Sujeto Excluido"
    },
    {
      name: "Liquidación",
      icon: <FaClipboardList />,
      href: "#",
      subMenu: [
        { 
          name: "Ver Comprobantes", 
          icon: <FaEye />, 
          href: "/dashboard/comprobantes_liquidacion",
          permiso: "Ver Comprobantes de Liquidación" 
        },
        { 
          name: "Anular Liquidación", 
          icon: <FaBan />, 
          href: "/dashboard/anular_liquidacion",
          permiso: "Anular Liquidacion" 
        },
      ],
      menuKey: "liquidacion",
      permiso: "Liquidacion"
    },
    {
      name: "Facturas de Exportación",
      icon: <FaGlobe />,
      href: "#",
      subMenu: [
        { 
          name: "Ver Facturas de Exportación", 
          icon: <FaEye />, 
          href: "/dashboard/facturas_exportacion",
          permiso: "Ver Facturas de Exportación" 
        },
        { 
          name: "Anular Facturas de Exportación", 
          icon: <FaBan />, 
          href: "/dashboard/anular_factura_exportacion",
          permiso: "Anular Facturas de Exportación" 
        },
      ],
      menuKey: "exportacion",
      permiso: "Facturas de Exportación"
    },
    { 
      name: "Contingencia", 
      icon: <FaExclamationTriangle />, 
      href: "/dashboard/contingencia",
      permiso: "Contingencia" 
    },
    {
      name: "Ventas a Contribuyentes",
      icon: <FaBook />,
      href: "#",
      subMenu: [
        { 
          name: "Libro de Ventas a Contribuyentes", 
          icon: <FaBook />, 
          href: "/dashboard/libro_contribuyente",
          permiso: "Libro de Ventas a Contribuyentes" 
        },
        { 
          name: "Anexo de Contribuyentes", 
          icon: <FaBook />, 
          href: "/dashboard/anexo_contribuyente",
          permiso: "Anexo de Contribuyentes" 
        },
        { 
          name: "Detalle de Documentos", 
          icon: <FaFilePdf />, 
          href: "/dashboard/detalle_documentos_contribuyentes",
          permiso: "Detalle de Documentos Contribuyentes" 
        },
      ],
      menuKey: "contribuyentes",
      permiso: "Ventas a Contribuyentes"
    },
    {
      name: "Ventas a Consumidor Final",
      icon: <FaBook />,
      href: "#",
      subMenu: [
        { 
          name: "Libro de Ventas a Consumidor Final", 
          icon: <FaBook />, 
          href: "/dashboard/libro_consumidor_final",
          permiso: "Libro de Ventas a Consumidor Final" 
        },
        { 
          name: "Anexo de Consumidor Final", 
          icon: <FaFileAlt />, 
          href: "/dashboard/anexo_consumidor_final",
          permiso: "Anexo de Consumidor Final" 
        },
        { 
          name: "Detalle de Documentos", 
          icon: <FaFilePdf />, 
          href: "/dashboard/detalle_documentos_consumidor_final",
          permiso: "Detalle de Documentos Consumidor Final" 
        },
      ],
      menuKey: "consumidorfinal",
      permiso: "Ventas a Consumidor Final"
    },
    {
      name: "Compras",
      icon: <FaShoppingCart />,
      href: "#",
      subMenu: [
        {
          name: "Realizar Compra",
          icon: <FaCartPlus />,
          href: "/dashboard/realizar_compra",
          permiso: "Realizar Compras"
        },
        {
          name: "Registro de Compras",
          icon: <FaBook />,
          href: "/dashboard/registro_compras",
          permiso: "Compras"
        },
      ],
      menuKey: "compras",
      permiso: "Compras"
    },
    { 
      name: "Reportes", 
      icon: <FaChartLine />, 
      href: "/dashboard/reportes",
      permiso: "Reportes" 
    },
    { 
      name: "Editar Sucursal", 
      icon: <FaEdit />, 
      href: "/dashboard/editar_sucursal",
      permiso: "Editar Sucursal" 
    },
  ];

  const menuItems = todosLosMenuItems.filter(item => {
    if (item.subMenu) {
      const subMenuConPermiso = item.subMenu.filter(subItem => 
        tienePermiso(subItem.permiso)
      );
      return subMenuConPermiso.length > 0;
    }
    return tienePermiso(item.permiso);
  });

  if (tienePermiso("Administración")) {
    const adminSubMenu = [];
    
    if (tienePermiso("Empleados")) {
      adminSubMenu.push({ 
        name: "Empleados", 
        icon: <FaUserTie />, 
        href: "/dashboard/empleados",
        permiso: "Empleados" 
      });
    }
    
    if (tienePermiso("Productos")) {
      adminSubMenu.push({ 
        name: "Productos", 
        icon: <FaBoxOpen />, 
        href: "/dashboard/productos",
        permiso: "Productos" 
      });
    }
    
    if (tienePermiso("Clientes")) {
      adminSubMenu.push({ 
        name: "Clientes", 
        icon: <FaBuilding />, 
        href: "/dashboard/clientes",
        permiso: "Clientes" 
      });
    }

    if (tienePermiso("Registro de eventos")) {
      adminSubMenu.push({
        name: "Registro de eventos",
        icon: <FaHistory />,
        href: "/dashboard/registro-eventos",
        permiso: "Registro de eventos"
      });
    }

    if (tienePermiso("Configurar PDF")) {
      adminSubMenu.push({
        name: "Configurar PDF",
        icon: <FaWrench />,
        href: "/dashboard/configurar-pdf",
        permiso: "Configurar PDF"
      });
    }

    if (tienePermiso("Configurar Tickets")) {
      adminSubMenu.push({
        name: "Configurar Tickets",
        icon: <FaTicketAlt />,
        href: "/dashboard/configurar-tickets",
        permiso: "Configurar Tickets"
      });
    }

    if (adminSubMenu.length > 0) {
      menuItems.push({
        name: "Administración",
        icon: <FaCog />,
        href: "#",
        subMenu: adminSubMenu,
        menuKey: "admin",
        permiso: "Administración"
      });
    }
  }

  const perfilLabel = empleado && isAdmin(empleado) ? "Editar Perfil" : "Ver Perfil";

  return (
    <aside className="bg-gradient-to-b from-blue-900 via-blue-900 to-blue-800 h-full w-64 shadow-2xl">
      <div className="flex flex-col h-full">

        {/* ✨ HEADER EXPANDIBLE - CON SUCURSAL */}
        <div 
          className={`
            bg-gradient-to-br from-blue-800 via-blue-700 to-blue-800 
            flex flex-col items-center justify-center 
            border-b border-blue-600/50 shadow-lg px-4
            transition-all duration-500 ease-in-out overflow-hidden
            ${headerExpanded ? 'py-6' : 'py-4'}
          `}
          onMouseEnter={() => setHeaderExpanded(true)}
          onMouseLeave={() => setHeaderExpanded(false)}
        >
          {/* Logo con animación */}
          <div 
            className={`
              bg-white relative rounded-full overflow-hidden 
              shadow-xl ring-4 ring-blue-300/40
              transition-all duration-500 ease-in-out
              ${headerExpanded ? 'h-20 w-20 mb-4' : 'h-14 w-14 mb-2'}
            `}
          >
            <Image 
              src={logo} 
              alt="Byte Fusion Soluciones" 
              fill 
              className="object-cover p-1" 
            />
          </div>
          
          {/* Nombre de la empresa - Siempre visible */}
          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FaBriefcase 
                className={`
                  text-blue-200 transition-all duration-300
                  ${headerExpanded ? 'text-base' : 'text-xs'}
                `} 
              />
              <h1 
                className={`
                  text-white font-bold tracking-wide drop-shadow-md
                  transition-all duration-300 truncate max-w-full
                  ${headerExpanded ? 'text-base' : 'text-sm'}
                `}
              >
                {empresa ? empresa.nombre : 'Byte Fusion Soluciones'}
              </h1>
            </div>
            
            {/* 🟢 CORREGIDO: SOLO MUESTRA SUCURSAL SI EXISTE Y USA SU NOMBRE REAL */}
            {sucursal && (
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <FaStore className="text-blue-300 text-xs" />
                <span className="text-blue-100 text-xs font-medium">
                  {sucursal.nombre}
                </span>
              </div>
            )}
            
            {/* Información expandible - Solo visible en hover */}
            <div 
              className={`
                transition-all duration-500 ease-in-out space-y-2
                ${headerExpanded 
                  ? 'opacity-100 max-h-32 transform translate-y-0' 
                  : 'opacity-0 max-h-0 transform -translate-y-4'
                }
              `}
            >
              {/* NIT */}
              {empresa?.nit && (
                <div className="text-blue-100 text-xs font-medium bg-blue-800/60 px-3 py-1.5 rounded-full inline-block backdrop-blur-sm border border-blue-600/30">
                  <span className="text-blue-300">NIT:</span> {empresa.nit}
                </div>
              )}
              
              {/* Ambiente */}
              {empresa?.ambiente && (
                <div 
                  className={`
                    text-xs font-semibold px-3 py-1.5 rounded-full inline-block
                    backdrop-blur-sm transition-all duration-300
                    ${empresa.ambiente === '00' 
                      ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/40 shadow-yellow-500/20' 
                      : 'bg-green-500/20 text-green-200 border border-green-400/40 shadow-green-500/20'
                    }
                    shadow-lg
                  `}
                >
                  {empresa.ambiente === '00' ? 'Ambiente de Pruebas' : 'Ambiente de Producción'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📱 Navigation */}
        <nav className="flex-1 py-5 px-3 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1.5">
            {menuItems.map(({ name, icon, href, subMenu, menuKey }) => (
              <li key={name}>
                {subMenu ? (
                  <div className="group">
                    {/* Parent Menu Item */}
                    <button
                      className={`
                        w-full flex items-center justify-between px-4 py-3 
                        text-blue-100 rounded-xl transition-all duration-300 ease-out
                        ${openMenus[menuKey] 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 border-l-4 border-blue-300 scale-[1.02]' 
                          : 'hover:bg-gradient-to-r hover:from-blue-700/50 hover:to-blue-600/50 hover:text-white hover:shadow-md hover:scale-[1.01]'
                        }
                      `}
                      onClick={() => toggleMenu(menuKey)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg transition-transform duration-300 ${openMenus[menuKey] ? 'scale-110' : ''}`}>
                          {icon}
                        </span>
                        <span className="font-medium text-sm">{name}</span>
                      </div>
                      <span className={`
                        text-sm transition-all duration-300 ease-out
                        ${openMenus[menuKey] ? 'rotate-180 text-white' : 'text-blue-300'}
                      `}>
                        <FaChevronDown />
                      </span>
                    </button>
                    
                    {/* Submenu */}
                    <div className={`
                      overflow-hidden transition-all duration-400 ease-out
                      ${openMenus[menuKey] ? 'max-h-[500px] opacity-100 mt-2 mb-2' : 'max-h-0 opacity-0 mt-0'}
                    `}>
                      <div className="rounded-xl bg-blue-800/60 border border-blue-700/40 shadow-inner p-2 ml-3 backdrop-blur-sm">
                        <ul className="space-y-1">
                          {subMenu
                            .filter(subItem => tienePermiso(subItem.permiso))
                            .map(({ name: subName, icon: subIcon, href: subHref }, index) => (
                            <li 
                              key={subName}
                              className={`
                                transition-all duration-300 ease-out
                                ${openMenus[menuKey] 
                                  ? 'translate-x-0 opacity-100' 
                                  : 'translate-x-4 opacity-0'
                                }
                              `}
                              style={{
                                transitionDelay: openMenus[menuKey] ? `${index * 40}ms` : '0ms'
                              }}
                            >
                              <Link
                                href={subHref}
                                className={`
                                  flex items-center gap-3 px-3 py-2.5 text-blue-100 
                                  rounded-lg transition-all duration-200 ease-out relative group/sub
                                  ${isActive(subHref) 
                                    ? 'bg-gradient-to-r from-blue-600/70 to-blue-500/70 text-white border-l-4 border-blue-300 font-semibold shadow-md' 
                                    : 'hover:bg-gradient-to-r hover:from-blue-700/40 hover:to-blue-600/40 hover:text-white hover:translate-x-1'
                                  }
                                `}
                              >
                                <span className="text-base">{subIcon}</span>
                                <span className="text-sm flex-1">{subName}</span>
                                {isActive(subHref) ? (
                                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                                ) : (
                                  <FaChevronRight className="text-xs text-blue-300 opacity-0 group-hover/sub:opacity-100 transition-opacity" />
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={href}
                    className={`
                      flex items-center gap-3 px-4 py-3 text-blue-100 
                      rounded-xl transition-all duration-300 ease-out relative group/item
                      ${isActive(href) 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 border-l-4 border-blue-300 scale-[1.02]' 
                        : 'hover:bg-gradient-to-r hover:from-blue-700/50 hover:to-blue-600/50 hover:text-white hover:shadow-md hover:scale-[1.01]'
                      }
                    `}
                  >
                    <span className={`text-lg transition-transform duration-300 ${isActive(href) ? 'scale-110' : ''}`}>
                      {icon}
                    </span>
                    <span className="font-medium text-sm flex-1">{name}</span>
                    {isActive(href) ? (
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                    ) : (
                      <FaChevronRight className="text-xs text-blue-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* 👤 Employee Info - SIN SUCURSAL DUPLICADA */}
        {empleado && (
          <div className="p-4 border-t border-blue-600/50 bg-gradient-to-br from-blue-800/90 to-blue-700/90 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/40 rounded-xl p-4 border border-blue-600/30 shadow-lg hover:shadow-xl hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                {/* Avatar con gradiente y status */}
                <div className="relative flex-shrink-0">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <FaUserAlt className="text-white text-lg" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-800 animate-pulse shadow-lg shadow-green-400/50"></div>
                </div>

               {/* Información del empleado - SOLO nombre y rol */}
<div className="flex-1 min-w-0">
  <h3 className="font-bold text-white text-xs sm:text-sm break-words leading-tight line-clamp-2">
    {empleado.nombre}
  </h3>

  <div className="flex items-center gap-2 mt-1">
    <span className="px-2.5 py-1 bg-blue-700/60 rounded-full text-blue-100 text-xs font-medium border border-blue-500/30 whitespace-nowrap">
      {empleado.rol}
    </span>

    <span className="text-xs text-blue-200 bg-blue-800/30 px-2 py-1 rounded-lg border border-blue-500/20 whitespace-nowrap">
      ● Activo
    </span>
  </div>
</div>

              </div>
            </div>
          </div>
        )}

        {/* 👤 Profile Button */}
        {empleado && (
          <div className="bg-gradient-to-br from-blue-800/90 to-blue-700/90 p-4 border-t border-blue-600/50">
            <Link
              href="/dashboard/editar_perfil"
              scroll={false}
              className={`
                flex items-center justify-center gap-3 w-full px-4 py-3.5 
                border rounded-xl transition-all duration-300 font-medium text-sm
                ${isActive('/dashboard/editar_perfil') 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/30' 
                  : 'text-blue-200 border-blue-500/50 hover:bg-gradient-to-r hover:from-blue-700/60 hover:to-blue-600/60 hover:text-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20'
                }
                hover:scale-[1.02]
              `}
            >
              <FaUserAlt className="text-base" />
              <span>{perfilLabel}</span>
              {isActive('/dashboard/editar_perfil') && (
                <div className="ml-auto w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
              )}
            </Link>
          </div>
        )}

        {/* 🚪 Logout Button */}
        <div className="bg-gradient-to-br from-blue-800/90 to-blue-700/90 p-4 border-t border-blue-600/50">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              flex items-center justify-center gap-3 w-full px-4 py-3.5 
              text-blue-200 border border-red-500/50 rounded-xl 
              transition-all duration-300 font-medium text-sm
              hover:bg-gradient-to-r hover:from-red-600/70 hover:to-red-500/70 
              hover:text-white hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20
              hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <FaSignOutAlt className={`text-base ${isLoggingOut ? "animate-spin" : ""}`} />
            <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 58, 138, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.5);
          border-radius: 10px;
          transition: background 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.8);
        }
      `}</style>
    </aside>
  );
}