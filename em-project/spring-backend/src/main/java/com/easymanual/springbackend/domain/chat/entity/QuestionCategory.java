package com.easymanual.springbackend.domain.chat.entity;

public enum QuestionCategory {
    MODEL_REGISTER("모델 등록"),
    CLEANING("청소"),
    FILTER("필터"),
    MALFUNCTION("고장"),
    REPAIR("수리"),
    USAGE("사용법"),
    REMOTE("리모컨"),
    INSTALL("설치"),
    WINTER_CARE("겨울철 관리"),
    ICE_MAKER("아이스 메이커"),
    FREEZER_USAGE("냉동고 사용법"),
    TEMPERATURE("온도"),
    ETC("기타");

    private final String label;

    QuestionCategory(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
