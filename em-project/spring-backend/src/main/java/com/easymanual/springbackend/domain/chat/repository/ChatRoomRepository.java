package com.easymanual.springbackend.domain.chat.repository;

import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
// 데이터베이스의 chat_rooms 테이블에 접근하여, 현재 로그인한 유저가 소유한 기기(UserDevice)들에 연결된 모든 채팅방 엔티티를 조회하는 인터페이스입니다.
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // JPQL을 사용하여 다중 조인(Join) 검색을 수행합니다.
    // ChatRoom -> UserDevice -> User 순으로 연관관계를 탐색하여,
    // 파라미터로 전달받은 email과 일치하는 유저의 채팅방만 조회합니다.
    // ORDER BY c.createdAt DESC를 통해 가장 최근에 질문한 내역이 목록 최상단에 오도록 정렬합니다.
    @Query("SELECT c FROM ChatRoom c JOIN c.userDevice d WHERE d.user.email = :email ORDER BY c.createdAt DESC")
    List<ChatRoom> findAllByUserEmailOrderByCreatedAtDesc(@Param("email") String email);
}