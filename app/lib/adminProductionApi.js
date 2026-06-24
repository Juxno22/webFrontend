import { adminFetch } from "./adminApi";

export async function getAdminProductionSummary() {
  return adminFetch("/api/admin/produccion/resumen");
}

export async function getAdminProductionChecks() {
  return adminFetch("/api/admin/produccion/checks");
}

export async function recalculateAdminProductionChecks() {
  return adminFetch("/api/admin/produccion/checks/recalcular", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getAdminProductionEnv() {
  return adminFetch("/api/admin/produccion/env");
}

export async function getAdminProductionBackups(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();
  return adminFetch(`/api/admin/produccion/backups${query ? `?${query}` : ""}`);
}

export async function createAdminProductionBackup(payload = {}) {
  return adminFetch("/api/admin/produccion/backups/manual", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cleanAdminProductionBackups(payload = {}) {
  return adminFetch("/api/admin/produccion/backups/limpiar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function validateAdminProductionBackup(payload = {}) {
  return adminFetch("/api/admin/produccion/backups/validar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function markAdminProductionBackupRestoreTested(id, payload = {}) {
  return adminFetch(`/api/admin/produccion/backups/${id}/restauracion-probada`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAdminProductionDeploys(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();
  return adminFetch(`/api/admin/produccion/deploys${query ? `?${query}` : ""}`);
}

export async function getAdminProductionDeploy(id) {
  return adminFetch(`/api/admin/produccion/deploys/${id}`);
}

export async function createAdminProductionDeploy(payload = {}) {
  return adminFetch("/api/admin/produccion/deploys", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProductionDeployStatus(id, payload = {}) {
  return adminFetch(`/api/admin/produccion/deploys/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProductionDeployItem(deployId, itemId, payload = {}) {
  return adminFetch(`/api/admin/produccion/deploys/${deployId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAdminProductionDeployReadiness() {
  return adminFetch("/api/admin/produccion/deploys/readiness");
}
