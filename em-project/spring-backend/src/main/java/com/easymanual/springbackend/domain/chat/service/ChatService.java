package com.easymanual.springbackend.domain.chat.service;

import com.easymanual.springbackend.domain.chat.dto.ChatMessageResponse;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomResponse;
import com.easymanual.springbackend.domain.chat.entity.ChatMessage;
import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import com.easymanual.springbackend.domain.chat.repository.ChatRoomRepository;
import com.easymanual.springbackend.domain.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.easymanual.springbackend.domain.chat.dto.AiChatRequest;
import com.easymanual.springbackend.domain.chat.dto.AiChatResponse;
import com.easymanual.springbackend.domain.chat.dto.ChatAskRequest;
import org.springframework.web.reactive.function.client.WebClient;
import com.easymanual.springbackend.domain.chat.dto.AiSummarizeRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateResponse;
import com.easymanual.springbackend.domain.chat.dto.ConversationSummaryResponse;
import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.domain.device.repository.UserDeviceRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_CONVERSATION_TEXT_CHARS = 100_000;

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WebClient webClient;
    private final UserDeviceRepository userDeviceRepository;

    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getMyChatRooms(String email) {
        List<ChatRoom> chatRooms = chatRoomRepository.findAllByUserEmailOrderByCreatedAtDesc(email);
        return chatRooms.stream()
                .map(chatRoom -> new ChatRoomResponse(chatRoom))
                .toList();
    }

    /**
     * 채팅 메시지 목록 조회.
     * 공유 링크로 외부에 노출되므로, 방 ID만 알면 읽기 가능(링크 유출 시 대화 내용 노출 가능).
     * 쓰기(질문/삭제 등)는 별도로 인증·소유권 검사를 유지합니다.
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatMessages(Long roomId) {
        chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));

        List<ChatMessage> messages = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId);
        return messages.stream()
                .map(message -> new ChatMessageResponse(message))
                .toList();
    }

    /**
     * 공유 화면용: 비로그인 사용자도 방 제목·기기명을 표시하기 위한 메타데이터
     */
    @Transactional(readOnly = true)
    public ChatRoomResponse getChatRoomShareSummary(Long roomId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));
        return new ChatRoomResponse(chatRoom);
    }

    /**
     * 로그인한 사용자 본인 방만: DB 메시지 텍스트만 모아 AI 요약 (미디어 URL·이미지 제외).
     */
    @Transactional(readOnly = true)
    public ConversationSummaryResponse summarizeConversation(Long roomId, String email) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));

        if (!chatRoom.getUserDevice().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 채팅방에 접근할 권한이 없습니다.");
        }

        List<ChatMessage> messages = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId);
        String conversationText = buildConversationTextForSummary(messages);
        if (conversationText.isBlank()) {
            throw new IllegalArgumentException("요약할 대화 내용이 없습니다.");
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
            throw new IllegalStateException("요약 응답이 비어 있습니다.");
        }
        return aiResponse;
    }

    /**
     * 특정 AI 답변 한 턴만 요약: 직전 USER 질문 + 해당 AI 답 텍스트만 전달.
     */
    @Transactional(readOnly = true)
    public ConversationSummaryResponse summarizeTurn(Long roomId, Long aiMessageId, String email) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));

        if (!chatRoom.getUserDevice().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 채팅방에 접근할 권한이 없습니다.");
        }

        ChatMessage aiMsg = chatMessageRepository.findById(aiMessageId)
                .orElseThrow(() -> new IllegalArgumentException("해당 메시지를 찾을 수 없습니다."));

        if (!aiMsg.getChatRoom().getId().equals(roomId)) {
            throw new IllegalArgumentException("메시지가 해당 채팅방에 속하지 않습니다.");
        }
        if (aiMsg.getSenderType() != ChatMessage.SenderType.AI) {
            throw new IllegalArgumentException("AI 답변 메시지만 요약할 수 있습니다.");
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
            throw new IllegalArgumentException("이 답변에 대응하는 사용자 질문을 찾을 수 없습니다.");
        }

        String u = userMsg.getMessage() != null ? userMsg.getMessage().trim() : "";
        String a = aiMsg.getMessage() != null ? aiMsg.getMessage().trim() : "";
        if (u.isBlank() && a.isBlank()) {
            throw new IllegalArgumentException("요약할 텍스트가 없습니다.");
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
            throw new IllegalStateException("요약 응답이 비어 있습니다.");
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
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));

        if (!chatRoom.getUserDevice().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 채팅방에 접근할 권한이 없습니다.");
        }

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
                .orElseThrow(() -> new IllegalArgumentException("해당 기기를 찾을 수 없습니다."));

        if (!userDevice.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 기기에 접근할 권한이 없습니다.");
        }

        ChatRoom newChatRoom = ChatRoom.builder()
                .userDevice(userDevice)
                .title("새로운 대화")
                .questionCategory(request.getQuestionCategory())
                .build();

        ChatRoom savedChatRoom = chatRoomRepository.save(newChatRoom);
        return new ChatRoomCreateResponse(savedChatRoom.getId());
    }

    // 채팅방 삭제 비즈니스 로직
    @Transactional
    public void deleteChatRoom(Long roomId, String email) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));

        if (!chatRoom.getUserDevice().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 채팅방을 삭제할 권한이 없습니다.");
        }

        chatRoomRepository.delete(chatRoom);
    }

    // [추가] 유저의 모든 채팅방 일괄 삭제 로직
    @Transactional
    public void deleteAllChatRooms(String email) {
        List<ChatRoom> chatRooms = chatRoomRepository.findAllByUserEmailOrderByCreatedAtDesc(email);
        // CascadeType.ALL 설정이 엔티티에 되어 있으므로, 리스트를 지우면 관련 메시지도 모두 연쇄 삭제됩니다.
        chatRoomRepository.deleteAll(chatRooms);
    }
}