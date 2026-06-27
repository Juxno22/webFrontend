"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Boxes,
    Car,
    CheckCircle2,
    ClipboardList,
    Database,
    Link2,
    PackageCheck,
    Plus,
    ShieldAlert,
    Wrench,
} from "lucide-react";
import { addToQuoteCart } from "../app/lib/quoteCart";
import { trackAnalyticsEvent } from "@/app/lib/analytics";
import ProductMediaImage, { getProductGallery } from "@/components/ProductMediaImage";

function groupCrucesByMarca(cruces = []) {
    return cruces.reduce((acc, cruce) => {
        const marca = cruce.marca || "SIN MARCA";

        if (!acc[marca]) {
            acc[marca] = [];
        }

        acc[marca].push(cruce);

        return acc;
    }, {});
}

function formatAplicacion(aplicacion) {
    const partes = [];

    if (aplicacion.marca_auto) partes.push(aplicacion.marca_auto);
    if (aplicacion.modelo_auto) partes.push(aplicacion.modelo_auto);

    const motorLabel = aplicacion.motor_label || aplicacion.motor;
    if (motorLabel) partes.push(motorLabel);;

    const anios =
        aplicacion.anio_inicio && aplicacion.anio_fin
            ? `${aplicacion.anio_inicio}-${aplicacion.anio_fin}`
            : null;

    if (anios) partes.push(anios);
    if (aplicacion.version_auto) partes.push(aplicacion.version_auto);

    return partes.join(" · ");
}

export default function ProductDetailClient({ producto }) {
    const codigoVisible = producto.codigo_andyfers || `ID-${producto.id}`;
    const crucesAgrupados = groupCrucesByMarca(producto.cruces || []);
    const galeriaProducto = getProductGallery(producto);
    const [activeImage, setActiveImage] = useState(null);
    const activeMediaProducto = useMemo(() => {
        if (!activeImage) return producto;

        return {
            ...producto,
            imagen_principal: {
                ...(producto.imagen_principal || {}),
                secure_url: activeImage.secure_url || activeImage.thumbnail_url,
                thumbnail_url: activeImage.thumbnail_url || activeImage.secure_url,
            },
            imagen_url: activeImage.secure_url || activeImage.thumbnail_url || producto.imagen_url,
            imagen_thumbnail_url: activeImage.thumbnail_url || activeImage.secure_url || producto.imagen_thumbnail_url,
        };
    }, [activeImage, producto]);

    const inventarioDisponible = (producto.inventario || []).filter(
        (item) => Number(item.disponible_web) === 1
    );

    const atributos = producto.atributos || [];

    const aplicacionPrincipal = atributos.find(
        (item) => item.atributo_normalizado === "APLICACION PRINCIPAL"
    );

    const atributosTecnicos = atributos.filter(
        (item) =>
            item.atributo_normalizado !== "APLICACION PRINCIPAL" &&
            item.atributo_normalizado !== "CRUCES DISPONIBLES"
    );

    useEffect(() => {
        if (!producto?.id) return;

        trackAnalyticsEvent("PRODUCTO_CONSULTADO", {
            producto_id: producto.id,
            codigo_andyfers: producto.codigo_andyfers,
            codigo_importacion: producto.codigo_importacion,
            categoria_id: producto.categoria_id,
            categoria_nombre: producto.categoria,
            familia: producto.familia,
            metadata: {
                descripcion: producto.descripcion,
                armadora: producto.armadora,
            },
        });
    }, [producto?.id]);

    useEffect(() => {
        const body = document.body;
        const trigger = document.getElementById("product-detail-theme-trigger");

        if (!trigger) return;

        let wipeTimer = null;

        function clearWipe() {
            body.classList.remove("product-detail-wipe-light");
            body.classList.remove("product-detail-wipe-dark");
        }

        function applyTheme(theme, animate = true) {
            const isLight = body.classList.contains("product-detail-theme-light");
            const isDark = body.classList.contains("product-detail-theme-dark");

            if (theme === "light" && isLight) return;
            if (theme === "dark" && isDark) return;

            window.clearTimeout(wipeTimer);
            clearWipe();

            if (animate) {
                body.classList.add(
                    theme === "light" ? "product-detail-wipe-light" : "product-detail-wipe-dark"
                );
                wipeTimer = window.setTimeout(clearWipe, 850);
            }

            if (theme === "light") {
                body.classList.add("product-detail-theme-light");
                body.classList.remove("product-detail-theme-dark");
            } else {
                body.classList.add("product-detail-theme-dark");
                body.classList.remove("product-detail-theme-light");
            }
        }

        function setInitialTheme() {
            const triggerTop = trigger.getBoundingClientRect().top;
            const activationPoint = window.innerHeight * 0.74;

            applyTheme(triggerTop <= activationPoint ? "light" : "dark", false);
        }

        setInitialTheme();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        applyTheme("light", true);
                        return;
                    }

                    if (entry.boundingClientRect.top > 0) {
                        applyTheme("dark", true);
                    }
                });
            },
            {
                root: null,
                rootMargin: "0px 0px -74% 0px",
                threshold: 0,
            }
        );

        observer.observe(trigger);
        window.addEventListener("resize", setInitialTheme);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", setInitialTheme);
            window.clearTimeout(wipeTimer);
            body.classList.remove("product-detail-theme-light");
            body.classList.remove("product-detail-theme-dark");
            clearWipe();
        };
    }, []);

    function handleAddToQuote() {
        addToQuoteCart(producto);

        window.dispatchEvent(
            new CustomEvent("andyfers_toast", {
                detail: {
                    message: `${codigoVisible} agregado a cotización`,
                },
            })
        );
    }

    return (
        <>
            <div className="product-detail-theme-wipe" aria-hidden="true" />

            <section className="product-detail-hero">
                <div className="product-detail-decor product-detail-decor-left" />
                <div className="product-detail-decor product-detail-decor-right" />

                <div className="container product-detail-hero-grid">
                    <div className="product-detail-copy">
                        <Link href="/catalogo" className="back-link">
                            <ArrowLeft size={17} />
                            Volver al catálogo
                        </Link>

                        <div className="eyebrow">Detalle de producto</div>

                        <h1>{codigoVisible}</h1>

                        <p>{producto.descripcion}</p>

                        <div className="detail-badges">
                            {producto.categoria && <span>{producto.categoria}</span>}
                            {producto.familia && <span>{producto.familia}</span>}
                            {producto.armadora && <span>{producto.armadora}</span>}
                            {producto.clasif_vta && <span>{producto.clasif_vta}</span>}
                        </div>

                        <div className="detail-actions">
                            <button className="btn-primary" onClick={handleAddToQuote}>
                                <Plus size={18} />
                                Agregar a cotización
                            </button>

                            <Link href="/cotizacion" className="btn-secondary detail-secondary">
                                <ClipboardList size={18} />
                                Ver mi cotización
                            </Link>
                        </div>

                        <div className="detail-advice">
                            <ShieldAlert size={18} />
                            <span>
                                La compatibilidad, disponibilidad y precio final serán validados por un asesor antes de procesar la venta.
                            </span>
                        </div>
                    </div>

                    <div className="product-detail-visual product-detail-hero-visual">
                        <div className="product-detail-code">{codigoVisible}</div>
                        <div className="product-detail-icon product-detail-image-stage">
                            <ProductMediaImage
                                producto={activeMediaProducto}
                                mode="full"
                                className="product-detail-main-image"
                                fallbackClassName="product-detail-image-fallback"
                                iconSize={86}
                                loading="eager"
                                priority
                            />
                        </div>

                        {galeriaProducto.length > 0 && (
                            <div className="product-detail-gallery-strip">
                                {galeriaProducto.slice(0, 5).map((item) => (
                                    <button
                                        type="button"
                                        className={`product-detail-gallery-thumb ${item.id === activeImage?.id ? "is-active" : ""}`}
                                        key={item.id}
                                        onClick={() => setActiveImage(item)}
                                        aria-label="Ver imagen en grande"
                                    >
                                        <img
                                            src={item.thumbnail_url || item.secure_url}
                                            alt={item.nombre_archivo_original || producto.descripcion}
                                            loading="lazy"
                                        />
                                    </button>
                                ))}

                                {galeriaProducto.length > 5 && (
                                    <div className="product-detail-gallery-more">
                                        +{galeriaProducto.length - 5} más
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="visual-stat top">
                            <strong>{producto.cruces?.length || 0}</strong>
                            <span>Cruces</span>
                        </div>

                        <div className="visual-stat bottom">
                            <strong>{producto.aplicaciones?.length || 0}</strong>
                            <span>Aplicaciones</span>
                        </div>
                    </div>
                </div>
            </section>

            <div id="product-detail-theme-trigger" className="product-detail-theme-trigger" aria-hidden="true" />

            <section className="section product-detail-section">
                <div className="container product-detail-layout">
                    <div className="product-detail-main">
                        <article className="detail-panel">
                            <div className="panel-title">
                                <Database size={20} />
                                <h2>Información general</h2>
                            </div>

                            <div className="info-grid">
                                <div>
                                    <span>Código Andyfers</span>
                                    <strong>{producto.codigo_andyfers || "No disponible"}</strong>
                                </div>
                                <div>
                                    <span>Categoría</span>
                                    <strong>{producto.categoria || "No disponible"}</strong>
                                </div>

                                <div>
                                    <span>Familia</span>
                                    <strong>{producto.familia || "No disponible"}</strong>
                                </div>

                                <div>
                                    <span>Armadora</span>
                                    <strong>{producto.armadora || "No disponible"}</strong>
                                </div>
                                <div>
                                    <span>Clasificación</span>
                                    <strong>{producto.clasif_vta || "No disponible"}</strong>
                                </div>
                                <div>
                                    <span>Múltiplo</span>
                                    <strong>{producto.multiplo || "No disponible"}</strong>
                                </div>

                                <div>
                                    <span>Unidad</span>
                                    <strong>{producto.unidad_medida || "No disponible"}</strong>
                                </div>
                            </div>
                        </article>

                        <article className="detail-panel">
                            <div className="panel-title">
                                <Wrench size={20} />
                                <h2>Ficha técnica</h2>
                            </div>

                            {atributosTecnicos.length > 0 ? (
                                <div className="attributes-grid clean-attributes-grid">
                                    {atributosTecnicos.map((atributo) => (
                                        <div className="attribute-card clean-attribute-card" key={atributo.id}>
                                            <span>{atributo.atributo}</span>
                                            <strong>{atributo.valor_texto}</strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-mini">
                                    Este producto todavía no tiene atributos técnicos registrados.
                                </div>
                            )}
                            {aplicacionPrincipal && (
                                <div className="main-application-box">
                                    <span>Aplicación principal</span>
                                    <p>{aplicacionPrincipal.valor_texto}</p>
                                </div>
                            )}
                        </article>

                        <article className="detail-panel">
                            <div className="panel-title">
                                <Car size={20} />
                                <h2>Aplicaciones vehiculares</h2>
                            </div>

                            {producto.aplicaciones?.length > 0 ? (
                                <div className="applications-list">
                                    {producto.aplicaciones.map((aplicacion) => (
                                        <div className="application-card" key={aplicacion.id}>
                                            <div>
                                                <strong>{formatAplicacion(aplicacion)}</strong>

                                                {aplicacion.notas && <p>{aplicacion.notas}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-mini">
                                    No hay aplicaciones vehiculares separadas para este producto.
                                    Revisa la descripción y confirma con un asesor.
                                </div>
                            )}
                        </article>

                        <article className="detail-panel">
                            <div className="panel-title">
                                <Link2 size={20} />
                                <h2>Cruces y equivalencias</h2>
                            </div>

                            {producto.cruces?.length > 0 ? (
                                <div className="crosses-list compact-crosses-list">
                                    {Object.entries(crucesAgrupados).map(([marca, cruces]) => (
                                        <div className="cross-brand compact-cross-brand" key={marca}>
                                            <h3>{marca}</h3>

                                            <div>
                                                {cruces.map((cruce) => (
                                                    <span key={cruce.id}>{cruce.numero_parte}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-mini">
                                    Este producto no tiene cruces registrados todavía.
                                </div>
                            )}
                        </article>

                        <article className="detail-panel">
                            <div className="panel-title">
                                <Boxes size={20} />
                                <h2>Relaciones del producto</h2>
                            </div>

                            {producto.relaciones?.length > 0 ? (
                                <div className="relations-list">
                                    {producto.relaciones.map((relacion) => (
                                        <div className="relation-card" key={relacion.id}>
                                            <span>{relacion.tipo_relacion}</span>
                                            <strong>{relacion.codigo_relacionado}</strong>
                                            {relacion.notas && <p>{relacion.notas}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-mini">
                                    No hay relaciones adicionales registradas.
                                </div>
                            )}
                        </article>
                    </div>

                    <aside className="product-detail-sidebar">
                        <div className="sidebar-card">
                            <div className="sidebar-title">
                                <PackageCheck size={20} />
                                <h3>Disponibilidad</h3>
                            </div>

                            <div className="availability-box">
                                <strong>{producto.stock_total_web || 0}</strong>
                                <span>piezas visibles para catálogo</span>
                            </div>

                            {inventarioDisponible.length > 0 ? (
                                <div className="inventory-list">
                                    {inventarioDisponible.map((item) => (
                                        <div key={item.id}>
                                            <span>{item.sucursal}</span>
                                            <strong>{item.stock}</strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="sidebar-muted">
                                    La existencia será confirmada por ventas.
                                </p>
                            )}
                        </div>

                        <div className="sidebar-card">
                            <div className="sidebar-title">
                                <CheckCircle2 size={20} />
                                <h3>Recomendación</h3>
                            </div>

                            <p className="sidebar-muted">
                                Agrega este producto a cotización y proporciona datos del
                                vehículo para que el equipo de ventas valide compatibilidad.
                            </p>

                            <button className="btn-primary full" onClick={handleAddToQuote}>
                                <Plus size={18} />
                                Agregar a cotización
                            </button>
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}
