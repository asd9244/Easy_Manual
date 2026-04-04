package com.easymanual.springbackend.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 프론트엔드가 회원가입할 때 보내줄 3가지 정보

@Getter
@NoArgsConstructor
public class SignUpRequest {

    private String email;
    private String password;
    private String nickname;
}