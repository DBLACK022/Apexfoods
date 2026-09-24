"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
type Order = {
  id: number;
  created_at: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  items: string;
  "total price": number;
  payment_method: string;
  payment_status: string;
  order_status: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");
const [productPrice, setProductPrice] = useState("");
const [productImage, setProductImage] = useState("");
const [addingProduct, setAddingProduct] = useState(false);
const [products, setProducts] = useState<any[]>([]);
const [editingProduct, setEditingProduct] = useState<number | null>(null);
const [editName, setEditName] = useState("");
const [editPrice, setEditPrice] = useState("");
  useEffect(() => {
  checkAdmin();
}, []);

async function checkAdmin() {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    router.push("/login");
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (error || profile?.role !== "admin") {
    await supabase.auth.signOut();
    router.push("/login");
    return;
  }

  fetchOrders();
  fetchProducts();
}
async function updateOrderStatus(orderId: number, newStatus: string) {
  console.log("Trying to update:", orderId, newStatus);

  const { data, error } = await supabase
    .from("Orders")
    .update({
      order_status: newStatus,
    })
    .eq("id", orderId)
    .select("*");

  console.log("Supabase response:", { data, error });

  if (error) {
    console.error("Error updating order status:", error);
    alert("Could not update the order status.");
    return;
  }

  if (!data || data.length === 0) {
    console.error("No order was updated.");
    alert("No order was updated.");
    return;
  }

  setOrders((currentOrders) =>
    currentOrders.map((order) =>
      order.id === orderId
        ? { ...order, order_status: newStatus }
        : order
    )
  );

  alert("Order status updated successfully!");
}
  async function fetchOrders() {
    const { data, error } = await supabase
      .from("Orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }
async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading products:", error);
    return;
  }

  setProducts(data || []);
}
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Apex Foods Admin
          </h1>

          <p className="mt-2 text-gray-600">
            Manage and view customer orders.
          </p>
          <button
  onClick={async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }}
  className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
>
  Logout
</button>
        </div>

        {/* ORDERS */}
        <div className="rounded-2xl bg-white shadow-md">

          <div className="border-b p-6">
            <h2 className="text-xl font-bold">
              Customer Orders
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-gray-500">
              No orders have been received yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead className="bg-gray-50">
  <tr>
    <th className="p-4">Customer</th>
    <th className="p-4">Phone</th>
    <th className="p-4">Email</th>
    <th className="p-4">Address</th>
    <th className="p-4">Items</th>
    <th className="p-4">Total Price</th>
    <th className="p-4">Payment Method</th>
    <th className="p-4">Payment Status</th>
    <th className="p-4">Order Status</th>
    <th className="p-4">Date</th>
  </tr>
</thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t">
  <td className="p-4 font-medium">{order.customer_name}</td>

  <td className="p-4">{order.phone}</td>

  <td className="p-4">{order.email}</td>

  <td className="p-4">{order.address}</td>

  <td className="p-4">
  {(() => {
    try {
      const items = JSON.parse(order.items);

      return (
        <div className="space-y-1">
          {items.map(
            (
              item: {
                name: string;
                quantity: number;
                price: number;
              },
              index: number
            ) => (
              <div key={index}>
                {item.name} × {item.quantity} — ₦
                {Number(item.price * item.quantity).toLocaleString()}
              </div>
            )
          )}
        </div>
      );
    } catch {
      return order.items;
    }
  })()}
</td>

  <td className="p-4 font-semibold">
    ₦{Number(order["total price"]).toLocaleString()}
  </td>

  <td className="p-4">
    {order.payment_method}
  </td>

  <td className="p-4">
    {order.payment_status}
  </td>

  <td className="p-4">
  <select
   value={order.order_status || "New"}
    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
    className="rounded-lg border border-gray-300 bg-white px-3 py-2"
  >
    <option value="New">New</option>
    <option value="Processing">Processing</option>
    <option value="Completed">Completed</option>
    <option value="Cancelled">Cancelled</option>
  </select>
</td>

  <td className="p-4">
    {new Date(order.created_at).toLocaleString()}
  </td>
</tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>
{/* PRODUCT MANAGEMENT */}
        <div className="mt-8 rounded-2xl bg-white shadow-md">

          <div className="border-b p-6">
            <h2 className="text-xl font-bold">
              Product Management
            </h2>

            <p className="mt-2 text-gray-600">
              Add and manage Apex Foods products.
            </p>
          </div>

          <div className="p-6">

            <div className="grid gap-4 md:grid-cols-2">

              <input
  type="text"
  placeholder="Product name"
  value={productName}
  onChange={(e) => setProductName(e.target.value)}
  className="rounded-lg border border-gray-300 px-4 py-3"
/>

<input
  type="number"
  placeholder="Price"
  value={productPrice}
  onChange={(e) => setProductPrice(e.target.value)}
  className="rounded-lg border border-gray-300 px-4 py-3"
/>

<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (error) {
      console.error("Image upload error:", error);
      alert("Could not upload image.");
      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    setProductImage(data.publicUrl);

    alert("Image uploaded successfully!");
  }}
  className="w-full rounded-lg border border-gray-300 px-4 py-3"
/>
<button
  onClick={async () => {
    if (!productName || !productPrice) {
      alert("Please enter the product name and price.");
      return;
    }

    setAddingProduct(true);

    const { error } = await supabase
      .from("products")
      .insert({
        name: productName,
        price: Number(productPrice),
        image_url: productImage || null,
        available: true,
      });

    setAddingProduct(false);

    if (error) {
      console.error("Error adding product:", error);
      alert("Could not add product.");
      return;
    }

    alert("Product added successfully!");

    setProductName("");
    setProductPrice("");
    setProductImage("");
  }}
  disabled={addingProduct}
  className="rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
>
  {addingProduct ? "Adding..." : "Add Product"}
</button>

            </div>

          </div>

        </div>
      <div className="mt-8">
  <h3 className="mb-4 text-lg font-bold">
    Your Products
  </h3>

  {products.length === 0 ? (
    <p className="text-gray-500">
      No products added yet.
    </p>
  ) : (
    <div className="space-y-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex-1">
  {editingProduct === product.id ? (
    <div className="space-y-2">
      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        type="number"
        value={editPrice}
        onChange={(e) => setEditPrice(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <button
        onClick={async () => {
          const { data, error } = await supabase
            .from("products")
            .update({
              name: editName,
              price: Number(editPrice),
            })
            .eq("id", product.id)
            .select("*");

          if (error) {
            console.error("Error updating product:", error);
            alert("Could not update the product.");
            return;
          }

          setProducts((currentProducts) =>
            currentProducts.map((item) =>
              item.id === product.id
                ? { ...item, ...data[0] }
                : item
            )
          );

          setEditingProduct(null);
          alert("Product updated successfully!");
        }}
        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        Save
      </button>

      <button
        onClick={() => setEditingProduct(null)}
        className="ml-2 rounded-lg bg-gray-400 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500"
      >
        Cancel
      </button>
    </div>
  ) : (
    <>
      <p className="font-semibold">
        {product.name}
      </p>

      <p className="text-gray-600">
        ₦{Number(product.price).toLocaleString()}
      </p>
    </>
  )}
</div>

          <span
            className={
              product.available
                ? "rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                : "rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
            }
          >
            {product.available ? "Available" : "Unavailable"}
          </span>
          <button
  onClick={() => {
    setEditingProduct(product.id);
    setEditName(product.name);
    setEditPrice(String(product.price));
  }}
  className="mr-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
>
  Edit
</button>
          <button
  onClick={async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${product.name}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      console.error("Error deleting product:", error);
      alert("Could not delete the product.");
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.filter(
        (item) => item.id !== product.id
      )
    );

    alert("Product deleted successfully!");
  }}
  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
>
  Delete
</button>
        </div>
      ))}
    </div>
  )}
</div>
      </div>
    </main>
  );
}