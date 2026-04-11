package com.easymanual.springbackend.domain.chat.service;

import com.easymanual.springbackend.domain.chat.dto.ChatMessageResponse;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomResponse;
import com.easymanual.springbackend.domain.chat.entity.ChatMessage;
import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import com.easymanual.springbackend.domain.chat.repository.ChatRoomRepository;
import com.easymanual.springbackend.domain.chat.dto.ChatMessageResponse;
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
import com.easymanual.springbackend.domain.chat.dto.AiChatRequest;
import com.easymanual.springbackend.domain.chat.dto.AiChatResponse;
import com.easymanual.springbackend.domain.chat.dto.ChatAskRequest;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

// 리포지토리에서 조회한 ChatRoom 엔티티 리스트를 클라이언트 반환용인 ChatRoomResponse DTO 리스트로 변환하는 비즈니스 로직을 담당합니다.

@Service
@RequiredArgsConstructor
public class ChatService {

    // 데이터베이스 접근을 위해 ChatRoomRepository 인터페이스를 의존성 주입(DI) 받습니다.
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WebClient webClient;
    private final UserDeviceRepository userDeviceRepository;

    // 데이터의 변경(CUD) 없이 조회(Read)만 수행하므로 readOnly = true 옵션을 주어 성능을 최적화합니다.
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getMyChatRooms(String email) {

        // 1. 리포지토리를 호출하여 해당 이메일을 가진 유저의 모든 채팅방 엔티티 리스트를 조회합니다.
        List<ChatRoom> chatRooms = chatRoomRepository.findAllByUserEmailOrderByCreatedAtDesc(email);

        // 2. 조회된 엔티티 리스트(List<ChatRoom>)를 클라이언트 반환용 DTO 리스트(List<ChatRoomResponse>)로 변환합니다.
        // Java 8의 Stream API를 사용하여 각 엔티티 객체를 DTO 객체로 매핑(map)한 뒤 리스트로 반환합니다.
        return chatRooms.stream()
                .map(chatRoom -> new ChatRoomResponse(chatRoom))
                .toList();
    }


    // 특정 채팅방의 상세 대화 내역 조회
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatMessages(Long roomId, String email) {

        // 1. 클라이언트가 요청한 roomId로 DB에서 ChatRoom 엔티티를 조회합니다.
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));

        // 2. 보안 검증: 조회된 채팅방이 현재 로그인한 유저(email)의 소유가 맞는지 확인합니다.
        // (다른 유저가 악의적으로 남의 채팅방 번호를 입력하여 훔쳐보는 것을 방지하는 필수 로직입니다.)
        if (!chatRoom.getUserDevice().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 채팅방에 접근할 권한이 없습니다.");
        }

        // 3. 리포지토리를 호출하여 해당 채팅방에 속한 모든 메시지 엔티티 리스트를 시간 순서대로 조회합니다.
        List<ChatMessage> messages = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId);

        // 4. 조회된 엔티티 리스트(List<ChatMessage>)를 클라이언트 반환용 DTO 리스트(List<ChatMessageResponse>)로 변환하여 반환합니다.
        return messages.stream()
                .map(message -> new ChatMessageResponse(message))
                .toList();
    }


    // AI에게 질문하고 답변 받기 (이미지 처리 및 제목 생성 추가)
    @Transactional // DB에 데이터를 저장(INSERT) 및 수정(UPDATE)해야 하므로 트랜잭션을 시작합니다.
    public ChatMessageResponse askQuestion(Long roomId, String email, ChatAskRequest request) {

        // 1. DB에서 ChatRoom 엔티티를 조회하고, 현재 로그인한 유저의 소유인지 검증합니다.
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));

        if (!chatRoom.getUserDevice().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 채팅방에 접근할 권한이 없습니다.");
        }

        // 🌟 추가됨: 프론트엔드 요구사항 4번 (채팅방 제목 자동 생성 로직)
        // 해당 채팅방에 기존 메시지가 하나도 없는지(첫 질문인지) 확인하기 위해 리포지토리를 조회합니다.
        boolean isFirstMessage = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId).isEmpty();

        if (isFirstMessage) {
            // 첫 질문이라면, 유저가 입력한 텍스트의 앞부분을 잘라내어 제목으로 사용합니다.
            String newTitle = request.getMessage();
            // 텍스트가 15자를 초과하면 15자까지만 자르고 "..."을 붙여 요약합니다.
            if (newTitle.length() > 15) {
                newTitle = newTitle.substring(0, 15) + "...";
            }
            // ChatRoom 엔티티의 내부 메서드를 호출하여 상태 값을 변경합니다.
            // (주의: ChatRoom.java 엔티티 클래스 내부에 public void updateTitle(String title) { this.title = title; } 메서드를 미리 만들어 두어야 합니다!)
            chatRoom.updateTitle(newTitle);
            // @Transactional에 의해 영속성 컨텍스트가 변경을 감지(Dirty Checking)하여 트랜잭션 종료 시 자동으로 UPDATE 쿼리를 실행합니다.
        }

        // 2. 클라이언트가 보낸 질문과 이미지 URL을 ChatMessage 엔티티로 생성하여 DB에 영구 저장(Persist)합니다.
        ChatMessage userMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .senderType(ChatMessage.SenderType.USER)
                .message(request.getMessage())
                .mediaUrl(request.getMediaUrl()) // 🌟 추가됨: 프론트엔드가 보낸 이미지 URL 바인딩
                .build();
        chatMessageRepository.save(userMessage);

        // 3. FastAPI로 전송할 요청 DTO(AiChatRequest)를 조립합니다.
        String manualCode = chatRoom.getUserDevice().getManual().getManualCode();
        AiChatRequest aiRequest = AiChatRequest.builder()
                .manual_id(manualCode)
                .question(request.getMessage())
                .media_url(request.getMediaUrl()) // 🌟 추가됨: AI 서버로 이미지 URL 전송
                .build();

        // 4. WebClient를 사용하여 FastAPI 서버로 HTTP POST 요청을 전송합니다.
        AiChatResponse aiResponse = webClient.post()
                .uri("/api/chat/ask")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(AiChatResponse.class)
                .block();

        // 5. FastAPI로부터 받은 AI의 답변을 ChatMessage 엔티티로 생성하여 DB에 저장합니다.
        // 프론트엔드의 멀티 이미지 스와이프 처리를 위해 리스트를 콤마(,)로 결합해 하나의 DB 문자열에 저장합니다. (스키마 변경 최소화)
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

        // 6. 최종적으로 저장된 AI의 메시지 엔티티를 응답 DTO로 변환하여 컨트롤러로 반환합니다.
        return new ChatMessageResponse(aiMessage);
    }


    // 채팅방 신규 생성 비즈니스 로직
    @Transactional
    public ChatRoomCreateResponse createChatRoom(String email, ChatRoomCreateRequest request) {

        // 1. 프론트엔드가 전달한 기기 ID로 DB에서 UserDevice 엔티티를 조회합니다.
        UserDevice userDevice = userDeviceRepository.findById(request.getUserDeviceId())
                .orElseThrow(() -> new IllegalArgumentException("해당 기기를 찾을 수 없습니다."));

        // 2. 보안 검증: 해당 기기가 현재 로그인한 유저의 소유인지 확인합니다.
        if (!userDevice.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("해당 기기에 접근할 권한이 없습니다.");
        }

        // 3. 새로운 ChatRoom 엔티티를 생성합니다.
        // 제목(title)은 프론트엔드 요청 4번에 따라 첫 질문 시 업데이트할 예정이므로 임시 제목을 넣습니다.
        ChatRoom newChatRoom = ChatRoom.builder()
                .userDevice(userDevice)
                .title("새로운 대화")
                .build();

        // 4. DB에 영구 저장(Persist)합니다.
        ChatRoom savedChatRoom = chatRoomRepository.save(newChatRoom);

        // 5. 생성된 채팅방의 ID를 DTO에 담아 반환합니다.
        return new ChatRoomCreateResponse(savedChatRoom.getId());
    }
}