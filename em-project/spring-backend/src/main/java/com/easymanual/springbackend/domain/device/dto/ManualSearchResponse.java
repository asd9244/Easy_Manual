package com.easymanual.springbackend.domain.device.dto;

import com.easymanual.springbackend.domain.manual.entity.Manual;
import lombok.Getter;
import com.easymanual.springbackend.domain.manual.entity.Model;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class ManualSearchResponse {

    private Long manualId; // 매뉴얼의 고유 ID (나중에 기기 등록할 때 이 ID를 씁니다)
    private String productType; // 제품군 (예: "에어컨", "세탁기")
    private String representativeModelName;
    private List<ModelDto> models;

    @Getter
    public static class ModelDto {
        private Long id;
        private String name;
        private String qrCodeUrl;

        public ModelDto(Model model) {
            this.id = model.getId();
            this.name = model.getName();
            this.qrCodeUrl = model.getQrCodeUrl();
        }
    }

    // Manual 엔티티를 받아서 DTO로 변환해주는 생성자입니다.
    public ManualSearchResponse(Manual manual) {
        this.manualId = manual.getId();
        this.productType = manual.getProductType();
        this.representativeModelName = manual.getRepresentativeModelName();
        
        if (manual.getModels() != null) {
            this.models = manual.getModels().stream()
                .map(ModelDto::new)
                .collect(Collectors.toList());
        }
    }
}