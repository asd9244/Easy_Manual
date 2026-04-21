package com.easymanual.springbackend.domain.manual.repository;

import com.easymanual.springbackend.domain.manual.entity.Manual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// 클라이언트가 입력한 모델명을 기반으로, DB의 manuals 테이블에서 일치하는 매뉴얼 엔티티를 조회하는 역할을 합니다.

public interface ManualRepository extends JpaRepository<Manual, Long> {

    /** 동일 제품군이 여러 건일 때를 대비해 id가 가장 작은 매뉴얼 한 건 */
    Optional<Manual> findFirstByProductTypeOrderByIdAsc(String productType);

    // 기존 기기 등록 시 사용하는 쿼리 (하위 호환성 유지)
    @Query("SELECT DISTINCT m FROM Manual m JOIN m.models mod WHERE mod.name LIKE %:modelName%")
    Optional<Manual> findByModelNameContaining(@Param("modelName") String modelName);

    // 새롭게 추가된 검색 범위 확장 쿼리
    @Query("SELECT DISTINCT m FROM Manual m LEFT JOIN m.models mod " +
           "WHERE mod.name LIKE %:query% " +
           "OR m.productType LIKE %:query% " +
           "OR m.representativeModelName LIKE %:query%")
    List<Manual> searchManuals(@Param("query") String query);
}