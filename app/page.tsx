"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { publicSupabase, supabase } from "./lib/supabase";
import { countBuyLaterItems, readBuyLater, saveForLater } from "./lib/buy-later";
import HeroShowcase from "./components/home/HeroShowcase";

type BenefitIcon = "leaf" | "basket" | "shield" | "heart";
const productCategories = ["Grains", "Oils", "Proteins", "Tubers", "Others & Spices"] as const;

function getProductCategory(product: { name: string; category: string | null }) {
  const normalizedName = product.name.toLowerCase();

  if (normalizedName.includes("rice") || normalizedName.includes("beans")) return "Grains";
  if (normalizedName.includes("palm oil") || normalizedName.includes("vegetable oil")) return "Oils";

  return product.category;
}

function safeErrorField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/(apikey|api[_-]?key|token|password|secret)(\s*[:=]\s*)\S+/gi, "$1$2[REDACTED]")
    .slice(0, 500);
}

function getSupabaseErrorDiagnostics(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: safeErrorField(String(error)), code: null, details: null };
  }

  const supabaseError = error as { message?: unknown; code?: unknown; details?: unknown };
  return {
    message: safeErrorField(supabaseError.message),
    code: safeErrorField(supabaseError.code),
    details: safeErrorField(supabaseError.details),
  };
}

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
    category: string | null;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [navUser, setNavUser] = useState<User | null>(null);
  const [navProfile, setNavProfile] = useState({ fullName: "", pictureUrl: "" });
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [buyLaterCount, setBuyLaterCount] = useState(0);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("Could not restore customer session:", error);
      const user = data.session?.user ?? null;
      setNavUser(user);
      setNavProfile({
        fullName: typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
        pictureUrl: typeof user?.user_metadata?.profile_picture_url === "string" ? user.user_metadata.profile_picture_url : "",
      });
      setAuthLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setNavUser(user);
      setNavProfile({
        fullName: typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
        pictureUrl: typeof user?.user_metadata?.profile_picture_url === "string" ? user.user_metadata.profile_picture_url : "",
      });
      setAuthLoaded(true);
      setAuthRevision((revision) => revision + 1);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const user = navUser;
    if (!user) return;
    let active = true;
    const fallback = {
      fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
      pictureUrl: typeof user.user_metadata?.profile_picture_url === "string" ? user.user_metadata.profile_picture_url : "",
    };
    void supabase.from("profiles").select("full_name, profile_picture_url").eq("id", user.id).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error("Could not load customer navigation profile:", error);
        return;
      }
      setNavProfile({
        fullName: data?.full_name || fallback.fullName,
        pictureUrl: data?.profile_picture_url || fallback.pictureUrl,
      });
    });
    return () => { active = false; };
  }, [navUser, authRevision]);

  useEffect(() => {
    fetchProducts();
    setBuyLaterCount(countBuyLaterItems(readBuyLater()));
  }, []);

  useEffect(() => {
    if (products.length < 2) return;

    const interval = window.setInterval(() => {
      setSlideshowIndex((current) => (current + 1) % products.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [products.length]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateNavHeight = () => setNavHeight(nav.getBoundingClientRect().height);
    updateNavHeight();

    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  function saveProductForLater(product: Product) {
    const quantity = cart[product.id] || 1;
    const saved = saveForLater([product], { [product.id]: quantity });
    setBuyLaterCount(countBuyLaterItems(saved));
    setCart((current) => {
      if (!current[product.id]) return current;
      const updated = { ...current };
      delete updated[product.id];
      return updated;
    });
  }

  function saveCartForLater() {
    const selectedProducts = products.filter((product) => cart[product.id] > 0);
    if (selectedProducts.length === 0) return;
    const saved = saveForLater(selectedProducts, cart);
    setBuyLaterCount(countBuyLaterItems(saved));
    setCart({});
  }

  async function fetchProducts() {
    setLoadingProducts(true);
    setProductsError(null);

    try {
      const { data, error } = await publicSupabase
        .from("products")
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false });

      if (error) {
        const diagnostics = getSupabaseErrorDiagnostics(error);
        console.error("Supabase products query failed", diagnostics);
        throw error;
      }

      const availableProducts = data || [];
      console.info("Supabase products query succeeded", {
        rowsReceived: availableProducts.length,
        categoryFieldPresent: availableProducts.some((product) => Object.prototype.hasOwnProperty.call(product, "category")),
      });
      setProducts(availableProducts);
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error)) {
        console.error("Supabase products request failed before a database response", getSupabaseErrorDiagnostics(error));
      }
      setProductsError("We could not load products right now. Please try again.");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
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

  const categoryProducts = products.filter(
    (product) => selectedCategory === "All" || getProductCategory(product) === selectedCategory
  );
  const slideshowProduct = products.length > 0 ? products[slideshowIndex % products.length] : null;

  return (
    <main className="min-h-screen bg-[#F3EBDD] text-[#19351F]">

      {/* NAVIGATION */}
      <nav ref={navRef} className="site-nav sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-6">
          <a href="#home" className="brand-mark" aria-label="APEX GREEN GLOBAL FOODS LIMITED home">
            <Image src="/apexgreen-logo.jpeg" alt="" width={44} height={59} className="brand-logo" priority />
            <span className="brand-name">APEX GREEN GLOBAL FOODS LIMITED</span>
          </a>

          <div className="nav-actions">
            <a href="#home" className="nav-link nav-link-active">Home</a>
            <a href="#products" className="nav-link">Products</a>
            <a href="#about" className="nav-link">About</a>
            <Link href="/buy-later" className="nav-link nav-account-link">Buy Later ({buyLaterCount})</Link>
            {authLoaded && (navUser ? (
              <>
                <Link href="/profile" className="nav-link nav-account-link nav-profile-link">
                  {navProfile.pictureUrl ? <img src={navProfile.pictureUrl} alt="" className="nav-profile-picture" /> : null}
                  <span>My Account</span>
                  {navProfile.fullName ? <span className="nav-user-name">{navProfile.fullName}</span> : null}
                </Link>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={async () => {
                    setSigningOut(true);
                    const { error } = await supabase.auth.signOut();
                    if (error) console.error("Customer sign out failed:", error);
                    setSigningOut(false);
                  }}
                  className="nav-link nav-account-link nav-signout"
                >{signingOut ? "Signing Out..." : "Sign Out"}</button>
              </>
            ) : (
              <>
                <Link href="/customer-login" className="nav-link nav-account-link">Sign In</Link>
                <Link href="/signup" className="nav-link nav-account-link nav-account-primary">Create Account</Link>
                <Link href="/login" className="nav-link nav-account-link nav-admin-link">Admin Login</Link>
              </>
            ))}
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

        <div className="benefit-strip relative z-10 mx-auto mt-10 max-w-7xl" aria-label="APEX GREEN GLOBAL FOODS LIMITED benefits">
          <Benefit icon="leaf" title="Quality products" description="Carefully selected raw foods" />
          <Benefit icon="basket" title="Easy ordering" description="Shop your way, with ease" />
          <Benefit icon="shield" title="Convenient checkout" description="Choose a payment option" />
          <Benefit icon="heart" title="Here for your home" description="Reliable everyday essentials" />
        </div>
      </section>
      <section
        className="product-slideshow"
        style={navHeight ? { height: `${navHeight}px` } : undefined}
        aria-label="Featured products and prices"
        aria-live="off"
      >
        {slideshowProduct ? (
          <div className="product-slideshow-content" key={slideshowProduct.id}>
            {slideshowProduct.image_url ? (
              <img src={slideshowProduct.image_url} alt="" className="product-slideshow-image" />
            ) : null}
            <span className="product-slideshow-label">Available now</span>
            <span className="product-slideshow-name">{slideshowProduct.name}</span>
            <span className="product-slideshow-price">₦{slideshowProduct.price.toLocaleString()}</span>
          </div>
        ) : (
          <p className="product-slideshow-empty">{loadingProducts ? "Loading products..." : "Explore our available products"}</p>
        )}
      </section>
      {/* PRODUCTS */}
      <section
        id="products"
        className="scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16"
        aria-labelledby="products-heading"
        aria-busy={loadingProducts}
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 text-center">
          <p className="font-semibold uppercase tracking-widest text-[#315C3A]">
              Our Products
            </p>

            <h2 id="products-heading" className="mt-2 text-3xl font-bold !text-[#19351F] md:text-4xl">
              Shop Raw Food
            </h2>

            <p className="mt-3 text-[#19351F]">
              Select the products you want and add them to your cart.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2" aria-label="Browse products by category">
            {["All", ...productCategories].map((category) => (
              <button key={category} type="button" onClick={() => setSelectedCategory(category)} aria-pressed={selectedCategory === category}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedCategory === category ? "bg-[#315C3A] text-white" : "bg-[#FFFDF8] text-[#315C3A] ring-1 ring-[#D8CFBE] hover:bg-[#E9E0CE]"}`}>
                {category}
              </button>
            ))}
          </div>

          {products.some((product) => !getProductCategory(product)) && selectedCategory === "All" ? (
            <p className="mb-6 text-center text-sm text-[#526454]">Some existing products have not been assigned a category yet.</p>
          ) : null}

          {loadingProducts ? (
            <p role="status" className="py-10 text-center text-[#526454]">Loading available products...</p>
          ) : productsError ? (
            <div role="alert" className="py-10 text-center text-[#7A3025]">
              <p>{productsError}</p>
              <button type="button" onClick={() => void fetchProducts()} className="mt-4 rounded-lg bg-[#315C3A] px-5 py-3 font-semibold text-white hover:bg-[#264A2E]">Try again</button>
            </div>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-[#526454]">No products are available right now. Please check back soon.</p>
          ) : null}

          {!loadingProducts && !productsError && products.length > 0 ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

            {categoryProducts.map((product) => {
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

                    <button
                      type="button"
                      onClick={() => saveProductForLater(product)}
                      className="mt-3 w-full rounded-lg border border-[#315C3A] px-5 py-3 font-semibold text-[#315C3A] transition hover:bg-[#F3EBDD]"
                    >
                      Save for later
                    </button>

                  </div>
                </div>
              );
            })}

            {selectedCategory !== "All" && categoryProducts.length === 0 ? (
              <article className="min-h-72 overflow-hidden rounded-2xl border-2 border-dashed border-[#CFC5B2] bg-[#FFFDF8] p-6 text-center shadow-sm">
                <div className="grid h-40 place-items-center rounded-xl bg-[#F3EBDD]" aria-hidden="true">
                  <span className="text-5xl font-light text-[#A69A84]">+</span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-[#19351F]">{selectedCategory}</h3>
                <p className="mt-2 text-sm text-[#526454]">Coming soon</p>
              </article>
            ) : null}

          </div> : null}
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
<button
  type="button"
  disabled={totalItems === 0}
  onClick={saveCartForLater}
  className="mt-3 w-full rounded-lg border border-[#315C3A] px-6 py-3 font-bold text-[#315C3A] transition hover:bg-[#F3EBDD] disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
>
  Save cart for later
</button>
</div>
      </section>

      <section className="bg-[#E9E0CE] px-4 py-14 sm:px-6 sm:py-16" aria-labelledby="problems-heading">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 text-center">
            <p className="font-semibold uppercase tracking-widest text-[#315C3A]">Dependable food supply</p>
            <h2 id="problems-heading" className="mt-2 text-3xl font-bold !text-[#19351F] md:text-4xl">PROBLEMS WE SOLVE</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["₦", "High Market Prices", "Access dependable foodstuff at fair, clearly listed prices."],
              ["↗", "Stress of Going to the Market", "Browse and place your order from home or work."],
              ["✓", "Poor Quality/Adulterated Foodstuff", "We focus on supplying clean, carefully selected food items."],
              ["▦", "Unreliable Supply for Events, Offices and Organizations", "Arrange bulk and retail supply with reliable delivery."],
            ].map(([icon, title, description]) => (
              <article key={title} className="rounded-2xl bg-[#FFFDF8] p-6 shadow-sm ring-1 ring-[#D8CFBE]">
                <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-[#315C3A] text-lg font-bold text-white">{icon}</span>
                <h3 className="mt-4 text-lg font-bold text-[#19351F]">{title}</h3>
                <p className="mt-2 leading-7 text-[#526454]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="px-4 py-12 text-center sm:px-6 sm:py-16"
        aria-labelledby="about-heading"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="about-heading" className="text-3xl font-bold !text-[#19351F]">
            ABOUT
          </h2>

          <p className="mt-5 leading-8 text-[#19351F]">
            APEX GREEN GLOBAL FOODS LIMITED is a registered foodstuff trading company based in Nigeria. We supply clean, affordable grains, oils, tubers, and other food items in bulk and retail to homes, events, offices, and businesses with reliable delivery.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#19351F] px-6 py-8 text-center text-white">

        <h2 className="text-2xl font-bold !text-white">
          APEX GREEN GLOBAL FOODS LIMITED
        </h2>

        <p className="mt-2 text-[#F3EBDD]">
          Quality raw food products at your convenience.
        </p>

        <p className="mt-6 text-sm text-[#E5DCCB]">
          © 2026 APEX GREEN GLOBAL FOODS LIMITED. All rights reserved.
        </p>

      </footer>

    </main>
  );
}
