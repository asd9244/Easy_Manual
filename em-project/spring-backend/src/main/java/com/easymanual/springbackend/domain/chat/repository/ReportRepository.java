package com.easymanual.springbackend.domain.chat.repository;

import com.easymanual.springbackend.domain.chat.entity.DiagnosticReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<DiagnosticReport, Long> {
    
    // 특정 방 번호(roomId)를 통해 그 방의 리포트를 판별하기 위한 검색 메서드입니다.
    Optional<DiagnosticReport> findByChatRoomId(Long chatRoomId);
}
