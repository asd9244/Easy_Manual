package com.easymanual.springbackend.global.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * 더미 데이터 시드 — 기동 시 {@code app.seed.*.enabled} 플래그별로 실행한다.
 * <p>
 * {@code users} → {@link UserSeedService},
 * {@code user-devices} → {@link UserDeviceSeedService},
 * {@code chat-rooms} → {@link ChatRoomSeedService} (시드 계정의 기존 방·메시지 삭제 후, 기기당 3개·제품군별 칩 라운드로빈 삽입).
 * 셋 다 {@code true}면 기존과 같이 전체가 순서대로 채워진다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DummyDataSeedRunner implements CommandLineRunner {

    private static final String KEY_USERS = "app.seed.users.enabled";
    private static final String KEY_USER_DEVICES = "app.seed.user-devices.enabled";
    private static final String KEY_CHAT_ROOMS = "app.seed.chat-rooms.enabled";

    private final Environment environment;
    private final UserSeedService userSeedService;
    private final UserDeviceSeedService userDeviceSeedService;
    private final ChatRoomSeedService chatRoomSeedService;

    @Override
    public void run(String... args) {
        boolean any = false;
        if (isEnabled(KEY_USERS)) {
            any = true;
            userSeedService.seedUsersOnce();
        }
        if (isEnabled(KEY_USER_DEVICES)) {
            any = true;
            userDeviceSeedService.seedDevicesForSeedUsers();
        }
        if (isEnabled(KEY_CHAT_ROOMS)) {
            any = true;
            chatRoomSeedService.seedChatRoomsForSeedUserDevices();
        }
        if (!any) {
            log.debug("더미 시드 비활성(app.seed.users / user-devices / chat-rooms 모두 false 또는 미설정).");
        }
    }

    private boolean isEnabled(String key) {
        return Boolean.parseBoolean(environment.getProperty(key, "false"));
    }
}
