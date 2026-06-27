"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileSearch,
  FileText,
  Gauge,
  ImagePlus,
  ListChecks,
  LockKeyhole,
  LogOut,
  Server,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { clearAdminSession } from "../app/lib/adminApi";
import { useAdminAuth } from "../app/hooks/useAdminAuth";

export default function AdminHomeClient() {
  const router = useRouter();
  const { user, checking } = useAdminAuth();

  if (checking) return null;

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
          <Link href="/admin/ventas" className="admin-home-card">
            <div className="admin-home-icon">
              <ShoppingCart size={34} />
            </div>

            <div>
              <span>Ventas web</span>
              <h2>Ventas Mercado Pago</h2>
              <p>
                Revisa ventas entrantes, pagos confirmados, preparación de pedidos,
                entregas y trazabilidad de Mercado Pago.
              </p>
            </div>
          </Link>

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

          <Link href="/admin/ecommerce" className="admin-home-card">
            <div className="admin-home-icon">
              <ShoppingCart size={34} />
            </div>

            <div>
              <span>Ventas web</span>
              <h2>Ecommerce</h2>
              <p>
                Carga inventario y precios del almacén ecommerce para habilitar ventas
                con Mercado Pago.
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

          <Link href="/admin/performance" className="admin-home-card">
            <div className="admin-home-icon">
              <Gauge size={34} />
            </div>

            <div>
              <span>Performance pública</span>
              <h2>Velocidad y Core Web Vitals</h2>
              <p>
                Revisa páginas lentas, métricas LCP, CLS, INP, tiempos de carga
                y señales técnicas para mejorar experiencia y SEO.
              </p>
            </div>
          </Link>

          <Link href="/admin/seguridad" className="admin-home-card">
            <div className="admin-home-icon">
              <LockKeyhole size={34} />
            </div>

            <div>
              <span>Seguridad admin</span>
              <h2>Auditoría y protección</h2>
              <p>
                Revisa eventos de seguridad, rate limits, acciones administrativas,
                trazabilidad de cambios y hallazgos críticos del panel admin.
              </p>
            </div>
          </Link>

          <Link href="/admin/produccion" className="admin-home-card">
            <div className="admin-home-icon">
              <Server size={34} />
            </div>

            <div>
              <span>Preparación producción</span>
              <h2>Producción y respaldos</h2>
              <p>
                Revisa variables críticas, conexión a base, tablas necesarias,
                respaldos manuales y checklist antes de publicar cambios.
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
