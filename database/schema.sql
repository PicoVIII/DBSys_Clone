DROP DATABASE IF EXISTS ebay_clone;
CREATE DATABASE IF NOT EXISTS ebay_clone;
USE ebay_clone;

CREATE TABLE IF NOT EXISTS `User` (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  fname VARCHAR(50) NOT NULL,
  lname VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_picture VARCHAR(500) DEFAULT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  is_banned TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS BuyerAddress (
  baddr_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  baddr_street VARCHAR(100) NOT NULL,
  baddr_city VARCHAR(50) NOT NULL,
  baddr_country VARCHAR(50) NOT NULL,
  baddr_pcode VARCHAR(20) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES `User`(user_id)
);

CREATE TABLE IF NOT EXISTS Category (
  ctgry_id INT AUTO_INCREMENT PRIMARY KEY,
  ctgry_name VARCHAR(50) NOT NULL,
  ctgry_image VARCHAR(500) DEFAULT NULL,
  parent_id INT NULL,
  FOREIGN KEY (parent_id) REFERENCES Category(ctgry_id)
);

CREATE TABLE IF NOT EXISTS Product (
  prdct_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  prdct_name VARCHAR(100) NOT NULL,
  prdct_brand VARCHAR(50),
  prdct_cond VARCHAR(30) NOT NULL,
  prdct_desc TEXT,
  FOREIGN KEY (user_id) REFERENCES `User`(user_id)
);

CREATE TABLE IF NOT EXISTS Listing (
  listg_id INT AUTO_INCREMENT PRIMARY KEY,
  prdct_id INT NOT NULL,
  user_id INT NOT NULL,
  ctgry_id INT NOT NULL,
  listg_title VARCHAR(150) NOT NULL,
  listg_format VARCHAR(20) NOT NULL,
  listg_startprice DECIMAL(10, 2),
  listg_fixedprice DECIMAL(10, 2),
  listg_reserveprice DECIMAL(10, 2),
  listg_bestoffer VARCHAR(3) NOT NULL DEFAULT 'No',
  listg_status VARCHAR(20) NOT NULL DEFAULT 'Active',
  listg_quantity INT NOT NULL,
  listg_startdate DATE NOT NULL,
  listg_enddate DATE NOT NULL,
  FOREIGN KEY (prdct_id) REFERENCES Product(prdct_id),
  FOREIGN KEY (user_id) REFERENCES `User`(user_id),
  FOREIGN KEY (ctgry_id) REFERENCES Category(ctgry_id)
);

CREATE TABLE IF NOT EXISTS ListingImage (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  listg_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  image_alt VARCHAR(150),
  image_sortorder INT NOT NULL DEFAULT 0,
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id)
);

CREATE TABLE IF NOT EXISTS Bid (
  bid_id INT AUTO_INCREMENT PRIMARY KEY,
  listg_id INT NOT NULL,
  user_id INT NOT NULL,
  bid_amount DECIMAL(10, 2) NOT NULL,
  bid_date DATE NOT NULL,
  bid_status VARCHAR(20) NOT NULL,
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id),
  FOREIGN KEY (user_id) REFERENCES `User`(user_id)
);

CREATE TABLE IF NOT EXISTS BestOffer (
  bstof_id INT AUTO_INCREMENT PRIMARY KEY,
  listg_id INT NOT NULL,
  user_id INT NOT NULL,
  bstof_amount DECIMAL(10, 2) NOT NULL,
  bstof_date DATE NOT NULL,
  bstof_status VARCHAR(20) NOT NULL,
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id),
  FOREIGN KEY (user_id) REFERENCES `User`(user_id)
);

CREATE TABLE IF NOT EXISTS Watchlist (
  user_id INT NOT NULL,
  listg_id INT NOT NULL,
  created_at DATE NOT NULL,
  PRIMARY KEY (user_id, listg_id),
  FOREIGN KEY (user_id) REFERENCES `User`(user_id),
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id)
);

CREATE TABLE IF NOT EXISTS Cart (
  cart_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  created_at DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES `User`(user_id)
);

CREATE TABLE IF NOT EXISTS CartItem (
  cart_id INT NOT NULL,
  listg_id INT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (cart_id, listg_id),
  FOREIGN KEY (cart_id) REFERENCES Cart(cart_id),
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id)
);

CREATE TABLE IF NOT EXISTS OrderList (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  baddr_id INT NOT NULL,
  order_date DATE NOT NULL,
  order_status VARCHAR(20) NOT NULL,
  order_totalamount DECIMAL(10, 2) NOT NULL,
  cancel_reason VARCHAR(100) DEFAULT NULL,
  cancel_requested_at DATE DEFAULT NULL,
  CHECK (order_status IN ('Open', 'Completed', 'Cancelled', 'Returned')),
  FOREIGN KEY (user_id) REFERENCES `User`(user_id),
  FOREIGN KEY (baddr_id) REFERENCES BuyerAddress(baddr_id)
);

CREATE TABLE IF NOT EXISTS OrderItem (
  order_id INT NOT NULL,
  listg_id INT NOT NULL,
  ordit_quantity INT NOT NULL,
  ordit_itemprice DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (order_id, listg_id),
  FOREIGN KEY (order_id) REFERENCES OrderList(order_id),
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id)
);

CREATE TABLE IF NOT EXISTS Payment (
  paymt_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  paymt_method VARCHAR(50) NOT NULL,
  paymt_amount DECIMAL(10, 2) NOT NULL,
  paymt_date DATE NOT NULL,
  paymt_status VARCHAR(20) NOT NULL,
  CHECK (paymt_status IN ('Pending', 'Paid', 'Refunded', 'Failed')),
  FOREIGN KEY (order_id) REFERENCES OrderList(order_id)
);

CREATE TABLE IF NOT EXISTS Courier (
  courr_id INT AUTO_INCREMENT PRIMARY KEY,
  courr_name VARCHAR(50) NOT NULL,
  courr_phone VARCHAR(20) NOT NULL,
  courr_email VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS Shipment (
  shpmt_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  courr_id INT NOT NULL,
  shpmt_trackingno VARCHAR(50) NOT NULL,
  shpmt_shipdate DATE NOT NULL,
  shpmt_expectdate DATE NOT NULL,
  shpmt_deliverydate DATE,
  shpmt_status VARCHAR(20) NOT NULL,
  CHECK (shpmt_status IN ('Shipped', 'Delivered')),
  CHECK (shpmt_status <> 'Delivered' OR shpmt_deliverydate IS NOT NULL),
  FOREIGN KEY (order_id) REFERENCES OrderList(order_id),
  FOREIGN KEY (courr_id) REFERENCES Courier(courr_id)
);

CREATE TABLE IF NOT EXISTS Feedback (
  fdbck_id INT AUTO_INCREMENT PRIMARY KEY,
  listg_id INT NOT NULL,
  buyer_user_id INT NOT NULL,
  seller_user_id INT NOT NULL,
  fdbck_comment TEXT NOT NULL,
  fdbck_type VARCHAR(20) NOT NULL,
  fdbck_date DATE NOT NULL,
  UNIQUE KEY unique_feedback_per_transaction (listg_id, buyer_user_id, seller_user_id),
  CHECK (fdbck_type IN ('Positive', 'Neutral', 'Negative')),
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id),
  FOREIGN KEY (buyer_user_id) REFERENCES `User`(user_id),
  FOREIGN KEY (seller_user_id) REFERENCES `User`(user_id)
);

CREATE TABLE IF NOT EXISTS Report (
  rprt_id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_user_id INT NOT NULL,
  reported_user_id INT NULL,
  listg_id INT NULL,
  rprt_reason VARCHAR(100) NOT NULL,
  rprt_description TEXT,
  rprt_date DATE NOT NULL,
  rprt_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (reporter_user_id) REFERENCES `User`(user_id),
  FOREIGN KEY (reported_user_id) REFERENCES `User`(user_id),
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id)
);

CREATE TABLE IF NOT EXISTS Conversation (
  conv_id INT AUTO_INCREMENT PRIMARY KEY,
  listg_id INT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  conv_created DATE NOT NULL,
  FOREIGN KEY (listg_id) REFERENCES Listing(listg_id),
  FOREIGN KEY (buyer_id) REFERENCES `User`(user_id),
  FOREIGN KEY (seller_id) REFERENCES `User`(user_id)
);

CREATE TABLE IF NOT EXISTS Message (
  msg_id INT AUTO_INCREMENT PRIMARY KEY,
  conv_id INT NOT NULL,
  sender_id INT NOT NULL,
  msg_content TEXT NOT NULL,
  msg_created DATETIME NOT NULL,
  msg_read DATETIME NULL,
  FOREIGN KEY (conv_id) REFERENCES Conversation(conv_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES `User`(user_id)
);

CREATE TABLE IF NOT EXISTS Notification (
  notif_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  notif_type VARCHAR(30) NOT NULL,
  notif_content TEXT NOT NULL,
  notif_link VARCHAR(300) NULL,
  notif_is_read TINYINT(1) NOT NULL DEFAULT 0,
  notif_created DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES `User`(user_id)
);
