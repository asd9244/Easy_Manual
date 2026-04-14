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
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateResponse;
import com.easymanual.springbackend.domain.device.entity.UserDevice;
import com.easymanual.springbackend.domain.device.repository.UserDeviceRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

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
                .mediaUrl(request.getMediaUrl())
                .build();
        chatMessageRepository.save(userMessage);

        String manualCode = chatRoom.getUserDevice().getManual().getManualCode();
        AiChatRequest aiRequest = AiChatRequest.builder()
                .manual_id(manualCode)
                .question(request.getMessage())
                .media_url(request.getMediaUrl())
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