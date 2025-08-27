// src/app/dashboard/facturacion/page.js
import FacturacionViewComplete from "./dteFactura.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth";

export default async function FacturacionPage() {
  // Obtener las cookies del usuario (usando await)
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // Verificar la autenticación del lado del servidor
  const user = await checkAuth(cookie);

  // Si el usuario no está autenticado, redirigir al login
  if (!user) {
    redirect("/auth/login");
  }

  // Obtener los productos y clientes disponibles
  let productos = [];
  let clientes = [];

  try {
    // Obtener productos
    const productosResponse = await fetch("http://localhost:3000/productos/getAll", {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
      credentials: "include",
    });

    if (!productosResponse.ok) {
      throw new Error("Error al obtener los productos");
    }
    const productosData = await productosResponse.json();
    productos = productosData.data || productosData;

    // Obtener clientes (personas naturales)
    const clientesResponse = await fetch("http://localhost:3000/personasNaturales/getAll", {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
      credentials: "include",
    });

    if (!clientesResponse.ok) {
      throw new Error("Error al obtener los clientes");
    }
    const clientesData = await clientesResponse.json();
    clientes = clientesData.data || clientesData;
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
      <FacturacionViewComplete initialProductos={productos} initialClientes={clientes} user={user} />
    </Suspense>
  );
}