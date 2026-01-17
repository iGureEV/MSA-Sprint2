package com.hotelio.monolith.controller;

import com.hotelio.monolith.entity.Booking;
import com.hotelio.monolith.service.BookingService;
import com.hotelio.monolith.service.GrpcBookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final GrpcBookingService grpcBookingService;

    public BookingController(BookingService bookingService, GrpcBookingService grpcBookingService) {
        this.bookingService = bookingService;
        this.grpcBookingService = grpcBookingService;
    }

    // GET /api/bookings?userId=123
    @GetMapping
    public List<Booking> listBookings(@RequestParam(required = false) String userId,
                                       @RequestParam(defaultValue = "false") boolean ms) {
        if (ms) {
            return grpcBookingService.listAll(userId);
        }
        return bookingService.listAll(userId);
    }

    // POST /api/bookings
    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestParam String userId,
                                                 @RequestParam String hotelId,
                                                 @RequestParam(required = false) String promoCode,
                                                 @RequestParam(defaultValue = "false") boolean ms) {
        if (ms) {
            Booking booking = grpcBookingService.createBooking(userId, hotelId, promoCode);
            return ResponseEntity.ok(booking);
        }
        
        Booking booking = bookingService.createBooking(userId, hotelId, promoCode);
        return ResponseEntity.ok(booking);
    }
}
