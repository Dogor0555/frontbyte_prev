"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

const EMPTY_CATALOGOS = {
  codactividad: [],
  departamentos: [],
  municipios: [],
  distritos: [],
  version: null,
};

export const getDepartamentoNombre = (departamentos, value) => {
  if (value == null || value === "") return "";
  if (typeof value === "object") return value.nombre ?? "";
  const codigo = String(value);
  return departamentos.find((item) => String(item.codigo) === codigo)?.nombre ?? codigo;
};

export const getMunicipioNombre = (municipios, departamento, value) => {
  if (value == null || value === "") return "";
  if (typeof value === "object") return value.nombre ?? "";
  const codigo = String(value);
  const departamentoCodigo = departamento == null
    ? ""
    : String(typeof departamento === "object" ? departamento.codigo : departamento);
  return municipios.find((item) =>
    String(item.codigo) === codigo &&
    (!departamentoCodigo || String(item.departamento) === departamentoCodigo)
  )?.nombre ?? codigo;
};

let cache = null;
let inFlight = null;

const fetchData = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }

  const body = await response.json();
  return {
    version: body?.version ?? null,
    data: Array.isArray(body?.data) ? body.data : [],
  };
};

const optional = (promise) => promise.catch(() => ({ version: null, data: [] }));

const loadCatalogos = async () => {
  if (cache) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const [actividades, departamentos, municipios, distritos] = await Promise.all([
      fetchData("/catalogos/actividades"),
      fetchData("/catalogos/departamentos"),
      fetchData("/catalogos/municipios"),
      optional(fetchData("/catalogos/distritos")),
    ]);

    const result = {
      codactividad: actividades.data,
      departamentos: departamentos.data,
      municipios: municipios.data,
      distritos: distritos.data,
      version: actividades.version,
    };

    cache = result;
    return result;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
};

export function useCatalogos() {
  const [state, setState] = useState(
    cache
      ? { ...cache, loading: false, error: null }
      : { ...EMPTY_CATALOGOS, loading: true, error: null }
  );

  useEffect(() => {
    let active = true;

    if (cache) return undefined;

    loadCatalogos()
      .then((data) => {
        if (active) {
          setState({ ...data, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            ...EMPTY_CATALOGOS,
            loading: false,
            error: error.message,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
