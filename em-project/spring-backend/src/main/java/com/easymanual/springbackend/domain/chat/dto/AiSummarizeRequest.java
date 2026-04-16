package com.easymanual.springbackend.domain.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiSummarizeRequest {

    @JsonProperty("conversation_text")
    private String conversationText;
}
