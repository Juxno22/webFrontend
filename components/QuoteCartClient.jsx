"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  AlertTriangle,
  Send,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import {
  addToQuoteCart,
  clearQuoteCart,
  getQuoteCart,
  removeQuoteItem,
  updateQuoteItemQuantity,
} from "../app/lib/quoteCart";
import { crearCotizacion } from "../app/lib/api";
import ProductMediaImage from "@/components/ProductMediaImage";

function getCodigoVisible(item) {
  return item.codigo_andyfers || item.codigo_importacion || item.product_key;
}

function getApiBaseUrl() {
  const rawUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "");

  return rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;
}

function uniqueCleanValues(values) {
  return [
    ...new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    ),
  ];
}

async function fetchRelatedProducts(queryString, signal) {
  const response = await fetch(
    `${getApiBaseUrl()}/cotizaciones/productos-relacionados?${queryString}`,
    { signal }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(
      payload.error || "No se pudieron cargar productos relacionados."
    );
  }

  return Array.isArray(payload.data) ? payload.data : [];
}

function hasQuoteImage(item) {
  return Boolean(
    item?.imagen_thumbnail_url ||
    item?.imagen_url ||
    item?.imagen_principal?.thumbnail_url ||
    item?.imagen_principal?.secure_url
  );
}

function getQuoteItemStableKey(item) {
  return (
    item?.product_key ||
    item?.codigo_andyfers ||
    item?.codigo_importacion ||
    item?.id ||
    item?.producto_id ||
    ""
  );
}

function pickProductImageFields(producto) {
  if (!producto) return null;

  const patch = {
    imagen_thumbnail_url: producto.imagen_thumbnail_url || null,
    imagen_url: producto.imagen_url || null,
    imagen_principal: producto.imagen_principal || null,
    galeria: producto.galeria || [],
    multimedia: producto.multimedia || [],
    total_imagenes: producto.total_imagenes || 0,
  };

  return hasQuoteImage(patch) ? patch : null;
}

async function fetchProductDetailForQuote(code, signal) {
  const response = await fetch(
    `${getApiBaseUrl()}/productos/${encodeURIComponent(code)}`,
    { signal }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    return null;
  }

  return payload.data || null;
}

export default function QuoteCartClient() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const [form, setForm] = useState({
    nombre_cliente: "",
    whatsapp: "",
    telefono_alt: "",
    correo: "",
    ciudad: "",
    estado_cliente: "",
    marca_vehiculo: "",
    modelo_vehiculo: "",
    anio_vehiculo: "",
    motor_vehiculo: "",
    version_vehiculo: "",
    numero_parte_cliente: "",
    mensaje_cliente: "",
  });

  useEffect(() => {
    function loadCart() {
      setItems(getQuoteCart());
    }

    loadCart();

    window.addEventListener("andyfers_quote_cart_updated", loadCart);
    window.addEventListener("storage", loadCart);

    return () => {
      window.removeEventListener("andyfers_quote_cart_updated", loadCart);
      window.removeEventListener("storage", loadCart);
    };
  }, []);

  useEffect(() => {
    if (!items.length) return;

    const missingImageItems = items.filter((item) => {
      const code = getCodigoVisible(item);

      return code && !hasQuoteImage(item);
    });

    if (!missingImageItems.length) return;

    const controller = new AbortController();

    async function hydrateMissingImages() {
      const results = await Promise.allSettled(
        missingImageItems.map(async (item) => {
          const code = getCodigoVisible(item);
          const productKey = getQuoteItemStableKey(item);

          const producto = await fetchProductDetailForQuote(
            code,
            controller.signal
          );

          const patch = pickProductImageFields(producto);

          return {
            productKey,
            patch,
          };
        })
      );

      if (controller.signal.aborted) return;

      const patches = new Map();

      results.forEach((result) => {
        if (result.status !== "fulfilled") return;
        if (!result.value?.productKey) return;
        if (!result.value?.patch) return;

        patches.set(result.value.productKey, result.value.patch);
      });

      if (!patches.size) return;

      setItems((current) =>
        current.map((item) => {
          const productKey = getQuoteItemStableKey(item);

          if (!patches.has(productKey)) return item;

          return {
            ...item,
            ...patches.get(productKey),
          };
        })
      );
    }

    hydrateMissingImages();

    return () => {
      controller.abort();
    };
  }, [items]);

  const totalPiezas = useMemo(() => {
    return items.reduce((total, item) => total + Number(item.cantidad || 0), 0);
  }, [items]);

  const relatedQueryString = useMemo(() => {
    if (items.length === 0) return "";

    const familias = uniqueCleanValues(items.map((item) => item.familia));
    const categorias = uniqueCleanValues(items.map((item) => item.categoria));
    const armadoras = uniqueCleanValues(items.map((item) => item.armadora));
    const exclude = uniqueCleanValues(
      items.flatMap((item) => [
        item.producto_id,
        item.id,
        item.codigo_andyfers,
        item.codigo_importacion,
        item.product_key,
      ])
    );

    if (
      familias.length === 0 &&
      categorias.length === 0 &&
      armadoras.length === 0
    ) {
      return "";
    }

    const params = new URLSearchParams();

    if (familias.length) params.set("familias", familias.join(","));
    if (categorias.length) params.set("categorias", categorias.join(","));
    if (armadoras.length) params.set("armadoras", armadoras.join(","));
    if (exclude.length) params.set("exclude", exclude.join(","));

    params.set("limit", "12");

    return params.toString();
  }, [items]);

  useEffect(() => {
    if (!relatedQueryString) {
      setRelatedProducts([]);
      setLoadingRelated(false);
      return;
    }

    const controller = new AbortController();

    setLoadingRelated(true);

    fetchRelatedProducts(relatedQueryString, controller.signal)
      .then((products) => {
        setRelatedProducts(products);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setRelatedProducts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingRelated(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [relatedQueryString]);

  function showToast(message) {
    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: { message },
      })
    );
  }

  function handleQuantity(productKey, nextQuantity) {
    const updated = updateQuoteItemQuantity(productKey, nextQuantity);
    setItems(updated);
  }

  function handleRemove(productKey) {
    const updated = removeQuoteItem(productKey);
    setItems(updated);
    showToast("Producto eliminado de la cotización");
  }

  function handleClear() {
    const confirmClear = window.confirm(
      "¿Seguro que quieres vaciar toda la cotización?"
    );

    if (!confirmClear) return;

    const updated = clearQuoteCart();
    setItems(updated);
    showToast("Cotización vaciada");
  }

  function handleAddRelated(producto) {
    const updated = addToQuoteCart(producto);

    setItems(Array.isArray(updated) ? updated : getQuoteCart());

    const codigoVisible =
      producto.codigo_andyfers ||
      producto.codigo_importacion ||
      producto.codigo ||
      "Producto";

    showToast(`${codigoVisible} agregado a cotización`);
  }

  function updateForm(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function buildPayload() {
    return {
      nombre_cliente: form.nombre_cliente,
      whatsapp: form.whatsapp,
      telefono_alt: form.telefono_alt,
      correo: form.correo,
      ciudad: form.ciudad,
      estado_cliente: form.estado_cliente,
      marca_vehiculo: form.marca_vehiculo,
      modelo_vehiculo: form.modelo_vehiculo,
      anio_vehiculo: form.anio_vehiculo,
      motor_vehiculo: form.motor_vehiculo,
      version_vehiculo: form.version_vehiculo,
      numero_parte_cliente: form.numero_parte_cliente,
      mensaje_cliente: form.mensaje_cliente,
      origen: "CATALOGO",
      productos: items.map((item) => ({
        producto_id: item.producto_id,
        codigo_andyfers: item.codigo_andyfers,
        codigo_importacion: item.codigo_importacion,
        descripcion: item.descripcion,
        familia: item.familia,
        armadora: item.armadora,
        categoria: item.categoria,
        cantidad: item.cantidad,
        compatibilidad_estimada: item.compatibilidad_estimada,
        razones_compatibilidad: item.razones_compatibilidad,
      })),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (items.length === 0) {
      setSubmitError("Agrega al menos un producto a la cotización.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await crearCotizacion(buildPayload());

      clearQuoteCart();
      setItems([]);

      showToast(`Cotización ${response.folio} creada correctamente`);

      router.push(`/solicitud-enviada/${encodeURIComponent(response.folio)}`);
    } catch (error) {
      setSubmitError(error.message || "No se pudo enviar la cotización.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="quote-page">
        <div className="container">
          <div className="quote-empty">
            <div className="quote-empty-icon">
              <ShoppingBag size={54} />
            </div>

            <span className="eyebrow">Mi cotización</span>

            <h1>Tu cotización está vacía</h1>

            <p>
              Agrega productos desde el catálogo o desde el detalle de producto.
            </p>

            <Link href="/catalogo" className="btn-primary">
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="quote-hero">
        <div className="container quote-hero-grid">
          <div>
            <Link href="/catalogo" className="back-link light">
              <ArrowLeft size={17} />
              Seguir agregando productos
            </Link>
            <div></div>
            <h1>Revisa tus productos antes de enviar la solicitud.</h1>

            <p>
              Ventas revisará existencia, compatibilidad y precio final para
              contactarte.
            </p>
          </div>

          <div className="quote-hero-logo-pop" aria-hidden="true">
            <img
              src="/andyfers-home/logo-andyfers.png"
              alt=""
            />
          </div>
        </div>
      </section>

      <section className="quote-related-section quote-related-anchor">
        <div className="container quote-layout">
          <div className="quote-main">
            <article className="quote-panel">

              {(loadingRelated || relatedProducts.length > 0) && (
                <section className="quote-related-section">
                  <div className="quote-related-header">
                    <div>
                      <span>Productos</span> <></>
                      <span>Relacionados</span>
                      <h3>También puede interesarte</h3>
                    </div>
                  </div>

                  {loadingRelated ? (
                    <div className="quote-related-loading">
                      <Loader2 size={18} className="spin-icon" />
                      Buscando relacionados...
                    </div>
                  ) : (
                    <div className="quote-related-carousel">
                      {relatedProducts.map((producto) => {
                        const codigoVisible =
                          producto.codigo_andyfers ||
                          producto.codigo_importacion ||
                          producto.codigo ||
                          "Sin código";

                        return (
                          <article
                            className="quote-related-card"
                            key={producto.id || codigoVisible}
                          >
                            <div className="quote-related-media">
                              <ProductMediaImage
                                producto={producto}
                                className="quote-related-image"
                                fallbackClassName="quote-related-image-fallback"
                                iconSize={24}
                              />
                            </div>

                            <div className="quote-related-body">
                              <span>{codigoVisible}</span>

                              <h4>{producto.descripcion}</h4>

                              <div className="quote-related-tags">
                                {producto.familia && (
                                  <small>{producto.familia}</small>
                                )}
                                {producto.armadora && (
                                  <small>{producto.armadora}</small>
                                )}
                              </div>

                              <div className="quote-related-actions">
                                {producto.codigo_andyfers ? (
                                  <Link
                                    href={`/producto/${encodeURIComponent(
                                      producto.codigo_andyfers
                                    )}`}
                                  >
                                    Ver
                                  </Link>
                                ) : (
                                  <span>Sin detalle</span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleAddRelated(producto)}
                                >
                                  <Plus size={15} />
                                  Agregar
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              <div className="quote-panel-header">
                <div>
                  <span>Productos</span>
                  <h2>Productos solicitados</h2>
                </div>

                <button className="btn-danger-soft" onClick={handleClear}>
                  <Trash2 size={16} />
                  Vaciar
                </button>
              </div>
              <div></div>

              <div className="quote-items">
                {items.map((item) => {
                  const codigoVisible = getCodigoVisible(item);

                  return (
                    <div className="quote-item" key={item.product_key}>
                      <div className="quote-item-media">
                        <ProductMediaImage
                          producto={item}
                          className="quote-item-image"
                          fallbackClassName="quote-item-image-fallback"
                          iconSize={30}
                        />
                      </div>

                      <div className="quote-item-info">
                        <div className="quote-item-code">{codigoVisible}</div>

                        <h3>{item.descripcion}</h3>

                        <div className="quote-item-tags">
                          {item.categoria && <span>{item.categoria}</span>}
                          {item.familia && <span>{item.familia}</span>}
                          {item.armadora && <span>{item.armadora}</span>}
                        </div>

                        {item.codigo_andyfers && (
                          <Link
                            href={`/producto/${encodeURIComponent(
                              item.codigo_andyfers
                            )}`}
                            className="quote-item-link"
                          >
                            Ver detalle
                          </Link>
                        )}
                      </div>

                      <div className="quote-item-actions">
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantity(
                                item.product_key,
                                Number(item.cantidad || 1) - 1
                              )
                            }
                            disabled={Number(item.cantidad || 1) <= 1}
                          >
                            <Minus size={15} />
                          </button>

                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(event) =>
                              handleQuantity(
                                item.product_key,
                                event.target.value
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleQuantity(
                                item.product_key,
                                Number(item.cantidad || 1) + 1
                              )
                            }
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => handleRemove(item.product_key)}
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
          <aside className="quote-sidebar">
            <article className="quote-panel sticky-panel">
              <div className="quote-panel-header compact">
                <div>
                  <span>Contacto</span>
                  <h2>Datos para seguimiento</h2>
                </div>
              </div>

              <div className="quote-warning-box">
                <AlertTriangle size={18} />
                <p>
                  La solicitud será enviada a ventas. Un asesor confirmará
                  compatibilidad, existencia y precio final.
                </p>
              </div>

              {submitError && (
                <div className="alert-error quote-error">{submitError}</div>
              )}

              <form className="quote-form" onSubmit={handleSubmit}>
                <label>
                  Nombre completo *
                  <input
                    type="text"
                    value={form.nombre_cliente}
                    onChange={(event) =>
                      updateForm("nombre_cliente", event.target.value)
                    }
                    placeholder="Nombre del cliente"
                    required
                  />
                </label>

                <label>
                  WhatsApp *
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(event) =>
                      updateForm("whatsapp", event.target.value)
                    }
                    placeholder="Ej. 2381234567"
                    required
                  />
                </label>

                <label>
                  Teléfono alternativo
                  <input
                    type="tel"
                    value={form.telefono_alt}
                    onChange={(event) =>
                      updateForm("telefono_alt", event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </label>

                <label>
                  Correo opcional
                  <input
                    type="email"
                    value={form.correo}
                    onChange={(event) => updateForm("correo", event.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </label>

                <div className="form-two-cols">
                  <label>
                    Ciudad
                    <input
                      type="text"
                      value={form.ciudad}
                      onChange={(event) =>
                        updateForm("ciudad", event.target.value)
                      }
                      placeholder="Tehuacán"
                    />
                  </label>

                  <label>
                    Estado
                    <input
                      type="text"
                      value={form.estado_cliente}
                      onChange={(event) =>
                        updateForm("estado_cliente", event.target.value)
                      }
                      placeholder="Puebla"
                    />
                  </label>
                </div>

                <div className="quote-form-divider">
                  Datos del vehículo opcionales
                </div>

                <div className="form-two-cols">
                  <label>
                    Marca
                    <input
                      type="text"
                      value={form.marca_vehiculo}
                      onChange={(event) =>
                        updateForm("marca_vehiculo", event.target.value)
                      }
                      placeholder="Nissan"
                    />
                  </label>

                  <label>
                    Modelo
                    <input
                      type="text"
                      value={form.modelo_vehiculo}
                      onChange={(event) =>
                        updateForm("modelo_vehiculo", event.target.value)
                      }
                      placeholder="Tsuru"
                    />
                  </label>
                </div>

                <div className="form-two-cols">
                  <label>
                    Año
                    <input
                      type="number"
                      value={form.anio_vehiculo}
                      onChange={(event) =>
                        updateForm("anio_vehiculo", event.target.value)
                      }
                      placeholder="2010"
                    />
                  </label>

                  <label>
                    Motor
                    <input
                      type="text"
                      value={form.motor_vehiculo}
                      onChange={(event) =>
                        updateForm("motor_vehiculo", event.target.value)
                      }
                      placeholder="1.6L"
                    />
                  </label>
                </div>

                <label>
                  Versión
                  <input
                    type="text"
                    value={form.version_vehiculo}
                    onChange={(event) =>
                      updateForm("version_vehiculo", event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </label>

                <label>
                  Número de parte del cliente
                  <input
                    type="text"
                    value={form.numero_parte_cliente}
                    onChange={(event) =>
                      updateForm("numero_parte_cliente", event.target.value)
                    }
                    placeholder="Si lo tienes"
                  />
                </label>

                <label>
                  Comentarios
                  <textarea
                    value={form.mensaje_cliente}
                    onChange={(event) =>
                      updateForm("mensaje_cliente", event.target.value)
                    }
                    placeholder="Agrega detalles sobre la pieza, urgencia, número de parte o dudas de compatibilidad."
                    rows={4}
                  />
                </label>

                <button
                  className="btn-primary full"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="spin-icon" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar solicitud
                    </>
                  )}
                </button>
              </form>
            </article>
          </aside>
        </div>
      </section>
    </>
  );
}