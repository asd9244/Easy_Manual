package com.easymanual.springbackend.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiChatRequest {
    // Spring Boot가 FastAPI에게 보낼 3가지 정보
    private String manual_id; // 검색할 매뉴얼 코드 (예: GMDS_...)
    private String question;  // 유저가 입력한 질문 텍스트
    private String room_id;   // 채팅방 ID. AI가 같은 방의 이전 대화를 이어 가는 기준(멀티턴)
}