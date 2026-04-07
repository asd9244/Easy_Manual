package com.easymanual.springbackend.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// 스프링 부트는 기본적으로 보안을 위해 서버 하드디스크의 임의의 폴더에 외부(웹 브라우저)가 직접 접근하는 것을 차단합니다. 이 설정 파일은 특정 URL(예: /uploads/**)로 요청이 오면, 서버의 실제 물리적 폴더(예: 프로젝트 내의 uploads 폴더)의 파일을 읽어서 반환하도록 경로를 매핑(Mapping)해주는 역할을 합니다.

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // 클라이언트가 특정 URL로 정적 자원(이미지 등)을 요청할 때,
    // 서버의 어느 물리적 경로에서 파일을 찾을지 연결해주는 메서드입니다.
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry
                // 1. 클라이언트가 "http://localhost:8080/uploads/파일명.jpg" 형식으로 요청을 보내면
                .addResourceHandler("/uploads/**")
                // 2. 프로젝트 최상위 경로에 있는 "uploads" 폴더 내부에서 해당 파일을 찾아서 반환하도록 설정합니다.
                // (file: 접두사는 파일 시스템의 절대/상대 경로를 의미합니다.)
                .addResourceLocations("file:uploads/");
    }
}