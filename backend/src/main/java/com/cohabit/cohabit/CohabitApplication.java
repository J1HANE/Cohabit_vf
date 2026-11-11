package com.cohabit.cohabit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CohabitApplication {

    public static void main(String[] args) {
        SpringApplication.run(CohabitApplication.class, args);
    }

}
