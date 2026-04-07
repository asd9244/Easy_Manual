package com.easymanual.springbackend.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiChatRequest {
    // Spring Boot가 FastAPI에게 보낼 2가지 정보
    private String manual_id; // 검색할 매뉴얼 코드 (예: GMDS_...)
    private String question;  // 유저가 입력한 질문 텍스트

    // FastAPI의 VLM(Vision Language Model)이 이미지를 분석할 수 있도록 URL을 함께 전송합니다.
    // 파이썬 코드에서 이 키값(media_url)을 받아 처리하도록 추후 수정이 필요합니다.
    private String media_url;
}