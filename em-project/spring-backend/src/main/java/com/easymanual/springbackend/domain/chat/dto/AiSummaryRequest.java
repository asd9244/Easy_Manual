package com.easymanual.springbackend.domain.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Spring Boot가 FastAPI의 /summary 서버로 넘겨줄 DTO
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiSummaryRequest {
    private String chat_history;
}
