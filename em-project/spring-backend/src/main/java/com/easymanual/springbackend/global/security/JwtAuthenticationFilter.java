package com.easymanual.springbackend.global.security;

import com.easymanual.springbackend.domain.user.entity.User;
import com.easymanual.springbackend.domain.user.repository.UserRepository;
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
import java.util.Optional;

// 유저가 프론트엔드에서 API를 찌를 때마다, 이 파일이 가장 먼저 가로채서 팔찌를 검사합니다.

@Component
@RequiredArgsConstructor
// OncePerRequestFilter: 손님이 요청을 보낼 때마다 딱 한 번씩만 실행되는 검문소입니다.
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 손님이 내민 헤더(Authorization)에서 팔찌(토큰)를 찾아냅니다.
        String token = resolveToken(request);

        // 2. 팔찌가 존재하고, 감정 결과 진짜(validateToken)라면?
        if (StringUtils.hasText(token) && jwtProvider.validateToken(token)) {

            // 3. 팔찌에서 이메일을 꺼냅니다.
            String email = jwtProvider.getEmail(token);

            // 토큰이 유효하더라도, DB에서 해당 이메일의 유저를 조회하여 현재 상태를 확인합니다.
            Optional<User> userOptional = userRepository.findByEmail(email);

            // 4. 유저가 존재하고, 상태가 ACTIVE(활성)인 경우에만 SecurityContext에 인증 정보를 등록합니다.
            // 만약 DELETED 상태라면 인증 정보가 등록되지 않으므로, Spring Security가 403 Forbidden 에러를 발생시킵니다.
            if(userOptional.isPresent() && userOptional.get().getStatus() == User.UserStatus.ACTIVE) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());

                // 5. 경비원의 명부(SecurityContext)에 이 손님을 VIP로 등록합니다.
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
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