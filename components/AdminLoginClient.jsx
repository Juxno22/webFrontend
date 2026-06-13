"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { adminLogin } from "../app/lib/adminApi";

export default function AdminLoginClient() {
  const router = useRouter();

  const [form, setForm] = useState({
    correo: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateForm(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await adminLogin(form);
      router.push("/admin");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon">
          <Lock size={38} />
        </div>

        <span className="eyebrow">Panel interno</span>

        <h1>Acceso ventas Andyfers</h1>

        <p>
          Ingresa con tu usuario interno para revisar cotizaciones y dar
          seguimiento a solicitudes.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={form.correo}
              onChange={(event) => updateForm("correo", event.target.value)}
              placeholder="ventas@andyfers.com"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateForm("password", event.target.value)}
              placeholder="********"
              required
            />
          </label>

          <button className="btn-primary full" type="submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </section>
  );
}