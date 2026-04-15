package com.easymanual.springbackend.global.seed;

import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.domain.device.repository.UserDeviceRepository;
import com.easymanual.springbackend.domain.manual.entity.Manual;
import com.easymanual.springbackend.domain.manual.entity.Model;
import com.easymanual.springbackend.domain.manual.repository.ManualRepository;
import com.easymanual.springbackend.domain.manual.repository.ModelRepository;
import com.easymanual.springbackend.domain.user.entity.User;
import com.easymanual.springbackend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 더미 데이터(테스트용 user_devices) 생성 전용.
 * <p>
 * 시드 유저({@code seed-user-*@localhost.local})마다 에어컨·냉장고·세탁기 매뉴얼을 1개씩 등록한 것처럼 넣는다.
 * 각 기기 별명({@code alias})은 해당 매뉴얼의 {@code models} 테이블에서 id가 가장 작은 행의 모델명을 사용한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDeviceSeedService {

    private static final int SEED_COUNT = 100;
    private static final String SEED_EMAIL_PREFIX = "seed-user-";
    private static final String SEED_EMAIL_DOMAIN = "@localhost.local";
    private static final int ALIAS_MAX = 100;

    /** 시드 유저당 등록할 제품군 순서 (DB에 매뉴얼이 있어야 함) */
    private static final List<String> PRODUCT_TYPES_IN_ORDER = List.of("에어컨", "냉장고", "세탁기");

    private final UserRepository userRepository;
    private final ManualRepository manualRepository;
    private final ModelRepository modelRepository;
    private final UserDeviceRepository userDeviceRepository;

    /**
     * 시드 유저 각각에 대해 (에어컨·냉장고·세탁기) user_device가 없으면 추가한다. 여러 번 호출해도 중복 생성하지 않는다.
     */
    @Transactional
    public void seedDevicesForSeedUsers() {
        int created = 0;
        for (int i = 0; i < SEED_COUNT; i++) {
            String email = SEED_EMAIL_PREFIX + i + SEED_EMAIL_DOMAIN;
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                log.debug("시드 유저 없음, 건너뜀: {}", email);
                continue;
            }
            User user = userOpt.get();
            for (String productType : PRODUCT_TYPES_IN_ORDER) {
                Optional<Manual> manualOpt = manualRepository.findFirstByProductTypeOrderByIdAsc(productType);
                if (manualOpt.isEmpty()) {
                    log.warn("제품군 매뉴얼이 DB에 없습니다. productType={}", productType);
                    continue;
                }
                Manual manual = manualOpt.get();
                if (userDeviceRepository.existsByUser_IdAndManual_Id(user.getId(), manual.getId())) {
                    continue;
                }
                String alias = resolveAlias(manual);
                UserDevice device = UserDevice.builder()
                        .user(user)
                        .manual(manual)
                        .alias(alias)
                        .build();
                userDeviceRepository.save(device);
                created++;
            }
        }
        if (created > 0) {
            log.info("시드 user_devices {}건을 추가했습니다. (시드 유저당 최대 3건, 이미 있으면 생략)", created);
        } else {
            log.info("추가할 시드 user_devices가 없습니다. (이미 모두 있거나 시드 유저 없음)");
        }
    }

    private String resolveAlias(Manual manual) {
        Optional<Model> firstModel = modelRepository.findFirstByManual_IdOrderByIdAsc(manual.getId());
        String raw = firstModel.map(Model::getName)
                .filter(s -> !s.isBlank())
                .orElseGet(() -> Optional.ofNullable(manual.getRepresentativeModelName()).filter(s -> !s.isBlank()).orElse(manual.getProductType() + " 기기"));
        if (raw.length() > ALIAS_MAX) {
            return raw.substring(0, ALIAS_MAX);
        }
        return raw;
    }
}
