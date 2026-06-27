export function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) return "";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getProductSaleInfo(producto = {}) {
  const stock = Number(
    producto.stock_total_web || producto.stock_ecommerce || 0,
  );

  const price = Number(
    producto.precio_venta_web || producto.precio_minimo || producto.precio || 0,
  );

  const backendEnabled = Number(producto.venta_web_habilitada) === 1;
  const hasStock = stock > 0;
  const hasPrice = price > 0;

  return {
    stock,
    price,
    formattedPrice: formatCurrency(price),
    hasStock,
    hasPrice,
    canSell: backendEnabled || (hasStock && hasPrice),
    stockLabel: hasStock
      ? `${stock} disponible${stock === 1 ? "" : "s"}`
      : "Sin existencia web",
    unavailableReason: !hasPrice
      ? "Sin precio web"
      : !hasStock
        ? "Sin existencia web"
        : "",
  };
}
