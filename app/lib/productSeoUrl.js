const INVALID_CODES = new Set([
    "#N/A",
    "N/A",
    "NA",
    "ND",
    "N.D.",
    "SIN CODIGO",
    "SIN CÓDIGO",
    "NULL",
    "0",
]);

export function cleanProductSeoText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;

    return String(value).replace(/\s+/g, " ").trim() || fallback;
}

export function isValidProductCode(value) {
    const clean = cleanProductSeoText(value).toUpperCase();

    return Boolean(clean) && !INVALID_CODES.has(clean);
}

export function getPublicProductCode(producto = {}, fallback = "") {
    if (isValidProductCode(producto.codigo_publico)) return producto.codigo_publico;
    if (isValidProductCode(producto.codigo_andyfers)) return producto.codigo_andyfers;
    if (isValidProductCode(producto.codigo_importacion)) return producto.codigo_importacion;

    return fallback || null;
}

function getPrimaryApplication(producto = {}) {
    if (!Array.isArray(producto.aplicaciones) || producto.aplicaciones.length === 0) {
        return null;
    }

    return producto.aplicaciones[0] || null;
}

function getYearFromApplication(application = {}) {
    const start = Number(application.anio_inicio);
    const end = Number(application.anio_fin);

    if (Number.isFinite(start) && Number.isFinite(end) && start <= end) {
        return start;
    }

    if (Number.isFinite(start)) return start;
    if (Number.isFinite(end)) return end;

    return "";
}

function firstCleanValue(...values) {
    for (const value of values) {
        const clean = cleanProductSeoText(value);

        if (clean) return clean;
    }

    return "";
}

export function buildProductSeoParams(producto = {}, preferredFilters = {}) {
    const application = getPrimaryApplication(producto) || {};
    const params = new URLSearchParams();

    const anio = firstCleanValue(
        preferredFilters.anio,
        producto.seo_anio,
        getYearFromApplication(application)
    );

    const marca = firstCleanValue(
        preferredFilters.marca_auto,
        producto.seo_marca_auto,
        application.marca_auto
    );

    const modelo = firstCleanValue(
        preferredFilters.modelo_auto,
        producto.seo_modelo_auto,
        application.modelo_auto
    );

    const motor = firstCleanValue(
        preferredFilters.motor,
        producto.seo_motor,
        application.motor_label,
        application.motor
    );

    const linea = firstCleanValue(
        preferredFilters.linea,
        producto.seo_linea,
        producto.familia
    );

    if (anio) params.set("anio", anio);
    if (marca) params.set("marca_auto", marca);
    if (modelo) params.set("modelo_auto", modelo);
    if (motor) params.set("motor", motor);
    if (linea) params.set("linea", linea);

    return params;
}

export function buildProductDetailUrl(producto = {}, preferredFilters = {}) {
    const codigo = getPublicProductCode(producto);

    if (!codigo) return "/catalogo";

    const params = buildProductSeoParams(producto, preferredFilters);
    const query = params.toString();

    return `/producto/${encodeURIComponent(codigo)}${query ? `?${query}` : ""}`;
}

export function buildCanonicalProductPath(producto = {}, fallbackCode = "") {
    const codigo = getPublicProductCode(producto, fallbackCode);

    if (!codigo) return "/catalogo";

    const params = buildProductSeoParams(producto);
    const query = params.toString();

    return `/producto/${encodeURIComponent(codigo)}${query ? `?${query}` : ""}`;
}

export function hasProductSeoParams(searchParams = {}) {
    const getter = typeof searchParams.get === "function"
        ? (key) => searchParams.get(key)
        : (key) => searchParams?.[key];

    return Boolean(
        getter("anio") ||
        getter("marca_auto") ||
        getter("modelo_auto") ||
        getter("motor") ||
        getter("linea")
    );
}