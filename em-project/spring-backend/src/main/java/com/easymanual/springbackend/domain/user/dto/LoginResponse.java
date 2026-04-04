package com.easymanual.springbackend.domain.user.dto;

import lombok.Getter;

// 로그인이 성공했을 때, 프론트엔드에게 발급된 토큰을 전달할 객체입니다.


@Getter
public class LoginResponse {
    // 프론트엔드에게 돌려줄 JWT 팔찌 (이걸 프론트가 브라우저에 저장해둡니다)
    private String token;

    // 생성자: 토큰을 받아서 객체에 담아줍니다.
    public LoginResponse(String token) {
        this.token = token;
    }
}