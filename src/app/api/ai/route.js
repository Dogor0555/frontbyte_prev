import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { dte } = await request.json();
    
    if (!dte) {
      return NextResponse.json({ 
        success: false, 
        error: 'No DTE data provided' 
      });
    }
    
    // Intentar normalizar con Groq
    let normalized = null;
    let usedAI = false;
    let warnings = [];
    
    if (process.env.GROQ_API_KEY) {
      try {
        const result = await normalizeWithGroq(dte);
        normalized = result.normalized;
        warnings = result.warnings || [];
        usedAI = true;
      } catch (groqError) {
        console.error('Groq error:', groqError.message);
        // Fallback al normalizador local
        const fallback = localNormalizer(dte);
        normalized = fallback.normalized;
        warnings = fallback.warnings;
      }
    } else {
      // Sin API key, usar normalizador local
      const fallback = localNormalizer(dte);
      normalized = fallback.normalized;
      warnings = fallback.warnings;
    }
    
    return NextResponse.json({ 
      success: true, 
      data: normalized,
      usedAI,
      warnings
    });
    
  } catch (error) {
    console.error('Normalization error:', error);
    // Devolver el original para que el sistema siga funcionando
    return NextResponse.json({ 
      success: false, 
      data: dte,
      error: error.message 
    });
  }
}

// ============== NORMALIZADOR CON GROQ ==============
async function normalizeWithGroq(dte) {
  const prompt = `Eres un asistente experto en normalización de DTE (Documentos Tributarios Electrónicos de El Salvador).

TAREA: Normaliza el siguiente JSON de factura electrónica siguiendo estas reglas ESTRICTAMENTE:

REGLAS QUE SÍ PUEDES HACER (SOLO LIMPIEZA):
1. Convertir uniMedida a string (ej: 99 → "99", "KG" → "34", "Litro" → "23")
2. Convertir strings numéricos a números ("100.50" → 100.50, "5" → 5)
3. Buscar sello_recepcion en cualquier lugar (SelloRecibido, selloRecibido, selloRecepcion.selloRecibido, responseMH.selloRecibido) y ponerlo en la raíz como "sello_recepcion"
4. Asegurar que pagos sea siempre un array (si es null → [], si es objeto → [objeto])
5. Campos vacíos "" convertirlos a null
6. Si falta fecha_emision, usar fecEmi o la fecha actual
7. Si falta numero_documento, usar numeroControl

REGLAS QUE NUNCA PUEDES HACER (MUY IMPORTANTE):
- NUNCA cambiar montos, precios, cantidades o impuestos
- NUNCA crear productos o materias primas
- NUNCA clasificar la compra (producto/gasto/materia prima)
- NUNCA tomar decisiones de negocio
- NUNCA modificar valores numéricos

Devuelve UN JSON con esta estructura exacta:
{
  "normalized": { /* el JSON normalizado */ },
  "warnings": [ /* lista de cambios que hiciste */ ]
}

JSON original:
${JSON.stringify(dte, null, 2)}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
          content: 'Eres un asistente que normaliza JSON de facturas. Solo respondes con JSON válido. Nunca modificas valores numéricos ni tomas decisiones de negocio.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Invalid JSON response from Groq');
  }
}

// ============== NORMALIZADOR LOCAL (FALLBACK) ==============
function localNormalizer(dte) {
  const normalized = JSON.parse(JSON.stringify(dte));
  const warnings = [];
  
  // 1. Normalizar cuerpoDocumento
  if (normalized.cuerpoDocumento && Array.isArray(normalized.cuerpoDocumento)) {
    normalized.cuerpoDocumento = normalized.cuerpoDocumento.map((item, idx) => {
      const nuevo = { ...item };
      
      // uniMedida a string
      if (nuevo.uniMedida !== undefined && nuevo.uniMedida !== null) {
        const original = nuevo.uniMedida;
        nuevo.uniMedida = String(nuevo.uniMedida);
        if (original !== nuevo.uniMedida) {
          warnings.push(`Item ${idx + 1}: uniMedida convertido de "${original}" a "${nuevo.uniMedida}"`);
        }
      }
      
      // cantidad a número
      if (typeof nuevo.cantidad === 'string' && nuevo.cantidad !== '') {
        const original = nuevo.cantidad;
        nuevo.cantidad = parseFloat(nuevo.cantidad);
        warnings.push(`Item ${idx + 1}: cantidad convertido de "${original}" a ${nuevo.cantidad}`);
      }
      
      // precioUni a número
      if (typeof nuevo.precioUni === 'string' && nuevo.precioUni !== '') {
        const original = nuevo.precioUni;
        nuevo.precioUni = parseFloat(nuevo.precioUni);
        warnings.push(`Item ${idx + 1}: precioUni convertido de "${original}" a ${nuevo.precioUni}`);
      }
      
      return nuevo;
    });
  }
  
  // 2. Extraer sello_recepcion de cualquier lugar
  let sello = null;
  if (dte.SelloRecibido) sello = dte.SelloRecibido;
  else if (dte.selloRecibido) sello = dte.selloRecibido;
  else if (dte.sello_recepcion) sello = dte.sello_recepcion;
  else if (dte.selloRecepcion?.selloRecibido) sello = dte.selloRecepcion.selloRecibido;
  else if (dte.responseMH?.selloRecibido) sello = dte.responseMH.selloRecibido;
  else if (dte.respuestaHacienda?.selloRecibido) sello = dte.respuestaHacienda.selloRecibido;
  
  if (sello) {
    normalized.sello_recepcion = sello;
    warnings.push(`Sello de recepción extraído: ${sello.substring(0, 20)}...`);
  }
  
  // 3. Normalizar pagos
  if (normalized.resumen) {
    if (!normalized.resumen.pagos || normalized.resumen.pagos === null) {
      normalized.resumen.pagos = [];
      warnings.push('Pagos convertido de null a array vacío');
    }
    if (normalized.resumen.pagos && !Array.isArray(normalized.resumen.pagos)) {
      normalized.resumen.pagos = [normalized.resumen.pagos];
      warnings.push('Pagos convertido de objeto a array');
    }
  }
  
  // 4. Limpiar strings vacíos
  const cleanEmptyStrings = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      if (obj[key] === '') {
        obj[key] = null;
        warnings.push(`${path}${key}: string vacío convertido a null`);
      } else if (typeof obj[key] === 'object') {
        cleanEmptyStrings(obj[key], `${path}${key}.`);
      }
    }
  };
  cleanEmptyStrings(normalized);
  
  // 5. Asegurar campos requeridos
  if (!normalized.identificacion?.fecEmi && !normalized.fecha_emision) {
    const today = new Date().toISOString().split('T')[0];
    if (!normalized.identificacion) normalized.identificacion = {};
    normalized.identificacion.fecEmi = today;
    warnings.push(`fecEmi no encontrado, usando fecha actual: ${today}`);
  }
  
  if (!normalized.identificacion?.numeroControl && !normalized.numero_documento) {
    warnings.push('numeroControl no encontrado, se usará el que venga del DTE o quedará vacío');
  }
  
  return { normalized, warnings };
}