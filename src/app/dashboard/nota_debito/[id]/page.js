"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FaArrowLeft, 
  FaFileAlt, 
  FaUser, 
  FaCalendarAlt, 
  FaDollarSign, 
  FaExchangeAlt,
  FaPaperPlane,
  FaExclamationTriangle
} from "react-icons/fa";

export default function EmitirNotaPage() {
  const params = useParams();
  const router = useRouter();
  const facturaId = params.id;
  
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  
  const [motivoNota, setMotivoNota] = useState("");
  const [montoNota, setMontoNota] = useState("");
  const [tipoNota, setTipoNota] = useState("debito"); 

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/creditos/${facturaId}`, {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo cargar la factura`);
        }

        // Verificar que la respuesta sea JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error("La respuesta del servidor no es JSON válido");
        }

        const data = await response.json();
        
        if (!puedeGenerarNota(data)) {
          throw new Error("Esta factura no puede generar notas de débito/crédito");
        }

        setFactura(data);
      } catch (err) {
        console.error("Error cargando factura:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (facturaId) {
      fetchFactura();
    }
  }, [facturaId]);

  const puedeGenerarNota = (facturaData) => {
    if (!facturaData) return false;
    if (facturaData.tipodocumento === 'NOTA_DEBITO' || facturaData.esnotadebito) return false;
    if (facturaData.tipodocumento === 'NOTA_CREDITO' || facturaData.esnotacredito) return false;
    if (!['TRANSMITIDO', 'RE-TRANSMITIDO', 'ACEPTADO'].includes(facturaData.estado)) return false;
    
    if (facturaData.fechaemision) {
      const fechaEmision = new Date(facturaData.fechaemision);
      const ahora = new Date();
      const horasTranscurridas = (ahora - fechaEmision) / (1000 * 60 * 60);
      return horasTranscurridas <= 24;
    }
    
    return false;
  };

  const handleBack = () => {
    router.back();
  };

  const handleGenerarNota = async () => {
    if (!factura || !motivoNota.trim() || !montoNota || parseFloat(montoNota) <= 0) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    setEnviando(true);
    try {
      const monto = parseFloat(montoNota);
      const iva = monto * 0.13;
      const total = monto + iva;

      const baseEndpoint = tipoNota === "debito" 
        ? "http://localhost:3000/notasdebito"
        : "http://localhost:3000/notascredito";

      const encabezadoData = {
        idcliente: factura.idcliente,
        iddte_relacionado: factura.iddtefactura,
        fechaemision: new Date().toISOString().split('T')[0], 
        horaemision: new Date().toTimeString().split(' ')[0].substring(0, 8),
        subtotal: monto.toFixed(2),
        totalapagar: total.toFixed(2),
        totalgravada: monto.toFixed(2),
        valorletras: convertirNumeroALetras(total),
        tipoventa: "contado",
        formapago: "efectivo",
        estado: 1,
        verjson: "3.0",
        transaccioncontable: `TRX-ND-${Date.now()}`,
        tributos: [
          {
            codigo: "20",
            descripcion: "IVA Débito Fiscal",
            valor: iva
          }
        ]
      };

      console.log("Enviando encabezado:", encabezadoData);

      const encabezadoResponse = await fetch(`${baseEndpoint}/encabezado`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encabezadoData),
      });

      if (!encabezadoResponse.ok) {
        const errorText = await encabezadoResponse.text();
        throw new Error(`Error creando encabezado: ${errorText}`);
      }

      const encabezadoResult = await encabezadoResponse.json();
      console.log("Encabezado creado:", encabezadoResult);

      const { iddtefactura } = encabezadoResult;

      const detallesData = {
        transmitir: true,
        detalles: [
          {
            descripcion: `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} - ${motivoNota.trim()}`,
            cantidad: 1,
            precio: monto.toFixed(2),
            preciouni: monto.toFixed(2),
            subtotal: monto.toFixed(2),
            ventagravada: monto.toFixed(2),
            iva: iva.toFixed(2),
            total: total.toFixed(2),
            unidadmedida: "UNI",
            tributo: "20",
            tributos: [
              {
                codigo: "20",
                descripcion: "Impuesto al Valor Agregado 13%",
                valor: iva.toFixed(2)
              }
            ]
          }
        ]
      };

      console.log("Enviando detalles:", detallesData);

      const detallesResponse = await fetch(`${baseEndpoint}/${iddtefactura}/detalles`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(detallesData),
      });

      if (!detallesResponse.ok) {
        const errorText = await detallesResponse.text();
        throw new Error(`Error enviando detalles: ${errorText}`);
      }

      const detallesResult = await detallesResponse.json();
      console.log("Detalles procesados:", detallesResult);

      if (detallesResult.hacienda && detallesResult.hacienda.estado) {
        if (detallesResult.hacienda.estado === "PROCESADO" && detallesResult.hacienda.descripcionMsg === "RECIBIDO") {
          alert(`Nota de ${tipoNota === "debito" ? "débito" : "crédito"} generada y transmitida exitosamente`);
        } else {
          throw new Error(detallesResult.hacienda.descripcionMsg || `Error en Hacienda: ${detallesResult.hacienda.estado}`);
        }
      } else if (detallesResult.message && detallesResult.message.includes("transmitida")) {
        alert(`Nota de ${tipoNota === "debito" ? "débito" : "crédito"} generada exitosamente`);
      } else {
        alert(`Nota de ${tipoNota === "debito" ? "débito" : "crédito"} generada exitosamente`);
      }

      if (tipoNota === "debito") {
        router.push("/dashboard/notas-debito");
      } else {
        router.push("/dashboard/notas-credito");
      }

    } catch (error) {
      console.error(`Error al generar nota de ${tipoNota}:`, error);
      alert("Error: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  const convertirNumeroALetras = (numero) => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    
    const entero = Math.floor(numero);
    const decimal = Math.round((numero - entero) * 100);
    
    if (entero === 0) return `CERO CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;
    if (entero === 1) return `UNO CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;
    if (entero < 10) return `${unidades[entero].toUpperCase()} CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;
    if (entero < 20) return `${especiales[entero - 10].toUpperCase()} CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;

    return `${entero} CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-SV', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-SV');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FaArrowLeft className="inline mr-2" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaExclamationTriangle className="text-gray-400 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Factura no encontrada</h2>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FaArrowLeft className="inline mr-2" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center text-purple-600 hover:text-purple-800 mb-4 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Volver a facturas
        </button>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Emitir Nota de {tipoNota === "debito" ? "Débito" : "Crédito"}
          </h1>
          <p className="text-gray-600">
            Complete la información para generar la nota
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaFileAlt className="text-blue-500 mr-2" />
              Factura Original
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Número</label>
                <p className="text-gray-800 font-semibold">
                  #{factura.numerofacturausuario || factura.iddtefactura}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Emisión</label>
                <p className="text-gray-800 flex items-center">
                  <FaCalendarAlt className="text-gray-400 mr-2 text-sm" />
                  {formatDate(factura.fechaemision)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Cliente</label>
                <p className="text-gray-800 font-medium">
                  {factura.nombrecibe || 'Cliente no especificado'}
                </p>
                {factura.docuentrega && (
                  <p className="text-sm text-gray-500">DUI: {factura.docuentrega}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <p className="text-gray-800">{factura.estado || 'PENDIENTE'}</p>
              </div>
              
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-500">Total Factura</label>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(factura.totalpagar || factura.montototaloperacion || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Nota *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipoNota("debito")}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    tipoNota === "debito"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-purple-300"
                  }`}
                >
                  <FaExchangeAlt className={`mx-auto mb-2 text-lg ${
                    tipoNota === "debito" ? "text-purple-500" : "text-gray-400"
                  }`} />
                  <div className="font-semibold">Nota de Débito</div>
                  <div className="text-sm text-gray-500 mt-1">Aumentar el monto</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setTipoNota("credito")}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    tipoNota === "credito"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-green-300"
                  }`}
                >
                  <FaExchangeAlt className={`mx-auto mb-2 text-lg ${
                    tipoNota === "credito" ? "text-green-500" : "text-gray-400"
                  }`} />
                  <div className="font-semibold">Nota de Crédito</div>
                  <div className="text-sm text-gray-500 mt-1">Reducir el monto</div>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la Nota *
              </label>
              <textarea
                id="motivo"
                value={motivoNota}
                onChange={(e) => setMotivoNota(e.target.value)}
                placeholder={`Describa el motivo de la nota de ${tipoNota === "debito" ? "débito" : "crédito"}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                rows="4"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Describa detalladamente el motivo de la nota
              </p>
            </div>

            {/* Monto de la nota */}
            <div className="mb-6">
              <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-2">
                Monto de la Nota (USD) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="text-gray-400" />
                </div>
                <input
                  type="number"
                  id="monto"
                  value={montoNota}
                  onChange={(e) => setMontoNota(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={factura.totalpagar || factura.montototaloperacion || 0}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Monto mínimo: $0.01</span>
                <span>Monto máximo: {formatCurrency(factura.totalpagar || factura.montototaloperacion || 0)}</span>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de nota:</span>
                  <span className="font-medium">
                    {tipoNota === "debito" ? "Nota de Débito" : "Nota de Crédito"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto base:</span>
                  <span className="font-medium">
                    {montoNota ? formatCurrency(parseFloat(montoNota)) : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (13%):</span>
                  <span className="font-medium">
                    {montoNota ? formatCurrency(parseFloat(montoNota) * 0.13) : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800 font-semibold">Total nota:</span>
                  <span className="font-bold text-blue-600">
                    {montoNota ? formatCurrency(parseFloat(montoNota) * 1.13) : '$0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerarNota}
                disabled={!motivoNota.trim() || !montoNota || parseFloat(montoNota) <= 0 || enviando}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center ${
                  !motivoNota.trim() || !montoNota || parseFloat(montoNota) <= 0 || enviando
                    ? "bg-gray-400 cursor-not-allowed"
                    : tipoNota === "debito" 
                      ? "bg-purple-600 hover:bg-purple-700" 
                      : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {enviando ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Emitir Nota de {tipoNota === "debito" ? "Débito" : "Crédito"}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6 rounded-r">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Importante:</strong> Las notas de débito/crédito solo pueden generarse para 
                  facturas transmitidas con menos de 24 horas de antigüedad y que estén en estado 
                  "TRANSMITIDO" o "RE-TRANSMITIDO".
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}