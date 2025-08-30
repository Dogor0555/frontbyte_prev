// src/app/dashboard/perfil/page.js
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import PerfilEmpleado from "./perfilEmpleado";

// Evitar caché: siempre obtener el perfil más reciente
export const revalidate = 0;
console.log("[FALLBACK]");
/**
 * Construye el header "Cookie" con todas las cookies recibidas en SSR.
 */
function buildCookieHeader() {
  const cookieStore = cookies(); // síncrono en App Router
  const raw = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return raw;
}

/**
 * Obtiene el perfil desde la API del backend.
 * - Devuelve { perfil }
 * - Lanza redirect a /auth/login si 401
 */
async function fetchPerfil(cookieHeader) {
  const res = await fetch("http://localhost:3000/perfil", {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    // Nota: credentials es irrelevante en fetch SSR, pero lo dejamos explícito
    credentials: "include",
  });

  if (res.status === 401) {
    redirect("/auth/login");
  }

  if (!res.ok) {
    throw new Error(`Error ${res.status} al obtener el perfil`);
  }

  const data = await res.json();
  return { perfil: data };
}

export default async function PerfilPage() {
  // 1) Cookies de sesión para el backend
  const cookieHeader = buildCookieHeader();

  // 2) Traer perfil (y por ende el rol)
  let perfil = null;
  try {
    const { perfil: p } = await fetchPerfil(cookieHeader);
    perfil = p;
  } catch (e) {
    console.error("[perfil/page] No se pudo obtener el perfil:", e);
    // Redirige a una vista de error genérica de tu app
    redirect("/dashboard/error");
  }

  // 3) Permisos
  const canEdit = String(perfil?.rol ?? "").toLowerCase() === "admin";

  // 4) Render: SOLO MONTAMOS EL MODAL (sin página "debajo")
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Cargando perfil…</div>}>
      <PerfilEmpleado perfil={perfil} canEdit={canEdit} />
    </Suspense>
  );
}
