package com.easymanual.springbackend.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

//  FastAPI 서버의 주소(http://localhost:8000)를 기본값으로 세팅해 둔 통신 도구(WebClient)를 스프링 빈(Bean)으로 등록합니다.

@Configuration
public class WebClientConfig {

    // 스프링 컨테이너에 WebClient 객체를 Bean으로 등록하여,
    // 나중에 ChatService에서 의존성 주입(DI)을 받아 사용할 수 있게 합니다.
    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                // FastAPI 서버가 돌아가고 있는 기본 주소를 세팅합니다.
                // (나중에 서버를 배포할 때는 이 주소를 실제 서버 IP로 바꿔주면 됩니다.)
                .baseUrl("http://localhost:8000")
                .build();
    }
}