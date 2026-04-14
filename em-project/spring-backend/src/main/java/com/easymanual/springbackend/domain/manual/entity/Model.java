package com.easymanual.springbackend.domain.manual.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "models")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Model {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /** 매뉴얼의 product_type과 동일 — 조회·필터 시 조인 없이 구분용 */
    @Column(name = "product_type", nullable = false, length = 50)
    private String productType;

    @Column(length = 1000)
    private String qrCodeUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manual_id", nullable = false)
    private Manual manual;

    @Builder
    public Model(String name, String productType, String qrCodeUrl, Manual manual) {
        this.name = name;
        this.productType = productType;
        this.qrCodeUrl = qrCodeUrl;
        this.manual = manual;
    }

    public void updateQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }
}
