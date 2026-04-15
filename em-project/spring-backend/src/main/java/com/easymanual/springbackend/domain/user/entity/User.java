package com.easymanual.springbackend.domain.user.entity;

import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    public void updateNickname(String newNickname) {
        this.nickname = newNickname;
    }

    // 회원 탈퇴 시 상태를 DELETED로 변경하는 메서드
    // 객체 지향적인 설계를 위해, 상태 변경 로직은 엔티티 내부에 위치시킵니다.
    public void withdraw() {
        this.status = UserStatus.DELETED;
    }

    // 테마 설정 변경 로직
    public void updateTheme(String newTheme) {
        this.theme = newTheme;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // 🌟 추가됨: 테마 (light, dark, modern, sepia 등). 기본값은 생성자에서 설정.
    @Column(nullable = false, length = 50)
    private String theme;

    // 🌟 추가됨: 회원 탈퇴 여부 관리 (Soft Delete)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Builder
    public User(String email, String password, String nickname, Role role) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.role = role;
        this.status = UserStatus.ACTIVE; // 가입 시 기본값은 '활성'
        this.theme = "light"; // 가입 시 기본 테마는 'light'
    }

    public enum Role { USER, ADMIN }

    // 🌟 추가됨: 상태 Enum
    public enum UserStatus { ACTIVE, DELETED }
}