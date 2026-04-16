package com.easymanual.springbackend.domain.chat.controller;

import com.easymanual.springbackend.domain.chat.dto.*;
import com.easymanual.springbackend.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // 내 채팅방 목록 조회
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getMyChatRooms(Principal principal) {
        return ResponseEntity.ok(chatService.getMyChatRooms(principal.getName()));
    }

    // 특정 채팅방 메시지 내역 조회 (공유 링크용 비로그인 읽기 허용 — SecurityConfig 참고)
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getChatMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getChatMessages(roomId));
    }

    // 공유 화면용 방 제목·기기 정보 (비로그인)
    @GetMapping("/rooms/{roomId}/share-summary")
    public ResponseEntity<ChatRoomResponse> getChatRoomShareSummary(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getChatRoomShareSummary(roomId));
    }

    // 로그인 사용자 본인 방 대화 텍스트 요약 (AI 백엔드 동일 LLM)
    @PostMapping("/rooms/{roomId}/summarize")
    public ResponseEntity<ConversationSummaryResponse> summarizeConversation(
            @PathVariable Long roomId,
            Principal principal) {
        return ResponseEntity.ok(chatService.summarizeConversation(roomId, principal.getName()));
    }

    // 특정 AI 답변 한 턴만 요약 (직전 USER + 해당 AI)
    @PostMapping("/rooms/{roomId}/messages/{messageId}/summarize")
    public ResponseEntity<ConversationSummaryResponse> summarizeTurn(
            @PathVariable Long roomId,
            @PathVariable Long messageId,
            Principal principal) {
        return ResponseEntity.ok(chatService.summarizeTurn(roomId, messageId, principal.getName()));
    }

    // 질문하기 및 AI 답변 받기
    @PostMapping("/rooms/{roomId}/ask")
    public ResponseEntity<ChatMessageResponse> askQuestion(
            @PathVariable Long roomId,
            @RequestBody ChatAskRequest request,
            Principal principal) {
        return ResponseEntity.ok(chatService.askQuestion(roomId, principal.getName(), request));
    }

    // 새 채팅방 생성
    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomCreateResponse> createChatRoom(
            @RequestBody ChatRoomCreateRequest request,
            Principal principal) {
        return ResponseEntity.ok(chatService.createChatRoom(principal.getName(), request));
    }

    // 채팅방 개별 삭제
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> deleteChatRoom(
            @PathVariable Long roomId,
            Principal principal) {
        chatService.deleteChatRoom(roomId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    // [추가] 유저의 모든 채팅방 일괄 삭제
    @DeleteMapping("/rooms")
    public ResponseEntity<Void> deleteAllChatRooms(Principal principal) {
        chatService.deleteAllChatRooms(principal.getName());
        return ResponseEntity.noContent().build();
    }
}
