package com.easymanual.springbackend.global.seed;

import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import com.easymanual.springbackend.domain.chat.entity.QuestionCategory;
import com.easymanual.springbackend.domain.chat.repository.ChatRoomRepository;
import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.domain.device.repository.UserDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ThreadLocalRandom;

/**
 * 더미 데이터(테스트용 chat_rooms) 생성 전용.
 * <p>
 * 시드 유저 기기({@link UserDeviceSeedService}로 만들어진 행)마다 채팅방을 2개까지 두고,
 * {@link QuestionCategory}는 매번 무작위로 지정한다. 이미 2개 이상이면 건너뛴다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomSeedService {

    private static final int ROOMS_PER_DEVICE = 2;
    private static final int TITLE_MAX = 200;

    private final UserDeviceRepository userDeviceRepository;
    private final ChatRoomRepository chatRoomRepository;

    @Transactional
    public void seedChatRoomsForSeedUserDevices() {
        var devices = userDeviceRepository.findAllActiveForSeedUsers(UserDevice.DeviceStatus.ACTIVE);
        if (devices.isEmpty()) {
            log.info("시드 기기가 없어 chat_rooms 시드를 건너뜁니다.");
            return;
        }

        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        QuestionCategory[] categories = QuestionCategory.values();
        int created = 0;

        for (UserDevice ud : devices) {
            long existing = chatRoomRepository.countByUserDevice_Id(ud.getId());
            int need = ROOMS_PER_DEVICE - (int) existing;
            if (need <= 0) {
                continue;
            }
            for (int i = 0; i < need; i++) {
                QuestionCategory category = categories[rnd.nextInt(categories.length)];
                String title = buildTitle((int) existing + i + 1, category);
                ChatRoom room = ChatRoom.builder()
                        .userDevice(ud)
                        .title(title)
                        .questionCategory(category)
                        .build();
                chatRoomRepository.save(room);
                created++;
            }
        }

        if (created > 0) {
            log.info("시드 chat_rooms {}건을 추가했습니다. (기기당 최대 {}개, question_category 무작위)", created, ROOMS_PER_DEVICE);
        } else {
            log.info("추가할 시드 chat_rooms가 없습니다. (기기당 이미 {}개 이상)", ROOMS_PER_DEVICE);
        }
    }

    private String buildTitle(int roomIndex, QuestionCategory category) {
        String raw = String.format("시드 상담 #%d · %s", roomIndex, category.getLabel());
        if (raw.length() > TITLE_MAX) {
            return raw.substring(0, TITLE_MAX);
        }
        return raw;
    }
}
