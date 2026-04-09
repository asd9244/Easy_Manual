package com.easymanual.springbackend.domain.device.dto;

import com.easymanual.springbackend.domain.device.entity.UserDevice;
import lombok.Getter;

// 클라이언트에게 처리 결과를 반환할 객체입니다. 엔티티를 직접 반환하지 않고 DTO로 변환하여 반환하는 것이 결합도를 낮추는 올바른 설계입니다.

@Getter
public class DeviceResponse {

    private Long id;
    private String alias;
    private String manualCode; // AI 서버와 통신할 때 필요한 매뉴얼 식별 코드
    private String representativeModelName; // 대시보드 화면에 띄워줄 대표 모델명

    // UserDevice 엔티티 객체를 매개변수로 받아 DTO 객체로 변환하여 할당하는 생성자입니다.
    public DeviceResponse(UserDevice userDevice) {
        this.id = userDevice.getId();
        this.alias = userDevice.getAlias();
        // 연관관계가 매핑된 Manual 엔티티에 접근하여 manualCode 값을 추출합니다.
        this.manualCode = userDevice.getManual().getManualCode();
        // 연관관계가 매핑된 Manual 엔티티에 접근하여 대표 모델명 값을 추출합니다.
        this.representativeModelName = userDevice.getManual().getRepresentativeModelName();
    }
}