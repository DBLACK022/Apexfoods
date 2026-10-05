export type SavedProduct = {
  id: number;
  name: string;
  price: number;
  image_url?: string | null;
};

export type BuyLaterCart = {
  products: SavedProduct[];
  cart: Record<number, number>;
};

const BUY_LATER_KEY = "apex-buy-later";

export function readBuyLater(): BuyLaterCart {
  try {
    const saved = localStorage.getItem(BUY_LATER_KEY);
    if (!saved) return { products: [], cart: {} };

    const parsed = JSON.parse(saved) as Partial<BuyLaterCart>;
    const products = Array.isArray(parsed.products) ? parsed.products : [];
    const quantities = parsed.cart && typeof parsed.cart === "object" ? parsed.cart : {};
    const cart: Record<number, number> = {};

    for (const product of products) {
      const quantity = Number(quantities[product.id]);
      if (Number.isFinite(product.id) && quantity > 0) cart[product.id] = quantity;
    }

    return { products: products.filter((product) => cart[product.id]), cart };
  } catch {
    return { products: [], cart: {} };
  }
}

export function saveForLater(products: SavedProduct[], quantities: Record<number, number>) {
  const saved = readBuyLater();
  const productById = new Map(saved.products.map((product) => [product.id, product]));
  const cart = { ...saved.cart };

  for (const product of products) {
    const quantity = Number(quantities[product.id]);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    productById.set(product.id, product);
    cart[product.id] = (cart[product.id] || 0) + quantity;
  }

  const result = { products: [...productById.values()], cart };
  localStorage.setItem(BUY_LATER_KEY, JSON.stringify(result));
  return result;
}

export function writeBuyLater(data: BuyLaterCart) {
  localStorage.setItem(BUY_LATER_KEY, JSON.stringify(data));
}

export function countBuyLaterItems(data: BuyLaterCart) {
  return Object.values(data.cart).reduce((total, quantity) => total + quantity, 0);
}
