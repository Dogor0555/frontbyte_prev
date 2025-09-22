// src/app/dashboard/facturas/anular/page.js
"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaUser, FaCalendarAlt, FaFilePdf, FaChevronLeft, FaChevronRight, FaBan, FaExclamationTriangle, FaFileCode } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";

export default function AnularFacturaView({ user, hasHaciendaToken, haciendaStatus }) {
  const [isMobile, setIsMobile] = useState(false);
  const [facturas, setFacturas] = useState([]);
  const [facturasInvalidadas, setFacturasInvalidadas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermInvalidadas, setSearchTermInvalidadas] = useState("");
  const [ordenFecha, setOrdenFecha] = useState("reciente");
  const [ordenFechaInvalidadas, setOrdenFechaInvalidadas] = useState("reciente");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageInvalidadas, setCurrentPageInvalidadas] = useState(1);
  const [anulando, setAnulando] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);
  const itemsPerPage = 6;
  const router = useRouter();

  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        const response = await fetch("http://localhost:3000/facturas/getAllDteFacturas", {
          credentials: "include"
        });
        if (!response.ok) throw new Error("Error al cargar facturas");
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const facturasAnulables = data.filter(factura => puedeAnular(factura));
          const todasInvalidadas = data.filter(factura => factura.estado === 'INVALIDADO');
          
          setFacturas(facturasAnulables);
          setFacturasInvalidadas(todasInvalidadas);
        } else {
          setFacturas([]);
          setFacturasInvalidadas([]);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar las facturas: " + error.message);
        setFacturas([]);
        setFacturasInvalidadas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFacturas();
  }, []);

  const puedeAnular = (factura) => {
    if (!factura) return false;
    if (factura.estado === 'INVALIDADO') return false;
    if (!['TRANSMITIDO', 'RE-TRANSMITIDO'].includes(factura.estado)) return false;
    
    if (factura.fechaemision) {
      const fechaEmision = new Date(factura.fechaemision);
      const ahora = new Date();
      const horasTranscurridas = (ahora - fechaEmision) / (1000 * 60 * 60);
      return horasTranscurridas <= 24;
    }
    
    return false;
  };

  const ordenarFacturasPorFecha = (facturas, orden) => {
    return [...facturas].sort((a, b) => {
      const fechaA = new Date(a.fechainvalidado || a.fechaemision || 0);
      const fechaB = new Date(b.fechainvalidado || b.fechaemision || 0);
      
      if (orden === "reciente") {
        return fechaB - fechaA;
      } else {
        return fechaA - fechaB;
      }
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
          (factura.iddtefactura?.toString() || "").includes(searchTerm);

        return matchSearch;
      })
    : [];

  const facturasOrdenadas = ordenarFacturasPorFecha(facturasFiltradas, ordenFecha);

  const facturasInvalidadasFiltradas = Array.isArray(facturasInvalidadas)
    ? facturasInvalidadas.filter((factura) => {
        if (!factura) return false;
        const searchLower = searchTermInvalidadas.toLowerCase();

        const matchSearch =
          (factura.codigo?.toLowerCase() || "").includes(searchLower) ||
          (factura.nombrentrega?.toLowerCase() || "").includes(searchLower) ||
          (factura.numerofacturausuario?.toString() || "").includes(searchTermInvalidadas) ||
          (factura.iddtefactura?.toString() || "").includes(searchTermInvalidadas);

        return matchSearch;
      })
    : [];

  const facturasInvalidadasOrdenadas = ordenarFacturasPorFecha(facturasInvalidadasFiltradas, ordenFechaInvalidadas);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = facturasOrdenadas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(facturasOrdenadas.length / itemsPerPage);

  const indexOfLastItemInvalidadas = currentPageInvalidadas * itemsPerPage;
  const indexOfFirstItemInvalidadas = indexOfLastItemInvalidadas - itemsPerPage;
  const currentItemsInvalidadas = facturasInvalidadasOrdenadas.slice(indexOfFirstItemInvalidadas, indexOfLastItemInvalidadas);
  const totalPagesInvalidadas = Math.ceil(facturasInvalidadasOrdenadas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const paginateInvalidadas = (pageNumber) => setCurrentPageInvalidadas(pageNumber);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const handleAnularFactura = async (facturaId, motivo) => {
    setAnulando(facturaId);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${facturaId}/anular`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoAnulacion: "2", 
          motivoAnulacion: motivo,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.descripcionMsg || data.error || "Error al anular factura");
      }

      const facturaAnulada = facturas.find(f => f.iddtefactura === facturaId);
      if (facturaAnulada) {
        const facturaConInvalidacion = { 
          ...facturaAnulada, 
          estado: 'INVALIDADO',
          fechainvalidado: new Date().toISOString()
        };
        
        setFacturas((prev) => prev.filter((factura) => factura.iddtefactura !== facturaId));
        setFacturasInvalidadas((prev) => [facturaConInvalidacion, ...prev]);
      }

      alert("Factura invalidada exitosamente");
      setShowModal(false);
      setMotivoAnulacion("");
    } catch (error) {
      console.error("Error al anular:", error);
      alert("Error: " + error.message);
    } finally {
      setAnulando(null);
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

  const openAnulacionModal = (factura) => {
    setFacturaSeleccionada(factura);
    setShowModal(true);
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
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  const FacturaCard = ({ factura, esInvalidada = false }) => (
    <div
      key={factura.iddtefactura}
      className={`bg-white rounded-lg shadow-md overflow-hidden border ${
        esInvalidada ? 'border-red-200' : 'border-gray-100'
      } hover:shadow-lg transition-all duration-200`}
    >
      <div className={`p-3 ${esInvalidada ? 'bg-red-600' : 'bg-blue-600'} text-white`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white/20 p-1 rounded mr-2">
              <FaFileAlt className="text-white text-xs" />
            </div>
            <div>
              <span className="font-semibold text-xs block">FACTURA</span>
              <span className="text-xs font-light opacity-90">
                #{factura.numerofacturausuario?.toString().padStart(4, '0') || factura.iddtefactura}
              </span>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            esInvalidada 
              ? 'bg-red-500/30 text-red-100' 
              : 'bg-green-500/30 text-green-100'
          }`}>
            {factura.estado?.toUpperCase() || 'PENDIENTE'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
          <div className="flex items-center text-gray-600">
            <FaCalendarAlt className={`mr-1 ${esInvalidada ? 'text-red-500' : 'text-blue-500'} text-xs`} />
            <span className="text-xs">
              {esInvalidada && factura.fechainvalidado 
                ? `Invalidada: ${new Date(factura.fechainvalidado).toISOString().split("T")[0]}`
                : new Date(factura.fechaemision).toISOString().split("T")[0]
              }
            </span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            factura.documentofirmado && factura.documentofirmado !== "null"
              ? esInvalidada ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {factura.documentofirmado && factura.documentofirmado !== "null" ? "FIRMADO" : "NO FIRMADO"}
          </span>
        </div>

        <div className="mb-3">
          <div className="flex items-center text-gray-700 mb-1">
            <FaUser className={`mr-1 ${esInvalidada ? 'text-red-500' : 'text-blue-500'} text-xs`} />
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

        <div className="border-t border-gray-100 pt-2">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">Total a pagar</div>
            <div className={`text-lg font-bold ${esInvalidada ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(factura.totalpagar || factura.montototaloperacion || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className={`px-3 py-3 flex flex-wrap gap-2 justify-between border-t ${
        esInvalidada ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
      }`}>
        <button
          onClick={() => handleViewDetails(factura.iddtefactura)}
          className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
            esInvalidada 
              ? 'text-red-600 hover:text-red-800' 
              : 'text-blue-600 hover:text-blue-800'
          }`}
          title="Ver detalles completos"
        >
          <FaFileAlt className="mr-1 text-xs" />
          Detalles
        </button>

        <div className="flex items-center gap-1">
          {!esInvalidada && (
            <button
              onClick={() => openAnulacionModal(factura)}
              className="flex items-center px-3 py-2 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              <FaBan className="mr-1 text-xs" />
              Invalidar Factura
            </button>
          )}

          {esInvalidada && (
            <>
              <button
                onClick={() => handleGeneratePDF(factura.iddtefactura)}
                disabled={pdfLoading === factura.iddtefactura || !(factura.documentofirmado && factura.documentofirmado !== "null")}
                className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                  pdfLoading === factura.iddtefactura
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : (!(factura.documentofirmado && factura.documentofirmado !== "null"))
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede descargar: Factura no firmada" : "Descargar DTE en PDF"}
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
                title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede descargar: Factura no firmada" : "Descargar DTE en JSON"}
              >
                <FaFileCode className="mr-1 text-xs" />
                JSON
              </button>
            </>
          )}
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
                  onClick={() => onPageChange(i)}
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
                  onClick={() => onPageChange(totalPages)}
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
    <div className="flex h-screen bg-blue-50 overflow-hidden">
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
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Invalidar Facturas</h1>
                    <p className="text-gray-600">
                      {facturas.length} {facturas.length === 1 ? "factura invalidable" : "facturas invalidables"} 
                      {searchTerm && ` (${facturasFiltradas.length} encontradas)`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar facturas invalidables..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>

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
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Nota:</strong> Solo puedes invalidar facturas que hayan sido transmitidas en las últimas 24 horas y que no estén ya invalidadas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItems.map((factura) => (
                    <FacturaCard key={factura.iddtefactura} factura={factura} esInvalidada={false} />
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
                      {facturas.length === 0 ? 'No hay facturas invalidables' : 'No se encontraron coincidencias'}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {facturas.length === 0 
                        ? 'Todas las facturas transmitidas en las últimas 24 horas aparecerán aquí' 
                        : 'Intenta con otros términos de búsqueda'}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Facturas Invalidadas</h2>
                    <p className="text-gray-600">
                      {facturasInvalidadas.length} {facturasInvalidadas.length === 1 ? "factura invalidada" : "facturas invalidadas"}
                      {searchTermInvalidadas && ` (${facturasInvalidadasFiltradas.length} encontradas)`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar facturas invalidadas..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        value={searchTermInvalidadas}
                        onChange={(e) => {
                          setSearchTermInvalidadas(e.target.value);
                          setCurrentPageInvalidadas(1);
                        }}
                      />
                    </div>

                    <select
                      value={ordenFechaInvalidadas}
                      onChange={(e) => {
                        setOrdenFechaInvalidadas(e.target.value);
                        setCurrentPageInvalidadas(1);
                      }}
                      className="px-3 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-red-500 focus:border-red-500 text-gray-700"
                    >
                      <option value="reciente">Más reciente</option>
                      <option value="antigua">Más antigua</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItemsInvalidadas.map((factura) => (
                    <FacturaCard key={factura.iddtefactura} factura={factura} esInvalidada={true} />
                  ))}
                </div>

                <Pagination 
                  currentPage={currentPageInvalidadas}
                  totalPages={totalPagesInvalidadas}
                  onPageChange={paginateInvalidadas}
                />

                {facturasInvalidadasOrdenadas.length === 0 && (
                  <div className="text-center py-10">
                    <div className="text-gray-400 mb-3">
                      <FaBan className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">
                      No hay facturas invalidadas
                    </h3>
                    <p className="text-gray-500 mt-1">
                      Las facturas que invalides aparecerán en esta sección
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirmar invalidación</h3>
              <p className="text-sm text-gray-500 mb-4">
                ¿Estás seguro de que deseas invalidar la factura #{facturaSeleccionada?.numerofacturausuario}?
                Esta acción no se puede deshacer.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de invalidación
                </label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Ingresa el motivo de la invalidación..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setMotivoAnulacion("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAnularFactura(facturaSeleccionada.iddtefactura, motivoAnulacion)}
                  disabled={!motivoAnulacion.trim() || anulando}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md"
                >
                  {anulando ? "Invalidando..." : "Invalidar Factura"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}