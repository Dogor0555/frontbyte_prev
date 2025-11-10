"use client";
import { useState, useEffect, useRef } from "react";
import { FaSearch, FaFileAlt, FaCalendarAlt, FaDownload, FaFilter, FaChartLine, FaFileExcel, FaPrint, FaSync, FaFilePdf, FaFileExport } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';

export default function AnexoContribuyenteView({ user, hasHaciendaToken, haciendaStatus }) {
  const [isMobile, setIsMobile] = useState(false);
  const [documentos, setDocumentos] = useState([]);
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
    totalDebitoFiscal: 0,
    totalVentasTerceros: 0,
    totalDebitoFiscalTerceros: 0,
    cantidadDocumentos: 0
  });
  
  const itemsPerPage = 10;
  const router = useRouter();
  const tableRef = useRef();

  useEffect(() => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFechaInicio(primerDiaMes.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchDocumentos();
    }
  }, [fechaInicio, fechaFin]);

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/anexo-contribuyentes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
          credentials: "include"
        }
      );
      
      if (!response.ok) throw new Error("Error al cargar documentos");
      const data = await response.json();
      
      setDocumentos(Array.isArray(data.documentos) ? data.documentos : []);
      setResumen(data.resumen || {
        totalVentas: 0,
        totalGravadas: 0,
        totalExentas: 0,
        totalNoSujetas: 0,
        totalDebitoFiscal: 0,
        totalVentasTerceros: 0,
        totalDebitoFiscalTerceros: 0,
        cantidadDocumentos: 0
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar los documentos: " + error.message);
      setDocumentos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      let datosParaExportar = documentos;
      
      if (datosParaExportar.length === 0) {
        const response = await fetch(
          `http://localhost:3000/anexo-contribuyente?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
          {
            credentials: "include"
          }
        );
        
        if (!response.ok) throw new Error("Error al cargar datos para exportar");
        const data = await response.json();
        datosParaExportar = Array.isArray(data.documentos) ? data.documentos : [];
      }

      if (datosParaExportar.length === 0) {
        alert("No hay datos para exportar en el período seleccionado");
        return;
      }

      // Crear nuevo workbook con ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Anexo Contribuyente');

      // Definir columnas para Anexo Contribuyente con anchos aumentados
      worksheet.columns = [
        { header: 'FECHA EMISIÓN', key: 'fecha_emision', width: 12 },
        { header: 'CLASE DOCUMENTO', key: 'clase_documento', width: 25 }, // Aumentado de 20 a 25
        { header: 'TIPO DOCUMENTO', key: 'tipo_documento', width: 20 }, // Aumentado de 15 a 20
        { header: 'NÚMERO RESOLUCIÓN', key: 'numero_resolucion', width: 25 }, // Aumentado de 18 a 25
        { header: 'SERIE DOCUMENTO', key: 'serie_documento', width: 20 }, // Aumentado de 15 a 20
        { header: 'NÚMERO DOCUMENTO', key: 'numero_documento', width: 20 }, // Aumentado de 15 a 20
        { header: 'CONTROL INTERNO', key: 'numero_control_interno', width: 15 },
        { header: 'NIT/NRC CLIENTE', key: 'nit_nrc_cliente', width: 15 },
        { header: 'RAZÓN SOCIAL', key: 'nombre_razon_social', width: 30 }, // Aumentado de 25 a 30
        { header: 'VENTAS EXENTAS', key: 'ventas_exentas', width: 14 },
        { header: 'VENTAS NO SUJETAS', key: 'ventas_no_sujetas', width: 14 },
        { header: 'VENTAS GRAVADAS', key: 'ventas_gravadas_locales', width: 14 },
        { header: 'DÉBITO FISCAL', key: 'debito_fiscal', width: 14 },
        { header: 'VENTAS TERCEROS', key: 'ventas_cuenta_terceros', width: 14 },
        { header: 'DÉBITO FISCAL TERCEROS', key: 'debito_fiscal_terceros', width: 16 },
        { header: 'TOTAL VENTAS', key: 'total_ventas', width: 12 },
        { header: 'DUI CLIENTE', key: 'numero_dui_cliente', width: 12 },
        { header: 'TIPO OPERACIÓN', key: 'tipo_operacion', width: 12 },
        { header: 'TIPO INGRESO', key: 'tipo_ingreso', width: 12 },
        { header: 'NÚMERO ANEXO', key: 'numero_anexo', width: 10 }
      ];

      // Estilo para la cabecera - VERDE con letras BLANCAS
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { 
          color: { argb: 'FFFFFFFF' }, 
          bold: true,
          size: 10
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF70AD47' } // Verde
        };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: 'center',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      headerRow.height = 25;

      // Agregar datos con filas alternadas
      datosParaExportar.forEach((doc, index) => {
        const row = worksheet.addRow({
          fecha_emision: doc.fecha_emision || '',
          clase_documento: doc.clase_documento || '',
          tipo_documento: doc.tipo_documento || '',
          numero_resolucion: doc.numero_resolucion || '',
          serie_documento: doc.serie_documento || '',
          numero_documento: doc.numero_documento || '',
          numero_control_interno: doc.numero_control_interno || '',
          nit_nrc_cliente: doc.nit_nrc_cliente || '',
          nombre_razon_social: doc.nombre_razon_social || '',
          ventas_exentas: doc.ventas_exentas || 0,
          ventas_no_sujetas: doc.ventas_no_sujetas || 0,
          ventas_gravadas_locales: doc.ventas_gravadas_locales || 0,
          debito_fiscal: doc.debito_fiscal || 0,
          ventas_cuenta_terceros: doc.ventas_cuenta_terceros || 0,
          debito_fiscal_terceros: doc.debito_fiscal_terceros || 0,
          total_ventas: doc.total_ventas || 0,
          numero_dui_cliente: doc.numero_dui_cliente || '',
          tipo_operacion: doc.tipo_operacion || '',
          tipo_ingreso: doc.tipo_ingreso || '',
          numero_anexo: doc.numero_anexo || ''
        });

        // Alternar colores de fila
        const isEvenRow = index % 2 === 0;
        const fillColor = isEvenRow ? 'FFE2EFDA' : 'FFFFFFFF';
        
        row.eachCell((cell, colNumber) => {
          if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: fillColor }
            };
            
            cell.font = {
              color: { argb: 'FF000000' },
              size: 9
            };
            
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };

            // Formato numérico para columnas de valores (columnas 10-16)
            if (colNumber >= 10 && colNumber <= 16) {
              cell.numFmt = '#,##0.00';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }

            // Alinear primera columna al centro
            if (colNumber === 1) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
          }
        });
      });

      // HOJA DE RESUMEN
      const worksheetResumen = workbook.addWorksheet('Resumen');

      // Datos para el resumen
      const fechaGeneracion = new Date();
      const datosResumen = [
        ['ANEXO DE CONTRIBUYENTE - RESUMEN', ''],
        ['', ''],
        ['Fecha de generación:', fechaGeneracion.toLocaleDateString('es-SV')],
        ['Período:', `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`],
        ['', ''],
        ['RESUMEN GENERAL'],
        ['Total Documentos:', resumen.cantidadDocumentos || 0],
        ['Ventas Gravadas:', resumen.totalGravadas || 0],
        ['Ventas Exentas:', resumen.totalExentas || 0],
        ['Ventas No Sujetas:', resumen.totalNoSujetas || 0],
        ['Débito Fiscal:', resumen.totalDebitoFiscal || 0],
        ['Ventas a Terceros:', resumen.totalVentasTerceros || 0],
        ['Débito Fiscal Terceros:', resumen.totalDebitoFiscalTerceros || 0],
        ['Total Ventas:', resumen.totalVentas || 0]
      ];

      // Agregar datos al resumen
      datosResumen.forEach((fila, rowIndex) => {
        const row = worksheetResumen.addRow(fila);
        
        row.eachCell((cell, colNumber) => {
          if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
            
            // Estilo para títulos principales
            if (rowIndex === 0 || rowIndex === 5) {
              if (colNumber === 1) {
                cell.font = { 
                  color: { argb: 'FFFFFFFF' }, 
                  bold: true,
                  size: rowIndex === 0 ? 14 : 12
                };
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF70AD47' } // Verde
                };
                cell.alignment = { horizontal: 'center' };
              }
            }
            
            // Formato numérico para valores en la segunda columna
            if (colNumber === 2 && typeof cell.value === 'number') {
              cell.numFmt = '#,##0.00';
              cell.alignment = { horizontal: 'right' };
            }

            // Bordes para todas las celdas con contenido
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          }
        });

        // Ajustar altura solo para filas con contenido
        if (fila.some(cell => cell !== null && cell !== undefined && cell !== '')) {
          if (rowIndex === 0 || rowIndex === 5) {
            row.height = 25;
          }
        }
      });

      // Anchos fijos para el resumen
      worksheetResumen.columns = [
        { width: 30 },
        { width: 20 }
      ];

      // Generar y descargar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anexo-contribuyente-${fechaInicio}-a-${fechaFin}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const rowsPerPage = 15;
      const chunks = [];
      for (let i = 0; i < documentosFiltrados.length; i += rowsPerPage) {
        chunks.push(documentosFiltrados.slice(i, i + rowsPerPage));
      }
      
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 8;
      
      chunks.forEach((chunk, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage();
        }
        
        // Encabezado
        if (pageIndex === 0) {
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text("ANEXO DE CONTRIBUYENTE", pageWidth / 2, 15, { align: "center" });
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, margin, 25);
          doc.text(`Generado: ${new Date().toLocaleDateString('es-SV')}`, pageWidth - margin, 25, { align: "right" });
          
          // Resumen
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("RESUMEN", margin, 35);
          
          doc.setFont("helvetica", "normal");
          doc.text(`Total Documentos: ${resumen.cantidadDocumentos}`, margin, 42);
          doc.text(`Ventas Gravadas: ${formatCurrency(resumen.totalGravadas)}`, margin, 49);
          doc.text(`Débito Fiscal: ${formatCurrency(resumen.totalDebitoFiscal)}`, margin + 70, 42);
          doc.text(`Total Ventas: ${formatCurrency(resumen.totalVentas)}`, margin + 70, 49);
        }
        
        const tableData = chunk.map(doc => [
          doc.fecha_emision || '-',
          doc.clase_documento || '-',
          doc.tipo_documento || '-',
          doc.numero_resolucion || '-',
          doc.serie_documento || '-',
          doc.numero_documento || '-',
          doc.numero_control_interno || '-',
          doc.nit_nrc_cliente || '-',
          doc.nombre_razon_social || '-',
          formatCurrency(doc.ventas_exentas),
          formatCurrency(doc.ventas_no_sujetas),
          formatCurrency(doc.ventas_gravadas_locales),
          formatCurrency(doc.debito_fiscal),
          formatCurrency(doc.ventas_cuenta_terceros),
          formatCurrency(doc.debito_fiscal_terceros),
          formatCurrency(doc.total_ventas),
          doc.numero_dui_cliente || '-',
          doc.tipo_operacion || '-',
          doc.tipo_ingreso || '-',
          doc.numero_anexo || '-'
        ]);
        
        const startY = pageIndex === 0 ? 55 : 20;
        
        autoTable(doc, {
          startY: startY,
          head: pageIndex === 0 ? [
            ['Fecha', 'Clase', 'Tipo', 'Resolución', 'Serie', 'N° Doc', 'Control', 'NIT/NRC', 'Razón Social', 'Exentas', 'No Sujetas', 'Gravadas', 'Débito Fiscal', 'Ventas Terceros', 'Débito Terceros', 'Total', 'DUI', 'Operación', 'Ingreso', 'Anexo']
          ] : [],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [112, 173, 71], // Verde
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 5
          },
          styles: {
            fontSize: 4,
            cellPadding: 1,
            valign: 'middle'
          },
          margin: { left: margin, right: margin }
        });

        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Página ${pageIndex + 1} de ${chunks.length}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      });
      
      doc.save(`anexo-contribuyente-${fechaInicio}-a-${fechaFin}.pdf`);
      
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocumentos();
  };

  const documentosFiltrados = Array.isArray(documentos)
    ? documentos.filter((doc) => {
        if (!doc) return false;
        const searchLower = searchTerm.toLowerCase();

        return (
          (doc.serie_documento?.toLowerCase() || "").includes(searchLower) ||
          (doc.numero_documento?.toString() || "").includes(searchTerm) ||
          (doc.numero_resolucion?.toLowerCase() || "").includes(searchLower) ||
          (doc.tipo_documento?.toLowerCase() || "").includes(searchLower) ||
          (doc.clase_documento?.toLowerCase() || "").includes(searchLower) ||
          (doc.nombre_razon_social?.toLowerCase() || "").includes(searchLower) ||
          (doc.nit_nrc_cliente?.toLowerCase() || "").includes(searchLower)
        );
      })
    : [];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = documentosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(documentosFiltrados.length / itemsPerPage);
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

  // Columnas específicas para Anexo Contribuyente
  const columns = [
    { key: 'fecha_emision', label: 'FECHA EMISIÓN', width: '100px' },
    { key: 'clase_documento', label: 'CLASE DOCUMENTO', width: '150px' },
    { key: 'tipo_documento', label: 'TIPO DOCUMENTO', width: '130px' },
    { key: 'numero_resolucion', label: 'NÚMERO RESOLUCIÓN', width: '150px' },
    { key: 'serie_documento', label: 'SERIE DOCUMENTO', width: '120px' },
    { key: 'numero_documento', label: 'NÚMERO DOCUMENTO', width: '130px' },
    { key: 'numero_control_interno', label: 'CONTROL INTERNO', width: '120px' },
    { key: 'nit_nrc_cliente', label: 'NIT/NRC CLIENTE', width: '120px' },
    { key: 'nombre_razon_social', label: 'RAZÓN SOCIAL', width: '200px' },
    { key: 'ventas_exentas', label: 'VENTAS EXENTAS', width: '110px', align: 'right' },
    { key: 'ventas_no_sujetas', label: 'VENTAS NO SUJETAS', width: '120px', align: 'right' },
    { key: 'ventas_gravadas_locales', label: 'VENTAS GRAVADAS', width: '120px', align: 'right' },
    { key: 'debito_fiscal', label: 'DÉBITO FISCAL', width: '110px', align: 'right' },
    { key: 'ventas_cuenta_terceros', label: 'VENTAS TERCEROS', width: '120px', align: 'right' },
    { key: 'debito_fiscal_terceros', label: 'DÉBITO TERCEROS', width: '120px', align: 'right' },
    { key: 'total_ventas', label: 'TOTAL VENTAS', width: '110px', align: 'right' },
    { key: 'numero_dui_cliente', label: 'DUI CLIENTE', width: '100px' },
    { key: 'tipo_operacion', label: 'TIPO OPERACIÓN', width: '120px' },
    { key: 'tipo_ingreso', label: 'TIPO INGRESO', width: '120px' },
    { key: 'numero_anexo', label: 'N° ANEXO', width: '80px' }
  ];
  
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
          <div className="animate-spin h-12 w-12 border-4 border-green-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando anexo de contribuyente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen text-black bg-gray-50 overflow-hidden">
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
            <div className="max-w-full mx-auto">
              {/* Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Anexo de Contribuyente</h1>
                  <p className="text-gray-600 text-sm">
                    Registro detallado de ventas a contribuyentes - Vista completa
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                  </button>
                  
                  <button
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <FaFileExcel className="mr-2" />
                    {exporting ? 'Exportando...' : 'Excel'}
                  </button>
                  
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF}
                    className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                        placeholder="Serie, documento, NIT, razón social..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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

              {/* Tabla de Documentos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-green-50">
                      <tr>
                        {columns.map((column) => (
                          <th 
                            key={column.key}
                            className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                            style={{ width: column.width }}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((doc, index) => (
                        <tr key={doc.id || index} className="hover:bg-green-50 transition-colors">
                          {columns.map((column) => (
                            <td 
                              key={column.key}
                              className={`px-3 py-3 text-sm ${
                                column.align === 'right' ? 'text-right' : 'text-left'
                              } ${
                                ['serie_documento', 'numero_resolucion', 'numero_documento', 'nit_nrc_cliente'].includes(column.key)
                                  ? 'font-mono text-gray-600 text-xs'
                                  : 'text-gray-700'
                              } whitespace-nowrap`}
                            >
                              {column.key.includes('ventas') || column.key.includes('debito') || column.key === 'total_ventas' ? (
                                formatCurrency(doc[column.key] || 0)
                              ) : (
                                doc[column.key] || '-'
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {documentosFiltrados.length > itemsPerPage && (
                  <div className="px-4 py-3 bg-green-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, documentosFiltrados.length)} de {documentosFiltrados.length} registros
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Anterior
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje cuando no hay resultados */}
                {documentosFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-3">
                      <FaFileAlt className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No se encontraron registros
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {documentos.length === 0 
                        ? 'No hay documentos registrados en el período seleccionado' 
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