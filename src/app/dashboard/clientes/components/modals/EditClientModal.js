"use client";
import { useState } from "react";
import Select from "react-select";
import { FaTimes } from "react-icons/fa";
import CancelConfirmModal from "./CancelConfirmModal";

export default function EditClientModal({
  show,
  onClose,
  onUpdate,
  formData,
  setFormData,
  hasChanges,
  codactividad,
  departamentos,
  municipios,
  tiposDocumento,
  LIMITES,
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const paises = [
    { codigo: "SV", nombre: "El Salvador" },
    { codigo: "US", nombre: "Estados Unidos" },
    { codigo: "GT", nombre: "Guatemala" },
    { codigo: "HN", nombre: "Honduras" },
    { codigo: "NI", nombre: "Nicaragua" },
    { codigo: "CR", nombre: "Costa Rica" },
  ];

  if (!show) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = "El nombre es obligatorio.";
    } else if (formData.nombre.length > LIMITES.NOMBRE) {
      newErrors.nombre = `El nombre no puede exceder los ${LIMITES.NOMBRE} caracteres.`;
    }

    // Si es Consumidor Final (tipo 37) - Solo validamos el nombre
    if (formData.tipodocumento === "37") {
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // Validaciones para persona jurídica
    if (!formData.personanatural) {
      if (!formData.nombrecomercial?.trim()) {
        newErrors.nombrecomercial = "El nombre comercial es obligatorio para personas jurídicas.";
      } else if (formData.nombrecomercial.length > LIMITES.NOMBRECOMERCIAL) {
        newErrors.nombrecomercial = `El nombre comercial no puede exceder los ${LIMITES.NOMBRECOMERCIAL} caracteres.`;
      }
    }

    // Validaciones según tipo de documento
    if (formData.personanatural) {
      if (formData.tipodocumento === "13" && !formData.dui) {
        newErrors.dui = "El DUI es obligatorio para personas naturales.";
      } else if (formData.tipodocumento === "13" && formData.dui && formData.dui.length !== 10) {
        newErrors.dui = "El DUI debe tener el formato correcto (00000000-0).";
      }
      
      if (formData.tipodocumento === "03" && !formData.pasaporte) {
        newErrors.pasaporte = "El pasaporte es obligatorio.";
      }
      
      if (formData.tipodocumento === "02" && !formData.carnetresidente) {
        newErrors.carnetresidente = "El carnet de residente es obligatorio.";
      }
    }
    
    if (formData.tipodocumento === "36" && !formData.nit) {
      newErrors.nit = "El NIT es obligatorio.";
    }

    // Validaciones comunes
    if (!formData.telefono?.trim()) {
      newErrors.telefono = "El teléfono es obligatorio.";
    } else if (formData.telefono.length !== 8 || !/^[2679]/.test(formData.telefono)) {
      newErrors.telefono = "El teléfono debe tener 8 dígitos y comenzar con 2, 6, 7 o 9.";
    }

    if (!formData.correo?.trim()) {
      newErrors.correo = "El correo es obligatorio.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        newErrors.correo = "El formato del correo no es válido.";
      }
    }

    // Validaciones de dirección
    if (formData.pais === "SV") {
      if (!formData.departamento?.trim()) {
        newErrors.departamento = "El departamento es obligatorio.";
      }
      if (!formData.municipio?.trim()) {
        newErrors.municipio = "El municipio es obligatorio.";
      }
    }
    
    if (!formData.complemento?.trim()) {
      newErrors.complemento = "La dirección es obligatoria.";
    }

    if (!formData.pais) {
      newErrors.pais = "El país es obligatorio.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onUpdate(e);
    }
  };

  const handleTipoPersonaChange = (isNatural) => {
    setFormData({
      ...formData,
      personanatural: isNatural,
      tipodocumento: isNatural ? "13" : "36",
      ...(isNatural 
        ? { 
            nrc: "",
            giro: "",
            carnetresidente: "",
            codactividad: "",
            descactividad: "",
            codactividad2: "",
            descactividad2: "",
            codactividad3: "",
            descactividad3: ""
          }
        : { 
            dui: "",
            pasaporte: "" 
          }
      ),
    });
    setErrors({});
  };

  const isConsumidorFinal = formData.tipodocumento === "37";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Editar Cliente</h3>
          <button
            onClick={() => {
              if (hasChanges()) setShowCancelConfirm(true);
              else onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Tipo de Persona - Oculto para Consumidor Final */}
          {!isConsumidorFinal && (
            <div className="flex items-center space-x-4 mb-4">
              <label className="text-sm font-medium text-gray-700">
                Tipo de Persona:
              </label>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="natural"
                  name="tipopersona"
                  value="natural"
                  checked={formData.personanatural === true}
                  onChange={() => handleTipoPersonaChange(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="natural" className="ml-1 text-sm text-gray-900">
                  Natural
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="juridica"
                  name="tipopersona"
                  value="juridica"
                  checked={formData.personanatural === false}
                  onChange={() => handleTipoPersonaChange(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="juridica" className="ml-1 text-sm text-gray-900">
                  Jurídica
                </label>
              </div>
            </div>
          )}

          {/* Tipo de Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={formData.tipodocumento}
              onChange={(e) => {
                const newTipo = e.target.value;
                if (newTipo === "37") {
                  setFormData({ 
                    ...formData, 
                    tipodocumento: newTipo,
                    personanatural: true 
                  });
                } else {
                  setFormData({ ...formData, tipodocumento: newTipo });
                }
                setErrors({});
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700"
              required
            >
              {tiposDocumento
                .filter(doc => {
                  if (doc.codigo === "37") return true;
                  if (formData.personanatural === undefined) return ["13", "03", "02", "36"].includes(doc.codigo);
                  return formData.personanatural 
                    ? ["13", "03", "02", "36"].includes(doc.codigo)
                    : ["36"].includes(doc.codigo);
                })
                .map((doc) => (
                  <option key={doc.codigo} value={doc.codigo}>
                    {doc.nombre}
                  </option>
                ))}
            </select>
          </div>

          {/* CONSUMIDOR FINAL - Solo nombre */}
          {isConsumidorFinal && (
            <>
              <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-4">
                <p className="text-sm text-green-800">
                  ✅ <strong>Consumidor Final</strong> - Solo se actualizará el nombre. Los demás datos permanecen nulos.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Consumidor Final *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    setErrors({ ...errors, nombre: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                    errors.nombre ? "border-red-500" : "border-gray-300"
                  }`}
                  maxLength={LIMITES.NOMBRE}
                  placeholder="Ej: Consumidor Final - Juan Pérez"
                  required
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>
            </>
          )}

          {/* CLIENTE NORMAL - Todos los campos */}
          {!isConsumidorFinal && (
            <>
              {/* DUI - Solo para persona natural con tipo 13 */}
              {formData.tipodocumento === "13" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DUI *
                  </label>
                  <input
                    type="text"
                    value={formData.dui || ""}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 8)
                        val = val.slice(0, 8) + "-" + val.slice(8, 9);
                      setFormData({ ...formData, dui: val });
                      setErrors({ ...errors, dui: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.dui ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={10}
                    placeholder="00000000-0"
                    required={formData.tipodocumento === "13"}
                  />
                  {errors.dui && <p className="text-red-500 text-xs mt-1">{errors.dui}</p>}
                </div>
              )}

              {/* Pasaporte - Solo para persona natural con tipo 03 */}
              {formData.tipodocumento === "03" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pasaporte *
                  </label>
                  <input
                    type="text"
                    value={formData.pasaporte || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z0-9]/g, "");
                      setFormData({ ...formData, pasaporte: value });
                      setErrors({ ...errors, pasaporte: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.pasaporte ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={LIMITES.PASAPORTE}
                    required={formData.tipodocumento === "03"}
                  />
                  {errors.pasaporte && <p className="text-red-500 text-xs mt-1">{errors.pasaporte}</p>}
                </div>
              )}

              {/* NIT - Cuando el tipo de documento es NIT */}
              {formData.tipodocumento === "36" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIT *
                  </label>
                  <input
                    type="text"
                    value={formData.nit || ""}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 8) {
                        val = val.slice(0, 4) + "-" + val.slice(4, 10) + "-" + val.slice(10, 11);
                      }
                      setFormData({ ...formData, nit: val });
                      setErrors({ ...errors, nit: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.nit ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={17}
                    placeholder="0000-000000-000-0"
                    required={formData.tipodocumento === "36"}
                  />
                  {errors.nit && <p className="text-red-500 text-xs mt-1">{errors.nit}</p>}
                </div>
              )}

              {/* Carnet de Residente - Solo para persona natural con tipo 02 */}
              {formData.tipodocumento === "02" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carnet de Residente *
                  </label>
                  <input
                    type="text"
                    value={formData.carnetresidente || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z0-9]/g, "");
                      setFormData({ ...formData, carnetresidente: value });
                      setErrors({ ...errors, carnetresidente: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.carnetresidente ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={LIMITES.CARNETRESIDENTE}
                    required={formData.tipodocumento === "02"}
                  />
                  {errors.carnetresidente && <p className="text-red-500 text-xs mt-1">{errors.carnetresidente}</p>}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre {formData.personanatural ? "(Persona Natural)" : "(Razón Social)"} *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({ ...formData, nombre: e.target.value });
                    setErrors({ ...errors, nombre: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                    errors.nombre ? "border-red-500" : "border-gray-300"
                  }`}
                  maxLength={LIMITES.NOMBRE}
                  required
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>

              {/* Nombre Comercial - Solo para persona jurídica */}
              {!formData.personanatural && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    value={formData.nombrecomercial}
                    onChange={(e) => {
                      setFormData({ ...formData, nombrecomercial: e.target.value });
                      setErrors({ ...errors, nombrecomercial: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.nombrecomercial ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={LIMITES.NOMBRECOMERCIAL}
                    required
                  />
                  {errors.nombrecomercial && <p className="text-red-500 text-xs mt-1">{errors.nombrecomercial}</p>}
                </div>
              )}

              {/* NRC - Solo para persona jurídica */}
              {!formData.personanatural && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NRC
                  </label>
                  <input
                    type="text"
                    value={formData.nrc || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setFormData({ ...formData, nrc: value });
                      setErrors({ ...errors, nrc: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.nrc ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={LIMITES.NRC}
                    placeholder="Número de Registro de Contribuyente"
                  />
                  {errors.nrc && <p className="text-red-500 text-xs mt-1">{errors.nrc}</p>}
                </div>
              )}

              {/* Teléfono y Correo Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, telefono: value });
                      setErrors({ ...errors, telefono: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.telefono ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={8}
                    placeholder="71234567"
                    required
                  />
                  {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Principal *
                  </label>
                  <input
                    type="email"
                    value={formData.correo || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, correo: e.target.value });
                      setErrors({ ...errors, correo: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.correo ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={LIMITES.CORREO}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                  {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo}</p>}
                </div>
              </div>

              {/* Correos secundarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Secundario
                  </label>
                  <input
                    type="email"
                    value={formData.correo2 || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, correo2: e.target.value });
                      setErrors({ ...errors, correo2: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.correo2 ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={LIMITES.CORREO}
                  />
                  {errors.correo2 && <p className="text-red-500 text-xs mt-1">{errors.correo2}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tercer Correo
                  </label>
                  <input
                    type="email"
                    value={formData.correo3 || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, correo3: e.target.value });
                      setErrors({ ...errors, correo3: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.correo3 ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={LIMITES.CORREO}
                  />
                  {errors.correo3 && <p className="text-red-500 text-xs mt-1">{errors.correo3}</p>}
                </div>
              </div>

              {/* País */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <select
                  value={formData.pais}
                  onChange={(e) => {
                    const selectedPais = paises.find(p => p.codigo === e.target.value);
                    const newState = {
                      ...formData,
                      pais: selectedPais ? selectedPais.codigo : "",
                      nombre_pais: selectedPais ? selectedPais.nombre : "",
                    };
                    if (selectedPais?.codigo !== "SV") {
                      newState.departamento = "";
                      newState.municipio = "";
                    }
                    setFormData(newState);
                    setErrors({ ...errors, pais: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                    errors.pais ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Seleccione un País</option>
                  {paises.map((pais) => (
                    <option key={pais.codigo} value={pais.codigo}>
                      {pais.nombre}
                    </option>
                  ))}
                </select>
                {errors.pais && <p className="text-red-500 text-xs mt-1">{errors.pais}</p>}
              </div>

              {/* Departamento y Municipio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento {formData.pais !== "SV" && "(Solo para El Salvador)"}
                  </label>
                  <select
                    value={formData.departamento}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        departamento: e.target.value,
                        municipio: "",
                      });
                      setErrors({ ...errors, departamento: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.departamento ? "border-red-500" : "border-gray-300"
                    }`}
                    required={formData.pais === "SV"}
                    disabled={formData.pais !== "SV"}
                  >
                    <option value="">Seleccione un Departamento</option>
                    {departamentos.map((dep) => (
                      <option key={dep.codigo} value={dep.codigo}>
                        {dep.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.departamento && <p className="text-red-500 text-xs mt-1">{errors.departamento}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipio {formData.pais !== "SV" && "(Solo para El Salvador)"}
                  </label>
                  <select
                    value={formData.municipio}
                    onChange={(e) => {
                      setFormData({ ...formData, municipio: e.target.value });
                      setErrors({ ...errors, municipio: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                      errors.municipio ? "border-red-500" : "border-gray-300"
                    }`}
                    required={formData.pais === "SV"}
                    disabled={!formData.departamento || formData.pais !== "SV"}
                  >
                    <option value="">Seleccione un Municipio</option>
                    {municipios
                      .filter(
                        (mun) => mun.departamento === formData.departamento
                      )
                      .map((mun) => (
                        <option key={mun.codigo} value={mun.codigo}>
                          {mun.nombre}
                        </option>
                      ))}
                  </select>
                  {errors.municipio && <p className="text-red-500 text-xs mt-1">{errors.municipio}</p>}
                </div>
              </div>

              {/* Dirección / Complemento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección / Complemento *
                </label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => {
                    setFormData({ ...formData, complemento: e.target.value });
                    setErrors({ ...errors, complemento: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 text-gray-700 ${
                    errors.complemento ? "border-red-500" : "border-gray-300"
                  }`}
                  maxLength={LIMITES.COMPLEMENTO}
                  placeholder="Colonia, calle, número de casa, etc."
                  required
                />
                {errors.complemento && <p className="text-red-500 text-xs mt-1">{errors.complemento}</p>}
              </div>

              {/* Código de Actividad - Solo para persona jurídica */}
              {!formData.personanatural && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Actividad Principal *
                  </label>
                  <Select
                    options={codactividad.map((act) => ({
                      value: act.codigo,
                      label: `${act.codigo} - ${act.nombre}`,
                      nombre: act.nombre,
                    }))}
                    value={
                      formData.codactividad
                        ? {
                            value: formData.codactividad,
                            label: `${formData.codactividad} - ${formData.descactividad}`,
                          }
                        : null
                    }
                    onChange={(selected) => {
                      setFormData({
                        ...formData,
                        codactividad: selected ? selected.value : "",
                        descactividad: selected ? selected.nombre : "",
                      });
                      setErrors({ ...errors, codactividad: undefined });
                    }}
                    className="w-full text-gray-700"
                    placeholder="Seleccione una actividad económica"
                    required
                  />
                  {errors.codactividad && <p className="text-red-500 text-xs mt-1">{errors.codactividad}</p>}
                </div>
              )}

              {/* Actividades secundarias - Solo para persona jurídica */}
              {!formData.personanatural && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Actividad / Nombre 2 (Opcional)
                    </label>
                    <Select
                      options={codactividad.map((act) => ({
                        value: act.codigo,
                        label: `${act.codigo} - ${act.nombre}`,
                        nombre: act.nombre,
                      }))}
                      value={
                        formData.codactividad2
                          ? {
                              value: formData.codactividad2,
                              label: `${formData.codactividad2} - ${formData.descactividad2}`,
                            }
                          : null
                      }
                      onChange={(selected) => {
                        setFormData({
                          ...formData,
                          codactividad2: selected ? selected.value : "",
                          descactividad2: selected ? selected.nombre : "",
                        });
                      }}
                      isClearable
                      className="w-full text-gray-700"
                      placeholder="Seleccione una actividad económica"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Actividad / Nombre 3 (Opcional)
                    </label>
                    <Select
                      options={codactividad.map((act) => ({
                        value: act.codigo,
                        label: `${act.codigo} - ${act.nombre}`,
                        nombre: act.nombre,
                      }))}
                      value={
                        formData.codactividad3
                          ? {
                              value: formData.codactividad3,
                              label: `${formData.codactividad3} - ${formData.descactividad3}`,
                            }
                          : null
                      }
                      onChange={(selected) => {
                        setFormData({
                          ...formData,
                          codactividad3: selected ? selected.value : "",
                          descactividad3: selected ? selected.nombre : "",
                        });
                      }}
                      isClearable
                      className="w-full text-gray-700"
                      placeholder="Seleccione una actividad económica"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                if (hasChanges()) setShowCancelConfirm(true);
                else onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Actualizar
            </button>
          </div>
        </form>

        {/* Modal de confirmación de cancelación */}
        {showCancelConfirm && (
          <CancelConfirmModal
            show={showCancelConfirm}
            onClose={() => setShowCancelConfirm(false)}
            onConfirm={() => {
              setShowCancelConfirm(false);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}