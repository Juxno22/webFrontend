"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Car,
  Link2,
  Loader2,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import {
  createProductApplication,
  createProductAttribute,
  createProductCross,
  deleteProductApplication,
  deleteProductAttribute,
  deleteProductCross,
  updateProductApplication,
  updateProductAttribute,
  updateProductCross,
} from "@/app/lib/adminProductOpsApi";

const emptyAttribute = {
  atributo: "",
  valor_texto: "",
  valor_numero: "",
  unidad: "",
  visible_web: 1,
  buscable: 1,
  orden: 0,
};

const emptyCross = {
  marca: "",
  numero_parte: "",
};

const emptyApplication = {
  marca_auto: "",
  modelo_auto: "",
  motor: "",
  cilindraje: "",
  motor_detalle: "",
  motor_original: "",
  motor_label: "",
  anio_inicio: "",
  anio_fin: "",
  version_auto: "",
  fuente: "MANUAL_ADMIN",
  confianza_extraccion: 1,
  notas: "",
};

function showToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: { message },
    })
  );
}

function normalizeAttribute(item = {}) {
  return {
    id: item.id,
    atributo: item.atributo || "",
    valor_texto: item.valor_texto || "",
    valor_numero: item.valor_numero ?? "",
    unidad: item.unidad || "",
    visible_web: Number(item.visible_web) === 1 ? 1 : 0,
    buscable: Number(item.buscable) === 1 ? 1 : 0,
    orden: item.orden ?? 0,
  };
}

function normalizeCross(item = {}) {
  return {
    id: item.id,
    marca: item.marca || "",
    numero_parte: item.numero_parte || "",
  };
}

function buildApplicationMotorLabel(item = {}) {
  const parts = [
    item.motor,
    item.cilindraje,
    item.motor_detalle,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (parts.length) return parts.join(" · ");

  return item.motor_label || item.motor_original || "";
}

function normalizeApplication(item = {}) {
  return {
    id: item.id,
    marca_auto: item.marca_auto || "",
    modelo_auto: item.modelo_auto || "",
    motor: item.motor || "",
    cilindraje: item.cilindraje || "",
    motor_detalle: item.motor_detalle || "",
    motor_original: item.motor_original || "",
    motor_label: item.motor_label || "",
    anio_inicio: item.anio_inicio ?? "",
    anio_fin: item.anio_fin ?? "",
    version_auto: item.version_auto || "",
    fuente: item.fuente || "MANUAL_ADMIN",
    confianza_extraccion: item.confianza_extraccion ?? 1,
    notas: item.notas || "",
  };
}

function buildAttributePayload(form) {
  return {
    atributo: form.atributo,
    valor_texto: form.valor_texto,
    valor_numero: form.valor_numero === "" ? null : Number(form.valor_numero),
    unidad: form.unidad,
    visible_web: Number(form.visible_web) === 1 ? 1 : 0,
    buscable: Number(form.buscable) === 1 ? 1 : 0,
    orden: Number(form.orden || 0),
  };
}

function buildCrossPayload(form) {
  return {
    marca: form.marca,
    numero_parte: form.numero_parte,
  };
}

function buildApplicationPayload(form) {
  return {
    marca_auto: form.marca_auto,
    modelo_auto: form.modelo_auto,
    motor: form.motor,
    cilindraje: form.cilindraje,
    motor_detalle: form.motor_detalle,
    motor_original: form.motor_original || null,
    anio_inicio: form.anio_inicio === "" ? null : Number(form.anio_inicio),
    anio_fin: form.anio_fin === "" ? null : Number(form.anio_fin),
    version_auto: form.version_auto,
    fuente: form.fuente || "MANUAL_ADMIN",
    confianza_extraccion:
      form.confianza_extraccion === ""
        ? 1
        : Number(form.confianza_extraccion),
    notas: form.notas,
  };
}

export default function AdminProductOpsManager({
  productoId,
  atributos = [],
  cruces = [],
  aplicaciones = [],
  onRefresh,
}) {
  const [attributeList, setAttributeList] = useState([]);
  const [crossList, setCrossList] = useState([]);
  const [applicationList, setApplicationList] = useState([]);

  const [newAttribute, setNewAttribute] = useState(emptyAttribute);
  const [newCross, setNewCross] = useState(emptyCross);
  const [newApplication, setNewApplication] = useState(emptyApplication);

  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");

  const totals = useMemo(
    () => ({
      atributos: attributeList.length,
      cruces: crossList.length,
      aplicaciones: applicationList.length,
    }),
    [attributeList, crossList, applicationList]
  );

  useEffect(() => {
    setAttributeList(atributos.map(normalizeAttribute));
  }, [atributos]);

  useEffect(() => {
    setCrossList(cruces.map(normalizeCross));
  }, [cruces]);

  useEffect(() => {
    setApplicationList(aplicaciones.map(normalizeApplication));
  }, [aplicaciones]);

  async function reloadParent() {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  }

  function updateAttributeDraft(id, field, value) {
    setAttributeList((current) =>
      current.map((item) =>
        Number(item.id) === Number(id) ? { ...item, [field]: value } : item
      )
    );
  }

  function updateCrossDraft(id, field, value) {
    setCrossList((current) =>
      current.map((item) =>
        Number(item.id) === Number(id) ? { ...item, [field]: value } : item
      )
    );
  }

  function updateApplicationDraft(id, field, value) {
    setApplicationList((current) =>
      current.map((item) =>
        Number(item.id) === Number(id) ? { ...item, [field]: value } : item
      )
    );
  }

  async function createAttribute(event) {
    event.preventDefault();

    try {
      setSavingKey("attribute-new");
      setError("");

      await createProductAttribute(
        productoId,
        buildAttributePayload(newAttribute)
      );

      setNewAttribute(emptyAttribute);
      showToast("Atributo creado correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo crear el atributo.");
    } finally {
      setSavingKey("");
    }
  }

  async function saveAttribute(item) {
    try {
      setSavingKey(`attribute-${item.id}`);
      setError("");

      await updateProductAttribute(
        productoId,
        item.id,
        buildAttributePayload(item)
      );

      showToast("Atributo actualizado correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el atributo.");
    } finally {
      setSavingKey("");
    }
  }

  async function removeAttribute(item) {
    const confirmed = window.confirm("¿Eliminar este atributo?");

    if (!confirmed) return;

    try {
      setSavingKey(`attribute-${item.id}`);
      setError("");

      await deleteProductAttribute(productoId, item.id);

      showToast("Atributo eliminado correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el atributo.");
    } finally {
      setSavingKey("");
    }
  }

  async function createCross(event) {
    event.preventDefault();

    try {
      setSavingKey("cross-new");
      setError("");

      await createProductCross(productoId, buildCrossPayload(newCross));

      setNewCross(emptyCross);
      showToast("Cruce creado correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo crear el cruce.");
    } finally {
      setSavingKey("");
    }
  }

  async function saveCross(item) {
    try {
      setSavingKey(`cross-${item.id}`);
      setError("");

      await updateProductCross(productoId, item.id, buildCrossPayload(item));

      showToast("Cruce actualizado correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el cruce.");
    } finally {
      setSavingKey("");
    }
  }

  async function removeCross(item) {
    const confirmed = window.confirm("¿Eliminar este cruce?");

    if (!confirmed) return;

    try {
      setSavingKey(`cross-${item.id}`);
      setError("");

      await deleteProductCross(productoId, item.id);

      showToast("Cruce eliminado correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el cruce.");
    } finally {
      setSavingKey("");
    }
  }

  async function createApplication(event) {
    event.preventDefault();

    try {
      setSavingKey("application-new");
      setError("");

      await createProductApplication(
        productoId,
        buildApplicationPayload(newApplication)
      );

      setNewApplication(emptyApplication);
      showToast("Aplicación creada correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo crear la aplicación.");
    } finally {
      setSavingKey("");
    }
  }

  async function saveApplication(item) {
    try {
      setSavingKey(`application-${item.id}`);
      setError("");

      await updateProductApplication(
        productoId,
        item.id,
        buildApplicationPayload(item)
      );

      showToast("Aplicación actualizada correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo actualizar la aplicación.");
    } finally {
      setSavingKey("");
    }
  }

  async function removeApplication(item) {
    const confirmed = window.confirm("¿Eliminar esta aplicación vehicular?");

    if (!confirmed) return;

    try {
      setSavingKey(`application-${item.id}`);
      setError("");

      await deleteProductApplication(productoId, item.id);

      showToast("Aplicación eliminada correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo eliminar la aplicación.");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <section className="admin-product-ops-panel">
      <div className="admin-op-section-head">
        <div>
          <span>Datos operativos</span>
          <h2>Atributos, cruces y aplicaciones</h2>
          <p>
            Mantén la información técnica, equivalencias y compatibilidad
            vehicular del producto.
          </p>
        </div>

        <div className="admin-ops-summary">
          <strong>{totals.atributos}</strong>
          <span>Atributos</span>
          <strong>{totals.cruces}</strong>
          <span>Cruces</span>
          <strong>{totals.aplicaciones}</strong>
          <span>Aplicaciones</span>
        </div>
      </div>

      {error && <div className="admin-op-error">{error}</div>}

      <div className="admin-ops-grid">
        <article className="admin-ops-card">
          <div className="admin-ops-title">
            <Settings2 size={19} />
            <div>
              <h3>Atributos</h3>
              <p>Medidas, especificaciones y valores buscables.</p>
            </div>
          </div>

          <form className="admin-ops-create-form" onSubmit={createAttribute}>
            <div className="admin-ops-form-grid">
              <label>
                Atributo *
                <input
                  value={newAttribute.atributo}
                  onChange={(event) =>
                    setNewAttribute((current) => ({
                      ...current,
                      atributo: event.target.value,
                    }))
                  }
                  placeholder="Ej. Diámetro"
                />
              </label>

              <label>
                Valor *
                <input
                  value={newAttribute.valor_texto}
                  onChange={(event) =>
                    setNewAttribute((current) => ({
                      ...current,
                      valor_texto: event.target.value,
                    }))
                  }
                  placeholder="Ej. 70"
                />
              </label>

              <label>
                Valor número
                <input
                  type="number"
                  step="0.01"
                  value={newAttribute.valor_numero}
                  onChange={(event) =>
                    setNewAttribute((current) => ({
                      ...current,
                      valor_numero: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Unidad
                <input
                  value={newAttribute.unidad}
                  onChange={(event) =>
                    setNewAttribute((current) => ({
                      ...current,
                      unidad: event.target.value,
                    }))
                  }
                  placeholder="MM"
                />
              </label>
            </div>

            <div className="admin-ops-checks">
              <label>
                <input
                  type="checkbox"
                  checked={Number(newAttribute.visible_web) === 1}
                  onChange={(event) =>
                    setNewAttribute((current) => ({
                      ...current,
                      visible_web: event.target.checked ? 1 : 0,
                    }))
                  }
                />
                Visible web
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={Number(newAttribute.buscable) === 1}
                  onChange={(event) =>
                    setNewAttribute((current) => ({
                      ...current,
                      buscable: event.target.checked ? 1 : 0,
                    }))
                  }
                />
                Buscable
              </label>

              <label>
                Orden
                <input
                  type="number"
                  value={newAttribute.orden}
                  onChange={(event) =>
                    setNewAttribute((current) => ({
                      ...current,
                      orden: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button
              type="submit"
              className="admin-op-btn admin-op-btn-primary admin-op-btn-full"
              disabled={savingKey === "attribute-new"}
            >
              {savingKey === "attribute-new" ? (
                <Loader2 size={16} className="spin-icon" />
              ) : (
                <Plus size={16} />
              )}
              Agregar atributo
            </button>
          </form>

          <div className="admin-ops-list">
            {attributeList.length > 0 ? (
              attributeList.map((item) => (
                <div className="admin-ops-row" key={item.id}>
                  <div className="admin-ops-form-grid">
                    <label>
                      Atributo
                      <input
                        value={item.atributo}
                        onChange={(event) =>
                          updateAttributeDraft(
                            item.id,
                            "atributo",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Valor
                      <input
                        value={item.valor_texto}
                        onChange={(event) =>
                          updateAttributeDraft(
                            item.id,
                            "valor_texto",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Número
                      <input
                        type="number"
                        step="0.01"
                        value={item.valor_numero}
                        onChange={(event) =>
                          updateAttributeDraft(
                            item.id,
                            "valor_numero",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Unidad
                      <input
                        value={item.unidad}
                        onChange={(event) =>
                          updateAttributeDraft(
                            item.id,
                            "unidad",
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="admin-ops-checks">
                    <label>
                      <input
                        type="checkbox"
                        checked={Number(item.visible_web) === 1}
                        onChange={(event) =>
                          updateAttributeDraft(
                            item.id,
                            "visible_web",
                            event.target.checked ? 1 : 0
                          )
                        }
                      />
                      Visible web
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={Number(item.buscable) === 1}
                        onChange={(event) =>
                          updateAttributeDraft(
                            item.id,
                            "buscable",
                            event.target.checked ? 1 : 0
                          )
                        }
                      />
                      Buscable
                    </label>

                    <label>
                      Orden
                      <input
                        type="number"
                        value={item.orden}
                        onChange={(event) =>
                          updateAttributeDraft(
                            item.id,
                            "orden",
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="admin-ops-actions">
                    <button
                      type="button"
                      className="admin-op-btn admin-op-btn-primary"
                      onClick={() => saveAttribute(item)}
                      disabled={savingKey === `attribute-${item.id}`}
                    >
                      <Save size={15} />
                      Guardar
                    </button>

                    <button
                      type="button"
                      className="admin-op-btn admin-op-btn-danger"
                      onClick={() => removeAttribute(item)}
                      disabled={savingKey === `attribute-${item.id}`}
                    >
                      <Trash2 size={15} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-op-empty">Sin atributos registrados.</div>
            )}
          </div>
        </article>

        <article className="admin-ops-card">
          <div className="admin-ops-title">
            <Link2 size={19} />
            <div>
              <h3>Cruces</h3>
              <p>Equivalencias por marca y número de parte.</p>
            </div>
          </div>

          <form className="admin-ops-create-form" onSubmit={createCross}>
            <div className="admin-ops-form-grid two-cols">
              <label>
                Marca *
                <input
                  value={newCross.marca}
                  onChange={(event) =>
                    setNewCross((current) => ({
                      ...current,
                      marca: event.target.value,
                    }))
                  }
                  placeholder="Ej. GATES"
                />
              </label>

              <label>
                Número de parte *
                <input
                  value={newCross.numero_parte}
                  onChange={(event) =>
                    setNewCross((current) => ({
                      ...current,
                      numero_parte: event.target.value,
                    }))
                  }
                  placeholder="Ej. ABC-123"
                />
              </label>
            </div>

            <button
              type="submit"
              className="admin-op-btn admin-op-btn-primary admin-op-btn-full"
              disabled={savingKey === "cross-new"}
            >
              {savingKey === "cross-new" ? (
                <Loader2 size={16} className="spin-icon" />
              ) : (
                <Plus size={16} />
              )}
              Agregar cruce
            </button>
          </form>

          <div className="admin-ops-list">
            {crossList.length > 0 ? (
              crossList.map((item) => (
                <div className="admin-ops-row" key={item.id}>
                  <div className="admin-ops-form-grid two-cols">
                    <label>
                      Marca
                      <input
                        value={item.marca}
                        onChange={(event) =>
                          updateCrossDraft(item.id, "marca", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Número de parte
                      <input
                        value={item.numero_parte}
                        onChange={(event) =>
                          updateCrossDraft(
                            item.id,
                            "numero_parte",
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="admin-ops-actions">
                    <button
                      type="button"
                      className="admin-op-btn admin-op-btn-primary"
                      onClick={() => saveCross(item)}
                      disabled={savingKey === `cross-${item.id}`}
                    >
                      <Save size={15} />
                      Guardar
                    </button>

                    <button
                      type="button"
                      className="admin-op-btn admin-op-btn-danger"
                      onClick={() => removeCross(item)}
                      disabled={savingKey === `cross-${item.id}`}
                    >
                      <Trash2 size={15} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-op-empty">Sin cruces registrados.</div>
            )}
          </div>
        </article>
      </div>

      <article className="admin-ops-card admin-ops-card-wide">
        <div className="admin-ops-title">
          <Car size={19} />
          <div>
            <h3>Aplicaciones vehiculares</h3>
            <p>
              Relaciona el producto con marca, modelo, motor y rango de años.
            </p>
          </div>
        </div>

        <form className="admin-ops-create-form" onSubmit={createApplication}>
          <div className="admin-ops-form-grid admin-ops-vehicle-grid">
            <label>
              Marca auto *
              <input
                value={newApplication.marca_auto}
                onChange={(event) =>
                  setNewApplication((current) => ({
                    ...current,
                    marca_auto: event.target.value,
                  }))
                }
                placeholder="CHEVROLET"
              />
            </label>

            <label>
              Modelo *
              <input
                value={newApplication.modelo_auto}
                onChange={(event) =>
                  setNewApplication((current) => ({
                    ...current,
                    modelo_auto: event.target.value,
                  }))
                }
                placeholder="CHEVY"
              />
            </label>

            <label>
              Motor / litros
              <input
                value={newApplication.motor}
                onChange={(event) =>
                  setNewApplication((current) => ({
                    ...current,
                    motor: event.target.value,
                  }))
                }
                placeholder="1.6L"
              />
            </label>

            <label>
              Cilindraje
              <input
                value={newApplication.cilindraje}
                onChange={(event) =>
                  setNewApplication((current) => ({
                    ...current,
                    cilindraje: event.target.value,
                  }))
                }
                placeholder="L4"
              />
            </label>

            <label>
              Detalle motor
              <input
                value={newApplication.motor_detalle}
                onChange={(event) =>
                  setNewApplication((current) => ({
                    ...current,
                    motor_detalle: event.target.value,
                  }))
                }
                placeholder="TURBO / DIESEL"
              />
            </label>

            <label>
              Año inicio
              <input
                type="number"
                value={newApplication.anio_inicio}
                onChange={(event) =>
                  setNewApplication((current) => ({
                    ...current,
                    anio_inicio: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Año fin
              <input
                type="number"
                value={newApplication.anio_fin}
                onChange={(event) =>
                  setNewApplication((current) => ({
                    ...current,
                    anio_fin: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Versión
              <input
                value={newApplication.version_auto}
                onChange={(event) =>
                  setNewApplication((current) => ({
                    ...current,
                    version_auto: event.target.value,
                  }))
                }
                placeholder="Todos"
              />
            </label>
          </div>

          <label>
            Notas
            <textarea
              rows={2}
              value={newApplication.notas}
              onChange={(event) =>
                setNewApplication((current) => ({
                  ...current,
                  notas: event.target.value,
                }))
              }
              placeholder="Notas internas de aplicación"
            />
          </label>

          <button
            type="submit"
            className="admin-op-btn admin-op-btn-primary admin-op-btn-full"
            disabled={savingKey === "application-new"}
          >
            {savingKey === "application-new" ? (
              <Loader2 size={16} className="spin-icon" />
            ) : (
              <Plus size={16} />
            )}
            Agregar aplicación
          </button>
        </form>

        <div className="admin-ops-list">
          {applicationList.length > 0 ? (
            applicationList.map((item) => (
              <div className="admin-ops-row" key={item.id}>
                <div className="admin-ops-form-grid admin-ops-vehicle-grid">
                  <label>
                    Marca auto
                    <input
                      value={item.marca_auto}
                      onChange={(event) =>
                        updateApplicationDraft(
                          item.id,
                          "marca_auto",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Modelo
                    <input
                      value={item.modelo_auto}
                      onChange={(event) =>
                        updateApplicationDraft(
                          item.id,
                          "modelo_auto",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Motor / litros
                    <input
                      value={item.motor}
                      onChange={(event) =>
                        updateApplicationDraft(
                          item.id,
                          "motor",
                          event.target.value
                        )
                      }
                      placeholder="1.6L"
                    />
                  </label>

                  <label>
                    Cilindraje
                    <input
                      value={item.cilindraje}
                      onChange={(event) =>
                        updateApplicationDraft(
                          item.id,
                          "cilindraje",
                          event.target.value
                        )
                      }
                      placeholder="L4"
                    />
                  </label>

                  <label>
                    Detalle motor
                    <input
                      value={item.motor_detalle}
                      onChange={(event) =>
                        updateApplicationDraft(
                          item.id,
                          "motor_detalle",
                          event.target.value
                        )
                      }
                      placeholder="TURBO / DIESEL"
                    />
                  </label>

                  <label>
                    Año inicio
                    <input
                      type="number"
                      value={item.anio_inicio}
                      onChange={(event) =>
                        updateApplicationDraft(
                          item.id,
                          "anio_inicio",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Año fin
                    <input
                      type="number"
                      value={item.anio_fin}
                      onChange={(event) =>
                        updateApplicationDraft(
                          item.id,
                          "anio_fin",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Versión
                    <input
                      value={item.version_auto}
                      onChange={(event) =>
                        updateApplicationDraft(
                          item.id,
                          "version_auto",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                {(item.motor_original || item.motor_label) && (
                  <div className="admin-op-empty">
                    Motor original: {item.motor_original || item.motor_label}
                    {buildApplicationMotorLabel(item) && (
                      <> · Actual: {buildApplicationMotorLabel(item)}</>
                    )}
                  </div>
                )}

                <label>
                  Notas
                  <textarea
                    rows={2}
                    value={item.notas}
                    onChange={(event) =>
                      updateApplicationDraft(
                        item.id,
                        "notas",
                        event.target.value
                      )
                    }
                  />
                </label>

                <div className="admin-ops-actions">
                  <button
                    type="button"
                    className="admin-op-btn admin-op-btn-primary"
                    onClick={() => saveApplication(item)}
                    disabled={savingKey === `application-${item.id}`}
                  >
                    <Save size={15} />
                    Guardar
                  </button>

                  <button
                    type="button"
                    className="admin-op-btn admin-op-btn-danger"
                    onClick={() => removeApplication(item)}
                    disabled={savingKey === `application-${item.id}`}
                  >
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-op-empty">Sin aplicaciones registradas.</div>
          )}
        </div>
      </article>
    </section>
  );
}