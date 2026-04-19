package com.easymanual.springbackend.domain.file.controller;

import com.easymanual.springbackend.domain.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** 프로필 이미지 등 공용 이미지 업로드. 저장 후 {@code /uploads/...} 경로를 반환한다. */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        String imageUrl = fileService.uploadImage(file);
        return ResponseEntity.ok(imageUrl);
    }
}
