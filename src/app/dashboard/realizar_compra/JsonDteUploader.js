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
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result;
                const firstBraceIndex = content.indexOf('{');
                const lastBraceIndex = content.lastIndexOf('}');
                
                if (firstBraceIndex === -1 || lastBraceIndex === -1) {
                    throw new Error('Formato de archivo inválido: No se encontró un objeto JSON.');
                }
                
                const jsonString = content.substring(firstBraceIndex, lastBraceIndex + 1);
                const parsedData = JSON.parse(jsonString);

                if (!parsedData.identificacion || !parsedData.emisor || !parsedData.cuerpoDocumento) {
                    throw new Error('El JSON no tiene la estructura de un DTE válido.');
                }

                setStatus('success');
                setMessage(`DTE cargado: ${parsedData.identificacion.numeroControl}`);
                onDataLoaded(parsedData);
            } catch (error) {
                console.error('Error al procesar el JSON:', error);
                setStatus('error');
                setMessage(error.message || 'Error al leer el archivo JSON');
            }
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col items-start gap-2 mb-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            
            <button type="button" onClick={handleButtonClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm">
                <FaFileUpload className="w-4 h-4" />
                <span>Subir JSON de Compra (DTE)</span>
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