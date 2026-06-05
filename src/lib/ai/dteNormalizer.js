// lib/ai/dteNormalizer.js
// La IA SOLO hace cambios de TIPO, NUNCA de valor

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function normalizeDTE(dte) {
  if (process.env.GROQ_API_KEY) {
    try {
      return await normalizeWithGroq(dte);
    } catch (error) {
      console.error('Groq failed:', error);
      return localNormalizer(dte);
    }
  }
  return localNormalizer(dte);
}

async function normalizeWithGroq(dte) {
  const prompt = `Eres un asistente que SOLO limpia TIPOS de datos en JSON de facturas (DTE).

REGLAS ESTRICTAS - SOLO PUEDES HACER ESTO:
1. Convertir uniMedida a string si viene como número (ej: 99 → "99", 59 → "59")
   - NUNCA convertir "KG", "Litro", "Unidad" u otros textos a códigos numéricos
   - Si uniMedida ya es string, NO LO TOQUES

2. Convertir strings numéricos a números (ej: "100.50" → 100.50, "5" → 5)
   - Solo si el string contiene SOLO números y punto decimal

3. Strings vacíos "" convertirlos a null

4. Si existe pagos y es null, convertirlo a []
   - Si no existe pagos, NO lo crees

5. Buscar sello_recepcion en cualquier lugar y ponerlo en la raíz como "sello_recepcion"
   - Buscar en: SelloRecibido, selloRecibido, selloRecepcion.selloRecibido, responseMH.selloRecibido
   - Solo reubicar, NUNCA cambiar el valor

REGLAS PROHIBIDAS - NUNCA HAGAS ESTO:
- NUNCA convertir unidades de medida (KG → 34, Litro → 23, etc.)
- NUNCA completar campos faltantes
- NUNCA cambiar montos, precios, cantidades o impuestos
- NUNCA crear productos o clasificar compras
- NUNCA inferir nada que no esté explícito

Devuelve JSON con:
{
  "normalized": { /* JSON con SOLO cambios de tipo */ },
  "cambios": [ "lista de cambios que hiciste" ]
}

JSON original:
${JSON.stringify(dte, null, 2)}`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: 'Eres un asistente que SOLO limpia tipos de datos. Nunca conviertes unidades de medida. Nunca cambias valores numéricos.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function localNormalizer(dte) {
  const normalized = JSON.parse(JSON.stringify(dte));
  const cambios = [];

  // 1. uniMedida: solo número a string, NUNCA convertir texto
  if (normalized.cuerpoDocumento) {
    normalized.cuerpoDocumento = normalized.cuerpoDocumento.map((item, idx) => {
      const nuevo = { ...item };
      
      if (typeof nuevo.uniMedida === 'number') {
        nuevo.uniMedida = String(nuevo.uniMedida);
        cambios.push(`Item ${idx + 1}: uniMedida ${item.uniMedida} → "${nuevo.uniMedida}" (número a string)`);
      }
      // Si ya es string, NO lo toques (aunque sea "KG", "Litro", etc.)
      
      if (typeof nuevo.cantidad === 'string' && !isNaN(parseFloat(nuevo.cantidad)) && isFinite(nuevo.cantidad)) {
        const original = nuevo.cantidad;
        nuevo.cantidad = parseFloat(nuevo.cantidad);
        cambios.push(`Item ${idx + 1}: cantidad "${original}" → ${nuevo.cantidad}`);
      }
      
      if (typeof nuevo.precioUni === 'string' && !isNaN(parseFloat(nuevo.precioUni)) && isFinite(nuevo.precioUni)) {
        const original = nuevo.precioUni;
        nuevo.precioUni = parseFloat(nuevo.precioUni);
        cambios.push(`Item ${idx + 1}: precioUni "${original}" → ${nuevo.precioUni}`);
      }
      
      return nuevo;
    });
  }

  // 2. Buscar sello
  let sello = null;
  if (dte.SelloRecibido) sello = dte.SelloRecibido;
  else if (dte.selloRecibido) sello = dte.selloRecibido;
  else if (dte.selloRecepcion?.selloRecibido) sello = dte.selloRecepcion.selloRecibido;
  else if (dte.responseMH?.selloRecibido) sello = dte.responseMH.selloRecibido;
  
  if (sello) {
    normalized.sello_recepcion = sello;
    cambios.push(`sello_recepcion: extraído y movido a la raíz`);
  }

  // 3. Pagos: null a []
  if (normalized.resumen?.pagos === null) {
    normalized.resumen.pagos = [];
    cambios.push(`pagos: null → []`);
  }

  // 4. Strings vacíos a null
  const cleanEmpties = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const key in obj) {
      if (obj[key] === '') {
        obj[key] = null;
        cambios.push(`${path}${key}: "" → null`);
      } else if (typeof obj[key] === 'object') {
        cleanEmpties(obj[key], `${path}${key}.`);
      }
    }
  };
  cleanEmpties(normalized);

  return { normalized, cambios };
}