package com.easymanual.springbackend.global.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

// 로그인 성공 직후 JWT 토큰을 발급하고 프론트엔드로 화면을 전환(Redirect)시키는 핵심 클래스입니다.

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;

    @org.springframework.beans.factory.annotation.Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    // 소셜 로그인이 성공적으로 완료되면 Spring Security가 이 메서드를 자동으로 호출합니다.
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // 1. 인증 객체(Authentication)에서 소셜 로그인으로 가져온 유저 정보(OAuth2User)를 추출합니다.
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // 2. 유저 정보에서 이메일을 꺼냅니다.
        String email = extractEmail(oAuth2User);

        // 3. 추출한 이메일을 기반으로 우리 서버 전용 JWT 토큰을 생성합니다.
        String token = jwtProvider.createToken(email);

        // 4. Vercel 배포 보호(Deployment Protection)를 우회하기 위해,
        //    HTTP redirect 대신 HTML 페이지를 직접 응답합니다.
        //    토큰을 URL 파라미터로 프론트엔드에 전달합니다.
        //    (localStorage는 도메인별로 분리되어 있어서 백엔드 도메인에서 저장하면 프론트에서 읽을 수 없습니다.)
        String safeToken = token.replace("\"", "").replace("<", "").replace(">", "").replace("&", "");
        String safeFrontendUrl = frontendUrl.replace("\"", "");

        response.setContentType("text/html;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_OK);
        response.getWriter().write(
            "<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body>" +
            "<script>" +
            "window.location.replace('" + safeFrontendUrl + "/auth/success?token=" + safeToken + "');" +
            "</script>" +
            "<p>로그인 처리 중입니다...</p>" +
            "</body></html>"
        );
    }

    private String extractEmail(OAuth2User oAuth2User) {
        Object emailObj = oAuth2User.getAttributes().get("email");
        if (emailObj != null) {
            return (String) emailObj;
        }
        throw new IllegalArgumentException("이메일 정보를 찾을 수 없습니다.");
    }
}