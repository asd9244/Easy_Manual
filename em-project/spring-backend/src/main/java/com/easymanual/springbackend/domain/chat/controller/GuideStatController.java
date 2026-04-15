package com.easymanual.springbackend.domain.chat.controller;

import com.easymanual.springbackend.domain.chat.dto.GuideTop5Response;
import com.easymanual.springbackend.domain.chat.service.GuideStatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guides")
@RequiredArgsConstructor
public class GuideStatController {

    private final GuideStatService guideStatService;

    /**
     * 자주 찾는 가이드 TOP 5 조회
     * <p>
     * {@code productType=전체}: 모든 제품군 합산. 그 외: 해당 제품군만 (예: 에어컨, 냉장고, 세탁기).
     */
    @GetMapping("/top5")
    public ResponseEntity<GuideTop5Response> getTop5(
            @RequestParam String productType) {
        return ResponseEntity.ok(guideStatService.getTop5(productType));
    }
}
