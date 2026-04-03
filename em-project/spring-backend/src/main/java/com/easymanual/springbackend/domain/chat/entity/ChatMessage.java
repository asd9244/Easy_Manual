package com.easymanual.springbackend.domain.chat.entity;

import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🌟 수정됨: 이제 기기(UserDevice)에 직접 붙지 않고, 채팅방(ChatRoom)에 소속됩니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SenderType senderType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // 🌟 추가됨: 프론트엔드 요구사항 (사진, 동영상, 음성 파일의 S3 주소 저장)
    @Column(length = 1000)
    private String mediaUrl;

    @Column
    private Integer referencedPage;

    @Builder
    public ChatMessage(ChatRoom chatRoom, SenderType senderType, String message, String mediaUrl, Integer referencedPage) {
        this.chatRoom = chatRoom;
        this.senderType = senderType;
        this.message = message;
        this.mediaUrl = mediaUrl;
        this.referencedPage = referencedPage;
    }

    public enum SenderType { USER, AI }
}
