package com.easymanual.springbackend.global.seed;

import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import com.easymanual.springbackend.domain.chat.entity.QuestionCategory;
import com.easymanual.springbackend.domain.chat.repository.ChatMessageRepository;
import com.easymanual.springbackend.domain.chat.repository.ChatRoomRepository;
import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.domain.device.repository.UserDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 더미 데이터(테스트용 chat_rooms) 생성 전용.
 * <p>
 * 기동 시 시드 유저 기기마다 기존 채팅방·메시지를 지우고, 제품군별로 고정된 제목·카테고리 2건씩 다시 넣는다.
 * (프론트 {@code guideService.ts}의 TOP 5 표시 문구와 맞춤)
 * <p>
 * {@code chat_messages}는 시드로 넣지 않더라도, 이후 앱에서 대화가 생기면 FK 때문에 방 삭제 전에 비워야 한다.
 * 벌크 DELETE는 {@code clearAutomatically}로 영속성 컨텍스트를 비우므로, 삭제 전에 {@code product_type}을 스냅샷하고
 * 삭제 후 {@link UserDevice}를 다시 조회해 삽입한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomSeedService {

    /** {@link UserDeviceRepository#findAllActiveForSeedUsers} 와 동일한 시드 계정 패턴 */
    private static final String SEED_USER_EMAIL_LIKE = "seed-user-%@localhost.local";

    private static final int TITLE_MAX = 200;

    private final UserDeviceRepository userDeviceRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional
    public void seedChatRoomsForSeedUserDevices() {
        var devices = userDeviceRepository.findAllActiveForSeedUsers(UserDevice.DeviceStatus.ACTIVE);
        if (devices.isEmpty()) {
            log.info("시드 기기가 없어 chat_rooms 시드를 건너뜁니다.");
            return;
        }

        Map<Long, String> productTypeByDeviceId = new HashMap<>();
        List<Long> deviceIds = devices.stream().map(UserDevice::getId).toList();
        for (UserDevice ud : devices) {
            productTypeByDeviceId.put(ud.getId(), ud.getManual().getProductType());
        }

        int deletedMsg = chatMessageRepository.deleteAllForChatRoomsOfSeedUsers(SEED_USER_EMAIL_LIKE);
        int deletedRooms = chatRoomRepository.deleteAllForSeedUsers(SEED_USER_EMAIL_LIKE);
        log.info("시드 chat_rooms 초기화: chat_messages {}건 삭제, chat_rooms {}건 삭제", deletedMsg, deletedRooms);

        List<UserDevice> refreshed = userDeviceRepository.findAllById(deviceIds);
        int created = 0;
        for (UserDevice ud : refreshed) {
            String productType = productTypeByDeviceId.get(ud.getId());
            for (FixedRoom spec : fixedRoomsForProductType(productType)) {
                String title = truncateTitle(spec.title());
                ChatRoom room = ChatRoom.builder()
                        .userDevice(ud)
                        .title(title)
                        .questionCategory(spec.category())
                        .build();
                chatRoomRepository.save(room);
                created++;
            }
        }

        int perDevice = refreshed.isEmpty() ? 0 : created / refreshed.size();
        log.info("시드 chat_rooms {}건을 삽입했습니다. (시드 기기 {}대 × 기기당 평균 {}건, 제목·카테고리 고정)", created,
                refreshed.size(), perDevice);
    }

    /**
     * 제품군별로 TOP 5 집계에 쓰이는 카테고리만 쓰고, 홈에 보이는 문장형 제목과 동일하게 맞춘다.
     */
    private static List<FixedRoom> fixedRoomsForProductType(String productType) {
        if (productType == null) {
            return List.of(
                    new FixedRoom(QuestionCategory.USAGE, "사용법을 알고 싶어요"),
                    new FixedRoom(QuestionCategory.MALFUNCTION, "고장·이상 증상을 해결하고 싶어요"));
        }
        return switch (productType) {
            case "에어컨" -> List.of(
                    new FixedRoom(QuestionCategory.FILTER, "필터 관련 가이드가 필요해요"),
                    new FixedRoom(QuestionCategory.REMOTE, "리모컨 사용법을 알려주세요"));
            case "냉장고" -> List.of(
                    new FixedRoom(QuestionCategory.ICE_MAKER, "아이스 메이커 사용법이 궁금해요"),
                    new FixedRoom(QuestionCategory.TEMPERATURE, "온도 설정·조절이 궁금해요"));
            case "세탁기" -> List.of(
                    new FixedRoom(QuestionCategory.CLEANING, "청소하는 방법을 알려주세요"),
                    new FixedRoom(QuestionCategory.USAGE, "사용법을 알고 싶어요"));
            default -> List.of(
                    new FixedRoom(QuestionCategory.USAGE, "사용법을 알고 싶어요"),
                    new FixedRoom(QuestionCategory.CLEANING, "청소하는 방법을 알려주세요"));
        };
    }

    private static String truncateTitle(String raw) {
        if (raw.length() <= TITLE_MAX) {
            return raw;
        }
        return raw.substring(0, TITLE_MAX);
    }

    private record FixedRoom(QuestionCategory category, String title) {
    }
}
