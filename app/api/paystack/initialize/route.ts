import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

type CheckoutRequest = {
  cart?: Record<string, number>;
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentMethod?: "full" | "installment";
};

export async function POST(request: Request) {
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!paystackSecret || !supabaseUrl || !supabaseKey) {
    return Response.json({ error: "Payment service is not configured." }, { status: 500 });
  }

  let body: CheckoutRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const { cart, fullName, phone, email, address, paymentMethod } = body;
  if (
    !cart || !fullName?.trim() || !phone?.trim() || !email?.trim() ||
    !address?.trim() || !["full", "installment"].includes(paymentMethod || "")
  ) {
    return Response.json({ error: "Complete your customer details and select a payment option." }, { status: 400 });
  }

  const cartEntries = Object.entries(cart);
  if (!cartEntries.length || cartEntries.some(([id, quantity]) =>
    !/^\d+$/.test(id) || !Number.isSafeInteger(quantity) || quantity < 1
  )) {
    return Response.json({ error: "Your cart is empty or invalid." }, { status: 400 });
  }

  const productIds = cartEntries.map(([id]) => Number(id));
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, available")
    .in("id", productIds)
    .eq("available", true);

  if (productsError) {
    console.error("Product validation error:", productsError.message);
    return Response.json({ error: "Could not validate your cart. Please try again." }, { status: 502 });
  }

  if (!products || products.length !== productIds.length) {
    return Response.json({ error: "One or more cart items are no longer available." }, { status: 400 });
  }

  const orderItems = cartEntries.map(([id, quantity]) => {
    const product = products.find((item) => Number(item.id) === Number(id))!;
    return { name: product.name, quantity, price: Number(product.price) };
  });
  const totalKobo = orderItems.reduce(
    (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
    0
  );
  const chargeKobo = paymentMethod === "installment"
    ? Math.round(totalKobo * 0.3)
    : totalKobo;

  if (!Number.isSafeInteger(totalKobo) || totalKobo <= 0 || !Number.isSafeInteger(chargeKobo) || chargeKobo <= 0) {
    return Response.json({ error: "The order total is invalid." }, { status: 400 });
  }

  const reference = `apex-${randomUUID()}`;
  const callbackUrl = new URL("/checkout", request.url).toString();
  const orderMetadata = {
    customer_name: fullName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    address: address.trim(),
    items: orderItems,
    total_kobo: totalKobo,
    charge_kobo: chargeKobo,
    payment_method: paymentMethod,
  };

  try {
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        amount: chargeKobo,
        currency: "NGN",
        reference,
        callback_url: callbackUrl,
        metadata: { apex_order: orderMetadata },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await paystackResponse.json();

    if (!paystackResponse.ok || result?.status !== true ||
      typeof result?.data?.authorization_url !== "string" ||
      !result.data.authorization_url.startsWith("https://checkout.paystack.com/")) {
      console.error("Paystack initialization rejected:", result?.message || paystackResponse.status);
      return Response.json({ error: "Paystack could not start your payment. Please try again." }, { status: 502 });
    }

    return Response.json({ authorizationUrl: result.data.authorization_url });
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return Response.json({ error: "Could not connect to Paystack. Please try again." }, { status: 502 });
  }
}
