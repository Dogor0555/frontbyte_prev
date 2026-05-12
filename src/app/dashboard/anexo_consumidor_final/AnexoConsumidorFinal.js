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
import { API_BASE_URL } from "@/lib/api";

export default function AnexoConsumidorFinalView({ user, hasHaciendaToken, haciendaStatus }) {
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
    totalExportaciones: 0,
    totalZonasFrancas: 0,
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
      fetchDocumentos();
    }
  }, [fechaInicio, fechaFin]);

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/anexo-consumidor-final?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
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
        totalExportaciones: 0,
        totalZonasFrancas: 0,
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
        `${API_BASE_URL}/anexo-consumidor-final-rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
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
    const worksheet = workbook.addWorksheet('Anexo Consumidor Final');

    // Definir columnas con anchos fijos para la mayoría
    worksheet.columns = [
      { header: 'FECHA DE EMISIÓN', key: 'fecha_emision', width: 12 },
      { header: 'CLASE DE DOCUMENTO', key: 'clase_documento' }, // Se expandirá
      { header: 'TIPO DE DOCUMENTO', key: 'tipo_documento', width: 15 },
      { header: 'NÚMERO DE RESOLUCIÓN', key: 'numero_resolucion' }, // Se expandirá
      { header: 'SERIE DEL DOCUMENTO', key: 'serie_documento', width: 15 },
      { header: 'CONTROL INTERNO DEL', key: 'numero_control_interno_del', width: 12 },
      { header: 'CONTROL INTERNO AL', key: 'numero_control_interno_al', width: 12 },
      { header: 'DOCUMENTO DEL', key: 'numero_documento_del' }, // Se expandirá
      { header: 'DOCUMENTO AL', key: 'numero_documento_al' }, // Se expandirá
      { header: 'MÁQUINA REGISTRADORA', key: 'numero_maquina_registradora', width: 12 },
      { header: 'VENTAS EXENTAS', key: 'ventas_exentas', width: 12 },
      { header: 'VENTAS INTERNAS EXENTAS NO SUJETAS', key: 'ventas_internas_exentas_no_sujetas', width: 18 },
      { header: 'VENTAS NO SUJETAS', key: 'ventas_no_sujetas', width: 14 },
      { header: 'VENTAS GRAVADAS LOCALES', key: 'ventas_gravadas_locales', width: 15 },
      { header: 'EXPORTACIONES CENTROAMÉRICA', key: 'exportaciones_centroamerica', width: 18 },
      { header: 'EXPORTACIONES FUERA CENTROAMÉRICA', key: 'exportaciones_fuera_centroamerica', width: 22 },
      { header: 'EXPORTACIONES SERVICIO', key: 'exportaciones_servicio', width: 16 },
      { header: 'VENTAS ZONAS FRANCAS', key: 'ventas_zonas_francas', width: 15 },
      { header: 'VENTAS CUENTA TERCEROS', key: 'ventas_cuenta_terceros', width: 16 },
      { header: 'TOTAL VENTAS', key: 'total_ventas', width: 12 },
      { header: 'TIPO OPERACIÓN', key: 'tipo_operacion', width: 12 },
      { header: 'TIPO INGRESO', key: 'tipo_ingreso', width: 12 },
      { header: 'NÚMERO ANEXO', key: 'numero_anexo', width: 10 }
    ];

    // Estilo para la cabecera - AZUL CLARO con letras BLANCAS
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
        fgColor: { argb: 'FF4472C4' } // Azul claro
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
        numero_control_interno_del: doc.numero_control_interno_del || '',
        numero_control_interno_al: doc.numero_control_interno_al || '',
        numero_documento_del: doc.numero_documento_del || '',
        numero_documento_al: doc.numero_documento_al || '',
        numero_maquina_registradora: doc.numero_maquina_registradora || '',
        ventas_exentas: doc.ventas_exentas || 0,
        ventas_internas_exentas_no_sujetas: doc.ventas_internas_exentas_no_sujetas || 0,
        ventas_no_sujetas: doc.ventas_no_sujetas || 0,
        ventas_gravadas_locales: doc.ventas_gravadas_locales || 0,
        exportaciones_centroamerica: doc.exportaciones_centroamerica || 0,
        exportaciones_fuera_centroamerica: doc.exportaciones_fuera_centroamerica || 0,
        exportaciones_servicio: doc.exportaciones_servicio || 0,
        ventas_zonas_francas: doc.ventas_zonas_francas || 0,
        ventas_cuenta_terceros: doc.ventas_cuenta_terceros || 0,
        total_ventas: doc.total_ventas || 0,
        tipo_operacion: doc.tipo_operacion || '',
        tipo_ingreso: doc.tipo_ingreso || '',
        numero_anexo: doc.numero_anexo || ''
      });

      // Alternar colores de fila
      const isEvenRow = index % 2 === 0;
      const fillColor = isEvenRow ? 'FFD9E1F2' : 'FFFFFFFF';
      
      row.eachCell((cell, colNumber) => {
        // Para la columna 10 (MÁQUINA REGISTRADORA) siempre aplicar estilo, aunque esté vacía
        const isMaquinaRegistradora = colNumber === 10;
        
        // Aplicar estilo si la celda tiene contenido O es la columna de máquina registradora
        if (cell.value !== null && cell.value !== undefined && cell.value !== '' || isMaquinaRegistradora) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillColor }
          };
          
          cell.font = {
            color: { argb: 'FF000000' }, // Texto negro
            size: 9
          };
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };

          // Formato numérico para columnas de valores (columnas 11-20)
          if (colNumber >= 11 && colNumber <= 20) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }

          // Alinear primera columna al centro
          if (colNumber === 1) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }

          // Para la columna de máquina registradora, asegurar que tenga al menos un valor vacío
          if (isMaquinaRegistradora && (cell.value === null || cell.value === undefined || cell.value === '')) {
            cell.value = ''; // Asegurar que tenga un valor vacío para que se aplique el estilo
          }
        }
      });
    });

    // FUNCIÓN PARA CALCULAR ANCHO SOLO PARA COLUMNAS ESPECÍFICAS
    const calculateAutoWidthColumns = () => {
      const columns = worksheet.columns;
      
      // Índices de las columnas que se expandirán (base 0)
      const autoWidthColumns = [1, 3, 7, 8]; // CLASE DOC, RESOLUCIÓN, DOC DEL, DOC AL
      
      autoWidthColumns.forEach(colIndex => {
        let maxLength = 0;
        
        // Revisar todas las filas para esta columna
        worksheet.eachRow((row, rowNumber) => {
          const cell = row.getCell(colIndex + 1); // +1 porque getCell usa base 1
          
          if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
            const cellText = String(cell.value);
            const cellLength = cellText.length;
            
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        });
        
        // Calcular ancho considerando el header también
        const headerText = worksheet.getRow(1).getCell(colIndex + 1).value;
        const headerLength = headerText ? String(headerText).length : 0;
        maxLength = Math.max(maxLength, headerLength);
        
        // Aplicar ancho calculado con límites
        let calculatedWidth = Math.max(
          maxLength * 1.2, // Factor de conversión
          15, // Ancho mínimo
          50  // Ancho máximo
        );
        
        if (columns[colIndex]) {
          columns[colIndex].width = calculatedWidth;
        }
      });
    };

    // Calcular y aplicar anchos automáticos para columnas específicas
    calculateAutoWidthColumns();

    // HOJA DE RESUMEN
    const worksheetResumen = workbook.addWorksheet('Resumen');

    // Datos para el resumen
    const fechaGeneracion = getCurrentDateElSalvador();
    const datosResumen = [
      ['ANEXO DE CONSUMIDOR FINAL - RESUMEN', ''],
      ['', ''],
      ['Fecha de generación:', fechaGeneracion.toLocaleDateString('es-SV')],
      ['Período:', `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`],
      ['', ''],
      ['RESUMEN GENERAL'],
      ['Total Documentos:', resumen.cantidadDocumentos || 0],
      ['Ventas Gravadas:', resumen.totalGravadas || 0],
      ['Ventas Exentas:', resumen.totalExentas || 0],
      ['Ventas No Sujetas:', resumen.totalNoSujetas || 0],
      ['Exportaciones:', resumen.totalExportaciones || 0],
      ['Ventas Zonas Francas:', resumen.totalZonasFrancas || 0],
      ['Total Ventas:', resumen.totalVentas || 0],
      ['', ''],
      ['DESGLOSE DE EXPORTACIONES'],
      ['Exportaciones Centroamérica:', documentos.reduce((sum, doc) => sum + (doc.exportaciones_centroamerica || 0), 0)],
      ['Exportaciones Fuera Centroamérica:', documentos.reduce((sum, doc) => sum + (doc.exportaciones_fuera_centroamerica || 0), 0)],
      ['Exportaciones Servicio:', documentos.reduce((sum, doc) => sum + (doc.exportaciones_servicio || 0), 0)]
    ];

    // Agregar datos al resumen
    datosResumen.forEach((fila, rowIndex) => {
      const row = worksheetResumen.addRow(fila);
      
      row.eachCell((cell, colNumber) => {
        // Solo aplicar estilo si la celda tiene contenido
        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
          
          // Estilo para títulos principales
          if (rowIndex === 0 || rowIndex === 5 || rowIndex === 13) {
            if (colNumber === 1) { // Solo la primera columna del título
              cell.font = { 
                color: { argb: 'FFFFFFFF' }, 
                bold: true,
                size: rowIndex === 0 ? 14 : 12
              };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
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
        if (rowIndex === 0 || rowIndex === 5 || rowIndex === 13) {
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
    link.download = `anexo-consumidor-final-${fechaInicio}-a-${fechaFin}.xlsx`;
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
          doc.text("ANEXO DE CONSUMIDOR FINAL", pageWidth / 2, 15, { align: "center" });
          
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
          doc.text(`Ventas Exentas: ${formatCurrency(resumen.totalExentas)}`, margin + 70, 42);
          doc.text(`Exportaciones: ${formatCurrency(resumen.totalExportaciones)}`, margin + 70, 49);
        }
        
        const tableData = chunk.map(doc => [
          doc.fecha_emision || '-',
          doc.clase_documento || '-',
          doc.tipo_documento || '-',
          doc.numero_resolucion || '-',
          doc.serie_documento || '-',
          doc.numero_control_interno_del || '-',
          doc.numero_control_interno_al || '-',
          doc.numero_documento_del || '-',
          doc.numero_documento_al || '-',
          doc.numero_maquina_registradora || '-',
          formatCurrency(doc.ventas_exentas),
          formatCurrency(doc.ventas_internas_exentas_no_sujetas),
          formatCurrency(doc.ventas_no_sujetas),
          formatCurrency(doc.ventas_gravadas_locales),
          formatCurrency(doc.exportaciones_centroamerica),
          formatCurrency(doc.exportaciones_fuera_centroamerica),
          formatCurrency(doc.exportaciones_servicio),
          formatCurrency(doc.ventas_zonas_francas),
          formatCurrency(doc.ventas_cuenta_terceros),
          formatCurrency(doc.total_ventas),
          doc.tipo_operacion || '-',
          doc.tipo_ingreso || '-',
          doc.numero_anexo || '-'
        ]);
        
        const startY = pageIndex === 0 ? 55 : 20;
        
        autoTable(doc, {
          startY: startY,
          head: pageIndex === 0 ? [
            ['Fecha', 'Clase Doc', 'Tipo Doc', 'Resolución', 'Serie', 'Ctrl Del', 'Ctrl Al', 'Doc Del', 'Doc Al', 'Máquina', 'Exentas', 'Int. Exentas', 'No Sujetas', 'Gravadas', 'Exp. CA', 'Exp. Fuera CA', 'Exp. Serv', 'Z. Francas', 'Cta Terceros', 'Total', 'Operación', 'Ingreso', 'Anexo']
          ] : [],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [75, 85, 99],
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
      
      doc.save(`anexo-consumidor-final-${fechaInicio}-a-${fechaFin}.pdf`);
      
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
          (doc.numero_control_interno_del?.toString() || "").includes(searchTerm) ||
          (doc.numero_resolucion?.toLowerCase() || "").includes(searchLower) ||
          (doc.tipo_documento?.toLowerCase() || "").includes(searchLower) ||
          (doc.clase_documento?.toLowerCase() || "").includes(searchLower) ||
          (doc.numero_documento_del?.toLowerCase() || "").includes(searchLower)
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

  const columns = [
    { key: 'fecha_emision', label: 'FECHA DE EMISIÓN', width: '100px' },
    { key: 'clase_documento', label: 'CLASE DE DOCUMENTO', width: '220px' },
    { key: 'tipo_documento', label: 'TIPO DE DOCUMENTO', width: '130px' },
    { key: 'numero_resolucion', label: 'NÚMERO DE RESOLUCIÓN', width: '200px' },
    { key: 'serie_documento', label: 'SERIE DEL DOCUMENTO', width: '180px' },
    { key: 'numero_control_interno_del', label: 'CONTROL DEL', width: '90px' },
    { key: 'numero_control_interno_al', label: 'CONTROL AL', width: '90px' },
    { key: 'numero_documento_del', label: 'DOCUMENTO DEL', width: '170px' },
    { key: 'numero_documento_al', label: 'DOCUMENTO AL', width: '170px' },
    { key: 'numero_maquina_registradora', label: 'MÁQUINA', width: '100px' },
    { key: 'ventas_exentas', label: 'VENTAS EXENTAS', width: '110px', align: 'right' },
    { key: 'ventas_internas_exentas_no_sujetas', label: 'INT. EXENTAS', width: '120px', align: 'right' },
    { key: 'ventas_no_sujetas', label: 'VENTAS NO SUJETAS', width: '120px', align: 'right' },
    { key: 'ventas_gravadas_locales', label: 'VENTAS GRAVADAS', width: '120px', align: 'right' },
    { key: 'exportaciones_centroamerica', label: 'EXP. CA', width: '90px', align: 'right' },
    { key: 'exportaciones_fuera_centroamerica', label: 'EXP. FUERA CA', width: '110px', align: 'right' },
    { key: 'exportaciones_servicio', label: 'EXP. SERVICIO', width: '100px', align: 'right' },
    { key: 'ventas_zonas_francas', label: 'ZONAS FRANCAS', width: '110px', align: 'right' },
    { key: 'ventas_cuenta_terceros', label: 'CTA TERCEROS', width: '110px', align: 'right' },
    { key: 'total_ventas', label: 'TOTAL VENTAS', width: '110px', align: 'right' },
    { key: 'tipo_operacion', label: 'TIPO OPERACIÓN', width: '120px' },
    { key: 'tipo_ingreso', label: 'TIPO INGRESO', width: '150px' },
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
          <div className="animate-spin h-12 w-12 border-4 border-gray-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando anexo de consumidor final...</p>
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
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Anexo de Consumidor Final</h1>
                  <p className="text-gray-600 text-sm">
                    Registro detallado de ventas a consumidores finales - Vista completa
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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
                        placeholder="Serie, control, resolución, documento..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
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

              {/* Tabla de Documentos - VISTA COMPLETA SIEMPRE */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map((column) => (
                          <th 
                            key={column.key}
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            style={{ width: column.width }}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((doc, index) => (
                        <tr key={doc.id || index} className="hover:bg-gray-50 transition-colors">
                          {columns.map((column) => (
                            <td 
                              key={column.key}
                              className={`px-3 py-3 text-sm ${
                                column.align === 'right' ? 'text-right' : 'text-left'
                              } ${
                                ['serie_documento', 'numero_resolucion', 'numero_documento_del', 'numero_documento_al'].includes(column.key)
                                  ? 'font-mono text-gray-600 text-xs'
                                  : 'text-gray-700'
                              } whitespace-nowrap`}
                            >
                              {column.key.includes('ventas') || column.key.includes('exportaciones') || column.key === 'total_ventas' ? (
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