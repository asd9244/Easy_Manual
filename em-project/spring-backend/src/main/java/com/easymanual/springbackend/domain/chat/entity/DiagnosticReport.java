package com.easymanual.springbackend.domain.chat.entity;

import com.easymanual.springbackend.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "diagnostic_reports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiagnosticReport extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 하나의 채팅방에는 오직 하나의 최종 진단 리포트만 발행됩니다 (1:1 관계)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false, unique = true)
    private ChatRoom chatRoom;

    // 긴 텍스트가 저장될 수 있으므로 TEXT 타입으로 선언
    @Column(columnDefinition = "TEXT", nullable = false)
    private String symptoms;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String cause;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String solutions;

    @Builder
    public DiagnosticReport(ChatRoom chatRoom, String symptoms, String cause, String solutions) {
        this.chatRoom = chatRoom;
        this.symptoms = symptoms;
        this.cause = cause;
        this.solutions = solutions;
    }
}
