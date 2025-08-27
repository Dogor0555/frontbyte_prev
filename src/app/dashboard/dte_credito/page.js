// src/app/dashboard/credito-fiscal/page.js
import CreditoFiscalViewComplete from "./dteCredito.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth";

export default async function CreditoFiscalPage() {
  // Obtener las cookies del usuario
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // Verificar autenticación
  const user = await checkAuth(cookie);
  if (!user) {
    redirect("/auth/login");
  }

  // Obtener productos y clientes (personas jurídicas)
  let productos = [];
  let clientesJuridicos = [];

  try {
    // Obtener productos
    const productosResponse = await fetch("http://localhost:3000/productos/getAll", {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
      credentials: "include",
    });

    if (!productosResponse.ok) throw new Error("Error al obtener productos");
    productos = await productosResponse.json();

    // Obtener personas jurídicas
    const clientesResponse = await fetch("http://localhost:3000/personasJuridicas/getAll", {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
      credentials: "include",
    });

    if (!clientesResponse.ok) throw new Error("Error al obtener clientes jurídicos");
    clientesJuridicos = await clientesResponse.json();
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
      <CreditoFiscalViewComplete 
        initialProductos={productos} 
        initialClientes={clientesJuridicos} 
        user={user} 
      />
    </Suspense>
  );
}