package com.easymanual.springbackend.global.config;

import com.easymanual.springbackend.global.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
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
                // 프론트엔드 주소 허용 (localhost 와 127.0.0.1 둘 다 허용)
                // LAN(예: http://192.168.x.x:3000)에서 Vite 접속 시 CORS 허용
                configuration.setAllowedOriginPatterns(List.of(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "http://192.168.*:*",
                        "http://10.*:*"
                ));
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
                                "/webjars/**",
                                "/error" // 추가: 내부 에러 발생 시 403으로 마스킹되는 현상 방지
                        ).permitAll()
                        // QR·업로드 정적 파일: <img src="/uploads/..."> 는 Authorization 헤더를 붙이지 않음
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(
                                "/api/auth/**",
                                "/oauth2/**",       // 추가: 소셜 로그인 요청 진입점 허용
                                "/login/oauth2/**"  // 추가: 소셜 로그인 인증 코드 반환점 허용
                        ).permitAll()
                        // 공유 링크로 비로그인 사용자도 대화 내용·방 제목을 읽을 수 있도록 허용
                        .requestMatchers(HttpMethod.GET, "/api/chat/rooms/*/messages").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chat/rooms/*/share-summary").permitAll()
                        .anyRequest().authenticated()
                )
                // REST 클라이언트(fetch/axios)는 302 로그인 페이지 대신 401을 받아야 한다. (리다이렉트 따라가며 HTML을 성공으로 오인 방지)
                .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        request -> request.getRequestURI().startsWith("/api/")
                ))
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}