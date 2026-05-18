"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../components/navbar";
import Link from "next/link";

type OrderDetail = {
  order_id: number;
  order_date: string;
  order_status: string;
  order_totalamount: number;
  listg_id: number;
  listg_title: string;
  ordit_quantity: number;
  ordit_itemprice: number;
  seller_user_id: number;
  paymt_method: string;
  paymt_status: string;
  paymt_amount: number;
  baddr_street: string;
  baddr_city: string;
  baddr_country: string;
  baddr_pcode: string;
  buyer_fname: string;
  buyer_lname: string;
  listg_fixedprice: number;
  image_url?: string;
  cancel_reason?: string | null;
  cancel_requested_at?: string | null;
};

type ShipmentItem = {
  shpmt_id: number;
  order_id: number;
  shpmt_trackingno: string;
  shpmt_shipdate: string;
  shpmt_expectdate: string;
  shpmt_deliverydate: string | null;
  shpmt_status: string;
  courr_name: string;
};

type FeedbackInfo = {
  fdbck_id: number;
  fdbck_comment: string;
  fdbck_type: string;
  fdbck_date: string;
  buyer_user_id?: number;
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`/api/orders?user_id=${userId}`).then((r) => r.json()),
      fetch("/api/shipments").then((r) => r.json()),
    ]).then(([o, s]) => {
      const found = (o.data ?? []).find((ord: OrderDetail) => String(ord.order_id) === orderId);
      setOrder(found ?? null);
      setShipments((s.data ?? []).filter((sh: ShipmentItem) => String(sh.order_id) === orderId));
      setLoading(false);
    });
  }, [userId, orderId]);

  useEffect(() => {
    if (!order || !order.listg_id) return;
    fetch(`/api/feedback?listg_id=${order.listg_id}`)
      .then((r) => r.json())
      .then((d) => {
        const fb = (d.data ?? []).find(
          (f: FeedbackInfo) => Number(f.buyer_user_id) === Number(userId)
        );
        setFeedback(fb ?? null);
      });
  }, [order, userId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10 text-center text-gray-500">Loading order…</div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10 text-center text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg">Order not found</p>
          <Link href="/my-ebay" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Back to My eBay</Link>
        </div>
      </>
    );
  }

  const matchingShipment = shipments.find((s) => String(s.order_id) === orderId);
  const hasCancelRequest = Boolean(order.cancel_requested_at);
  const isFinished =
    order.order_status === "Completed" ||
    Boolean(
      matchingShipment?.shpmt_deliverydate ||
      matchingShipment?.shpmt_status === "Delivered"
    );
  const displayStatus = isFinished
    ? "Completed"
    : order.order_status === "Cancelled"
      ? "Cancelled"
      : hasCancelRequest
        ? "Cancellation requested"
        : order.paymt_status === "Paid"
          ? "Paid"
          : "Awaiting payment";

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link href="/" className="hover:underline text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/my-ebay" className="hover:underline text-blue-600">My eBay</Link>
          <span>/</span>
          <span className="text-gray-700">Order #{order.order_id}</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_id}</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            isFinished ? "bg-green-100 text-green-700" :
            order.order_status === "Cancelled" ? "bg-red-100 text-red-700" :
            hasCancelRequest ? "bg-purple-100 text-purple-700" :
            order.paymt_status === "Paid" ? "bg-blue-100 text-blue-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>
            {displayStatus}
          </span>
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-4">
            {/* Item */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Item</h2>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-3xl flex-shrink-0">
                  {order.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.image_url} alt="" className="w-full h-full object-cover rounded" />
                  ) : "📦"}
                </div>
                <div>
                  <Link href={`/listings/${order.listg_id}`} className="font-medium text-gray-800 hover:text-blue-600 hover:underline line-clamp-2">
                    {order.listg_title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">Qty: {order.ordit_quantity}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    ${Number(order.ordit_itemprice ?? order.listg_fixedprice ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Method</p>
                  <p className="font-medium text-gray-800">{order.paymt_method}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium text-green-700">{order.paymt_status}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-bold text-gray-900">${Number(order.order_totalamount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium text-gray-800">
                    {new Date(order.order_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Shipping</h2>
              {matchingShipment ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-gray-800">{matchingShipment.shpmt_status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Courier</p>
                      <p className="font-medium text-gray-800">{matchingShipment.courr_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tracking</p>
                      <p className="font-medium text-gray-800">{matchingShipment.shpmt_trackingno}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Shipped</p>
                      <p className="font-medium text-gray-800">
                        {new Date(matchingShipment.shpmt_shipdate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expected</p>
                      <p className="font-medium text-gray-800">
                        {new Date(matchingShipment.shpmt_expectdate).toLocaleDateString()}
                      </p>
                    </div>
                    {matchingShipment.shpmt_deliverydate && (
                      <div>
                        <p className="text-gray-500">Delivered</p>
                        <p className="font-medium text-gray-800">
                          {new Date(matchingShipment.shpmt_deliverydate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">Not yet shipped</p>
                  {order.paymt_status === "Pending" && order.order_status === "Open" && (
                    <div className="mt-3">
                      <div className="flex items-center gap-3 text-sm p-3 bg-yellow-50 rounded-lg">
                        <span>⏳</span>
                        <span className="text-yellow-800">Awaiting payment confirmation</span>
                      </div>
                    </div>
                  )}
                  {order.paymt_status === "Paid" && order.order_status === "Open" && (
                    <div className="mt-3">
                      <div className="flex items-center gap-3 text-sm p-3 bg-blue-50 rounded-lg">
                        <span>🚚</span>
                        <span className="text-blue-800">Seller will ship your item soon</span>
                      </div>
                    </div>
                  )}
                  {hasCancelRequest && (
                    <div className="mt-3">
                      <div className="flex items-center gap-3 text-sm p-3 bg-purple-50 rounded-lg">
                        <span>⏳</span>
                        <span className="text-purple-800">Cancellation requested — awaiting seller response ({order.cancel_reason})</span>
                      </div>
                    </div>
                  )}
                  {order.order_status === "Cancelled" && (
                    <div className="mt-3">
                      <div className="flex items-center gap-3 text-sm p-3 bg-red-50 rounded-lg">
                        <span>❌</span>
                        <span className="text-red-800">This order has been cancelled</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Ship to</p>
                <p className="text-sm font-medium text-gray-800">
                  {order.baddr_street}, {order.baddr_city}, {order.baddr_country} {order.baddr_pcode}
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Feedback</h2>
              {feedback ? (
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    feedback.fdbck_type === "Positive" ? "bg-green-100 text-green-700" :
                    feedback.fdbck_type === "Neutral" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {feedback.fdbck_type}
                  </span>
                  <p className="text-sm text-gray-700 mt-2">{feedback.fdbck_comment}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(feedback.fdbck_date).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No feedback left yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 space-y-3">
            <div className="border border-gray-200 rounded-lg p-4 bg-white sticky top-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3">Customer Support</h3>
              <div className="space-y-2 text-sm">
                <Link href={`/listings/${order.listg_id}`} className="block text-blue-600 hover:underline">
                  View item
                </Link>
                <Link href="/my-ebay" className="block text-blue-600 hover:underline">
                  Order history
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
