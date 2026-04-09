package com.easymanual.springbackend.global.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

// 로그인 성공 직후 JWT 토큰을 발급하고 프론트엔드로 화면을 전환(Redirect)시키는 핵심 클래스입니다.

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;

    // 소셜 로그인이 성공적으로 완료되면 Spring Security가 이 메서드를 자동으로 호출합니다.
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // 1. 인증 객체(Authentication)에서 소셜 로그인으로 가져온 유저 정보(OAuth2User)를 추출합니다.
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // 2. 유저 정보에서 이메일을 꺼냅니다. (구글은 "email", 카카오는 "kakao_account" 안에 중첩되어 있으므로 안전하게 추출해야 합니다.)
        String email = extractEmail(oAuth2User);

        // 3. 추출한 이메일을 기반으로 우리 서버 전용 JWT 토큰을 생성합니다.
        String token = jwtProvider.createToken(email);

        // 4. 프론트엔드(React/Next.js)가 토큰을 받을 수 있도록 리다이렉트할 URL을 조립합니다.
        // 예: http://localhost:3000/oauth2/redirect?token=eyJhbGci...
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/oauth2/redirect")
                .queryParam("token", token)
                .build().toUriString();

        // 5. 조립된 URL로 클라이언트의 브라우저를 강제 이동(Redirect)시킵니다.
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    // 소셜 제공자(Provider)에 따라 다르게 응답되는 JSON 구조에서 이메일을 안전하게 추출하는 헬퍼 메서드입니다.
    private String extractEmail(OAuth2User oAuth2User) {
        // 구글의 경우 최상단에 "email" 키가 존재합니다.
        if (oAuth2User.getAttributes().containsKey("email")) {
            return (String) oAuth2User.getAttributes().get("email");
        }
        // 카카오의 경우 "kakao_account" 객체 내부에 "email" 키가 존재합니다.
        if (oAuth2User.getAttributes().containsKey("kakao_account")) {
            java.util.Map<String, Object> kakaoAccount = (java.util.Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
            return (String) kakaoAccount.get("email");
        }
        throw new IllegalArgumentException("이메일 정보를 찾을 수 없습니다.");
    }
}