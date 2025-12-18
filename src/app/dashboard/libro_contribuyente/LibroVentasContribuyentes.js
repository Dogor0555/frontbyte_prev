"use client";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";
import { FaSearch, FaFileAlt, FaCalendarAlt, FaDownload, FaFilter, FaChartLine, FaFileExcel, FaPrint, FaSync, FaFilePdf, FaFileExport } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';

export default function LibroVentasContribuyentesView({ user, hasHaciendaToken, haciendaStatus }) {
  const [isMobile, setIsMobile] = useState(false);
  const [libro, setLibro] = useState([]);
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
    totalVentasExentas: 0,
    totalVentasGravadas: 0,
    totalDebitoFiscal: 0,
    totalVentasExentasTerceros: 0,
    totalVentasGravadasTerceros: 0,
    totalDebitoFiscalTerceros: 0,
    totalIvaPercibido: 0,
    totalGeneral: 0,
    cantidadDocumentos: 0
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
      fetchLibro();
    }
  }, [fechaInicio, fechaFin]);

  const fetchLibro = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/libro-contribuyentes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
          credentials: "include"
        }
      );
      
      if (!response.ok) throw new Error("Error al cargar libro de ventas a contribuyentes");
      const data = await response.json();
      
      setLibro(Array.isArray(data.libro) ? data.libro : []);
      setResumen(data.resumen || {
        totalVentasExentas: 0,
        totalVentasGravadas: 0,
        totalDebitoFiscal: 0,
        totalVentasExentasTerceros: 0,
        totalVentasGravadasTerceros: 0,
        totalDebitoFiscalTerceros: 0,
        totalIvaPercibido: 0,
        totalGeneral: 0,
        cantidadDocumentos: 0
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar el libro de ventas a contribuyentes: " + error.message);
      setLibro([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      let datosParaExportar = libro;
      
      if (datosParaExportar.length === 0) {
        const response = await fetch(
          `${API_BASE_URL}/libro-contribuyentes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
          {
            credentials: "include"
          }
        );
        
        if (!response.ok) throw new Error("Error al cargar datos para exportar");
        const data = await response.json();
        datosParaExportar = Array.isArray(data.libro) ? data.libro : [];
      }

      if (datosParaExportar.length === 0) {
        alert("No hay datos para exportar en el período seleccionado");
        return;
      }

      const workbook = new ExcelJS.Workbook();

      const worksheet = workbook.addWorksheet('Libro Ventas Contribuyentes');
      worksheet.columns = [
        { header: 'N°', key: 'numero', width: 8 },
        { header: 'FECHA DE EMISIÓN DEL DOCUMENTO', key: 'fecha_emision', width: 15 },
        { header: 'NÚMERO DE CORRELATIVO PREEIMPRESO', key: 'numero_correlativo', width: 20 },
        { header: 'NÚMERO DE CONTROL INTERNO SISTEMA FORMULARIO ÚNICO', key: 'numero_control_interno', width: 25 },
        { header: 'NOMBRE DEL CLIENTE MANDANTE O MANDATARIO', key: 'nombre_cliente', width: 30 },
        { header: 'NRC DEL CLIENTE', key: 'nrc_cliente', width: 15 },
        { header: 'VENTAS EXENTAS', key: 'ventas_exentas', width: 14 },
        { header: 'VENTAS INTERNAS GRAVADAS', key: 'ventas_internas_gravadas', width: 18 },
        { header: 'DÉBITO FISCAL', key: 'debito_fiscal', width: 14 },
        { header: 'VENTAS EXENTAS A CUENTA DE TERCEROS', key: 'ventas_exentas_terceros', width: 22 },
        { header: 'VENTAS INTERNAS GRAVADAS A CUENTA DE TERCEROS', key: 'ventas_gravadas_terceros', width: 28 },
        { header: 'DEBITO FISCAL POR CUENTA DE TERCEROS', key: 'debito_fiscal_terceros', width: 25 },
        { header: 'IVA PERCIBIDO', key: 'iva_percibido', width: 14 },
        { header: 'TOTAL', key: 'total', width: 14 }
      ];

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
          fgColor: { argb: 'FF70AD47' } 
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
      headerRow.height = 30;

      datosParaExportar.forEach((doc, index) => {
        const row = worksheet.addRow({
          numero: doc.numero || index + 1,
          fecha_emision: doc.fecha_emision || '',
          numero_correlativo: doc.numero_correlativo || '',
          numero_control_interno: doc.numero_control_interno || '',
          nombre_cliente: doc.nombre_cliente || '',
          nrc_cliente: doc.nrc_cliente || '',
          ventas_exentas: doc.ventas_exentas || 0,
          ventas_internas_gravadas: doc.ventas_internas_gravadas || 0,
          debito_fiscal: doc.debito_fiscal || 0,
          ventas_exentas_terceros: doc.ventas_exentas_terceros || 0,
          ventas_gravadas_terceros: doc.ventas_gravadas_terceros || 0,
          debito_fiscal_terceros: doc.debito_fiscal_terceros || 0,
          iva_percibido: doc.iva_percibido || 0,
          total: doc.total || 0
        });

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

            if (colNumber >= 7 && colNumber <= 14) {
              cell.numFmt = '#,##0.00';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            if (colNumber === 1) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
          }
        });
      });

      const worksheetResumen = workbook.addWorksheet('Resumen');

      const fechaGeneracion = getCurrentDateElSalvador();
      const datosResumen = [
        ['LIBRO DE VENTAS A CONTRIBUYENTES - RESUMEN', ''],
        ['', ''],
        ['Fecha de generación:', fechaGeneracion.toLocaleDateString('es-SV')],
        ['Período:', `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`],
        ['', ''],
        ['RESUMEN GENERAL'],
        ['Total Documentos:', resumen.cantidadDocumentos || 0],
        ['Ventas Exentas:', resumen.totalVentasExentas || 0],
        ['Ventas Internas Gravadas:', resumen.totalVentasGravadas || 0],
        ['Débito Fiscal:', resumen.totalDebitoFiscal || 0],
        ['Ventas Exentas Terceros:', resumen.totalVentasExentasTerceros || 0],
        ['Ventas Gravadas Terceros:', resumen.totalVentasGravadasTerceros || 0],
        ['Débito Fiscal Terceros:', resumen.totalDebitoFiscalTerceros || 0],
        ['IVA Percibido:', resumen.totalIvaPercibido || 0],
        ['Total General:', resumen.totalGeneral || 0],
        ['', ''],
        ['TOTALES GENERALES', ''],
        ['Ventas Exentas:', totales.ventasExentas],
        ['Ventas Internas Gravadas:', totales.ventasInternasGravadas],
        ['Débito Fiscal:', totales.debitoFiscal],
        ['Ventas Exentas Terceros:', totales.ventasExentasTerceros],
        ['Ventas Gravadas Terceros:', totales.ventasGravadasTerceros],
        ['Débito Fiscal Terceros:', totales.debitoFiscalTerceros],
        ['IVA Percibido:', totales.ivaPercibido],
        ['Total General:', totales.totalGeneral]
      ];

      datosResumen.forEach((fila, rowIndex) => {
        const row = worksheetResumen.addRow(fila);
        
        row.eachCell((cell, colNumber) => {
          if (cell.value !== null && cell.value !== undefined && cell.value !== '') {

            if (rowIndex === 0 || rowIndex === 5 || rowIndex === 16) {
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
            if (colNumber === 2 && typeof cell.value === 'number') {
              cell.numFmt = '#,##0.00';
              cell.alignment = { horizontal: 'right' };
            }

            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          }
        });

        if (fila.some(cell => cell !== null && cell !== undefined && cell !== '')) {
          if (rowIndex === 0 || rowIndex === 5 || rowIndex === 16) {
            row.height = 25;
          }
        }
      });

      worksheetResumen.columns = [
        { width: 35 },
        { width: 20 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `libro-ventas-contribuyentes-${fechaInicio}-a-${fechaFin}.xlsx`;
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
      const rowsPerPage = 12;
      const chunks = [];
      for (let i = 0; i < libroFiltrado.length; i += rowsPerPage) {
        chunks.push(libroFiltrado.slice(i, i + rowsPerPage));
      }
      
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 8;
      
      const fechaGeneracion = getCurrentDateElSalvador();
      
      chunks.forEach((chunk, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage();
        }
        
        if (pageIndex === 0) {
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text("LIBRO DE VENTAS A CONTRIBUYENTES", pageWidth / 2, 15, { align: "center" });
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, margin, 25);
          doc.text(`Generado: ${formatDate(fechaGeneracion.toISOString().split('T')[0])}`, pageWidth - margin, 25, { align: "right" });
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("RESUMEN", margin, 35);
          
          doc.setFont("helvetica", "normal");
          doc.text(`Total Documentos: ${resumen.cantidadDocumentos}`, margin, 42);
          doc.text(`Ventas Exentas: ${formatCurrency(resumen.totalVentasExentas)}`, margin, 49);
          doc.text(`Ventas Gravadas: ${formatCurrency(resumen.totalVentasGravadas)}`, margin + 70, 42);
          doc.text(`Total General: ${formatCurrency(resumen.totalGeneral)}`, margin + 70, 49);
        }
        
        const tableData = chunk.map(doc => [
          doc.numero || '-',
          doc.fecha_emision || '-',
          doc.numero_correlativo || '-',
          doc.numero_control_interno || '-',
          doc.nombre_cliente || '-',
          doc.nrc_cliente || '-',
          formatCurrency(doc.ventas_exentas),
          formatCurrency(doc.ventas_internas_gravadas),
          formatCurrency(doc.debito_fiscal),
          formatCurrency(doc.ventas_exentas_terceros),
          formatCurrency(doc.ventas_gravadas_terceros),
          formatCurrency(doc.debito_fiscal_terceros),
          formatCurrency(doc.iva_percibido),
          formatCurrency(doc.total)
        ]);
        
        const startY = pageIndex === 0 ? 55 : 20;
        
        autoTable(doc, {
          startY: startY,
          head: pageIndex === 0 ? [
            ['N°', 'FECHA', 'CORRELATIVO', 'CONTROL INTERNO', 'CLIENTE', 'NRC', 'EXENTAS', 'GRAVADAS', 'DÉBITO FISCAL', 'EXENTAS TERCEROS', 'GRAVADAS TERCEROS', 'DÉBITO TERCEROS', 'IVA PERCIBIDO', 'TOTAL']
          ] : [],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [112, 173, 71], // Verde
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 4
          },
          styles: {
            fontSize: 3,
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
      
      doc.save(`libro-ventas-contribuyentes-${fechaInicio}-a-${fechaFin}.pdf`);
      
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLibro();
  };

  const libroFiltrado = Array.isArray(libro)
    ? libro.filter((doc) => {
        if (!doc) return false;
        const searchLower = searchTerm.toLowerCase();

        return (
          (doc.numero_correlativo?.toLowerCase() || "").includes(searchLower) ||
          (doc.numero_control_interno?.toString() || "").includes(searchTerm) ||
          (doc.nombre_cliente?.toLowerCase() || "").includes(searchLower) ||
          (doc.nrc_cliente?.toLowerCase() || "").includes(searchLower) ||
          (doc.fecha_emision?.toString() || "").includes(searchTerm)
        );
      })
    : [];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = libroFiltrado.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(libroFiltrado.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount || 0);
  
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        const fecha = new Date(dateString + 'T06:00:00');
        return fecha.toLocaleDateString('es-SV', {
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

  // Columnas específicas para Libro de Ventas Contribuyentes
  const columns = [
    { key: 'numero', label: 'N°', width: '60px', align: 'center' },
    { key: 'fecha_emision', label: 'FECHA DE EMISIÓN', width: '110px' },
    { key: 'numero_correlativo', label: 'CORRELATIVO PREEIMPRESO', width: '150px' },
    { key: 'numero_control_interno', label: 'CONTROL INTERNO', width: '140px' },
    { key: 'nombre_cliente', label: 'CLIENTE', width: '200px' },
    { key: 'nrc_cliente', label: 'NRC CLIENTE', width: '100px' },
    { key: 'ventas_exentas', label: 'VENTAS EXENTAS', width: '110px', align: 'right' },
    { key: 'ventas_internas_gravadas', label: 'VENTAS GRAVADAS', width: '120px', align: 'right' },
    { key: 'debito_fiscal', label: 'DÉBITO FISCAL', width: '110px', align: 'right' },
    { key: 'ventas_exentas_terceros', label: 'EXENTAS TERCEROS', width: '130px', align: 'right' },
    { key: 'ventas_gravadas_terceros', label: 'GRAVADAS TERCEROS', width: '130px', align: 'right' },
    { key: 'debito_fiscal_terceros', label: 'DÉBITO TERCEROS', width: '120px', align: 'right' },
    { key: 'iva_percibido', label: 'IVA PERCIBIDO', width: '110px', align: 'right' },
    { key: 'total', label: 'TOTAL', width: '110px', align: 'right' }
  ];

  const getTotales = () => {
    return libroFiltrado.reduce((acc, doc) => ({
      ventasExentas: acc.ventasExentas + (doc.ventas_exentas || 0),
      ventasInternasGravadas: acc.ventasInternasGravadas + (doc.ventas_internas_gravadas || 0),
      debitoFiscal: acc.debitoFiscal + (doc.debito_fiscal || 0),
      ventasExentasTerceros: acc.ventasExentasTerceros + (doc.ventas_exentas_terceros || 0),
      ventasGravadasTerceros: acc.ventasGravadasTerceros + (doc.ventas_gravadas_terceros || 0),
      debitoFiscalTerceros: acc.debitoFiscalTerceros + (doc.debito_fiscal_terceros || 0),
      ivaPercibido: acc.ivaPercibido + (doc.iva_percibido || 0),
      totalGeneral: acc.totalGeneral + (doc.total || 0)
    }), {
      ventasExentas: 0,
      ventasInternasGravadas: 0,
      debitoFiscal: 0,
      ventasExentasTerceros: 0,
      ventasGravadasTerceros: 0,
      debitoFiscalTerceros: 0,
      ivaPercibido: 0,
      totalGeneral: 0
    });
  };

  const totales = getTotales();
  
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
          <p className="text-gray-600 font-medium">Cargando libro de ventas a contribuyentes...</p>
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        ></div>
      )}

      <div className="flex-1 flex flex-col min-w-0">  
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <Navbar 
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-full mx-auto">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Libro de Ventas a Contribuyentes</h1>
                  <p className="text-gray-600 text-sm">
                    Registro detallado de ventas a contribuyentes según formato oficial
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

              <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Total Documentos</div>
                    <div className="text-xl font-bold text-gray-800">{resumen.cantidadDocumentos || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Ventas Exentas</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totales.ventasExentas)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Ventas Gravadas</div>
                    <div className="text-xl font-bold text-blue-600">{formatCurrency(totales.ventasInternasGravadas)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Débito Fiscal</div>
                    <div className="text-xl font-bold text-purple-600">{formatCurrency(totales.debitoFiscal)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Total General</div>
                    <div className="text-xl font-bold text-gray-800">{formatCurrency(totales.totalGeneral)}</div>
                  </div>
                </div>
              </div>

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
                      Buscar
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Correlativo, control, cliente, NRC..."
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

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-green-50">
                      <tr>
                        {columns.map((column) => (
                          <th 
                            key={column.key}
                            className={`px-3 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap ${
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
                        <tr key={doc.id || index} className="hover:bg-green-50 transition-colors">
                          {columns.map((column) => (
                            <td 
                              key={column.key}
                              className={`px-3 py-3 text-sm ${
                                column.align === 'right' ? 'text-right' : 
                                column.align === 'center' ? 'text-center' : 'text-left'
                              } ${
                                ['numero_correlativo', 'numero_control_interno', 'nrc_cliente'].includes(column.key)
                                  ? 'font-mono text-gray-600 text-xs'
                                  : 'text-gray-700'
                              } whitespace-nowrap`}
                            >
                              {column.key.includes('ventas') || column.key.includes('debito') || column.key.includes('iva') || column.key === 'total' ? (
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

                {libroFiltrado.length > itemsPerPage && (
                  <div className="px-4 py-3 bg-green-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, libroFiltrado.length)} de {libroFiltrado.length} registros
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

                {libroFiltrado.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-3">
                      <FaFileAlt className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No se encontraron registros
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {libro.length === 0 
                        ? 'No hay ventas a contribuyentes registradas en el período seleccionado' 
                        : 'No se encontraron coincidencias con los filtros aplicados'}
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