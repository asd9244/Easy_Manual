package com.easymanual.springbackend.domain.user.controller;

import com.easymanual.springbackend.domain.user.dto.LoginRequest;
import com.easymanual.springbackend.domain.user.dto.LoginResponse;
import com.easymanual.springbackend.domain.user.dto.SignUpRequest;
import com.easymanual.springbackend.domain.user.dto.UserResponse;
import com.easymanual.springbackend.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
// 프론트엔드가 접속할 URL 주소를 열어주고, 주방장(Service)에게 일을 시킵니다.


@RestController // 이 클래스가 REST API 요청을 처리하는 곳임을 선언
@RequestMapping("/api") // 이 컨트롤러의 기본 주소는 "/api/auth" 로 시작함
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // POST 방식으로 "/api/auth/signup" 주소로 요청이 오면 이 메서드가 실행됨
    @PostMapping("/auth/signup")
    public ResponseEntity<UserResponse> signUp(@RequestBody SignUpRequest request) {
        // 1. 프론트엔드가 보낸 주문서(request)를 주방장(userService)에게 넘김
        UserResponse response = userService.signUp(request);

        // 2. 요리 결과(response)를 상태코드 200(OK)과 함께 프론트엔드에 반환
        return ResponseEntity.ok(response);
    }

    // 로그인 API!
    // POST 방식으로 "/api/auth/login" 주소로 요청이 오면 실행됩니다.
    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // 1. 프론트엔드가 보낸 로그인 주문서(이메일, 비번)를 주방장에게 넘깁니다.
        LoginResponse response = userService.login(request);

        // 2. 주방장이 만들어준 토큰이 담긴 영수증을 프론트엔드에게 전달합니다.
        return ResponseEntity.ok(response);
    }

    // GET 방식으로 "/api/users/me" 주소로 요청이 오면 실행됩니다.
    @GetMapping("/users/me")
    public ResponseEntity<UserResponse> getMyInfo(Principal principal) {
        // 1. Principal(장부)에는 아까 스캐너가 적어둔 유저의 '이메일'이 들어있습니다.
        String email = principal.getName();

        // 2. 주방장(Service)에게 이메일을 주면서 "이 손님 정보 좀 가져와!" 라고 시킵니다.
        UserResponse response = userService.getMyInfo(email);

        // 3. 찾아온 손님 정보(영수증)를 프론트엔드에게 돌려줍니다.
        return ResponseEntity.ok(response);
    }
}