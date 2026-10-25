import FacturacionViewComplete from "./dteFactura.js";
import { API_BASE_URL } from "@/lib/api";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth";
import { checkAuthStatus } from "../../services/auth.js";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function FacturacionEscanerPageData() {
  await checkPermissionAndRedirect("DTE Factura (Escaner)", {
    allowAdministration: false
  });

  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  const user = await checkAuth(cookie);
  if (!user) redirect("/auth/login");

  const authStatus = await checkAuthStatus(cookie);
  const hasHaciendaToken = authStatus?.hasHaciendaToken ?? false;
  const haciendaStatus = authStatus?.haciendaStatus ?? null;

  let productos = [];
  let clientes = [];
  let sucursalData = null;

  try {
    const productosResponse = await fetch(`${API_BASE_URL}/productos/getAll`, {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
      cache: "no-store"
    });
    if (!productosResponse.ok) throw new Error("Error al obtener los productos");

    const productosData = await productosResponse.json();
    productos = Array.isArray(productosData)
      ? productosData
      : Array.isArray(productosData?.data)
      ? productosData.data
      : [];

    const clientesResponse = await fetch(`${API_BASE_URL}/clientes/getAllCli`, {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
      cache: "no-store"
    });
    if (clientesResponse.ok) {
      const clientesData = await clientesResponse.json();
      clientes = Array.isArray(clientesData)
        ? clientesData
        : Array.isArray(clientesData?.data)
        ? clientesData.data
        : [];
    }

    const sucursalId = authStatus?.user?.idsucursal;
    if (sucursalId) {
      const sucursalResponse = await fetch(`${API_BASE_URL}/sucursal/${sucursalId}`, {
        method: "GET",
        headers: { Cookie: cookie },
        credentials: "include",
        cache: "no-store"
      });
      if (sucursalResponse.ok) {
        const sucursalResult = await sucursalResponse.json();
        sucursalData = sucursalResult.data;
      }
    }
  } catch (error) {
    console.error("Error al obtener los datos de facturación:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <FacturacionViewComplete
        initialProductos={productos}
        initialClientes={clientes}
        user={user}
        sucursalUsuario={sucursalData}
        hasHaciendaToken={hasHaciendaToken}
        haciendaStatus={haciendaStatus}
        scannerMode
      />
    </Suspense>
  );
}
