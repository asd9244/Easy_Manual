package com.easymanual.springbackend.domain.chat.controller;

import com.easymanual.springbackend.domain.chat.dto.ChatRoomResponse;
import com.easymanual.springbackend.domain.chat.service.ChatService;
import com.easymanual.springbackend.domain.chat.dto.ChatMessageResponse;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.easymanual.springbackend.domain.chat.dto.ChatAskRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateRequest;
import com.easymanual.springbackend.domain.chat.dto.ChatRoomCreateResponse;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getMyChatRooms(Principal principal) {
        String email = principal.getName();
        List<ChatRoomResponse> responseList = chatService.getMyChatRooms(email);
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getChatMessages(
            @PathVariable("roomId") Long roomId,
            Principal principal) {
        String email = principal.getName();
        List<ChatMessageResponse> responseList = chatService.getChatMessages(roomId, email);
        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/rooms/{roomId}/ask")
    public ResponseEntity<ChatMessageResponse> askQuestion(
            @PathVariable("roomId") Long roomId,
            @RequestBody ChatAskRequest request,
            Principal principal) {
        String email = principal.getName();
        ChatMessageResponse response = chatService.askQuestion(roomId, email, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomCreateResponse> createChatRoom(
            @RequestBody ChatRoomCreateRequest request,
            Principal principal) {
        String email = principal.getName();
        ChatRoomCreateResponse response = chatService.createChatRoom(email, request);
        return ResponseEntity.ok(response);
    }

    // 채팅방 삭제 API 추가
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> deleteChatRoom(
            @PathVariable("roomId") Long roomId,
            Principal principal) {
        String email = principal.getName();
        chatService.deleteChatRoom(roomId, email);
        return ResponseEntity.noContent().build();
    }
}
