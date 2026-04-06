package com.easymanual.springbackend.domain.chat.dto;

import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import lombok.Getter;

import java.time.LocalDateTime;
// 클라이언트(프론트엔드)에게 반환할 채팅방의 정보(채팅방 ID, 제목, 생성일자)를 담는 데이터 전송 객체입니다.
@Getter
public class ChatRoomResponse {

    private Long id; // 채팅방 고유 식별자
    private String title; // 채팅방 요약 제목 (예: "에어컨 필터 청소 문의")
    private LocalDateTime createdAt; // 질문을 처음 등록한 날짜와 시간

    // ChatRoom 엔티티 객체를 매개변수로 받아 DTO 객체의 필드에 값을 할당하는 생성자입니다.
    public ChatRoomResponse(ChatRoom chatRoom) {
        this.id = chatRoom.getId();
        this.title = chatRoom.getTitle();
        this.createdAt = chatRoom.getCreatedAt(); // BaseTimeEntity에서 상속받은 생성 시간
    }
}