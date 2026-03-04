// src/app/dashboard/components/JsonViewer.js
"use client";
import { useState } from "react";
import { 
  FaCopy, FaCheck, FaTimes, FaCompress, FaExpand, 
  FaSearch, FaArrowLeft, FaArrowRight, FaCode, 
  FaFileCode, FaDownload, FaSun, FaMoon 
} from "react-icons/fa";

export default function JsonViewer({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentResult, setCurrentResult] = useState(-1);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('small');

  // Extraer número de control del JSON si existe
  const getNumeroControl = () => {
    // Buscar en diferentes posibles ubicaciones del número de control
    const possiblePaths = [
      data?.ncontrol,
      data?.factura?.ncontrol,
      data?.documento?.ncontrol,
      data?.identificacion?.numeroControl,
      data?.numeroControl
    ];
    
    const ncontrol = possiblePaths.find(val => val);
    return ncontrol || `factura-${Date.now()}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Usar el número de control para el nombre del archivo
    const ncontrol = getNumeroControl();
    // Limpiar el número de control para nombre de archivo válido
    const filename = `DTE-${ncontrol.replace(/[^a-zA-Z0-9-]/g, '-')}.json`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setCurrentResult(-1);
      return;
    }

    const results = [];
    const searchInObject = (obj, path = "") => {
      if (typeof obj === "object" && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({ path: currentPath, value, key, type: 'key' });
          }
          
          if (typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({ path: currentPath, value, key, type: 'value' });
          }
          
          if (typeof value === "object" && value !== null) {
            searchInObject(value, currentPath);
          }
        });
      }
    };

    searchInObject(data);
    setSearchResults(results);
    setCurrentResult(results.length > 0 ? 0 : -1);
  };

  const navigateResult = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentResult + direction;
    if (newIndex < 0) newIndex = searchResults.length - 1;
    if (newIndex >= searchResults.length) newIndex = 0;
    
    setCurrentResult(newIndex);
    
    const result = searchResults[newIndex];
    console.log("Encontrado:", result);
  };

  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'small': return 'text-xs';
      case 'medium': return 'text-sm';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };

  const renderJson = (obj, level = 0) => {
    if (obj === null) return <span className={darkMode ? "text-gray-400" : "text-gray-500"}>null</span>;
    if (obj === undefined) return <span className={darkMode ? "text-gray-400" : "text-gray-500"}>undefined</span>;
    
    const type = typeof obj;
    
    if (type === "string") {
      const isDate = /^\d{4}-\d{2}-\d{2}/.test(obj);
      return (
        <span className={isDate ? "text-blue-500" : darkMode ? "text-green-400" : "text-green-600"}>
          "{obj}"
        </span>
      );
    }
    if (type === "number") return <span className={darkMode ? "text-blue-400" : "text-blue-600"}>{obj}</span>;
    if (type === "boolean") return <span className={darkMode ? "text-amber-400" : "text-amber-600"}>{obj.toString()}</span>;
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return <span className={darkMode ? "text-gray-400" : "text-gray-500"}>[]</span>;
      
      return (
        <div className="ml-4 border-l-2 border-dashed border-blue-200 dark:border-blue-800 pl-2">
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>[</span>
          {obj.map((item, index) => (
            <div key={index} className="ml-2">
              {renderJson(item, level + 1)}
              {index < obj.length - 1 && <span className={darkMode ? "text-gray-400" : "text-gray-400"}>,</span>}
            </div>
          ))}
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>]</span>
        </div>
      );
    }
    
    if (type === "object") {
      const entries = Object.entries(obj);
      if (entries.length === 0) return <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{'{}'}</span>;
      
      return (
        <div className="ml-4 border-l-2 border-dashed border-blue-200 dark:border-blue-800 pl-2">
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{'{'}</span>
          {entries.map(([key, value], index) => {
            const isHighlighted = searchResults[currentResult]?.key === key && 
                                 JSON.stringify(searchResults[currentResult]?.value) === JSON.stringify(value);
            
            return (
              <div 
                key={key} 
                className={`ml-2 transition-all duration-300 ${
                  isHighlighted 
                    ? darkMode 
                      ? 'bg-blue-900 bg-opacity-30 rounded px-1 -mx-1' 
                      : 'bg-blue-100 rounded px-1 -mx-1'
                    : ''
                }`}
              >
                <span className={darkMode ? "text-blue-400" : "text-blue-600"}>"{key}"</span>
                <span className={darkMode ? "text-gray-400" : "text-gray-600"}>: </span>
                {renderJson(value, level + 1)}
                {index < entries.length - 1 && <span className={darkMode ? "text-gray-400" : "text-gray-400"}>,</span>}
              </div>
            );
          })}
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{'}'}</span>
        </div>
      );
    }
    
    return <span>{String(obj)}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className={`${
        expanded ? 'w-11/12 lg:w-4/5 h-5/6' : 'w-3/4 lg:w-2/3 h-2/3'
      } bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 scale-100 animate-slideIn`}>
        
        {/* Header con azul corporativo */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <FaFileCode className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Visualizador JSON</h3>
              <p className="text-xs text-blue-100">
                N° Control: {getNumeroControl()} • {JSON.stringify(data).length} caracteres
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Selector de tamaño de fuente */}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="bg-white bg-opacity-20 text-white text-sm rounded-lg px-2 py-1 border border-white border-opacity-30 focus:outline-none hover:bg-opacity-30 transition-all"
            >
              <option value="small" className="text-gray-800">Pequeño</option>
              <option value="medium" className="text-gray-800">Mediano</option>
              <option value="large" className="text-gray-800">Grande</option>
            </select>

            {/* Botón modo oscuro/claro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
              title={darkMode ? "Modo claro" : "Modo oscuro"}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>

            {/* Botón expandir/colapsar */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
              title={expanded ? "Reducir" : "Expandir"}
            >
              {expanded ? <FaCompress /> : <FaExpand />}
            </button>

            {/* Botón copiar */}
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all relative"
              title="Copiar al portapapeles"
            >
              {copied ? <FaCheck className="text-green-300" /> : <FaCopy />}
            </button>

            {/* Botón descargar - ahora con número de control */}
            <button
              onClick={downloadJSON}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all bg-blue-700 bg-opacity-40"
              title="Descargar JSON con número de control"
            >
              <FaDownload />
            </button>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all ml-2"
              title="Cerrar"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar en JSON... (presiona Enter)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md"
            >
              Buscar
            </button>
            
            {searchResults.length > 0 && (
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 border border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {currentResult + 1}/{searchResults.length}
                </span>
                <button
                  onClick={() => navigateResult(-1)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                  disabled={searchResults.length === 0}
                >
                  <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => navigateResult(1)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                  disabled={searchResults.length === 0}
                >
                  <FaArrowRight className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            )}
          </div>

          {/* Chips de resultados */}
          {searchResults.length > 0 && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {searchResults.length} resultado(s)
              </span> encontrado(s) para "{searchTerm}"
            </div>
          )}
        </div>

        {/* Contenido JSON */}
        <div className={`flex-1 overflow-auto p-6 ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } ${getFontSizeClass()} font-mono`}>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700 mb-4">
              <FaCode className="text-blue-500" />
              <span className="text-gray-500 dark:text-gray-400">Estructura JSON</span>
            </div>
            <pre className={`whitespace-pre-wrap break-words ${
              darkMode ? 'text-gray-300' : 'text-gray-800'
            }`}>
              {renderJson(data)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3 border-t border-gray-200 dark:border-gray-700 ${
          darkMode ? 'bg-gray-800' : 'bg-gray-50'
        } flex justify-between items-center text-xs`}>
          <div className="flex space-x-4">
            <span className="text-gray-500 dark:text-gray-400">
              📦 Nodos: {JSON.stringify(data).match(/[{}[\]]/g)?.length || 0}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              📏 Líneas: {JSON.stringify(data, null, 2).split('\n').length}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              ⚡ Tamaño: {(JSON.stringify(data).length / 1024).toFixed(2)} KB
            </span>
          </div>
          <div className="flex space-x-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {typeof data === 'object' ? (Array.isArray(data) ? 'Array' : 'Object') : typeof data}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            transform: scale(0.95);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}