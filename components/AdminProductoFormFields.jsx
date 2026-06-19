"use client";

export const emptyProductForm = {
  codigo_andyfers: "",
  codigo_importacion: "",
  slug: "",
  categoria_id: "",
  clasif_vta: "",
  armadora: "",
  familia: "",
  marca_producto: "",
  tipo_marca_producto: "DESCONOCIDA",
  marca_producto_confirmada: 0,
  descripcion: "",
  imagen_url: "",
  descripcion_web: "",
  multiplo: "",
  unidad_medida: "PZA",
  prioridad_ia: 0,
  destacado: 0,
  nuevo_web: 0,
  visible_catalogo: 1,
  activo_web: 1,
  activo: 1,
};

const TIPOS_MARCA_PRODUCTO = [
  "OEM",
  "AFTERMARKET",
  "GENERICA",
  "DESCONOCIDA",
];

export function normalizeProductoToForm(producto = {}) {
  return {
    codigo_andyfers: producto.codigo_andyfers || "",
    codigo_importacion: producto.codigo_importacion || "",
    slug: producto.slug || "",
    categoria_id: producto.categoria_id || "",
    clasif_vta: producto.clasif_vta || "",
    armadora: producto.armadora || "",
    familia: producto.familia || "",
    marca_producto: producto.marca_producto || "",
    tipo_marca_producto: producto.tipo_marca_producto || "DESCONOCIDA",
    marca_producto_confirmada:
      Number(producto.marca_producto_confirmada) === 1 ? 1 : 0,
    descripcion: producto.descripcion || "",
    imagen_url: producto.imagen_url || "",
    descripcion_web: producto.descripcion_web || "",
    multiplo: producto.multiplo ?? "",
    unidad_medida: producto.unidad_medida || "PZA",
    prioridad_ia: producto.prioridad_ia ?? 0,
    destacado: Number(producto.destacado) === 1 ? 1 : 0,
    nuevo_web: Number(producto.nuevo_web) === 1 ? 1 : 0,
    visible_catalogo: Number(producto.visible_catalogo) === 1 ? 1 : 0,
    activo_web: Number(producto.activo_web) === 1 ? 1 : 0,
    activo: Number(producto.activo) === 1 ? 1 : 0,
  };
}

export function buildProductoPayload(form = {}) {
  return {
    codigo_andyfers: form.codigo_andyfers,
    codigo_importacion: form.codigo_importacion,
    slug: form.slug,
    categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
    clasif_vta: form.clasif_vta,
    armadora: form.armadora,
    familia: form.familia,
    marca_producto: form.marca_producto,
    tipo_marca_producto: form.tipo_marca_producto || "DESCONOCIDA",
    marca_producto_confirmada:
      Number(form.marca_producto_confirmada) === 1 ? 1 : 0,
    descripcion: form.descripcion,
    imagen_url: form.imagen_url,
    descripcion_web: form.descripcion_web,
    multiplo: form.multiplo === "" ? null : Number(form.multiplo),
    unidad_medida: form.unidad_medida || "PZA",
    prioridad_ia: Number(form.prioridad_ia || 0),
    destacado: Number(form.destacado) === 1 ? 1 : 0,
    nuevo_web: Number(form.nuevo_web) === 1 ? 1 : 0,
    visible_catalogo: Number(form.visible_catalogo) === 1 ? 1 : 0,
    activo_web: Number(form.activo_web) === 1 ? 1 : 0,
    activo: Number(form.activo) === 1 ? 1 : 0,
  };
}

export default function AdminProductoFormFields({
  form,
  categorias = [],
  updateForm,
}) {
  return (
    <>
      <div className="admin-form-grid two-cols">
        <label>
          Código Andyfers
          <input
            value={form.codigo_andyfers}
            onChange={(event) =>
              updateForm("codigo_andyfers", event.target.value)
            }
            placeholder="Ej. DP2364"
          />
        </label>

        <label>
          Código importación
          <input
            value={form.codigo_importacion}
            onChange={(event) =>
              updateForm("codigo_importacion", event.target.value)
            }
            placeholder="Ej. BA1191"
          />
        </label>
      </div>

      <div className="admin-form-grid two-cols">
        <label>
          Categoría *
          <select
            value={form.categoria_id}
            onChange={(event) => updateForm("categoria_id", event.target.value)}
          >
            <option value="">Selecciona categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Slug
          <input
            value={form.slug}
            onChange={(event) => updateForm("slug", event.target.value)}
            placeholder="Opcional"
          />
        </label>
      </div>

      <div className="admin-form-grid two-cols">
        <label>
          Familia
          <input
            value={form.familia}
            onChange={(event) => updateForm("familia", event.target.value)}
            placeholder="Ej. BOMBAS DE AGUA"
          />
        </label>

        <label>
          Armadora
          <input
            value={form.armadora}
            onChange={(event) => updateForm("armadora", event.target.value)}
            placeholder="Ej. CHEVROLET"
          />
        </label>
      </div>

      <div className="admin-form-grid three-cols">
        <label>
          Clasificación venta
          <input
            value={form.clasif_vta}
            onChange={(event) => updateForm("clasif_vta", event.target.value)}
            placeholder="Opcional"
          />
        </label>

        <label>
          Unidad medida
          <input
            value={form.unidad_medida}
            onChange={(event) => updateForm("unidad_medida", event.target.value)}
            placeholder="PZA"
          />
        </label>

        <label>
          Múltiplo
          <input
            type="number"
            step="0.01"
            value={form.multiplo}
            onChange={(event) => updateForm("multiplo", event.target.value)}
            placeholder="Opcional"
          />
        </label>
      </div>

      <label>
        Descripción *
        <textarea
          value={form.descripcion}
          onChange={(event) => updateForm("descripcion", event.target.value)}
          rows={5}
          placeholder="Descripción interna del producto"
        />
      </label>

      <label>
        Descripción web
        <textarea
          value={form.descripcion_web}
          onChange={(event) => updateForm("descripcion_web", event.target.value)}
          rows={4}
          placeholder="Descripción pública opcional"
        />
      </label>

      <label>
        Imagen URL legacy
        <input
          value={form.imagen_url}
          onChange={(event) => updateForm("imagen_url", event.target.value)}
          placeholder="Opcional. Preferible usar multimedia Cloudinary."
        />
      </label>

      <div className="admin-form-grid three-cols">
        <label>
          Marca producto
          <input
            value={form.marca_producto}
            onChange={(event) =>
              updateForm("marca_producto", event.target.value)
            }
            placeholder="Ej. ANDYFERS"
          />
        </label>

        <label>
          Tipo marca producto
          <select
            value={form.tipo_marca_producto}
            onChange={(event) =>
              updateForm("tipo_marca_producto", event.target.value)
            }
          >
            {TIPOS_MARCA_PRODUCTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>

        <label>
          Prioridad IA
          <input
            type="number"
            min="0"
            max="100"
            value={form.prioridad_ia}
            onChange={(event) => updateForm("prioridad_ia", event.target.value)}
          />
        </label>
      </div>

      <div className="admin-check-grid admin-check-grid-expanded">
        <label>
          <input
            type="checkbox"
            checked={Number(form.activo) === 1}
            onChange={(event) =>
              updateForm("activo", event.target.checked ? 1 : 0)
            }
          />
          Producto activo internamente
        </label>

        <label>
          <input
            type="checkbox"
            checked={Number(form.activo_web) === 1}
            onChange={(event) =>
              updateForm("activo_web", event.target.checked ? 1 : 0)
            }
          />
          Activo web
        </label>

        <label>
          <input
            type="checkbox"
            checked={Number(form.visible_catalogo) === 1}
            onChange={(event) =>
              updateForm("visible_catalogo", event.target.checked ? 1 : 0)
            }
          />
          Visible catálogo público
        </label>

        <label>
          <input
            type="checkbox"
            checked={Number(form.destacado) === 1}
            onChange={(event) =>
              updateForm("destacado", event.target.checked ? 1 : 0)
            }
          />
          Destacado
        </label>

        <label>
          <input
            type="checkbox"
            checked={Number(form.nuevo_web) === 1}
            onChange={(event) =>
              updateForm("nuevo_web", event.target.checked ? 1 : 0)
            }
          />
          Producto nuevo
        </label>

        <label>
          <input
            type="checkbox"
            checked={Number(form.marca_producto_confirmada) === 1}
            onChange={(event) =>
              updateForm(
                "marca_producto_confirmada",
                event.target.checked ? 1 : 0
              )
            }
          />
          Marca producto confirmada
        </label>
      </div>

      <div className="admin-field-note">
        Para aparecer en el catálogo público, el producto debe estar activo,
        activo web, visible catálogo y tener un código válido.
      </div>
    </>
  );
}