package com.easymanual.springbackend.domain.chat.repository;

import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import com.easymanual.springbackend.domain.chat.entity.QuestionCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("SELECT c FROM ChatRoom c JOIN c.userDevice d WHERE d.user.email = :email ORDER BY c.createdAt DESC")
    List<ChatRoom> findAllByUserEmailOrderByCreatedAtDesc(@Param("email") String email);

    // 특정 제품 유형의 카테고리별 채팅방 수 집계 (ETC 제외, 많은 순 정렬)
    @Query("SELECT c.questionCategory as category, COUNT(c) as count " +
           "FROM ChatRoom c " +
           "JOIN c.userDevice ud " +
           "JOIN ud.manual m " +
           "WHERE m.productType = :productType " +
           "AND c.questionCategory IS NOT NULL " +
           "AND c.questionCategory <> com.easymanual.springbackend.domain.chat.entity.QuestionCategory.ETC " +
           "GROUP BY c.questionCategory " +
           "ORDER BY COUNT(c) DESC")
    List<CategoryStatProjection> findCategoryStatsByProductType(
            @Param("productType") String productType, Pageable pageable);

    // 집계용 인터페이스 프로젝션
    interface CategoryStatProjection {
        QuestionCategory getCategory();
        Long getCount();
    }
}