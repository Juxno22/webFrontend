"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    Minus,
    Plus,
    ShoppingCart,
    Trash2,
    X,
} from "lucide-react";
import {
    clearSalesCart,
    getSalesCart,
    removeSalesItem,
    updateSalesItemQuantity,
} from "@/app/lib/salesCart";

function getItemImage(item = {}) {
    return item.imagen_thumbnail_url || item.imagen_url || "";
}

function getItemCode(item = {}) {
    return item.codigo_andyfers || item.codigo_importacion || item.product_key;
}

export default function SalesCartDrawer() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);

    const totalPieces = useMemo(() => {
        return items.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    }, [items]);

    useEffect(() => {
        function refreshCart() {
            setItems(getSalesCart());
        }

        function openDrawer() {
            refreshCart();
            setOpen(true);
        }

        refreshCart();

        window.addEventListener("andyfers_sales_cart_updated", refreshCart);
        window.addEventListener("andyfers_sales_cart_open", openDrawer);
        window.addEventListener("storage", refreshCart);

        return () => {
            window.removeEventListener("andyfers_sales_cart_updated", refreshCart);
            window.removeEventListener("andyfers_sales_cart_open", openDrawer);
            window.removeEventListener("storage", refreshCart);
        };
    }, []);

    function updateQuantity(productKey, nextQuantity) {
        const updated = updateSalesItemQuantity(productKey, nextQuantity);
        setItems(updated);
    }

    function removeItem(productKey) {
        const updated = removeSalesItem(productKey);
        setItems(updated);
    }

    function clearCart() {
        const updated = clearSalesCart();
        setItems(updated);
    }

    if (!open) return null;

    return (
        <div className="sales-cart-layer" role="dialog" aria-modal="true">
            <button
                type="button"
                className="sales-cart-backdrop"
                aria-label="Cerrar carrito"
                onClick={() => setOpen(false)}
            />

            <aside className="sales-cart-drawer">
                <div className="sales-cart-head">
                    <div>
                        <span>Carrito de compra</span>
                        <h2>{totalPieces} pieza{totalPieces === 1 ? "" : "s"}</h2>
                    </div>

                    <button
                        type="button"
                        className="sales-cart-close"
                        aria-label="Cerrar carrito"
                        onClick={() => setOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="sales-cart-empty">
                        <ShoppingCart size={38} />
                        <h3>Tu carrito está vacío</h3>
                        <p>Agrega productos desde el catálogo para iniciar tu compra.</p>

                        <Link
                            href="/catalogo"
                            className="btn-primary"
                            onClick={() => setOpen(false)}
                        >
                            Ver catálogo
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="sales-cart-items">
                            {items.map((item) => {
                                const image = getItemImage(item);
                                const code = getItemCode(item);

                                return (
                                    <article className="sales-cart-item" key={item.product_key}>
                                        <div className="sales-cart-item-image">
                                            {image ? (
                                                <img src={image} alt={item.descripcion || code} />
                                            ) : (
                                                <ShoppingCart size={22} />
                                            )}
                                        </div>

                                        <div className="sales-cart-item-body">
                                            <strong>{code}</strong>
                                            <p>{item.descripcion}</p>

                                            <div className="sales-cart-item-meta">
                                                {item.familia && <span>{item.familia}</span>}
                                                {item.categoria && <span>{item.categoria}</span>}
                                            </div>

                                            <div className="sales-cart-item-actions">
                                                <div className="sales-cart-qty">
                                                    <button
                                                        type="button"
                                                        aria-label="Reducir cantidad"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.product_key,
                                                                Number(item.cantidad || 1) - 1
                                                            )
                                                        }
                                                        disabled={Number(item.cantidad || 1) <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.cantidad}
                                                        onChange={(event) =>
                                                            updateQuantity(
                                                                item.product_key,
                                                                event.target.value
                                                            )
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        aria-label="Aumentar cantidad"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.product_key,
                                                                Number(item.cantidad || 1) + 1
                                                            )
                                                        }
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="sales-cart-remove"
                                                    onClick={() => removeItem(item.product_key)}
                                                >
                                                    <Trash2 size={15} />
                                                    Quitar
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="sales-cart-footer">
                            <p>
                                El precio y existencia se validan contra el almacén ecommerce
                                antes de enviarte a Mercado Pago.
                            </p>

                            <Link
                                href="/checkout"
                                className="btn-primary sales-cart-checkout"
                                onClick={() => setOpen(false)}
                            >
                                Continuar compra
                            </Link>

                            <button
                                type="button"
                                className="sales-cart-clear"
                                onClick={clearCart}
                            >
                                Vaciar carrito
                            </button>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}