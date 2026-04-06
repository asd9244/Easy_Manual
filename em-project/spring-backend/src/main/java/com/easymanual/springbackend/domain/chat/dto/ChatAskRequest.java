package com.easymanual.springbackend.domain.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 클라이언트가 챗봇 화면에서 입력한 질문 텍스트를 바인딩받을 요청 DTO입니다.

@Getter
@NoArgsConstructor
public class ChatAskRequest {

    // 클라이언트가 챗봇 입력창에 작성한 질문 텍스트입니다.
    private String message;
}