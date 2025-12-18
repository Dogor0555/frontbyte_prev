"use client";
import { useState, useEffect, useRef } from "react";
import { FaSearch, FaFileAlt, FaCalendarAlt, FaDownload, FaFilter, FaChartLine, FaFileExcel, FaPrint, FaSync, FaFilePdf, FaFileExport, FaTimesCircle, FaExclamationTriangle, FaUserTie, FaBuilding } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';

export default function AnexoContribuyentesInvalidadasView({ user, hasHaciendaToken, haciendaStatus }) {
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
    cantidadDocumentos: 0,
    totalFacturas: 0,
    totalInvalidado: 0,
    totalDebitoFiscal: 0,
    rangoFechas: {
      fechaInicio: '',
      fechaFin: ''
    }
  });
  
  const itemsPerPage = 10;
  const router = useRouter();
  const tableRef = useRef();

  // Función para obtener la fecha actual en hora de El Salvador (UTC-6)
  const getCurrentDateElSalvador = () => {
    const ahora = new Date();
    const offsetElSalvador = -6;
    const horaElSalvador = new Date(ahora.getTime() + (offsetElSalvador * 60 * 60 * 1000));
    return horaElSalvador;
  };

  useEffect(() => {
    const hoy = getCurrentDateElSalvador();
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
        `${API_BASE_URL}/anexo-contribuyentes-invalidadas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
          credentials: "include"
        }
      );
      
      if (!response.ok) throw new Error("Error al cargar documentos invalidados de contribuyentes");
      const data = await response.json();
      
      setDocumentos(Array.isArray(data.facturasInvalidadas) ? data.facturasInvalidadas : []);
      setResumen(data.resumen || {
        cantidadDocumentos: 0,
        totalFacturas: 0,
        totalInvalidado: 0,
        totalDebitoFiscal: 0,
        rangoFechas: {
          fechaInicio: '',
          fechaFin: ''
        }
      });
      
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar los documentos invalidados de contribuyentes: " + error.message);
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
          `${API_BASE_URL}/anexo-contribuyentes-invalidadas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
          {
            credentials: "include"
          }
        );
        
        if (!response.ok) throw new Error("Error al cargar datos para exportar");
        const data = await response.json();
        datosParaExportar = Array.isArray(data.facturasInvalidadas) ? data.facturasInvalidadas : [];
      }

      if (datosParaExportar.length === 0) {
        alert("No hay datos para exportar en el período seleccionado");
        return;
      }

      // Crear nuevo workbook con ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Anexo Contribuyentes Invalidadas');

      // Definir columnas basadas en los campos del endpoint de contribuyentes
      worksheet.columns = [
        { header: 'NÚMERO DE RESOLUCIÓN', key: 'numero_resolucion', width: 20 },
        { header: 'CLASE DE DOCUMENTO', key: 'clase_documento', width: 35 },
        { header: 'DESDE PREIMPRESO', key: 'desde_preimpreso', width: 15 },
        { header: 'HASTA PREIMPRESO', key: 'hasta_preimpreso', width: 15 },
        { header: 'TIPO DE DOCUMENTO', key: 'tipo_documento', width: 25 },
        { header: 'TIPO DE DETALLE', key: 'tipo_detalle', width: 25 },
        { header: 'NÚMERO DE SERIE', key: 'numero_serie', width: 15 },
        { header: 'DESDE', key: 'desde', width: 10 },
        { header: 'HASTA', key: 'hasta', width: 10 },
        { header: 'CÓDIGO DE GENERACIÓN', key: 'codigo_generacion', width: 20 },
        { header: 'FECHA DE EMISIÓN', key: 'fecha_emision', width: 12 },
        { header: 'NÚMERO DE FACTURA', key: 'numero_factura', width: 15 },
        { header: 'NOMBRE CONTRIBUYENTE', key: 'nombre_contribuyente', width: 30 },
        { header: 'NIT CONTRIBUYENTE', key: 'nit_contribuyente', width: 15 },
        { header: 'NRC CONTRIBUYENTE', key: 'nrc_contribuyente', width: 15 },
        { header: 'TOTAL', key: 'total', width: 15 },
        { header: 'DÉBITO FISCAL', key: 'debito_fiscal', width: 15 }
      ];

      // Estilo para la cabecera - AZUL con letras BLANCAS para contribuyentes
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
          fgColor: { argb: 'FF2E5C8E' } // Azul para contribuyentes
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
          numero_resolucion: doc.numero_resolucion || '',
          clase_documento: doc.clase_documento || '',
          desde_preimpreso: doc.desde_preimpreso || '',
          hasta_preimpreso: doc.hasta_preimpreso || '',
          tipo_documento: doc.tipo_documento || '',
          tipo_detalle: doc.tipo_detalle || '',
          numero_serie: doc.numero_serie || '',
          desde: doc.desde || '',
          hasta: doc.hasta || '',
          codigo_generacion: doc.codigo_generacion || '',
          fecha_emision: doc.fecha_emision || '',
          numero_factura: doc.numero_factura || '',
          nombre_contribuyente: doc.nombre_contribuyente || '',
          nit_contribuyente: doc.nit_contribuyente || '',
          nrc_contribuyente: doc.nrc_contribuyente || '',
          total: doc.total || 0,
          debito_fiscal: doc.debito_fiscal || 0
        });

        // Alternar colores de fila
        const isEvenRow = index % 2 === 0;
        const fillColor = isEvenRow ? 'FFE8F0F7' : 'FFFFFFFF'; // Azul muy claro para filas alternadas
        
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

            // Formato numérico para columnas de montos
            if (colNumber === 16 || colNumber === 17) {
              cell.numFmt = '#,##0.00';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }

            // Alinear columnas numéricas al centro
            if (colNumber >= 3 && colNumber <= 9 && colNumber !== 16 && colNumber !== 17) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            // Resaltar tipo de detalle como INVALIDADO
            if (colNumber === 6 && cell.value.includes('INVALIDADO')) {
              cell.font = { 
                color: { argb: 'FFFFFFFF' }, 
                bold: true 
              };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }
              };
            }
          }
        });
      });

      // HOJA DE RESUMEN
      const worksheetResumen = workbook.addWorksheet('Resumen');

      // Datos para el resumen
      const fechaGeneracion = getCurrentDateElSalvador();
      const datosResumen = [
        ['ANEXO DE CONTRIBUYENTES INVALIDADAS - RESUMEN', ''],
        ['', ''],
        ['Fecha de generación:', fechaGeneracion.toLocaleDateString('es-SV')],
        ['Período:', `${resumen.rangoFechas?.fechaInicio || formatDate(fechaInicio)} - ${resumen.rangoFechas?.fechaFin || formatDate(fechaFin)}`],
        ['', ''],
        ['RESUMEN GENERAL'],
        ['Total Documentos Invalidados:', resumen.cantidadDocumentos || 0],
        ['Total Facturas:', resumen.totalFacturas || 0],
        ['Monto Total Invalidado:', resumen.totalInvalidado || 0],
        ['Débito Fiscal Total:', resumen.totalDebitoFiscal || 0],
        ['', ''],
        ['DISTRIBUCIÓN POR TIPO'],
        ['Comprobantes Crédito Fiscal:', documentos.filter(doc => doc.tipo_documento?.includes('CRÉDITO FISCAL')).length],
        ['Notas de Crédito:', documentos.filter(doc => doc.tipo_documento?.includes('NOTA DE CRÉDITO')).length],
        ['Notas de Débito:', documentos.filter(doc => doc.tipo_documento?.includes('NOTA DE DÉBITO')).length]
      ];

      // Agregar datos al resumen
      datosResumen.forEach((fila, rowIndex) => {
        const row = worksheetResumen.addRow(fila);
        
        row.eachCell((cell, colNumber) => {
          if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
            
            // Estilo para títulos principales
            if (rowIndex === 0 || rowIndex === 5 || rowIndex === 10) {
              if (colNumber === 1) {
                cell.font = { 
                  color: { argb: 'FFFFFFFF' }, 
                  bold: true,
                  size: rowIndex === 0 ? 14 : 12
                };
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF2E5C8E' } // Azul para contribuyentes
                };
                cell.alignment = { horizontal: 'center' };
              }
            }
            
            // Formato numérico para valores en la segunda columna
            if (colNumber === 2 && typeof cell.value === 'number') {
              cell.numFmt = (rowIndex === 8 || rowIndex === 9) ? '#,##0.00' : '#,##0';
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
          if (rowIndex === 0 || rowIndex === 5 || rowIndex === 10) {
            row.height = 25;
          }
        }
      });

      // Anchos fijos para el resumen
      worksheetResumen.columns = [
        { width: 35 },
        { width: 25 }
      ];

      // Generar y descargar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anexo-contribuyentes-invalidadas-${fechaInicio}-a-${fechaFin}.xlsx`;
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
          doc.text("ANEXO DE CONTRIBUYENTES INVALIDADAS", pageWidth / 2, 15, { align: "center" });
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Período: ${resumen.rangoFechas?.fechaInicio || formatDate(fechaInicio)} - ${resumen.rangoFechas?.fechaFin || formatDate(fechaFin)}`, margin, 25);
          doc.text(`Generado: ${getCurrentDateElSalvador().toLocaleDateString('es-SV')}`, pageWidth - margin, 25, { align: "right" });
          
          // Resumen
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("RESUMEN", margin, 35);
          
          doc.setFont("helvetica", "normal");
          doc.text(`Total Documentos: ${resumen.cantidadDocumentos}`, margin, 42);
          doc.text(`Total Facturas: ${resumen.totalFacturas}`, margin, 49);
          doc.text(`Monto Total: ${formatCurrency(resumen.totalInvalidado)}`, margin + 70, 42);
          doc.text(`Débito Fiscal: ${formatCurrency(resumen.totalDebitoFiscal)}`, margin + 70, 49);
        }
        
        const tableData = chunk.map(doc => [
          doc.numero_resolucion?.substring(0, 15) || '-',
          doc.clase_documento?.substring(0, 20) || '-',
          doc.desde_preimpreso || '-',
          doc.hasta_preimpreso || '-',
          doc.tipo_documento?.substring(0, 15) || '-',
          doc.tipo_detalle?.substring(0, 15) || '-',
          doc.numero_serie?.substring(0, 10) || '-',
          doc.desde || '-',
          doc.hasta || '-',
          doc.codigo_generacion?.substring(0, 12) || '-',
          doc.fecha_emision || '-',
          doc.numero_factura?.substring(0, 10) || '-',
          doc.nombre_contribuyente?.substring(0, 15) || '-',
          doc.nit_contribuyente?.substring(0, 12) || '-',
          doc.nrc_contribuyente?.substring(0, 10) || '-',
          formatCurrency(doc.total || 0),
          formatCurrency(doc.debito_fiscal || 0)
        ]);
        
        const startY = pageIndex === 0 ? 55 : 20;
        
        autoTable(doc, {
          startY: startY,
          head: pageIndex === 0 ? [
            ['Resolución', 'Clase Doc', 'Desde Pre', 'Hasta Pre', 'Tipo Doc', 'Tipo Detalle', 'N° Serie', 'Desde', 'Hasta', 'Código Gen', 'Fecha Emi', 'N° Factura', 'Contribuyente', 'NIT', 'NRC', 'Total', 'Débito Fiscal']
          ] : [],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [46, 92, 142], // Azul para contribuyentes
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
      
      doc.save(`anexo-contribuyentes-invalidadas-${fechaInicio}-a-${fechaFin}.pdf`);
      
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
          (doc.numero_resolucion?.toLowerCase() || "").includes(searchLower) ||
          (doc.codigo_generacion?.toLowerCase() || "").includes(searchLower) ||
          (doc.numero_serie?.toLowerCase() || "").includes(searchLower) ||
          (doc.numero_factura?.toString() || "").includes(searchTerm) ||
          (doc.tipo_documento?.toLowerCase() || "").includes(searchLower) ||
          (doc.tipo_detalle?.toLowerCase() || "").includes(searchLower) ||
          (doc.nombre_contribuyente?.toLowerCase() || "").includes(searchLower) ||
          (doc.nit_contribuyente?.toLowerCase() || "").includes(searchLower) ||
          (doc.nrc_contribuyente?.toLowerCase() || "").includes(searchLower)
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

  // Columnas basadas en los campos del endpoint de contribuyentes
  const columns = [
    { key: 'numero_resolucion', label: 'RESOLUCIÓN', width: '180px' },
    { key: 'clase_documento', label: 'CLASE DOCUMENTO', width: '200px' },
    { key: 'desde_preimpreso', label: 'DESDE PRE', width: '80px', align: 'center' },
    { key: 'hasta_preimpreso', label: 'HASTA PRE', width: '80px', align: 'center' },
    { key: 'tipo_documento', label: 'TIPO DOCUMENTO', width: '150px' },
    { key: 'tipo_detalle', label: 'TIPO DETALLE', width: '150px' },
    { key: 'numero_serie', label: 'N° SERIE', width: '100px' },
    { key: 'desde', label: 'DESDE', width: '60px', align: 'center' },
    { key: 'hasta', label: 'HASTA', width: '60px', align: 'center' },
    { key: 'codigo_generacion', label: 'CÓDIGO GENERACIÓN', width: '150px' },
    { key: 'fecha_emision', label: 'FECHA EMISIÓN', width: '100px' },
    { key: 'numero_factura', label: 'N° FACTURA', width: '100px' },
    { key: 'nombre_contribuyente', label: 'CONTRIBUYENTE', width: '200px' },
    { key: 'nit_contribuyente', label: 'NIT', width: '120px' },
    { key: 'nrc_contribuyente', label: 'NRC', width: '100px' },
    { key: 'total', label: 'TOTAL', width: '100px', align: 'right' },
    { key: 'debito_fiscal', label: 'DÉBITO FISCAL', width: '120px', align: 'right' }
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
          <div className="animate-spin h-12 w-12 border-4 border-gray-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando anexo de contribuyentes invalidados...</p>
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
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Anexo de Contribuyentes Invalidadas</h1>
                  <p className="text-gray-600 text-sm">
                    Registro de documentos DTE invalidados para contribuyentes - Control tributario
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

              {/* Resumen con estilo de alerta */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Total Documentos</div>
                    <div className="text-xl font-bold text-red-600">{resumen.cantidadDocumentos || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Total Facturas</div>
                    <div className="text-xl font-bold text-red-700">{resumen.totalFacturas || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Monto Total</div>
                    <div className="text-xl font-bold text-orange-600">{formatCurrency(documentos.reduce((sum, doc) => sum + (doc.total || 0), 0))}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Período</div>
                    <div className="text-sm font-bold text-gray-800">
                      {resumen.rangoFechas?.fechaInicio || formatDate(fechaInicio)} - {resumen.rangoFechas?.fechaFin || formatDate(fechaFin)}
                    </div>
                  </div>
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        placeholder="Resolución, código, contribuyente, NIT..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

              {/* Tabla de Documentos Invalidados */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        {columns.map((column) => (
                          <th 
                            key={column.key}
                            className={`px-3 py-3 text-xs font-medium text-blue-700 uppercase tracking-wider whitespace-nowrap ${
                              column.align === 'right' ? 'text-right' : 
                              column.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                            style={{ width: column.width }}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((doc, index) => (
                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                          {columns.map((column) => (
                            <td 
                              key={column.key}
                              className={`px-3 py-3 text-sm ${
                                column.align === 'right' ? 'text-right' : 
                                column.align === 'center' ? 'text-center' : 'text-left'
                              } ${
                                ['numero_resolucion', 'codigo_generacion', 'numero_serie', 'numero_factura', 'nit_contribuyente', 'nrc_contribuyente'].includes(column.key)
                                  ? 'font-mono text-gray-600 text-xs'
                                  : 'text-gray-700'
                              } whitespace-nowrap`}
                            >
                              {column.key === 'total' || column.key === 'debito_fiscal' ? (
                                formatCurrency(doc[column.key] || 0)
                              ) : column.key === 'tipo_detalle' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                                  {doc[column.key] || '-'}
                                </span>
                              ) : column.key === 'nombre_contribuyente' ? (
                                <div className="flex items-center">
                                  <FaBuilding className="mr-2 text-blue-500 flex-shrink-0" />
                                  <span className="truncate" title={doc[column.key]}>
                                    {doc[column.key] || '-'}
                                  </span>
                                </div>
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
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
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
                    <div className="text-blue-400 mb-3">
                      <FaUserTie className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No se encontraron contribuyentes invalidados
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {documentos.length === 0 
                        ? 'No hay contribuyentes invalidados en el período seleccionado' 
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