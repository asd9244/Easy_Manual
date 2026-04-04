package com.easymanual.springbackend.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

// 유저가 프론트엔드에서 API를 찌를 때마다, 이 파일이 가장 먼저 가로채서 팔찌를 검사합니다.

@Component
@RequiredArgsConstructor
// OncePerRequestFilter: 손님이 요청을 보낼 때마다 딱 한 번씩만 실행되는 검문소입니다.
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 손님이 내민 헤더(Authorization)에서 팔찌(토큰)를 찾아냅니다.
        String token = resolveToken(request);

        // 2. 팔찌가 존재하고, 감정 결과 진짜(validateToken)라면?
        if (StringUtils.hasText(token) && jwtProvider.validateToken(token)) {

            // 3. 팔찌에서 이메일을 꺼냅니다.
            String email = jwtProvider.getEmail(token);

            // 4. "이 손님은 인증된 손님입니다!" 라고 스프링 시큐리티(경비원)에게 보고서를 작성해서 제출합니다.
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());

            // 5. 경비원의 명부(SecurityContext)에 이 손님을 VIP로 등록합니다.
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 6. 검문이 끝났으니, 다음 단계(진짜 API)로 손님을 들여보냅니다.
        filterChain.doFilter(request, response);
    }

    // 헤더에서 "Bearer " 글자를 떼어내고 순수 토큰만 추출하는 돋보기 기능
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " 이후의 진짜 토큰만 잘라냅니다.
        }
        return null;
    }
}