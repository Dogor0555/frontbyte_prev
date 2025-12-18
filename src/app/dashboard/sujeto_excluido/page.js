// src/app/sujeto-excluido/page.js
import SujetoExcluidoViewComplete from "./sujeto-excluido.js";
import { API_BASE_URL } from "@/lib/api";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth"; 
import { checkAuthStatus } from "../../services/auth";

export default async function SujetoExcluidoPage() {
  const cookieStore = cookies(); 
  const cookie = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const user = await checkAuth(cookie);
  if (!user) {
    redirect("/auth/login");
  }

  const authStatus = await checkAuthStatus(cookie);

  let productos = [];
  let clientes = [];
  let sucursalData = null;

  try {
    const productosResponse = await fetch(`${API_BASE_URL}/productos/getAll`, {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
      cache: "no-store",
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
      cache: "no-store",
    });

    if (clientesResponse.ok) {
      const clientesData = await clientesResponse.json();
      clientes = Array.isArray(clientesData)
        ? clientesData
        : Array.isArray(clientesData?.data)
        ? clientesData.data
        : [];
    }

    const sucursalResponse = await fetch(`${API_BASE_URL}/sucursal/${authStatus.user.idsucursal}`, {
      method: "GET",
      headers: { Cookie: cookie }, 
      credentials: "include",
      cache: "no-store",
    });

    if (sucursalResponse.ok) {
      const sucursalResult = await sucursalResponse.json();
      sucursalData = sucursalResult.data; 
      console.log("Sucursal del usuario:", sucursalData);
    } else {
      console.error("Error al obtener datos de sucursal");
    }
  } catch (error) {
    console.error("Error al obtener los datos:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <SujetoExcluidoViewComplete
        initialProductos={productos}
        initialClientes={clientes}
        user={user}
        sucursalUsuario={sucursalData}
      />
    </Suspense>
  );
}