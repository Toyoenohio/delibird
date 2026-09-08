import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { parseCSVString, type ParsedEmailRecord } from "@/lib/csv";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/emails/status-badge";

export function ImportView() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ParsedEmailRecord[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/websites")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.websites) setWebsites(data.websites);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  };

  const processFile = (file: File) => {
    setError(null);
    setSuccessMessage(null);
    setFile(file);
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const records = parseCSVString(text);

        if (records.length === 0) {
          setError(
            "No se pudieron extraer registros válidos del archivo CSV. Asegúrate de incluir columnas como 'correo', 'remitente', 'asunto' y 'mensaje'."
          );
          setParsedRecords([]);
        } else {
          setParsedRecords(records);
        }
      } catch (err: any) {
        setError("Error al procesar el archivo CSV: " + err.message);
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.onerror = () => {
      setError("Error al leer el archivo del dispositivo.");
      setIsProcessingFile(false);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedRecords.length === 0 || isImporting) return;
    setError(null);
    setIsImporting(true);

    try {
      const res = await fetch("/api/emails/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: parsedRecords,
          defaultWebsiteId: selectedWebsiteId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al importar los correos");
      }

      setSuccessMessage(
        `¡Éxito! Se importaron ${data.count} registros de correos a la base de datos correctamente.`
      );
      setParsedRecords([]);
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Error al importar correos");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleHeaders = "fecha,nombre,correo,telefono,asunto,mensaje,web,status\n";
    const sampleRows =
      '2026-08-15 10:30,Juan Carlos Pérez,juan@ejemplo.com,+34 600 123 456,Consulta de precios,Hola quisiera saber el precio del paquete Pro,https://tienda.ejemplo.com,nuevo\n' +
      '2026-08-16 14:20,Ana Gómez,ana.gomez@empresa.com,+52 55 9876 5432,Soporte técnico,Tengo problemas para acceder a mi cuenta,https://tienda.ejemplo.com,en_proceso\n';

    const blob = new Blob([sampleHeaders + sampleRows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "plantilla_ejemplo_correos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-primary" />
            <span>Importador de Correos Históricos (CSV)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sube un archivo CSV con tus registros antiguos para consolidar todo tu histórico en Neon
          </p>
        </div>

        <button
          onClick={downloadSampleCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted border border-border rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Descargar Plantilla CSV</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <a
            href="/"
            className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Ver Bandeja
          </a>
        </div>
      )}

      {/* Configuration Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            1. Asignar a Sitio Web Predeterminado (Opcional)
          </label>
          <select
            value={selectedWebsiteId}
            onChange={(e) => setSelectedWebsiteId(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          >
            <option value="">Auto-detectar por URL de cada fila o General</option>
            {websites.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.url})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground mt-1">
            Si una fila no tiene URL identificada, se asociará a este sitio.
          </p>
        </div>

        {/* Upload Zone */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            2. Seleccionar o Arrastrar Archivo CSV
          </label>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-2xl p-8 cursor-pointer transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-primary mb-2" />
            <span className="text-xs font-semibold text-foreground">
              Haz clic para seleccionar o arrastra tu archivo .CSV aquí
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Columnas reconocidas: fecha, nombre, correo/email, teléfono, asunto, mensaje, web/url, status
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Preview Section */}
      {parsedRecords.length > 0 && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Vista Previa ({parsedRecords.length} registros detectados)
              </h2>
              <p className="text-xs text-muted-foreground">
                Mostrando los primeros 5 registros que serán importados:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setParsedRecords([]);
                  setFile(null);
                }}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-border"
                title="Descartar archivo"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleImportSubmit}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isImporting ? (
                  <span>Guardando en Neon...</span>
                ) : (
                  <>
                    <span>Importar {parsedRecords.length} Registros</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Remitente</th>
                  <th className="py-2.5 px-3">Correo</th>
                  <th className="py-2.5 px-3">Teléfono</th>
                  <th className="py-2.5 px-3">Asunto</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedRecords.slice(0, 5).map((r, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground text-[11px]">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{r.senderName}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{r.senderEmail}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{r.senderPhone || "-"}</td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-foreground">{r.subject}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
