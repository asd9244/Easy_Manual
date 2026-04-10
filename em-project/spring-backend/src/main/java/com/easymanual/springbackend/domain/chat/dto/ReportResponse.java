package com.easymanual.springbackend.domain.chat.dto;

import com.easymanual.springbackend.domain.chat.entity.DiagnosticReport;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.time.LocalDateTime;

@Schema(description = "프론트엔드 PDF 렌더용 AI 진단 리포트 응답 객체")
@Getter
public class ReportResponse {
    
    @Schema(description = "사용자가 직접 지은 기기 별명 (내 기기 화면의 그 이름)", example = "거실 벽걸이 에어컨")
    private String deviceName;
    
    @Schema(description = "제품군 대표 모델명", example = "FQ17SADWE2")
    private String modelName;
    
    @Schema(description = "문제가 발생하여 처음 채팅을 건 시점(현상 발생일)", example = "2026-04-10T09:40:02")
    private LocalDateTime occurrenceDate;
    
    @Schema(description = "사용자가 상담을 통해 호소한 주요 증상 (AI 요약)", example = "사용자가 기기 가동 시 딱딱거리는 소음을 호소함")
    private String symptoms;
    
    @Schema(description = "상담 데이터를 바탕으로 AI가 추론한 고장 원인", example = "먼지 탓")
    private String cause;
    
    @Schema(description = "사용자가 밟아야 할 해결 절차 (줄바꿈 문자로 리스트 구분)", example = "1. 코드 뽑기\\n2. 필터 세척\\n3. 건조")
    private String solutions;

    // 엔티티를 안전하게 프론트엔드 규격에 맞는 DTO로 변환
    public ReportResponse(DiagnosticReport report) {
        // ChatRoom -> UserDevice -> alias
        this.deviceName = report.getChatRoom().getUserDevice().getAlias();
        // ChatRoom -> UserDevice -> Manual -> representativeModelName
        this.modelName = report.getChatRoom().getUserDevice().getManual().getRepresentativeModelName();
        // 채팅방이 만들어진 시점 = 에러 발생 및 상담 시작 시점
        this.occurrenceDate = report.getChatRoom().getCreatedAt();
        
        this.symptoms = report.getSymptoms();
        this.cause = report.getCause();
        this.solutions = report.getSolutions();
    }
}
