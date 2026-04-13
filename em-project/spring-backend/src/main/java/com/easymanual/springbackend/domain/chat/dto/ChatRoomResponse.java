package com.easymanual.springbackend.domain.chat.dto;

import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import lombok.Getter;

import java.time.LocalDateTime;

// 클라이언트(프론트엔드)에게 반환할 채팅방의 정보(채팅방 ID, 제목, 생성일자)를 담는 데이터 전송 객체입니다.
@Getter
public class ChatRoomResponse {

    private Long id; // 채팅방 고유 식별자
    private String title; // 채팅방 요약 제목 (예: "에어컨 필터 청소 문의")
    private String deviceName; // [추가] 기기 이름 (예: 세탁기, 냉장고)
    private String modelName; // [추가] 모델명 (예: WD-1004)
    private LocalDateTime createdAt; // 질문을 처음 등록한 날짜와 시간

    // ChatRoom 엔티티 객체를 매개변수로 받아 DTO 객체의 필드에 값을 할당하는 생성자.
    public ChatRoomResponse(ChatRoom chatRoom) {
        this.id = chatRoom.getId();
        this.title = chatRoom.getTitle();
        this.createdAt = chatRoom.getCreatedAt(); // BaseTimeEntity에서 상속받은 생성 시간

        // [핵심] 연관된 UserDevice 엔티티에서 기기 정보를 안전하게 꺼내오기.
        if (chatRoom.getUserDevice() != null) {
            this.deviceName = chatRoom.getUserDevice().getDeviceName();
            this.modelName = chatRoom.getUserDevice().getModelName();
        } else {
            // 혹시라도 기기 정보가 없는 경우를 대비한 기본값
            this.deviceName = "알 수 없는 기기";
            this.modelName = "-";
        }
    }
}