package com.easymanual.springbackend.domain.user.service;

import com.easymanual.springbackend.domain.user.dto.*;
import com.easymanual.springbackend.domain.user.entity.User;
import com.easymanual.springbackend.domain.user.repository.UserRepository;
import com.easymanual.springbackend.global.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 실제 회원가입 로직이 들어가는 곳입니다. 중복을 검사하고, 비밀번호를 암호화해서 DB에 저장합니다.

@Service
@RequiredArgsConstructor // final이 붙은 도구들을 스프링이 알아서 꽂아줍니다(의존성 주입).
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    // @Transactional: 이 요리 과정 중 하나라도 에러가 나면 모든 걸 취소(Rollback)해주는 안전장치
    @Transactional
    public UserResponse signUp(SignUpRequest request) {
        // 1. 이메일 중복 검사
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        // 2. 비밀번호 암호화 (예: "1234" -> "$2a$10$x8...")
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 3. DB에 저장할 User 엔티티(객체) 만들기
        User newUser = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .nickname(request.getNickname())
                .role(User.Role.USER) // 기본 권한은 일반 유저
                .build();

        // 4. DB에 저장!
        User savedUser = userRepository.save(newUser);

        // 5. 저장된 정보를 영수증(DTO)으로 바꿔서 반환
        return new UserResponse(savedUser);
    }


    // 로그인 기능
    @Transactional(readOnly = true) // 데이터 수정 없이 읽기만 하므로 속도를 높여주는 옵션입니다.
    public LoginResponse login(LoginRequest request) {
        // 1. DB에서 이메일로 유저 찾기 (없으면 에러 발생)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 유저의 상태(status)가 DELETED(탈퇴)인 경우, 비밀번호 검사 전에 즉시 예외를 발생시켜 로그인을 차단합니다.
        if (user.getStatus() == User.UserStatus.DELETED) {
            throw new IllegalArgumentException("탈퇴한 회원입니다. 로그인이 불가능합니다.");
        }

        // 2. 비밀번호 확인 (매우 중요!)
        // DB에는 암호화된 복잡한 비밀번호가 들어있으므로, passwordEncoder.matches() 라는 전용 도구로 비교해야 합니다.
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 틀렸습니다.");
        }

        // 3. 이메일과 비밀번호가 모두 맞다면, 기계를 돌려 JWT 토큰(팔찌)을 생성합니다.
        String token = jwtProvider.createToken(user.getEmail());

        // 4. 생성된 토큰을 영수증(LoginResponse)에 담아서 반환합니다.
        return new LoginResponse(token);
    }


    // 내 정보 조회 (토큰 검사용)
    @Transactional(readOnly = true) // 데이터를 읽기만 하므로 속도 향상을 위해 readOnly를 붙여줍니다.
    public UserResponse getMyInfo(String email) {

        // 1. 매니저(Controller)가 넘겨준 이메일로 창고(DB)에서 유저를 찾습니다.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        // 2. 찾은 유저 정보를 프론트엔드에게 주기 좋게 영수증(UserResponse)에 담아서 돌려줍니다.
        // (비밀번호 같은 민감한 정보는 UserResponse 안에 없으므로 안전합니다!)
        return new UserResponse(user);
    }

    @Transactional // 변경된 내용이 DB에 자동으로 저장(Commit)
    public UserResponse updateMyInfo(String email, UserUpdateRequest request) {

        // 1. 매니저가 준 이메일로 창고(DB)에서 유저를 찾아옵니다.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        // 2. 유저 객체의 스위치를 눌러서 닉네임을 새 것으로 바꿉니다.
        // (JPA의 '더티 체킹(Dirty Checking)' 마법 덕분에, 여기서 값만 바꿔도
        // 메서드가 끝날 때 스프링이 알아서 DB에 UPDATE 쿼리를 날려줍니다! save()를 안 써도 됩니다.)
        user.updateNickname(request.getNickname());

        // 3. 변경이 완료된 유저 정보를 영수증(UserResponse)에 담아서 돌려줍니다.
        return new UserResponse(user);
    }

    // 회원 탈퇴 비즈니스 로직
    @Transactional
    public void withdrawUser(String email) {
        // 1. SecurityContext 에서 전달받은 이메일로 DB에서 쥬어 엔티티를 조회합니다.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        // 2. 조회된 유저 엔티티의 상태 변경 메서드를 호출합니다.
        // @Transactional 어노테이션에 의해 영속성 컨텍스트(Persistence Context)가 이 객체를 관리하고 있으므로,
        // 객체의 값만 변경해도 트랜잭션이 종료될 때 자동으로 UPDATE SQL 쿼리가 DB로 전송됩니다. (Dirty Checking)
        user.withdraw();
    }
}