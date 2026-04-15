package com.easymanual.springbackend.global.seed;

import com.easymanual.springbackend.domain.user.entity.User;
import com.easymanual.springbackend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 더미 데이터(테스트용 유저) 생성 전용.
 * <p>
 * 로컬·개발에서 목록·통계 등을 채우기 위해 시드 유저를 넣을 때 사용하며,
 * 운영 환경에서는 {@code app.seed.users.enabled} 를 켜지 않는 것을 권장한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserSeedService {

    /** 더미 유저 생성 개수 */
    private static final int SEED_COUNT = 100;
    private static final String SEED_EMAIL_PREFIX = "seed-user-";
    private static final String SEED_EMAIL_DOMAIN = "@localhost.local";
    /** 첫 시드 유저 이메일 — 이미 있으면 전체 시드는 이미 실행된 것으로 본다 */
    private static final String SEED_MARKER_EMAIL = SEED_EMAIL_PREFIX + "0" + SEED_EMAIL_DOMAIN;
    /** 시드 계정 공통 로그인 비밀번호 (로컬 개발용) */
    public static final String SEED_PLAIN_PASSWORD = "SeedUser123!";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /** 더미 유저 일괄 삽입 — 이미 마커 유저가 있으면 중복 생성하지 않음 */
    @Transactional
    public void seedUsersOnce() {
        if (userRepository.existsByEmail(SEED_MARKER_EMAIL)) {
            log.info("시드 유저가 이미 존재합니다. ({} 기준) 추가하지 않습니다.", SEED_MARKER_EMAIL);
            return;
        }

        String encodedPassword = passwordEncoder.encode(SEED_PLAIN_PASSWORD);
        for (int i = 0; i < SEED_COUNT; i++) {
            String email = SEED_EMAIL_PREFIX + i + SEED_EMAIL_DOMAIN;
            User user = User.builder()
                    .email(email)
                    .password(encodedPassword)
                    .nickname("시드유저" + i)
                    .role(User.Role.USER)
                    .build();
            userRepository.save(user);
        }
        log.info("시드 유저 {}명을 추가했습니다. 로그인 비밀번호는 UserSeedService.SEED_PLAIN_PASSWORD 상수를 참고하세요.", SEED_COUNT);
    }
}
