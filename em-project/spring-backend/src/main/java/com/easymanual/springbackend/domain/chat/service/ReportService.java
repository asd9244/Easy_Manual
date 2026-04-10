package com.easymanual.springbackend.domain.chat.service;

import com.easymanual.springbackend.domain.chat.dto.AiSummaryRequest;
import com.easymanual.springbackend.domain.chat.dto.AiSummaryResponse;
import com.easymanual.springbackend.domain.chat.dto.ReportResponse;
import com.easymanual.springbackend.domain.chat.entity.ChatMessage;
import com.easymanual.springbackend.domain.chat.entity.ChatRoom;
import com.easymanual.springbackend.domain.chat.entity.DiagnosticReport;
import com.easymanual.springbackend.domain.chat.repository.ChatMessageRepository;
import com.easymanual.springbackend.domain.chat.repository.ChatRoomRepository;
import com.easymanual.springbackend.domain.chat.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WebClient webClient;

    @Transactional
    public ReportResponse getOrGenerateReport(Long roomId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방을 찾을 수 없습니다."));

        // 1. 리포트가 이미 DB에 존재하면 그대로 가져옵니다.
        // 2. 존재하지 않는다면 최초 1회 생성(generate) 로직을 구동합니다.
        DiagnosticReport report = reportRepository.findByChatRoomId(roomId)
                .orElseGet(() -> generateReportFromAi(chatRoom));

        return new ReportResponse(report);
    }

    private DiagnosticReport generateReportFromAi(ChatRoom chatRoom) {
        // 1. 해당 방의 모든 대화 내역 조회 (과거 대화부터 순서대로)
        List<ChatMessage> messages = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(chatRoom.getId());
        
        // 2. 대화 내역을 하나의 긴 텍스트로 합치기
        StringBuilder historyBuilder = new StringBuilder();
        for (ChatMessage msg : messages) {
            String sender = msg.getSenderType() == ChatMessage.SenderType.USER ? "유저" : "AI 비서";
            historyBuilder.append(sender).append(": ").append(msg.getMessage()).append("\n");
        }
        String chatHistory = historyBuilder.toString();

        if (chatHistory.trim().isEmpty()) {
            chatHistory = "대화 내역이 없습니다.";
        }

        log.info("🚀 AI 요약 엔진(FastAPI)으로 진단 리포트 생성을 요청합니다... (방 번호: {})", chatRoom.getId());

        // 3. WebClient를 통해 FastAPI 서버(/summary) 강제 JSON 응답 통신
        AiSummaryResponse aiResponse = null;
        try {
            aiResponse = webClient.post()
                    .uri("/summary")
                    .bodyValue(new AiSummaryRequest(chatHistory))
                    .retrieve()
                    .bodyToMono(AiSummaryResponse.class)
                    .block();
        } catch (Exception e) {
            log.error("FastAPI 요약 서버 통신 실패: {}", e.getMessage());
        }

        // 4. 실패 시 대비한 Fallback 기본값 세팅 (프론트가 죽지 않도록 방어)
        String symptoms = (aiResponse != null && aiResponse.getSymptoms() != null) ? aiResponse.getSymptoms() : "AI 진단 서버 통신 또는 요약 생성에 실패했습니다.";
        String cause = (aiResponse != null && aiResponse.getCause() != null) ? aiResponse.getCause() : "진단 불가 (원인 데이터 없음)";
        String solutions = (aiResponse != null && aiResponse.getSolutions() != null) ? aiResponse.getSolutions() : "해결 방안을 가져오지 못했습니다. 서버 에러 로그를 확인해주세요.";

        DiagnosticReport newReport = DiagnosticReport.builder()
                .chatRoom(chatRoom)
                .symptoms(symptoms)
                .cause(cause)
                .solutions(solutions)
                .build();

        // 5. DB 저장 및 반환
        return reportRepository.save(newReport);
    }
}
