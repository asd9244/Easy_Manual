package com.easymanual.springbackend.domain.chat.entity;

import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_device_id", nullable = false)
    private UserDevice userDevice;

    @Column(nullable = false, length = 200)
    private String title;

    // 채팅 시작 전 사용자가 선택한 질문 유형 (TOP 5 집계에 사용)
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private QuestionCategory questionCategory;

    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMessage> messages = new ArrayList<>();

    @Builder
    public ChatRoom(UserDevice userDevice, String title, QuestionCategory questionCategory) {
        this.userDevice = userDevice;
        this.title = title;
        this.questionCategory = questionCategory;
    }

    // 채팅방 제목 변경 스위치
    public void updateTitle(String newTitle) {
        this.title = newTitle;
    }
}
