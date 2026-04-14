package com.easymanual.springbackend.global.config;

import com.easymanual.springbackend.domain.manual.entity.Manual;
import com.easymanual.springbackend.domain.manual.entity.Model;
import com.easymanual.springbackend.domain.manual.repository.ManualRepository;
import com.easymanual.springbackend.domain.manual.repository.ModelRepository;
import com.easymanual.springbackend.global.util.QrCodeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final ModelRepository modelRepository;
    private final ManualRepository manualRepository;
    private final QrCodeUtil qrCodeUtil;

    @Override
    public void run(String... args) throws Exception {
        // 1. 이미 마이그레이션이 완료되었는지 확인
        long modelCount = modelRepository.count();
        if (modelCount > 0) {
            log.info("이미 모델 마이그레이션이 완료되었습니다. (현재 모델 수: {})", modelCount);
            return; // 이미 데이터가 있으면 중복 실행되지 않도록 종료
        }

        log.info("기존 매뉴얼 데이터의 모델명들을 models 테이블로 분리하는 일회성 마이그레이션을 시작합니다...");

        // 2. 엔티티에서는 삭제되었지만 물리적 DB에는 남아있는 레거시 컬럼 조회
        String legacyQuery = "SELECT id, covered_model_names FROM manuals";
        
        try {
            List<Map<String, Object>> records = jdbcTemplate.queryForList(legacyQuery);

            for (Map<String, Object> record : records) {
                Long manualId = ((Number) record.get("id")).longValue();
                String coveredModelNames = (String) record.get("covered_model_names");

                if (coveredModelNames == null || coveredModelNames.isBlank()) {
                    continue;
                }

                // 매뉴얼 레퍼런스 조회
                Manual manual = manualRepository.findById(manualId).orElse(null);
                if (manual == null) continue;

                // 3. 콤마로 등록된 10개의 모델명을 분리하여 개별 모델 레코드 생성
                String[] modelNames = coveredModelNames.split(",");
                for (String mName : modelNames) {
                    String cleanName = mName.trim();
                    if (cleanName.isBlank()) continue;

                    // 4. 개별 모델마다 각각의 고유한 QR 코드를 발급받아 로컬 폴더에 저장
                    String qrUrl = qrCodeUtil.generateAndSaveQrCode(cleanName);

                    // 5. 생성된 모델을 DB(models 테이블)에 저장
                    Model model = Model.builder()
                            .name(cleanName)
                            .productType(manual.getProductType())
                            .qrCodeUrl(qrUrl)
                            .manual(manual)
                            .build();

                    modelRepository.save(model);
                    log.info("✨ 마이그레이션 완료: 매뉴얼 ID [{}], 등록 모델 [{}] (QR URL: {})", manualId, cleanName, qrUrl);
                }
            }
            log.info("🚀 데이터 마이그레이션 및 개별 QR 코드 생성이 완벽하게 끝났습니다!");
        } catch (Exception e) {
            log.error("마이그레이션 중 오류가 발생했습니다. (자료가 없거나 컬럼이 존재하지 않음)", e);
        }
    }
}
