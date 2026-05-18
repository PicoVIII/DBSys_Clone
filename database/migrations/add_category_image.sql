-- Run once on existing databases:
USE ebay_clone;
ALTER TABLE Category ADD COLUMN ctgry_image VARCHAR(500) DEFAULT NULL AFTER ctgry_name;
