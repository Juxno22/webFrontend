"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  LogOut,
  Settings,
  ImagePlus,
} from "lucide-react";
import { clearAdminSession, getAdminUser } from "../app/lib/adminApi";

export default function AdminHomeClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getAdminUser();

    if (!currentUser) {
      router.push("/admin/login");
      return;
    }

    setUser(currentUser);
  }, [router]);

  function logout() {
    clearAdminSession();
    router.push("/admin/login");
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Panel interno</span>
            <h1>Administración Andyfers</h1>
            <p>
              {user
                ? `${user.nombre} · ${user.rol}`
                : "Cargando usuario..."}
            </p>
          </div>

          <button className="admin-logout" onClick={logout}>
            <LogOut size={17} />
            Salir
          </button>
        </div>

        <div className="admin-home-grid">
          <Link href="/admin/cotizaciones" className="admin-home-card">
            <div className="admin-home-icon">
              <ClipboardList size={34} />
            </div>

            <div>
              <span>Ventas</span>
              <h2>Cotizaciones</h2>
              <p>
                Revisa solicitudes, cambia estados, agrega notas y copia el
                resumen para WhatsApp.
              </p>
            </div>
          </Link>

          <Link href="/admin/productos" className="admin-home-card">
            <div className="admin-home-icon">
              <Boxes size={34} />
            </div>

            <div>
              <span>Mantenimiento</span>
              <h2>Catálogo de productos</h2>
              <p>
                Revisa productos pendientes, corrige datos base y controla qué
                productos se muestran en la página.
              </p>
            </div>
          </Link>

          <Link href="/admin/contenido/home-hero" className="admin-home-card">
            <div className="admin-home-icon">
              <ImagePlus size={34} />
            </div>

            <div>
              <span>Contenido público</span>
              <h2>Flyers del home</h2>
              <p>
                Edita los flyers promocionales del carrusel principal,
                controla orden, visibilidad y URL de Cloudinary.
              </p>
            </div>
          </Link>

          <div className="admin-home-card disabled">
            <div className="admin-home-icon">
              <Settings size={34} />
            </div>

            <div>
              <span>Próximamente</span>
              <h2>Configuración</h2>
              <p>
                Ajustes generales, imágenes, visibilidad de secciones y datos de
                contacto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}