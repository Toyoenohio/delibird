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
  extraFields?: Record<string, any>;
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

function cleanValue(val?: string): string {
  if (!val) return "";
  let clean = val.trim();
  if (clean.includes("_")) {
    clean = clean.replace(/_/g, " ");
  }
  return clean;
}

export function normalizeCSVRow(row: Record<string, string>): ParsedEmailRecord | null {
  // Normalize keys to lowercase, trimmed, without accents
  const normalized: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = normalizeKey(key);
    normalized[cleanKey] = (row[key] || "").trim();
  }

  // 1. Sender Name
  const senderName =
    normalized["nombre completo"] ||
    normalized["nombre y apellido"] ||
    normalized["nombre"] ||
    normalized["name"] ||
    normalized["sender name"] ||
    normalized["sender_name"] ||
    (normalized["apellido"] ? `${normalized["nombre"] || ""} ${normalized["apellido"]}`.trim() : "") ||
    "Sin Nombre";

  // 2. Sender Email detection
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

  // If standard keys didn't yield an email
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

  // If no email was provided or invalid text entered in email field, generate a clean placeholder
  if (!senderEmail || !senderEmail.includes("@")) {
    const slugName = normalizeKey(rawFullName).replace(/[^a-z0-9]/g, ".") || "lead";
    senderEmail = `${slugName}@sin-correo.com`;
  }

  // 3. Sender Phone
  const senderPhone =
    normalized["numero de telefono"] ||
    normalized["telefono"] ||
    normalized["celular"] ||
    normalized["movil"] ||
    normalized["phone"] ||
    normalized["whatsapp"] ||
    normalized["telefono de contacto"] ||
    normalized["sender phone"] ||
    normalized["sender_phone"] ||
    undefined;

  // 4. Form Name & Subject
  const formName = cleanValue(
    normalized["formname"] ||
    normalized["form name"] ||
    normalized["nombre del formulario"] ||
    normalized["nombre del formulario (id)"] ||
    ""
  );

  const subject =
    normalized["asunto"] ||
    normalized["tema"] ||
    normalized["subject"] ||
    normalized["motivo"] ||
    normalized["servicio"] ||
    (formName ? `Formulario: ${formName}` : "Consulta Web");

  // 5. Extra Fields JSONB & Details Builder
  const extraFields: Record<string, any> = {};

  const standardKeys = new Set([
    "nombre", "apellido", "nombre y apellido", "nombre completo", "name", "sender name", "sender_name",
    "correo", "email", "correo electronico", "correo del remitente", "e-mail", "mail", "sender email", "sender_email",
    "telefono", "numero de telefono", "celular", "movil", "phone", "whatsapp", "telefono de contacto", "sender phone", "sender_phone",
    "asunto", "tema", "subject", "motivo", "servicio",
    "mensaje", "comentario", "message", "body", "descripcion",
    "web", "url", "sitio", "sitio web", "pagina", "pagina de origen", "website", "source url", "source_url", "origen", "remitente", "referer", "referrer", "page url",
    "status", "estado", "fase",
    "fecha", "date", "createdtime", "created time", "created at", "created_at", "creado en", "timestamp", "hora", "fecha y hora",
    "nombre del formulario (id)", "nombre del formulario", "form name", "formname", "form id", "id del envio", "id de usuario", "agente de usuario", "user agent", "ip del usuario", "user ip", "ip", "leadid", "lead id"
  ]);

  const extraDetails: string[] = [];
  for (const [originalKey, val] of Object.entries(row)) {
    const cleanK = normalizeKey(originalKey);
    const cleanedVal = cleanValue(val);
    if (!cleanedVal) continue;

    if (cleanK === "plazo de compra") {
      extraFields["plazo_de_compra"] = cleanedVal;
      extraDetails.push(`Plazo de compra: ${cleanedVal}`);
    } else if (cleanK === "renta liquida") {
      extraFields["renta_liquida"] = cleanedVal;
      extraDetails.push(`Renta líquida: ${cleanedVal}`);
    } else if (cleanK === "leadid" || cleanK === "lead id") {
      extraFields["leadId"] = cleanedVal;
      extraDetails.push(`ID del Lead: ${cleanedVal}`);
    } else if (cleanK === "formname" || cleanK === "form name") {
      extraFields["formName"] = cleanedVal;
      extraDetails.push(`Formulario: ${cleanedVal}`);
    } else if (!standardKeys.has(cleanK)) {
      const fieldKey = cleanK.replace(/\s+/g, "_");
      extraFields[fieldKey] = cleanedVal;
      extraDetails.push(`${originalKey.trim()}: ${cleanedVal}`);
    }
  }

  // 6. Message Body
  let mainMessage =
    normalized["mensaje"] ||
    normalized["comentario"] ||
    normalized["message"] ||
    normalized["body"] ||
    normalized["descripcion"] ||
    "";

  if (!mainMessage && formName) {
    mainMessage = `Lead recibido desde formulario "${formName}"`;
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

  // 7. Source URL / Website detection
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

  if (!sourceUrl) {
    sourceUrl =
      normalized["website"] ||
      normalized["web"] ||
      normalized["sitio"] ||
      normalized["sitio web"] ||
      normalized["pagina"] ||
      normalized["source url"] ||
      normalized["source_url"] ||
      "https://micoachinmobiliario.cl";
  }

  // 8. Status
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

  // 9. CreatedAt Date
  let createdAt = new Date();
  const rawDate =
    normalized["createdtime"] ||
    normalized["created time"] ||
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
    extraFields,
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
