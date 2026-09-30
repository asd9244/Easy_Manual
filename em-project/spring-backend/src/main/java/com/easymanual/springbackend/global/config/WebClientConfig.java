package com.easymanual.springbackend.global.config;

import io.netty.channel.ChannelOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    // WebClient 기본값은 타임아웃이 없어 AI 서버가 응답하지 않으면 요청이 끝없이 대기한다.
    private static final int CONNECT_TIMEOUT_MILLIS = 5_000;
    // GPU에서 모델 첫 로딩 66~69초, CPU 전용 71초+(2026-09-30 측정)를 넉넉히 넘기는 값
    private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(180);

    @Value("${ai.backend.url}")
    private String aiBackendUrl;

    @Bean
    public WebClient webClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MILLIS)
                .responseTimeout(RESPONSE_TIMEOUT);

        return WebClient.builder()
                .baseUrl(aiBackendUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
