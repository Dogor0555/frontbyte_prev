"use client";
import React, { useRef, useState } from 'react';
import { FaFileUpload, FaCheckCircle, FaExclamationCircle, FaMagic, FaTimes, FaCode } from 'react-icons/fa';
import { normalizeDTE } from '@/lib/ai/dteNormalizer';

export default function JsonDteUploader({ onDataLoaded }) {
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [isCleaning, setIsCleaning] = useState(false);
    
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [pendingFiles, setPendingFiles] = useState([]);
    
    // Estado para productos sin código
    const [itemsSinCodigo, setItemsSinCodigo] = useState([]);
    const [codigosAsignados, setCodigosAsignados] = useState({});

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const showNormalizationModal = (dteData, fileName, rawData) => {
        // Buscar productos SIN CÓDIGO
        const sinCodigo = (dteData.cuerpoDocumento || [])
            .map((item, idx) => ({ ...item, originalIndex: idx }))
            .filter(item => !item.codigo || item.codigo === 'SIN_CODIGO' || item.codigo === null || item.codigo === '');
        
        const info = {
            fileName,
            proveedor: dteData.emisor?.nombre || 'No especificado',
            nit: dteData.emisor?.nit || 'No especificado',
            nrc: dteData.emisor?.nrc || 'No especificado',
            numeroDocumento: dteData.identificacion?.numeroControl || dteData.numero_documento || 'No especificado',
            fechaEmision: dteData.identificacion?.fecEmi || dteData.fecha_emision || 'No especificada',
            total: dteData.resumen?.totalPagar || dteData.total_compras || 0,
            cantidadItems: dteData.cuerpoDocumento?.length || 0,
            items: dteData.cuerpoDocumento || [],
            itemsSinCodigo: sinCodigo,
            rawData
        };
        
        setItemsSinCodigo(sinCodigo);
        setCodigosAsignados({});
        setModalData(info);
        setShowModal(true);
    };

    const handleCodigoChange = (index, value) => {
        setCodigosAsignados(prev => ({
            ...prev,
            [index]: value
        }));
    };

    const aplicarCodigosAlDte = (dteData) => {
        const nuevoDte = JSON.parse(JSON.stringify(dteData));
        
        itemsSinCodigo.forEach((item, idx) => {
            const codigoAsignado = codigosAsignados[idx];
            if (codigoAsignado && codigoAsignado.trim()) {
                if (nuevoDte.cuerpoDocumento && nuevoDte.cuerpoDocumento[item.originalIndex]) {
                    nuevoDte.cuerpoDocumento[item.originalIndex].codigo = codigoAsignado.trim();
                }
            }
        });
        
        return nuevoDte;
    };

    const handleCleanConfirm = async () => {
        setShowModal(false);
        setIsCleaning(true);
        
        try {
            const results = [];
            for (let i = 0; i < pendingFiles.length; i++) {
                const file = pendingFiles[i];
                
                // Aplicar los códigos asignados al DTE
                let processedData = file.data;
                if (i === 0 && itemsSinCodigo.length > 0) {
                    processedData = aplicarCodigosAlDte(file.data);
                }
                
                const result = await normalizeDTE(processedData);
                
                results.push({
                    success: true,
                    data: result.normalized,
                    fileName: file.fileName,
                    cambios: result.cambios || []
                });
            }
            
            const successResults = results.filter(r => r.success);
            
            if (successResults.length > 0) {
                setStatus('success');
                const codigosInfo = Object.values(codigosAsignados).filter(c => c).length;
                setMessage(`${successResults.length} archivo(s) procesados - ${codigosInfo} código(s) asignados`);
                
                for (let i = 0; i < successResults.length; i++) {
                    await onDataLoaded(successResults.map(r => r.data));
                    await delay(600);
                }
            }
        } catch (error) {
            console.error('Error cleaning:', error);
            setStatus('error');
            setMessage(`Error al limpiar: ${error.message}`);
        } finally {
            setIsCleaning(false);
            setPendingFiles([]);
            setItemsSinCodigo([]);
            setCodigosAsignados({});
        }
    };

    const handleCleanCancel = () => {
        setShowModal(false);
        const successResults = pendingFiles.filter(f => f.success);
        if (successResults.length > 0) {
            onDataLoaded(successResults.map(f => f.data));
            setStatus('success');
            setMessage(`${successResults.length} archivo(s) procesados (sin limpiar)`);
        }
        setPendingFiles([]);
        setItemsSinCodigo([]);
        setCodigosAsignados({});
    };

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const MAX_FILES = 50;
        if (files.length > MAX_FILES) {
            setStatus('error');
            setMessage(`Solo puedes subir máximo ${MAX_FILES} archivos.`);
            return;
        }

        const parseFile = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const content = event.target?.result;
                        const firstBraceIndex = content.indexOf('{');
                        const lastBraceIndex = content.lastIndexOf('}');
                        
                        if (firstBraceIndex === -1 || lastBraceIndex === -1) {
                            throw new Error(`${file.name}: Formato inválido`);
                        }

                        const jsonString = content.substring(firstBraceIndex, lastBraceIndex + 1);
                        const parsedData = JSON.parse(jsonString);

                        resolve({ success: true, data: parsedData, fileName: file.name });
                    } catch (error) {
                        resolve({ success: false, error: error.message, fileName: file.name });
                    }
                };
                reader.readAsText(file);
            });
        };

        const results = await Promise.all(Array.from(files).map(parseFile));
        const successResults = results.filter(r => r.success);
        const errorResults = results.filter(r => !r.success);

        if (errorResults.length > 0) {
            const errorMessages = errorResults.map(e => e.error).join('; ');
            setStatus('error');
            setMessage(`Errores: ${errorMessages}`);
        }

        if (successResults.length > 0) {
            const firstFile = successResults[0];
            showNormalizationModal(firstFile.data, firstFile.fileName, firstFile.data);
            setPendingFiles(successResults);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <div className="flex flex-col items-start gap-2 mb-4">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    multiple 
                    className="hidden" 
                />
                
                <div className="flex gap-3">
                    <button 
                        type="button" 
                        onClick={handleButtonClick} 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                        disabled={isCleaning}
                    >
                        <FaFileUpload className="w-4 h-4" />
                        <span>Subir JSON de Compra(s) (DTE)</span>
                    </button>

                    {isCleaning && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-md">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                            <span className="text-sm">Procesando códigos...</span>
                        </div>
                    )}
                </div>

                {status === 'success' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded border border-green-200">
                        <FaCheckCircle className="w-4 h-4" /> 
                        <span>{message}</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded border border-red-200">
                        <FaExclamationCircle className="w-4 h-4" /> 
                        <span>{message}</span>
                    </div>
                )}
            </div>

            {/* MODAL DE NORMALIZACIÓN - CON PREGUNTA DE CÓDIGOS */}
            {showModal && modalData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-purple-50 border-b border-purple-100 px-6 py-4 rounded-t-xl sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaMagic className="text-purple-600 text-xl" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-purple-800">
                                            {itemsSinCodigo.length > 0 ? 'Asignar códigos a productos' : 'Limpiar documento con IA'}
                                        </h2>
                                        <p className="text-sm text-purple-600">{modalData.fileName}</p>
                                    </div>
                                </div>
                                <button onClick={handleCleanCancel} className="text-gray-400 hover:text-gray-600">
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Información del documento */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h3 className="font-semibold text-gray-700 mb-3">📄 Información del Documento</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="text-gray-500">Proveedor:</span> <span className="font-medium">{modalData.proveedor}</span></div>
                                    <div><span className="text-gray-500">NIT:</span> <span className="font-medium">{modalData.nit}</span></div>
                                    <div><span className="text-gray-500">N° Documento:</span> <span className="font-medium">{modalData.numeroDocumento}</span></div>
                                    <div><span className="text-gray-500">Total:</span> <span className="font-medium text-green-600">${modalData.total}</span></div>
                                </div>
                            </div>

                            {/* PRODUCTOS SIN CÓDIGO - SECCIÓN PRINCIPAL */}
                            {itemsSinCodigo.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FaCode className="text-orange-500" />
                                        <h3 className="font-semibold text-gray-800">⚠️ Productos sin código ({itemsSinCodigo.length})</h3>
                                        <span className="text-xs text-gray-500">Asigna un código a cada producto</span>
                                    </div>
                                    
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {itemsSinCodigo.map((item, idx) => (
                                            <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                <div className="mb-2">
                                                    <p className="font-medium text-gray-800">{item.descripcion}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Cantidad: {item.cantidad} | Precio: ${item.precioUni}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Código del producto *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={codigosAsignados[idx] || ''}
                                                        onChange={(e) => handleCodigoChange(idx, e.target.value)}
                                                        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
                                                        placeholder="Ej: PROD-001, ACEITE-001, etc."
                                                        autoFocus={idx === 0}
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Este código se usará para identificar este producto en el inventario
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Lista de productos completos */}
                            <div className="mb-4">
                                <h3 className="font-semibold text-gray-700 mb-2">📦 Todos los productos del DTE</h3>
                                <div className="max-h-48 overflow-y-auto border rounded-lg">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Código</th>
                                                <th className="px-3 py-2 text-left">Descripción</th>
                                                <th className="px-3 py-2 text-right">Cantidad</th>
                                                <th className="px-3 py-2 text-right">Precio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modalData.items.map((item, idx) => (
                                                <tr key={idx} className={`border-t ${(!item.codigo || item.codigo === 'SIN_CODIGO') ? 'bg-orange-50' : ''}`}>
                                                    <td className="px-3 py-2 font-mono text-xs">
                                                        {item.codigo || '❌ SIN CÓDIGO'}
                                                    </td>
                                                    <td className="px-3 py-2 max-w-xs truncate">{item.descripcion}</td>
                                                    <td className="px-3 py-2 text-right">{item.cantidad}</td>
                                                    <td className="px-3 py-2 text-right">${item.precioUni || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Advertencia */}
                            {itemsSinCodigo.length > 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                                    <p className="text-sm text-yellow-700">
                                        ⚠️ Los productos marcados en <span className="font-bold">naranja</span> no tienen código. 
                                        Debes asignarles un código antes de continuar, o el sistema no podrá crearlos correctamente.
                                    </p>
                                </div>
                            )}

                            {/* Info de limpieza IA */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                    <FaMagic className="text-blue-600" />
                                    La IA también limpiará:
                                </h3>
                                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                    <li>Convertir <code className="bg-blue-100 px-1 rounded">uniMedida</code> de número a texto</li>
                                    <li>Convertir strings numéricos a números</li>
                                    <li>Extraer y reubicar el <code className="bg-blue-100 px-1 rounded">sello_recepcion</code></li>
                                    <li>Convertir <code className="bg-blue-100 px-1 rounded">pagos: null</code> a array vacío</li>
                                </ul>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 rounded-b-xl flex justify-end gap-3">
                            <button
                                onClick={handleCleanCancel}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Usar original (sin limpiar)
                            </button>
                            <button
                                onClick={handleCleanConfirm}
                                disabled={itemsSinCodigo.length > 0 && Object.values(codigosAsignados).filter(c => c && c.trim()).length !== itemsSinCodigo.length}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                    itemsSinCodigo.length > 0 && Object.values(codigosAsignados).filter(c => c && c.trim()).length !== itemsSinCodigo.length
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                            >
                                <FaMagic className="text-sm" />
                                {itemsSinCodigo.length > 0 
                                    ? `Asignar códigos (${Object.values(codigosAsignados).filter(c => c && c.trim()).length}/${itemsSinCodigo.length})`
                                    : 'Limpiar con IA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}