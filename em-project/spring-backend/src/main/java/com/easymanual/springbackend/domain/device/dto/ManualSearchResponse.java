package com.easymanual.springbackend.domain.device.dto;

import com.easymanual.springbackend.domain.manual.entity.Manual;
import lombok.Getter;
import java.util.stream.Collectors;

@Getter
public class ManualSearchResponse {

    private Long manualId; // 매뉴얼의 고유 ID (나중에 기기 등록할 때 이 ID를 씁니다)
    private String productType; // 제품군 (예: "에어컨", "세탁기")
    private String coveredModelNames; // 이 매뉴얼이 커버하는 모델명들 (예: "FQ17SADWE2, FQ18SADWE2")
    private String representativeModelName;
    private String qrCodeUrl; // 프론트엔드에 전달할 QR 코드 이미지 URL


    // Manual 엔티티를 받아서 DTO로 변환해주는 생성자입니다.
    public ManualSearchResponse(Manual manual) {
        this.manualId = manual.getId();
        this.productType = manual.getProductType();
        this.representativeModelName = manual.getRepresentativeModelName();
        
        if (manual.getModels() != null && !manual.getModels().isEmpty()) {
            this.coveredModelNames = manual.getModels().stream()
                .map(com.easymanual.springbackend.domain.manual.entity.Model::getName)
                .collect(Collectors.joining(", "));
            this.qrCodeUrl = manual.getModels().get(0).getQrCodeUrl();
        } else {
            this.coveredModelNames = "";
            this.qrCodeUrl = "";
        }
    }
}