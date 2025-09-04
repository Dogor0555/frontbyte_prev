// src/app/dashboard/facturacion/page.js
import FacturacionViewComplete from "./dteFactura.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth"; // <-- ajusta la ruta si la tienes en otro lado

export default async function FacturacionPage() {
  // Leer cookies del request (SSR)
  const cookieStore = cookies(); // no es necesario 'await'
  const cookie = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Autenticación SSR
  const user = await checkAuth(cookie); // devuelve null si no hay sesión
  if (!user) {
    redirect("/auth/login");
  }

  // Cargar datos
  let productos = [];
  let clientes = [];

  try {
    // Productos
    const productosResponse = await fetch("http://localhost:3000/productos/getAll", {
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

    // Clientes
    const clientesResponse = await fetch("http://localhost:3000/clientes/getAllCli", {
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
  } catch (error) {
    console.error("Error al obtener los datos:", error);
  }

  // Pasar los datos al componente cliente
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <FacturacionViewComplete
        initialProductos={productos}
        initialClientes={clientes}
        user={user}
      />
    </Suspense>
  );
}
