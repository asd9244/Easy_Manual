package com.easymanual.springbackend.domain.manual.repository;

import com.easymanual.springbackend.domain.manual.entity.Manual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// 클라이언트가 입력한 모델명을 기반으로, DB의 manuals 테이블에서 일치하는 매뉴얼 엔티티를 조회하는 역할을 합니다.

public interface ManualRepository extends JpaRepository<Manual, Long> {

    // JPQL(Java Persistence Query Language)을 사용하여 커스텀 쿼리를 작성합니다.
    // coveredModelNames 컬럼에는 "모델A, 모델B, 모델C" 형태의 문자열이 저장되어 있으므로,
    // LIKE 연산자를 사용하여 클라이언트가 입력한 모델명이 포함되어 있는지 부분 일치 검색을 수행합니다.
    @Query("SELECT m FROM Manual m WHERE m.coveredModelNames LIKE %:modelName%")
    Optional<Manual> findByModelNameContaining(@Param("modelName") String modelName);
}