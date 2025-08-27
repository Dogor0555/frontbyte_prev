// src/app/dashboard/creditos/page.js
import CreditosView from "./creditos.js";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth";

export default async function CreditosPage() {
  // Verificar autenticación
  const cookieStore = cookies();
  const cookie = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const user = await checkAuth(cookie);
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <CreditosView />
    </Suspense>
  );
}