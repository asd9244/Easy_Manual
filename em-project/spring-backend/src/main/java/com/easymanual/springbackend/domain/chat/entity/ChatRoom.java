package com.easymanual.springbackend.domain.chat.entity;

import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 기기에 대한 질문 방인가?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_device_id", nullable = false)
    private UserDevice userDevice;

    // 🌟 프론트엔드 요구사항: 질문 내용 요약 타이틀 (예: "에어컨 필터 청소 방법")
    @Column(nullable = false, length = 200)
    private String title;

    @Builder
    public ChatRoom(UserDevice userDevice, String title) {
        this.userDevice = userDevice;
        this.title = title;
    }
}
