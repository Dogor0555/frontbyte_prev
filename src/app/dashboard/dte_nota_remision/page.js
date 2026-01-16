// src/app/dashboard/dte_nota_remision/page.js
import NotaRemisionView from "./dteNotaRemision.js";
import { API_BASE_URL } from "@/lib/api";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth";
import { checkAuthStatus } from "../../services/auth"; // 👈 mismo patrón que factura
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function NotaRemisionPage() {
  // Verificación de permisos
  await checkPermissionAndRedirect("DTE Nota de Remisión");

  // Obtener cookies
  const cookieStore = cookies();
  const cookie = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Autenticación SSR
  const user = await checkAuth(cookie);
  if (!user) {
    redirect("/auth/login");
  }

  // Obtener authStatus para sacar idsucursal
  const authStatus = await checkAuthStatus(cookie);

  // Datos iniciales
  let productos = [];
  let clientes = [];
  let sucursalData = null;

  try {
    // Productos
    const productosResponse = await fetch(`${API_BASE_URL}/productos/getAll`, {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
      cache: "no-store",
    });
    if (!productosResponse.ok) throw new Error("Error al obtener productos");
    productos = await productosResponse.json();

    // Clientes (Activos)
    const clientesResponse = await fetch(`${API_BASE_URL}/clientes/activos`, {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
      cache: "no-store",
    });
    if (!clientesResponse.ok) throw new Error("Error al obtener clientes");
    const clientesResult = await clientesResponse.json();
    clientes = clientesResult.data || [];

    // Sucursal
    const sucursalResponse = await fetch(
      `${API_BASE_URL}/sucursal/${authStatus.user.idsucursal}`,
      {
        method: "GET",
        headers: { Cookie: cookie },
        credentials: "include",
        cache: "no-store",
      }
    );
    if (sucursalResponse.ok) {
      const sucursalResult = await sucursalResponse.json();
      sucursalData = sucursalResult.data;
      console.log("Sucursal del usuario:", sucursalData);
    } else {
      console.error("Error al obtener datos de sucursal");
    }
  } catch (error) {
    console.error("Error al obtener datos:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <NotaRemisionView
        initialProductos={productos}
        initialClientes={clientes}
        user={user}
        sucursalUsuario={sucursalData} // 👈 igual que factura
      />
    </Suspense>
  );
}
