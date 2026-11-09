export function validarDistritoReceptor({ clientes, idReceptor, tipoDocumentoReceptor }) {
  if (!idReceptor) return null;

  const cliente = (Array.isArray(clientes) ? clientes : []).find(
    (item) => String(item.idcliente ?? item.id) === String(idReceptor)
  );
  if (!cliente) return null;
  if (String(tipoDocumentoReceptor || cliente.tipodocumento || "") === "37") return null;

  const pais = String(cliente.pais || "").trim().toUpperCase();
  if (pais && pais !== "SV") return null;
  if (String(cliente.distrito || "").trim()) return null;

  return `El cliente "${cliente.nombre || "seleccionado"}" no tiene distrito registrado. Ve a Clientes, edita su ficha y agrega el distrito antes de guardar el DTE.`;
}
