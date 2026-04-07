package com.easymanual.springbackend.domain.chat.controller;

import com.easymanual.springbackend.domain.chat.dto.ChatRoomResponse;
import com.easymanual.springbackend.domain.chat.service.ChatService;
import com.easymanual.springbackend.domain.chat.dto.ChatMessageResponse;
import org.springframework.web.bind.annotation.PathVariable;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.easymanual.springbackend.domain.chat.dto.ChatAskRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.security.Principal;
import java.util.List;

// 클라이언트의 GET /api/chat/rooms HTTP 요청을 매핑받아 서비스 로직을 호출하고, 그 결과를 HTTP 200(OK) 상태 코드와 함께 반환합니다.

@RestController
@RequestMapping("/api/chat") // 이 컨트롤러의 기본 엔드포인트 경로를 설정합니다.
@RequiredArgsConstructor
public class ChatController {

    // 비즈니스 로직 처리를 위해 ChatService를 의존성 주입(DI) 받습니다.
    private final ChatService chatService;

    // GET HTTP 메서드로 "/api/chat/rooms" 경로에 요청이 올 때 실행되도록 매핑합니다.
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getMyChatRooms(Principal principal) {

        // 1. SecurityContext에 저장된 인증 객체(Principal)에서 현재 로그인된 사용자의 이메일을 추출합니다.
        String email = principal.getName();

        // 2. 서비스 계층의 채팅방 목록 조회 로직을 호출하고, 반환된 DTO 리스트를 변수에 할당합니다.
        List<ChatRoomResponse> responseList = chatService.getMyChatRooms(email);

        // 3. 처리된 DTO 리스트를 HTTP 상태 코드 200(OK)과 함께 클라이언트에게 응답(Response)으로 전송합니다.
        return ResponseEntity.ok(responseList);
    }


    // 특정 채팅방의 상세 대화 내역 조회 API
    // GET HTTP 메서드로 "/api/chat/rooms/{roomId}/messages" 경로에 요청이 올 때 실행되도록 매핑합니다.
    // {roomId} 부분은 클라이언트가 클릭한 채팅방의 실제 ID 숫자로 치환됩니다. (예: /api/chat/rooms/1/messages)
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getChatMessages(
            @PathVariable("roomId") Long roomId, // URL 경로에 포함된 {roomId} 값을 변수로 추출하여 바인딩합니다.
            Principal principal) {

        // 1. 인증 객체(Principal)에서 현재 로그인된 사용자의 이메일을 추출합니다.
        String email = principal.getName();

        // 2. 서비스 계층의 대화 내역 조회 비즈니스 로직을 호출하고, 반환된 DTO 리스트를 변수에 할당합니다.
        List<ChatMessageResponse> responseList = chatService.getChatMessages(roomId, email);

        // 3. 처리된 DTO 리스트를 HTTP 상태 코드 200(OK)과 함께 클라이언트에게 응답으로 전송합니다.
        return ResponseEntity.ok(responseList);
    }

    // 새로 추가된 기능: 특정 채팅방에서 AI에게 질문하기 API
    @PostMapping("/rooms/{roomId}/ask")
    public ResponseEntity<ChatMessageResponse> askQuestion(
            @PathVariable("roomId") Long roomId,
            @RequestBody ChatAskRequest request,
            Principal principal) {

        // 1. 인증 객체(Principal)에서 이메일을 추출합니다.
        String email = principal.getName();

        // 2. 서비스 계층의 AI 통신 비즈니스 로직을 호출합니다.
        ChatMessageResponse response = chatService.askQuestion(roomId, email, request);

        // 3. AI의 답변이 담긴 DTO를 HTTP 상태 코드 200(OK)과 함께 클라이언트에게 반환합니다.
        return ResponseEntity.ok(response);
    }

    // 채팅방 신규 생성 API
    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomCreateResponse> createChatRoom(
            @RequestBody ChatRoomCreateRequest request,
            Principal principal) {

        // 인증 객체에서 이메일을 추출합니다.
        String email = principal.getName();

        // 서비스 계층을 호출하여 채팅방을 생성하고 결과를 받습니다.
        ChatRoomCreateResponse response = chatService.createChatRoom(email, request);

        // HTTP 200 상태 코드와 함께 생성된 방 번호를 반환합니다.
        return ResponseEntity.ok(response);
    }
}































