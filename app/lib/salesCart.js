import { trackAnalyticsEvent } from "./analytics";
import { getProductSaleInfo } from "./productSale";

const STORAGE_KEY = "ANDYFERS_SALES_CART_V1";
const MAX_CART_ITEMS = 50;
const MAX_ITEM_QUANTITY = 999;

function safeParseJson(value, fallback = []) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function isValidCode(value) {
    if (!value) return false;

    const clean = String(value).trim().toUpperCase();

    return ![
        "#N/A",
        "N/A",
        "NA",
        "ND",
        "N.D.",
        "SIN CODIGO",
        "SIN CÓDIGO",
        "NULL",
        "0",
    ].includes(clean);
}

function cleanQuantity(value) {
    const quantity = Number.parseInt(value, 10);

    if (!Number.isFinite(quantity) || quantity < 1) return 1;

    return Math.min(quantity, MAX_ITEM_QUANTITY);
}

function getProductKey(producto = {}) {
    if (isValidCode(producto.codigo_andyfers)) return producto.codigo_andyfers;
    if (isValidCode(producto.codigo_importacion)) return producto.codigo_importacion;

    return String(producto.id || producto.producto_id || "").trim();
}

function getProductCode(producto = {}) {
    if (isValidCode(producto.codigo_andyfers)) return producto.codigo_andyfers;
    if (isValidCode(producto.codigo_importacion)) return producto.codigo_importacion;

    return null;
}

function dispatchSalesCartUpdated() {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new CustomEvent("andyfers_sales_cart_updated"));
}

function dispatchToast(message) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent("andyfers_toast", {
            detail: { message },
        })
    );
}

function trackSalesCartAdd(producto, cantidad = 1) {
    if (typeof window === "undefined" || !producto) return;

    trackAnalyticsEvent("PRODUCTO_AGREGADO_CARRITO_VENTA", {
        producto_id: producto.id || producto.producto_id || null,
        codigo_andyfers: producto.codigo_andyfers || null,
        codigo_importacion: producto.codigo_importacion || null,
        categoria_nombre: producto.categoria || null,
        familia: producto.familia || null,
        cantidad,
        metadata: {
            descripcion: producto.descripcion || "",
            armadora: producto.armadora || "",
            product_key: getProductKey(producto),
        },
    });
}

export function getSalesCart() {
    if (typeof window === "undefined") return [];

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = safeParseJson(raw, []);

    return Array.isArray(parsed) ? parsed : [];
}

export function saveSalesCart(items) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    dispatchSalesCartUpdated();
}

export function openSalesCartDrawer() {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new CustomEvent("andyfers_sales_cart_open"));
}

export function addToSalesCart(producto, cantidad = 1) {
    const productKey = getProductKey(producto);
    const code = getProductCode(producto) || "Producto";
    const saleInfo = getProductSaleInfo(producto);

    if (!saleInfo.canSell) {
        dispatchToast(
            `${code} no está disponible para compra web. ${saleInfo.unavailableReason}`
        );

        return getSalesCart();
    }

    if (!productKey) {
        dispatchToast("Este producto no tiene un código válido para carrito.");
        return getSalesCart();
    }

    const current = getSalesCart();
    const quantityToAdd = cleanQuantity(cantidad);

    const existingIndex = current.findIndex(
        (item) => item.product_key === productKey
    );

    if (existingIndex >= 0) {
        current[existingIndex].cantidad = cleanQuantity(
            Number(current[existingIndex].cantidad || 1) + quantityToAdd
        );

        saveSalesCart(current);
        trackSalesCartAdd(producto, quantityToAdd);

        return current;
    }

    if (current.length >= MAX_CART_ITEMS) {
        dispatchToast(`Máximo ${MAX_CART_ITEMS} productos por carrito.`);
        return current;
    }

    const nextItem = {
        product_key: productKey,
        producto_id: producto.id || producto.producto_id || null,
        codigo_andyfers: producto.codigo_andyfers || null,
        codigo_importacion: producto.codigo_importacion || null,
        descripcion: producto.descripcion || "Producto Andyfers",
        familia: producto.familia || null,
        armadora: producto.armadora || null,
        categoria: producto.categoria || null,
        imagen_thumbnail_url:
            producto.imagen_thumbnail_url ||
            producto.imagen_principal?.thumbnail_url ||
            null,
        imagen_url:
            producto.imagen_url ||
            producto.imagen_principal?.secure_url ||
            null,
        precio_venta_web: producto.precio_venta_web || producto.precio_minimo || null,
        stock_total_web: producto.stock_total_web || 0,
        venta_web_habilitada: producto.venta_web_habilitada || 0,
        cantidad: quantityToAdd,
    };

    const updated = [...current, nextItem];

    saveSalesCart(updated);
    trackSalesCartAdd(producto, quantityToAdd);

    return updated;
}

export function updateSalesItemQuantity(productKey, cantidad) {
    const nextQuantity = cleanQuantity(cantidad);

    const updated = getSalesCart().map((item) => {
        if (item.product_key !== productKey) return item;

        return {
            ...item,
            cantidad: nextQuantity,
        };
    });

    saveSalesCart(updated);

    return updated;
}

export function removeSalesItem(productKey) {
    const updated = getSalesCart().filter(
        (item) => item.product_key !== productKey
    );

    saveSalesCart(updated);

    return updated;
}

export function clearSalesCart() {
    saveSalesCart([]);
    return [];
}

export function getSalesCartCount() {
    return getSalesCart().reduce(
        (total, item) => total + Number(item.cantidad || 0),
        0
    );
}

export function buildSalesCheckoutProductsPayload(items = getSalesCart()) {
    return items.map((item) => ({
        producto_id: item.producto_id || null,
        codigo_andyfers: item.codigo_andyfers || null,
        codigo_importacion: item.codigo_importacion || null,
        cantidad: cleanQuantity(item.cantidad),
    }));
}