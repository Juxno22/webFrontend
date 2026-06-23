"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileSearch,
  FileText,
  ImagePlus,
  ListChecks,
  LogOut,
  ShieldCheck,
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

          <Link href="/admin/catalogo-calidad" className="admin-home-card">
            <div className="admin-home-icon">
              <ShieldCheck size={34} />
            </div>

            <div>
              <span>Calidad comercial</span>
              <h2>Auditoría de catálogo</h2>
              <p>
                Detecta productos sin imagen, cruces, aplicaciones, stock,
                precio o datos incompletos y prioriza pendientes comerciales.
              </p>
            </div>
          </Link>

          <Link href="/admin/pendientes-comerciales" className="admin-home-card">
            <div className="admin-home-icon">
              <ListChecks size={34} />
            </div>

            <div>
              <span>Gestión comercial</span>
              <h2>Pendientes comerciales</h2>
              <p>
                Atiende la cola operativa de imágenes, cruces, aplicaciones,
                descripciones, stock y calidad del catálogo.
              </p>
            </div>
          </Link>

          <Link href="/admin/multimedia-macheo" className="admin-home-card">
            <div className="admin-home-icon">
              <FileSearch size={34} />
            </div>

            <div>
              <span>Cloudinary / multimedia</span>
              <h2>Macheo multimedia</h2>
              <p>
                Carga reportes CSV del importador, revisa imágenes sin match,
                ambiguas o listas para subir y genera pendientes comerciales.
              </p>
            </div>
          </Link>

          <Link href="/admin/analitica" className="admin-home-card">
            <div className="admin-home-icon">
              <BarChart3 size={34} />
            </div>

            <div>
              <span>Inteligencia comercial</span>
              <h2>Analítica comercial</h2>
              <p>
                Consulta búsquedas sin resultado, productos más consultados,
                cotizaciones, WhatsApp y oportunidades de mercado.
              </p>
            </div>
          </Link>

          <Link href="/admin/contenido" className="admin-home-card">
            <div className="admin-home-icon">
              <FileText size={34} />
            </div>

            <div>
              <span>Contenido público</span>
              <h2>Contenido editable</h2>
              <p>
                Edita textos del home, banners secundarios, líneas comerciales,
                secciones destacadas y datos de contacto.
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
        </div>
      </div>
    </section>
  );
}
