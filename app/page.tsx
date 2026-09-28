"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import HeroShowcase from "./components/home/HeroShowcase";

type BenefitIcon = "leaf" | "basket" | "shield" | "heart";

function Benefit({ icon, title, description }: { icon: BenefitIcon; title: string; description: string }) {
  const icons: Record<BenefitIcon, string> = {
    leaf: "M20 4c-8 0-14 4-14 11a5 5 0 0 0 5 5c7 0 11-6 9-16ZM5 21c3-5 6-8 11-11",
    basket: "M3 10h18l-2 10H5L3 10Zm4 0 4-6m6 6-4-6M8 13v4m4-4v4m4-4v4",
    shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-11 2 2 4-4",
    heart: "M20.8 8.6c0 5.4-8.8 10.4-8.8 10.4S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z",
  };

  return (
    <div className="benefit-item">
      <span className="benefit-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d={icons[icon]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span><strong>{title}</strong><small>{description}</small></span>
    </div>
  );
}

export default function Home() {
  const [cart, setCart] = useState<Record<number, number>>({});
type Product = {
    id: number;
    name: string;
    price: number;
    image_url: string | null;
    available: boolean;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("available", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("PRODUCT FETCH RAW ERROR:", error);
      console.error("PRODUCT FETCH ERROR STRING:", String(error));
      console.error(
        "PRODUCT FETCH ERROR JSON:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );
      console.error("PRODUCT FETCH ERROR MESSAGE:", error?.message);
      console.error("PRODUCT FETCH ERROR CODE:", error?.code);
      console.error("PRODUCT FETCH ERROR DETAILS:", error?.details);
      console.error("PRODUCT FETCH ERROR HINT:", error?.hint);
      setLoadingProducts(false);
      return;
    }

    setProducts(data || []);
    setLoadingProducts(false);
  }
  const increaseQuantity = (id: number) => {
    setCart((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  };

  const decreaseQuantity = (id: number) => {
    setCart((current) => {
      const quantity = current[id] || 0;

      if (quantity <= 1) {
        const updated = { ...current };
        delete updated[id];
        return updated;
      }

      return {
        ...current,
        [id]: quantity - 1,
      };
    });
  };

  const totalItems = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const totalPrice = products.reduce(
    (total, product) =>
      total + product.price * (cart[product.id] || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#F3EBDD] text-[#19351F]">

      {/* NAVIGATION */}
      <nav className="site-nav sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-6">
          <a href="#home" className="brand-mark" aria-label="Apex Foods home">
            <span className="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none"><path d="M16 27V13m0 8C8.5 21 5 16.5 5 10c7.5 0 11 4.5 11 11Zm0-5c0-6 3.5-9.5 10-9.5 0 6.5-3.5 9.5-10 9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span>Apex <strong>Foods</strong></span>
          </a>

          <div className="nav-actions">
            <a href="#home" className="nav-link nav-link-active">Home</a>
            <a href="#products" className="nav-link">Shop</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#cart" className="nav-cart" aria-label={`View cart, ${totalItems} items`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.1 11.1a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.4L22 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="20" r="1.2" fill="currentColor" /><circle cx="18" cy="20" r="1.2" fill="currentColor" /></svg>
              <span>Cart</span><span className="cart-count">{totalItems}</span>
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="hero-section relative isolate overflow-hidden bg-[#F3EBDD] px-5 pb-10 pt-12 text-left sm:px-6 sm:pt-16">
        <div className="rice-grains" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => <span className="rice-grain" key={index} />)}
        </div>

        <div className="hero-layout relative z-10 mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:gap-4">
          <div className="hero-copy">
            <p className="hero-enter hero-enter-1 hero-eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              Quality raw foods <span aria-hidden="true">·</span> Naturally sourced
            </p>
            <h1 className="hero-enter hero-enter-2 hero-title !text-[#19351F]">
              Quality food,
              <span className="block text-[#315C3A]">closer to home.</span>
            </h1>
            <p className="hero-enter hero-enter-3 hero-description">
              Find quality raw foodstuffs for your home or business. Browse our
              selection, see prices upfront and place your order online with ease.
            </p>
            <div className="hero-enter hero-enter-4 hero-actions">
              <a href="#products" className="button-primary">
                Shop Now <span aria-hidden="true">-&gt;</span>
              </a>
              <a href="#products" className="button-secondary">Explore Products</a>
            </div>
            <div className="hero-proof">
              <span className="proof-avatars" aria-hidden="true"><span>AF</span><span>*</span><span>OK</span></span>
              <span><strong>Quality you can count on</strong><small>Fresh choices for everyday cooking</small></span>
            </div>
          </div>

          <HeroShowcase products={products} />
        </div>

        <div className="benefit-strip relative z-10 mx-auto mt-10 max-w-7xl" aria-label="Apex Foods benefits">
          <Benefit icon="leaf" title="Quality products" description="Carefully selected raw foods" />
          <Benefit icon="basket" title="Easy ordering" description="Shop your way, with ease" />
          <Benefit icon="shield" title="Convenient checkout" description="Choose a payment option" />
          <Benefit icon="heart" title="Here for your home" description="Reliable everyday essentials" />
        </div>
      </section>
      {/* PRODUCTS */}
      <section
        id="products"
        className="px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 text-center">
          <p className="font-semibold uppercase tracking-widest text-[#315C3A]">
              Our Products
            </p>

            <h2 className="mt-2 text-3xl font-bold !text-[#19351F] md:text-4xl">
              Shop Raw Food
            </h2>

            <p className="mt-3 text-[#19351F]">
              Select the products you want and add them to your cart.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

            {products.map((product) => {
              const quantity = cart[product.id] || 0;

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl bg-[#FFFDF8] shadow-lg ring-1 ring-[#E5DCCB] transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* PRODUCT IMAGE */}
                  <div className="h-56 overflow-hidden bg-[#EEE5D3]">
                    <img
                src={product.image_url || "/placeholder.jpg"}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>

                  {/* PRODUCT INFORMATION */}
                  <div className="p-4 sm:p-6">

                    <h3 className="break-words text-xl font-bold !text-[#19351F] sm:text-2xl">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-2xl font-extrabold text-[#315C3A]">
                      ₦{product.price.toLocaleString()}
                    </p>

                    {quantity === 0 ? (
                      <button
                        onClick={() => increaseQuantity(product.id)}
                        className="mt-5 w-full rounded-lg bg-[#315C3A] px-5 py-3 font-bold text-white transition hover:bg-[#264A2E]"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="mt-5 flex items-center justify-between rounded-lg bg-[#F3EBDD] p-2">

                        <button
                          onClick={() => decreaseQuantity(product.id)}
                          className="h-10 w-10 rounded-lg bg-[#FFFDF8] text-xl font-bold text-[#315C3A] shadow"
                        >
                          −
                        </button>

                        <span className="text-lg font-bold">
                          {quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(product.id)}
                          className="h-10 w-10 rounded-lg bg-[#315C3A] text-xl font-bold text-white shadow"
                        >
                          +
                        </button>

                      </div>
                    )}

                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* CART SUMMARY */}
      <section id="cart" className="bg-[#F3EBDD] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-[#FFFDF8] p-5 shadow-lg sm:p-8">

          <h2 className="text-3xl font-bold !text-[#19351F]">
            Your Cart
          </h2>

          <div className="mt-6 space-y-3">

            {products
              .filter((product) => cart[product.id])
              .map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-3"
                >
                  <div>
                    <p className="font-bold">
                      {product.name}
                    </p>

                    <p className="text-sm text-[#526454]">
                      {cart[product.id]} × ₦
                      {product.price.toLocaleString()}
                    </p>
                  </div>

                  <p className="font-bold">
                    ₦
                    {(
                      product.price * cart[product.id]
                    ).toLocaleString()}
                  </p>
                </div>
              ))}

            {totalItems === 0 && (
              <p className="py-6 text-center text-[#526454]">
                Your cart is empty.
              </p>
            )}

          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-6">

            <span className="text-lg font-bold sm:text-xl">
              Total
            </span>

            <span className="text-2xl font-extrabold text-[#315C3A] sm:text-3xl">
              ₦{totalPrice.toLocaleString()}
            </span>

          </div>

         <button
  disabled={totalItems === 0}
 onClick={() => {
  localStorage.setItem(
    "apex-cart",
    JSON.stringify({ cart, products })
  );

  window.location.href = "/checkout";
}}
  className="mt-6 w-full rounded-lg bg-[#315C3A] px-6 py-4 font-bold text-white transition hover:bg-[#264A2E] disabled:cursor-not-allowed disabled:bg-gray-300"
>
  Proceed to Checkout
</button>
</div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="px-4 py-12 text-center sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-3xl">

            <p className="font-semibold uppercase tracking-widest text-[#315C3A]">
            About Apex Foods
          </p>

          <h2 className="mt-2 text-3xl font-bold !text-[#19351F]">
            Quality Food. Simple Ordering.
          </h2>

          <p className="mt-5 leading-8 text-[#19351F]">
            Apex Foods provides quality raw food products to make
            shopping easier and more convenient. Our goal is to
            provide customers with reliable products at affordable
            prices.
          </p>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#19351F] px-6 py-8 text-center text-white">

        <h2 className="text-2xl font-bold !text-white">
          Apex Foods
        </h2>

        <p className="mt-2 text-[#F3EBDD]">
          Quality raw food products at your convenience.
        </p>

        <p className="mt-6 text-sm text-[#E5DCCB]">
          © 2026 Apex Foods. All rights reserved.
        </p>

      </footer>

    </main>
  );
}
