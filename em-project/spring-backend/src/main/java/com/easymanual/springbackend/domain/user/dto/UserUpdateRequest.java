package com.easymanual.springbackend.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 프론트엔드가 닉네임을 바꿀 때 사용할 바구니를 새로 만듭니다.

@Getter
@NoArgsConstructor
public class UserUpdateRequest {
    // 프론트엔드가 "이 닉네임으로 바꿔주세요!" 하고 보낼 데이터입니다.
    // (나중에 비밀번호 변경도 필요하면 여기에 private String password; 를 추가하면 됩니다.)
    private String nickname;
}