package com.easymanual.springbackend.domain.device.controller;

import com.easymanual.springbackend.domain.device.dto.DeviceRegisterRequest;
import com.easymanual.springbackend.domain.device.dto.DeviceResponse;
import com.easymanual.springbackend.domain.device.dto.DeviceAliasUpdateRequest;
import com.easymanual.springbackend.domain.device.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.easymanual.springbackend.domain.device.dto.ManualSearchResponse;
import org.springframework.web.bind.annotation.RequestParam;

import java.security.Principal;
import java.util.List;

// POST /api/devices 엔드포인트를 생성합니다.
//클라이언트의 JSON 요청을 DTO로 바인딩받고, SecurityContext(인증 정보)에서 이메일을 추출하여 Service 계층으로 전달합니다.

@RestController
@RequestMapping("/api/devices") // 이 컨트롤러의 기본 엔드포인트 경로를 설정합니다.
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    // POST HTTP 메서드로 "/api/devices" 경로에 요청이 올 때 실행되도록 매핑합니다.
    @PostMapping
    public ResponseEntity<DeviceResponse> registerDevice(
            Principal principal, // SecurityContext에 저장된 인증된 사용자의 정보를 가져오는 객체입니다.
            @RequestBody DeviceRegisterRequest request) { // 클라이언트가 전송한 JSON 데이터를 DTO 객체로 바인딩합니다.

        // 1. 인증 객체(Principal)에서 현재 로그인된 사용자의 이메일을 추출합니다.
        String email = principal.getName();

        // 2. 서비스 계층의 기기 등록 비즈니스 로직을 호출하고, 반환된 DTO 객체를 변수에 할당합니다.
        DeviceResponse response = deviceService.registerDevice(email, request);

        // 3. 처리된 DTO 객체를 HTTP 상태 코드 200(OK)과 함께 클라이언트에게 응답(Response)으로 전송합니다.
        return ResponseEntity.ok(response);
    }

    // 내 기기 목록 조회 API
    @GetMapping
    public ResponseEntity<List<DeviceResponse>> getMyDevices(Principal principal) {

        // 1. 인증 객체(Principal)에서 현재 로그인된 사용자의 이메일을 추출합니다.
        String email = principal.getName();

        // 2. 서비스 계층의 기기 목록 조회 비즈니스 로직을 호출합니다.
        List<DeviceResponse> responseList = deviceService.getMyDevices(email);

        // 3. 조회된 DTO 리스트를 HTTP 상태 코드 200(OK)과 함께 클라이언트에게 응답으로 전송합니다.
        return ResponseEntity.ok(responseList);
    }


    // 새로 추가된 기능: 모델명 검색 API
    // GET 방식으로 "/api/devices/search?query=검색어" 주소로 요청이 오면 실행됩니다.
    @GetMapping("/search")
    public ResponseEntity<List<ManualSearchResponse>> searchManuals(
            // @RequestParam: URL 뒤에 물음표(?)로 붙어오는 데이터를 변수로 받아옵니다.
            @RequestParam("query") String query) {

        // 1. 서비스 계층에 검색어(query)를 넘겨주고 검색 결과를 받아옵니다.
        List<ManualSearchResponse> responseList = deviceService.searchManuals(query);

        // 2. 검색된 DTO 리스트를 HTTP 상태 코드 200(OK)과 함께 프론트엔드에 반환합니다.
        return ResponseEntity.ok(responseList);
    }

    // 새로 추가된 기능: 등록된 기기 삭제 API
    // DELETE 방식으로 "/api/devices/{deviceId}" 주소로 요청이 오면 실행됩니다.
    @DeleteMapping("/{deviceId}")
    public ResponseEntity<Void> deleteDevice(
            Principal principal,
            @PathVariable("deviceId") Long deviceId) {

        // 1. 인증 객체에서 이메일을 추출하고, 서비스 계층에 삭제 처리를 위임합니다.
        deviceService.deleteDevice(deviceId, principal.getName());

        // 2. 삭제 성공 시 상태 코드 204(No Content)를 전송합니다. 
        return ResponseEntity.noContent().build();
    }

    // 새로 추가된 기능: 등록된 기기 별명 수정 API
    // PATCH 방식으로 "/api/devices/{deviceId}/alias" 주소로 요청이 오면 실행됩니다.
    @PatchMapping("/{deviceId}/alias")
    public ResponseEntity<Void> updateDeviceAlias(
            Principal principal,
            @PathVariable("deviceId") Long deviceId,
            @RequestBody DeviceAliasUpdateRequest request) {

        // 1. 인증 객체에서 이메일을 추출하고, 서비스 계층에 수정을 위임합니다.
        deviceService.updateDeviceAlias(deviceId, principal.getName(), request.getAlias());

        // 2. 성공 시 기본 상태 코드(200 OK) 리턴 
        return ResponseEntity.ok().build();
    }
}