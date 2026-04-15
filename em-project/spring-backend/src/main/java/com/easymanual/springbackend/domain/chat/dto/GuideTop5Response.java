package com.easymanual.springbackend.domain.chat.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class GuideTop5Response {

    private final String productType;
    private final List<CategoryRankItem> top5;

    public GuideTop5Response(String productType, List<CategoryRankItem> top5) {
        this.productType = productType;
        this.top5 = top5;
    }

    @Getter
    public static class CategoryRankItem {
        private final int rank;
        private final String category;
        private final String label;
        private final Long count;

        public CategoryRankItem(int rank, String category, String label, Long count) {
            this.rank = rank;
            this.category = category;
            this.label = label;
            this.count = count;
        }
    }
}
