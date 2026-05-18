-- Run once on existing databases:
USE ebay_clone;

ALTER TABLE Feedback
  ADD COLUMN fdbck_rating TINYINT NULL AFTER fdbck_type;

UPDATE Feedback
SET fdbck_rating = CASE
  WHEN fdbck_type = 'Positive' THEN 5
  WHEN fdbck_type = 'Neutral' THEN 3
  WHEN fdbck_type = 'Negative' THEN 1
  WHEN fdbck_type REGEXP '^[1-5]$' THEN CAST(fdbck_type AS UNSIGNED)
  ELSE 5
END
WHERE fdbck_rating IS NULL;

ALTER TABLE Feedback
  MODIFY fdbck_rating TINYINT NOT NULL;
