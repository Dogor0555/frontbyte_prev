"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaUser, FaCalendarAlt, FaFilePdf, FaChevronLeft, FaChevronRight, FaBan, FaSync, FaSortAmountDown, FaSortAmountUpAlt } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";

export default function FacturasView( { user, hasHaciendaToken, haciendaStatus } ) {
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
        setFacturas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar las facturas: " + error.message);
        setFacturas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFacturas();
  }, []);

  // Función para ordenar facturas por fecha
  const ordenarFacturasPorFecha = (facturas) => {
    return [...facturas].sort((a, b) => {
      const fechaA = new Date(a.fechaemision || 0);
      const fechaB = new Date(b.fechaemision || 0);
      
      if (ordenFecha === "reciente") {
        return fechaB - fechaA; // Más reciente primero
      } else {
        return fechaA - fechaB; // Más antigua primero
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

        const matchEstado = estadoFiltro ? factura.estado === estadoFiltro : true;

        return matchSearch && matchEstado;
      })
    : [];

  // Aplicar ordenamiento por fecha
  const facturasOrdenadas = ordenarFacturasPorFecha(facturasFiltradas);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = facturasOrdenadas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(facturasOrdenadas.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  const puedeAnular = (factura) => {
    if (!factura) return false;
    
    if (factura.estado === 'ANULADO') return false;
    
    if (!['TRANSMITIDO', 'RE-TRANSMITIDO'].includes(factura.estado)) return false;
    
    if (factura.fechaemision) {
      const fechaEmision = new Date(factura.fechaemision);
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
    setAnulando(facturaId);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${facturaId}/anular`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al anular factura');
      }

      setFacturas(prev => prev.map(factura => 
        factura.iddtefactura === facturaId 
          ? { ...factura, estado: 'ANULADO' }
          : factura
      ));
      
      alert('Factura anulada exitosamente');
    } catch (error) {
      console.error('Error al anular:', error);
      alert('Error: ' + error.message);
    } finally {
      setAnulando(null);
    }
  };

  const handleReTransmitir = async (facturaId) => {
    setReTransmitiendo(facturaId);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${facturaId}/contingencia`, {
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

  const handleGeneratePDF = async (facturaId, numeroFactura) => {
    setPdfLoading(facturaId);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${facturaId}/descargar-pdf?code=VERIFICATION_CODE`, {
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
      
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `FAC-${numeroFactura || facturaId}.pdf`;
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
    router.push(`/dashboard/facturas/${facturaId}`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-blue-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        ></div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        
        <Navbar 
          user={user} 
          hasHaciendaToken={hasHaciendaToken} 
          haciendaStatus={haciendaStatus} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed left-2 top-2 z-10 p-2 rounded-md bg-white shadow-md text-gray-600"
        >
          ☰
        </button>

        

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Facturas</h1>
                <p className="text-gray-600">
                  {facturas.length} {facturas.length === 1 ? "documento" : "documentos"} registrados
                  {searchTerm && ` (${facturasFiltradas.length} encontrados)`}
                </p>
              </div>

              {/* 🔎 Búsqueda + Filtro por estado + Orden por fecha */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por código, cliente o número..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <select
                  value={estadoFiltro}
                  onChange={(e) => {
                    setEstadoFiltro(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-blue-500 focus:border-blue-500 text-gray-700"
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
              </div>
            </div>

            {/* Listado en formato tarjeta-factura (más compacto) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((factura) => (
                <div
                  key={factura.iddtefactura}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-200"
                >
                  {/* Encabezado de factura con azul sólido */}
                  <div className="bg-blue-600 text-white p-3">
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
                        <span className="text-xs">{formatDate(factura.fechaemision)}</span>
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
                        <span className="text-xs font-medium">Cliente</span>
                      </div>
                      <p className="text-gray-900 text-sm font-medium truncate pl-3">
                        {factura.nombentrega || 'Cliente no especificado'}
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

                    {/* Botón de Re-transmitir para contingencias */}
                    {puedeReTransmitir(factura) && (
                      <button
                        onClick={() => handleReTransmitir(factura.iddtefactura)}
                        disabled={reTransmitiendo === factura.iddtefactura}
                        className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                          reTransmitiendo === factura.iddtefactura
                            ? 'bg-gray-400 text-gray-700'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      >
                        {reTransmitiendo === factura.iddtefactura ? (
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                        ) : (
                          <FaSync className="mr-1 text-xs" />
                        )}
                        Re-transmitir
                      </button>
                    )}

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
                          ? 'bg-gray-400 text-gray-700'
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
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {facturasOrdenadas.length > itemsPerPage && (
              <div className="flex justify-center mt-6">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-l-md border ${
                      currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FaChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-3 py-1 border-t border-b ${
                        currentPage === number ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-r-md border ${
                      currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FaChevronRight />
                  </button>
                </nav>
              </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {facturasOrdenadas.length === 0 && (
              <div className="text-center py-10">
                <div className="text-gray-400 mb-3">
                  <FaFileAlt className="inline-block text-4xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">
                  {facturas.length === 0 ? 'No hay facturas registradas' : 'No se encontraron coincidencias'}
                </h3>
                <p className="text-gray-500 mt-1">
                  {facturas.length === 0 ? 'Comienza creando tu primera factura' : 'Intenta con otros términos de búsqueda'}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}