"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFilePdf,
  FaEye,
  FaChevronDown,
  FaPalette,
  FaUndo,
  FaToggleOn,
  FaToggleOff,
  FaUpload,
  FaImage,
  FaTrash
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import React from 'react';
import { API_BASE_URL } from "@/lib/api";

const API_BASE = `${API_BASE_URL}`;

export default function ConfigurarPdf({ 
  configuracionPdf, 
  sucursal, 
  user, 
  hasHaciendaToken, 
  haciendaStatus 
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [logoHasChanged, setLogoHasChanged] = useState(false);
  const [form, setForm] = useState({
    seccion_venta_terceros: true,
    seccion_otros_documentos: true,
    seccion_documentos_relacionados: true,
    seccion_responsables: true,
    campo_observaciones: true,
    campo_nombre_comercial_emisor: true,
    campo_nombre_comercial_receptor: true,
    campo_tipo_establecimiento: true,
    campo_actividad_economica_receptor: true,
    campo_telefono_emisor: true,
    campo_telefono_receptor: true,
    campo_correo_emisor: true,
    campo_correo_receptor: true,
    campo_sello_recepcion: true,
    campo_modelo_facturacion: true,
    campo_tipo_transmision: true,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    if (configuracionPdf) {
      setForm({
        seccion_venta_terceros: configuracionPdf.seccion_venta_terceros !== false,
        seccion_otros_documentos: configuracionPdf.seccion_otros_documentos !== false,
        seccion_documentos_relacionados: configuracionPdf.seccion_documentos_relacionados !== false,
        seccion_responsables: configuracionPdf.seccion_responsables !== false,
        campo_observaciones: configuracionPdf.campo_observaciones !== false,
        campo_nombre_comercial_emisor: configuracionPdf.campo_nombre_comercial_emisor !== false,
        campo_nombre_comercial_receptor: configuracionPdf.campo_nombre_comercial_receptor !== false,
        campo_tipo_establecimiento: configuracionPdf.campo_tipo_establecimiento !== false,
        campo_actividad_economica_receptor: configuracionPdf.campo_actividad_economica_receptor !== false,
        campo_telefono_emisor: configuracionPdf.campo_telefono_emisor !== false,
        campo_telefono_receptor: configuracionPdf.campo_telefono_receptor !== false,
        campo_correo_emisor: configuracionPdf.campo_correo_emisor !== false,
        campo_correo_receptor: configuracionPdf.campo_correo_receptor !== false,
        campo_sello_recepcion: configuracionPdf.campo_sello_recepcion !== false,
        campo_modelo_facturacion: configuracionPdf.campo_modelo_facturacion !== false,
        campo_tipo_transmision: configuracionPdf.campo_tipo_transmision !== false,
      });
    }
  }, [configuracionPdf]);

  const loadUserLogo = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingLogo(true);
      const response = await fetch(`${API_BASE}/usuarios/getLogo/${user.id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        let logoSrc = null; // Inicializar como null

        if (data.logo) {
          let tempSrc = data.logo;
          if (typeof tempSrc === 'string' && tempSrc.startsWith('data:image/')) {
            logoSrc = tempSrc;
          } 
          else if (typeof tempSrc === 'object' && tempSrc.type === 'Buffer' && Array.isArray(tempSrc.data)) {
            logoSrc = String.fromCharCode.apply(null, new Uint8Array(tempSrc.data));
          }
        }
        setLogoPreview(logoSrc); // Asignar el resultado final (puede ser null)
      } else if (response.status !== 404) {
        const errorData = await response.json();
        console.error("Error al cargar logo:", errorData);
      }
    } catch (err) {
      console.error("Error al cargar logo:", err);
    } finally {
      setLoadingLogo(false);
    }
  };

  useEffect(() => {
    loadUserLogo();
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!configuracionPdf) return true;
    
    return (
      form.seccion_venta_terceros !== (configuracionPdf.seccion_venta_terceros !== false) ||
      form.seccion_otros_documentos !== (configuracionPdf.seccion_otros_documentos !== false) ||
      form.seccion_documentos_relacionados !== (configuracionPdf.seccion_documentos_relacionados !== false) ||
      form.seccion_responsables !== (configuracionPdf.seccion_responsables !== false) ||
      form.campo_observaciones !== (configuracionPdf.campo_observaciones !== false) ||
      form.campo_nombre_comercial_emisor !== (configuracionPdf.campo_nombre_comercial_emisor !== false) ||
      form.campo_nombre_comercial_receptor !== (configuracionPdf.campo_nombre_comercial_receptor !== false) ||
      form.campo_tipo_establecimiento !== (configuracionPdf.campo_tipo_establecimiento !== false) ||
      form.campo_actividad_economica_receptor !== (configuracionPdf.campo_actividad_economica_receptor !== false) ||
      form.campo_telefono_emisor !== (configuracionPdf.campo_telefono_emisor !== false) ||
      form.campo_telefono_receptor !== (configuracionPdf.campo_telefono_receptor !== false) ||
      form.campo_correo_emisor !== (configuracionPdf.campo_correo_emisor !== false) ||
      form.campo_correo_receptor !== (configuracionPdf.campo_correo_receptor !== false) ||
      form.campo_sello_recepcion !== (configuracionPdf.campo_sello_recepcion !== false) ||
      form.campo_modelo_facturacion !== (configuracionPdf.campo_modelo_facturacion !== false) ||
      form.campo_tipo_transmision !== (configuracionPdf.campo_tipo_transmision !== false)
    );
  }, [form, configuracionPdf]);

  const canSubmit = useMemo(() => {
    if (saving) return false;
    return hasChanges || logoHasChanged;
  }, [saving, hasChanges, logoHasChanged]);

  function validate() {
    setError("");
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setSaving(true);
      setError("");
      setOkMsg("");
      
      const url = `${API_BASE}/configuracion-pdf/current`;
      const method = 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || data?.message || "No se pudo guardar la configuración.");
        return;
      }

      setOkMsg("Configuración de PDF actualizada correctamente");
      setLogoHasChanged(false);
      
    } catch (err) {
      console.error("[configurar-pdf] Error al guardar:", err);
      setError("Error de red al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Por favor, selecciona un archivo de imagen válido.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen debe ser menor a 2MB.");
      return;
    }

    try {
      setUploadingLogo(true);
      setError("");

      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
  
      const base64Reader = new FileReader();
      base64Reader.onload = async (e) => {
        const base64WithPrefix = e.target.result;

        const response = await fetch(`${API_BASE}/usuarios/updateLogo/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ logo: base64WithPrefix })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Error al actualizar el logo.");
        }

        setOkMsg("Logo actualizado correctamente");
        setLogoHasChanged(true);
        
        await loadUserLogo();
      };
      base64Reader.readAsDataURL(file);
  
    } catch (err) {
      console.error("[configurar-pdf] Error al subir logo:", err);
      setError(err.message || "Error al subir el logo.");
      await loadUserLogo();
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    try {
      setUploadingLogo(true);
      setError("");

      const response = await fetch(`${API_BASE}/usuarios/updateLogo/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ logo: "" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error al eliminar el logo.");
      }

      setLogoPreview(null);
      setLogoHasChanged(true);
      setOkMsg("Logo eliminado correctamente");
      
    } catch (err) {
      console.error("[configurar-pdf] Error al eliminar logo:", err);
      setError(err.message || "Error al eliminar el logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetToDefaults = () => {
    setForm({
      seccion_venta_terceros: true,
      seccion_otros_documentos: true,
      seccion_documentos_relacionados: true,
      seccion_responsables: true,
      campo_observaciones: true,
      campo_nombre_comercial_emisor: true,
      campo_nombre_comercial_receptor: true,
      campo_tipo_establecimiento: true,
      campo_actividad_economica_receptor: true,
      campo_telefono_emisor: true,
      campo_telefono_receptor: true,
      campo_correo_emisor: true,
      campo_correo_receptor: true,
      campo_sello_recepcion: true,
      campo_modelo_facturacion: true,
      campo_tipo_transmision: true,
    });
  };

  const toggleAllSection = (section) => {
    const sectionFields = {
      secciones: [
        'seccion_venta_terceros',
        'seccion_otros_documentos', 
        'seccion_documentos_relacionados',
        'seccion_responsables'
      ],
      campos_emisor: [
        'campo_nombre_comercial_emisor',
        'campo_telefono_emisor',
        'campo_correo_emisor'
      ],
      campos_receptor: [
        'campo_nombre_comercial_receptor',
        'campo_tipo_establecimiento',
        'campo_actividad_economica_receptor',
        'campo_telefono_receptor',
        'campo_correo_receptor'
      ],
      campos_generales: [
        'campo_observaciones',
        'campo_sello_recepcion',
        'campo_modelo_facturacion',
        'campo_tipo_transmision'
      ]
    };

    const fields = sectionFields[section];
    const allChecked = fields.every(field => form[field]);
    
    setForm(prev => {
      const newForm = { ...prev };
      fields.forEach(field => {
        newForm[field] = !allChecked;
      });
      return newForm;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex flex-1 h-full">
        <div
          className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
        >
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar 
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                  Configurar PDF
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                {sucursal ? `Sucursal: ${sucursal.nombre}` : 'Configuración de elementos visibles en documentos PDF'}
              </p>
            </div>

            {okMsg && (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-800 mb-6">
                <FaCheckCircle className="h-4 w-4" />
                <span className="text-sm">{okMsg}</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 mb-6">
                <FaExclamationTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 w-full max-w-full overflow-x-hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaFilePdf className="text-gray-600" /> Configuración de Elementos PDF
              </h2>

              {/* Sección de Logo */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaImage className="text-gray-500" /> Logo de la Empresa
                </h3>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-4">
                      El logo aparecerá en los documentos PDF generados. Formatos recomendados: PNG, JPG. Tamaño máximo: 2MB.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className={`inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium ${uploadingLogo ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}>
                        <FaUpload className="h-4 w-4" />
                        {uploadingLogo ? "Subiendo..." : "Seleccionar Logo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>

                      {logoPreview && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          disabled={uploadingLogo}
                          className={`inline-flex items-center gap-2 rounded border border-red-300 px-4 py-2 text-sm font-medium ${uploadingLogo ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-red-700 hover:bg-red-50'}`}
                        >
                          <FaTrash className="h-4 w-4" />
                          {uploadingLogo ? "Eliminando..." : "Eliminar Logo"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      {loadingLogo ? (
                        <div className="text-center text-gray-400">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                          <p className="text-xs">Cargando...</p>
                        </div>
                      ) : logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error("Error cargando la imagen del logo");
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <FaImage className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Sin logo</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Vista previa del logo
                    </p>
                  </div>
                </div>
              </div>

              {/* Secciones */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <FaEye className="text-gray-500" /> Secciones del Documento
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => toggleAllSection('secciones')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Alternar Todas
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToggleField 
                    name="seccion_venta_terceros" 
                    label="Sección Venta a Terceros" 
                    checked={form.seccion_venta_terceros} 
                    onChange={handleInputChange} 
                    help="Mostrar información de venta a terceros" 
                  />
                  <ToggleField 
                    name="seccion_otros_documentos" 
                    label="Sección Otros Documentos" 
                    checked={form.seccion_otros_documentos} 
                    onChange={handleInputChange} 
                    help="Mostrar sección de otros documentos relacionados" 
                  />
                  <ToggleField 
                    name="seccion_documentos_relacionados" 
                    label="Sección Documentos Relacionados" 
                    checked={form.seccion_documentos_relacionados} 
                    onChange={handleInputChange} 
                    help="Mostrar documentos asociados" 
                  />
                  <ToggleField 
                    name="seccion_responsables" 
                    label="Sección Responsables" 
                    checked={form.seccion_responsables} 
                    onChange={handleInputChange} 
                    help="Mostrar información de responsables" 
                  />
                </div>
              </div>

              {/* Campos del Emisor */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-gray-800">Campos del Emisor</h3>
                  <button 
                    type="button" 
                    onClick={() => toggleAllSection('campos_emisor')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Alternar Todos
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleField 
                    name="campo_nombre_comercial_emisor" 
                    label="Nombre Comercial" 
                    checked={form.campo_nombre_comercial_emisor} 
                    onChange={handleInputChange} 
                    help="Mostrar nombre comercial del emisor" 
                  />
                  <ToggleField 
                    name="campo_telefono_emisor" 
                    label="Teléfono" 
                    checked={form.campo_telefono_emisor} 
                    onChange={handleInputChange} 
                    help="Mostrar teléfono del emisor" 
                  />
                  <ToggleField 
                    name="campo_correo_emisor" 
                    label="Correo Electrónico" 
                    checked={form.campo_correo_emisor} 
                    onChange={handleInputChange} 
                    help="Mostrar correo del emisor" 
                  />
                </div>
              </div>

              {/* Campos del Receptor */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-gray-800">Campos del Receptor</h3>
                  <button 
                    type="button" 
                    onClick={() => toggleAllSection('campos_receptor')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Alternar Todos
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleField 
                    name="campo_nombre_comercial_receptor" 
                    label="Nombre Comercial" 
                    checked={form.campo_nombre_comercial_receptor} 
                    onChange={handleInputChange} 
                    help="Mostrar nombre comercial del receptor" 
                  />
                  <ToggleField 
                    name="campo_tipo_establecimiento" 
                    label="Tipo de Establecimiento" 
                    checked={form.campo_tipo_establecimiento} 
                    onChange={handleInputChange} 
                    help="Mostrar tipo de establecimiento" 
                  />
                  <ToggleField 
                    name="campo_actividad_economica_receptor" 
                    label="Actividad Económica" 
                    checked={form.campo_actividad_economica_receptor} 
                    onChange={handleInputChange} 
                    help="Mostrar actividad económica del receptor" 
                  />
                  <ToggleField 
                    name="campo_telefono_receptor" 
                    label="Teléfono" 
                    checked={form.campo_telefono_receptor} 
                    onChange={handleInputChange} 
                    help="Mostrar teléfono del receptor" 
                  />
                  <ToggleField 
                    name="campo_correo_receptor" 
                    label="Correo Electrónico" 
                    checked={form.campo_correo_receptor} 
                    onChange={handleInputChange} 
                    help="Mostrar correo del receptor" 
                  />
                </div>
              </div>

              {/* Campos Generales */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-gray-800">Campos Generales</h3>
                  <button 
                    type="button" 
                    onClick={() => toggleAllSection('campos_generales')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Alternar Todos
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleField 
                    name="campo_observaciones" 
                    label="Observaciones" 
                    checked={form.campo_observaciones} 
                    onChange={handleInputChange} 
                    help="Mostrar campo de observaciones" 
                  />
                  <ToggleField 
                    name="campo_sello_recepcion" 
                    label="Sello de Recepción" 
                    checked={form.campo_sello_recepcion} 
                    onChange={handleInputChange} 
                    help="Mostrar sello de recepción" 
                  />
                  <ToggleField 
                    name="campo_modelo_facturacion" 
                    label="Modelo de Facturación" 
                    checked={form.campo_modelo_facturacion} 
                    onChange={handleInputChange} 
                    help="Mostrar modelo de facturación" 
                  />
                  <ToggleField 
                    name="campo_tipo_transmision" 
                    label="Tipo de Transmisión" 
                    checked={form.campo_tipo_transmision} 
                    onChange={handleInputChange} 
                    help="Mostrar tipo de transmisión" 
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaPalette className="text-gray-600" /> Resumen de Configuración
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div><span className="font-medium">Logo:</span> {logoPreview ? "Configurado" : "No configurado"}</div>
                  <div><span className="font-medium">Secciones activas:</span> {
                    ['seccion_venta_terceros', 'seccion_otros_documentos', 'seccion_documentos_relacionados', 'seccion_responsables']
                      .filter(field => form[field]).length
                  }/4</div>
                  <div><span className="font-medium">Campos emisor:</span> {
                    ['campo_nombre_comercial_emisor', 'campo_telefono_emisor', 'campo_correo_emisor']
                      .filter(field => form[field]).length
                  }/3</div>
                  <div><span className="font-medium">Campos receptor:</span> {
                    ['campo_nombre_comercial_receptor', 'campo_tipo_establecimiento', 'campo_actividad_economica_receptor', 'campo_telefono_receptor', 'campo_correo_receptor']
                      .filter(field => form[field]).length
                  }/5</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => router.push("/dashboard")} className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Volver al Dashboard
                  </button>
                  <button type="button" onClick={resetToDefaults} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <FaUndo className="h-3 w-3" /> Restablecer
                  </button>
                </div>
                
                <button type="submit" disabled={!canSubmit} className={`inline-flex items-center gap-2 rounded px-6 py-2 text-sm font-medium ${canSubmit ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                  <FaSave /> {saving ? "Guardando..." : "Actualizar Configuración"}
                </button>
              </div>
            </form>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

function Label({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

function Help({ children }) {
  return <p className="text-xs text-gray-500 mt-1">{children}</p>;
}

function ToggleField({ name, label, checked, onChange, help }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <Label htmlFor={name}>{label}</Label>
        {help && <Help>{help}</Help>}
      </div>
      <button
        type="button"
        id={name}
        name={name}
        onClick={() => {
          const event = {
            target: {
              name,
              type: 'checkbox',
              checked: !checked
            }
          };
          onChange(event);
        }}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}