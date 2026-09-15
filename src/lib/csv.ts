import Papa from "papaparse";

export interface CSVRow {
  fecha?: string;
  date?: string;
  asunto?: string;
  subject?: string;
  correo?: string;
  email?: string;
  telefono?: string;
  phone?: string;
  nombre?: string;
  name?: string;
  apellido?: string;
  mensaje?: string;
  message?: string;
  web?: string;
  url?: string;
  source_url?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface ParsedEmailRecord {
  sourceUrl: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
  status: "nuevo" | "en_proceso" | "contactado" | "cerrado" | "spam";
  createdAt: Date;
}

function normalizeKey(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function normalizeCSVRow(row: Record<string, string>): ParsedEmailRecord | null {
  // Normalize keys to lowercase, trimmed, without accents
  const normalized: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = normalizeKey(key);
    normalized[cleanKey] = (row[key] || "").trim();
  }

  // 1. Sender Email detection
  let senderEmail =
    normalized["correo electronico"] ||
    normalized["correo"] ||
    normalized["email"] ||
    normalized["e-mail"] ||
    normalized["mail"] ||
    normalized["correo del remitente"] ||
    normalized["sender email"] ||
    normalized["sender_email"] ||
    "";

  // If standard keys didn't yield an email (e.g. "remitente" in Elementor is a URL, but in some systems it's an email)
  if (!senderEmail || !senderEmail.includes("@")) {
    if (normalized["remitente"] && normalized["remitente"].includes("@") && !normalized["remitente"].includes("/")) {
      senderEmail = normalized["remitente"];
    } else {
      // Scan other fields for an email address (skipping message bodies)
      for (const [k, v] of Object.entries(normalized)) {
        if (v && v.includes("@") && !k.includes("mensaje") && !k.includes("body") && !k.includes("comentario")) {
          senderEmail = v;
          break;
        }
      }
    }
  }

  if (!senderEmail || !senderEmail.includes("@")) {
    // No valid email found in row
    return null;
  }

  // 2. Sender Name
  const senderName =
    normalized["nombre y apellido"] ||
    normalized["nombre completo"] ||
    normalized["nombre"] ||
    (normalized["apellido"] ? `${normalized["nombre"] || ""} ${normalized["apellido"]}`.trim() : "") ||
    normalized["name"] ||
    normalized["sender name"] ||
    normalized["sender_name"] ||
    "Sin Nombre";

  // 3. Sender Phone
  const senderPhone =
    normalized["telefono"] ||
    normalized["celular"] ||
    normalized["movil"] ||
    normalized["phone"] ||
    normalized["whatsapp"] ||
    normalized["telefono de contacto"] ||
    normalized["sender phone"] ||
    normalized["sender_phone"] ||
    undefined;

  // 4. Subject
  const subject =
    normalized["asunto"] ||
    normalized["tema"] ||
    normalized["subject"] ||
    normalized["motivo"] ||
    normalized["servicio"] ||
    "Consulta Web";

  // 5. Message & Custom Extra Fields
  let mainMessage =
    normalized["mensaje"] ||
    normalized["comentario"] ||
    normalized["message"] ||
    normalized["body"] ||
    normalized["descripcion"] ||
    "";

  const standardKeys = new Set([
    "nombre", "apellido", "nombre y apellido", "nombre completo", "name", "sender name", "sender_name",
    "correo", "email", "correo electronico", "correo del remitente", "e-mail", "mail", "sender email", "sender_email",
    "telefono", "celular", "movil", "phone", "whatsapp", "telefono de contacto", "sender phone", "sender_phone",
    "asunto", "tema", "subject", "motivo", "servicio",
    "mensaje", "comentario", "message", "body", "descripcion",
    "web", "url", "sitio", "sitio web", "pagina", "pagina de origen", "website", "source url", "source_url", "origen", "remitente", "referer", "referrer", "page url",
    "status", "estado", "fase",
    "fecha", "date", "created at", "created_at", "creado en", "timestamp", "hora", "fecha y hora",
    "nombre del formulario (id)", "nombre del formulario", "form name", "form id", "id del envio", "id de usuario", "agente de usuario", "user agent", "ip del usuario", "user ip", "ip"
  ]);

  const extraDetails: string[] = [];
  for (const [originalKey, val] of Object.entries(row)) {
    const cleanKey = normalizeKey(originalKey);
    if (!standardKeys.has(cleanKey) && val && val.trim()) {
      extraDetails.push(`${originalKey.trim()}: ${val.trim()}`);
    }
  }

  let finalMessage = mainMessage;
  if (extraDetails.length > 0) {
    const detailsBlock = extraDetails.join("\n");
    if (finalMessage) {
      finalMessage = `${finalMessage}\n\n--- Datos Adicionales ---\n${detailsBlock}`;
    } else {
      finalMessage = detailsBlock;
    }
  }

  // 6. Source URL / Website detection
  // Prioritize URL fields (e.g. in Elementor Spanish, "Remitente" is the page URL https://domain.cl/contacto/)
  let sourceUrl = "";
  const possibleUrlFields = [
    normalized["remitente"],
    normalized["url"],
    normalized["web"],
    normalized["website"],
    normalized["sitio"],
    normalized["sitio web"],
    normalized["pagina"],
    normalized["pagina de origen"],
    normalized["source url"],
    normalized["source_url"],
    normalized["referer"],
    normalized["referrer"],
    normalized["origen"],
  ];

  for (const field of possibleUrlFields) {
    if (field && (field.startsWith("http://") || field.startsWith("https://") || (field.includes(".") && !field.includes("@")))) {
      sourceUrl = field;
      break;
    }
  }

  // If no explicit URL found, check if there's a website slug/name (e.g. "atfgroup", "pailamilla")
  if (!sourceUrl) {
    sourceUrl =
      normalized["website"] ||
      normalized["web"] ||
      normalized["sitio"] ||
      normalized["sitio web"] ||
      normalized["pagina"] ||
      normalized["source url"] ||
      normalized["source_url"] ||
      "";
  }

  // 7. Status
  let status: "nuevo" | "en_proceso" | "contactado" | "cerrado" | "spam" = "nuevo";
  const rawStatus = (normalized["status"] || normalized["estado"] || normalized["fase"] || "").toLowerCase();
  if (rawStatus.includes("proc") || rawStatus.includes("proceso")) {
    status = "en_proceso";
  } else if (rawStatus.includes("contact") || rawStatus.includes("respond")) {
    status = "contactado";
  } else if (rawStatus.includes("cerr") || rawStatus.includes("archiv") || rawStatus.includes("final")) {
    status = "cerrado";
  } else if (rawStatus.includes("spam") || rawStatus.includes("descart")) {
    status = "spam";
  }

  // 8. CreatedAt Date
  let createdAt = new Date();
  const rawDate =
    normalized["creado en"] ||
    normalized["fecha"] ||
    normalized["date"] ||
    normalized["created at"] ||
    normalized["created_at"] ||
    normalized["timestamp"] ||
    normalized["fecha y hora"];

  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      createdAt = parsed;
    }
  }

  return {
    sourceUrl,
    senderName,
    senderEmail,
    senderPhone,
    subject,
    message: finalMessage,
    status,
    createdAt,
  };
}

export function parseCSVString(csvContent: string): ParsedEmailRecord[] {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const parsedRecords: ParsedEmailRecord[] = [];
  for (const row of result.data) {
    const record = normalizeCSVRow(row);
    if (record) {
      parsedRecords.push(record);
    }
  }

  return parsedRecords;
}
