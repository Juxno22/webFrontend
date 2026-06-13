"use client";

import { useEffect, useState } from "react";
import { Database, Server } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SystemStatus() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [dbStatus, setDbStatus] = useState("checking");

  useEffect(() => {
    async function checkStatus() {
      try {
        const apiResponse = await fetch(`${API_URL}/api/health`);
        setApiStatus(apiResponse.ok ? "online" : "error");
      } catch {
        setApiStatus("error");
      }

      try {
        const dbResponse = await fetch(`${API_URL}/api/db-health`);
        const dbData = await dbResponse.json();
        setDbStatus(dbData?.ok ? "online" : "error");
      } catch {
        setDbStatus("error");
      }
    }

    checkStatus();
  }, []);

  return (
    <div className="status-card">
      <div className="status-item">
        <Server size={18} />
        <span>API</span>
        <strong className={`status-dot ${apiStatus}`}>
          {apiStatus === "online"
            ? "Conectada"
            : apiStatus === "checking"
              ? "Revisando"
              : "Error"}
        </strong>
      </div>

      <div className="status-item">
        <Database size={18} />
        <span>Base de datos</span>
        <strong className={`status-dot ${dbStatus}`}>
          {dbStatus === "online"
            ? "Conectada"
            : dbStatus === "checking"
              ? "Revisando"
              : "Error"}
        </strong>
      </div>
    </div>
  );
}
