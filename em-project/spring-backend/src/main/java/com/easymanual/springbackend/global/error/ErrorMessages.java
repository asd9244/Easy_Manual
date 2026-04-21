package com.easymanual.springbackend.global.error;

/**
 * API·서비스에서 던지는 {@link IllegalArgumentException} / {@link IllegalStateException} 메시지 문자열.
 * 클라이언트 계약 유지를 위해 문구 변경 시 반드시 동일 의미로 유지한다.
 */
public final class ErrorMessages {

    private ErrorMessages() {
    }

    public static final String USER_EMAIL_DUPLICATE = "이미 가입된 이메일입니다.";
    public static final String USER_EMAIL_NOT_REGISTERED = "가입되지 않은 이메일입니다.";
    public static final String USER_DELETED = "탈퇴한 회원입니다. 로그인이 불가능합니다.";
    public static final String USER_WRONG_PASSWORD = "비밀번호가 틀렸습니다.";
    public static final String USER_NOT_FOUND = "해당 유저를 찾을 수 없습니다.";

    public static final String FILE_UPLOAD_EMPTY = "업로드할 파일이 없습니다.";

    public static final String MANUAL_MODEL_NOT_SUPPORTED = "지원하지 않는 모델명입니다.";
    public static final String DEVICE_NOT_FOUND = "해당 기기를 찾을 수 없습니다.";
    public static final String DEVICE_DELETE_FORBIDDEN = "해당 기기를 삭제할 권한이 없습니다.";
    public static final String DEVICE_ALIAS_UPDATE_FORBIDDEN = "해당 기기의 이름을 수정할 권한이 없습니다.";
    public static final String DEVICE_ACCESS_DENIED = "해당 기기에 접근할 권한이 없습니다.";

    public static final String CHAT_ROOM_NOT_FOUND = "해당 채팅방을 찾을 수 없습니다.";
    public static final String CHAT_ROOM_ACCESS_DENIED = "해당 채팅방에 접근할 권한이 없습니다.";
    public static final String CHAT_ROOM_DELETE_FORBIDDEN = "해당 채팅방을 삭제할 권한이 없습니다.";
    public static final String CHAT_SUMMARY_EMPTY = "요약할 대화 내용이 없습니다.";
    public static final String CHAT_SUMMARY_AI_EMPTY = "요약 응답이 비어 있습니다.";
    public static final String CHAT_MESSAGE_NOT_FOUND = "해당 메시지를 찾을 수 없습니다.";
    public static final String CHAT_MESSAGE_WRONG_ROOM = "메시지가 해당 채팅방에 속하지 않습니다.";
    public static final String CHAT_SUMMARY_ONLY_AI = "AI 답변 메시지만 요약할 수 있습니다.";
    public static final String CHAT_SUMMARY_NO_USER_FOR_AI = "이 답변에 대응하는 사용자 질문을 찾을 수 없습니다.";
    public static final String CHAT_SUMMARY_NO_TEXT = "요약할 텍스트가 없습니다.";

    public static final String OAUTH_EMAIL_NOT_FOUND = "이메일 정보를 찾을 수 없습니다.";
}
