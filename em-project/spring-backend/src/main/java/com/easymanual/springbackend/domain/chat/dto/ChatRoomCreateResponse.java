package com.easymanual.springbackend.domain.chat.dto;

import lombok.Getter;

// 생성된 방 번호(roomId)를 반환할 객체입니다.

@Getter
public class ChatRoomCreateResponse {
    // 생성된 채팅방의 고유 ID를 프론트엔드에 반환합니다.
    private Long roomId;

    public ChatRoomCreateResponse(Long roomId) {
        this.roomId = roomId;
    }
}