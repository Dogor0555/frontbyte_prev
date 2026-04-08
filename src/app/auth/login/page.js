"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { FaEye, FaEyeSlash, FaBuilding, FaEnvelope, FaLock } from "react-icons/fa";
import Image from "next/image";
import img from "../../images/factura.jpg";
import logo from "../../images/logoo.png";
import { useRouter } from "next/navigation";
import { login } from "../../services/auth";
import { API_BASE_URL } from "@/lib/api";

// Componente de input reutilizable
const InputField = ({ 
  id, 
  type, 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  autoComplete, 
  disabled,
  error,
  children 
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors text-sm" />
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required
        disabled={disabled}
        className={`
          w-full rounded-xl border-2 px-4 py-3 text-sm text-gray-900 
          placeholder-gray-400 outline-none transition-all duration-200
          ${Icon ? 'pl-10' : 'pl-4'}
          ${error 
            ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
            : 'border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100'
          }
          disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300
        `}
      />
      {children}
    </div>
    {error && (
      <p className="text-xs text-red-500 mt-1">
        {error}
      </p>
    )}
  </div>
);

// Componente de botón con loading state
const SubmitButton = ({ isLoading, children }) => (
  <button
    type="submit"
    disabled={isLoading}
    className="
      mt-2 w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 
      py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg
      transition-all duration-200 hover:from-blue-800 hover:to-blue-950 
      hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed 
      disabled:opacity-50 disabled:active:scale-100
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    "
  >
    {isLoading ? (
      <span className="flex items-center justify-center gap-3">
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Iniciando sesión...
      </span>
    ) : (
      children
    )}
  </button>
);

// Componente de alerta de error
const ErrorAlert = ({ message, onDismiss }) => (
  <div
    role="alert"
    aria-live="assertive"
    className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 shadow-sm"
  >
    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span className="flex-1">{message}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors">
        ✕
      </button>
    )}
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  // Cargar email guardado al montar el componente
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Validación en tiempo real
  const validateField = useCallback((field, value) => {
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) return "El correo es requerido";
      if (!emailRegex.test(value)) return "Correo electrónico inválido";
      return "";
    }
    if (field === "password") {
      if (!value) return "La contraseña es requerida";
      if (value.length < 4) return "La contraseña debe tener al menos 4 caracteres";
      return "";
    }
    return "";
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Limpiar error del campo al escribir
    if (fieldErrors[id]) {
      setFieldErrors(prev => ({ ...prev, [id]: "" }));
    }
    if (error) setError("");
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    const fieldError = validateField(id, value);
    setFieldErrors(prev => ({ ...prev, [id]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos antes de enviar
    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);
    
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      return;
    }

    setError("");
    
    startTransition(async () => {
      try {
        const result = await login(formData.email, formData.password);
        
        // Guardar email si "recordarme" está activado
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        
        // Guardar datos en localStorage
        if (result.empleado) {
          localStorage.setItem("empleado", JSON.stringify(result.empleado));
        }
        if (result.empresa) {
          localStorage.setItem("empresa", JSON.stringify(result.empresa));
          console.log("Empresa guardada:", result.empresa.nombre);
        }
        if (result.sucursal) {
          localStorage.setItem("sucursal", JSON.stringify(result.sucursal));
          console.log("Sucursal guardada:", result.sucursal.nombre);
        }
        
        router.push("/dashboard");
      } catch (err) {
        console.error("Error de autenticación:", err);
        setError(err.message || "Credenciales incorrectas. Verifica tu correo y contraseña.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-4 md:p-8">
      <div
        className="flex w-full max-w-5xl flex-col-reverse overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row"
        style={{ animation: "fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        {/* Columna izquierda: Formulario */}
        <div className="flex w-full flex-col justify-center px-6 py-8 md:w-1/2 md:px-10 lg:px-12">
          
          {/* Logo y título */}
          <div className="mb-8 flex items-center gap-3">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-0.5 shadow-md">
              <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
                <Image
                  src={logo}
                  alt="Logo Byte Fusion Soluciones"
                  fill
                  className="object-contain p-1.5"
                  priority
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Facturador Electrónico</p>
              <p className="text-xs text-gray-400">Byte Fusion Soluciones</p>
            </div>
          </div>

          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Alerta de error */}
          {error && (
            <ErrorAlert message={error} onDismiss={() => setError("")} />
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <InputField
              id="email"
              type="email"
              label="Correo electrónico"
              icon={FaEnvelope}
              placeholder="tu@empresa.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={isPending}
              error={fieldErrors.email}
            />

            <InputField
              id="password"
              type={showPassword ? "text" : "password"}
              label="Contraseña"
              icon={FaLock}
              placeholder="••••••••"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={isPending}
              error={fieldErrors.password}
            >
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </InputField>

            {/* Recordarme y link olvidé contraseña */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isPending}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="select-none text-sm text-gray-600">Recordarme</span>
              </label>
             
            </div>

            <SubmitButton isLoading={isPending}>
              Ingresar al facturador
            </SubmitButton>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            © 2025 Byte Fusion Soluciones · Versión 2.0
          </p>
        </div>

        {/* Columna derecha: Imagen con overlay mejorado */}
        <div className="relative h-64 w-full overflow-hidden md:h-auto md:w-1/2">
          <Image
            src={img}
            alt="Sistema de Facturación Electrónica"
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          {/* Overlay degradado mejorado */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          
          {/* Contenido sobre la imagen */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="mb-3 flex items-center gap-2">
              <FaBuilding className="text-blue-200 text-lg" />
              <span className="text-xs font-medium uppercase tracking-wider text-blue-200">
                Facturación Electrónica
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight text-white md:text-2xl">
              Emite y gestiona tus<br />facturas electrónicas
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100 md:text-base">
              Cumple con los requisitos del Ministerio de Hacienda<br />
              de manera simple, rápida y segura.
            </p>
            <div className="mt-4 flex gap-2">
              <div className="h-1 w-8 rounded-full bg-blue-400"></div>
              <div className="h-1 w-4 rounded-full bg-blue-300/50"></div>
              <div className="h-1 w-4 rounded-full bg-blue-300/50"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}