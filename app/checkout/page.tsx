"use client";
import {useEffect, useState} from "react"
import { supabase } from "../lib/supabase";
const INSTALLMENT_PERCENTAGE = 30;
const BANK_DETAILS = {
  bankName: "PLACEHOLDER BANK",
  accountName: "APEX FOODS",
  accountNumber: "0000000000",
};


export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("full");
  const [products, setProducts] = useState<any[]>([]);

useEffect(() => {
  const savedCart = localStorage.getItem("apex-cart");

  if (savedCart) {
    const data = JSON.parse(savedCart);
    console.log("APEX CART DATA:", data);

    setCart(data.cart || {});
    setProducts(data.products || []);
  }
}, []);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");


  const cartItems = products.filter(
  (product) => Number(cart[Number(product.id)]) > 0
);

const totalPrice = cartItems.reduce(
  (total, product) =>
    total + Number(product.price) * (cart[product.id] || 0),
  0
);
console.log("FINAL CART:", JSON.stringify(cart));
console.log(
  "FINAL CART ITEMS:",
  JSON.stringify(
    cartItems.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: cart[product.id],
    }))
  )
);
console.log("FINAL TOTAL:", totalPrice);
console.log("CHECKOUT PRODUCTS:", products);
console.log("CHECKOUT CART:", cart);
console.log("CHECKOUT ITEMS:", cartItems);
console.log("CHECKOUT TOTAL:", totalPrice);
  const initialPayment =
    paymentMethod === "installment"
      ? (totalPrice * INSTALLMENT_PERCENTAGE) / 100
      : totalPrice;

  const remainingBalance = totalPrice - initialPayment;

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
      alert("Account number copied!");
    } catch {
      alert("Please copy the account number manually.");
    }
  };

 const handlePaymentConfirmation = async () => {
    if (!fullName || !phone || !email || !address) {
      alert("Please complete all your customer information first.");
      return;
    }

    const orderItems = Object.entries(cart)
  .filter(([, quantity]) => quantity > 0)
  .map(([productId, quantity]) => {
  const product = products.find(
  (item) => Number(item.id) === Number(productId)
);

    return {
      name: product?.name || "Unknown product",
      quantity,
      price: product?.price || 0,
    };
  });

const { error } = await supabase
  .from("Orders")
  .insert([
    {
      customer_name: fullName,
      phone: phone,
      email: email,
      address: address,
      items: JSON.stringify(orderItems),
      "total price": totalPrice,
      payment_method: paymentMethod,
      payment_status: "Payment Submitted",
      order_status: "New",
    },
  ]);

if (error) {
  console.error("Order save error:", error);
  alert("There was a problem saving your order. Please try again.");
  return;
}

setPaymentSubmitted(true);
    alert("Payment confirmation received! Your order has been submitted.");
  };
  if (paymentSubmitted) {
    return (
      <main className="min-h-screen bg-green-50 px-6 py-12">
        <div className="mx-auto max-w-2xl">

          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">

            <div className="text-6xl">
              ✅
            </div>

            <h1 className="mt-5 text-3xl font-extrabold text-green-700">
              Payment Notification Received
            </h1>

            <p className="mt-4 text-gray-600">
              Thank you, {fullName}.
            </p>

            <p className="mt-2 text-gray-600">
              Your order has been submitted successfully. Apex Foods
              will review your payment and process your order.
            </p>

            <div className="mt-6 rounded-xl bg-green-50 p-5 text-left">

              <div className="flex justify-between border-b pb-3">
                <span className="font-semibold">
                  Order Total
                </span>

                <strong>
                  ₦{totalPrice.toLocaleString()}
                </strong>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="font-semibold">
                  Amount Paid
                </span>

                <strong className="text-green-700">
                  ₦{initialPayment.toLocaleString()}
                </strong>
              </div>

              {paymentMethod === "installment" && (
                <div className="mt-3 flex justify-between">
                  <span className="font-semibold">
                    Remaining Balance
                  </span>

                  <strong className="text-red-600">
                    ₦{remainingBalance.toLocaleString()}
                  </strong>
                </div>
              )}

            </div>

            <a
              href="/"
              className="mt-8 inline-block rounded-lg bg-green-700 px-8 py-4 font-bold text-white hover:bg-green-800"
            >
              Back to Shop
            </a>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-green-700 px-6 py-5 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">

          <a
            href="/"
            className="text-2xl font-extrabold"
          >
            Apex Foods
          </a>

          <a
            href="/"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-green-700"
          >
            ← Back to Shop
          </a>

        </div>
      </header>

      {/* CONTENT */}
      <section className="px-6 py-12">

        <div className="mx-auto max-w-6xl">

          <div className="mb-10">

            <p className="font-semibold uppercase tracking-widest text-green-700">
              Apex Foods
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">
              Checkout
            </h1>

            <p className="mt-2 text-gray-600">
              Enter your details and complete your order.
            </p>

          </div>

          <div className="grid gap-8 lg:grid-cols-3">

            {/* LEFT SIDE */}
            <div className="rounded-2xl bg-white p-6 shadow-md lg:col-span-2">

              {/* CUSTOMER INFORMATION */}
              <h2 className="mb-6 text-2xl font-bold">
                Customer Information
              </h2>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block font-semibold">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                  />
                </div>

                <div className="md:col-span-2">

                  <label className="mb-2 block font-semibold">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                  />

                </div>

                <div className="md:col-span-2">

                  <label className="mb-2 block font-semibold">
                    Delivery Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your complete delivery address"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                  />

                </div>

              </div>

              {/* PAYMENT OPTION */}
              <div className="mt-10">

                <h2 className="mb-5 text-2xl font-bold">
                  Payment Option
                </h2>

                <div className="space-y-4">

                  {/* FULL PAYMENT */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("full")}
                    className={`w-full rounded-xl border-2 p-5 text-left transition ${
                      paymentMethod === "full"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >

                    <div className="flex items-center gap-4">

                      <div className="text-2xl">
                        💳
                      </div>

                      <div>

                        <h3 className="font-bold">
                          Pay in Full
                        </h3>

                        <p className="text-sm text-gray-600">
                          Pay the complete order amount.
                        </p>

                      </div>

                    </div>

                  </button>

                  {/* INSTALLMENT */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("installment")}
                    className={`w-full rounded-xl border-2 p-5 text-left transition ${
                      paymentMethod === "installment"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >

                    <div className="flex items-center gap-4">

                      <div className="text-2xl">
                        📅
                      </div>

                      <div>

                        <h3 className="font-bold">
                          Pay by Installment
                        </h3>

                        <p className="text-sm text-gray-600">
                          Pay {INSTALLMENT_PERCENTAGE}% now and complete
                          the remaining balance later.
                        </p>

                      </div>

                    </div>

                  </button>

                </div>

              </div>

              {/* INSTALLMENT BREAKDOWN */}
              {paymentMethod === "installment" && (
                <div className="mt-5 rounded-xl bg-yellow-50 p-5">

                  <h3 className="font-bold text-yellow-800">
                    Installment Payment Breakdown
                  </h3>

                  <div className="mt-4 space-y-3">

                    <div className="flex justify-between">
                      <span>Total Order</span>

                      <strong>
                        ₦{totalPrice.toLocaleString()}
                      </strong>
                    </div>

                    <div className="flex justify-between">

                      <span>
                        Initial Payment ({INSTALLMENT_PERCENTAGE}%)
                      </span>

                      <strong className="text-green-700">
                        ₦{initialPayment.toLocaleString()}
                      </strong>

                    </div>

                    <div className="flex justify-between border-t pt-3">

                      <span className="font-bold">
                        Remaining Balance
                      </span>

                      <strong className="text-red-600">
                        ₦{remainingBalance.toLocaleString()}
                      </strong>

                    </div>

                  </div>

                </div>
              )}

              {/* BANK TRANSFER */}
              <div className="mt-8 rounded-2xl border-2 border-green-100 bg-green-50 p-6">

                <div className="flex items-center gap-3">

                  <div className="text-3xl">
                    🏦
                  </div>

                  <div>

                    <h2 className="text-2xl font-bold text-green-800">
                      Bank Transfer
                    </h2>

                   <p className="text-sm font-semibold text-black">
  Transfer the amount shown below to the account.
</p>

                  </div>

                </div>

                <div className="mt-6 space-y-4 rounded-xl bg-white p-5">

                  <div className="flex justify-between">
                    <span className="font-bold text-black">
  Bank Name
</span>

                    <strong>
                      {BANK_DETAILS.bankName}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-bold text-black">
  Account Name
</span>

                    <strong>
                      {BANK_DETAILS.accountName}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="font-bold text-black">
  Account Number
</p>

                      <p className="text-xl font-extrabold tracking-wider">
                        {BANK_DETAILS.accountNumber}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={copyAccountNumber}
                      className="rounded-lg bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800"
                    >
                      📋 Copy
                    </button>

                  </div>

                  <div className="border-t pt-4">

                   <p className="text-sm font-bold text-black">
  Amount to transfer
</p>

                    <p className="text-3xl font-extrabold text-green-700">
                      ₦{initialPayment.toLocaleString()}
                    </p>

                    {paymentMethod === "installment" && (
                      <p className="mt-1 text-sm font-semibold text-black">
  This is your 30% initial installment.
</p>
                    )}

                  </div>

                </div>

                <p className="mt-4 text-sm text-gray-700">
                  After making the transfer, click the button below
                  to notify Apex Foods that your payment has been made.
                </p>

                <button
                  type="button"
                  onClick={handlePaymentConfirmation}
                  disabled={totalPrice === 0}
                  className="mt-5 w-full rounded-xl bg-green-700 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  ✅ I've Made Payment
                </button>

              </div>

            </div>

            {/* ORDER SUMMARY */}
            <aside className="h-fit rounded-2xl bg-white p-6 shadow-md">

              <h2 className="text-2xl font-bold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                {cartItems.length === 0 && (
                  <p className="text-gray-500">
                    Your cart is empty.
                  </p>
                )}

                {cartItems.map((product) => (

                  <div
                    key={product.id}
                    className="flex justify-between border-b pb-4"
                  >

                    <span className="font-semibold text-black">
  {product.name} × {cart[product.id]}
</span>

                    <span className="font-semibold">
                      ₦
                      {(
                        product.price * cart[product.id]
                      ).toLocaleString()}
                    </span>

                  </div>

                ))}

              </div>

              <div className="mt-6 flex items-center justify-between">

                <span className="text-lg font-extrabold text-black">
  Estimated Total
</span>

                <span className="text-2xl font-extrabold text-green-700">
                  ₦{totalPrice.toLocaleString()}
                </span>

              </div>

              <div className="mt-6 rounded-xl bg-green-50 p-4">

                <p className="text-sm font-bold text-black">
  Amount to pay now
</p>

                <p className="text-2xl font-extrabold text-green-700">
                  ₦{initialPayment.toLocaleString()}
                </p>

                {paymentMethod === "installment" && (
                  <p className="mt-2 text-sm font-semibold text-black">
  Remaining balance: ₦
  {remainingBalance.toLocaleString()}
</p>
                )}

              </div>

            </aside>

          </div>

        </div>

      </section>

    </main>
  );
}