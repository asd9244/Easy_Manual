package com.easymanual.springbackend.domain.chat.entity;

import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 유저와 AI가 나눈 대화 기록을 저장합니다. 나중에 프론트엔드에서 "이전 대화 불러오기"를 할 때 사용됩니다.

@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 기기에 대해 질문한 채팅인가? (N:1 관계)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_device_id", nullable = false)
    private UserDevice userDevice;

    // 누가 보낸 메시지인가? (USER 또는 AI)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SenderType senderType;

    // 메시지 내용 (AI 답변은 길 수 있으므로 TEXT 타입 사용)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // (선택) AI가 참고한 페이지 번호를 저장해두면 나중에 유용합니다.
    @Column
    private Integer referencedPage;

    @Builder
    public ChatMessage(UserDevice userDevice, SenderType senderType, String message, Integer referencedPage) {
        this.userDevice = userDevice;
        this.senderType = senderType;
        this.message = message;
        this.referencedPage = referencedPage;
    }

    public enum SenderType {
        USER, AI
    }
}
