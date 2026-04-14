package com.easymanual.springbackend.domain.user.dto;

import com.easymanual.springbackend.domain.user.entity.User;
import lombok.Getter;

@Getter
public class UserResponse {
    // 회원가입 성공 후 프론트엔드에게 돌려줄 정보 (비밀번호는 절대 주면 안 됩니다!)
    private Long id;
    private String email;
    private String nickname;
    private String theme;

    // Entity(DB 객체)를 받아서 DTO(영수증)로 변환해주는 생성자
    public UserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.theme = user.getTheme();
    }
}