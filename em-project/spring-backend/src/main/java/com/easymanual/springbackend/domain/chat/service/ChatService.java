package com.easymanual.springbackend.domain.chat.service;

import com.easymanual.springbackend.domain.chat.dto.AiChatRequest;
import com.easymanual.springbackend.domain.chat.dto.AiChatResponse;
import com.easymanual.springbackend.domain.chat.dto.AiSummarizeRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatAskRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatMessageResponse;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateResponse;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomResponse;
import com.easymanual.springbackend.domain.chat.dto.ConversationSummaryResponse;
import com.easymanual.springbackend.domain.chat.entity.ChatMessage;
import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import com.easymanual.springbackend.domain.chat.repository.ChatMessageRepository;
import com.easymanual.springbackend.domain.chat.repository.ChatRoomRepository;
import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.domain.device.repository.UserDeviceRepository;
import com.easymanual.springbackend.global.error.ErrorMessages;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_CONVERSATION_TEXT_CHARS = 100_000;

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WebClient webClient;
    private final UserDeviceRepository userDeviceRepository;

    private ChatRoom requireChatRoom(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorMessages.CHAT_ROOM_NOT_FOUND));
    }

    /**
     * 채팅방 존재 + 요청 이메일이 방 소유자와 일치하는지 검사한다.
     *
     * @param notOwnerMessage 소유자가 아닐 때 사용할 {@link IllegalArgumentException} 메시지
     */
    private ChatRoom requireOwnedChatRoom(Long roomId, String email, String notOwnerMessage) {
        ChatRoom chatRoom = requireChatRoom(roomId);
        if (!chatRoom.getUserDevice().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException(notOwnerMessage);
        }
        return chatRoom;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getMyChatRooms(String email) {
        List<ChatRoom> chatRooms = chatRoomRepository.findAllByUserEmailOrderByCreatedAtDesc(email);
        return chatRooms.stream()
                .map(ChatRoomResponse::new)
                .toList();
    }

    /**
     * 채팅 메시지 목록 조회.
     * 공유 링크로 외부에 노출되므로, 방 ID만 알면 읽기 가능(링크 유출 시 대화 내용 노출 가능).
     * 쓰기(질문/삭제 등)는 별도로 인증·소유권 검사를 유지합니다.
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatMessages(Long roomId) {
        requireChatRoom(roomId);

        List<ChatMessage> messages = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId);
        return messages.stream()
                .map(ChatMessageResponse::new)
                .toList();
    }

    /**
     * 공유 화면용: 비로그인 사용자도 방 제목·기기명을 표시하기 위한 메타데이터
     */
    @Transactional(readOnly = true)
    public ChatRoomResponse getChatRoomShareSummary(Long roomId) {
        ChatRoom chatRoom = requireChatRoom(roomId);
        return new ChatRoomResponse(chatRoom);
    }

    /**
     * 로그인한 사용자 본인 방만: DB 메시지 텍스트만 모아 AI 요약 (미디어 URL·이미지 제외).
     */
    @Transactional(readOnly = true)
    public ConversationSummaryResponse summarizeConversation(Long roomId, String email) {
        requireOwnedChatRoom(roomId, email, ErrorMessages.CHAT_ROOM_ACCESS_DENIED);

        List<ChatMessage> messages = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId);
        String conversationText = buildConversationTextForSummary(messages);
        if (conversationText.isBlank()) {
            throw new IllegalArgumentException(ErrorMessages.CHAT_SUMMARY_EMPTY);
        }

        String payload = conversationText.length() > MAX_CONVERSATION_TEXT_CHARS
                ? conversationText.substring(0, MAX_CONVERSATION_TEXT_CHARS)
                : conversationText;

        AiSummarizeRequest aiRequest = AiSummarizeRequest.builder()
                .conversationText(payload)
                .build();

        ConversationSummaryResponse aiResponse = webClient.post()
                .uri("/api/chat/summarize")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(ConversationSummaryResponse.class)
                .block();

        if (aiResponse == null || aiResponse.getSummary() == null || aiResponse.getSummary().isBlank()) {
            throw new IllegalStateException(ErrorMessages.CHAT_SUMMARY_AI_EMPTY);
        }
        return aiResponse;
    }

    /**
     * 특정 AI 답변 한 턴만 요약: 직전 USER 질문 + 해당 AI 답 텍스트만 전달.
     */
    @Transactional(readOnly = true)
    public ConversationSummaryResponse summarizeTurn(Long roomId, Long aiMessageId, String email) {
        requireOwnedChatRoom(roomId, email, ErrorMessages.CHAT_ROOM_ACCESS_DENIED);

        ChatMessage aiMsg = chatMessageRepository.findById(aiMessageId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorMessages.CHAT_MESSAGE_NOT_FOUND));

        if (!aiMsg.getChatRoom().getId().equals(roomId)) {
            throw new IllegalArgumentException(ErrorMessages.CHAT_MESSAGE_WRONG_ROOM);
        }
        if (aiMsg.getSenderType() != ChatMessage.SenderType.AI) {
            throw new IllegalArgumentException(ErrorMessages.CHAT_SUMMARY_ONLY_AI);
        }

        List<ChatMessage> ordered = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId);
        ChatMessage userMsg = null;
        for (int i = 0; i < ordered.size(); i++) {
            if (ordered.get(i).getId().equals(aiMessageId)) {
                for (int j = i - 1; j >= 0; j--) {
                    if (ordered.get(j).getSenderType() == ChatMessage.SenderType.USER) {
                        userMsg = ordered.get(j);
                        break;
                    }
                }
                break;
            }
        }
        if (userMsg == null) {
            throw new IllegalArgumentException(ErrorMessages.CHAT_SUMMARY_NO_USER_FOR_AI);
        }

        String u = userMsg.getMessage() != null ? userMsg.getMessage().trim() : "";
        String a = aiMsg.getMessage() != null ? aiMsg.getMessage().trim() : "";
        if (u.isBlank() && a.isBlank()) {
            throw new IllegalArgumentException(ErrorMessages.CHAT_SUMMARY_NO_TEXT);
        }

        String conversationText = "[USER] " + u + "\n\n[AI] " + a;
        if (conversationText.length() > MAX_CONVERSATION_TEXT_CHARS) {
            conversationText = conversationText.substring(0, MAX_CONVERSATION_TEXT_CHARS);
        }

        AiSummarizeRequest aiRequest = AiSummarizeRequest.builder()
                .conversationText(conversationText)
                .build();

        ConversationSummaryResponse aiResponse = webClient.post()
                .uri("/api/chat/summarize")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(ConversationSummaryResponse.class)
                .block();

        if (aiResponse == null || aiResponse.getSummary() == null || aiResponse.getSummary().isBlank()) {
            throw new IllegalStateException(ErrorMessages.CHAT_SUMMARY_AI_EMPTY);
        }
        return aiResponse;
    }

    private String buildConversationTextForSummary(List<ChatMessage> messages) {
        StringBuilder sb = new StringBuilder();
        for (ChatMessage m : messages) {
            String text = m.getMessage();
            if (text == null || text.isBlank()) {
                continue;
            }
            String role = m.getSenderType() == ChatMessage.SenderType.USER ? "USER" : "AI";
            sb.append("[").append(role).append("] ").append(text.trim()).append("\n");
        }
        return sb.toString().trim();
    }

    @Transactional
    public ChatMessageResponse askQuestion(Long roomId, String email, ChatAskRequest request) {
        ChatRoom chatRoom = requireOwnedChatRoom(roomId, email, ErrorMessages.CHAT_ROOM_ACCESS_DENIED);

        boolean isFirstMessage = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId).isEmpty();

        if (isFirstMessage) {
            String newTitle = request.getMessage();
            if (newTitle.length() > 15) {
                newTitle = newTitle.substring(0, 15) + "...";
            }
            chatRoom.updateTitle(newTitle);
        }

        ChatMessage userMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .senderType(ChatMessage.SenderType.USER)
                .message(request.getMessage())
                .mediaUrl(null)
                .build();
        chatMessageRepository.save(userMessage);

        String manualCode = chatRoom.getUserDevice().getManual().getManualCode();
        AiChatRequest aiRequest = AiChatRequest.builder()
                .manual_id(manualCode)
                .question(request.getMessage())
                .build();

        AiChatResponse aiResponse = webClient.post()
                .uri("/api/chat/ask")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(AiChatResponse.class)
                .block();

        String urlsString = (aiResponse.getManualImageUrls() != null && !aiResponse.getManualImageUrls().isEmpty())
                ? String.join(",", aiResponse.getManualImageUrls())
                : null;

        ChatMessage aiMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .senderType(ChatMessage.SenderType.AI)
                .message(aiResponse.getAiAnswer())
                .referencedPage(aiResponse.getFoundPage())
                .manualImageUrl(urlsString)
                .build();
        chatMessageRepository.save(aiMessage);

        return new ChatMessageResponse(aiMessage);
    }

    @Transactional
    public ChatRoomCreateResponse createChatRoom(String email, ChatRoomCreateRequest request) {
        UserDevice userDevice = userDeviceRepository.findById(request.getUserDeviceId())
                .orElseThrow(() -> new IllegalArgumentException(ErrorMessages.DEVICE_NOT_FOUND));

        if (!userDevice.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException(ErrorMessages.DEVICE_ACCESS_DENIED);
        }

        ChatRoom newChatRoom = ChatRoom.builder()
                .userDevice(userDevice)
                .title("새로운 대화")
                .questionCategory(request.getQuestionCategory())
                .build();

        ChatRoom savedChatRoom = chatRoomRepository.save(newChatRoom);
        return new ChatRoomCreateResponse(savedChatRoom.getId());
    }

    @Transactional
    public void deleteChatRoom(Long roomId, String email) {
        ChatRoom chatRoom = requireOwnedChatRoom(roomId, email, ErrorMessages.CHAT_ROOM_DELETE_FORBIDDEN);

        chatRoomRepository.delete(chatRoom);
    }

    @Transactional
    public void deleteAllChatRooms(String email) {
        List<ChatRoom> chatRooms = chatRoomRepository.findAllByUserEmailOrderByCreatedAtDesc(email);
        chatRoomRepository.deleteAll(chatRooms);
    }
}
