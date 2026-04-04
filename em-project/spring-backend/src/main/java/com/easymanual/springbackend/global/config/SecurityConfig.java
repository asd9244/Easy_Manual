package com.easymanual.springbackend.global.config;

import com.easymanual.springbackend.global.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // 1. 비밀번호를 안전하게 암호화해주는 도구
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. API 보안 규칙 설정 (경비원 명부)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // REST API에서는 CSRF 방어를 끕니다.
                .authorizeHttpRequests(auth -> auth
                        // 🌟 추가됨: Swagger UI 화면을 보기 위한 주소들은 모두 프리패스 허용!
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()

                        // 기존: 회원가입, 로그인 주소 프리패스 허용!
                        .requestMatchers("/api/auth/**").permitAll()

                        // 그 외의 모든 요청은 JWT 팔찌가 있어야만 통과!
                        .anyRequest().authenticated()
                )

                // 스프링의 기본 검문소(UsernamePassword...)가 작동하기 '전'에,
                // 우리가 만든 JWT 스캐너(jwtAuthenticationFilter)를 먼저 거치도록 입구에 설치합니다!
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}