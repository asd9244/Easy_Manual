package com.easymanual.springbackend.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiChatRequest {
    // Spring Boot가 FastAPI에게 보낼 2가지 정보
    private String manual_id; // 검색할 매뉴얼 코드 (예: GMDS_...)
    private String question;  // 유저가 입력한 질문 텍스트
}