package com.easymanual.springbackend.domain.manual.entity;

import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

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

    // 유저에게 보여줄 직관적인 대표 이름 (예: "휘센 벽걸이 에어컨 (SQ06EJ1WES 외)")을 저장하는 컬럼입니다.
    @Column(length = 100)
    private String representativeModelName;

    @OneToMany(mappedBy = "manual", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Model> models = new ArrayList<>();

    @Builder
    public Manual(String manualCode, String productType, String representativeModelName) {
        this.manualCode = manualCode;
        this.productType = productType;
        this.representativeModelName = representativeModelName;
    }

    public void addModel(Model model) {
        this.models.add(model);
    }
}
