import React, { useState } from "react";
import { Code2, Copy, Check, Terminal, Send, Workflow } from "lucide-react";

export function IntegrationView() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
  status,
  extra_fields
) VALUES (
  '{{ $json.source_url || $json.web || "https://tu-pagina.com" }}',
  '{{ $json.nombre || $json.name || "Sin Nombre" }}',
  '{{ $json.email || $json.correo }}',
  '{{ $json.telefono || $json.phone || null }}',
  '{{ $json.asunto || $json.subject || "Consulta Web" }}',
  '{{ $json.mensaje || $json.message }}',
  'nuevo',
  '{{ $json.extra_fields || "{}" }}'::jsonb
);`;

  const n8nElementorCodeExample = `// En n8n: Coloca un nodo 'Code' (JavaScript - Run Once for Each Item)
// Recibe el webhook directo de Elementor y separa estándar de extras automáticamente:
const fields = $json.fields || {};
const meta = $json.meta || {};

// 1. Extraer campos estándar
const sender_name = fields.name?.value || fields.nombre?.value || 'Sin Nombre';
const sender_email = fields.email?.value || fields.correo?.value || '';
const sender_phone = fields.phone?.value || fields.telefono?.value || null;
const message = fields.message?.value || fields.mensaje?.value || '';
const source_url = meta.page_url || $json.source_url || 'https://sitio-cliente.com';

// 2. Extraer automáticamente cualquier campo extra que tenga el cliente
const standard = ['name', 'nombre', 'email', 'correo', 'phone', 'telefono', 'message', 'mensaje'];
const extra_fields = {};

for (const [key, item] of Object.entries(fields)) {
  if (!standard.includes(key.toLowerCase())) {
    extra_fields[key] = item.value ?? item;
  }
}

// 3. Objeto universal listo para el nodo Postgres o HTTP Request
return {
  source_url,
  sender_name,
  sender_email,
  sender_phone,
  subject: 'Contacto desde formulario',
  message,
  status: 'nuevo',
  extra_fields: JSON.stringify(extra_fields)
};`;

  const n8nHttpExample = `// En n8n usa un nodo 'HTTP Request':
// Method: POST
// URL: https://tu-dominio-dashboard.com/api/submissions
// Body Parameters:
{
  "sourceUrl": "={{ $json.source_url }}",
  "senderName": "={{ $json.sender_name }}",
  "senderEmail": "={{ $json.sender_email }}",
  "senderPhone": "={{ $json.sender_phone }}",
  "subject": "={{ $json.subject }}",
  "message": "={{ $json.message }}",
  "extraFields": "={{ $json.extra_fields }}"
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
            No necesitas crear los sitios manualmente. Al guardar el registro con su <code>source_url</code>, el trigger automático de Neon lo detectará y vinculará instantáneamente:
          </p>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{n8nSqlExample}</code>
          </pre>
        </div>

        {/* Option: Elementor + n8n Universal Node */}
        <div className="bg-card border border-primary/30 rounded-xl shadow-sm overflow-hidden space-y-3 p-6 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Workflow className="w-4 h-4 text-primary" />
              <span>Elementor + n8n: Nodo Universal (Soporta Campos Extras sin cambiar n8n)</span>
            </h2>
            <button
              onClick={() => handleCopy(n8nElementorCodeExample, 99)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-sm"
            >
              {copiedIndex === 99 ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código JavaScript</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Coloca un nodo <strong>Code</strong> en n8n justo después del Webhook de Elementor. Este código extrae los campos estándar y agrupa automáticamente cualquier campo extra (empresa, presupuesto, ciudad, etc.) en <code>extra_fields</code> para que nunca tengas que editar el workflow por cada cliente:
          </p>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{n8nElementorCodeExample}</code>
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
