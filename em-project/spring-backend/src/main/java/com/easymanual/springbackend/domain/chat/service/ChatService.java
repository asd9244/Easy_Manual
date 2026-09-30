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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

/**
 * AI 서버 호출(최대 180초)은 DB 트랜잭션 밖에서 한다. 트랜잭션을 연 채 기다리면
 * 그동안 커넥션·잠금을 붙잡고, DB 스키마 변경(CREATE INDEX CONCURRENTLY 등)을 막는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_CONVERSATION_TEXT_CHARS = 100_000;
    private static final String AI_ANSWER_FAILED_MESSAGE =
            "죄송합니다. 답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WebClient webClient;
    private final UserDeviceRepository userDeviceRepository;
    private final TransactionTemplate transactionTemplate;

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
    public ConversationSummaryResponse summarizeConversation(Long roomId, String email) {
        String payload = transactionTemplate.execute(status -> {
            requireOwnedChatRoom(roomId, email, ErrorMessages.CHAT_ROOM_ACCESS_DENIED);

            List<ChatMessage> messages = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId);
            String conversationText = buildConversationTextForSummary(messages);
            if (conversationText.isBlank()) {
                throw new IllegalArgumentException(ErrorMessages.CHAT_SUMMARY_EMPTY);
            }

            return conversationText.length() > MAX_CONVERSATION_TEXT_CHARS
                    ? conversationText.substring(0, MAX_CONVERSATION_TEXT_CHARS)
                    : conversationText;
        });

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
    public ConversationSummaryResponse summarizeTurn(Long roomId, Long aiMessageId, String email) {
        String conversationText = transactionTemplate.execute(status -> {
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

            String text = "[USER] " + u + "\n\n[AI] " + a;
            return text.length() > MAX_CONVERSATION_TEXT_CHARS
                    ? text.substring(0, MAX_CONVERSATION_TEXT_CHARS)
                    : text;
        });

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

    public ChatMessageResponse askQuestion(Long roomId, String email, ChatAskRequest request) {
        // 1) 질문 저장 (트랜잭션)
        AiChatRequest aiRequest = transactionTemplate.execute(status -> {
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
            return AiChatRequest.builder()
                    .manual_id(manualCode)
                    .question(request.getMessage())
                    .build();
        });

        // 2) AI 호출 (트랜잭션 밖). 실패해도 질문은 남기고, 답변 자리에 실패 안내를 저장한다.
        AiChatResponse aiResponse = null;
        try {
            aiResponse = webClient.post()
                    .uri("/api/chat/ask")
                    .bodyValue(aiRequest)
                    .retrieve()
                    .bodyToMono(AiChatResponse.class)
                    .block();
        } catch (RuntimeException e) {
            log.warn("AI 답변 호출 실패 roomId={}: {}", roomId, e.toString());
        }

        String answer = AI_ANSWER_FAILED_MESSAGE;
        Integer foundPage = null;
        String urlsString = null;
        if (aiResponse != null && aiResponse.getAiAnswer() != null) {
            answer = aiResponse.getAiAnswer();
            foundPage = aiResponse.getFoundPage();
            urlsString = (aiResponse.getManualImageUrls() != null && !aiResponse.getManualImageUrls().isEmpty())
                    ? String.join(",", aiResponse.getManualImageUrls())
                    : null;
        }
        String finalAnswer = answer;
        Integer finalFoundPage = foundPage;
        String finalUrlsString = urlsString;

        // 3) 답변 저장 (트랜잭션)
        return transactionTemplate.execute(status -> {
            ChatMessage aiMessage = ChatMessage.builder()
                    .chatRoom(chatRoomRepository.getReferenceById(roomId))
                    .senderType(ChatMessage.SenderType.AI)
                    .message(finalAnswer)
                    .referencedPage(finalFoundPage)
                    .manualImageUrl(finalUrlsString)
                    .build();
            chatMessageRepository.save(aiMessage);

            return new ChatMessageResponse(aiMessage);
        });
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
