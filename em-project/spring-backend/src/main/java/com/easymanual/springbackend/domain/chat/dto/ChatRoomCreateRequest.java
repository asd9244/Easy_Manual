package com.easymanual.springbackend.domain.chat.dto;

import com.easymanual.springbackend.domain.chat.entity.QuestionCategory;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatRoomCreateRequest {
    private Long userDeviceId;
    // 채팅 시작 전 사용자가 선택한 질문 유형
    private QuestionCategory questionCategory;
}