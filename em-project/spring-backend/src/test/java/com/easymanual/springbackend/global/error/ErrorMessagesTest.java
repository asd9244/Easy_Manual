package com.easymanual.springbackend.global.error;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ErrorMessagesTest {

    @Test
    void chatRoomNotFoundMessageUnchangedForApiContract() {
        assertEquals("해당 채팅방을 찾을 수 없습니다.", ErrorMessages.CHAT_ROOM_NOT_FOUND);
    }

    @Test
    void userNotFoundMessageUnchangedForApiContract() {
        assertEquals("해당 유저를 찾을 수 없습니다.", ErrorMessages.USER_NOT_FOUND);
    }
}
