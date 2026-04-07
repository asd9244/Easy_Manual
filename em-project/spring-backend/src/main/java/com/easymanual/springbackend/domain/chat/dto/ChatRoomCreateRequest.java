package com.easymanual.springbackend.domain.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 프론트엔드가 보낼 기기 ID(userDeviceId)를 바인딩할 객체입니다.

@Getter
@NoArgsConstructor
public class ChatRoomCreateRequest {
    // 프론트엔드가 대화를 시작할 기기의 고유 ID를 전달합니다.
    private Long userDeviceId;
}