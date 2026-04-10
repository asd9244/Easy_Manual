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

    @Column(length = 1000)
    private String qrCodeUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manual_id", nullable = false)
    private Manual manual;

    @Builder
    public Model(String name, String qrCodeUrl, Manual manual) {
        this.name = name;
        this.qrCodeUrl = qrCodeUrl;
        this.manual = manual;
    }

    public void updateQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }
}
