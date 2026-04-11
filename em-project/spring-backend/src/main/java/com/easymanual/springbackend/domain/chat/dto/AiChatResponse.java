package com.easymanual.springbackend.domain.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AiChatResponse {

    // 파이썬(FastAPI)이 보내는 JSON 키값 "manual_id"를 자바의 manualId 변수에 바인딩합니다.
    @JsonProperty("manual_id")
    private String manualId;

    private String question;

    // 파이썬이 보내는 "found_page"를 자바의 foundPage 변수에 바인딩합니다.
    @JsonProperty("found_page")
    private Integer foundPage;

    // 파이썬이 보내는 "ai_answer"를 자바의 aiAnswer 변수에 바인딩합니다.
    @JsonProperty("ai_answer")
    private String aiAnswer;

    // FastAPI가 보내주는 매뉴얼 원본 이미지 URL 리스트를 바인딩합니다.
    @JsonProperty("manual_image_urls")
    private List<String> manualImageUrls;
}