"use client";
import React, { useRef, useState } from 'react';
import { FaFileUpload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function JsonDteUploader({ onDataLoaded }) {
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState('idle'); 
    const [message, setMessage] = useState('');

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const parseFile = (file, index) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const content = event.target?.result;
                        const firstBraceIndex = content.indexOf('{');
                        const lastBraceIndex = content.lastIndexOf('}');
                        
                        if (firstBraceIndex === -1 || lastBraceIndex === -1) {
                            throw new Error(`${file.name}: Formato de archivo inválido`);
                        }
                        
                        const jsonString = content.substring(firstBraceIndex, lastBraceIndex + 1);
                        const parsedData = JSON.parse(jsonString);

                        if (!parsedData.identificacion || !parsedData.emisor || !parsedData.cuerpoDocumento) {
                            throw new Error(`${file.name}: No tiene estructura de DTE válido`);
                        }

                        resolve({ success: true, data: parsedData, fileName: file.name });
                    } catch (error) {
                        console.error('Error al procesar el JSON:', error);
                        resolve({ success: false, error: error.message, fileName: file.name });
                    }
                };
                reader.readAsText(file);
            });
        };

        // Procesar todos los archivos
        Promise.all(Array.from(files).map((file, index) => parseFile(file, index))).then((results) => {
            const successResults = results.filter(r => r.success);
            const errorResults = results.filter(r => !r.success);

            if (successResults.length > 0) {
                setStatus('success');
                setMessage(`${successResults.length} archivo(s) cargado(s) exitosamente${errorResults.length > 0 ? ` (${errorResults.length} con error)` : ''}`);
                
                // Pasar array de DTEs o un solo DTE si es uno
                const dteData = successResults.map(r => r.data);
                onDataLoaded(dteData.length === 1 ? dteData[0] : dteData);
            }

            if (errorResults.length > 0) {
                const errorMessages = errorResults.map(e => e.error).join('; ');
                setStatus('error');
                setMessage(`Error(es): ${errorMessages}`);
            }
        });
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-start gap-2 mb-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" multiple className="hidden" />
            
            <button type="button" onClick={handleButtonClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm">
                <FaFileUpload className="w-4 h-4" />
                <span>Subir JSON de Compra(s) (DTE)</span>
            </button>

            {status === 'success' && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded border border-green-200">
                    <FaCheckCircle className="w-4 h-4" /> <span>{message}</span>
                </div>
            )}

            {status === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded border border-red-200">
                    <FaExclamationCircle className="w-4 h-4" /> <span>{message}</span>
                </div>
            )}
        </div>
    );
}