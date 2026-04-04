package com.easymanual.springbackend.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 프론트엔드가 로그인 버튼을 누를 때 백엔드로 보내줄 데이터입니다.

@Getter
@NoArgsConstructor
public class LoginRequest {
    // 로그인을 위해 프론트엔드가 보내줄 2가지 정보
    private String email;
    private String password;
}