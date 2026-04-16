package com.easymanual.springbackend.domain.device.dto;

import com.easymanual.springbackend.domain.device.entity.UserDevice;
import lombok.Getter;

// 클라이언트에게 처리 결과를 반환할 객체입니다. 엔티티를 직접 반환하지 않고 DTO로 변환하여 반환하는 것이 결합도를 낮추는 올바른 설계입니다.

@Getter
public class DeviceResponse {

    private Long id;
    private String alias;
    private String manualCode;
    private String representativeModelName;
    private String productType;

    public DeviceResponse(UserDevice userDevice) {
        this.id = userDevice.getId();
        this.alias = userDevice.getAlias();
        this.manualCode = userDevice.getManual().getManualCode();
        this.representativeModelName = userDevice.getManual().getRepresentativeModelName();
        this.productType = userDevice.getManual().getProductType();
    }
}