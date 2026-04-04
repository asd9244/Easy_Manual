package com.easymanual.springbackend.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 스웨거 화면에서 토큰을 테스트하려면 이 설정 파일이 꼭 필요합니다.

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        // 1. 스웨거 화면에 "JWT 토큰을 입력하세요" 라는 규칙(Scheme)을 만듭니다.
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        // 2. 모든 API를 찌를 때 이 토큰 규칙을 적용하라고 설정합니다.
        SecurityRequirement securityRequirement = new SecurityRequirement().addList("bearerAuth");

        // 3. 최종적으로 스웨거 설정에 조립해서 반환합니다.
        return new OpenAPI()
                .components(new Components().addSecuritySchemes("bearerAuth", securityScheme))
                .addSecurityItem(securityRequirement);
    }
}