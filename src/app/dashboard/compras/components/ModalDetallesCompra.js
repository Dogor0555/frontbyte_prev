"use client";
import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaSearch, FaTrash, FaDollarSign, FaBox } from "react-icons/fa";

export default function ModalDetallesCompra({
  isOpen,
  onClose,
  onAddDetalles,
  productosCargados = [],
  cargandoProductos = false,
  errorCargaProductos = null,
  proveedorSeleccionado = null
}) {
  const [detalles, setDetalles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [productosDelProveedor, setProductosDelProveedor] = useState([]);

  useEffect(() => {
    if (!productosCargados || !Array.isArray(productosCargados)) return;
    
    if (proveedorSeleccionado) {
      const productosFiltrados = productosCargados.filter(
        producto => producto.idproveedor === parseInt(proveedorSeleccionado)
      );
      setProductosDelProveedor(productosFiltrados);
    } else {
      setProductosDelProveedor(productosCargados);
    }
  }, [productosCargados, proveedorSeleccionado]);

  useEffect(() => {
    if (!productosDelProveedor || !Array.isArray(productosDelProveedor)) return;
    
    if (searchTerm.trim() === "") {
      setProductosFiltrados([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtrados = productosDelProveedor.filter(producto =>
      producto.nombre.toLowerCase().includes(term) ||
      producto.codigo.toLowerCase().includes(term)
    );
    
    setProductosFiltrados(filtrados);
  }, [searchTerm, productosDelProveedor]);

  useEffect(() => {
    if (productoSeleccionado) {
      setPrecioUnitario(productoSeleccionado.precio || "");
      setCantidad(1);
    }
  }, [productoSeleccionado]);

  const limpiarFormulario = () => {
    setProductoSeleccionado(null);
    setSearchTerm("");
    setCantidad(1);
    setPrecioUnitario("");
  };

  const handleClose = () => {
    limpiarFormulario();
    setDetalles([]);
    onClose();
  };

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      alert("Por favor seleccione un producto");
      return;
    }

    if (!cantidad || cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    if (!precioUnitario || parseFloat(precioUnitario) <= 0) {
      alert("El precio unitario debe ser mayor a 0");
      return;
    }

    const subtotal = parseFloat(cantidad) * parseFloat(precioUnitario);
    
    const nuevoDetalle = {
      producto_id: productoSeleccionado.id,
      producto_nombre: productoSeleccionado.nombre,
      producto_codigo: productoSeleccionado.codigo,
      cantidad: parseFloat(cantidad),
      precio_unitario: parseFloat(precioUnitario),
      subtotal: subtotal,
      unidad: productoSeleccionado.unidad || "UNI"
    };

    setDetalles(prev => [...prev, nuevoDetalle]);
    limpiarFormulario();
  };

  const eliminarProducto = (index) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
  };

  const guardarDetalles = () => {
    if (detalles.length === 0) {
      alert("Agregue al menos un producto");
      return;
    }

    onAddDetalles(detalles);
    handleClose();
  };

  const calcularTotal = () => {
    return detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Agregar Detalles de Compra</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Buscar Producto</h3>
                
                {proveedorSeleccionado && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700">
                      Mostrando productos del proveedor seleccionado
                    </p>
                  </div>
                )}

                {!proveedorSeleccionado && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      No hay proveedor seleccionado. Mostrando todos los productos.
                    </p>
                  </div>
                )}

                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {searchTerm && (
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {cargandoProductos ? (
                      <div className="p-4 text-center text-gray-500">
                        Cargando productos...
                      </div>
                    ) : errorCargaProductos ? (
                      <div className="p-4 text-center text-red-500">
                        Error: {errorCargaProductos}
                      </div>
                    ) : productosFiltrados.length > 0 ? (
                      productosFiltrados.map((producto) => (
                        <div
                          key={producto.id}
                          className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                            productoSeleccionado?.id === producto.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => setProductoSeleccionado(producto)}
                        >
                          <div className="font-medium text-gray-900">{producto.nombre}</div>
                          <div className="text-sm text-gray-600 flex justify-between">
                            <span>Código: {producto.codigo}</span>
                            <span>Stock: {producto.stock || 0}</span>
                          </div>
                          {producto.proveedor_nombre && (
                            <div className="text-xs text-gray-500 mt-1">
                              Proveedor: {producto.proveedor_nombre}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron productos
                        {proveedorSeleccionado && (
                          <p className="text-xs mt-1">
                            Este proveedor no tiene productos asignados
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {productoSeleccionado && (
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Agregar: {productoSeleccionado.nombre}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={cantidad}
                          onChange={(e) => setCantidad(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio Unitario ($)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={precioUnitario}
                          onChange={(e) => setPrecioUnitario(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {precioUnitario && cantidad && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="text-sm text-green-700 text-center">
                          Subtotal: ${(parseFloat(cantidad) * parseFloat(precioUnitario)).toFixed(2)}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={agregarProducto}
                      className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <FaPlus className="mr-2" />
                      Agregar a la Lista
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Productos Agregados ({detalles.length})
                </h3>

                {detalles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaBox className="mx-auto text-3xl mb-2 text-gray-300" />
                    <p>No hay productos agregados</p>
                    <p className="text-sm">Busque y agregue productos del panel izquierdo</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {detalles.map((detalle, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{detalle.producto_nombre}</div>
                            <div className="text-sm text-gray-600">Código: {detalle.producto_codigo}</div>
                            <div className="text-sm text-gray-600">
                              {detalle.cantidad} x ${detalle.precio_unitario.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              ${detalle.subtotal.toFixed(2)}
                            </div>
                            <button
                              onClick={() => eliminarProducto(index)}
                              className="text-red-500 hover:text-red-700 mt-1"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detalles.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600 flex items-center">
                        <FaDollarSign className="mr-1" />
                        {calcularTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          
          <div className="space-x-3">
            <button
              onClick={() => setDetalles([])}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={detalles.length === 0}
            >
              Limpiar Todo
            </button>
            <button
              onClick={guardarDetalles}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={detalles.length === 0}
            >
              Guardar Detalles ({detalles.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}