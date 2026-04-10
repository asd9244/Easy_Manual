package com.easymanual.springbackend.domain.manual.repository;

import com.easymanual.springbackend.domain.manual.entity.Manual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// 클라이언트가 입력한 모델명을 기반으로, DB의 manuals 테이블에서 일치하는 매뉴얼 엔티티를 조회하는 역할을 합니다.

public interface ManualRepository extends JpaRepository<Manual, Long> {

    // JPQL(Java Persistence Query Language)을 사용하여 커스텀 쿼리를 작성합니다.
    // models 테이블과 JOIN하여 클라이언트가 입력한 모델명이 포함되어 있는지 검색합니다.
    @Query("SELECT DISTINCT m FROM Manual m JOIN m.models mod WHERE mod.name LIKE %:modelName%")
    Optional<Manual> findByModelNameContaining(@Param("modelName") String modelName);
}