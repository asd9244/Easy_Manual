package com.easymanual.springbackend.domain.chat.dto;

import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import com.easymanual.springbackend.domain.chat.entity.QuestionCategory;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ChatRoomResponse {

    private Long id;
    private String title;
    private QuestionCategory questionCategory;
    private String questionCategoryLabel;
    private Long userDeviceId;
    private String deviceName;
    private String deviceAlias;
    private String modelName;
    private LocalDateTime createdAt;

    public ChatRoomResponse(ChatRoom chatRoom) {
        this.id = chatRoom.getId();
        this.title = chatRoom.getTitle();
        this.questionCategory = chatRoom.getQuestionCategory();
        this.questionCategoryLabel = chatRoom.getQuestionCategory() != null
                ? chatRoom.getQuestionCategory().getLabel() : null;
        this.createdAt = chatRoom.getCreatedAt();

        // [핵심] 연관된 UserDevice 엔티티에서 기기 정보를 안전하게 꺼내오기.
        if (chatRoom.getUserDevice() != null) {
            this.userDeviceId = chatRoom.getUserDevice().getId();
            this.deviceName = chatRoom.getUserDevice().getDeviceName();
            this.deviceAlias = chatRoom.getUserDevice().getAlias();
            this.modelName = chatRoom.getUserDevice().getModelName();
        } else {
            // 혹시라도 기기 정보가 없는 경우를 대비한 기본값
            this.userDeviceId = null;
            this.deviceName = "알 수 없는 기기";
            this.deviceAlias = "알 수 없는 기기";
            this.modelName = "-";
        }
    }
}