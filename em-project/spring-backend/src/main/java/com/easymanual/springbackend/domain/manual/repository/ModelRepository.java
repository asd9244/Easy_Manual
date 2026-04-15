package com.easymanual.springbackend.domain.manual.repository;

import com.easymanual.springbackend.domain.manual.entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ModelRepository extends JpaRepository<Model, Long> {

    /** 매뉴얼별 models 테이블에서 id 기준 첫 번째 행 (시드용 대표 모델명) */
    Optional<Model> findFirstByManual_IdOrderByIdAsc(Long manualId);
}
