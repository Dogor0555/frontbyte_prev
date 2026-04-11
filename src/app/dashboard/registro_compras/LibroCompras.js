"use client";
import { useState, useEffect, useCallback } from "react";
import {
    FaSearch, FaFileAlt, FaCalendarAlt, FaFileExcel,
    FaSync, FaFilePdf, FaEdit, FaTrash, FaTimes, FaEye
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import EditarCompraModal from "./components/EditarCompraModal";
import DetalleCompraModal from "./components/DetalleCompraModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { API_BASE_URL } from "@/lib/api";
import { Csv } from "./components/csv";

// ─── Períodos rápidos ────────────────────────────────────────────────────────
const QUICK_PERIODS = [
    {
        label: "Hoy",
        get: () => {
            const iso = new Date().toISOString().split("T")[0];
            return { fi: iso, ff: iso };
        },
    },
    {
        label: "Esta semana",
        get: () => {
            const d = new Date();
            const day = d.getDay();
            const mon = new Date(d);
            mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
            const sun = new Date(mon);
            sun.setDate(mon.getDate() + 6);
            return { fi: mon.toISOString().split("T")[0], ff: sun.toISOString().split("T")[0] };
        },
    },
    {
        label: "Este mes",
        get: () => {
            const d = new Date();
            const fi = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
            const ff = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
            return { fi, ff };
        },
    },
    {
        label: "Mes anterior",
        get: () => {
            const d = new Date();
            const fi = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split("T")[0];
            const ff = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split("T")[0];
            return { fi, ff };
        },
    },
    {
        label: "Este año",
        get: () => {
            const y = new Date().getFullYear();
            return { fi: `${y}-01-01`, ff: `${y}-12-31` };
        },
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
    const val = parseFloat(amount) || 0;
    return new Intl.NumberFormat("es-SV", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(val);
};

const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    if (dateString.includes("/")) return dateString;
    try {
        const fecha = new Date(dateString + "T00:00:00");
        return fecha.toLocaleDateString("es-SV", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
};

const mapItem = (item) => ({
    ...item,
    id: item.id,
    fecha_emision_doc: item.fecha_emision_doc || item.fecha_emision || "-",
    fecha_registro_sistema: item.fecha_registro_sistema || item.fecha_registro || "-",
    numero_registro: item.nrc || item.nit_dui || item.numero_registro || "",
    exentas: item.exentas_internas ?? item.exentas ?? 0,
    locales: item.gravadas_internas ?? item.locales ?? 0,
    importaciones: item.gravadas_importaciones ?? item.importaciones ?? 0,
    iva: item.credito_fiscal ?? item.iva ?? 0,
    anticipo_iva: item.anticipo_iva_percibido ?? item.anticipo_iva ?? 0,
    sujetos_excluidos: item.compras_sujetos_excluidos ?? item.sujetos_excluidos ?? 0,
    monto: item.total_compras ?? item.monto ?? 0,
    exentas_importaciones: item.exentas_importaciones || "0.00",
    fovial: item.fovial || "0.00",
    cotrans: item.cotrans || "0.00",
    cesc: item.cesc || "0.00",
    codigo_generacion: item.codigo_generacion || "N/A",
    sello_recepcion: item.sello_recepcion || "N/A",
});

const COLUMNS = [
    { key: "no",                     label: "No.",              width: "50px",  align: "center" },
    { key: "fecha_emision_doc",      label: "F. EMISIÓN",       width: "100px", align: "center" },
    { key: "fecha_registro_sistema", label: "F. REGISTRO",      width: "100px", align: "center" },
    { key: "tipo_documento",         label: "TIPO DOC",         width: "100px", align: "center" },
    { key: "numero_documento",       label: "NÚMERO",           width: "120px", align: "center" },
    { key: "numero_registro",        label: "NIT/NRC",          width: "120px", align: "center" },
    { key: "nombre_proveedor",       label: "PROVEEDOR",        width: "250px", align: "left"   },
    { key: "codigo_generacion",      label: "CÓD. GENERACIÓN",  width: "150px", align: "center" },
    { key: "sello_recepcion",        label: "SELLO RECEPCIÓN",  width: "150px", align: "center" },
    { key: "exentas",                label: "EXENTAS INT.",     width: "120px", align: "right"  },
    { key: "exentas_importaciones",  label: "EXENTAS IMP.",     width: "120px", align: "right"  },
    { key: "locales",                label: "GRAVADAS INT.",    width: "120px", align: "right"  },
    { key: "importaciones",          label: "GRAVADAS IMP.",    width: "120px", align: "right"  },
    { key: "iva",                    label: "CRÉD. FISCAL",     width: "120px", align: "right"  },
    { key: "fovial",                 label: "FOVIAL",           width: "100px", align: "right"  },
    { key: "cotrans",                label: "COTRANS",          width: "100px", align: "right"  },
    { key: "cesc",                   label: "CESC",             width: "100px", align: "right"  },
    { key: "anticipo_iva",           label: "ANT. IVA",         width: "100px", align: "right"  },
    { key: "retencion",              label: "RETENCIÓN",        width: "100px", align: "right"  },
    { key: "percepcion",             label: "PERCEPCIÓN",       width: "100px", align: "right"  },
    { key: "sujetos_excluidos",      label: "SUJ. EXCL.",       width: "100px", align: "right"  },
    { key: "monto",                  label: "TOTAL",            width: "120px", align: "right"  },
    { key: "acciones",               label: "ACCIONES",         width: "120px", align: "center" },
];

const CURRENCY_KEYS = [
    "exentas","exentas_importaciones","locales","importaciones","iva",
    "fovial","cotrans","cesc","anticipo_iva","retencion","percepcion",
    "sujetos_excluidos","monto",
];

const ITEMS_PER_PAGE = 10;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LibroComprasView({ user, hasHaciendaToken, haciendaStatus }) {
    const [isMobile,    setIsMobile]    = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin,    setFechaFin]    = useState("");

    const [libro,       setLibro]       = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [refreshing,  setRefreshing]  = useState(false);

    const [searchTerm,  setSearchTerm]  = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [exporting,    setExporting]    = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);

    // Modal editar
    const [modalOpen,        setModalOpen]        = useState(false);
    const [selectedCompraId, setSelectedCompraId] = useState(null);
    const [deletingId,       setDeletingId]       = useState(false);

    // Modal detalle ← NUEVO
    const [detalleOpen,       setDetalleOpen]       = useState(false);
    const [selectedDetalleId, setSelectedDetalleId] = useState(null);

    // ── Inicialización ────────────────────────────────────────────────────────
    useEffect(() => {
        const { fi, ff } = QUICK_PERIODS[2].get();
        setFechaInicio(fi);
        setFechaFin(ff);
        fetchLibroConFechas(fi, ff);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setSidebarOpen(!mobile);
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchLibroConFechas = useCallback(async (fi, ff) => {
        try {
            setLoading(true);
            const res = await fetch(
                `${API_BASE_URL}/libro-compras?fechaInicio=${fi}&fechaFin=${ff}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Error al cargar registro de compras");
            const data = await res.json();
            const raw = Array.isArray(data)
                ? data
                : Array.isArray(data.libro)
                ? data.libro
                : [];
            setLibro(raw.map(mapItem));
        } catch (err) {
            console.error(err);
            setLibro([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleBuscar = () => {
        if (!fechaInicio || !fechaFin) return;
        setCurrentPage(1);
        fetchLibroConFechas(fechaInicio, fechaFin);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchLibroConFechas(fechaInicio, fechaFin);
    };

    const applyQuickPeriod = (period) => {
        const { fi, ff } = period.get();
        setFechaInicio(fi);
        setFechaFin(ff);
        setCurrentPage(1);
        fetchLibroConFechas(fi, ff);
    };

    const handleLimpiar = () => {
        const { fi, ff } = QUICK_PERIODS[2].get();
        setFechaInicio(fi);
        setFechaFin(ff);
        setSearchTerm("");
        setCurrentPage(1);
        fetchLibroConFechas(fi, ff);
    };

    const activePeriodLabel = QUICK_PERIODS.find((p) => {
        const { fi, ff } = p.get();
        return fi === fechaInicio && ff === fechaFin;
    })?.label ?? null;

    // ── Acciones ──────────────────────────────────────────────────────────────
    const handleEdit = (id) => {
        if (!id) return alert("Registro sin ID válido");
        setSelectedCompraId(id);
        setModalOpen(true);
    };

    const handleViewDetail = (id) => {
        if (!id) return;
        setSelectedDetalleId(id);
        setDetalleOpen(true);
    };

    const handleDelete = async (id) => {
        if (!id) return alert("Registro sin ID válido");
        if (!confirm("¿Eliminar esta compra? La acción no se puede deshacer.")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/compras/delete/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al eliminar");
            fetchLibroConFechas(fechaInicio, fechaFin);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const libroFiltrado = libro.filter((item) => {
        if (!item) return false;
        const q = searchTerm.toLowerCase();
        return (
            (item.nombre_proveedor?.toLowerCase()    || "").includes(q) ||
            (item.numero_documento?.toLowerCase()     || "").includes(q) ||
            (item.numero_registro?.toLowerCase()      || "").includes(q) ||
            (item.codigo_generacion?.toLowerCase()    || "").includes(q) ||
            (item.sello_recepcion?.toLowerCase()      || "").includes(q) ||
            (item.fecha_emision_doc?.toString()       || "").includes(searchTerm) ||
            (item.fecha_registro_sistema?.toString()  || "").includes(searchTerm)
        );
    });

    // ── Totales ───────────────────────────────────────────────────────────────
    const totales = libroFiltrado.reduce(
        (acc, item) => ({
            exentas_internas:       acc.exentas_internas       + (parseFloat(item.exentas)               || 0),
            exentas_importaciones:  acc.exentas_importaciones  + (parseFloat(item.exentas_importaciones)  || 0),
            gravadas_internas:      acc.gravadas_internas      + (parseFloat(item.locales)                || 0),
            gravadas_importaciones: acc.gravadas_importaciones + (parseFloat(item.importaciones)          || 0),
            credito_fiscal:         acc.credito_fiscal         + (parseFloat(item.iva)                    || 0),
            fovial:                 acc.fovial                 + (parseFloat(item.fovial)                 || 0),
            cotrans:                acc.cotrans                + (parseFloat(item.cotrans)                || 0),
            cesc:                   acc.cesc                   + (parseFloat(item.cesc)                   || 0),
            anticipo_iva:           acc.anticipo_iva           + (parseFloat(item.anticipo_iva)           || 0),
            retencion:              acc.retencion              + (parseFloat(item.retencion)              || 0),
            percepcion:             acc.percepcion             + (parseFloat(item.percepcion)             || 0),
            sujetos_excluidos:      acc.sujetos_excluidos      + (parseFloat(item.sujetos_excluidos)      || 0),
            monto:                  acc.monto                  + (parseFloat(item.monto)                  || 0),
        }),
        {
            exentas_internas:0, exentas_importaciones:0, gravadas_internas:0,
            gravadas_importaciones:0, credito_fiscal:0, fovial:0, cotrans:0,
            cesc:0, anticipo_iva:0, retencion:0, percepcion:0,
            sujetos_excluidos:0, monto:0,
        }
    );

    // ── Paginación ────────────────────────────────────────────────────────────
    const totalPages   = Math.ceil(libroFiltrado.length / ITEMS_PER_PAGE);
    const indexOfFirst = (currentPage - 1) * ITEMS_PER_PAGE;
    const indexOfLast  = indexOfFirst + ITEMS_PER_PAGE;
    const currentItems = libroFiltrado.slice(indexOfFirst, indexOfLast);

    // ── Exportar Excel ────────────────────────────────────────────────────────
    const handleExportExcel = async () => {
        if (!libroFiltrado.length) return alert("No hay datos para exportar");
        setExporting(true);
        try {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("Registro de Compras");
            ws.columns = [
                { header: "F. EMISIÓN",       key: "fecha_emision_doc",      width: 12 },
                { header: "F. REGISTRO",      key: "fecha_registro_sistema", width: 12 },
                { header: "TIPO DOC",         key: "tipo_documento",         width: 10 },
                { header: "NÚMERO",           key: "numero_documento",       width: 15 },
                { header: "NIT/NRC",          key: "numero_registro",        width: 15 },
                { header: "PROVEEDOR",        key: "nombre_proveedor",       width: 30 },
                { header: "CÓD. GENERACIÓN",  key: "codigo_generacion",      width: 20 },
                { header: "SELLO RECEPCIÓN",  key: "sello_recepcion",        width: 20 },
                { header: "EXENTAS INT.",     key: "exentas",                width: 12 },
                { header: "EXENTAS IMP.",     key: "exentas_importaciones",  width: 12 },
                { header: "GRAVADAS INT.",    key: "locales",                width: 12 },
                { header: "GRAVADAS IMP.",    key: "importaciones",          width: 12 },
                { header: "CRÉD. FISCAL",     key: "iva",                    width: 12 },
                { header: "FOVIAL",           key: "fovial",                 width: 10 },
                { header: "COTRANS",          key: "cotrans",                width: 10 },
                { header: "CESC",             key: "cesc",                   width: 10 },
                { header: "ANTICIPO IVA",     key: "anticipo_iva",           width: 12 },
                { header: "RETENCIÓN",        key: "retencion",              width: 12 },
                { header: "PERCEPCIÓN",       key: "percepcion",             width: 12 },
                { header: "SUJ. EXCLUIDOS",   key: "sujetos_excluidos",      width: 15 },
                { header: "TOTAL",            key: "monto",                  width: 15 },
            ];

            const hdr = ws.getRow(1);
            hdr.eachCell((cell) => {
                cell.font  = { color: { argb: "FFFFFFFF" }, bold: true };
                cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
                cell.alignment = { vertical: "middle", horizontal: "center" };
            });

            libroFiltrado.forEach((item, i) => {
                const row = ws.addRow({
                    fecha_emision_doc:      item.fecha_emision_doc,
                    fecha_registro_sistema: item.fecha_registro_sistema,
                    tipo_documento:         item.tipo_documento,
                    numero_documento:       item.numero_documento,
                    numero_registro:        item.numero_registro,
                    nombre_proveedor:       item.nombre_proveedor,
                    codigo_generacion:      item.codigo_generacion,
                    sello_recepcion:        item.sello_recepcion,
                    exentas:                parseFloat(item.exentas)               || 0,
                    exentas_importaciones:  parseFloat(item.exentas_importaciones)  || 0,
                    locales:                parseFloat(item.locales)                || 0,
                    importaciones:          parseFloat(item.importaciones)          || 0,
                    iva:                    parseFloat(item.iva)                    || 0,
                    fovial:                 parseFloat(item.fovial)                 || 0,
                    cotrans:                parseFloat(item.cotrans)                || 0,
                    cesc:                   parseFloat(item.cesc)                   || 0,
                    anticipo_iva:           parseFloat(item.anticipo_iva)           || 0,
                    retencion:              parseFloat(item.retencion)              || 0,
                    percepcion:             parseFloat(item.percepcion)             || 0,
                    sujetos_excluidos:      parseFloat(item.sujetos_excluidos)      || 0,
                    monto:                  parseFloat(item.monto)                  || 0,
                });
                const fill = i % 2 === 0 ? "FFf1f5f9" : "FFFFFFFF";
                row.eachCell((cell, col) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
                    cell.border = {
                        top: { style: "thin" }, left: { style: "thin" },
                        bottom: { style: "thin" }, right: { style: "thin" },
                    };
                    if (col >= 9) { cell.numFmt = "#,##0.00"; cell.alignment = { horizontal: "right" }; }
                });
            });

            const totRow = ws.addRow({
                nombre_proveedor:      "TOTALES",
                exentas:               totales.exentas_internas,
                exentas_importaciones: totales.exentas_importaciones,
                locales:               totales.gravadas_internas,
                importaciones:         totales.gravadas_importaciones,
                iva:                   totales.credito_fiscal,
                fovial:                totales.fovial,
                cotrans:               totales.cotrans,
                cesc:                  totales.cesc,
                anticipo_iva:          totales.anticipo_iva,
                retencion:             totales.retencion,
                percepcion:            totales.percepcion,
                sujetos_excluidos:     totales.sujetos_excluidos,
                monto:                 totales.monto,
            });
            totRow.font = { bold: true };
            totRow.eachCell((cell, col) => {
                if (col >= 9) { cell.numFmt = "#,##0.00"; cell.alignment = { horizontal: "right" }; }
            });

            const buf  = await wb.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url;
            a.download = `registro-compras-${fechaInicio}-a-${fechaFin}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Error al exportar Excel");
        } finally {
            setExporting(false);
        }
    };

    const descargarCSV = async () => {
        try {
            if (!fechaInicio || !fechaFin) return alert("Debes seleccionar un rango de fechas");
            const params = new URLSearchParams({ fechaInicio, fechaFin });
            const res = await fetch(`${API_BASE_URL}/reporte/compras-csv?${params.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error("Error al descargar CSV");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ANEXO_COMPRAS_${fechaInicio}_${fechaFin}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("Error al descargar CSV");
        }
    };

    // ── Exportar PDF ──────────────────────────────────────────────────────────
    const handleExportPDF = () => {
        setExportingPDF(true);
        try {
            const doc = new jsPDF("landscape");
            doc.setFontSize(16);
            doc.text("REGISTRO DE COMPRAS", 14, 15);
            doc.setFontSize(10);
            doc.text(`Período: ${formatDate(fechaInicio)} – ${formatDate(fechaFin)}`, 14, 22);
            doc.text(`Generado: ${new Date().toLocaleDateString("es-SV")}`, 14, 27);

            const cols = [
                "No.","F. Emisión","F. Registro","Tipo","Número","NIT/NRC","Proveedor",
                "Cód. Generación","Sello Recepción",
                "Ex. Int","Ex. Imp","Gr. Int","Gr. Imp","CF IVA",
                "FOVIAL","COTRANS","CESC","Ant. IVA","Ret","Perc","Suj. Ex","Total"
            ];

            const rows = libroFiltrado.map((item, i) => [
                item.no || i + 1,
                item.fecha_emision_doc,
                item.fecha_registro_sistema,
                item.tipo_documento,
                item.numero_documento,
                item.numero_registro,
                item.nombre_proveedor,
                item.codigo_generacion,
                item.sello_recepcion,
                formatCurrency(item.exentas               || 0),
                formatCurrency(item.exentas_importaciones  || 0),
                formatCurrency(item.locales                || 0),
                formatCurrency(item.importaciones          || 0),
                formatCurrency(item.iva                    || 0),
                formatCurrency(item.fovial                 || 0),
                formatCurrency(item.cotrans                || 0),
                formatCurrency(item.cesc                   || 0),
                formatCurrency(item.anticipo_iva           || 0),
                formatCurrency(item.retencion              || 0),
                formatCurrency(item.percepcion             || 0),
                formatCurrency(item.sujetos_excluidos      || 0),
                formatCurrency(item.monto),
            ]);

            rows.push([
                "","","","","","","TOTALES","","",
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
                formatCurrency(totales.monto),
            ]);

            autoTable(doc, {
                head: [cols],
                body: rows,
                startY: 35,
                theme: "grid",
                styles: { fontSize: 5.5, cellPadding: 1 },
                headStyles: { fillColor: [30, 41, 59] },
                columnStyles: {
                    0: { halign: "center" },
                    7: { halign: "center", fontStyle: "bold" },
                    8: { halign: "center", fontStyle: "bold" },
                    ...[9,10,11,12,13,14,15,16,17,18,19,20,21].reduce((a,k) => ({...a,[k]:{halign:"right"}}),{}),
                    22: { halign: "right", fontStyle: "bold" },
                },
            });

            doc.save(`registro-compras-${fechaInicio}-a-${fechaFin}.pdf`);
        } catch (err) {
            console.error(err);
            alert("Error al exportar PDF");
        } finally {
            setExportingPDF(false);
        }
    };

    // ── Loading inicial ───────────────────────────────────────────────────────
    if (loading && !libro.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-slate-700 rounded-full border-t-transparent mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Cargando registro de compras…</p>
                </div>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen text-slate-800 bg-slate-50 overflow-hidden">

            {/* Modal editar */}
            <EditarCompraModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                compraId={selectedCompraId}
                onSuccess={() => fetchLibroConFechas(fechaInicio, fechaFin)}
            />

            {/* Modal detalle ← NUEVO */}
            <DetalleCompraModal
                isOpen={detalleOpen}
                onClose={() => setDetalleOpen(false)}
                compraId={selectedDetalleId}
            />

            {/* Sidebar */}
            <div
                className={`fixed md:relative z-20 h-screen transition-transform duration-200 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}
            >
                <Sidebar />
            </div>
            {sidebarOpen && isMobile && (
                <div className="fixed inset-0 bg-black/40 z-10" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
                    <Navbar
                        user={user}
                        hasHaciendaToken={hasHaciendaToken}
                        haciendaStatus={haciendaStatus}
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        sidebarOpen={sidebarOpen}
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-full mx-auto">

                        {/* ── Header ───────────────────────────────────────── */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                                    Registro de Compras
                                </h1>
                                {fechaInicio && fechaFin && (
                                    <p className="text-sm text-slate-500 mt-1">
                                        {formatDate(fechaInicio)} — {formatDate(fechaFin)}
                                        {" · "}
                                        <span className="font-medium text-slate-700">
                                            {libroFiltrado.length} registro{libroFiltrado.length !== 1 ? "s" : ""}
                                        </span>
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing || loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors text-sm"
                                >
                                    <FaSync className={refreshing ? "animate-spin" : ""} size={12} />
                                    {refreshing ? "Actualizando…" : "Actualizar"}
                                </button>
                                <button
                                    onClick={descargarCSV}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                                >
                                    <Csv size={12} />
                                    CSV
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
                                >
                                    <FaFileExcel size={12} />
                                    {exporting ? "Exportando…" : "Excel"}
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={exportingPDF}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm"
                                >
                                    <FaFilePdf size={12} />
                                    {exportingPDF ? "Generando…" : "PDF"}
                                </button>
                            </div>
                        </div>

                        {/* ── Tarjetas resumen ──────────────────────────────── */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            {[
                                { label: "Total Compras",      value: totales.monto,             color: "text-slate-900"   },
                                { label: "Gravadas Locales",   value: totales.gravadas_internas, color: "text-blue-600"    },
                                { label: "Crédito Fiscal IVA", value: totales.credito_fiscal,    color: "text-emerald-600" },
                                { label: "Retención",          value: totales.retencion,         color: "text-amber-600"   },
                                { label: "Percepción",         value: totales.percepcion,        color: "text-violet-600"  },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                    <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                                    <p className={`text-lg font-bold ${color}`}>{formatCurrency(value)}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Panel de Filtros ──────────────────────────────── */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                                <FaCalendarAlt className="text-slate-400" size={13} />
                                <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                    Filtros
                                </span>
                            </div>

                            <div className="p-5">
                                <div className="mb-5">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                                        Período rápido
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_PERIODS.map((period) => {
                                            const active = activePeriodLabel === period.label;
                                            return (
                                                <button
                                                    key={period.label}
                                                    onClick={() => applyQuickPeriod(period)}
                                                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                                                        active
                                                            ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                                                            : "bg-white text-slate-600 border-slate-300 hover:border-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {period.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="relative flex items-center gap-3 mb-5">
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <span className="text-xs text-slate-400 font-medium">o rango personalizado</span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex flex-1 gap-3 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1.5">Desde</label>
                                            <div className="relative">
                                                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                                                <input
                                                    type="date"
                                                    value={fechaInicio}
                                                    onChange={(e) => setFechaInicio(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors bg-slate-50"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-end pb-2.5 text-slate-400 shrink-0">
                                            <span className="text-lg leading-none">→</span>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1.5">Hasta</label>
                                            <div className="relative">
                                                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                                                <input
                                                    type="date"
                                                    value={fechaFin}
                                                    onChange={(e) => setFechaFin(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors bg-slate-50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 md:max-w-xs">
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Buscar</label>
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                                            <input
                                                type="text"
                                                placeholder="Proveedor, documento, NRC, código…"
                                                value={searchTerm}
                                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                                className="w-full pl-8 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors bg-slate-50"
                                            />
                                            {searchTerm && (
                                                <button
                                                    onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    <FaTimes size={11} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={handleBuscar}
                                            disabled={loading || !fechaInicio || !fechaFin}
                                            className="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            <FaSearch size={11} />
                                            {loading ? "Buscando…" : "Buscar"}
                                        </button>
                                        <button
                                            onClick={handleLimpiar}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-500 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                        >
                                            <FaTimes size={11} />
                                            Limpiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Tabla ─────────────────────────────────────────── */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {COLUMNS.map((col) => (
                                                <th
                                                    key={col.key}
                                                    style={{ width: col.width }}
                                                    className={`px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${
                                                        col.align === "right"  ? "text-right"  :
                                                        col.align === "center" ? "text-center" : "text-left"
                                                    }`}
                                                >
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {currentItems.map((item, idx) => (
                                            <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                                                {COLUMNS.map((col) => (
                                                    <td
                                                        key={col.key}
                                                        className={`px-3 py-2.5 text-sm text-slate-700 whitespace-nowrap ${
                                                            col.align === "right"  ? "text-right"  :
                                                            col.align === "center" ? "text-center" : "text-left"
                                                        } ${
                                                            ["numero_documento","numero_registro","codigo_generacion","sello_recepcion"].includes(col.key)
                                                                ? "font-mono text-xs"
                                                                : ""
                                                        }`}
                                                    >
                                                        {col.key === "acciones" ? (
                                                            <div className="flex justify-center gap-1">
                                                                {item.id ? (
                                                                    <>
                                                                        {/* Ver detalle ← NUEVO */}
                                                                        <button
                                                                            onClick={() => handleViewDetail(item.id)}
                                                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                                                            title="Ver detalle"
                                                                        >
                                                                            <FaEye size={13} />
                                                                        </button>
                                                                        {/* Editar */}
                                                                        <button
                                                                            onClick={() => handleEdit(item.id)}
                                                                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                                            title="Editar"
                                                                        >
                                                                            <FaEdit size={13} />
                                                                        </button>
                                                                        {/* Eliminar */}
                                                                        <button
                                                                            onClick={() => handleDelete(item.id)}
                                                                            disabled={deletingId === item.id}
                                                                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                                                                            title="Eliminar"
                                                                        >
                                                                            {deletingId === item.id ? (
                                                                                <div className="animate-spin h-3 w-3 border-2 border-rose-500 border-t-transparent rounded-full" />
                                                                            ) : (
                                                                                <FaTrash size={13} />
                                                                            )}
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-slate-300 text-xs">—</span>
                                                                )}
                                                            </div>
                                                        ) : CURRENCY_KEYS.includes(col.key) ? (
                                                            formatCurrency(item[col.key] || 0)
                                                        ) : ["fecha_emision_doc","fecha_registro_sistema"].includes(col.key) ? (
                                                            formatDate(item[col.key])
                                                        ) : col.key === "no" ? (
                                                            item.no || (indexOfFirst + idx + 1)
                                                        ) : (
                                                            item[col.key] || "—"
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Empty state */}
                            {libroFiltrado.length === 0 && !loading && (
                                <div className="text-center py-16">
                                    <FaFileAlt className="mx-auto text-slate-300 mb-3" size={40} />
                                    <h3 className="text-base font-semibold text-slate-500 mb-1">
                                        No se encontraron registros
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        Ajusta el rango de fechas y presiona <strong>Buscar</strong>
                                    </p>
                                </div>
                            )}

                            {/* Paginación */}
                            {libroFiltrado.length > ITEMS_PER_PAGE && (
                                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                    <p className="text-sm text-slate-500">
                                        Mostrando{" "}
                                        <span className="font-medium text-slate-700">
                                            {indexOfFirst + 1}–{Math.min(indexOfLast, libroFiltrado.length)}
                                        </span>{" "}
                                        de{" "}
                                        <span className="font-medium text-slate-700">{libroFiltrado.length}</span>{" "}
                                        registros
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage((p) => p - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                        >
                                            ← Anterior
                                        </button>
                                        <span className="px-3 py-1.5 text-sm text-slate-600 font-medium">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                        >
                                            Siguiente →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}