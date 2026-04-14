package com.easymanual.springbackend.domain.manual.service;

import com.easymanual.springbackend.domain.manual.entity.Manual;
import com.easymanual.springbackend.domain.manual.repository.ManualRepository;
import com.easymanual.springbackend.global.util.QrCodeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManualService {

    private final ManualRepository manualRepository;
    private final QrCodeUtil qrCodeUtil;

    // 🌟 향후 관리자(Admin)가 새로운 매뉴얼을 DB에 등록할 때 호출될 비즈니스 로직입니다.
    @Transactional
    public Manual registerNewManual(String manualCode, String productType, String coveredModelNames, String representativeModelName) {

        // 1. 매뉴얼 엔티티를 생성합니다.
        Manual newManual = Manual.builder()
                .manualCode(manualCode)
                .productType(productType)
                .representativeModelName(representativeModelName)
                .build();

        // 2. 콤마로 구분된 coveredModelNames를 순회하며 개별 Model 생성 및 QR 파싱
        if (coveredModelNames != null && !coveredModelNames.isBlank()) {
            String[] models = coveredModelNames.split(",");
            for (String mName : models) {
                String cleanName = mName.trim();
                // 개별 모델명에 대해 QR 생성
                String generatedQrUrl = qrCodeUtil.generateAndSaveQrCode(cleanName);
                
                // Model 엔티티 생성 및 연관관계 맺기
                com.easymanual.springbackend.domain.manual.entity.Model newModel = 
                    com.easymanual.springbackend.domain.manual.entity.Model.builder()
                        .name(cleanName)
                        .productType(productType)
                        .qrCodeUrl(generatedQrUrl)
                        .manual(newManual)
                        .build();
                
                newManual.addModel(newModel);
            }
        }

        // 4. DB에 영구 저장(Persist)하고 반환합니다.
        return manualRepository.save(newManual);
    }
}