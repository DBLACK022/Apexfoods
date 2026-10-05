"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  countBuyLaterItems,
  readBuyLater,
  writeBuyLater,
  type BuyLaterCart,
} from "../lib/buy-later";

export default function BuyLaterPage() {
  const [saved, setSaved] = useState<BuyLaterCart>({ products: [], cart: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSaved(readBuyLater());
    setLoaded(true);
  }, []);

  function updateSaved(next: BuyLaterCart) {
    setSaved(next);
    writeBuyLater(next);
  }

  function changeQuantity(productId: number, amount: number) {
    const quantity = Math.max(1, (saved.cart[productId] || 1) + amount);
    updateSaved({ ...saved, cart: { ...saved.cart, [productId]: quantity } });
  }

  function removeProduct(productId: number) {
    const cart = { ...saved.cart };
    delete cart[productId];
    updateSaved({
      products: saved.products.filter((product) => product.id !== productId),
      cart,
    });
  }

  const items = saved.products.filter((product) => saved.cart[product.id] > 0);
  const total = items.reduce(
    (sum, product) => sum + Number(product.price) * saved.cart[product.id],
    0
  );

  function proceedToCheckout() {
    localStorage.setItem("apex-cart", JSON.stringify({ cart: saved.cart, products: items }));
    window.location.href = "/checkout";
  }

  return (
    <main className="min-h-screen bg-[#F3EBDD] text-[#19351F]">
      <header className="bg-[#19351F] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-lg font-extrabold sm:text-xl">APEX GREEN GLOBAL FOODS LIMITED</Link>
          <Link href="/#products" className="rounded-lg bg-white px-4 py-2 font-semibold text-[#19351F]">Continue shopping</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-semibold uppercase tracking-widest text-[#315C3A]">Your saved items</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Buy Later</h1>
        <p className="mt-3 text-[#526454]">Keep items here until you’re ready to order.</p>

        {!loaded ? (
          <p role="status" className="py-12 text-center text-[#526454]">Loading saved items...</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-[#FFFDF8] p-8 text-center shadow-sm ring-1 ring-[#E5DCCB]">
            <p className="text-lg font-semibold">Your Buy Later cart is empty.</p>
            <p className="mt-2 text-[#526454]">Save products from the shop and they’ll be waiting here.</p>
            <Link href="/#products" className="mt-5 inline-block rounded-lg bg-[#315C3A] px-5 py-3 font-bold text-white">Browse products</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
            <div className="space-y-4">
              {items.map((product) => (
                <article key={product.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#FFFDF8] p-4 shadow-sm ring-1 ring-[#E5DCCB] sm:flex-nowrap">
                  <img src={product.image_url || "/placeholder.jpg"} alt={product.name} className="h-24 w-24 rounded-xl bg-[#EEE5D3] object-cover" />
                  <div className="min-w-32 flex-1">
                    <h2 className="text-lg font-bold">{product.name}</h2>
                    <p className="mt-1 font-semibold text-[#315C3A]">₦{Number(product.price).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-[#F3EBDD] p-1">
                    <button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => changeQuantity(product.id, -1)} className="h-9 w-9 rounded-md bg-white text-xl font-bold">−</button>
                    <span className="min-w-6 text-center font-bold">{saved.cart[product.id]}</span>
                    <button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => changeQuantity(product.id, 1)} className="h-9 w-9 rounded-md bg-[#315C3A] text-xl font-bold text-white">+</button>
                  </div>
                  <button type="button" onClick={() => removeProduct(product.id)} className="px-2 py-2 text-sm font-semibold text-[#7A3025] hover:underline">Remove</button>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-2xl bg-[#FFFDF8] p-5 shadow-sm ring-1 ring-[#E5DCCB]">
              <h2 className="text-xl font-bold">Saved cart summary</h2>
              <p className="mt-3 text-[#526454]">{countBuyLaterItems(saved)} item(s)</p>
              <div className="mt-4 flex justify-between border-t border-[#E5DCCB] pt-4 font-bold">
                <span>Estimated total</span><span>₦{total.toLocaleString()}</span>
              </div>
              <button type="button" onClick={proceedToCheckout} className="mt-5 w-full rounded-lg bg-[#315C3A] px-5 py-3 font-bold text-white hover:bg-[#264A2E]">Proceed to Checkout</button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
