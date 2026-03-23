"use client";
import { useState, useEffect } from "react";
import { FaPlus, FaTicketAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEye, FaComment, FaCalendarAlt, FaFilter, FaCircle, FaBell } from "react-icons/fa";
import Link from "next/link";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { API_BASE_URL } from "../../../lib/api";

export default function SoportePage({ user, hasHaciendaToken, haciendaStatus }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/mis-tickets`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error al cargar tickets");
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "abierto": return "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500";
      case "en_proceso": return "bg-blue-100 text-blue-800 border-l-4 border-blue-500";
      case "resuelto": return "bg-green-100 text-green-800 border-l-4 border-green-500";
      case "cerrado": return "bg-gray-100 text-gray-800 border-l-4 border-gray-500";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case "abierto": return <FaExclamationTriangle className="mr-1" />;
      case "en_proceso": return <FaSpinner className="mr-1 animate-spin" />;
      case "resuelto": return <FaCheckCircle className="mr-1" />;
      case "cerrado": return <FaClock className="mr-1" />;
      default: return <FaTicketAlt className="mr-1" />;
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case "urgente": return "bg-red-100 text-red-800";
      case "alta": return "bg-orange-100 text-orange-800";
      case "media": return "bg-yellow-100 text-yellow-800";
      case "baja": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-SV", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ticketsFiltrados = filtroEstado === "todos"
    ? tickets
    : tickets.filter(t => t.estado === filtroEstado);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 text-black overflow-hidden">
      <div className={`fixed md:relative z-20 h-screen ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}>
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <Navbar
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <FaTicketAlt className="text-blue-600" />
                  Soporte Técnico
                </h1>
                <p className="text-gray-600 mt-1">
                  {tickets.filter(t => t.mensajes_no_leidos > 0).length} tickets con respuestas nuevas
                </p>
              </div>
              <Link
                href="/dashboard/soporte/nuevo"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <FaPlus className="mr-2" />
                Nuevo Ticket
              </Link>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FaFilter className="text-gray-500" />
                <span className="font-medium text-gray-700">Filtrar por estado:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroEstado("todos")}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filtroEstado === "todos"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Todos ({tickets.length})
                </button>
                <button
                  onClick={() => setFiltroEstado("abierto")}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filtroEstado === "abierto"
                      ? "bg-yellow-500 text-white"
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  }`}
                >
                  Abiertos ({tickets.filter(t => t.estado === "abierto").length})
                </button>
                <button
                  onClick={() => setFiltroEstado("en_proceso")}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filtroEstado === "en_proceso"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                >
                  En Proceso ({tickets.filter(t => t.estado === "en_proceso").length})
                </button>
                <button
                  onClick={() => setFiltroEstado("resuelto")}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filtroEstado === "resuelto"
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }`}
                >
                  Resueltos ({tickets.filter(t => t.estado === "resuelto").length})
                </button>
              </div>
            </div>

            {/* Lista de Tickets */}
            {ticketsFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <FaTicketAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No hay tickets</h3>
                <p className="text-gray-500 mb-4">
                  {filtroEstado === "todos"
                    ? "Aún no has creado ningún ticket de soporte"
                    : `No hay tickets con estado "${filtroEstado}"`}
                </p>
                <Link
                  href="/dashboard/soporte/nuevo"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FaPlus className="mr-2" />
                  Crear mi primer ticket
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {ticketsFiltrados.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/soporte/${ticket.id}`}
                    className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${getEstadoColor(ticket.estado)}`}
                  >
                    <div className="p-5">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getEstadoColor(ticket.estado).replace("border-l-4 border-", "")}`}>
                            {getEstadoIcon(ticket.estado)}
                            {ticket.estado === "abierto" && "Abierto"}
                            {ticket.estado === "en_proceso" && "En Proceso"}
                            {ticket.estado === "resuelto" && "Resuelto"}
                            {ticket.estado === "cerrado" && "Cerrado"}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(ticket.prioridad)}`}>
                            {ticket.prioridad === "urgente" && "Urgente"}
                            {ticket.prioridad === "alta" && "Alta"}
                            {ticket.prioridad === "media" && "Media"}
                            {ticket.prioridad === "baja" && "Baja"}
                          </span>
                          {ticket.categoria && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {ticket.categoria}
                            </span>
                          )}
                          {ticket.mensajes_no_leidos > 0 && (
                            <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                              <FaBell className="text-xs" />
                              {ticket.mensajes_no_leidos} nuevo{ticket.mensajes_no_leidos !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-gray-400 text-xs">
                          <FaCalendarAlt className="mr-1" />
                          {formatDate(ticket.created_at)}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {ticket.titulo}
                      </h3>

                      {ticket.ultimo_mensaje && (
                        <div className="flex items-start gap-2 text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                          <FaComment className="text-blue-400 mt-0.5" />
                          <p className="flex-1 truncate">
                            {ticket.ultimo_mensaje.mensaje || "Imagen adjunta"}
                          </p>
                          <span className="text-xs text-gray-400">
                            {ticket.ultimo_mensaje.remitente_tipo === "cliente" ? "Tú" : "Soporte"}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-end mt-3">
                        <span className="inline-flex items-center text-blue-600 text-sm font-medium">
                          Ver detalles
                          <FaEye className="ml-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}