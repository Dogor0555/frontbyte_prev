"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaUser, FaCalendarAlt, FaFilePdf, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FacturasView() {
  const [facturas, setFacturas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const itemsPerPage = 6;
  const router = useRouter();

  // Obtener facturas al cargar
  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        const response = await fetch("http://localhost:3000/facturas/completas", {
          credentials: "include"
        });
        
        if (!response.ok) throw new Error("Error al cargar facturas");
        
        const data = await response.json();
        setFacturas(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacturas();
  }, []);

  // Filtrar facturas
  const facturasFiltradas = facturas.filter(factura => 
    factura.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factura.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factura.numero.toString().includes(searchTerm)
  );

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = facturasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(facturasFiltradas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Formateadores
  const formatCurrency = (amount) => 
    new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString) => 
    new Date(dateString).toLocaleDateString('es-SV', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

  // Generar PDF
  const handleGeneratePDF = async (facturaId, numeroFactura) => {
    setPdfLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${numeroFactura}`, {
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Error al generar PDF");

      const facturaData = await response.json();
      
      if (!facturaData.documentofirmado) {
        throw new Error("La factura no tiene documento firmado");
      }

      // Enviar el token firmado al servicio de generación de PDF
      const pdfResponse = await fetch("http://localhost:3000/generar-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: facturaData.documentofirmado,
          tipo: "factura",
          facturaId: facturaId // Enviamos el ID interno
        }),
        credentials: "include"
      });

      if (!pdfResponse.ok) throw new Error("Error al generar PDF");

      // Crear el PDF en el cliente
      const pdfBlob = await pdfResponse.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Descargar automáticamente
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `FAC-${numeroFactura}.pdf`; // Usamos el número de factura para el nombre del archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // Ver detalles completos - Usamos el número de factura en la URL
  const handleViewDetails = (numeroFactura) => {
    router.push(`/dashboard/facturas/${numeroFactura}`);
  };

  // Toggle sidebar en móvil
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
      {/* Sidebar para desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Botón para abrir sidebar en móvil */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden fixed left-2 top-2 z-10 p-2 rounded-md bg-white shadow-md text-gray-600"
        >
          ☰
        </button>

        {/* Contenido con scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Facturas</h1>
                <p className="text-gray-600">
                  {facturas.length} {facturas.length === 1 ? 'documento' : 'documentos'} registrados
                  {searchTerm && ` (${facturasFiltradas.length} encontrados)`}
                </p>
              </div>
              
              <div className="relative w-full md:w-64">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar facturas..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Listado en formato tarjeta-factura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentItems.map((factura) => (
                <div key={factura.id} className="bg-gray-100 rounded-xl shadow-md overflow-hidden border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-300">
                  {/* Encabezado de factura */}
                  <div className="bg-blue-600 text-white p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <FaFileAlt className="mr-2" />
                        <span className="font-semibold">FAC-{factura.numero.toString().padStart(4, '0')}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        factura.tipo === 'crédito' ? 'bg-blue-700' : 'bg-blue-800'
                      }`}>
                        {factura.tipo.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de factura */}
                  <div className="p-5">
                    <div className="flex items-center mb-4 text-gray-600">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      <span>{formatDate(factura.fecha)}</span>
                    </div>

                    <div className="flex items-center mb-4 text-gray-600">
                      <FaUser className="mr-2 text-blue-500" />
                      <span className="truncate">{factura.cliente.nombre}</span>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-1">Código</div>
                      <div className="font-mono text-gray-700">{factura.codigo}</div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(factura.total)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pie de factura - Acciones */}
                  <div className="bg-gray-50 px-4 py-3 flex justify-end border-t gap-4">
                    <button 
                      onClick={() => handleViewDetails(factura.numero)} // Usamos el número de factura
                      className="flex items-center text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                      title="Ver detalles completos"
                    >
                      <FaFileAlt className="mr-1" /> Detalles
                    </button>
                    <button 
                      onClick={() => handleGeneratePDF(factura.id, factura.numero)} // Pasamos ambos valores
                      disabled={pdfLoading}
                      className={`flex items-center ${pdfLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white px-3 py-1 rounded transition-colors`}
                      title="Descargar DTE en PDF"
                    >
                      {pdfLoading ? (
                        'Generando...'
                      ) : (
                        <>
                          <FaFilePdf className="mr-1" /> DTE
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {facturasFiltradas.length > itemsPerPage && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-l-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <FaChevronLeft />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-4 py-1 border-t border-b ${currentPage === number ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-r-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <FaChevronRight />
                  </button>
                </nav>
              </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {facturasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FaFileAlt className="inline-block text-5xl" />
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