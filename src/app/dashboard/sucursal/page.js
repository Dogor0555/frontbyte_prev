// src/app/dashboard/sucursales/page.js
import Sucursales from "../sucursal/sucursales";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus, isAdmin } from "../../services/auth";

export default async function PageSucursales() {

  const cookieStore = await cookies();
  const cookie = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

  const session = await checkAuthStatus(cookie);   // <- devuelve { user: {...} }
  const u = session?.user;

  if (!u) {
    redirect("/auth/login");
  }

  if (!isAdmin(u)) {
    redirect("/dashboard/unauthorized");
  }


  // carga inicial
  let initial = { ok: true, data: [], meta: { total: 0, page: 1, limit: 10, pages: 1 } };
  try {
    const resp = await fetch("http://localhost:3000/sucursal/getAll?page=1&limit=10", {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
      cache: "no-store",
    });
    const json = await resp.json();
    initial = Array.isArray(json)
      ? { ok: true, data: json, meta: { total: json.length, page: 1, limit: 10, pages: 1 } }
      : json;
  } catch { /* deja initial vacío */ }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <Sucursales initialData={initial} user={u} cookieHeader={cookie} />
    </Suspense>
  );
}
