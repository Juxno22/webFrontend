"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  FileText,
  Gauge,
  MessageCircle,
  Server,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { getAdminOperacionResumen } from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

export default function AdminHomeClient() {
  const { user, checking } = useAdminAuth();

  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const response = await getAdminOperacionResumen();
        setData(response.data);
      } catch {
        setData(null);
      }
    }

    loadData();
  }, [user]);

  if (checking) return null;

  const ventas = data?.ventas || {};
  const ecommerce = data?.ecommerce || {};
  const cotizaciones = data?.cotizaciones || {};

  return (
    <section className="admin-home-os">
      <div className="admin-home-os-hero">
        <span>Panel interno</span>
        <h1>Administración Andyfers</h1>
        <p>
          Centro de control para operación ecommerce, ventas Mercado Pago,
          cotizaciones, inventario web y atención comercial.
          {user ? ` Sesión: ${user.nombre} · ${user.rol}.` : ""}
        </p>
      </div>

      <div className="admin-home-priority-grid">
        <Link href="/admin/ventas" className="admin-home-priority-card sales">
          <div>
            <ShoppingCart size={32} />
            <span>Prioridad comercial</span>
            <h2>Ventas ecommerce</h2>
            <p>
              Revisa pagos confirmados, pedidos por preparar, trazabilidad
              Mercado Pago, entregas y descuentos de inventario.
            </p>
          </div>

          <strong>
            Abrir ventas
            <ArrowRight size={17} />
          </strong>
        </Link>

        <Link href="/admin/chat" className="admin-home-priority-card chat">
          <div>
            <MessageCircle size={32} />
            <span>Atención en tiempo real</span>
            <h2>Chat clientes</h2>
            <p>
              Bandeja de conversaciones para compradores y cotizaciones. Será el
              centro de atención tipo Messenger.
            </p>
          </div>

          <strong>
            Abrir chat
            <ArrowRight size={17} />
          </strong>
        </Link>
      </div>

      <div className="admin-home-kpi-grid">
        <article className="admin-home-kpi">
          <ShoppingCart size={22} />
          <span>Pedidos activos</span>
          <strong>{formatNumber(ventas.pedidos_activos)}</strong>
          <small>{formatMoney(ventas.importe_activo)}</small>
        </article>

        <article className="admin-home-kpi">
          <Activity size={22} />
          <span>Por preparar</span>
          <strong>{formatNumber(ventas.pagadas)}</strong>
          <small>Pagados esperando preparación</small>
        </article>

        <article className="admin-home-kpi">
          <MessageCircle size={22} />
          <span>Cotizaciones nuevas</span>
          <strong>{formatNumber(cotizaciones.nuevas)}</strong>
          <small>{formatNumber(cotizaciones.abiertas)} abiertas</small>
        </article>

        <article className="admin-home-kpi">
          <Boxes size={22} />
          <span>Productos vendibles</span>
          <strong>{formatNumber(ecommerce.vendibles)}</strong>
          <small>{formatNumber(ecommerce.piezas_totales)} piezas</small>
        </article>
      </div>

      <div className="admin-home-grid-os">
        <Link href="/admin/operacion" className="admin-home-card-os">
          <Activity size={24} />
          <div>
            <span>Operación</span>
            <h3>Operación diaria</h3>
            <p>Pedidos, stock, ventas y cotizaciones que requieren atención.</p>
          </div>
        </Link>

        <Link href="/admin/ecommerce" className="admin-home-card-os">
          <ShoppingCart size={24} />
          <div>
            <span>Ecommerce</span>
            <h3>Inventario web</h3>
            <p>Carga Excel, precios web, precio interno y productos vendibles.</p>
          </div>
        </Link>

        <Link href="/admin/cotizaciones" className="admin-home-card-os">
          <ClipboardList size={24} />
          <div>
            <span>Ventas</span>
            <h3>Cotizaciones</h3>
            <p>Solicitudes abiertas, estados, notas y seguimiento comercial.</p>
          </div>
        </Link>

        <Link href="/admin/productos" className="admin-home-card-os">
          <Boxes size={24} />
          <div>
            <span>Catálogo</span>
            <h3>Productos</h3>
            <p>Alta, edición, aplicaciones, cruces y datos comerciales.</p>
          </div>
        </Link>

        <Link href="/admin/catalogo-calidad" className="admin-home-card-os">
          <ShieldCheck size={24} />
          <div>
            <span>Calidad</span>
            <h3>Calidad catálogo</h3>
            <p>Detecta productos sin imagen, stock, precio o datos clave.</p>
          </div>
        </Link>

        <Link href="/admin/analitica" className="admin-home-card-os">
          <BarChart3 size={24} />
          <div>
            <span>Inteligencia</span>
            <h3>Analítica comercial</h3>
            <p>Búsquedas, productos consultados, ventas y oportunidades.</p>
          </div>
        </Link>

        <Link href="/admin/performance" className="admin-home-card-os">
          <Gauge size={24} />
          <div>
            <span>Performance</span>
            <h3>Velocidad pública</h3>
            <p>Métricas técnicas, páginas lentas y experiencia de usuario.</p>
          </div>
        </Link>

        <Link href="/admin/produccion" className="admin-home-card-os">
          <Server size={24} />
          <div>
            <span>Sistema</span>
            <h3>Producción</h3>
            <p>Variables críticas, respaldos, salud de base y despliegues.</p>
          </div>
        </Link>

        <Link href="/admin/contenido" className="admin-home-card-os">
          <FileText size={24} />
          <div>
            <span>Contenido</span>
            <h3>Contenido web</h3>
            <p>Home, banners, flyers, textos comerciales y secciones públicas.</p>
          </div>
        </Link>
      </div>
    </section>
  );
}