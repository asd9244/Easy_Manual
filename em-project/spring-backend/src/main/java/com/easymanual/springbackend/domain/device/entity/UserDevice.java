package com.easymanual.springbackend.domain.device.entity;

import com.easymanual.springbackend.domain.manual.entity.Manual;
import com.easymanual.springbackend.domain.user.entity.User;
import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 유저가 "내 거실 에어컨"이라고 등록하면, User와 Manual을 연결해주는 다리(Mapping Table) 역할을 합니다.

@Entity
@Table(name = "user_devices")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserDevice extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 유저의 기기인가? (N:1 관계)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 어떤 매뉴얼과 연결되는가? (N:1 관계)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manual_id", nullable = false)
    private Manual manual;

    // 유저가 지어준 별명 (예: "거실 에어컨", "안방 공기청정기")
    @Column(nullable = false, length = 100)
    private String alias;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'ACTIVE'")
    private DeviceStatus status;

    @Builder
    public UserDevice(User user, Manual manual, String alias) {
        this.user = user;
        this.manual = manual;
        this.alias = alias;
        this.status = DeviceStatus.ACTIVE;
    }

    // 상태값을 변경하여 데이터를 물리적으로 삭제하지 않고 숨기는 메서드
    public void deleteDevice() {
        this.status = DeviceStatus.DELETED;
    }

    public enum DeviceStatus {
        ACTIVE, DELETED
    }

    // 기기 종류 가져오기
    public String getDeviceName() {
        // manual이 있으면 productType을 반환하고, 없으면 "알 수 없는 기기"를 반환
        return (this.manual != null) ? this.manual.getProductType() : "알 수 없는 기기";
    }

    // 대표 모델명 (예: 휘센 벽걸이 에어컨 )가져오기
    public String getModelName() {
        return (this.manual != null) ? this.manual.getRepresentativeModelName() : "-";
    }
}
