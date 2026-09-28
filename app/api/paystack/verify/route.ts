import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PaystackOrder = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total_kobo: number;
  charge_kobo: number;
  payment_method: "full" | "installment";
};

export async function POST(request: Request) {
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!paystackSecret || !supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Payment verification is not configured." }, { status: 500 });
  }

  let reference: unknown;
  try {
    ({ reference } = await request.json());
  } catch {
    return Response.json({ error: "Invalid verification request." }, { status: 400 });
  }
  if (typeof reference !== "string" || !/^apex-[0-9a-f-]{36}$/i.test(reference)) {
    return Response.json({ error: "Invalid payment reference." }, { status: 400 });
  }

  try {
    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${paystackSecret}` },
        signal: AbortSignal.timeout(15000),
      }
    );
    const verification = await verificationResponse.json();
    if (!verificationResponse.ok || verification?.status !== true) {
      return Response.json({ error: "Paystack could not verify this payment yet. Please retry." }, { status: 502 });
    }

    const transaction = verification.data;
    const order = transaction?.metadata?.apex_order as PaystackOrder | undefined;
    if (transaction?.status !== "success") {
      return Response.json({ error: "Payment was not completed. You can try again." }, { status: 402 });
    }
    if (
      transaction.reference !== reference || transaction.currency !== "NGN" ||
      !order || !Array.isArray(order.items) || !order.items.length ||
      !Number.isSafeInteger(order.total_kobo) || !Number.isSafeInteger(order.charge_kobo) ||
      Number(transaction.amount) !== order.charge_kobo ||
      order.charge_kobo !== (order.payment_method === "installment"
        ? Math.round(order.total_kobo * 0.3)
        : order.total_kobo) ||
      !order.customer_name || !order.phone || !order.email || !order.address ||
      !["full", "installment"].includes(order.payment_method)
    ) {
      return Response.json({ error: "Payment details did not match this order. Please contact support." }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const paymentStatus = order.payment_method === "installment"
      ? "Payment Verified (30% Installment)"
      : "Payment Verified";
    const paymentMethod = order.payment_method === "installment"
      ? "Paystack - Installment (30%)"
      : "Paystack - Full";

    const { data: orderId, error } = await supabase.rpc("create_verified_paystack_order", {
      p_reference: reference,
      p_order: {
        customer_name: order.customer_name,
        phone: order.phone,
        email: order.email,
        address: order.address,
        items: JSON.stringify(order.items),
        total_price: order.total_kobo / 100,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      },
    });

    if (error || typeof orderId !== "string") {
      console.error("Verified order persistence error:", error?.message || "Invalid order id");
      return Response.json({ error: "Payment was verified, but the order could not be saved. Please retry verification." }, { status: 500 });
    }

    return Response.json({ success: true, orderId });
  } catch (error) {
    console.error("Paystack verification error:", error);
    return Response.json({ error: "Could not verify payment due to a network error. Please retry." }, { status: 502 });
  }
}
