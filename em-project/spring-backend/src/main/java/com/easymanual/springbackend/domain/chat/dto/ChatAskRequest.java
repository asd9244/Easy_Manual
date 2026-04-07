package com.easymanual.springbackend.domain.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 클라이언트가 챗봇 화면에서 입력한 질문 텍스트를 바인딩받을 요청 DTO입니다.

@Getter
@NoArgsConstructor
public class ChatAskRequest {

    // 클라이언트가 챗봇 입력창에 작성한 질문 텍스트입니다.
    private String message;

    // 클라이언트가 파일 업로드 API를 통해 미리 발급받은 이미지의 URL 주소입니다.
    // 사진을 첨부하지 않은 텍스트 질문일 경우 이 값은 null로 전달됩니다.
    private String mediaUrl;
}