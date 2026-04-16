package com.easymanual.springbackend.domain.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * AI 백엔드 요약 응답 및 API 클라이언트에 동일 형식으로 전달.
 */
@Getter
@Setter
@NoArgsConstructor
public class ConversationSummaryResponse {

    private String summary;
}
