export interface User {
  user_id: number;
  fname: string;
  lname: string;
  phone: string;
  email: string;
  password: string;
}

export interface BuyerAddress {
  baddr_id: number;
  user_id: number;
  baddr_street: string;
  baddr_city: string;
  baddr_country: string;
  baddr_pcode: string;
}

export interface Category {
  ctgry_id: number;
  ctgry_name: string;
  ctgry_image: string | null;
  parent_id: number | null;
}

export interface Product {
  prdct_id: number;
  user_id: number;
  prdct_name: string;
  prdct_brand: string | null;
  prdct_cond: string;
  prdct_desc: string | null;
}

export interface Listing {
  listg_id: number;
  prdct_id: number;
  user_id: number;
  ctgry_id: number;
  listg_title: string;
  listg_format: string;
  listg_startprice: number | null;
  listg_fixedprice: number | null;
  listg_reserveprice: number | null;
  listg_bestoffer: string;
  listg_status: string;
  listg_quantity: number;
  listg_startdate: string;
  listg_enddate: string;
}

export interface ListingImage {
  image_id: number;
  listg_id: number;
  image_url: string;
  image_alt: string | null;
  image_sortorder: number;
}

export interface Bid {
  bid_id: number;
  listg_id: number;
  user_id: number;
  bid_amount: number;
  bid_date: string;
  bid_status: string;
}

export interface BestOffer {
  bstof_id: number;
  listg_id: number;
  user_id: number;
  bstof_amount: number;
  bstof_date: string;
  bstof_status: string;
}

export interface Watchlist {
  user_id: number;
  listg_id: number;
  created_at: string;
}

export interface Cart {
  cart_id: number;
  user_id: number;
  created_at: string;
}

export interface CartItem {
  cart_id: number;
  listg_id: number;
  quantity: number;
}

export interface OrderList {
  order_id: number;
  user_id: number;
  baddr_id: number;
  order_date: string;
  order_status: string;
  order_totalamount: number;
  cancel_reason: string | null;
  cancel_requested_at: string | null;
}

export interface OrderItem {
  order_id: number;
  listg_id: number;
  ordit_quantity: number;
  ordit_itemprice: number;
}

export interface Payment {
  paymt_id: number;
  order_id: number;
  paymt_method: string;
  paymt_amount: number;
  paymt_date: string;
  paymt_status: string;
}

export interface Courier {
  courr_id: number;
  courr_name: string;
  courr_phone: string;
  courr_email: string;
}

export interface Shipment {
  shpmt_id: number;
  order_id: number;
  courr_id: number;
  shpmt_trackingno: string;
  shpmt_shipdate: string;
  shpmt_expectdate: string;
  shpmt_deliverydate: string | null;
  shpmt_status: string;
}

export interface Feedback {
  fdbck_id: number;
  listg_id: number;
  buyer_user_id: number;
  seller_user_id: number;
  fdbck_comment: string;
  fdbck_type: string;
  fdbck_date: string;
}

export interface Conversation {
  conv_id: number;
  listg_id: number | null;
  buyer_id: number;
  seller_id: number;
  conv_created: string;
}

export interface Message {
  msg_id: number;
  conv_id: number;
  sender_id: number;
  msg_content: string;
  msg_created: string;
  msg_read: string | null;
}

export interface Notification {
  notif_id: number;
  user_id: number;
  notif_type: string;
  notif_content: string;
  notif_link: string | null;
  notif_is_read: number;
  notif_created: string;
}

export interface Report {
  rprt_id: number;
  reporter_user_id: number;
  reported_user_id: number | null;
  listg_id: number | null;
  rprt_reason: string;
  rprt_description: string | null;
  rprt_date: string;
  rprt_status: string;
}
