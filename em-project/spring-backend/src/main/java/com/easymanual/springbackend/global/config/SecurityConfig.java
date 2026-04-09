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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.easymanual.springbackend.domain.user.service.CustomOAuth2UserService;
import com.easymanual.springbackend.global.security.OAuth2SuccessHandler;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    // 소셜 로그인 처리를 위한 서비스와 핸들러를 의존성 주입
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    // 프론트엔드(localhost:3000)의 접근을 허용하는 CORS 설정 객체를 생성합니다.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 프론트엔드 주소 허용
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        // GET, POST, PUT, DELETE 등 모든 HTTP 메서드 허용
        configuration.setAllowedMethods(List.of("*"));
        // 모든 헤더(Authorization 등) 허용
        configuration.setAllowedHeaders(List.of("*"));
        // 프론트엔드에서 인증 정보(토큰 등)를 포함해서 보낼 수 있도록 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 모든 API 주소("/**")에 위 설정을 적용합니다.
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                // OAuth2 소셜 로그인 설정 활성화
                .oauth2Login(oauth2 -> oauth2
                        // 소셜 로그인 성공 시 유저 정보를 처리할 커스텀 서비스(CustomOAuth2UserService)를 등록합니다.
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        // 소셜 로그인 및 DB 저장까지 모두 성공하면 실행될 커스텀 핸들러(OAuth2SuccessHandler)를 등록합니다.
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}