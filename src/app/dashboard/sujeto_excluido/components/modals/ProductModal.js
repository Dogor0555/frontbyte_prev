import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaPercent } from "react-icons/fa";

export default function ProductModal({
  isOpen,
  onClose,
  onAddItem,
  onBackToSelector,
  unidades,
  obtenerNombreUnidad
}) {
  const [cantidad, setCantidad] = useState(1);
  const [impuestoSeleccionado, setImpuestoSeleccionado] = useState("59");
  const [tipoVenta, setTipoVenta] = useState("1");
  const [tipoProducto, setTipoProducto] = useState("1");
  const [isMobile, setIsMobile] = useState(false);
  const [tributos, setTributos] = useState([]);
  const [valorDescuento, setValorDescuento] = useState(0);
  const [descuentoAplicado, setDescuentoAplicado] = useState(0); 
  const [precioEditable, setPrecioEditable] = useState(0);
  const [errorDescuento, setErrorDescuento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidad, setUnidad] = useState("59");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    setTributos(tributos.filter(t => t.codigo !== "20"));
  }, [tipoVenta, cantidad, descuentoAplicado, precioEditable]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const validarDescuento = (valorDescuento, cantidad) => {
    const precio = precioEditable;
    const subtotalSinDescuento = (cantidad * precio);
    const descuento = parseFloat(valorDescuento) || 0;

    if (descuento > subtotalSinDescuento) {
      setErrorDescuento(`El descuento no puede ser mayor al subtotal (${formatMoney(subtotalSinDescuento)})`);
      return false;
    } else {
      setErrorDescuento("");
      return true;
    }
  };

  const handleValorDescuentoChange = (value) => {
    const numericValue = value === "" ? "" : parseFloat(value);
    setValorDescuento(numericValue);
    
    // Validar en tiempo real
    validarDescuento(numericValue, cantidad);
  };

  useEffect(() => {
    calcularDescuento();
    validarDescuento(valorDescuento, cantidad);
  }, [valorDescuento, cantidad, precioEditable]);

  const limpiarFormulario = () => {
    setCantidad(1);
    setImpuestoSeleccionado("59");
    setTipoVenta("1");
    setTributos([]);
    setValorDescuento(0);
    setDescuentoAplicado(0);
    setPrecioEditable(0);
    setErrorDescuento("");
    setDescripcion("");
    setUnidad("59");
  };

  useEffect(() => {
    if (!isOpen) {
      limpiarFormulario();
    }
  }, [isOpen]);

  const handleClose = () => {
    limpiarFormulario();
    onClose();
  };

  const obtenerDescripcionImpuesto = (codigo) => {
    const impuestos = {
      "59": "Turismo: por alojamiento (5%)",
      "71": "Turismo: salida del país por vía aérea $7.00",
      "D1": "FOVIAL ($0.20 Ctvs. por galón)",
      "C8": "COTRANS ($0.10 Ctvs. por galón)",
      "D5": "Otras tasas casos especiales",
      "D4": "Otros impuestos casos especiales",
      "C5": "Impuesto ad-valorem por diferencial de precios de Bebidas Alcohólicas (8%)",
      "C6": "Impuesto ad-valorem por diferencial de precios al tabaco cigarrillos (39%)",
      "C7": "Impuesto ad-valorem por diferencial de precios al tabaco cigarros (100%)",
      "19": "Fabricante de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulante",
      "28": "Importador de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante",
      "31": "Detallistas o Expendedores de Bebidas Alcohólicas",
      "32": "Fabricante de Cerveza",
      "33": "Importador de Cerveza",
      "34": "Fabricante de Productos de Tabaco",
      "35": "Importador de Productos de Tabaco",
      "36": "Fabricante de Armas de Fuego, Municiones y Artículos Similares",
      "37": "Importador de Armas de Fuego, Municiones y Artículos Similares",
      "38": "Fabricante de Explosivos",
      "39": "Importador de Explosivos",
      "42": "Fabricante de Productos Pirotécnicos",
      "43": "Importador de Productos Pirotécnicos",
      "44": "Productor de Tabaco",
      "50": "Distribuidor de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante",
      "51": "Bebidas Alcohólicas",
      "52": "Cerveza",
      "53": "Productos del Tabaco",
      "54": "Bebidas Carbonatadas o Gaseosas Simples o Endulzadas",
      "55": "Otros Específicos",
      "58": "Alcohol",
      "77": "Importador de Jugos, Néctares, Bebidas con Jugo y Refrescos",
      "78": "Distribuidor de Jugos, Néctares, Bebidas con Jugo y Refrescos",
      "79": "Sobre Llamadas Telefónicas Provenientes del Ext.",
      "85": "Detallista de Jugos, Néctares, Bebidas con Jugo y Refrescos",
      "86": "Fabricante de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas",
      "91": "Fabricante de Jugos, Néctares, Bebidas con Jugo y Refrescos",
      "92": "Importador de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas",
      "A1": "Específicos y Ad-valorem",
      "A5": "Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulantes",
      "A7": "Alcohol Etílico",
      "A9": "Sacos Sintéticos"
    };
    return impuestos[codigo] || "Impuesto no especificado";
  };

  const calcularValorImpuesto = (codigoImpuesto, subtotal) => {
    const tasas = {
      "59": 0.05, 
      "C5": 0.08,
      "C6": 0.39, 
      "C7": 1.00, 
    };
    
    const tasa = tasas[codigoImpuesto] || 0;
    return subtotal * tasa;
  };

  const calcularDescuento = () => {
    const precio = precioEditable;
    const subtotalSinDescuento = cantidad * precio;
    const descuento = parseFloat(valorDescuento) || 0;
    
    // Validar que el descuento no sea mayor al subtotal
    if (descuento > subtotalSinDescuento) {
      setDescuentoAplicado(0);
      return;
    }

    const descuentoFinal = Math.min(descuento, subtotalSinDescuento);
    setDescuentoAplicado(descuentoFinal);
  };

  const agregarTributo = () => {
    if (impuestoSeleccionado === "20") {
      alert("No puede agregar IVA en documentos de sujeto excluido");
      return;
    }
    
    const precio = precioEditable;
    const subtotalSinDescuento = cantidad * precio;
    const subtotalConDescuento = subtotalSinDescuento - descuentoAplicado;
    const valorImpuesto = calcularValorImpuesto(impuestoSeleccionado, subtotalConDescuento);
    
    const nuevoTributo = {
      codigo: impuestoSeleccionado,
      descripcion: obtenerDescripcionImpuesto(impuestoSeleccionado),
      valor: parseFloat(valorImpuesto.toFixed(2))
    };

    const existe = tributos.some(t => t.codigo === nuevoTributo.codigo);
    
    if (!existe) {
      setTributos([...tributos, nuevoTributo]);
    } else {
      alert("Este impuesto ya ha sido agregado");
    }
  };

  const eliminarTributo = (codigo) => {
    setTributos(tributos.filter(t => t.codigo !== codigo));
  };

  const calcularTotal = () => {
    const precio = precioEditable;
    const subtotalSinDescuento = cantidad * precio;
    const subtotalConDescuento = subtotalSinDescuento - descuentoAplicado;
    
    const totalImpuestos = tributos.reduce((sum, tributo) => sum + tributo.valor, 0);
    
    return Math.max(0, subtotalConDescuento + totalImpuestos);
  };

  const handleAgregarItem = () => {
    if (!descripcion.trim()) {
      alert("Por favor ingrese una descripción para el item");
      return;
    }

    // Validar descuento antes de agregar
    if (!validarDescuento(valorDescuento, cantidad)) {
      alert("El descuento no puede ser mayor al precio del item");
      return;
    }

    // Removed stock check logic as it depends on selected product

    agregarItemConfirmado();
  };

  const agregarItemConfirmado = () => {
    let tipoItem;
    switch (tipoVenta) {
      case "2": 
        tipoItem = "noAfecto";
        break;
      case "3":
        tipoItem = "noSuj";
        break;
      default:
        tipoItem = "noAfecto";
    }

    const esServicio = tipoProducto === "2" || tipoProducto === "3";
    const necesitaActualizarStock = false;
    
    const precioUnitario = precioEditable;

    const total = calcularTotal();
    
    let descuentoExento = 0;
    let descuentoNoSujeto = 0;
    
    if (tipoItem === "noAfecto") {
      descuentoExento = descuentoAplicado;
    } else if (tipoItem === "noSuj") {
      descuentoNoSujeto = descuentoAplicado;
    }
    
    onAddItem({
      descripcion: descripcion,
      cantidad: cantidad,
      precioUnitario: precioUnitario,
      descuento: descuentoAplicado,
      valorDescuento: valorDescuento,
      descuentoExento: descuentoExento,
      descuentoNoSujeto: descuentoNoSujeto,
      unidadMedida: unidad,
      tipo: tipoItem,
      tributos: tributos,
      productoId: null,
      actualizarStock: necesitaActualizarStock,
      stockAnterior: null,
      esServicio: esServicio
    });
    
    limpiarFormulario();
  };

  if (!isOpen) return null;

  const subtotalSinDescuento = 
    cantidad && precioEditable ? (cantidad * precioEditable) : 0;

  const subtotalConDescuento = Math.max(0, subtotalSinDescuento - descuentoAplicado);
  const total = calcularTotal();

  const esExento = tipoVenta === "2";

  return (
    <div className="text-black fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold">Agregar Producto o Servicio - Sujeto Excluido</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <FaTimes size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="font-semibold text-gray-900 text-lg">Item DTE</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo:</label>
                <select
                  value={tipoProducto}
                  onChange={(e) => setTipoProducto(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">1 - Bien</option>
                  <option value="2">2 - Servicio</option>
                  <option value="3">3 - Bien y Servicio</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {tipoProducto === "1" 
                    ? "Mostrando solo productos (bienes)" 
                    : tipoProducto === "2" 
                    ? "Mostrando solo servicios" 
                    : "Mostrando productos y servicios"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseFloat(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Unidad</label>
                  <select
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {unidades.map((u) => (
                      <option key={u.codigo} value={u.codigo}>{u.codigo} - {u.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre Producto</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ingrese descripción o seleccione un producto"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Precio</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="flex-1 min-w-0 rounded-r-lg border border-gray-300 p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    value={precioEditable}
                    onChange={(e) => setPrecioEditable(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* SECCIÓN DE DESCUENTO CON VALIDACIÓN */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FaPercent className="mr-2 text-gray-600" />
                  Descuento (Monto Fijo)
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto de descuento:
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={valorDescuento === 0 ? "" : valorDescuento}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleValorDescuentoChange(value);
                      }}
                      className={`flex-1 min-w-0 rounded-r-lg border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errorDescuento ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errorDescuento && (
                    <p className="text-red-500 text-xs mt-1">{errorDescuento}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Subtotal: {formatMoney(cantidad * precioEditable)}
                  </p>
                </div>

                {descuentoAplicado > 0 && (
                  <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Descuento aplicado:</span>
                      <span className="font-semibold text-gray-900">
                        -${descuentoAplicado.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo Venta</label>
                <select 
                  value={tipoVenta}
                  onChange={(e) => setTipoVenta(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="2">Exento</option>
                  <option value="3">No sujeto</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="font-semibold text-gray-900 text-lg">Información de tributos</h3>
                <p className="text-xs text-red-600 mt-1">
                  Documento de Sujeto Excluido - No se permite IVA
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Seleccionar Impuesto:</label>
                <div className="flex gap-2 mb-2">
                  <select
                    className="flex-1 p-3 w-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={impuestoSeleccionado}
                    onChange={(e) => setImpuestoSeleccionado(e.target.value)}
                  >
                    <option value="59">59 - Turismo: por alojamiento (5%)</option>
                    <option value="71">71 - Turismo: salida del país por vía aérea $7.00</option>
                    <option value="D1">D1 - FOVIAL ($0.20 Ctvs. por galón)</option>
                    <option value="C8">C8 - COTRANS ($0.10 Ctvs. por galón)</option>
                    <option value="D5">D5 - Otras tasas casos especiales</option>
                    <option value="D4">D4 - Otros impuestos casos especiales</option>
                    <option value="C5">C5 - Impuesto ad-valorem por diferencial de precios de Bebidas Alcohólicas (8%)</option>
                    <option value="C6">C6 - Impuesto ad-valorem por diferencial de precios al tabaco cigarrillos (39%)</option>
                    <option value="C7">C7 - Impuesto ad-valorem por diferencial de precios al tabaco cigarros (100%)</option>
                  </select>
                  <button
                    onClick={agregarTributo}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <FaPlus />
                  </button>
                </div>

                {tributos.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-2">Tributos agregados:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tributos.map((tributo, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{tributo.codigo} - {tributo.descripcion}</div>
                            <div className="text-xs text-gray-600">${tributo.valor.toFixed(2)}</div>
                          </div>
                          <button
                            onClick={() => eliminarTributo(tributo.codigo)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 text-center">Resumen del Item</h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-gray-900">${subtotalSinDescuento.toFixed(2)}</span>
                  </div>
                  
                  {descuentoAplicado > 0 && (
                    <div className="flex justify-between py-2 border-t border-gray-100">
                      <span className="text-gray-700">Descuento:</span>
                      <span className="font-semibold text-gray-900">-${descuentoAplicado.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2 border-t border-gray-100">
                    <span className="text-gray-700">Subtotal con descuento:</span>
                    <span className="font-semibold text-gray-900">${subtotalConDescuento.toFixed(2)}</span>
                  </div>
                  
                  {tributos.map((tributo, index) => (
                    <div key={index} className="flex justify-between py-1">
                      <span className="text-sm text-gray-600">{tributo.codigo}: ${tributo.valor.toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between py-3 border-t border-gray-300 mt-2">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-blue-700">${total.toFixed(2)}</span>
                  </div>                  
                  <div className="text-xs text-blue-600 mt-2 text-center">
                    * Documento de Sujeto Excluido - Sin IVA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <button
            onClick={onBackToSelector}
            className="px-6 py-2.5 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Volver al Selector
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAgregarItem}
              className="px-8 py-2.5 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!!errorDescuento}
            >
              Agregar Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}