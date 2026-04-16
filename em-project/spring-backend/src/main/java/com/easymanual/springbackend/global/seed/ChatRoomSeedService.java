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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 더미 데이터(테스트용 {@code chat_rooms}) 생성 전용.
 * <p>
 * 시드 유저 기기마다 채팅방을 {@link #ROOMS_PER_DEVICE}개씩 넣는다. 카테고리·제목은 프론트
 * {@code Chat/constants.ts}의 제품군별 칩과 동일한 순서이며, 제품군 내 기기는 ID 순으로 두고
 * 카테고리 풀을 라운드로빈하여 배정한다 ({@code (deviceIndex * ROOMS_PER_DEVICE + r) % poolSize}).
 * <p>
 * 기동 시 시드 계정의 기존 채팅방·메시지를 지운 뒤 삽입한다. 벌크 DELETE 후 영속성 컨텍스트가
 * 비워지므로 삭제 전에 {@code product_type}을 스냅샷하고, 삭제 후 {@link UserDevice}를 다시 조회한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomSeedService {

    private static final String SEED_USER_EMAIL_LIKE = "seed-user-%@localhost.local";

    /** 시드 기기당 생성할 채팅방 수 (프론트 칩 종류를 순회·분산하기 위한 단위) */
    private static final int ROOMS_PER_DEVICE = 3;

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

        Map<String, List<UserDevice>> byProductType = refreshed.stream()
                .collect(Collectors.groupingBy(ud -> {
                    String pt = productTypeByDeviceId.get(ud.getId());
                    return pt != null ? pt : "_UNKNOWN_";
                }));

        int created = 0;
        for (Map.Entry<String, List<UserDevice>> entry : byProductType.entrySet()) {
            String productTypeKey = entry.getKey();
            List<UserDevice> group = new ArrayList<>(entry.getValue());
            group.sort(Comparator.comparing(UserDevice::getId));

            List<CategorySpec> pool = categoryPoolForProductType(productTypeKey);
            int n = pool.size();
            if (n == 0) {
                log.warn("제품군 '{}'에 대한 카테고리 풀이 비어 있어 건너뜁니다.", productTypeKey);
                continue;
            }

            for (int deviceIndex = 0; deviceIndex < group.size(); deviceIndex++) {
                UserDevice ud = group.get(deviceIndex);
                int base = deviceIndex * ROOMS_PER_DEVICE;
                for (int r = 0; r < ROOMS_PER_DEVICE; r++) {
                    CategorySpec spec = pool.get((base + r) % n);
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
        }

        int perDevice = refreshed.isEmpty() ? 0 : created / refreshed.size();
        log.info(
                "시드 chat_rooms {}건 삽입 (시드 기기 {}대, 기기당 {}건, 제품군별 칩 순서 라운드로빈)",
                created,
                refreshed.size(),
                perDevice);
    }

    /**
     * 프론트 {@code Chat/constants.ts}의 PRODUCT_CATEGORIES와 동일한 순서·라벨.
     */
    private static List<CategorySpec> categoryPoolForProductType(String productTypeKey) {
        if ("_UNKNOWN_".equals(productTypeKey)) {
            return List.of(
                    new CategorySpec(QuestionCategory.USAGE, "사용법"),
                    new CategorySpec(QuestionCategory.MALFUNCTION, "고장"),
                    new CategorySpec(QuestionCategory.CLEANING, "청소"));
        }
        return switch (productTypeKey) {
            case "에어컨" -> List.of(
                    new CategorySpec(QuestionCategory.MODEL_REGISTER, "모델 등록"),
                    new CategorySpec(QuestionCategory.CLEANING, "에어컨 청소"),
                    new CategorySpec(QuestionCategory.FILTER, "에어컨 필터"),
                    new CategorySpec(QuestionCategory.MALFUNCTION, "에어컨 고장"),
                    new CategorySpec(QuestionCategory.REPAIR, "에어컨 수리"),
                    new CategorySpec(QuestionCategory.REMOTE, "에어컨 리모컨"),
                    new CategorySpec(QuestionCategory.INSTALL, "에어컨 설치"),
                    new CategorySpec(QuestionCategory.ETC, "기타"));
            case "세탁기" -> List.of(
                    new CategorySpec(QuestionCategory.MODEL_REGISTER, "모델 등록"),
                    new CategorySpec(QuestionCategory.CLEANING, "세탁기 청소"),
                    new CategorySpec(QuestionCategory.FILTER, "세탁기 필터"),
                    new CategorySpec(QuestionCategory.MALFUNCTION, "세탁기 고장"),
                    new CategorySpec(QuestionCategory.USAGE, "세탁기 사용법"),
                    new CategorySpec(QuestionCategory.REPAIR, "세탁기 수리"),
                    new CategorySpec(QuestionCategory.WINTER_CARE, "겨울철 세탁기 관리"),
                    new CategorySpec(QuestionCategory.ETC, "기타"));
            case "냉장고" -> List.of(
                    new CategorySpec(QuestionCategory.MODEL_REGISTER, "모델 등록"),
                    new CategorySpec(QuestionCategory.CLEANING, "냉장고 청소"),
                    new CategorySpec(QuestionCategory.ICE_MAKER, "아이스 메이커"),
                    new CategorySpec(QuestionCategory.MALFUNCTION, "냉장고 고장"),
                    new CategorySpec(QuestionCategory.USAGE, "냉장고 사용법"),
                    new CategorySpec(QuestionCategory.FREEZER_USAGE, "냉동고 사용법"),
                    new CategorySpec(QuestionCategory.REPAIR, "냉장고 수리"),
                    new CategorySpec(QuestionCategory.TEMPERATURE, "냉장고 온도"),
                    new CategorySpec(QuestionCategory.ETC, "기타"));
            default -> List.of(
                    new CategorySpec(QuestionCategory.MODEL_REGISTER, "모델 등록"),
                    new CategorySpec(QuestionCategory.USAGE, "사용법"),
                    new CategorySpec(QuestionCategory.MALFUNCTION, "고장"),
                    new CategorySpec(QuestionCategory.CLEANING, "청소"),
                    new CategorySpec(QuestionCategory.ETC, "기타"));
        };
    }

    private static String truncateTitle(String raw) {
        if (raw.length() <= TITLE_MAX) {
            return raw;
        }
        return raw.substring(0, TITLE_MAX);
    }

    private record CategorySpec(QuestionCategory category, String title) {
    }
}
