package com.easymanual.springbackend.domain.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * AI backend의 /manual_images/** 를 Spring 공개 도메인으로 프록시합니다.
 *
 * 프론트엔드(Vercel) 요청 흐름:
 *   /manual_images/{product}/{file}
 *   → vercel.json 프록시 → api.fixieeasymanualonline.tech/manual_images/{product}/{file}
 *   → 이 컨트롤러 → http://ai-backend:8000/manual_images/{product}/{file}
 */
@RestController
@RequestMapping("/manual_images")
@RequiredArgsConstructor
public class ManualImageProxyController {

    private final WebClient webClient;

    @GetMapping("/{productName}/{filename}")
    public ResponseEntity<byte[]> proxyManualImage(
            @PathVariable String productName,
            @PathVariable String filename) {

        try {
            byte[] imageBytes = webClient.get()
                    .uri("/manual_images/{productName}/{filename}", productName, filename)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();

            if (imageBytes == null || imageBytes.length == 0) {
                return ResponseEntity.notFound().build();
            }

            // 확장자로 Content-Type 결정
            MediaType mediaType = MediaType.IMAGE_PNG;
            if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                mediaType = MediaType.IMAGE_JPEG;
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .body(imageBytes);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
