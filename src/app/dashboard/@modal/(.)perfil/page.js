// src/app/dashboard/@modal/(.)perfil/page.js
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import PerfilEmpleado from "../../perfil/perfilEmpleado";
import { API_BASE_URL } from "@/lib/api";

export const revalidate = 0;
console.log("[INTERCEPT]");

// ✅ Espera cookies() antes de usarlas (Next 15: APIs dinámicas son async)
async function buildCookieHeader() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  return all.map(c => `${c.name}=${c.value}`).join("; ");
}

async function fetchPerfil(cookieHeader) {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/perfil`
    : `${API_BASE_URL}/perfil`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    credentials: "include",
  });

  if (res.status === 401) redirect("/auth/login");
  if (!res.ok) throw new Error(`Error ${res.status} al obtener el perfil`);

  return res.json();
}

export default async function PerfilInterceptModal() {
  let perfil = null;

  try {
    const cookieHeader = await buildCookieHeader(); // ✅ ahora con await
    perfil = await fetchPerfil(cookieHeader);
  } catch (e) {
    console.error("[perfil/intercept] No se pudo obtener el perfil:", e);

    // 🔒 No rompas la UI: muestra el shell del modal con un mensaje de error
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-[101] w-full max-w-2xl rounded-lg bg-white shadow-xl p-4">
          <p className="text-red-600">No se pudo cargar el perfil. Intenta nuevamente.</p>
        </div>
      </div>
    );
  }

  const canEdit = String(perfil?.rol ?? "").toLowerCase() === "admin";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-[101] w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <Suspense fallback={<div className="p-4">Cargando perfil…</div>}>
          <PerfilEmpleado asModal initialData={perfil} canEdit={canEdit} />
        </Suspense>
      </div>
    </div>
  );
}