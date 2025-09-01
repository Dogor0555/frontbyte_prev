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
    
    // Asegurarnos de que productos sea un array
    if (Array.isArray(productosData)) {
      productos = productosData;
    } else if (productosData && Array.isArray(productosData.data)) {
      productos = productosData.data;
    } else {
      console.error("Formato de productos inesperado:", productosData);
      productos = [];
    }

    // Obtener clientes
    const clientesResponse = await fetch("http://localhost:3000/clientes/getAllCli", {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
      credentials: "include",
    });

    if (clientesResponse.ok) {
      const clientesData = await clientesResponse.json();
      
      // Asegurarnos de que clientes sea un array
      if (Array.isArray(clientesData)) {
        clientes = clientesData;
      } else if (clientesData && Array.isArray(clientesData.data)) {
        clientes = clientesData.data;
      } else {
        console.error("Formato de clientes inesperado:", clientesData);
        clientes = [];
      }
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
      <FacturacionViewComplete initialProductos={productos} initialClientes={clientes} user={user} />
    </Suspense>
  );
}