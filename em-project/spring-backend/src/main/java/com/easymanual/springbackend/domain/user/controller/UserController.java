package com.easymanual.springbackend.domain.user.controller;

import com.easymanual.springbackend.domain.user.dto.*;
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

    // 회원가입 API
    // POST 방식으로 "/api/auth/signup" 주소로 요청이 오면 이 메서드가 실행됨
    @PostMapping("/auth/signup")
    public ResponseEntity<UserResponse> signUp(@RequestBody SignUpRequest request) {
        // 1. 프론트엔드가 보낸 주문서(request)를 주방장(userService)에게 넘김
        UserResponse response = userService.signUp(request);

        // 2. 요리 결과(response)를 상태코드 200(OK)과 함께 프론트엔드에 반환
        return ResponseEntity.ok(response);
    }

    // 로그인 API
    // POST 방식으로 "/api/auth/login" 주소로 요청이 오면 실행됩니다.
    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // 1. 프론트엔드가 보낸 로그인 주문서(이메일, 비번)를 주방장에게 넘깁니다.
        LoginResponse response = userService.login(request);

        // 2. 주방장이 만들어준 토큰이 담긴 영수증을 프론트엔드에게 전달합니다.
        return ResponseEntity.ok(response);
    }

    // 회원정보 조회 API
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

    // 내 정보 수정 API
    // PUT 방식으로 "/api/users/me" 주소로 요청이 오면 실행됩니다.
    @PutMapping("/users/me")
    public ResponseEntity<UserResponse> updateMyInfo(
            Principal principal, // 1. 장부에서 내 이메일을 꺼내기 위한 도구(토큰 검사 통과자만 가질 수 있다)
            @RequestBody UserUpdateRequest request) { // 2. 프론트엔드가 보낸 새 닉네임 주문서

        String email = principal.getName(); // 장부에서 이메일 꺼내기
        UserResponse response = userService.updateMyInfo(email, request); // 서비스에 닉네임변경요청 후 반환값을 응답객체에 할당
        return ResponseEntity.ok(response); // 프론트에 응답객체를 200코드와 함께 전송
    }

    // 회원 탈퇴 API
    // RESTful API설계 원칙에 따라, 자원의 삭제를 의미하는 DELETE HTTP 메서드를 사용.
    @DeleteMapping("users/me")
    public ResponseEntity<Void> withdrawUser(Principal principal) {

        // 1. 인증 객체(principal)에서 현재 로그인된 사용자의 이메일을 추출.
        String email = principal.getName();

        // 2. 서비스 계층의 회원 탈퇴 로직을 호출.
        userService.withdrawUser(email);

        // 3. 삭제처리가 성공적으로 완료되었음을 알리기 위해,
        // 응답 본문(body)없이 HTTP 상태 코드 200(OK)만 클라이언트에게 반환합니다.

        return ResponseEntity.noContent().build();
    }

    // [새로 추가] 토큰을 제시하면 내 테마를 업데이트해 주는 창구
    @PatchMapping("/users/me/theme")
    public ResponseEntity<Void> updateTheme(@RequestBody ThemeUpdateRequest request, Principal principal) {
        // 1. 요청 띠지(Token)에서 알아낸 '현재 방문자의 이름표(이메일)'를 확인합니다.
        String email = principal.getName();

        // 2. 창고 관리자(Service)에게 이메일과 변경할 테마를 넘겨줍니다. 
        userService.updateTheme(email, request.getTheme());
        
        // 3. 200 OK
        return ResponseEntity.ok().build();
    }
}
