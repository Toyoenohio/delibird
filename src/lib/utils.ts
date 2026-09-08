import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd MMM yyyy, HH:mm", { locale: es });
  } catch {
    return String(date);
  }
}

export function cleanPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  // Remove spaces, dashes, parentheses
  return phone.replace(/[^\d+]/g, "");
}

export function getWhatsAppUrl(phone: string | null | undefined, name?: string): string | null {
  const cleaned = cleanPhone(phone);
  if (!cleaned || cleaned.length < 7) return null;
  
  // Format without leading plus for wa.me URL
  const waNumber = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  const message = name ? encodeURIComponent(`Hola ${name}, me comunico en respuesta a tu consulta.`) : "";
  return `https://wa.me/${waNumber}${message ? `?text=${message}` : ""}`;
}

export function extractDomain(urlOrText: string | null | undefined): string {
  if (!urlOrText) return "Sitio Web";
  const trimmed = urlOrText.trim();
  
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const parsed = new URL(trimmed);
      return parsed.hostname.replace(/^www\./, "");
    }
  } catch {
    // fallback
  }

  // If contains slashes or paths
  const parts = trimmed.split("/")[0].replace(/^www\./, "");
  return parts || trimmed;
}

const PALETTE = [
  "#ea580c", // Orange
  "#f97316", // Amber-Orange
  "#d97706", // Amber
  "#0284c7", // Sky
  "#8b5cf6", // Purple
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

export function getDomainColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  nuevo: {
    label: "Nuevo",
    bg: "bg-orange-500/10 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/30",
    dot: "bg-orange-500",
  },
  en_proceso: {
    label: "En Proceso",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  contactado: {
    label: "Contactado",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
  },
  cerrado: {
    label: "Cerrado",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  spam: {
    label: "Spam / Descartado",
    bg: "bg-red-500/10 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
};
