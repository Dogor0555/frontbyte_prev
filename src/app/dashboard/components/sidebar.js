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
  FaCartPlus
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
  const [permisos, setPermisos] = useState([]);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
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
    if (empleadoData) {
      const empleadoParsed = JSON.parse(empleadoData);
      setEmpleado(empleadoParsed);
      cargarPermisos();
    }
  }, []);

  // Determinar qué menú está abierto basado en la ruta actual
  useEffect(() => {
    const determineOpenMenu = () => {
      const newOpenMenus = { ...openMenus };
      
      // Check which menu should be open based on current path
      if (pathname.includes('/dte_') || pathname.includes('/sujeto_excluido')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'dtes') newOpenMenus[key] = false;
        });
        newOpenMenus.dtes = true;
      } else if (pathname.includes('/facturas') && !pathname.includes('sujeto_excluido') && !pathname.includes('exportacion')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'facturas') newOpenMenus[key] = false;
        });
        newOpenMenus.facturas = true;
      } else if (pathname.includes('/creditos') || pathname.includes('/nota_debito')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'creditos') newOpenMenus[key] = false;
        });
        newOpenMenus.creditos = true;
      } else if (pathname.includes('/notas_remision')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'remision') newOpenMenus[key] = false;
        });
        newOpenMenus.remision = true;
      } else if (pathname.includes('/facturas_sujeto_excluido') || pathname.includes('/anular_facturas_sujeto_excluido')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'sujeto_excluido') newOpenMenus[key] = false;
        });
        newOpenMenus.sujeto_excluido = true;
      } else if (pathname.includes('/liquidacion')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'liquidacion') newOpenMenus[key] = false;
        });
        newOpenMenus.liquidacion = true;
      } else if (pathname.includes('/exportacion')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'exportacion') newOpenMenus[key] = false;
        });
        newOpenMenus.exportacion = true;
      } else if (pathname.includes('/contribuyente')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'contribuyentes') newOpenMenus[key] = false;
        });
        newOpenMenus.contribuyentes = true;
      } else if (pathname.includes('/consumidor_final')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'consumidorfinal') newOpenMenus[key] = false;
        });
        newOpenMenus.consumidorfinal = true;
      } else if (pathname.includes('/compras')) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'compras') newOpenMenus[key] = false;
        });
        newOpenMenus.compras = true;
      } else if (
        pathname.includes('/empleados') || 
        pathname.includes('/productos') || 
        pathname.includes('/clientes') ||
        pathname.includes('/registro-eventos') ||
        pathname.includes('/configurar-pdf') ||
        pathname.includes('/configurar-tickets')
      ) {
        Object.keys(newOpenMenus).forEach(key => {
          if (key !== 'admin') newOpenMenus[key] = false;
        });
        newOpenMenus.admin = true;
      } else {
        // Si no está en ninguna subpágina, cerrar todos los menús
        Object.keys(newOpenMenus).forEach(key => {
          newOpenMenus[key] = false;
        });
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

  // Función para verificar si una ruta está activa
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

    // 📋 DTES
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
      permiso: "DTES",
      color: "bg-purple-900",
      borderColor: "border-purple-500",
      activeColor: "bg-purple-700"
    },

    // 🧾 Facturas
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
      permiso: "Facturas",
      color: "bg-emerald-900",
      borderColor: "border-emerald-500",
      activeColor: "bg-emerald-700"
    },

    // 💳 Créditos
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
      permiso: "Créditos",
      color: "bg-amber-900",
      borderColor: "border-amber-500",
      activeColor: "bg-amber-700"
    },

    // 🚚 Notas de Remisión
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
      permiso: "Notas de Remisión",
      color: "bg-orange-900",
      borderColor: "border-orange-500",
      activeColor: "bg-orange-700"
    },

    // 📜 Comprobante de Liquidación Electrónico (Sujeto Excluido)
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
      permiso: "Facturas Sujeto Excluido",
      color: "bg-teal-900",
      borderColor: "border-teal-500",
      activeColor: "bg-teal-700"
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
      permiso: "Liquidacion",
      color: "bg-cyan-900",
      borderColor: "border-cyan-500",
      activeColor: "bg-cyan-700"
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
      permiso: "Facturas de Exportación",
      color: "bg-violet-900",
      borderColor: "border-violet-500",
      activeColor: "bg-violet-700"
    },

    // ⚠️ Contingencia
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
      permiso: "Ventas a Contribuyentes",
      color: "bg-rose-900",
      borderColor: "border-rose-500",
      activeColor: "bg-rose-700"
    },

    // 👤 VENTAS A CONSUMIDOR FINAL
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
      permiso: "Ventas a Consumidor Final",
      color: "bg-pink-900",
      borderColor: "border-pink-500",
      activeColor: "bg-pink-700"
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
      permiso: "Compras",
      color: "bg-lime-900",
      borderColor: "border-lime-500",
      activeColor: "bg-lime-700"
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

  // Filtrar items del menú basado en permisos
  const menuItems = todosLosMenuItems.filter(item => {
    // Si el item tiene submenú, verificar si al menos un subitem tiene permiso
    if (item.subMenu) {
      const subMenuConPermiso = item.subMenu.filter(subItem => 
        tienePermiso(subItem.permiso)
      );
      return subMenuConPermiso.length > 0;
    }
    
    // Si es un item simple, verificar permiso directo
    return tienePermiso(item.permiso);
  });

  // Agregar menú de administración si tiene permisos
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

    // Nuevo: Configurar PDF
    if (tienePermiso("Configurar PDF")) {
      adminSubMenu.push({
        name: "Configurar PDF",
        icon: <FaWrench />,
        href: "/dashboard/configurar-pdf",
        permiso: "Configurar PDF"
      });
    }

    // Nuevo: Configurar Tickets
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
        permiso: "Administración",
        color: "bg-gray-900",
        borderColor: "border-gray-500",
        activeColor: "bg-gray-700"
      });
    }
  }

  const perfilLabel = empleado && isAdmin(empleado) ? "Editar Perfil" : "Ver Perfil";

  return (
    <aside className="bg-gradient-to-b from-blue-900 via-blue-900 to-blue-800 h-full w-64 shadow-2xl">
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-700 flex items-center justify-center h-20 border-b border-blue-600/50 shadow-lg">
          <div className="bg-white relative h-14 w-14 rounded-full overflow-hidden shadow-lg ring-4 ring-blue-300/30">
            <Image src={logo} alt="Byte Fusion Soluciones" fill className="object-cover" />
          </div>
          <div className="ml-3">
            <span className="text-white font-bold text-lg tracking-wide drop-shadow-sm">Facturador</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map(({ name, icon, href, subMenu, menuKey, color, borderColor, activeColor }) => (
              <li key={name}>
                {subMenu ? (
                  <div className="group">
                    {/* Parent Menu Item */}
                    <button
                      className={`
                        w-full flex items-center justify-between px-4 py-3 text-blue-100 rounded-xl 
                        transition-all duration-300 ease-out mb-1
                        ${openMenus[menuKey] 
                          ? `${activeColor} text-white shadow-lg border-l-4 ${borderColor}` 
                          : 'hover:bg-gradient-to-r hover:from-sky-600/60 hover:to-cyan-600/60 hover:text-white hover:shadow-md'
                        }
                      `}
                      onClick={() => toggleMenu(menuKey)}
                    >
                      <div className="flex items-center">
                        <span className={`text-lg transition-all duration-300 ${openMenus[menuKey] ? 'scale-110' : ''}`}>
                          {icon}
                        </span>
                        <span className="ml-3 font-medium">{name}</span>
                      </div>
                      <span className={`
                        text-sm transition-all duration-300 ease-out
                        ${openMenus[menuKey] ? 'rotate-180' : 'rotate-0'}
                      `}>
                        <FaChevronDown />
                      </span>
                    </button>
                    
                    {/* Submenu con fondo sólido y borde destacado */}
                    <div className={`
                      overflow-hidden transition-all duration-300 ease-out
                      ${openMenus[menuKey] ? 'max-h-96 opacity-100 mb-2' : 'max-h-0 opacity-0'}
                    `}>
                      <div className={`
                        rounded-lg ${color} border-2 ${borderColor} 
                        shadow-lg p-2 ml-2
                      `}>
                        <ul className="space-y-1">
                          {subMenu
                            .filter(subItem => tienePermiso(subItem.permiso))
                            .map(({ name: subName, icon: subIcon, href: subHref }, index) => (
                            <li 
                              key={subName}
                              className={`
                                transform transition-all duration-300 ease-out
                                ${openMenus[menuKey] 
                                  ? `translate-x-0 opacity-100` 
                                  : 'translate-x-4 opacity-0'
                                }
                              `}
                              style={{
                                transitionDelay: openMenus[menuKey] ? `${index * 50}ms` : '0ms'
                              }}
                            >
                              <Link
                                href={subHref}
                                className={`
                                  flex items-center px-3 py-2.5 text-white rounded-lg 
                                  transition-all duration-200 ease-out relative
                                  ${isActive(subHref) 
                                    ? `bg-white/30 border-l-4 ${borderColor} font-semibold` 
                                    : 'hover:bg-white/20'
                                  }
                                `}
                              >
                                <span className="text-base">{subIcon}</span>
                                <span className="ml-3 text-sm">{subName}</span>
                                {isActive(subHref) && (
                                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
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
                      flex items-center px-4 py-3 text-blue-100 rounded-xl 
                      transition-all duration-300 ease-out
                      ${isActive(href) 
                        ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg' 
                        : 'hover:bg-gradient-to-r hover:from-sky-600/60 hover:to-cyan-600/60 hover:text-white hover:shadow-md'
                      }
                    `}
                  >
                    <span className={`text-lg ${isActive(href) ? 'scale-110' : ''}`}>{icon}</span>
                    <span className="ml-3 font-medium">{name}</span>
                    {isActive(href) && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Employee Info */}
        {empleado && (
          <div className="p-4 border-t border-blue-600/50 bg-gradient-to-r from-blue-800/80 to-blue-700/80 backdrop-blur-sm">
            <div className="text-blue-100 text-sm bg-blue-900/30 rounded-lg p-3 border border-blue-600/30">
              <div className="font-semibold text-white">{empleado.nombre}</div>
              <div className="text-blue-200 text-xs capitalize mt-1 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                {empleado.rol}
              </div>
            </div>
          </div>
        )}

        {/* Profile Button */}
        {empleado && (
          <div className="bg-gradient-to-r from-blue-800/80 to-blue-700/80 p-4 border-t border-blue-600/50">
            <Link
              href="/dashboard/editar_perfil"
              scroll={false}
              className={`
                flex items-center justify-center w-full px-4 py-3 text-blue-200 
                border border-blue-500/50 rounded-xl transition-all duration-300 
                ${isActive('/dashboard/editar_perfil') 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400' 
                  : 'hover:bg-gradient-to-r hover:from-blue-600/60 hover:to-indigo-600/60 hover:text-white hover:border-blue-400'
                }
                hover:shadow-lg hover:shadow-blue-500/25
              `}
            >
              <FaUserAlt className="text-base" />
              <span className="ml-3 font-medium">{perfilLabel}</span>
              {isActive('/dashboard/editar_perfil') && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </Link>
          </div>
        )}

        {/* Logout Button */}
        <div className="bg-gradient-to-r from-blue-800/80 to-blue-700/80 p-4 border-t border-blue-600/50">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="
              flex items-center justify-center w-full px-4 py-3 text-blue-200 
              border border-red-500/50 rounded-xl transition-all duration-300 
              hover:bg-gradient-to-r hover:from-red-600/60 hover:to-rose-600/60 
              hover:text-white hover:border-red-400 hover:shadow-lg hover:shadow-red-500/25
            "
          >
            <FaSignOutAlt className={`text-base ${isLoggingOut ? "animate-spin" : ""}`} />
            <span className="ml-3 font-medium">
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}