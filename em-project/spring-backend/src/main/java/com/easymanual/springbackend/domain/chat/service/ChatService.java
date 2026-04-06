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

import java.util.List;

// 리포지토리에서 조회한 ChatRoom 엔티티 리스트를 클라이언트 반환용인 ChatRoomResponse DTO 리스트로 변환하는 비즈니스 로직을 담당합니다.

@Service
@RequiredArgsConstructor
public class ChatService {

    // 데이터베이스 접근을 위해 ChatRoomRepository 인터페이스를 의존성 주입(DI) 받습니다.
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

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
}