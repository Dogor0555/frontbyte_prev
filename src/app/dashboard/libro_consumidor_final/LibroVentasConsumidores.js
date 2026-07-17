//src/app/dashboard/libro_consumidor_final/LibroVentasConsumidores.js

"use client";
import { useState, useEffect, useRef } from "react";
import { FaSearch, FaFileAlt, FaCalendarAlt, FaFilter, FaFileExcel, FaSync, FaFilePdf } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import ExportarLibroConsumidor from "../realizar_compra/components/ExportarLibroConsumidor";

export default function LibroVentasConsumidoresView({ user, hasHaciendaToken, haciendaStatus }) {
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
    totalExportaciones: 0,
    totalVentasPropias: 0,
    totalVentasTerceros: 0,
    diasConVentas: 0
  });
  
  const itemsPerPage = 10;
  const router = useRouter();
  const tableRef = useRef();

  const [nombreContador, setNombreContador] = useState("");

  // Función para obtener la fecha actual en hora de El Salvador (UTC-6)
  const getCurrentDateElSalvador = () => {
    const ahora = new Date();
    const offsetElSalvador = -6;
    const horaElSalvador = new Date(ahora.getTime() + (offsetElSalvador * 60 * 60 * 1000));
    return horaElSalvador;
  };

  const fetchNombreContador = async () => {
    try {
      if (user && user.nombre_contador) {
        setNombreContador(user.nombre_contador);
        return;
      }
      if (user && user.nombre) {
        setNombreContador(user.nombre);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/usuario/datos-contador`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
          console.log(data);
        setNombreContador(data.nombre_contador || data.nombre_usuario || "CONTADOR SIN REGISTRAR");
      } else {
        setNombreContador("CONTADOR SIN REGISTRAR");
      }
    } catch (error) {
      console.error("Error:", error);
      setNombreContador("CONTADOR SIN REGISTRAR");
    }
  };

useEffect(() => {
  const hoy = getCurrentDateElSalvador();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  setFechaInicio(primerDiaMes.toISOString().split("T")[0]);
  setFechaFin(hoy.toISOString().split("T")[0]);

  if (user) {
    fetchNombreContador();
  }
}, [user]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchLibro();
    }
  }, [fechaInicio, fechaFin]);

  const fetchLibro = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/libro-ventas-consumidores-rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
          credentials: "include"
        }
      );
      
      if (!response.ok) throw new Error("Error al cargar libro de ventas");
      const data = await response.json();
      
      setLibro(Array.isArray(data.libro) ? data.libro : []);
      setResumen(data.resumen || {
        totalVentasExentas: 0,
        totalVentasGravadas: 0,
        totalExportaciones: 0,
        totalVentasPropias: 0,
        totalVentasTerceros: 0,
        diasConVentas: 0
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar el libro de ventas: " + error.message);
      setLibro([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

const handleExportExcel = async () => {
  setExporting(true);

  try {
    const { default: ExcelJS } = await import('exceljs');

    // =========================================
    // OBTENER NOMBRE CONTADOR
    // =========================================
    let contadorNombre = "";

    try {

      const response = await fetch(
        `${API_BASE_URL}/usuario/datos-contador`,
        {
          credentials: "include"
        }
      );

      if (response.ok) {

        const data = await response.json();

        console.log(
          "RESPUESTA CONTADOR:",
          data
        );

        contadorNombre =
          data?.nombre_contador ||
          data?.nombre_usuario ||
          data?.nombre ||
          "";

      }

    } catch (error) {

      console.error(
        "Error obteniendo contador:",
        error
      );
    }

    // FALLBACK
    if (!contadorNombre) {

      contadorNombre =
        nombreContador ||
        user?.nombre_contador ||
        user?.nombre ||
        "CONTADOR SIN REGISTRAR";
    }

    console.log(
      "NOMBRE FINAL:",
      contadorNombre
    );

    // =========================================
    // DATOS EXPORTAR
    // =========================================
    let datosParaExportar = libro;

    if (datosParaExportar.length === 0) {

      const response = await fetch(
        `${API_BASE_URL}/libro-ventas-consumidores-rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
          credentials: "include"
        }
      );

      if (!response.ok) {

        throw new Error(
          "Error al cargar datos para exportar"
        );
      }

      const data = await response.json();

      datosParaExportar = Array.isArray(
        data.libro
      )
        ? data.libro
        : [];
    }

    if (datosParaExportar.length === 0) {

      alert(
        "No hay datos para exportar en el período seleccionado"
      );

      return;
    }

    // =========================================
    // WORKBOOK
    // =========================================
    const workbook =
      new ExcelJS.Workbook();

    const worksheet =
      workbook.addWorksheet(
        "Libro Ventas Consumidor Final",
        {
          pageSetup: {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0
          }
        }
      );

    // =========================================
    // COLUMNAS
    // =========================================
    worksheet.columns = [
      { key: "fecha", width: 14 },
      { key: "doc_del", width: 20 },
      { key: "doc_al", width: 20 },
      { key: "caja", width: 18 },
      { key: "exentas", width: 16 },
      { key: "gravadas", width: 18 },
      { key: "exportaciones", width: 16 },
      { key: "propias", width: 22 },
      { key: "terceros", width: 20 }
    ];

    // =========================================
    // TITULO CONTADOR
    // =========================================
    worksheet.mergeCells("A1:I1");

    worksheet.getCell("A1").value =
      contadorNombre;

    worksheet.getCell("A1").font = {
      name: "Times New Roman",
      size: 20,
      bold: false
    };

    worksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle"
    };

    // =========================================
    // SUBTITULO
    // =========================================
    worksheet.mergeCells("A2:I2");

    worksheet.getCell("A2").value =
      "LIBRO DE VENTAS A CONSUMIDOR FINAL";

    worksheet.getCell("A2").font = {
      name: "Times New Roman",
      size: 18,
      bold: false
    };

    worksheet.getCell("A2").alignment = {
      horizontal: "center",
      vertical: "middle"
    };

    // =========================================
    // AÑO / MES / NRC / NIT
    // =========================================
    const meses = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE"
    ];

    worksheet.getCell("A4").value =
      "AÑO:";

    worksheet.getCell("B4").value =
      new Date(fechaInicio)
        .getFullYear();

    worksheet.getCell("A5").value =
      "MES:";

    worksheet.getCell("B5").value =
      meses[
        new Date(fechaInicio)
          .getMonth()
      ];

    worksheet.getCell("G4").value =
      "N.R.C.:";

    worksheet.getCell("H4").value =
      "384823-0";

    worksheet.getCell("G5").value =
      "N.I.T.:";

    worksheet.getCell("H5").value =
      "0309-070976-101-3";

    ["A4", "A5", "G4", "G5"].forEach(
      (cell) => {

        worksheet.getCell(cell).font = {
          bold: true,
          size: 12
        };
      }
    );

    ["B4", "B5", "H4", "H5"].forEach(
      (cell) => {

        worksheet.getCell(cell).font = {
          size: 12
        };
      }
    );

    // =========================================
    // ENCABEZADOS
    // =========================================
    const headers = [
      "FECHA",
      "DOCUMENTO EMITIDO DEL",
      "DOCUMENTO EMITIDO AL",
      "CAJA SISTEMA",
      "VENTAS EXENTAS",
      "VENTAS GRAVADAS",
      "EXPORTACIONES",
      "TOTAL VENTAS PROPIAS",
      "VENTAS DE TERCEROS"
    ];

    headers.forEach(
      (header, index) => {

        const cell =
          worksheet.getCell(
            7,
            index + 1
          );

        cell.value = header;

        cell.font = {
          bold: true,
          size: 10
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true
        };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      }
    );

    worksheet.getRow(7).height = 35;

    // =========================================
    // DATOS
    // =========================================
    datosParaExportar.forEach(
      (dia) => {

        const row =
          worksheet.addRow({
            fecha: dia.dia || "",
            doc_del:
              dia.documento_emitido_del || "",
            doc_al:
              dia.documento_emitido_al || "",
            caja:
              dia.numero_caja_sistema || "",
            exentas:
              dia.ventas_exentas || 0,
            gravadas:
              dia.ventas_internas_gravadas || 0,
            exportaciones:
              dia.exportaciones || 0,
            propias:
              dia.total_ventas_diarias_propias || 0,
            terceros:
              dia.ventas_cuenta_terceros || 0
          });

        row.eachCell(
          (cell, colNumber) => {

            cell.font = {
              size: 10
            };

            cell.border = {
              top: {
                style: "thin"
              },
              left: {
                style: "thin"
              },
              bottom: {
                style: "thin"
              },
              right: {
                style: "thin"
              }
            };

            cell.alignment = {
              vertical: "middle"
            };

            if (
              colNumber >= 5 &&
              colNumber <= 9
            ) {

              cell.numFmt =
                "#,##0.00";

              cell.alignment = {
                horizontal: "right",
                vertical: "middle"
              };
            }

            if (colNumber === 1) {

              cell.alignment = {
                horizontal: "center",
                vertical: "middle"
              };
            }
          }
        );
      }
    );

    // =========================================
    // TOTALES
    // =========================================
    const totales = getTotales();

    const totalRow =
      worksheet.addRow({
        caja: "TOTALES",
        exentas:
          totales.ventasExentas || 0,
        gravadas:
          totales.ventasGravadas || 0,
        exportaciones:
          totales.exportaciones || 0,
        propias:
          totales.totalVentas || 0,
        terceros:
          totales.ventasTerceros || 0
      });

    totalRow.eachCell(
      (cell, colNumber) => {

        cell.font = {
          bold: true,
          size: 10
        };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };

        if (
          colNumber >= 5 &&
          colNumber <= 9
        ) {
          cell.numFmt =
            "#,##0.00";
        }
      }
    );

    // =========================================
    // RESUMEN
    // =========================================
    const resumenRowStart =
      worksheet.lastRow.number + 3;

    worksheet.mergeCells(
      `G${resumenRowStart}:I${resumenRowStart}`
    );

    const resumenTitle =
      worksheet.getCell(
        `G${resumenRowStart}`
      );

    resumenTitle.value =
      "RESUMEN DE VENTAS";

    resumenTitle.font = {
      bold: true,
      size: 12
    };

    resumenTitle.alignment = {
      horizontal: "center",
      vertical: "middle"
    };

    resumenTitle.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };

    const resumenVentas = [
      [
        "VENTAS NETAS (GRAVADAS)",
        totales.ventasGravadas || 0
      ],
      [
        "IVA DEBITO FISCAL",
        (totales.ventasGravadas || 0) *
          0.13
      ],
      [
        "VENTAS TOTALES",
        totales.totalVentas || 0
      ]
    ];

    resumenVentas.forEach(
      (item, index) => {

        const rowNumber =
          resumenRowStart +
          index +
          1;

        worksheet.getCell(
          `G${rowNumber}`
        ).value = item[0];

        worksheet.getCell(
          `H${rowNumber}`
        ).value = "$";

        worksheet.getCell(
          `I${rowNumber}`
        ).value = item[1];

        worksheet.getCell(
          `I${rowNumber}`
        ).numFmt =
          "#,##0.00";

        ["G", "H", "I"].forEach(
          (col) => {

            const cell =
              worksheet.getCell(
                `${col}${rowNumber}`
              );

            cell.border = {
              top: {
                style: "thin"
              },
              left: {
                style: "thin"
              },
              bottom: {
                style: "thin"
              },
              right: {
                style: "thin"
              }
            };

            cell.font = {
              bold:
                index === 2,
              size: 11
            };

            cell.alignment = {
              vertical:
                "middle",
              horizontal:
                col === "H"
                  ? "center"
                  : "right"
            };
          }
        );
      }
    );

    // =========================================
    // FIRMA CONTADOR
    // =========================================
    const firmaRow =
      resumenRowStart + 6;

    worksheet.mergeCells(
      `A${firmaRow}:C${firmaRow}`
    );

    worksheet.getCell(
      `A${firmaRow}`
    ).value =
      "__________________________________";

    worksheet.getCell(
      `A${firmaRow}`
    ).alignment = {
      horizontal: "center"
    };

    worksheet.getCell(
      `A${firmaRow}`
    ).font = {
      size: 10
    };

    // NOMBRE
    worksheet.mergeCells(
      `A${firmaRow + 1}:C${firmaRow + 1}`
    );

    worksheet.getCell(
      `A${firmaRow + 1}`
    ).value =
      contadorNombre;

    worksheet.getCell(
      `A${firmaRow + 1}`
    ).font = {
      bold: true,
      size: 10,
      name: "Times New Roman"
    };

    worksheet.getCell(
      `A${firmaRow + 1}`
    ).alignment = {
      horizontal: "center"
    };

    // CARGO
    worksheet.mergeCells(
      `A${firmaRow + 2}:C${firmaRow + 2}`
    );

    worksheet.getCell(
      `A${firmaRow + 2}`
    ).value = "CONTADOR";

    worksheet.getCell(
      `A${firmaRow + 2}`
    ).font = {
      bold: true,
      size: 10,
      name: "Times New Roman"
    };

    worksheet.getCell(
      `A${firmaRow + 2}`
    ).alignment = {
      horizontal: "center"
    };

    // =========================================
    // EXPORTAR
    // =========================================
    const buffer =
      await workbook.xlsx.writeBuffer();

    const blob = new Blob(
      [buffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `libro-ventas-consumidores-${fechaInicio}-a-${fechaFin}.xlsx`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);

  } catch (error) {

    console.error(
      "Error al exportar Excel:",
      error
    );

    alert(
      "Error al exportar Excel: " +
      error.message
    );

  } finally {

    setExporting(false);
  }
};

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const contadorNombre = nombreContador || (user?.nombre_contador) || (user?.nombre) || "CONTADOR SIN REGISTRAR";
      const rowsPerPage = 15;
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
          doc.text("LIBRO DE VENTAS A CONSUMIDORES", pageWidth / 2, 15, { align: "center" });
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, margin, 25);
          doc.text(`Generado: ${formatDate(fechaGeneracion.toISOString().split('T')[0])}`, pageWidth - margin, 25, { align: "right" });
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("RESUMEN", margin, 35);
          
          doc.setFont("helvetica", "normal");
          doc.text(`Días con ventas: ${resumen.diasConVentas}`, margin, 42);
          doc.text(`Ventas Exentas: ${formatCurrency(resumen.totalVentasExentas)}`, margin, 49);
          doc.text(`Ventas Gravadas: ${formatCurrency(resumen.totalVentasGravadas)}`, margin + 70, 42);
          doc.text(`Total Ventas: ${formatCurrency(resumen.totalVentasPropias)}`, margin + 70, 49);
          
          doc.setFontSize(8);
          doc.text(`Contador: ${contadorNombre}`, margin, 56);
        }
        
        const tableData = chunk.map(dia => [
          dia.dia || '-',
          dia.documento_emitido_del || '-',
          dia.documento_emitido_al || '-',
          dia.numero_caja_sistema || '-',
          formatCurrency(dia.ventas_exentas),
          formatCurrency(dia.ventas_internas_gravadas),
          formatCurrency(dia.exportaciones),
          formatCurrency(dia.total_ventas_diarias_propias),
          formatCurrency(dia.ventas_cuenta_terceros)
        ]);
        
        const startY = pageIndex === 0 ? 62 : 20;
        
        autoTable(doc, {
          startY: startY,
          head: pageIndex === 0 ? [
            ['Día', 'Doc. Del', 'Doc. Al', 'Caja Sistema', 'Ventas Exentas', 'Ventas Gravadas', 'Exportaciones', 'Total Ventas', 'Ventas Terceros']
          ] : [],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [75, 85, 99],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 6
          },
          styles: {
            fontSize: 5,
            cellPadding: 1,
            valign: 'middle'
          },
          margin: { left: margin, right: margin }
        });
        
        // Agregar firma al final de la última página
        if (pageIndex === chunks.length - 1) {
          const finalY = doc.lastAutoTable.finalY + 10;
          doc.setFontSize(8);
          doc.text("__________________________________", pageWidth / 2, finalY, { align: "center" });
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(contadorNombre, pageWidth / 2, finalY + 6, { align: "center" });
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text("CONTADOR", pageWidth / 2, finalY + 12, { align: "center" });
        }
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Página ${pageIndex + 1} de ${chunks.length}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      });
      
      doc.save(`libro-ventas-consumidores-${fechaInicio}-a-${fechaFin}.pdf`);
      
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setExportingPDF(false);
    }
  };

  const formatearFechaISO = (fecha) => {
    if (!fecha) return "";
    if (fecha.includes("-")) return fecha;
    const partes = fecha.split("/");
    if (partes.length !== 3) return "";
    const [mes, dia, anio] = partes;
    return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  };

  const descargarCSV = async () => {
    try {
      if (!fechaInicio || !fechaFin) {
        return alert("Debes seleccionar un rango de fechas");
      }

      const params = new URLSearchParams({
        fechaInicio: formatearFechaISO(fechaInicio),
        fechaFin: formatearFechaISO(fechaFin),
      });

      const res = await fetch(`${API_BASE_URL}/consumidor-final-csv?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Respuesta del servidor:", text);
        throw new Error("Error al descargar CSV");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Libro_Ventas_Consumidores_${fechaInicio}_${fechaFin}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Error al descargar CSV");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLibro();
  };

  const libroFiltrado = Array.isArray(libro)
    ? libro.filter((dia) => {
        if (!dia) return false;
        const searchLower = searchTerm.toLowerCase();
        return (
          (dia.documento_emitido_del?.toLowerCase() || "").includes(searchLower) ||
          (dia.documento_emitido_al?.toLowerCase() || "").includes(searchLower) ||
          (dia.numero_caja_sistema?.toLowerCase() || "").includes(searchLower) ||
          (dia.dia?.toString() || "").includes(searchTerm)
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

  const columns = [
    { key: 'dia', label: 'FECHA', width: '100px' },
    { key: 'documento_emitido_del', label: 'DOC. EMITIDO DEL', width: '180px' },
    { key: 'documento_emitido_al', label: 'DOC. EMITIDO AL', width: '180px' },
    { key: 'numero_caja_sistema', label: 'CAJA SISTEMA', width: '120px' },
    { key: 'ventas_exentas', label: 'VENTAS EXENTAS', width: '120px', align: 'right' },
    { key: 'ventas_internas_gravadas', label: 'VENTAS GRAVADAS', width: '120px', align: 'right' },
    { key: 'exportaciones', label: 'EXPORTACIONES', width: '100px', align: 'right' },
    { key: 'total_ventas_diarias_propias', label: 'TOTAL VENTAS', width: '120px', align: 'right' },
    { key: 'ventas_cuenta_terceros', label: 'VENTAS TERCEROS', width: '120px', align: 'right' }
  ];

  const getTotales = () => {
    return libroFiltrado.reduce((acc, dia) => ({
      ventasExentas: acc.ventasExentas + (dia.ventas_exentas || 0),
      ventasGravadas: acc.ventasGravadas + (dia.ventas_internas_gravadas || 0),
      exportaciones: acc.exportaciones + (dia.exportaciones || 0),
      totalVentas: acc.totalVentas + (dia.total_ventas_diarias_propias || 0),
      ventasTerceros: acc.ventasTerceros + (dia.ventas_cuenta_terceros || 0)
    }), {
      ventasExentas: 0,
      ventasGravadas: 0,
      exportaciones: 0,
      totalVentas: 0,
      ventasTerceros: 0
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
          <div className="animate-spin h-12 w-12 border-4 border-gray-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando libro de ventas a consumidores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen text-black bg-gray-50 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Libro de Ventas a Consumidores</h1>
                  <p className="text-gray-600 text-sm">
                    Registro diario de ventas a consumidores - Vista simplificada
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
                  <ExportarLibroConsumidor 
                    descargarCSV={descargarCSV} 
                    descargarExcel={handleExportExcel} 
                    descargarPDF={handleExportPDF}
                    exporting={exporting} 
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Días con ventas</div>
                    <div className="text-xl font-bold text-gray-800">{resumen.diasConVentas || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Ventas Exentas</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totales.ventasExentas)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Ventas Gravadas</div>
                    <div className="text-xl font-bold text-blue-600">{formatCurrency(totales.ventasGravadas)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Total Ventas</div>
                    <div className="text-xl font-bold text-gray-800">{formatCurrency(totales.totalVentas)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Exportaciones</div>
                    <div className="text-xl font-bold text-orange-600">{formatCurrency(totales.exportaciones)}</div>
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
                      Buscar
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Fecha, documento, caja..."
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

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map((column) => (
                          <th 
                            key={column.key}
                            className={`px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
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
                      {currentItems.map((dia, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          {columns.map((column) => (
                            <td 
                              key={column.key}
                              className={`px-3 py-3 text-sm ${
                                column.align === 'right' ? 'text-right' : 
                                column.align === 'center' ? 'text-center' : 'text-left'
                              } ${
                                ['documento_emitido_del', 'documento_emitido_al', 'numero_caja_sistema'].includes(column.key)
                                  ? 'font-mono text-gray-600 text-xs'
                                  : 'text-gray-700'
                              } whitespace-nowrap`}
                            >
                              {column.key.includes('ventas') || column.key.includes('exportaciones') || column.key.includes('total_ventas') ? (
                                formatCurrency(dia[column.key] || 0)
                              ) : (
                                dia[column.key] || '-'
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {libroFiltrado.length > itemsPerPage && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
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
                        ? 'No hay ventas registradas en el período seleccionado' 
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