"use client";
import { useState, useEffect, useRef } from "react";
import { FaSearch, FaFileAlt, FaCalendarAlt, FaDownload, FaFilter, FaChartLine, FaFileExcel, FaPrint, FaSync, FaFilePdf } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from "@/lib/api";

export default function LibroVentasView({ user, hasHaciendaToken, haciendaStatus }) {
  const [isMobile, setIsMobile] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalGravadas: 0,
    totalExentas: 0,
    totalNoSujetas: 0,
    totalIVA: 0,
    cantidadVentas: 0
  });
  
  const itemsPerPage = 15;
  const router = useRouter();
  const tableRef = useRef();

  useEffect(() => {
    const hoy = new Date();
    setFechaInicio(hoy.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchVentas();
    }
  }, [fechaInicio, fechaFin]);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/ventas-por-fecha?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
          credentials: "include"
        }
      );
      
      if (!response.ok) throw new Error("Error al cargar ventas");
      const data = await response.json();
      
      setVentas(Array.isArray(data.ventas) ? data.ventas : []);
      setResumen(data.resumen || {
        totalVentas: 0,
        totalGravadas: 0,
        totalExentas: 0,
        totalNoSujetas: 0,
        totalIVA: 0,
        cantidadVentas: 0
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar las ventas: " + error.message);
      setVentas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/exportar-excel?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
          credentials: "include"
        }
      );
      
      if (!response.ok) throw new Error("Error al exportar Excel");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `libro-ventas-${fechaInicio}-a-${fechaFin}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al exportar Excel: " + error.message);
    } finally {
      setExporting(false);
    }
  };


const handleExportPDF = async () => {
  setExportingPDF(true);
  try {
    // Calcular cuántas filas caben por página
    const rowsPerPage = 25; // Ajustar según necesidad
    
    // Dividir los datos en chunks para múltiples páginas
    const chunks = [];
    for (let i = 0; i < ventasFiltradas.length; i += rowsPerPage) {
      chunks.push(ventasFiltradas.slice(i, i + rowsPerPage));
    }
    
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    chunks.forEach((chunk, pageIndex) => {
      if (pageIndex > 0) {
        doc.addPage();
      }
      
      // Encabezado (solo en primera página)
      if (pageIndex === 0) {
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("LIBRO DE VENTAS", pageWidth / 2, 20, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, margin, 35);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-SV')}`, pageWidth - margin, 35, { align: "right" });
        
        // Resumen solo en primera página
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMEN DEL PERÍODO", margin, 50);
        
        doc.setFont("helvetica", "normal");
        doc.text(`Total Documentos: ${resumen.cantidadVentas}`, margin, 60);
        doc.text(`Ventas Totales: ${formatCurrency(resumen.totalVentas)}`, margin, 67);
        doc.text(`Ventas Gravadas: ${formatCurrency(resumen.totalGravadas)}`, margin, 74);
      }
      
      const tableData = chunk.map(venta => [
        venta.numerofacturausuario || '-',
        formatDate(venta.fechaemision),
        venta.ncontrol || '-',
        formatCurrency(venta.ventaGravada),
        formatCurrency(venta.ventaExenta),
        formatCurrency(venta.iva),
        formatCurrency(venta.totalVenta)
      ]);
      
      const startY = pageIndex === 0 ? 85 : 20;
      
      autoTable(doc, {
        startY: startY,
        head: pageIndex === 0 ? [
          ['# Documento', 'Fecha', 'N° Control', 'Ventas Gravadas', 'Ventas Exentas', 'IVA', 'Total']
        ] : [],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 45 },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Página ${pageIndex + 1} de ${chunks.length}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    });
    
    doc.save(`libro-ventas-${fechaInicio}-a-${fechaFin}.pdf`);
    
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  } finally {
    setExportingPDF(false);
  }
};

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVentas();
  };

  const handlePrint = () => {
    window.print();
  };

  const ventasFiltradas = Array.isArray(ventas)
    ? ventas.filter((venta) => {
        if (!venta) return false;
        const searchLower = searchTerm.toLowerCase();

        return (
          (venta.ncontrol?.toLowerCase() || "").includes(searchLower) ||
          (venta.numerofacturausuario?.toString() || "").includes(searchTerm) ||
          (venta.iddtefactura?.toString() || "").includes(searchTerm)
        );
      })
    : [];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = ventasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount || 0);
  
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('es-SV', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return "-";
    }
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando libro de ventas...</p>
        </div>
      </div>
    );
  }

return (
    <div className="flex h-screen  text-black bg-gray-50 overflow-hidden">
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
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
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
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Libro de Ventas</h1>
                  <p className="text-gray-600 text-sm">
                    Registro contable de todas las transacciones comerciales
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                  </button>
                  
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <FaFilePdf className="mr-2" />
                    {exportingPDF ? 'Generando...' : 'PDF'}
                  </button>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio
                    </label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Fin
                    </label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar documento
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Número, control..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {resumen.cantidadVentas}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Documentos</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {formatCurrency(resumen.totalVentas)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Total Ventas</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-amber-600 mb-1">
                    {formatCurrency(resumen.totalGravadas)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Gravadas</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {formatCurrency(resumen.totalExentas)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Exentas</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-600 mb-1">
                    {formatCurrency(resumen.totalNoSujetas)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">No Sujetas</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {formatCurrency(resumen.totalIVA)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">IVA</div>
                </div>
              </div>

              {/* Tabla de Ventas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          # Documento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N° Control
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ventas Gravadas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ventas Exentas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IVA
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((venta) => (
                        <tr key={venta.iddtefactura} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {venta.numerofacturausuario}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(venta.fechaemision)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {venta.ncontrol || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(venta.ventaGravada)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(venta.ventaExenta)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(venta.iva)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 text-right">
                            {formatCurrency(venta.totalVenta)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {ventasFiltradas.length > itemsPerPage && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, ventasFiltradas.length)} de {ventasFiltradas.length} registros
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje cuando no hay resultados */}
                {ventasFiltradas.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-3">
                      <FaFileAlt className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No se encontraron registros
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {ventas.length === 0 
                        ? 'No hay ventas registradas en el período seleccionado' 
                        : 'No se encontraron coincidencias con los filtros aplicados'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}