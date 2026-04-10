package com.easymanual.springbackend.domain.chat.controller;

import com.easymanual.springbackend.domain.chat.dto.ReportResponse;
import com.easymanual.springbackend.domain.chat.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Diagnostic Report API", description = "채팅 대화 내역 기반 AI 진단 리포트 요약본 제공 화면")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // 프론트엔드가 요구한 엔드포인트 1번
    @Operation(summary = "방 번호 기반 리포트 조회", description = "기존에 요약된 리포트가 있으면 반환하고, 처음 호출 시 FastAPI 서버를 찔러서 실제 요약본을 만들어낸 뒤 DB에 저장하고 가져옵니다.")
    @GetMapping("/reports/{roomId}")
    public ResponseEntity<ReportResponse> getDiagnosticReport(@PathVariable("roomId") Long roomId) {
        ReportResponse response = reportService.getOrGenerateReport(roomId);
        return ResponseEntity.ok(response);
    }
    
    // 프론트엔드가 대안으로 제시한 엔드포인트 2번 (프론트 변경의 편의를 위해 둘 다 열어둡니다)
    @Operation(summary = "방 번호 기반 리포트 조회 (대안 URI)", description = "위와 동일한 역할을 하는 대체 API 엔드포인트입니다.")
    @GetMapping("/chat/rooms/{roomId}/report")
    public ResponseEntity<ReportResponse> getDiagnosticReportAlt(@PathVariable("roomId") Long roomId) {
        ReportResponse response = reportService.getOrGenerateReport(roomId);
        return ResponseEntity.ok(response);
    }
}
