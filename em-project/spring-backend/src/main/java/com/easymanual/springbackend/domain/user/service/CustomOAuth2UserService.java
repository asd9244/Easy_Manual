package com.easymanual.springbackend.domain.user.service;

import com.easymanual.springbackend.domain.user.dto.OAuth2UserInfo;
import com.easymanual.springbackend.domain.user.entity.User;
import com.easymanual.springbackend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

// 소셜 서버에서 유저 정보를 받아온 직후, 우리 DB와 연동하여 회원가입/로그인을 처리하는 핵심 서비스입니다.

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 소셜 로그인 성공 시 Spring Security가 자동으로 호출하는 메서드를 오버라이딩(재정의)합니다.
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        // 1. 부모 클래스(DefaultOAuth2UserService)의 메서드를 호출하여 소셜 서버로부터 유저 정보(JSON)를 가져옵니다.
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2. 어떤 소셜 서비스(구글, 카카오)를 통해 로그인했는지 식별자(provider)를 추출합니다.
        String provider = userRequest.getClientRegistration().getRegistrationId();

        // 3. 소셜 서버가 반환한 원본 데이터(Map)를 가져옵니다.
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 4. 파편화된 데이터를 통일된 규격의 DTO(OAuth2UserInfo)로 변환합니다.
        OAuth2UserInfo userInfo = new OAuth2UserInfo(attributes, provider);
        String email = userInfo.getEmail();
        String nickname = userInfo.getNickname();

        // 이메일 정보가 제공되지 않은 경우 예외를 발생시킵니다. (필수 정보 누락 방지)
        if (email == null) {
            throw new OAuth2AuthenticationException("소셜 로그인에서 이메일 정보를 제공하지 않았습니다.");
        }

        // 5. DB에서 해당 이메일로 가입된 유저가 있는지 조회합니다.
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // 6-A. 신규 유저인 경우: 임의의 비밀번호(UUID)를 생성하여 암호화한 뒤, DB에 자동 회원가입(INSERT) 처리합니다.
            // (소셜 로그인 유저는 비밀번호를 직접 입력하지 않으므로, 보안을 위해 무작위 값을 할당합니다.)
            String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());
            user = User.builder()
                    .email(email)
                    .password(randomPassword)
                    .nickname(nickname)
                    .role(User.Role.USER)
                    .build();
            userRepository.save(user);
        } else {
            // 6-B. 기존 유저인 경우: 소셜 서버에서 닉네임이 변경되었을 수 있으므로, 최신 닉네임으로 업데이트(Dirty Checking)합니다.
            // (단, 탈퇴한 계정(DELETED)인 경우 로그인을 차단하는 방어 로직을 추가합니다.)
            if (user.getStatus() == User.UserStatus.DELETED) {
                throw new OAuth2AuthenticationException("탈퇴한 회원입니다. 소셜 로그인이 불가능합니다.");
            }
            user.updateNickname(nickname);
        }

        // 7. 최종적으로 Spring Security가 인증 처리를 완료할 수 있도록,
        // 유저의 이메일(식별자)과 원본 데이터(attributes)를 담은 DefaultOAuth2User 객체를 반환합니다.
        return new DefaultOAuth2User(
                Collections.emptyList(), // 권한(Role) 리스트 (현재는 빈 리스트 전달)
                attributes, // 소셜 서버가 준 원본 데이터
                // 구글은 "email", 카카오는 "id"를 식별자 키로 사용하므로, provider에 따라 동적으로 키를 지정합니다.
                "google".equals(provider) ? "email" : "id"
        );
    }
}