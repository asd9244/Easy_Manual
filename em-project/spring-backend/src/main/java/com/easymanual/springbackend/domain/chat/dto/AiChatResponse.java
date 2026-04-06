package com.easymanual.springbackend.domain.chat.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class AiChatResponse {
    // FastAPI가 Spring Boot에게 돌려줄 4가지 정보
    // (파이썬 코드에서 return 했던 JSON 키값과 스펠링이 정확히 일치해야 합니다!)
    private String manual_id;
    private String question;
    private Integer found_page; // AI가 참고한 페이지 번호
    private String ai_answer;   // AI가 생성한 최종 답변 텍스트
}