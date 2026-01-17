package com.hotelio.monolith.service;

import com.hotelio.monolith.entity.Booking;
import com.hotelio.proto.booking.*;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.List;
import java.util.stream.Collectors;
import java.time.Instant;

@Service
public class GrpcBookingService {

    private static final Logger log = LoggerFactory.getLogger(GrpcBookingService.class);

    private ManagedChannel channel;
    private BookingServiceGrpc.BookingServiceBlockingStub bookingStub;

    @PostConstruct
    private void init() {
        String bookingServiceHost = System.getenv().getOrDefault("BOOKING_SERVICE_HOST", "localhost");
        int bookingServicePort = Integer.parseInt(System.getenv().getOrDefault("BOOKING_SERVICE_PORT", "9090"));
        
        // Создаем канал для gRPC соединения с booking-service
        channel = ManagedChannelBuilder.forAddress(bookingServiceHost, bookingServicePort)
                .usePlaintext()
                .build();
        
        // Создаем блокирующий stub для синхронных вызовов
        bookingStub = BookingServiceGrpc.newBlockingStub(channel);
    }

    @PreDestroy
    private void cleanup() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
        }
    }

    public List<Booking> listAll(String userId) {
        BookingListRequest request = BookingListRequest.newBuilder()
                .setUserId(userId != null ? userId : "")
                .build();
        
        try {
            BookingListResponse response = bookingStub.listBookings(request);
            return response.getBookingsList().stream()
                    .map(this::convertToBooking)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw e;
        }
    }

    public Booking createBooking(String userId, String hotelId, String promoCode) {
        // Создаем запрос для gRPC сервиса
        BookingRequest request = BookingRequest.newBuilder()
                .setUserId(userId)
                .setHotelId(hotelId)
                .setPromoCode(promoCode != null ? promoCode : "")
                .build();

        try {
            // Вызываем удаленный сервис через gRPC
            BookingResponse response = bookingStub.createBooking(request);
        
            return convertToBooking(response);
        } catch (Exception e) {
            throw e;
        }
    }
    
    private Booking convertToBooking(BookingResponse response) { 
        log.info(
            "convertToBooking: id={}, uderId={}, hotelId={}, promo={}, discount={}, price={}",
            response.getId(),
            response.getUserId(),
            response.getHotelId(),
            response.getPromoCode(),
            response.getDiscountPercent(),
            response.getPrice()
        );
        Booking booking = new Booking();
        booking.setId(Long.valueOf(response.getId().isEmpty() ? "0" : response.getId()));
        booking.setUserId(response.getUserId());
        booking.setHotelId(response.getHotelId());
        booking.setPromoCode(response.getPromoCode().isEmpty() ? null : response.getPromoCode());
        booking.setDiscountPercent(response.getDiscountPercent());
        booking.setPrice(response.getPrice());
        booking.setCreatedAt(Instant.now());
        return booking;
    }
}