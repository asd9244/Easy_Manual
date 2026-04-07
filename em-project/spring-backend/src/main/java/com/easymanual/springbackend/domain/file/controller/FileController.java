package com.easymanual.springbackend.domain.file.controller;

import com.easymanual.springbackend.domain.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

// POST /api/files/upload 엔드포인트를 개방하여 클라이언트의 파일 업로드 요청을 수신하고, 서비스 로직을 거쳐 생성된 이미지의 URL 문자열을 클라이언트에게 반환합니다.

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    // POST HTTP 메서드로 "/api/files/upload" 경로에 요청이 올 때 실행됩니다.
    // 클라이언트는 JSON이 아닌 "multipart/form-data" 형식으로 파일을 전송해야 합니다.
    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            // @RequestParam을 사용하여 HTTP 요청의 "file" 파트에 담긴 데이터를 MultipartFile 객체로 바인딩합니다.
            @RequestParam("file") MultipartFile file) {

        // 1. 서비스 계층의 파일 저장 로직을 호출하고, 저장된 이미지의 접근 URL을 반환받습니다.
        String imageUrl = fileService.uploadImage(file);

        // 2. 생성된 URL 문자열을 HTTP 상태 코드 200(OK)과 함께 클라이언트에게 응답으로 전송합니다.
        return ResponseEntity.ok(imageUrl);
    }
}