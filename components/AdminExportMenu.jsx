"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadAdminExport } from "@/app/lib/adminExportApi";

const EXPORT_OPTIONS = {
  analytics: [
    { value: "analytics-dashboard", label: "Dashboard completo" },
    { value: "busquedas-sin-resultado", label: "Búsquedas sin resultado" },
    { value: "productos-consultados", label: "Productos consultados" },
    { value: "productos-cotizados", label: "Productos cotizados" },
    { value: "analytics-eventos", label: "Eventos recientes" },
    { value: "oportunidades-mercado", label: "Oportunidades" },
  ],
  catalogQuality: [
    { value: "catalogo-calidad", label: "Calidad completa" },
    { value: "productos-sin-imagen", label: "Productos sin imagen" },
    { value: "productos-incompletos", label: "Productos incompletos" },
    { value: "oportunidades-mercado", label: "Oportunidades" },
  ],
  commercialTasks: [
    { value: "pendientes-comerciales", label: "Pendientes comerciales" },
    { value: "productos-sin-imagen", label: "Productos sin imagen" },
    { value: "productos-incompletos", label: "Productos incompletos" },
    { value: "busquedas-sin-resultado", label: "Búsquedas sin resultado" },
  ],
};

export default function AdminExportMenu({ context = "analytics", filters = {}, onError }) {
  const options = useMemo(() => {
    return EXPORT_OPTIONS[context] || EXPORT_OPTIONS.analytics;
  }, [context]);

  const [selected, setSelected] = useState(options[0]?.value || "");
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!selected || loading) return;

    try {
      setLoading(true);
      await downloadAdminExport(selected, filters);
    } catch (error) {
      if (typeof onError === "function") {
        onError(error.message || "No se pudo exportar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-export-menu">
      <select
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        disabled={loading}
        aria-label="Tipo de exportación"
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        className="admin-clean-button"
        type="button"
        onClick={handleDownload}
        disabled={loading || !selected}
      >
        {loading ? <Loader2 size={17} className="spin-icon" /> : <Download size={17} />}
        Excel
      </button>
    </div>
  );
}
