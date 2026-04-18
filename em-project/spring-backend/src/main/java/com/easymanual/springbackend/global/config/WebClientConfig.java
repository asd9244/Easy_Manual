package com.easymanual.springbackend.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${ai.backend.url}")
    private String aiBackendUrl;

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl(aiBackendUrl)
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(50 * 1024 * 1024)) // 50MB로 대폭 증설
                .build();
    }
}