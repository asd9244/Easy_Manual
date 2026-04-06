package com.easymanual.springbackend.domain.chat.repository;

import com.easymanual.springbackend.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 데이터베이스의 chat_messages 테이블에 접근하여, 특정 채팅방 ID(roomId)에 속한 모든 메시지 엔티티를 시간 순서대로 조회하는 인터페이스입니다.

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Spring Data JPA의 쿼리 메서드(Query Method) 기능을 활용합니다.
    // 메서드 이름만으로 "SELECT * FROM chat_messages WHERE chat_room_id = ? ORDER BY created_at ASC" 쿼리가 자동 생성됩니다.
    // 과거 대화부터 순서대로 보여주기 위해 생성 시간(CreatedAt) 기준 오름차순(Asc)으로 정렬합니다.
    List<ChatMessage> findAllByChatRoomIdOrderByCreatedAtAsc(Long chatRoomId);
}