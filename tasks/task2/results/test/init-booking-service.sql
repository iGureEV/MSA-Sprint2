-- app_user
DELETE FROM bookings;

-- booking_service
INSERT INTO bookings (id, user_id, hotel_id, promo_code, discount_percent, price, created_at)
VALUES
(11, 'test-user-1', 'test-hotel-1', 'TESTCODE-VIP', 20.0, 80.0, NOW()),
(22, 'test-user-2', 'test-hotel-1', null, 0.0, 90.0, NOW());