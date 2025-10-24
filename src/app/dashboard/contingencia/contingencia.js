// src/app/dashboard/facturas/contingencia/contingencia.js
"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaUser, FaCalendarAlt, FaFilePdf, FaChevronLeft, FaChevronRight, FaLayerGroup, FaFileCode, FaExclamationTriangle, FaFilter } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";

export default function ContingenciaView({ user, hasHaciendaToken, haciendaStatus }) {
  const [isMobile, setIsMobile] = useState(false);
  const [facturas, setFacturas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenFecha, setOrdenFecha] = useState("reciente");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [generandoLote, setGenerandoLote] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState("hoy");
  const itemsPerPage = 6;
  const router = useRouter();

  useEffect(() => {
    const fetchFacturasContingencia = async () => {
      try {
        const response = await fetch("http://localhost:3000/facturas/contingencia", {
          credentials: "include"
        });
        
        if (!response.ok) throw new Error("Error al cargar facturas en contingencia");
        const data = await response.json();
        
        if (data.ok && Array.isArray(data.facturas)) {
          setFacturas(data.facturas);
        } else {
          setFacturas([]);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar las facturas en contingencia: " + error.message);
        setFacturas([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacturasContingencia();
  }, []);

  const ordenarFacturasPorFecha = (facturas, orden) => {
    return [...facturas].sort((a, b) => {
      const fechaA = new Date(a.fechaemision || 0);
      const fechaB = new Date(b.fechaemision || 0);
      
      if (orden === "reciente") {
        return fechaB - fechaA;
      } else {
        return fechaA - fechaB;
      }
    });
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const año = date.getFullYear();
    return `${dia}-${mes}-${año}`;
  };

  const facturasFiltradas = Array.isArray(facturas)
    ? facturas.filter((factura) => {
        if (!factura) return false;
        
        // Aplicar filtro de fecha primero
        if (filtroFecha !== "todos") {
          const fechaFactura = new Date(factura.fechaemision);
          const hoy = new Date();
          let fechaInicio = new Date();
          let fechaFin = new Date();
          
          switch (filtroFecha) {
            case "hoy":
              fechaInicio.setHours(0, 0, 0, 0);
              fechaFin.setHours(23, 59, 59, 999);
              break;
            case "ayer":
              fechaInicio.setDate(hoy.getDate() - 1);
              fechaInicio.setHours(0, 0, 0, 0);
              fechaFin.setDate(hoy.getDate() - 1);
              fechaFin.setHours(23, 59, 59, 999);
              break;
            case "anteayer":
              fechaInicio.setDate(hoy.getDate() - 2);
              fechaInicio.setHours(0, 0, 0, 0);
              fechaFin.setDate(hoy.getDate() - 2);
              fechaFin.setHours(23, 59, 59, 999);
              break;
            case "hace3dias":
              fechaInicio.setDate(hoy.getDate() - 3);
              fechaInicio.setHours(0, 0, 0, 0);
              fechaFin.setDate(hoy.getDate() - 3);
              fechaFin.setHours(23, 59, 59, 999);
              break;
            case "hace4dias":
              fechaInicio.setDate(hoy.getDate() - 4);
              fechaInicio.setHours(0, 0, 0, 0);
              fechaFin.setDate(hoy.getDate() - 4);
              fechaFin.setHours(23, 59, 59, 999);
              break;
            default:
              fechaInicio = null;
              fechaFin = null;
          }
          
          if (fechaInicio && fechaFin) {
            if (fechaFactura < fechaInicio || fechaFactura > fechaFin) {
              return false;
            }
          }
        }
        
        // Luego aplicar filtro de búsqueda
        const searchLower = searchTerm.toLowerCase();
        const matchSearch =
          (factura.codigogen?.toLowerCase() || "").includes(searchLower) ||
          (factura.nombrecibe?.toLowerCase() || "").includes(searchLower) ||
          (factura.numerofacturausuario?.toString() || "").includes(searchTerm) ||
          (factura.iddtefactura?.toString() || "").includes(searchTerm) ||
          (factura.tipodte?.toString() || "").includes(searchTerm);

        return matchSearch;
      })
    : [];

  const facturasOrdenadas = ordenarFacturasPorFecha(facturasFiltradas, ordenFecha);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = facturasOrdenadas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(facturasOrdenadas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getTipoDTEText = (tipodte) => {
    const tipos = {
      '01': 'FACTURA',
      '03': 'CREDITO FISCAL',
      '04': 'NOTA DEBITO',
      '05': 'NOTA CREDITO',
      '11': 'COMPROBANTE RETENCION'
    };
    return tipos[tipodte] || `DTE ${tipodte}`;
  };

  const getFechaFiltro = (diasAtras) => {
    const hoy = new Date();
    const fecha = new Date();
    fecha.setDate(hoy.getDate() - diasAtras);
    return formatearFecha(fecha);
  };

  const handleGenerarLote = async () => {
    try {
      const tokenCheckResponse = await fetch('http://localhost:3000/statusTokenhacienda', {
        credentials: 'include'
      });

      if (!tokenCheckResponse.ok) {
        const errorData = await tokenCheckResponse.json();
        throw new Error(errorData.message || 'Error al verificar token de Hacienda');
      }
      
      const tokenCheckResult = await tokenCheckResponse.json();
      
      if (!tokenCheckResult.ok) {
        alert("Error en la verificación del token de Hacienda");
        return;
      }
      
      if (!tokenCheckResult.existesesion) {
        alert("No se puede generar el lote de contingencia: No hay sesión activa con Hacienda. Por favor, configure las credenciales primero.");
        return;
      }
      
      if (!tokenCheckResult.valid) {
        alert("No se puede generar el lote de contingencia: El token de Hacienda ha expirado. Por favor, renueve las credenciales.");
        return;
      }
      
    } catch (error) {
      console.error('Error verificando token de Hacienda:', error);
      alert("No se puede generar el lote de contingencia: Error al verificar la conexión con Hacienda. " + error.message);
      return;
    }

    if (facturasFiltradas.length === 0) {
      alert("No hay documentos disponibles para generar el lote");
      return;
    }
    
    setGenerandoLote(true);
    
    try {
      const response = await fetch('http://localhost:3000/contingencia/masiva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const resultado = await response.json();
        alert(`Lote de contingencia generado exitosamente para ${facturasFiltradas.length} documentos`);
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al generar el lote');
      }
    } catch (error) {
      console.error('Error generando lote:', error);
      alert('Error al generar el lote: ' + error.message);
    } finally {
      setGenerandoLote(false);
    }
  };

  const handleGeneratePDF = async (facturaId) => {
    setPdfLoading(facturaId);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${facturaId}/descargar-pdf`, {
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
      let filename = `FAC-${facturaId}.pdf`;
      if (disposition && disposition.includes("filename=")) {
        filename = disposition
          .split("filename=")[1]
          .replace(/"/g, "");
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

  const handleDownloadJSON = async (iddtefactura) => {
    try {
      const response = await fetch(`http://localhost:3000/facturas/${iddtefactura}/descargar-json`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const disposition = response.headers.get("Content-Disposition");
      let filename = `factura-${iddtefactura}.json`;
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

  const handleViewDetails = (facturaId) => {
    router.push(`/dashboard/facturas/${facturaId}`);
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
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  const FacturaCard = ({ factura }) => (
    <div
      key={factura.iddtefactura}
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-200"
    >
      <div className="p-3 bg-indigo-500 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white/20 p-1 rounded mr-2">
              <FaFileAlt className="text-white text-xs" />
            </div>
            <div>
              <span className="font-semibold text-xs block">{getTipoDTEText(factura.tipo_dte)}</span>
              <span className="text-xs font-light opacity-90">
                #{factura.numerofacturausuario?.toString().padStart(4, '0') || factura.iddtefactura}
              </span>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-indigo-400/30 text-indigo-100">
            CONTINGENCIA
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
          <div className="flex items-center text-gray-600">
            <FaCalendarAlt className="mr-1 text-indigo-500 text-xs" />
            <span className="text-xs">
              {formatearFecha(factura.fechaemision)}
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

        <div className="mb-3">
          <div className="flex items-center text-gray-700 mb-1">
            <FaUser className="mr-1 text-indigo-500 text-xs" />
            <span className="text-xs font-medium">Cliente</span>
          </div>
          <p className="text-gray-900 text-sm font-medium truncate pl-3">
            {factura.nombrecibe || 'Cliente no especificado'}
          </p>
          {factura.docuentrega && (
            <p className="text-xs text-gray-500 pl-3 mt-0.5">DUI: {factura.docuentrega}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Código</div>
            <div className="text-xs font-mono text-gray-800 bg-gray-50 p-1 rounded truncate">
              {factura.codigogen || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Control</div>
            <div className="text-xs font-mono text-gray-800 bg-gray-50 p-1 rounded truncate">
              {factura.ncontrol || 'N/A'}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-2">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-bold text-indigo-600">
              {formatCurrency(factura.montototal || factura.totalpagar || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 flex gap-2 justify-end border-t bg-indigo-50 border-indigo-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetails(factura.iddtefactura)}
            className="flex items-center px-2 py-1 rounded text-xs font-medium text-indigo-600 hover:text-indigo-800"
            title="Ver detalles completos"
          >
            <FaFileAlt className="mr-1 text-xs" />
            Detalles
          </button>

          <button
            onClick={() => handleGeneratePDF(factura.iddtefactura)}
            disabled={pdfLoading === factura.iddtefactura || !(factura.documentofirmado && factura.documentofirmado !== "null")}
            className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
              pdfLoading === factura.iddtefactura
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : (!(factura.documentofirmado && factura.documentofirmado !== "null"))
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
            title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede descargar: Documento no firmado" : "Descargar PDF"}
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

          <button
            onClick={() => handleDownloadJSON(factura.iddtefactura)}
            disabled={!(factura.documentofirmado && factura.documentofirmado !== "null")}
            className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
              !(factura.documentofirmado && factura.documentofirmado !== "null")
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede descargar: Documento no firmado" : "Descargar JSON"}
          >
            <FaFileCode className="mr-1 text-xs" />
            JSON
          </button>
        </div>
      </div>
    </div>
  );

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-6">
        <nav className="inline-flex rounded-md shadow">
          <button
            onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
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
                  onClick={() => onPageChange(1)}
                  className={`px-3 py-1 border-t border-b ${
                    1 === currentPage ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
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
                  onClick={() => onPageChange(i)}
                  className={`px-3 py-1 border-t border-b ${
                    i === currentPage ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
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
                  onClick={() => onPageChange(totalPages)}
                  className={`px-3 py-1 border-t border-b ${
                    totalPages === currentPage ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              );
            }
            
            return pages;
          })()}
          
          <button
            onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
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
    );
  };

  return (
    <div className="flex h-screen  text-black bg-blue-50 overflow-hidden">
      <div className={`fixed md:relative z-20 h-screen ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}
      >
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        ></div>
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

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Envío en Contingencia</h1>
                    <p className="text-gray-600">
                      {facturasFiltradas.length} {facturasFiltradas.length === 1 ? "documento encontrado" : "documentos encontrados"} 
                      {filtroFecha !== "todos" && ` del ${getFechaFiltro({
                        'hoy': 0,
                        'ayer': 1,
                        'anteayer': 2,
                        'hace3dias': 3,
                        'hace4dias': 4
                      }[filtroFecha] || 0)}`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                      onClick={handleGenerarLote}
                      disabled={facturasFiltradas.length === 0 || generandoLote}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        facturasFiltradas.length === 0 || generandoLote
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
                      } ${generandoLote ? 'animate-pulse' : ''}`}
                    >
                      {generandoLote ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Generando Lote...
                        </>
                      ) : (
                        <>
                          <FaLayerGroup className="mr-2" />
                          Generar Lote ({facturasFiltradas.length})
                        </>
                      )}
                    </button>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative w-full md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar documentos..."
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>

                      <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <select
                          value={filtroFecha}
                          onChange={(e) => {
                            setFiltroFecha(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-10 pr-8 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 w-full md:w-48"
                        >
                          <option value="hoy">Hoy ({getFechaFiltro(0)})</option>
                          <option value="ayer">Ayer ({getFechaFiltro(1)})</option>
                          <option value="anteayer">Anteayer ({getFechaFiltro(2)})</option>
                          <option value="hace3dias">Hace 3 días ({getFechaFiltro(3)})</option>
                          <option value="hace4dias">Hace 4 días ({getFechaFiltro(4)})</option>
                          <option value="todos">Todos los días</option>
                        </select>
                      </div>

                      <select
                        value={ordenFecha}
                        onChange={(e) => {
                          setOrdenFecha(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                      >
                        <option value="reciente">Más reciente</option>
                        <option value="antigua">Más antigua</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-6 rounded-r">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-indigo-700">
                        <strong>Generar lotes Contingencia:</strong> Permite generar y enviar los documentos emitidos durante una contingencia para su posterior transmisión y validación ante la Administración Tributaria.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItems.map((factura) => (
                    <FacturaCard key={factura.iddtefactura} factura={factura} />
                  ))}
                </div>

                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={paginate}
                />

                {facturasOrdenadas.length === 0 && (
                  <div className="text-center py-10">
                    <div className="text-gray-400 mb-3">
                      <FaFileAlt className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">
                      {facturas.length === 0 ? 'No hay documentos en contingencia' : 'No se encontraron coincidencias'}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {facturas.length === 0 
                        ? 'Los documentos marcados para contingencia aparecerán aquí' 
                        : 'Intenta con otros términos de búsqueda o selecciona otro día'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}