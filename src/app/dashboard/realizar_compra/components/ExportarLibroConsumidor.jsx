import { useState } from "react";
import { Csv } from "./Csv";
import {MsExcel} from "./Excel";
import {Pdf} from "./Pdf";

export default function ExportarAnexoCompras({
    descargarCSV,
    descargarExcel,
    descargarPDF,
    exporting
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen(!open)}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
                Generar Libro consumidor
            </button>

            {open && (
                <div className="absolute mt-2 w-44 bg-white border rounded-lg shadow-lg z-10">
                    <button
                        onClick={() => {
                            descargarCSV();
                            setOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                        <Csv size={14} />
                        CSV
                    </button>

                    <button
                        onClick={() => {
                            descargarExcel();
                            setOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                        <MsExcel size={14} />
                        Excel
                    </button>
                    <button
                        onClick={() => {
                            descargarPDF();
                            setOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                    <Pdf size={14} />
                        PDF
                    </button>
                </div>
            )}
        </div>
    );
}