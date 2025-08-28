// src/app/dashboard/perfil/page.js
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import PerfilEmpleado from "./perfilEmpleado";

/**
 * Construye el header Cookie con todas las cookies recibidas en SSR.
 */
async function buildCookieHeader() {
  const cookieStore = await cookies();
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
async function fetchPerfil(cookie) {
  const res = await fetch("http://localhost:3000/perfil", {
    method: "GET",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    cache: "no-store",
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
  const cookie = await buildCookieHeader();

  // 2) Traer perfil (y por ende el rol)
  let perfil = null;
  try {
    const { perfil: p } = await fetchPerfil(cookie);
    perfil = p;
  } catch (e) {
    console.error("[perfil/page] No se pudo obtener el perfil:", e);
    redirect("/dashboard/error"); // Ajusta según tu app
  }

  // 3) Permisos
  const canEdit = String(perfil?.rol ?? "").toLowerCase() === "admin";

  // 4) Render: SOLO MONTAMOS EL MODAL (sin página)
  return (
    <Suspense fallback={<div className="text-gray-500">Cargando perfil…</div>}>
      <PerfilEmpleado perfil={perfil} canEdit={canEdit} />
    </Suspense>
  );
}
