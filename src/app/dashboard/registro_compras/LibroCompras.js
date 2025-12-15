"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaCalendarAlt, FaFileExcel, FaSync, FaFilePdf } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';

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
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const response = await fetch(
                `${baseUrl}/libro-compras?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
                {
                    credentials: "include",
                }
            );
            
            if (!response.ok) throw new Error("Error al cargar libro de compras");
            const data = await response.json();
            
            setLibro(Array.isArray(data.libro) ? data.libro : []);
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
            exentas: acc.exentas + (parseFloat(item.exentas) || 0),
            importaciones: acc.importaciones + (parseFloat(item.importaciones) || 0),
            locales: acc.locales + (parseFloat(item.locales) || 0),
            iva: acc.iva + (parseFloat(item.iva) || 0),
            retencion: acc.retencion + (parseFloat(item.retencion) || 0),
            percepcion: acc.percepcion + (parseFloat(item.percepcion) || 0),
            monto: acc.monto + (parseFloat(item.monto) || 0)
        }), {
            exentas: 0,
            importaciones: 0,
            locales: 0,
            iva: 0,
            retencion: 0,
            percepcion: 0,
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
            const worksheet = workbook.addWorksheet('Libro de Compras');

            worksheet.columns = [
                { header: 'FECHA', key: 'fecha', width: 12 },
                { header: 'TIPO DOC', key: 'tipo_documento', width: 10 },
                { header: 'NUMERO', key: 'numero_documento', width: 15 },
                { header: 'NRC', key: 'numero_registro', width: 15 },
                { header: 'PROVEEDOR', key: 'nombre_proveedor', width: 30 },
                { header: 'EXENTAS', key: 'exentas', width: 12 },
                { header: 'IMPORTACIONES', key: 'importaciones', width: 15 },
                { header: 'LOCALES', key: 'locales', width: 12 },
                { header: 'IVA', key: 'iva', width: 12 },
                { header: 'RETENCION', key: 'retencion', width: 12 },
                { header: 'PERCEPCION', key: 'percepcion', width: 12 },
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
                    exentas: parseFloat(item.exentas) || 0,
                    importaciones: parseFloat(item.importaciones) || 0,
                    locales: parseFloat(item.locales) || 0,
                    iva: parseFloat(item.iva) || 0,
                    retencion: parseFloat(item.retencion) || 0,
                    percepcion: parseFloat(item.percepcion) || 0,
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
                exentas: totales.exentas,
                importaciones: totales.importaciones,
                locales: totales.locales,
                iva: totales.iva,
                retencion: totales.retencion,
                percepcion: totales.percepcion,
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
            link.download = `libro-compras-${fechaInicio}-a-${fechaFin}.xlsx`;
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
            doc.text("LIBRO DE COMPRAS", 14, 15);
            doc.setFontSize(10);
            doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 14, 22);
            doc.text(`Generado: ${fechaGeneracion}`, 14, 27);

            const tableColumn = ["Fecha", "Doc", "Número", "Proveedor", "Exentas", "Import.", "Locales", "IVA", "Retención", "Percepción", "Total"];
            const tableRows = libroFiltrado.map(item => [
                item.fecha,
                item.tipo_documento,
                item.numero_documento,
                item.nombre_proveedor,
                formatCurrency(item.exentas),
                formatCurrency(item.importaciones),
                formatCurrency(item.locales),
                formatCurrency(item.iva),
                formatCurrency(item.retencion),
                formatCurrency(item.percepcion),
                formatCurrency(item.monto)
            ]);

            // Agregar fila de totales
            tableRows.push([
                "", "", "", "TOTALES",
                formatCurrency(totales.exentas),
                formatCurrency(totales.importaciones),
                formatCurrency(totales.locales),
                formatCurrency(totales.iva),
                formatCurrency(totales.retencion),
                formatCurrency(totales.percepcion),
                formatCurrency(totales.monto)
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 1 },
                headStyles: { fillColor: [66, 139, 202] },
                columnStyles: {
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' },
                    9: { halign: 'right' },
                    10: { halign: 'right', fontStyle: 'bold' }
                }
            });

            doc.save(`libro-compras-${fechaInicio}-a-${fechaFin}.pdf`);
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
                    <p className="text-gray-600 font-medium">Cargando libro de compras...</p>
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
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Libro de Compras</h1>
                                    <p className="text-gray-600 text-sm">Registro detallado de compras y créditos fiscales</p>
                                </div>
                                <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                                    <button onClick={handleRefresh} disabled={refreshing} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
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
                                        <div className="text-sm text-gray-600 font-medium">Total Compras</div>
                                        <div className="text-xl font-bold text-gray-800">{formatCurrency(totales.monto)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 font-medium">Compras Locales</div>
                                        <div className="text-xl font-bold text-blue-600">{formatCurrency(totales.locales)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 font-medium">Crédito Fiscal (IVA)</div>
                                        <div className="text-xl font-bold text-green-600">{formatCurrency(totales.iva)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 font-medium">Retención</div>
                                        <div className="text-xl font-bold text-orange-600">{formatCurrency(totales.retencion)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 font-medium">Percepción</div>
                                        <div className="text-xl font-bold text-purple-600">{formatCurrency(totales.percepcion)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Filtros */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">No.</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Fecha</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Documento</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Proveedor</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Exentas</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Import.</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Locales</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">IVA</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Retención</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Percepción</th>
                                                <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {currentItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-3 py-3 text-sm text-gray-700">{item.no}</td>
                                                    <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">{item.fecha}</td>
                                                    <td className="px-3 py-3 text-sm text-gray-700 font-mono">{item.numero_documento}</td>
                                                    <td className="px-3 py-3 text-sm max-w-xs">
                                                        <div className="font-medium text-gray-800 truncate" title={item.nombre_proveedor}>{item.nombre_proveedor}</div>
                                                        <div className="text-xs text-gray-500">{item.numero_registro}</div>
                                                    </td>
                                                    <td className="px-3 py-3 text-sm text-right text-gray-700 font-mono">{formatCurrency(item.exentas)}</td>
                                                    <td className="px-3 py-3 text-sm text-right text-gray-700 font-mono">{formatCurrency(item.importaciones)}</td>
                                                    <td className="px-3 py-3 text-sm text-right text-gray-700 font-mono">{formatCurrency(item.locales)}</td>
                                                    <td className="px-3 py-3 text-sm text-right text-gray-700 font-mono">{formatCurrency(item.iva)}</td>
                                                    <td className="px-3 py-3 text-sm text-right text-gray-700 font-mono">{formatCurrency(item.retencion)}</td>
                                                    <td className="px-3 py-3 text-sm text-right text-gray-700 font-mono">{formatCurrency(item.percepcion)}</td>
                                                    <td className="px-3 py-3 text-sm text-right font-bold text-gray-800 font-mono">{formatCurrency(item.monto)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                {libroFiltrado.length > itemsPerPage && (
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-700">
                                                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, libroFiltrado.length)} de {libroFiltrado.length} registros
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">Anterior</button>
                                                <span className="px-3 py-1 text-sm text-gray-700">Página {currentPage} de {totalPages}</span>
                                                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">Siguiente</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {libroFiltrado.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-3"><FaFileAlt className="inline-block text-4xl" /></div>
                                        <h3 className="text-lg font-medium text-gray-700 mb-2">No se encontraron registros</h3>
                                        <p className="text-gray-500 text-sm">Intenta ajustar los filtros o el rango de fechas</p>
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