"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

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
      console.error("Error loading products:", error);
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
    <main className="min-h-screen bg-white text-gray-900">

      {/* NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-green-700 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <h1 className="text-2xl font-bold">
            Apex Foods
          </h1>

          <div className="flex items-center gap-6">
            <a href="#home" className="hover:text-yellow-300">
              Home
            </a>

            <a href="#products" className="hover:text-yellow-300">
              Products
            </a>

            <a href="#about" className="hover:text-yellow-300">
              About
            </a>

            <div className="rounded-full bg-white px-4 py-2 font-bold text-green-700">
              🛒 Cart: {totalItems}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        id="home"
        className="bg-green-50 px-6 py-20 text-center"
      >
        <div className="mx-auto max-w-4xl">

          <p className="mb-3 font-semibold uppercase tracking-widest text-green-700">
            Fresh • Affordable • Reliable
          </p>

          <h2 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Quality Raw Foodstuffs
            <span className="block text-green-700">
              For Your Everyday Needs
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Find quality raw foodstuffs for your home or business with Apex Foods.
            Browse our selection, see prices upfront and place your order
            online with ease.
          </p>

          <a
            href="#products"
            className="mt-8 inline-block rounded-lg bg-green-700 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-green-800"
          >
            Shop Now
          </a>

        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="px-6 py-16"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 text-center">
            <p className="font-semibold uppercase tracking-widest text-green-700">
              Our Products
            </p>

            <h2 className="mt-2 text-3xl font-bold md:text-4xl">
              Shop Raw Food
            </h2>

            <p className="mt-3 text-gray-600">
              Select the products you want and add them to your cart.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

            {products.map((product) => {
              const quantity = cart[product.id] || 0;

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* PRODUCT IMAGE */}
                  <div className="h-56 overflow-hidden bg-gray-100">
                    <img
                src={product.image_url || "/placeholder.jpg"}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>

                  {/* PRODUCT INFORMATION */}
                  <div className="p-6">

                    <h3 className="text-2xl font-bold">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-2xl font-extrabold text-green-700">
                      ₦{product.price.toLocaleString()}
                    </p>

                    {quantity === 0 ? (
                      <button
                        onClick={() => increaseQuantity(product.id)}
                        className="mt-5 w-full rounded-lg bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="mt-5 flex items-center justify-between rounded-lg bg-green-50 p-2">

                        <button
                          onClick={() => decreaseQuantity(product.id)}
                          className="h-10 w-10 rounded-lg bg-white text-xl font-bold text-green-700 shadow"
                        >
                          −
                        </button>

                        <span className="text-lg font-bold">
                          {quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(product.id)}
                          className="h-10 w-10 rounded-lg bg-green-700 text-xl font-bold text-white shadow"
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
      <section className="bg-green-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">

          <h2 className="text-3xl font-bold">
            Your Cart
          </h2>

          <div className="mt-6 space-y-3">

            {products
              .filter((product) => cart[product.id])
              .map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <p className="font-bold">
                      {product.name}
                    </p>

                    <p className="text-sm text-gray-500">
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
              <p className="py-6 text-center text-gray-500">
                Your cart is empty.
              </p>
            )}

          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-6">

            <span className="text-xl font-bold">
              Total
            </span>

            <span className="text-3xl font-extrabold text-green-700">
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
  className="mt-6 w-full rounded-lg bg-green-700 px-6 py-4 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
>
  Proceed to Checkout
</button>
</div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="px-6 py-16 text-center"
      >
        <div className="mx-auto max-w-3xl">

          <p className="font-semibold uppercase tracking-widest text-green-700">
            About Apex Foods
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Quality Food. Simple Ordering.
          </h2>

          <p className="mt-5 leading-8 text-gray-600">
            Apex Foods provides quality raw food products to make
            shopping easier and more convenient. Our goal is to
            provide customers with reliable products at affordable
            prices.
          </p>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-green-900 px-6 py-8 text-center text-white">

        <h2 className="text-2xl font-bold">
          Apex Foods
        </h2>

        <p className="mt-2 text-green-100">
          Quality raw food products at your convenience.
        </p>

        <p className="mt-6 text-sm text-green-200">
          © 2026 Apex Foods. All rights reserved.
        </p>

      </footer>

    </main>
  );
}
