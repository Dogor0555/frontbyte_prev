"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaUser, FaCalendarAlt, FaDownload, FaChevronDown, FaFileCode, FaFilePdf, FaChevronLeft, FaChevronRight, FaBan, FaSync, FaSortAmountDown, FaSortAmountUpAlt, FaEye, FaCalendarCheck } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import JsonViewer from "../components/JsonViewer";

export default function LiquidacionView( { user, hasHaciendaToken, haciendaStatus } ) {
  const [isMobile, setIsMobile] = useState(false);
  const [facturas, setFacturas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [ordenFecha, setOrdenFecha] = useState("reciente");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [anulando, setAnulando] = useState(null);
  const [reTransmitiendo, setReTransmitiendo] = useState(null);
  const [jsonViewerData, setJsonViewerData] = useState(null);
  const [loadingJson, setLoadingJson] = useState(null);
  const [openDownloadMenu, setOpenDownloadMenu] = useState(null);
  
  // Estados para el filtro de fecha
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const itemsPerPage = 6;
  const router = useRouter();

  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/liquidacion`, {
          credentials: "include"
        });
        if (!response.ok) throw new Error("Error al cargar comprobantes de liquidación");
        const data = await response.json();
        setFacturas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar los comprobantes: " + error.message);
        setFacturas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFacturas();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Solo cerrar si el clic no fue dentro del date picker
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
      setOpenDownloadMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDatePicker]);

  // Función para verificar si hay filtros activos
  const hayFiltrosActivos = () => {
    return searchTerm !== "" || estadoFiltro !== "" || fechaInicio !== "" || fechaFin !== "" || ordenFecha !== "reciente";
  };

  // Función para filtrar por fecha
  const filtrarPorFecha = (factura) => {
    if (!fechaInicio && !fechaFin) return true;
    
    if (!factura.fechaemision) return false;
    
    // Extraer solo la fecha (sin hora)
    const fechaFactura = factura.fechaemision.split('T')[0];
    
    if (fechaInicio && fechaFin) {
      return fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
    } else if (fechaInicio) {
      return fechaFactura >= fechaInicio;
    } else if (fechaFin) {
      return fechaFactura <= fechaFin;
    }
    
    return true;
  };

  const ordenarFacturas = (facturas) => {
    return [...facturas].sort((a, b) => {
      if (ordenFecha === "reciente" || ordenFecha === "antigua") {
        const crearFechaCompleta = (factura) => {
          if (!factura.fechaemision) return new Date(0);
          
          if (factura.fechaemision.includes('T') && !factura.fechaemision.endsWith('Z')) {
            return new Date(factura.fechaemision);
          }
          
          const fechaStr = factura.fechaemision.split('T')[0];
          const horaStr = factura.horaemision || '00:00:00';

          const fechaHoraStr = `${fechaStr}T${horaStr}Z`;
          return new Date(fechaHoraStr);
        };

        const fechaA = crearFechaCompleta(a);
        const fechaB = crearFechaCompleta(b);
        
        if (ordenFecha === "reciente") {
          return fechaB - fechaA; 
        } else {
          return fechaA - fechaB; 
        }
      } else if (ordenFecha === "numero") {
        const numA = parseInt(a.numerofacturausuario) || 0;
        const numB = parseInt(b.numerofacturausuario) || 0;
        return numB - numA; 
      }
      
      return 0;
    });
  };

  const facturasFiltradas = Array.isArray(facturas)
    ? facturas.filter((factura) => {
        if (!factura) return false;
        const searchLower = searchTerm.toLowerCase();

        const matchSearch =
          (factura.codigo?.toLowerCase() || "").includes(searchLower) ||
          (factura.nombrentrega?.toLowerCase() || "").includes(searchLower) ||
          (factura.numerofacturausuario?.toString() || "").includes(searchTerm) ||
          (factura.iddtefactura?.toString() || "").includes(searchTerm) ||
          (factura.ncontrol?.toString() || "").includes(searchTerm) ||
          (factura.nombrecibe?.toLowerCase() || "").includes(searchLower);

        const matchEstado = estadoFiltro ? factura.estado === estadoFiltro : true;
        
        // Aplicar filtro de fecha
        const matchFecha = filtrarPorFecha(factura);

        return matchSearch && matchEstado && matchFecha;
      })
    : [];

  const facturasOrdenadas = ordenarFacturas(facturasFiltradas);

  // Determinar qué facturas mostrar según si hay filtros activos
  const hayFiltros = hayFiltrosActivos();
  
  // Si hay filtros activos, mostrar TODAS las facturas filtradas
  // Si no hay filtros, mostrar solo las de la página actual
  const facturasAMostrar = hayFiltros 
    ? facturasOrdenadas 
    : facturasOrdenadas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const totalPages = Math.ceil(facturasOrdenadas.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm("");
    setEstadoFiltro("");
    setFechaInicio("");
    setFechaFin("");
    setOrdenFecha("reciente");
    setCurrentPage(1);
  };

  // Función para establecer filtros rápidos
  const setFiltroRapido = (dias) => {
    const hoy = new Date();
    const fechaFin = hoy.toISOString().split('T')[0];
    
    const fechaInicio = new Date();
    fechaInicio.setDate(hoy.getDate() - dias);
    
    setFechaInicio(fechaInicio.toISOString().split('T')[0]);
    setFechaFin(fechaFin);
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(amount || 0);
  
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      return new Date(dateString).toLocaleDateString('es-SV', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const handleViewJSON = async (iddtefactura) => {
    setLoadingJson(iddtefactura);
    try {
      // Usar la misma ruta que funciona en handleDownloadJSON
      const response = await fetch(`${API_BASE_URL}/facturas/${iddtefactura}/descargar-json`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setJsonViewerData(data);
    } catch (error) {
      console.error('Error cargando JSON:', error);
      alert(`Error al cargar JSON: ${error.message}`);
    } finally {
      setLoadingJson(null);
    }
  };

  const puedeAnular = (factura) => {
    if (!factura) return false;
    
    if (factura.estado === 'ANULADO') return false;
    
    if (!['TRANSMITIDO', 'RE-TRANSMITIDO'].includes(factura.estado)) return false;
    
    if (factura.fechaemision && factura.horaemision) {
      const fechaHoraStr = `${factura.fechaemision.split("T")[0]}T${factura.horaemision}Z`;
      const fechaEmision = new Date(fechaHoraStr);
      const ahora = new Date();
      const horasTranscurridas = (ahora - fechaEmision) / (1000 * 60 * 60);
      return horasTranscurridas <= 24;
    }
    
    return false;
  };

  const puedeReTransmitir = (factura) => {
    return factura && factura.estado === 'CONTINGENCIA';
  };

  const handleAnularFactura = async (facturaId) => {
    const confirmarAnulacion = window.confirm(
      "¿Está seguro que desea anular este comprobante?\n\n" +
      "Una vez anulada, no podrá revertir esta acción."
    );
    
    if (!confirmarAnulacion) {
      return;
    }
    setAnulando(facturaId);
    try {
      const response = await fetch(`${API_BASE_URL}/facturas/${facturaId}/anular`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoAnulacion: "2", 
          motivoAnulacion: "Se emitió con datos incorrectos",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.descripcionMsg || data.error || "Error al anular factura");
      }

      setFacturas((prev) =>
        prev.map((factura) =>
          factura.iddtefactura === facturaId
            ? { ...factura, estado: "ANULADO" }
            : factura
        )
      );

      alert("Comprobante anulado exitosamente");
    } catch (error) {
      console.error("Error al anular:", error);
      alert("Error: " + error.message);
    } finally {
      setAnulando(null);
    }
  };

  const handleReTransmitir = async (facturaId) => {
    setReTransmitiendo(facturaId);
    try {
      const response = await fetch(`${API_BASE_URL}/facturas/${facturaId}/contingencia`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en re-transmisión');
      }

      const result = await response.json();
      setFacturas(prev => prev.map(factura => 
        factura.iddtefactura === facturaId 
          ? { ...factura, estado: result.estado || 'RE-TRANSMITIDO' }
          : factura
      ));
      
      alert('Re-transmisión exitosa');
    } catch (error) {
      console.error('Error en re-transmisión:', error);
      alert('Error: ' + error.message);
    } finally {
      setReTransmitiendo(null);
    }
  };

  const handleDownloadJSON = async (iddtefactura) => {
    try {
      const response = await fetch(`${API_BASE_URL}/facturas/${iddtefactura}/descargar-json`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const disposition = response.headers.get("Content-Disposition");
      let filename = `liquidacion-${iddtefactura}.json`;
      if (disposition && disposition.includes("filename=")) {
        filename = disposition
          .split("filename=")[1]
          .replace(/"/g, "");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error descargando JSON:', error);
      alert(`Error al descargar JSON: ${error.message}`);
    } finally {
      setPdfLoading(null);
    }
  };

  const handleGeneratePDF = async (facturaId, numeroFactura) => {
    if (!facturaId) return;
    setPdfLoading(facturaId);
    try {
      const response = await fetch(`${API_BASE_URL}/facturas/${facturaId}/descargar-pdf`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(errorText || "Error al descargar PDF");
        }
        throw new Error(errorData.detalles || errorData.error || "Error al descargar PDF");
      }
      
      const disposition = response.headers.get("Content-Disposition");
      let filename = `LIQ-${numeroFactura || facturaId}.pdf`;
      if (disposition && disposition.includes("filename=")) {
        filename = disposition
          .split("filename=")[1]
          .split(";")[0]
          .replace(/"/g, "")
          .trim();
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setPdfLoading(null);
    }
  };

  const handleViewDetails = (facturaId) => {
    router.push(`/dashboard/comprobantes_liquidacion/${facturaId}`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
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
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-blue-50 text-black overflow-hidden">
      <div className={`fixed md:relative z-20 h-screen ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}
      >
        <Sidebar />
      </div>

      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        ></div>
      )}

      <div className="flex-1 flex flex-col min-w-0">  
        {/* Navbar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <Navbar 
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Comprobantes de Liquidación</h1>
                  <p className="text-gray-600">
                    {facturas.length} {facturas.length === 1 ? "documento" : "documentos"} registrados
                    {hayFiltros && ` (${facturasOrdenadas.length} encontrados)`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por código, cliente, número o DTE..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  {/* Filtro de Fecha */}
                  <div className="relative date-picker-container">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDatePicker(!showDatePicker);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 ${
                        (fechaInicio || fechaFin) ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <FaCalendarCheck className={`text-sm ${(fechaInicio || fechaFin) ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span className="text-sm text-gray-700">
                        {fechaInicio || fechaFin 
                          ? `${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}`
                          : 'Filtrar por fecha'
                        }
                      </span>
                    </button>

                    {showDatePicker && (
                      <div 
                        className="absolute right-0 mt-2 p-4 bg-white border rounded-lg shadow-lg z-50 w-80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Fecha Inicio
                            </label>
                            <input
                              type="date"
                              value={fechaInicio}
                              onChange={(e) => {
                                setFechaInicio(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Fecha Fin
                            </label>
                            <input
                              type="date"
                              value={fechaFin}
                              onChange={(e) => {
                                setFechaFin(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          
                          {/* Filtros rápidos */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFiltroRapido(7);
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                            >
                              7 días
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFiltroRapido(30);
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                            >
                              30 días
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFiltroRapido(90);
                              }}
                              className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                            >
                              90 días
                            </button>
                          </div>
                          
                          <div className="flex justify-between pt-2 border-t">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFechaInicio("");
                                setFechaFin("");
                                setCurrentPage(1);
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Limpiar fechas
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowDatePicker(false);
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <select
                    value={estadoFiltro}
                    onChange={(e) => {
                      setEstadoFiltro(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-green-500 focus:border-green-500 text-gray-700"
                  >
                    <option value="">Todos los estados</option>
                    <option value="ANULADO">ANULADO</option>
                    <option value="TRANSMITIDO">TRANSMITIDO</option>
                    <option value="RE-TRANSMITIDO">RE-TRANSMITIDO</option>
                    <option value="CONTINGENCIA">CONTINGENCIA</option>
                  </select>

                  <select
                    value={ordenFecha}
                    onChange={(e) => {
                      setOrdenFecha(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  >
                    <option value="reciente">Más reciente</option>
                    <option value="antigua">Más antigua</option>
                  </select>

                  {/* Botón para limpiar todos los filtros */}
                  {hayFiltros && (
                    <button
                      onClick={limpiarFiltros}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      title="Limpiar todos los filtros"
                    >
                      <FaSync className="inline mr-1" />
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Mostrar filtros activos */}
              {(fechaInicio || fechaFin) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Filtros activos:</span>
                  {fechaInicio && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Desde: {new Date(fechaInicio).toLocaleDateString()}
                      <button
                        onClick={() => {
                          setFechaInicio("");
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {fechaFin && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Hasta: {new Date(fechaFin).toLocaleDateString()}
                      <button
                        onClick={() => {
                          setFechaFin("");
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Listado en formato tarjeta-factura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {facturasAMostrar.map((factura) => (
                  <div
                    key={factura.iddtefactura}
                    className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="bg-blue-600 text-white p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-white/20 p-1 rounded mr-2">
                            <FaFileAlt className="text-white text-xs" />
                          </div>
                          <div>
                            <span className="font-semibold text-xs block">LIQUIDACIÓN</span>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          factura.estado === 'TRANSMITIDO' ? 'bg-green-500/30 text-green-100' :
                          factura.estado === 'RE-TRANSMITIDO' ? 'bg-blue-500/30 text-blue-100' :
                          factura.estado === 'CONTINGENCIA' ? 'bg-yellow-500/30 text-yellow-100' :
                          factura.estado === 'ANULADO' ? 'bg-red-500/30 text-red-100' :
                          'bg-gray-500/30 text-gray-100'
                        }`}>
                          {factura.estado?.toUpperCase() || 'PENDIENTE'}
                        </span>
                      </div>
                    </div>

                    {/* Cuerpo de factura */}
                    <div className="p-4">
                      {/* Línea de estado */}
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <div className="flex items-center text-gray-600">
                          <FaCalendarAlt className="mr-1 text-blue-500 text-xs" />
                          <span className="text-xs">
                             {`${new Date(factura.fechaemision).toISOString().split("T")[0]} ${factura.horaemision}`}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          factura.documentofirmado && factura.documentofirmado !== "null"
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {factura.documentofirmado && factura.documentofirmado !== "null" ? "FIRMADO" : "NO FIRMADO"}
                        </span>
                      </div>

                      {/* Información del cliente */}
                      <div className="mb-3">
                        <div className="flex items-center text-gray-700 mb-1">
                          <FaUser className="mr-1 text-blue-500 text-xs" /> 
                          <span className="text-xs font-medium">Receptor</span>
                        </div>
                        <p className="text-gray-900 text-sm font-medium truncate pl-3">
                          {factura.nombrecibe || factura.nombentrega || 'Receptor no especificado'}
                        </p>
                        {factura.docuentrega && (
                          <p className="text-xs text-gray-500 pl-3 mt-0.5">DUI: {factura.docuentrega}</p>
                        )}
                      </div>

                      {/* Información de control */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Código</div>
                          <div className="text-xs font-mono text-gray-800 bg-gray-50 p-1 rounded">
                            {factura.codigo || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Control</div>
                          <div className="text-xs font-mono text-gray-800 bg-gray-50 p-1 rounded truncate">
                            {factura.ncontrol || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="border-t border-gray-100 pt-2">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">Total a pagar</div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(factura.totalpagar || factura.montototaloperacion || 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pie de factura - Acciones */}
                    <div className="bg-gray-50 px-3 py-2 flex flex-wrap gap-1 justify-between border-t border-gray-100">
                      {/* Botón de Detalles */}
                      <button
                        onClick={() => handleViewDetails(factura.iddtefactura)}
                        className="flex items-center text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-xs font-medium"
                        title="Ver detalles completos"
                      >
                        <FaFileAlt className="mr-1 text-xs" />
                        Detalles
                      </button>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1">
                        {/* Botón de Ver JSON */}
                        <button
                          onClick={() => handleViewJSON(factura.iddtefactura)}
                          disabled={loadingJson === factura.iddtefactura || !(factura.documentofirmado && factura.documentofirmado !== "null")}
                          className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                            loadingJson === factura.iddtefactura
                              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                              : (!(factura.documentofirmado && factura.documentofirmado !== "null"))
                                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                          }`}
                          title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede ver: Comprobante no firmado" : "Ver JSON formateado"}
                        >
                          {loadingJson === factura.iddtefactura ? (
                            <>
                              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                              Cargando
                            </>
                          ) : (
                            <>
                              <FaEye className="mr-1 text-xs" />
                              Ver JSON
                            </>
                          )}
                        </button>

                        {/* Botón de Anular */}
                        {puedeAnular(factura) && (
                          <button
                            onClick={() => handleAnularFactura(factura.iddtefactura)}
                            disabled={anulando === factura.iddtefactura}
                            className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                              anulando === factura.iddtefactura
                                ? 'bg-gray-400 text-gray-700'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {anulando === factura.iddtefactura ? (
                              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                            ) : (
                              <FaBan className="mr-1 text-xs" />
                            )}
                            Anular
                          </button>
                        )}

                        {/* Botón de Descargar PDF */}
                        <button
                          onClick={() => handleGeneratePDF(factura.iddtefactura, factura.numerofacturausuario)}
                          disabled={pdfLoading === factura.iddtefactura || !(factura.documentofirmado && factura.documentofirmado !== "null")}
                          className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                            pdfLoading === factura.iddtefactura
                              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                              : (!(factura.documentofirmado && factura.documentofirmado !== "null"))
                                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede descargar: Comprobante no firmado" : "Descargar DTE en PDF"}
                        >
                          {pdfLoading === factura.iddtefactura ? (
                            <>
                              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                              Generando
                            </>
                          ) : (
                            <>
                              <FaFilePdf className="mr-1 text-xs" />
                              PDF
                            </>
                          )}
                        </button>

                        {/* Botón de Descargar JSON */}
                        <button
                          onClick={() => handleDownloadJSON(factura.iddtefactura)}
                          disabled={!(factura.documentofirmado && factura.documentofirmado !== "null")}
                          className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                            !(factura.documentofirmado && factura.documentofirmado !== "null")
                              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                          title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede descargar: Comprobante no firmado" : "Descargar DTE en JSON"}
                        >
                          <FaFileCode className="mr-1 text-xs" />
                          JSON
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mostrar paginación SOLO cuando NO hay filtros activos */}
              {!hayFiltros && facturasOrdenadas.length > itemsPerPage && (
                <div className="flex justify-center mt-6">
                  <nav className="inline-flex rounded-md shadow">
                    <button
                      onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-l-md border ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FaChevronLeft className="text-sm" />
                    </button>
                    
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = isMobile ? 3 : 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => paginate(1)}
                            className={`px-3 py-1 border-t border-b ${
                              1 === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            1
                          </button>
                        );
                        
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis-start" className="px-2 py-1 border-t border-b bg-white text-gray-500">
                              ...
                            </span>
                          );
                        }
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => paginate(i)}
                            className={`px-3 py-1 border-t border-b ${
                              i === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis-end" className="px-2 py-1 border-t border-b bg-white text-gray-500">
                              ...
                            </span>
                          );
                        }
                        
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => paginate(totalPages)}
                            className={`px-3 py-1 border-t border-b ${
                              totalPages === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                    
                    <button
                      onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-r-md border ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FaChevronRight className="text-sm" />
                    </button>
                  </nav>
                </div>
              )}

              {facturasOrdenadas.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-gray-400 mb-3">
                    <FaFileAlt className="inline-block text-4xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">
                    {facturas.length === 0 ? 'No hay comprobantes registrados' : 'No se encontraron coincidencias'}
                  </h3>
                  <p className="text-gray-500 mt-1">
                    {facturas.length === 0 ? 'Comienza creando tu primer comprobante de liquidación' : 'Intenta con otros términos de búsqueda o rango de fechas'}
                  </p>
                  {hayFiltros && (
                    <button
                      onClick={limpiarFiltros}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Limpiar todos los filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>

      {/* Modal del Visualizador JSON */}
      {jsonViewerData && (
        <JsonViewer 
          data={jsonViewerData} 
          onClose={() => setJsonViewerData(null)} 
        />
      )}
    </div>
  );
}