package com.easymanual.springbackend.domain.manual.entity;

import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// FastAPI가 알고 있는 그 복잡한 이름(GMDS_...)과 실제 제품군을 매핑해두는 기준 테이블입니다.

@Entity
@Table(name = "manuals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Manual extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FastAPI와 통신할 때 쓸 핵심 키 (예: GMDS_MFL71839003_13_250911_00_WEB)
    @Column(nullable = false, unique = true)
    private String manualCode;

    // 제품군 (예: 에어컨, 세탁기)
    @Column(nullable = false, length = 50)
    private String productType;

    // 이 매뉴얼이 커버하는 실제 모델명들 (예: "FQ17SADWE2, FQ18SADWE2")
    // 실무에서는 1:N 테이블로 빼기도 하지만, 검색 편의상 콤마(,)로 구분된 텍스트로 저장합니다.
    @Column(columnDefinition = "TEXT")
    private String coveredModelNames;

    // 유저에게 보여줄 직관적인 대표 이름 (예: "휘센 벽걸이 에어컨 (SQ06EJ1WES 외)")을 저장하는 컬럼입니다.
    @Column(length = 100)
    private String representativeModelName;

    //QR 코드 URL 저장
    // 이 매뉴얼을 식별할 수 있는 QR 코드 이미지의 접근 주소를 저장합니다.
    @Column(length = 1000)
    private String qrCodeUrl;

    @Builder
    public Manual(String manualCode, String productType, String coveredModelNames, String representativeModelName, String qrCodeUrl) {
        this.manualCode = manualCode;
        this.productType = productType;
        this.coveredModelNames = coveredModelNames;
        this.representativeModelName = representativeModelName;
        this.qrCodeUrl = qrCodeUrl;
    }

    // 서비스 계층에서 QR 코드를 생성한 뒤 엔티티에 값을 세팅하기 위한 메서드입니다.
    public void updateQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }
}
