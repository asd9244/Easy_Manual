package com.easymanual.springbackend.domain.user.dto;

import java.util.Map;

public class OAuth2UserInfo {

    private final Map<String, Object> attributes;
    private final String provider;

    public OAuth2UserInfo(Map<String, Object> attributes, String provider) {
        this.attributes = attributes;
        this.provider = provider;
    }

    // 🌟 수정된 기능: 카카오 로그인 시 고유 ID를 활용한 가짜 이메일 생성
    public String getEmail() {
        if ("google".equals(provider)) {
            // 구글은 이메일을 정상적으로 제공하므로 그대로 반환합니다.
            return (String) attributes.get("email");
        } else if ("kakao".equals(provider)) {
            // 카카오는 이메일 수집이 불가능하므로, 카카오가 제공하는 고유 식별자(id)를 추출합니다.
            // (주의: 카카오의 id는 Long 타입으로 넘어오므로 String으로 변환해야 합니다.)
            Object kakaoIdObj = attributes.get("id");
            if (kakaoIdObj != null) {
                String kakaoId = String.valueOf(kakaoIdObj);
                // 추출한 고유 ID를 조합하여 우리 서버 전용의 가짜 이메일 형식을 만들어 반환합니다.
                // 예: "kakao_3456789012@pixie.com"
                return "kakao_" + kakaoId + "@pixie.com";
            }
        }
        return null;
    }

    public String getNickname() {
        if ("google".equals(provider)) {
            return (String) attributes.get("name");
        } else if ("kakao".equals(provider)) {
            Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
            return properties != null ? (String) properties.get("nickname") : null;
        }
        return null;
    }
}