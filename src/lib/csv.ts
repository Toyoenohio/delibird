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

export function normalizeCSVRow(row: Record<string, string>): ParsedEmailRecord | null {
  // Normalize keys to lowercase and trim
  const normalized: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase();
    normalized[cleanKey] = (row[key] || "").trim();
  }

  const senderEmail =
    normalized["correo"] ||
    normalized["email"] ||
    normalized["correo electronico"] ||
    normalized["correo del remitente"] ||
    normalized["remitente"] ||
    normalized["sender_email"] ||
    "";

  if (!senderEmail) {
    // If no email found in row, we cannot consider it a valid email record
    return null;
  }

  const senderName =
    normalized["nombre y apellido"] ||
    normalized["nombre completo"] ||
    normalized["nombre"] ||
    (normalized["apellido"] ? `${normalized["nombre"] || ""} ${normalized["apellido"]}`.trim() : "") ||
    normalized["name"] ||
    normalized["sender_name"] ||
    "Sin Nombre";

  const senderPhone =
    normalized["telefono"] ||
    normalized["teléfono"] ||
    normalized["celular"] ||
    normalized["movil"] ||
    normalized["phone"] ||
    normalized["sender_phone"] ||
    undefined;

  const subject =
    normalized["asunto"] ||
    normalized["tema"] ||
    normalized["subject"] ||
    "Consulta Web";

  const message =
    normalized["mensaje"] ||
    normalized["comentario"] ||
    normalized["message"] ||
    normalized["body"] ||
    normalized["descripcion"] ||
    "";

  const sourceUrl =
    normalized["web"] ||
    normalized["url"] ||
    normalized["sitio"] ||
    normalized["pagina"] ||
    normalized["source_url"] ||
    normalized["origen"] ||
    "Importación CSV";

  let status: "nuevo" | "en_proceso" | "contactado" | "cerrado" | "spam" = "nuevo";
  const rawStatus = (normalized["status"] || normalized["estado"] || "").toLowerCase();
  if (rawStatus.includes("proc") || rawStatus.includes("proceso")) {
    status = "en_proceso";
  } else if (rawStatus.includes("contact") || rawStatus.includes("respond")) {
    status = "contactado";
  } else if (rawStatus.includes("cerr") || rawStatus.includes("archiv") || rawStatus.includes("final")) {
    status = "cerrado";
  } else if (rawStatus.includes("spam") || rawStatus.includes("descart")) {
    status = "spam";
  }

  // Parse Date
  let createdAt = new Date();
  const rawDate =
    normalized["fecha"] ||
    normalized["date"] ||
    normalized["created_at"] ||
    normalized["timestamp"];

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
    message,
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
