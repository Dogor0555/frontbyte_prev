import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaSearch, FaExclamationTriangle } from "react-icons/fa";

export default function ProductModal({
  isOpen,
  onClose,
  onAddItem,
  onBackToSelector,
  productosCargados,
  cargandoProductos,
  errorCargaProductos,
  unidades,
  obtenerNombreUnidad
}) {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [impuestoSeleccionado, setImpuestoSeleccionado] = useState("20");
  const [tipoVenta, setTipoVenta] = useState("1");
  const [tipoProducto, setTipoProducto] = useState("1");
  const [isMobile, setIsMobile] = useState(false);
  const [mostrarAlertaStock, setMostrarAlertaStock] = useState(false);
  const [stockDisponible, setStockDisponible] = useState(0);

  // Detectar si es móvil
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

  // Actualizar stock disponible cuando se selecciona un producto
  useEffect(() => {
    if (productoSeleccionado) {
      setStockDisponible(productoSeleccionado.stock || 0);
    } else {
      setStockDisponible(0);
    }
  }, [productoSeleccionado]);

  const limpiarFormulario = () => {
    setProductoSeleccionado(null);
    setSearchTerm("");
    setCantidad(1);
    setImpuestoSeleccionado("20");
    setTipoVenta("1");
    setMostrarAlertaStock(false);
    setStockDisponible(0);
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

  const calcularTotal = () => {
    if (!productoSeleccionado) return 0;
    
    const precio = parseFloat(productoSeleccionado.precio) || 0;
    const subtotal = cantidad * precio;
    const tasaImpuesto = impuestoSeleccionado === "20" ? 0.13 : impuestoSeleccionado === "21" ? 0.15 : 0;
    const impuesto = subtotal * tasaImpuesto;
    
    return subtotal;
  };

  const handleAgregarItem = () => {
    if (!productoSeleccionado) {
      alert("Por favor seleccione un producto");
      return;
    }

    // Verificar si es un servicio (no aplica control de stock)
    const esServicio = tipoProducto === "2" || tipoProducto === "3";
    
    // Verificar stock solo para productos (no servicios)
    if (!esServicio && productoSeleccionado.stock !== undefined && productoSeleccionado.stock !== null) {
      const stockSuficiente = cantidad <= productoSeleccionado.stock;
      
      if (!stockSuficiente) {
        // Mostrar alerta de stock insuficiente pero permitir continuar
        setMostrarAlertaStock(true);
        return;
      }
    }

    // Si pasa la validación de stock o es un servicio, proceder
    agregarItemConfirmado();
  };

  const agregarItemConfirmado = () => {
    let tipoItem;
    switch (tipoVenta) {
      case "1": 
        tipoItem = "producto";
        break;
      case "2": 
        tipoItem = "noAfecto";
        break;
      case "3":
        tipoItem = "noAfecto"; 
        break;
      default:
        tipoItem = "producto";
    }

    // Enviar información de stock para actualización posterior
    // SOLO para productos (tipoVenta = "1"), no para servicios
    const esServicio = tipoProducto === "2" || tipoProducto === "3";
    const necesitaActualizarStock = !esServicio && productoSeleccionado.id;
    
    onAddItem({
      descripcion: productoSeleccionado.nombre,
      cantidad: cantidad,
      precioUnitario: parseFloat(productoSeleccionado.precio) || 0,
      descuento: 0,
      unidadMedida: productoSeleccionado.unidad || "59",
      tipo: tipoItem,
      // Información adicional para actualizar stock posteriormente
      // SOLO se incluye si NO es un servicio
      productoId: !esServicio ? productoSeleccionado.id : null,
      actualizarStock: necesitaActualizarStock,
      stockAnterior: !esServicio ? productoSeleccionado.stock : null
    });
    
    limpiarFormulario();
  };

  const continuarSinStock = () => {
    setMostrarAlertaStock(false);
    agregarItemConfirmado();
  };

  const cancelarVentaSinStock = () => {
    setMostrarAlertaStock(false);
  };

  if (!isOpen) return null;

  const total = calcularTotal();
  const esServicio = tipoProducto === "2" || tipoProducto === "3";
  const stockInsuficiente = !esServicio && productoSeleccionado && 
                           productoSeleccionado.stock !== undefined && 
                           productoSeleccionado.stock !== null && 
                           cantidad > productoSeleccionado.stock;

  return (
    <div className="text-black fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      {/* Modal de alerta de stock insuficiente */}
      {mostrarAlertaStock && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-yellow-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold">Stock Insuficiente</h3>
            </div>
            
            <p className="text-gray-700 mb-4">
              El stock disponible es <span className="font-bold">{productoSeleccionado.stock}</span> unidades, 
              pero está intentando vender <span className="font-bold">{cantidad}</span> unidades.
            </p>
            
            <p className="text-gray-700 mb-6">
              ¿Desea continuar con la venta? El stock se actualizará al procesar la factura.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelarVentaSinStock}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={continuarSinStock}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold">Agregar Producto o Servicio</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Columna izquierda - Información básica del producto */}
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
              </div>

              {/* Cantidad y Unidad */}
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
                  <input
                    type="text"
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={productoSeleccionado ? obtenerNombreUnidad(productoSeleccionado.unidad) : "Unidad"}
                  />
                </div>
              </div>

              {/* Campos para nombre y precio (solo lectura) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre Producto</label>
                <input
                  type="text"
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={productoSeleccionado ? productoSeleccionado.nombre : ""}
                  placeholder="Seleccione un producto"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Precio</label>
                <input
                  type="text"
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={productoSeleccionado ? `$${parseFloat(productoSeleccionado.precio).toFixed(2)}` : "$0.00"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo Venta</label>
                <select 
                  value={tipoVenta}
                  onChange={(e) => setTipoVenta(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">Gravado</option>
                  <option value="2">Exento</option>
                  <option value="3">No sujeto</option>
                </select>
              </div>

              {/* Información de stock (solo para productos) */}
              {!esServicio && productoSeleccionado && productoSeleccionado.stock !== undefined && (
                <div className={`p-3 rounded-lg border ${
                  stockInsuficiente ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Stock disponible:</span>
                    <span className={`font-bold ${stockInsuficiente ? 'text-red-600' : 'text-blue-600'}`}>
                      {productoSeleccionado.stock}
                    </span>
                  </div>
                  {stockInsuficiente && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <FaExclamationTriangle className="mr-1" />
                      <span>Stock insuficiente - Se venderá en negativo</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Columna central - BUSCADOR DE PRODUCTOS */}
            <div className="space-y-5">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="font-semibold text-gray-900 text-lg">Buscar Producto</h3>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Seleccionar Producto
                  </label>
                  <span className="text-xs text-red-600">Requerido</span>
                </div>

                {/* Campo de búsqueda */}
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Escriba al menos 2 caracteres para buscar..."
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                  />
                </div>

                {cargandoProductos && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Cargando productos...</p>
                  </div>
                )}

                {errorCargaProductos && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="text-sm">Error: {errorCargaProductos}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-red-600 underline text-xs mt-1"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* Lista de productos filtrados */}
                {searchTerm.length >= 2 ? (
                  <div className="border border-gray-300 rounded-lg h-96 overflow-y-auto">
                    {productosCargados
                      .filter(producto =>
                        producto.nombre.toLowerCase().includes(searchTerm) ||
                        producto.codigo.toLowerCase().includes(searchTerm)
                      )
                      .map((producto) => (
                        <div
                          key={producto.id}
                          className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                            productoSeleccionado?.id === producto.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => setProductoSeleccionado(producto)}
                        >
                          <div className="font-medium text-gray-900">{producto.nombre}</div>
                          <div className="text-sm text-gray-600 flex justify-between mt-1">
                            <span>Código: {producto.codigo}</span>
                            <span className="font-semibold text-green-600">
                              ${parseFloat(producto.precio).toFixed(2)}
                            </span>
                          </div>
                          {producto.stock !== undefined && (
                            <div className="text-xs text-gray-500 mt-1">
                              Stock: {producto.stock}
                            </div>
                          )}
                        </div>
                      ))
                    }

                    {productosCargados.filter(producto =>
                      producto.nombre.toLowerCase().includes(searchTerm) ||
                      producto.codigo.toLowerCase().includes(searchTerm)
                    ).length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        <FaSearch className="mx-auto mb-2 text-2xl text-gray-400" />
                        <p>No se encontraron productos</p>
                        <p className="text-xs mt-1">con el término "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg h-96 bg-gray-50 flex items-center justify-center">
                    <div className="text-center text-gray-500 px-6">
                      <FaSearch className="mx-auto mb-4 text-4xl text-gray-300" />
                      <h4 className="text-lg font-medium text-gray-700 mb-2">Buscar Productos</h4>
                      <p className="text-sm mb-2">Escriba al menos 2 caracteres para comenzar la búsqueda</p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>• Puede buscar por nombre del producto</p>
                        <p>• O por código del producto</p>
                        <p>• Los resultados aparecerán automáticamente</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha - Información de tributos y totales */}
            <div className="space-y-5">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="font-semibold text-gray-900 text-lg">Información de tributos</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Impuesto:</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={impuestoSeleccionado}
                  onChange={(e) => setImpuestoSeleccionado(e.target.value)}
                >
                      <option value="20">20 - Impuesto al Valor Agregado 13%</option>
                      <option value="59">59 - Turismo: por alojamiento (5%)</option>
                      <option value="71">71 - Turismo: salida del país por vía aérea $7.00</option>
                      <option value="D1">D1 - FOVIAL ($0.20 Ctvs. por galón)</option>
                      <option value="C8">C8 - COTRANS ($0.10 Ctvs. por galón)</option>
                      <option value="D5">D5 - Otras tasas casos especiales</option>
                      <option value="D4">D4 - Otros impuestos casos especiales</option>
                      <option value="C5">C5 - Impuesto ad- valorem por diferencial de precios de Bebidas Alcohólicas (8%)</option>
                      <option value="C6">C6 - Impuesto ad- valorem por diferencial de precios al tabaco cigarrillos (39%)</option>
                      <option value="C7">C7 - Impuesto ad- valorem por diferencial de precios al tabaco cigarros (100%)</option>
                      <option value="19">19 - Fabricante de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulante</option>
                      <option value="28">28 - Importador de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante</option>
                      <option value="31">31 - Detallistas o Expendedores de Bebidas Alcohólicas</option>
                      <option value="32">32 - Fabricante de Cerveza</option>
                      <option value="33">33 - Importador de Cerveza</option>
                      <option value="34">34 - Fabricante de Productos de Tabaco</option>
                      <option value="35">35 - Importador de Productos de Tabaco</option>
                      <option value="36">36 - Fabricante de Armas de Fuego, Municiones y Artículos. Similares</option>
                      <option value="37">37 - Importador de Arma de Fueg,Munición y Artis. Simil</option>
                      <option value="38">38 - Fabricante de Explosivos</option>
                      <option value="39">39 - Importador de Explosivos</option>
                      <option value="42">42 - Fabricante de Productos Pirotécnicos</option>
                      <option value="43">43 - Importador de Productos Pirotécnicos</option>
                      <option value="44">44 - Productor de Tabaco</option>
                      <option value="50">50 - Distribuidor de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante</option>
                      <option value="51">51 - Bebidas Alcohólicas</option>
                      <option value="52">52 - Cerveza</option>
                      <option value="53">53 - Productos del Tabaco</option>
                      <option value="54">54 - Bebidas Carbonatadas o Gaseosas Simples o Endulzadas</option>
                      <option value="55">55 - Otros Específicos</option>
                      <option value="58">58 - Alcohol</option>
                      <option value="77">77 - Importador de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                      <option value="78">78 - Distribuidor de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                      <option value="79">79 - Sobre Llamadas Telefónicas Provenientes del Ext.</option>
                      <option value="85">85 - Detallista de Jugos, Néctares, Bebidas con Jugo и Refrescos</option>
                      <option value="86">86 - Fabricante de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas</option>
                      <option value="91">91 - Fabricante de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                      <option value="92">92 - Importador de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas</option>
                      <option value="A1">A1 - Específicos y Ad-valorem</option>
                      <option value="A5">A5 - Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulantes</option>
                      <option value="A7">A7 - Alcohol Etílico</option>
                      <option value="A9">A9 - Sacos Sintéticos</option>
                </select>
              </div>

              {/* Resumen de totales */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 text-center">Resumen del Item</h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Descuento:</span>
                    <span className="font-semibold text-gray-900">$0.00</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">IVA:</span>
                    <span className="font-semibold text-gray-900">
                      ${(total - (cantidad * (productoSeleccionado?.precio || 0))).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-blue-700">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del producto seleccionado */}
              {productoSeleccionado && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Producto Seleccionado</h4>
                  <p className="text-sm text-green-700">
                    <strong>{productoSeleccionado.nombre}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Código: {productoSeleccionado.codigo}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Tipo: {tipoVenta === "1" ? "Gravado" : tipoVenta === "2" ? "Exento" : "No sujeto"}
                  </p>
                  {!esServicio && productoSeleccionado.stock !== undefined && (
                    <p className="text-xs text-green-600 mt-1">
                      Stock: {productoSeleccionado.stock}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción - Ahora fijos en la parte inferior en móviles */}
        <div className={`bg-white border-t border-gray-200 p-4 ${
          isMobile ? "sticky bottom-0 shadow-md" : ""
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center mb-3 sm:mb-0 w-full sm:w-auto"
            >
              <FaTimes className="mr-2" />
              Cancelar
            </button>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={onBackToSelector}
                className="px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center w-full sm:w-auto"
              >
                Agregar Documentos
              </button>
              <button
                onClick={handleAgregarItem}
                className={`px-8 py-3 text-white font-semibold rounded-lg transition-colors flex items-center justify-center shadow-md w-full sm:w-auto ${
                  stockInsuficiente ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-700 hover:bg-blue-800'
                }`}
              >
                <FaPlus className="mr-2" />
                {stockInsuficiente ? 'Vender con stock negativo' : 'Agregar Item'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}