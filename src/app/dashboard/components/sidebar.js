// src/app/dashboard/components/sidebar.js
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
  FaTruck,             // Para Nota de Remisión
  FaReceipt,           // Para Retención
  FaClipboardList,     // Para Liquidación
} from "react-icons/fa";
import logo from "../../../app/images/logoo.png";
import { logout, isAdmin } from "../../services/auth";
import { useState, useEffect } from "react";

export default function Sidebar({ onOpenPerfil }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [openMenus, setOpenMenus] = useState({
    dtes: false,
    facturas: false,
    creditos: false,
    admin: false,
  });
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const empleadoData = localStorage.getItem("empleado");
    if (empleadoData) {
      setEmpleado(JSON.parse(empleadoData));
    }
  }, []);

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

  const menuItems = [
    { name: "Inicio", icon: <FaHome />, href: "/dashboard" },

    {
      name: "DTES",
      icon: <FaFileInvoiceDollar />,
      href: "#",
      subMenu: [
        { name: "DTE Factura", icon: <FaFileInvoice />, href: "/dashboard/dte_factura" },
        { name: "DTE Crédito", icon: <FaFileContract />, href: "/dashboard/dte_credito" },
      ],
      menuKey: "dtes",
    },

    {
      name: "Facturas",
      icon: <FaFileInvoice />,
      href: "#",
      subMenu: [
        { name: "Ver Facturas", icon: <FaEye />, href: "/dashboard/facturas" },
        { name: "Anular Facturas", icon: <FaBan />, href: "/dashboard/anular_facturas" },
      ],
      menuKey: "facturas",
    },

    {
      name: "Créditos",
      icon: <FaCreditCard />,
      href: "#",
      subMenu: [
        { name: "Ver Créditos", icon: <FaEye />, href: "/dashboard/creditos" },
        { name: "Anular Créditos", icon: <FaBan />, href: "/dashboard/anular_creditos" },
        { name: "Enviar Nota de Crédito/Débito", icon: <FaArrowCircleUp />, href: "/dashboard/nota_debito" },
      ],
      menuKey: "creditos",
    },

    // 📦 Nota de Remisión Electrónica
    {
      name: "Nota de Remisión",
      icon: <FaTruck />,
      href: "#",
      subMenu: [
        { name: "Emitir NRE", icon: <FaFileAlt />, href: "/dashboard/nota_remision" },
        { name: "Ver NRE Emitidas", icon: <FaEye />, href: "/dashboard/nota_remision/ver" },
        { name: "Anular NRE", icon: <FaBan />, href: "/dashboard/nota_remision/anular" },
      ],
      menuKey: "remision",
    },

    // 💸 Comprobante de Retención Electrónico
    {
      name: "Comprobantes de Retención",
      icon: <FaReceipt />,
      href: "#",
      subMenu: [
        { name: "Emitir CRE", icon: <FaFileAlt />, href: "/dashboard/retencion" },
        { name: "Ver CRE Emitidos", icon: <FaEye />, href: "/dashboard/retencion/ver" },
        { name: "Anular CRE", icon: <FaBan />, href: "/dashboard/retencion/anular" },
      ],
      menuKey: "retencion",
    },

    // 📜 Comprobante de Liquidación Electrónico
    {
      name: "Comprobantes de Liquidación",
      icon: <FaClipboardList />,
      href: "#",
      subMenu: [
        { name: "Emitir CLE", icon: <FaFileAlt />, href: "/dashboard/liquidacion" },
        { name: "Ver CLE Emitidos", icon: <FaEye />, href: "/dashboard/liquidacion/ver" },
        { name: "Anular CLE", icon: <FaBan />, href: "/dashboard/liquidacion/anular" },
      ],
      menuKey: "liquidacion",
    },

    // ⚠️ Contingencia
    { name: "Contingencia", icon: <FaExclamationTriangle />, href: "/dashboard/contingencia" },

    // 📚 Otros
    { name: "Libro de Ventas", icon: <FaBook />, href: "/dashboard/libro_de_ventas" },
    { name: "Reportes", icon: <FaChartLine />, href: "/dashboard/reportes" },
    { name: "Editar Sucursal", icon: <FaEdit />, href: "/dashboard/editar_sucursal" },
  ];

  if (empleado && isAdmin(empleado)) {
    menuItems.push({
      name: "Administración",
      icon: <FaCog />,
      href: "#",
      subMenu: [
        { name: "Empleados", icon: <FaUserTie />, href: "/dashboard/empleados" },
        { name: "Productos", icon: <FaBoxOpen />, href: "/dashboard/productos" },
        { name: "Clientes", icon: <FaBuilding />, href: "/dashboard/clientes" },
      ],
      menuKey: "admin",
    });
  } else {
    menuItems.push({ name: "Configuración", icon: <FaCog />, href: "#" });
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
          <ul className="space-y-1">
            {menuItems.map(({ name, icon, href, subMenu, menuKey }) => (
              <li key={name}>
                {subMenu ? (
                  <div className="group">
                    {/* Parent Menu Item */}
                    <button
                      className={`
                        w-full flex items-center justify-between px-4 py-3 text-blue-100 rounded-xl 
                        transition-all duration-300 ease-out group-hover:scale-105
                        ${openMenus[menuKey] 
                          ? 'bg-gradient-to-r from-sky-500/80 to-cyan-500/80 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20' 
                          : 'hover:bg-gradient-to-r hover:from-sky-600/60 hover:to-cyan-600/60 hover:text-white hover:shadow-md hover:shadow-blue-500/20'
                        }
                      `}
                      onClick={() => toggleMenu(menuKey)}
                      onMouseEnter={() => setHoveredItem(menuKey)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="flex items-center">
                        <span className={`text-lg transition-all duration-300 ${hoveredItem === menuKey ? 'scale-110' : ''}`}>
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
                    
                    {/* Submenu */}
                    <div className={`
                      overflow-hidden transition-all duration-300 ease-out
                      ${openMenus[menuKey] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                    `}>
                      <ul className="mt-2 ml-4 space-y-1 border-l-2 border-blue-400/30 pl-4">
                        {subMenu.map(({ name: subName, icon: subIcon, href: subHref }, index) => (
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
                              className="
                                flex items-center px-3 py-2.5 text-blue-200 rounded-lg 
                                transition-all duration-300 ease-out relative overflow-hidden
                                hover:bg-gradient-to-r hover:from-indigo-500/40 hover:to-purple-500/40 
                                hover:text-white hover:shadow-md hover:shadow-indigo-500/20
                                hover:translate-x-1 hover:scale-105
                                before:absolute before:left-0 before:top-0 before:h-full before:w-1 
                                before:bg-gradient-to-b before:from-cyan-400 before:to-blue-500 
                                before:transform before:scale-y-0 before:transition-transform 
                                before:duration-300 hover:before:scale-y-100
                              "
                            >
                              <span className="text-base">{subIcon}</span>
                              <span className="ml-3 text-sm font-medium">{subName}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={href}
                    className="
                      flex items-center px-4 py-3 text-blue-100 rounded-xl 
                      transition-all duration-300 ease-out group relative overflow-hidden
                      hover:bg-gradient-to-r hover:from-sky-600/60 hover:to-cyan-600/60 
                      hover:text-white hover:shadow-md hover:shadow-blue-500/20 
                      hover:scale-105 hover:translate-x-1
                    "
                  >
                    <span className="text-lg">{icon}</span>
                    <span className="ml-3 font-medium">{name}</span>
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
              className="
                flex items-center justify-center w-full px-4 py-3 text-blue-200 
                border border-blue-500/50 rounded-xl transition-all duration-300 
                hover:bg-gradient-to-r hover:from-blue-600/60 hover:to-indigo-600/60 
                hover:text-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/25
              "
            >
              <FaUserAlt className="text-base" />
              <span className="ml-3 font-medium">{perfilLabel}</span>
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
