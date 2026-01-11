"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaCalendarAlt, FaFileExcel, FaSync, FaFilePdf } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';
import { API_BASE_URL } from "@/lib/api";

export default function LibroComprasView({ user, hasHaciendaToken, haciendaStatus }) {
    const [isMobile, setIsMobile] = useState(false);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [libro, setLibro] = useState([]);
    const [resumenData, setResumenData] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const itemsPerPage = 10;

    // Función para obtener la fecha actual
    const getCurrentDate = () => {
        return new Date();
    };

    useEffect(() => {
        const date = getCurrentDate();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        // Ajuste para obtener el último día del mes actual correctamente
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0); 
        
        setFechaInicio(firstDay.toISOString().split("T")[0]);
        setFechaFin(lastDay.toISOString().split("T")[0]);
    }, []);

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

    useEffect(() => {
        if (fechaInicio && fechaFin) {
            fetchLibro();
        }
    }, [fechaInicio, fechaFin]);

    const fetchLibro = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/libro-compras?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
                {
                    credentials: "include",
                }
            );
            
            if (!response.ok) throw new Error("Error al cargar registro de compras");
            const data = await response.json();
            
            const rawData = Array.isArray(data) ? data : (Array.isArray(data.libro) ? data.libro : []);
            
            const mappedData = rawData.map(item => ({
                ...item,
                fecha: item.fecha ? item.fecha.split('T')[0] : item.fecha,
                numero_registro: item.nrc || item.nit_dui_sujeto_excluido || item.numero_registro || "",
                exentas: item.exentas_internas ?? item.exentas ?? 0,
                locales: item.gravadas_internas ?? item.locales ?? 0,
                importaciones: item.gravadas_importaciones ?? item.importaciones ?? 0,
                iva: item.credito_fiscal ?? item.iva ?? 0,
                anticipo_iva: item.anticipo_iva_percibido ?? item.anticipo_iva ?? 0,
                sujetos_excluidos: item.compras_sujetos_excluidos ?? item.sujetos_excluidos ?? 0,
                monto: item.total_compras ?? item.monto ?? 0
            }));
            
            setLibro(mappedData);
            setResumenData(data.resumen || {});
        } catch (error) {
            console.error("Error:", error);
            setLibro([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchLibro();
    };

    const formatCurrency = (amount) => {
        const val = parseFloat(amount) || 0;
        return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        // Si la fecha ya viene formateada como DD/MM/YYYY, la devolvemos tal cual
        if (dateString.includes('/')) return dateString;
        
        try {
            const fecha = new Date(dateString + 'T00:00:00');
            return fecha.toLocaleDateString('es-SV', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Filtrado de datos
    const libroFiltrado = Array.isArray(libro)
        ? libro.filter((item) => {
            if (!item) return false;

            if (fechaInicio && fechaFin && item.fecha) {
                const itemDate = item.fecha;
                if (itemDate < fechaInicio || itemDate > fechaFin) {
                    return false;
                }
            }

            const searchLower = searchTerm.toLowerCase();
            return (
                (item.nombre_proveedor?.toLowerCase() || "").includes(searchLower) ||
                (item.numero_documento?.toLowerCase() || "").includes(searchLower) ||
                (item.numero_registro?.toLowerCase() || "").includes(searchLower) ||
                (item.fecha?.toString() || "").includes(searchTerm)
            );
        })
        : [];

    // Cálculo de totales basado en los datos filtrados
    const getTotales = () => {
        return libroFiltrado.reduce((acc, item) => ({
            exentas_internas: acc.exentas_internas + (parseFloat(item.exentas) || 0),
            exentas_importaciones: acc.exentas_importaciones + (parseFloat(item.exentas_importaciones) || 0),
            gravadas_internas: acc.gravadas_internas + (parseFloat(item.locales) || 0),
            gravadas_importaciones: acc.gravadas_importaciones + (parseFloat(item.importaciones) || 0),
            credito_fiscal: acc.credito_fiscal + (parseFloat(item.iva) || 0),
            fovial: acc.fovial + (parseFloat(item.fovial) || 0),
            cotrans: acc.cotrans + (parseFloat(item.cotrans) || 0),
            cesc: acc.cesc + (parseFloat(item.cesc) || 0),
            anticipo_iva: acc.anticipo_iva + (parseFloat(item.anticipo_iva) || 0),
            retencion: acc.retencion + (parseFloat(item.retencion) || 0),
            percepcion: acc.percepcion + (parseFloat(item.percepcion) || 0),
            sujetos_excluidos: acc.sujetos_excluidos + (parseFloat(item.sujetos_excluidos) || 0),
            monto: acc.monto + (parseFloat(item.monto) || 0)
        }), {
            exentas_internas: 0,
            exentas_importaciones: 0,
            gravadas_internas: 0,
            gravadas_importaciones: 0,
            credito_fiscal: 0,
            fovial: 0,
            cotrans: 0,
            cesc: 0,
            anticipo_iva: 0,
            retencion: 0,
            percepcion: 0,
            sujetos_excluidos: 0,
            monto: 0
        });
    };

    const totales = getTotales();

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = libroFiltrado.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(libroFiltrado.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Columnas para la tabla
    const columns = [
        { key: 'no', label: 'No.', width: '50px', align: 'center' },
        { key: 'fecha', label: 'FECHA', width: '100px', align: 'center' },
        { key: 'tipo_documento', label: 'TIPO DOC', width: '100px', align: 'center' },
        { key: 'numero_documento', label: 'NUMERO', width: '120px', align: 'center' },
        { key: 'numero_registro', label: 'NIT/NRC', width: '120px', align: 'center' },
        { key: 'nombre_proveedor', label: 'PROVEEDOR', width: '250px', align: 'left' },
        { key: 'exentas', label: 'EXENTAS INT.', width: '120px', align: 'right' },
        { key: 'exentas_importaciones', label: 'EXENTAS IMP.', width: '120px', align: 'right' },
        { key: 'locales', label: 'GRAVADAS INT.', width: '120px', align: 'right' },
        { key: 'importaciones', label: 'GRAVADAS IMP.', width: '120px', align: 'right' },
        { key: 'iva', label: 'CRÉDITO FISCAL', width: '120px', align: 'right' },
        { key: 'fovial', label: 'FOVIAL', width: '100px', align: 'right' },
        { key: 'cotrans', label: 'COTRANS', width: '100px', align: 'right' },
        { key: 'cesc', label: 'CESC', width: '100px', align: 'right' },
        { key: 'anticipo_iva', label: 'ANT. IVA', width: '100px', align: 'right' },
        { key: 'retencion', label: 'RETENCION', width: '100px', align: 'right' },
        { key: 'percepcion', label: 'PERCEPCION', width: '100px', align: 'right' },
        { key: 'sujetos_excluidos', label: 'SUJ. EXCL.', width: '100px', align: 'right' },
        { key: 'monto', label: 'TOTAL', width: '120px', align: 'right' },
    ];

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Exportar a Excel
    const handleExportExcel = async () => {
        setExporting(true);
        try {
            if (libroFiltrado.length === 0) {
                alert("No hay datos para exportar");
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Registro de Compras');

            worksheet.columns = [
                { header: 'FECHA', key: 'fecha', width: 12 },
                { header: 'TIPO DOC', key: 'tipo_documento', width: 10 },
                { header: 'NUMERO', key: 'numero_documento', width: 15 },
                { header: 'NIT/NRC', key: 'numero_registro', width: 15 },
                { header: 'PROVEEDOR', key: 'nombre_proveedor', width: 30 },
                { header: 'EXENTAS INT.', key: 'exentas_internas', width: 12 },
                { header: 'EXENTAS IMP.', key: 'exentas_importaciones', width: 12 },
                { header: 'GRAVADAS INT.', key: 'gravadas_internas', width: 12 },
                { header: 'GRAVADAS IMP.', key: 'gravadas_importaciones', width: 12 },
                { header: 'CRÉDITO FISCAL', key: 'credito_fiscal', width: 12 },
                { header: 'FOVIAL', key: 'fovial', width: 10 },
                { header: 'COTRANS', key: 'cotrans', width: 10 },
                { header: 'CESC', key: 'cesc', width: 10 },
                { header: 'ANTICIPO IVA', key: 'anticipo_iva', width: 12 },
                { header: 'RETENCION', key: 'retencion', width: 12 },
                { header: 'PERCEPCION', key: 'percepcion', width: 12 },
                { header: 'SUJ. EXCLUIDOS', key: 'sujetos_excluidos', width: 15 },
                { header: 'TOTAL', key: 'monto', width: 15 }
            ];

            // Estilo del encabezado
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Agregar datos
            libroFiltrado.forEach((item, index) => {
                const row = worksheet.addRow({
                    fecha: item.fecha,
                    tipo_documento: item.tipo_documento,
                    numero_documento: item.numero_documento,
                    numero_registro: item.numero_registro,
                    nombre_proveedor: item.nombre_proveedor,
                    exentas_internas: parseFloat(item.exentas) || 0,
                    exentas_importaciones: parseFloat(item.exentas_importaciones) || 0,
                    gravadas_internas: parseFloat(item.locales) || 0,
                    gravadas_importaciones: parseFloat(item.importaciones) || 0,
                    credito_fiscal: parseFloat(item.iva) || 0,
                    fovial: parseFloat(item.fovial) || 0,
                    cotrans: parseFloat(item.cotrans) || 0,
                    cesc: parseFloat(item.cesc) || 0,
                    anticipo_iva: parseFloat(item.anticipo_iva) || 0,
                    retencion: parseFloat(item.retencion) || 0,
                    percepcion: parseFloat(item.percepcion) || 0,
                    sujetos_excluidos: parseFloat(item.sujetos_excluidos) || 0,
                    monto: parseFloat(item.monto) || 0
                });

                // Estilo alternado
                const fillColor = index % 2 === 0 ? 'FFD9E1F2' : 'FFFFFFFF';
                row.eachCell((cell, colNumber) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                    if (colNumber >= 6) { // Columnas numéricas
                        cell.numFmt = '#,##0.00';
                        cell.alignment = { horizontal: 'right' };
                    }
                });
            });

            // Agregar fila de totales
            const totalRow = worksheet.addRow({
                nombre_proveedor: 'TOTALES',
                exentas_internas: totales.exentas_internas,
                exentas_importaciones: totales.exentas_importaciones,
                gravadas_internas: totales.gravadas_internas,
                gravadas_importaciones: totales.gravadas_importaciones,
                credito_fiscal: totales.credito_fiscal,
                fovial: totales.fovial,
                cotrans: totales.cotrans,
                cesc: totales.cesc,
                anticipo_iva: totales.anticipo_iva,
                retencion: totales.retencion,
                percepcion: totales.percepcion,
                sujetos_excluidos: totales.sujetos_excluidos,
                monto: totales.monto
            });
            totalRow.font = { bold: true };
            totalRow.eachCell((cell, colNumber) => {
                if (colNumber >= 6) {
                    cell.numFmt = '#,##0.00';
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `registro-compras-${fechaInicio}-a-${fechaFin}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exportando Excel:", error);
            alert("Error al exportar Excel");
        } finally {
            setExporting(false);
        }
    };

    // Exportar a PDF
    const handleExportPDF = () => {
        setExportingPDF(true);
        try {
            const doc = new jsPDF('landscape');
            const fechaGeneracion = new Date().toLocaleDateString('es-SV');

            doc.setFontSize(16);
            doc.text("REGISTRO DE COMPRAS", 14, 15);
            doc.setFontSize(10);
            doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 14, 22);
            doc.text(`Generado: ${fechaGeneracion}`, 14, 27);

            const tableColumn = ["No.", "Fecha", "Tipo", "Número", "NIT/NRC", "Proveedor", "Ex. Int", "Ex. Imp", "Gr. Int", "Gr. Imp", "CF IVA", "FOVIAL", "COTRANS", "CESC", "Ant. IVA", "Ret", "Perc", "Suj. Ex", "Total"];
            const tableRows = libroFiltrado.map((item, index) => [
                item.no || index + 1,
                item.fecha,
                item.tipo_documento,
                item.numero_documento,
                item.numero_registro,
                item.nombre_proveedor,
                formatCurrency(item.exentas || 0),
                formatCurrency(item.exentas_importaciones || 0),
                formatCurrency(item.locales || 0),
                formatCurrency(item.importaciones || 0),
                formatCurrency(item.iva || 0),
                formatCurrency(item.fovial || 0),
                formatCurrency(item.cotrans || 0),
                formatCurrency(item.cesc || 0),
                formatCurrency(item.anticipo_iva || 0),
                formatCurrency(item.retencion || 0),
                formatCurrency(item.percepcion || 0),
                formatCurrency(item.sujetos_excluidos || 0),
                formatCurrency(item.monto)
            ]);

            // Agregar fila de totales
            tableRows.push([
                "", "", "", "TOTALES",
                formatCurrency(totales.exentas_internas),
                formatCurrency(totales.exentas_importaciones),
                formatCurrency(totales.gravadas_internas),
                formatCurrency(totales.gravadas_importaciones),
                formatCurrency(totales.credito_fiscal),
                formatCurrency(totales.fovial),
                formatCurrency(totales.cotrans),
                formatCurrency(totales.cesc),
                formatCurrency(totales.anticipo_iva),
                formatCurrency(totales.retencion),
                formatCurrency(totales.percepcion),
                formatCurrency(totales.sujetos_excluidos),
                formatCurrency(totales.monto)
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'grid',
                styles: { fontSize: 6, cellPadding: 1 },
                headStyles: { fillColor: [66, 139, 202] },
                columnStyles: {
                    0: { halign: 'center' },
                    // Align numeric columns right
                    6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' },
                    10: { halign: 'right' }, 11: { halign: 'right' }, 12: { halign: 'right' }, 13: { halign: 'right' },
                    14: { halign: 'right' }, 15: { halign: 'right' }, 16: { halign: 'right' }, 17: { halign: 'right' },
                    18: { halign: 'right', fontStyle: 'bold' }
                }
            });

            doc.save(`registro-compras-${fechaInicio}-a-${fechaFin}.pdf`);
        } catch (error) {
            console.error("Error exportando PDF:", error);
            alert("Error al exportar PDF");
        } finally {
            setExportingPDF(false);
        }
    };

    if (loading && !libro.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-gray-600 rounded-full border-t-transparent mx-auto mb-4"></div>
                    <p className="text-black font-medium">Cargando registro de compras...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen text-black bg-gray-50 overflow-hidden">
            <div className={`fixed md:relative z-20 h-screen ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}>
                <Sidebar />
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}></div>
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
                            {/* Header y Botones */}
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Registro de Compras</h1>
                                </div>
                                <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                                    <button onClick={handleRefresh} disabled={refreshing} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-black hover:bg-gray-50 disabled:opacity-50 transition-colors">
                                        <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                        {refreshing ? 'Actualizando...' : 'Actualizar'}
                                    </button>
                                    <button onClick={handleExportExcel} disabled={exporting} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                                        <FaFileExcel className="mr-2" />
                                        {exporting ? 'Exportando...' : 'Excel'}
                                    </button>
                                    <button onClick={handleExportPDF} disabled={exportingPDF} className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                                        <FaFilePdf className="mr-2" />
                                        {exportingPDF ? 'Generando...' : 'PDF'}
                                    </button>
                                </div>
                            </div>

                            {/* Tarjetas de Resumen */}
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 p-4 mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                    <div>
                                        <div className="text-sm text-black font-medium">Total Compras</div>
                                        <div className="text-xl font-bold text-black">{formatCurrency(totales.monto)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-black font-medium">Compras Locales</div>
                                        <div className="text-xl font-bold text-blue-600">{formatCurrency(totales.gravadas_internas)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-black font-medium">Crédito Fiscal (IVA)</div>
                                        <div className="text-xl font-bold text-green-600">{formatCurrency(totales.credito_fiscal)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-black font-medium">Retención</div>
                                        <div className="text-xl font-bold text-orange-600">{formatCurrency(totales.retencion)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-black font-medium">Percepción</div>
                                        <div className="text-xl font-bold text-purple-600">{formatCurrency(totales.percepcion)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Filtros */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">Fecha Inicio</label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                                            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">Fecha Fin</label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                                            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">Buscar</label>
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                                            <input type="text" placeholder="Proveedor, documento, NRC..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {columns.map((column) => (
                                                    <th 
                                                        key={column.key}
                                                        className={`px-3 py-3 text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap ${
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
                                            {currentItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    {columns.map((column) => (
                                                        <td 
                                                            key={column.key}
                                                            className={`px-3 py-3 text-sm text-black whitespace-nowrap ${
                                                                column.align === 'right' ? 'text-right' : 
                                                                column.align === 'center' ? 'text-center' : 'text-left'
                                                            } ${
                                                                ['numero_documento', 'numero_registro'].includes(column.key) ? 'font-mono' : ''
                                                            }`}
                                                        >
                                                            {['exentas', 'exentas_importaciones', 'locales', 'importaciones', 'iva', 'fovial', 'cotrans', 'cesc', 'anticipo_iva', 'retencion', 'percepcion', 'sujetos_excluidos', 'monto'].includes(column.key) ? (
                                                                formatCurrency(item[column.key] || 0)
                                                            ) : (
                                                                column.key === 'no' ? (item.no || (indexOfFirstItem + idx + 1)) : (item[column.key] || '-')
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                {libroFiltrado.length > itemsPerPage && (
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-black">
                                                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, libroFiltrado.length)} de {libroFiltrado.length} registros
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-50 disabled:opacity-50 transition-colors">Anterior</button>
                                                <span className="px-3 py-1 text-sm text-black">Página {currentPage} de {totalPages}</span>
                                                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-50 disabled:opacity-50 transition-colors">Siguiente</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {libroFiltrado.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="text-black mb-3"><FaFileAlt className="inline-block text-4xl" /></div>
                                        <h3 className="text-lg font-medium text-black mb-2">No se encontraron registros</h3>
                                        <p className="text-black text-sm">Intenta ajustar los filtros o el rango de fechas</p>
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