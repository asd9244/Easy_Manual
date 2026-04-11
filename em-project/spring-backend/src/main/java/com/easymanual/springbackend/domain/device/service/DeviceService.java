package com.easymanual.springbackend.domain.device.service;

import com.easymanual.springbackend.domain.device.dto.DeviceRegisterRequest;
import com.easymanual.springbackend.domain.device.dto.DeviceResponse;
import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.domain.device.repository.UserDeviceRepository;
import com.easymanual.springbackend.domain.manual.entity.Manual;
import com.easymanual.springbackend.domain.manual.repository.ManualRepository;
import com.easymanual.springbackend.domain.user.entity.User;
import com.easymanual.springbackend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.easymanual.springbackend.domain.device.dto.ManualSearchResponse;
import java.util.Optional;

import java.util.List;

// 클라이언트가 보낸 모델명으로 DB에서 Manual 엔티티를 조회하고, 인증된 이메일로 User 엔티티를 조회합니다.
// 두 엔티티를 연결하여 새로운 UserDevice 엔티티를 생성하고 DB에 저장(Persist)하는 비즈니스 로직을 담당합니다.

@Service
@RequiredArgsConstructor
public class DeviceService {

    // 의존성 주입(DI): DB 접근을 위해 필요한 3개의 Repository 인터페이스를 주입받습니다.
    private final UserDeviceRepository userDeviceRepository;
    private final UserRepository userRepository;
    private final ManualRepository manualRepository;

    // 트랜잭션 처리: 로직 수행 중 예외가 발생하면 모든 DB 변경 사항을 롤백(Rollback)합니다.
    @Transactional
    public DeviceResponse registerDevice(String email, DeviceRegisterRequest request) {

        // 1. SecurityContext에서 추출한 이메일로 User 엔티티를 DB에서 조회합니다.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        // 2. 클라이언트가 요청 DTO에 담아 보낸 모델명(modelName)이 포함된 Manual 엔티티를 DB에서 조회합니다.
        Manual manual = manualRepository.findByModelNameContaining(request.getModelName())
                .orElseThrow(() -> new IllegalArgumentException("지원하지 않는 모델명입니다."));

        // 3. 조회된 User와 Manual 엔티티를 연관관계로 설정하여 새로운 UserDevice 엔티티 객체를 생성합니다.
        UserDevice newDevice = UserDevice.builder()
                .user(user)
                .manual(manual)
                .alias(request.getAlias()) // 클라이언트가 지정한 기기 별명 할당
                .build();

        // 4. 생성된 UserDevice 엔티티를 DB에 영구 저장(Persist)합니다.
        UserDevice savedDevice = userDeviceRepository.save(newDevice);

        // 5. 저장된 엔티티 객체를 클라이언트에게 반환할 응답 DTO 객체로 변환하여 반환합니다.
        return new DeviceResponse(savedDevice);
    }


    // 내 기기 목록 조회
    @Transactional(readOnly = true) // 데이터 변경이 없으므로 읽기 전용 트랜잭션으로 성능을 최적화합니다.
    public List<DeviceResponse> getMyDevices(String email) {

        // 1. SecurityContext에서 전달받은 이메일로 DB에서 User 엔티티를 조회합니다.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        // 2. 조회된 User 엔티티를 조건으로, 해당 유저가 등록한 기기 중 삭제되지 않은(ACTIVE) 목록만 조회합니다.
        List<UserDevice> devices = userDeviceRepository.findAllByUserAndStatus(user, UserDevice.DeviceStatus.ACTIVE);

        // 3. 조회된 엔티티 리스트(List<UserDevice>)를 클라이언트 반환용 DTO 리스트(List<DeviceResponse>)로 변환합니다.
        // (Java 8의 Stream API를 사용하여 간결하게 변환합니다.)
        return devices.stream()
                .map(device -> new DeviceResponse(device))
                .toList();
    }


    // 새로 추가된 기능: 모델명 검색 로직
    @Transactional(readOnly = true) // 데이터를 읽기만 하므로 속도 향상을 위해 readOnly 옵션을 줍니다.
    public List<ManualSearchResponse> searchManuals(String query) {

        // 1. 프론트엔드가 보낸 검색어(query)가 비어있으면 빈 리스트를 돌려보냅니다.
        if (query == null || query.trim().isEmpty()) {
            return List.of(); // 빈 배열 반환
        }

        // 2. ManualRepository를 이용해 DB에서 검색어가 포함된 매뉴얼을 찾습니다.
        // (주의: 우리가 예전에 만든 findByModelNameContaining은 Optional<Manual>을 반환하도록 짜여 있습니다.
        // 실무에서는 검색 결과가 여러 개일 수 있으므로 List<Manual>을 반환하는 게 맞지만,
        // 현재 구조를 최대한 유지하면서 Optional 안에 값이 있으면 리스트로 만들고, 없으면 빈 리스트를 반환하도록 처리합니다.)
        Optional<Manual> manualOpt = manualRepository.findByModelNameContaining(query);

        // 3. 검색 결과가 있으면 DTO로 변환해서 리스트에 담아주고, 없으면 빈 리스트를 반환합니다.
        return manualOpt.stream()
                .map(manual -> new ManualSearchResponse(manual))
                .toList();
    }

    // 새로 추가된 기능: 등록된 기기 삭제 (Soft Delete)
    @Transactional
    public void deleteDevice(Long deviceId, String email) {
        // 1. 디바이스 ID로 기기 조회
        UserDevice userDevice = userDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new IllegalArgumentException("해당 기기를 찾을 수 없습니다."));

        // 2. 본인의 기기인지 확인 (보안 검증)
        if (!userDevice.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 기기를 삭제할 권한이 없습니다.");
        }

        // 3. 물리적 삭제가 아닌 상태값만 DELETED로 변경 (Soft Delete)
        userDevice.deleteDevice();
    }
}