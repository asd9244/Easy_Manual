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
                .coveredModelNames(coveredModelNames)
                .representativeModelName(representativeModelName)
                .build();

        // 2. 프론트엔드 요구사항 2번: QR 코드 자동 생성
        // 유저가 스캔했을 때 검색 API로 바로 넘길 수 있도록, 대표 모델명(또는 식별 코드)을 QR 내용으로 삽입합니다.
        String qrContent = representativeModelName;
        String generatedQrUrl = qrCodeUtil.generateAndSaveQrCode(qrContent);

        // 3. 생성된 QR 이미지 URL을 엔티티에 세팅합니다.
        newManual.updateQrCodeUrl(generatedQrUrl);

        // 4. DB에 영구 저장(Persist)하고 반환합니다.
        return manualRepository.save(newManual);
    }
}