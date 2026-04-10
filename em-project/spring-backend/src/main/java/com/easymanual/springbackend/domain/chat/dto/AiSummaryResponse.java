package com.easymanual.springbackend.domain.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// FastAPI가 Spring Boot로 반환하는 요약본 JSON을 받을 DTO
@Getter
@NoArgsConstructor
public class AiSummaryResponse {
    private String symptoms;
    private String cause;
    private String solutions;
}
