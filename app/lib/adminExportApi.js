const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

function getAdminToken() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("andyfers_admin_token") ||
    window.localStorage.getItem("admin_token") ||
    window.localStorage.getItem("token") ||
    ""
  );
}

export function buildAdminExportQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  return searchParams.toString();
}

export async function downloadAdminExport(tipo, params = {}) {
  if (typeof window === "undefined") return;

  const token = getAdminToken();
  const query = buildAdminExportQuery(params);
  const response = await fetch(
    `${API_URL}/api/admin/exportaciones/${encodeURIComponent(tipo)}${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "No se pudo generar la exportación.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || `${tipo}_${new Date().toISOString().slice(0, 10)}.xls`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
