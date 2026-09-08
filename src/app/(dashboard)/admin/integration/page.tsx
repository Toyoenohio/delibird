"use client";

import React, { useState, useEffect } from "react";
import { Code2, Copy, Check, Terminal, Globe, Send, Database, Workflow } from "lucide-react";

export default function IntegrationPage() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/websites")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.websites?.length > 0) {
          setWebsites(data.websites);
          setSelectedSite(data.websites[0]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const apiKey = selectedSite?.apiKey || "TU_API_KEY_AQUI";

  const n8nSqlExample = `-- 1. En n8n agrega un nodo 'Postgres'
-- 2. Conéctalo a tu base de datos de Neon usando la credencial DATABASE_URL
-- 3. Modo de operación: 'Execute Query' o 'Insert'

INSERT INTO emails (
  source_url,
  sender_name,
  sender_email,
  sender_phone,
  subject,
  message,
  status
) VALUES (
  '{{ $json.source_url || $json.web || "https://tu-pagina.com" }}',
  '{{ $json.nombre || $json.name || "Sin Nombre" }}',
  '{{ $json.email || $json.correo }}',
  '{{ $json.telefono || $json.phone || null }}',
  '{{ $json.asunto || $json.subject || "Consulta Web" }}',
  '{{ $json.mensaje || $json.message }}',
  'nuevo'
);`;

  const n8nHttpExample = `// En n8n usa un nodo 'HTTP Request':
// Method: POST
// URL: https://tu-dominio-dashboard.com/api/submissions
// Body Parameters:
{
  "sourceUrl": "={{ $json.web_url }}",
  "senderName": "={{ $json.nombre }}",
  "senderEmail": "={{ $json.correo }}",
  "senderPhone": "={{ $json.telefono }}",
  "subject": "={{ $json.asunto }}",
  "message": "={{ $json.mensaje }}"
}`;

  const jsFetchExample = `// Enviar formulario desde JavaScript (WordPress, Webflow, React, Landing)
async function enviarFormulario(datos) {
  try {
    const respuesta = await fetch("https://tu-dominio.com/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderName: datos.nombre,
        senderEmail: datos.correo,
        senderPhone: datos.telefono,
        subject: datos.asunto || "Contacto desde formulario web",
        message: datos.mensaje,
        sourceUrl: window.location.href, // Captura automáticamente la URL actual
      }),
    });

    const resultado = await respuesta.json();
    if (respuesta.ok) {
      alert("¡Mensaje enviado con éxito!");
    }
  } catch (error) {
    console.error("Error de conexión:", error);
  }
}`;

  const phpExample = `<?php
// Enviar formulario desde PHP (cPanel / Apache / WordPress)
$data = [
    'senderName'  => $_POST['nombre'] ?? 'Sin Nombre',
    'senderEmail' => $_POST['correo'] ?? '',
    'senderPhone' => $_POST['telefono'] ?? '',
    'subject'     => $_POST['asunto'] ?? 'Contacto desde sitio web',
    'message'     => $_POST['mensaje'] ?? '',
    'sourceUrl'   => (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"
];

$ch = curl_init('https://tu-dominio.com/api/submissions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);
?>`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          <span>Guía de Integración (n8n, Webhooks & SQL)</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Conecta tus formularios, automatizaciones en n8n o sistemas externos directamente a la base de datos de Neon o mediante la API.
        </p>
      </div>

      {/* Integration Options */}
      <div className="space-y-6">
        {/* Option 1: n8n Workflow Postgres Node */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Workflow className="w-4 h-4 text-orange-500" />
              <span>Opción 1: Automatización n8n ➔ Inserción Directa en Neon Postgres</span>
            </h2>
            <button
              onClick={() => handleCopy(n8nSqlExample, 1)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              {copiedIndex === 1 ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL n8n</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            No necesitas crear los sitios manualmente. Al guardar el registro con su <code>source_url</code>, el sistema lo detectará automáticamente y creará su tag de filtro en la bandeja:
          </p>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{n8nSqlExample}</code>
          </pre>
        </div>

        {/* Option 2: n8n HTTP Request */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <span>Opción 2: Nodo n8n 'HTTP Request' (Vía Webhook API)</span>
            </h2>
            <button
              onClick={() => handleCopy(n8nHttpExample, 2)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              {copiedIndex === 2 ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar JSON</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{n8nHttpExample}</code>
          </pre>
        </div>

        {/* Option 3: JS Frontend */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span>Opción 3: Formulario en JavaScript / Landing Pages</span>
            </h2>
            <button
              onClick={() => handleCopy(jsFetchExample, 3)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              {copiedIndex === 3 ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{jsFetchExample}</code>
          </pre>
        </div>

        {/* Option 4: PHP / WordPress */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span>Opción 4: Backend PHP / WordPress (cPanel)</span>
            </h2>
            <button
              onClick={() => handleCopy(phpExample, 4)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              {copiedIndex === 4 ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{phpExample}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
