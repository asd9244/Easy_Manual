package com.easymanual.springbackend;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@Slf4j
@SpringBootApplication
public class SpringBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringBackendApplication.class, args);
        log.info("Spring Boot application started");
        System.out.println("##### Spring Boot application started #####");
        System.out.println("##### Spring Boot application started #####");
        System.out.println("##### Spring Boot application started #####");
    }

}
