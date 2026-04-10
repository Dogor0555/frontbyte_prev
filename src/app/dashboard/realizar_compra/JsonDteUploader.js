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

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

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

                        if (!parsedData.identificacion || !parsedData.emisor || !parsedData.cuerpoDocumento) {
                            throw new Error(`${file.name}: No es un DTE válido`);
                        }

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

        if (successResults.length > 0) {
            setStatus('success');
            setMessage(`${successResults.length} archivo(s) listos para procesar`);

            // 🔥 PROCESAMIENTO EN COLA
            for (let i = 0; i < successResults.length; i++) {
                const dte = successResults[i].data;

                try {
                    console.log(`📦 Enviando ${i + 1} de ${successResults.length}`);

                    await onDataLoaded(successResults.map(r => r.data));

                    // ⏳ darle respiro al backend
                    await delay(600);

                } catch (err) {
                    console.error("❌ Error en lote:", err);
                    setStatus('error');
                    setMessage(`Error en archivo ${i + 1}: ${err.message}`);
                    break;
                }
            }
        }

        if (errorResults.length > 0) {
            const errorMessages = errorResults.map(e => e.error).join('; ');
            setStatus('error');
            setMessage(`Errores: ${errorMessages}`);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-start gap-2 mb-4">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                multiple 
                className="hidden" 
            />
            
            <button 
                type="button" 
                onClick={handleButtonClick} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
                <FaFileUpload className="w-4 h-4" />
                <span>Subir JSON de Compra(s) (DTE)</span>
            </button>

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
    );
}