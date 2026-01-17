package com.hotelio.monolith;

import com.hotelio.monolith.service.BookingService;
import com.hotelio.monolith.service.GrpcBookingService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(scanBasePackages = {"com.hotelio", "com.hotelio.monolith"})
public class MonolithApplication {
    public static void main(String[] args) {
        SpringApplication.run(MonolithApplication.class, args);
    }

    @Bean
    public CommandLineRunner logBeans(ApplicationContext ctx) {
        return args -> {
            System.out.println("➡️  BookingService beans:");

            String[] bookingBeans = ctx.getBeanNamesForType(BookingService.class);
            for (String name : bookingBeans) {
                System.out.println("    - " + name + ": " + ctx.getBean(name).getClass());
            }

            String[] grpcBeans = ctx.getBeanNamesForType(GrpcBookingService.class);
            for (String name : grpcBeans) {
                System.out.println("    - " + name + ": " + ctx.getBean(name).getClass());
            }
        };
    }

}
