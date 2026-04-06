package com.easymanual.springbackend.domain.chat.dto;

import com.easymanual.springbackend.domain.chat.entity.ChatMessage;
import lombok.Getter;

import java.time.LocalDateTime;

// 클라이언트에게 반환할 개별 말풍선의 정보(메시지 내용, 보낸 사람, 미디어 URL, 참고 페이지, 보낸 시간)를 담는 데이터 전송 객체입니다.

@Getter
public class ChatMessageResponse {

    private Long id; // 말풍선 고유 식별자
    private String senderType; // 보낸 사람 구분 (USER 또는 AI)
    private String message; // 실제 대화 내용 (텍스트)
    private String mediaUrl; // 첨부된 사진/음성 파일의 S3 주소 (없으면 null)
    private Integer referencedPage; // AI가 참고한 매뉴얼 페이지 번호 (없으면 null)
    private LocalDateTime createdAt; // 메시지를 보낸 정확한 시간

    // ChatMessage 엔티티 객체를 매개변수로 받아 DTO 객체의 필드에 값을 할당하는 생성자입니다.
    public ChatMessageResponse(ChatMessage chatMessage) {
        this.id = chatMessage.getId();
        // Enum 타입인 SenderType을 클라이언트가 읽기 편하도록 String으로 변환하여 할당합니다.
        this.senderType = chatMessage.getSenderType().name();
        this.message = chatMessage.getMessage();
        this.mediaUrl = chatMessage.getMediaUrl();
        this.referencedPage = chatMessage.getReferencedPage();
        this.createdAt = chatMessage.getCreatedAt();
    }
}