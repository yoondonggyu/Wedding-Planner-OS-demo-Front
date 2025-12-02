#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wedding OS API 명세서 HTML 생성 스크립트
노션 템플릿 형식에 맞춰 완성도 높은 API 문서 생성
"""

import json
from datetime import datetime

# API 데이터 정의
API_DATA = {
    "base_url": "http://localhost:8101/api",
    "sections": []
}

# 인증 API
API_DATA["sections"].append({
    "id": "1",
    "name": "인증 (Authentication)",
    "apis": [
        {
            "id": "1.1",
            "name": "로그인",
            "method": "POST",
            "path": "/api/auth/login",
            "request": "LoginRequest",
            "response": "LoginResponse",
            "auth": False,
            "description": "이메일/비밀번호 검증 후 JWT 토큰 발급",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "email": "string",
                "password": "string"
            },
            "body_required": ["email", "password"],
            "body_optional": [],
            "status_codes": [
                {
                    "code": 200,
                    "message": "login_success",
                    "body": {
                        "message": "login_success",
                        "data": {
                            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            "token_type": "bearer",
                            "user_id": 1,
                            "nickname": "사용자",
                            "profile_image_url": "https://..."
                        }
                    },
                    "msg": "로그인 성공"
                },
                {
                    "code": 400,
                    "message": "invalid_credentials",
                    "body": {"message": "invalid_credentials", "data": None},
                    "msg": "아이디 또는 비밀번호를 확인해주세요"
                },
                {
                    "code": 422,
                    "message": "invalid_email_format",
                    "body": {"message": "invalid_email_format", "data": None},
                    "msg": "올바른 이메일 주소 형식을 입력해주세요"
                },
                {
                    "code": 422,
                    "message": "password_required",
                    "body": {"message": "password_required", "data": None},
                    "msg": "비밀번호를 입력해주세요"
                },
                {
                    "code": 500,
                    "message": "internal_server_error",
                    "body": {"message": "internal_server_error", "data": None},
                    "msg": "서버 오류"
                }
            ]
        },
        {
            "id": "1.2",
            "name": "회원 가입",
            "method": "POST",
            "path": "/api/auth/signup",
            "request": "SignupRequest",
            "response": "SignupResponse",
            "auth": False,
            "description": "이메일/비밀번호/닉네임/프로필 이미지 URL을 받아 신규 사용자 생성",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "email": "string",
                "password": "string",
                "password_check": "string",
                "nickname": "string",
                "profile_image_url": "string (HttpUrl)"
            },
            "body_required": ["email", "password", "password_check", "nickname", "profile_image_url"],
            "body_optional": [],
            "status_codes": [
                {
                    "code": 201,
                    "message": "register_success",
                    "body": {
                        "message": "register_success",
                        "data": {"user_id": 1}
                    },
                    "msg": "회원가입 성공"
                },
                {
                    "code": 400,
                    "message": "invalid_email_format",
                    "body": {"message": "invalid_email_format", "data": None},
                    "msg": "올바른 이메일 주소 형식을 입력해주세요"
                },
                {
                    "code": 409,
                    "message": "duplicate_email",
                    "body": {"message": "duplicate_email", "data": None},
                    "msg": "이미 사용 중인 이메일입니다"
                },
                {
                    "code": 409,
                    "message": "duplicate_nickname",
                    "body": {"message": "duplicate_nickname", "data": None},
                    "msg": "이미 사용 중인 닉네임입니다"
                },
                {
                    "code": 422,
                    "message": "password_mismatch",
                    "body": {"message": "password_mismatch", "data": None},
                    "msg": "비밀번호가 일치하지 않습니다"
                },
                {
                    "code": 500,
                    "message": "internal_server_error",
                    "body": {"message": "internal_server_error", "data": None},
                    "msg": "서버 오류"
                }
            ]
        }
    ]
})

# 사용자 API 추가
API_DATA["sections"].append({
    "id": "2",
    "name": "사용자 (User)",
    "apis": [
        {
            "id": "2.1",
            "name": "프로필 이미지 업로드",
            "method": "POST",
            "path": "/api/users/profile/upload",
            "request": "MultipartFormData",
            "response": "UploadResponse",
            "auth": False,
            "description": "Multipart 이미지 업로드, 응답으로 CDN URL 반환",
            "query_params": None,
            "path_params": None,
            "headers": [{"name": "Content-Type", "type": "String", "required": True, "description": "multipart/form-data"}],
            "body": {"file": "File (multipart/form-data)"},
            "body_required": ["file"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "upload_success", "body": {"message": "upload_success", "data": {"url": "https://..."}}, "msg": "업로드 성공"},
                {"code": 413, "message": "payload_too_large", "body": {"message": "payload_too_large", "data": None}, "msg": "파일 크기가 너무 큽니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "2.2",
            "name": "프로필 수정",
            "method": "PATCH",
            "path": "/api/users/profile",
            "request": "NicknamePatchRequest",
            "response": "UpdateProfileResponse",
            "auth": True,
            "description": "닉네임 수정. 중복/길이/공백 검증",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"nickname": "string", "profile_image_url": "string | null"},
            "body_required": ["nickname"],
            "body_optional": ["profile_image_url"],
            "status_codes": [
                {"code": 200, "message": "update_profile_success", "body": {"message": "update_profile_success", "data": {"nickname": "..."}}, "msg": "프로필 수정 성공"},
                {"code": 409, "message": "duplicate_nickname", "body": {"message": "duplicate_nickname", "data": None}, "msg": "이미 사용 중인 닉네임입니다"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "2.3",
            "name": "회원 탈퇴",
            "method": "DELETE",
            "path": "/api/users/profile",
            "request": None,
            "response": "DeleteUserResponse",
            "auth": True,
            "description": "회원 탈퇴. 사용자 관련 게시글/댓글/좋아요도 함께 삭제",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "delete_user_success", "body": {"message": "delete_user_success", "data": None}, "msg": "회원 탈퇴 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "2.4",
            "name": "비밀번호 변경",
            "method": "PUT",
            "path": "/api/users/password",
            "request": "PasswordUpdateRequest",
            "response": "UpdatePasswordResponse",
            "auth": True,
            "description": "기존 비밀번호 확인 후 새 비밀번호로 갱신",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"old_password": "string", "password": "string", "password_check": "string"},
            "body_required": ["old_password", "password", "password_check"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "update_password_success", "body": {"message": "update_password_success", "data": None}, "msg": "비밀번호 변경 성공"},
                {"code": 400, "message": "invalid_old_password", "body": {"message": "invalid_old_password", "data": None}, "msg": "기존 비밀번호가 일치하지 않습니다"},
                {"code": 422, "message": "password_mismatch", "body": {"message": "password_mismatch", "data": None}, "msg": "비밀번호가 일치하지 않습니다"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 게시판 API 추가 (주요 API만 포함, 나머지는 동일한 패턴으로 확장 가능)
API_DATA["sections"].append({
    "id": "3",
    "name": "게시판 (Posts)",
    "apis": [
        {
            "id": "3.1",
            "name": "게시글 목록 조회",
            "method": "GET",
            "path": "/api/posts",
            "request": None,
            "response": "PostListResponse",
            "auth": False,
            "description": "최신순 게시글 목록 조회",
            "query_params": [
                {"name": "page", "type": "Integer", "required": False, "default": "1", "description": "페이지 번호"},
                {"name": "limit", "type": "Integer", "required": False, "default": "10", "description": "페이지당 항목 수"},
                {"name": "board_type", "type": "String", "required": False, "default": "couple", "description": "게시판 타입 (couple: 예비부부 게시판, planner: 플래너 리뷰, venue_review: 웨딩홀 리뷰, private: 우리만의 공간, vault: 문서 보관함)"}
            ],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "get_posts_success", "body": {"message": "get_posts_success", "data": {"posts": [], "total": 0, "page": 1, "limit": 10}}, "msg": "게시글 목록 조회 성공"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "3.2",
            "name": "게시글 상세 조회",
            "method": "GET",
            "path": "/api/posts/{post_id}",
            "request": None,
            "response": "PostDetailResponse",
            "auth": False,
            "description": "게시글 상세 조회 (로그인 선택, 공개 게시판은 목록만 비회원 가능, 상세는 로그인 필요)",
            "query_params": None,
            "path_params": [{"name": "post_id", "type": "Integer", "description": "게시글 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "get_post_success", "body": {"message": "get_post_success", "data": {"post_id": 1, "title": "...", "content": "...", "comments": []}}, "msg": "게시글 상세 조회 성공"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "로그인이 필요한 기능입니다"},
                {"code": 404, "message": "post_not_found", "body": {"message": "post_not_found", "data": None}, "msg": "게시글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "3.3",
            "name": "게시글 작성",
            "method": "POST",
            "path": "/api/posts",
            "request": "PostCreateRequest",
            "response": "PostCreateResponse",
            "auth": True,
            "description": "게시글 작성 (AI 요약/태그/감성 분석은 서버 측에서 자동 수행)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"title": "string (max 2000자)", "content": "string", "image_url": "string (HttpUrl) | null", "board_type": "string (기본값: 'couple')"},
            "body_required": ["title", "content"],
            "body_optional": ["image_url", "board_type"],
            "status_codes": [
                {"code": 201, "message": "create_post_success", "body": {"message": "create_post_success", "data": {"post_id": 1}}, "msg": "게시글 작성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 422, "message": "invalid_request", "body": {"message": "invalid_request", "data": None}, "msg": "유효성 검사 실패"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "3.4",
            "name": "게시글 수정",
            "method": "PATCH",
            "path": "/api/posts/{post_id}",
            "request": "PostUpdateRequest",
            "response": "PostUpdateResponse",
            "auth": True,
            "description": "게시글 수정 (작성자 또는 커플 파트너만 가능)",
            "query_params": None,
            "path_params": [{"name": "post_id", "type": "Integer", "description": "게시글 ID"}],
            "headers": None,
            "body": {"title": "string | null", "content": "string | null", "image_url": "string (HttpUrl) | null"},
            "body_required": [],
            "body_optional": ["title", "content", "image_url"],
            "status_codes": [
                {"code": 200, "message": "update_post_success", "body": {"message": "update_post_success", "data": {"post_id": 1}}, "msg": "게시글 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "post_not_found", "body": {"message": "post_not_found", "data": None}, "msg": "게시글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "3.5",
            "name": "게시글 삭제",
            "method": "DELETE",
            "path": "/api/posts/{post_id}",
            "request": None,
            "response": "PostDeleteResponse",
            "auth": True,
            "description": "게시글 삭제 (작성자 또는 커플 파트너만 가능)",
            "query_params": None,
            "path_params": [{"name": "post_id", "type": "Integer", "description": "게시글 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "delete_post_success", "body": {"message": "delete_post_success", "data": None}, "msg": "게시글 삭제 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "post_not_found", "body": {"message": "post_not_found", "data": None}, "msg": "게시글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "3.6",
            "name": "게시글 좋아요 토글",
            "method": "POST",
            "path": "/api/posts/{post_id}/like",
            "request": None,
            "response": "LikeToggleResponse",
            "auth": True,
            "description": "게시글 좋아요 토글 (좋아요/취소)",
            "query_params": None,
            "path_params": [{"name": "post_id", "type": "Integer", "description": "게시글 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "like_toggled", "body": {"message": "like_toggled", "data": {"like_count": 10, "liked": True}}, "msg": "좋아요 토글 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "post_not_found", "body": {"message": "post_not_found", "data": None}, "msg": "게시글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "3.7",
            "name": "게시글 조회수 증가",
            "method": "PATCH",
            "path": "/api/posts/{post_id}/view",
            "request": None,
            "response": "ViewIncrementResponse",
            "auth": False,
            "description": "게시글 조회수 증가",
            "query_params": None,
            "path_params": [{"name": "post_id", "type": "Integer", "description": "게시글 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "view_incremented", "body": {"message": "view_incremented", "data": {"view_count": 100}}, "msg": "조회수 증가 성공"},
                {"code": 404, "message": "post_not_found", "body": {"message": "post_not_found", "data": None}, "msg": "게시글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "3.8",
            "name": "게시글 이미지 업로드",
            "method": "POST",
            "path": "/api/posts/upload",
            "request": "MultipartFormData",
            "response": "ImageUploadResponse",
            "auth": False,
            "description": "게시글 이미지 업로드 (이미지 분류 포함)",
            "query_params": None,
            "path_params": None,
            "headers": [{"name": "Content-Type", "type": "String", "required": True, "description": "multipart/form-data"}],
            "body": {"file": "File (multipart/form-data, image/jpeg, image/png, image/webp)"},
            "body_required": ["file"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "upload_success", "body": {"message": "upload_success", "data": {"url": "https://...", "category": "wedding"}}, "msg": "이미지 업로드 성공"},
                {"code": 400, "message": "invalid_file_type", "body": {"message": "invalid_file_type", "data": None}, "msg": "지원하지 않는 파일 형식입니다"},
                {"code": 413, "message": "payload_too_large", "body": {"message": "payload_too_large", "data": None}, "msg": "파일 크기가 너무 큽니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "3.9",
            "name": "문서 업로드 + OCR 처리",
            "method": "POST",
            "path": "/api/posts/upload-document",
            "request": "MultipartFormData",
            "response": "DocumentUploadResponse",
            "auth": True,
            "description": "문서 이미지를 업로드하고 OCR로 텍스트를 추출한 후, AI 요약 및 태깅을 수행하여 문서 보관함(vault)에 저장합니다.",
            "query_params": None,
            "path_params": None,
            "headers": [{"name": "Content-Type", "type": "String", "required": True, "description": "multipart/form-data"}],
            "body": {
                "file": "File (multipart/form-data, image/jpeg, image/png, image/webp, 최대 10MB)",
                "title": "string (Form field, 문서 제목)"
            },
            "body_required": ["file", "title"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "document_uploaded", "body": {"message": "document_uploaded", "data": {"post_id": 1, "title": "문서 제목", "content": "OCR로 추출된 텍스트", "image_url": "https://...", "summary": "AI 요약", "tags": ["태그1", "태그2"]}}, "msg": "문서 업로드 및 OCR 처리 성공"},
                {"code": 400, "message": "invalid_file_type", "body": {"message": "invalid_file_type", "data": {"allowed": ["jpg", "png", "webp"]}}, "msg": "지원하지 않는 파일 형식입니다"},
                {"code": 413, "message": "file_too_large", "body": {"message": "file_too_large", "data": {"max_size": "10MB"}}, "msg": "파일 크기가 너무 큽니다 (최대 10MB)"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 댓글 API 추가
API_DATA["sections"].append({
    "id": "4",
    "name": "댓글 (Comments)",
    "apis": [
        {
            "id": "4.1",
            "name": "댓글 목록 조회",
            "method": "GET",
            "path": "/api/posts/{post_id}/comments",
            "request": None,
            "response": "CommentListResponse",
            "auth": False,
            "description": "게시글의 댓글 목록 조회",
            "query_params": None,
            "path_params": [{"name": "post_id", "type": "Integer", "description": "게시글 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "get_comments_success", "body": {"message": "get_comments_success", "data": {"comments": []}}, "msg": "댓글 목록 조회 성공"},
                {"code": 404, "message": "post_not_found", "body": {"message": "post_not_found", "data": None}, "msg": "게시글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "4.2",
            "name": "댓글 작성",
            "method": "POST",
            "path": "/api/posts/{post_id}/comments",
            "request": "CommentCreateRequest",
            "response": "CommentCreateResponse",
            "auth": True,
            "description": "댓글 작성, 서버에서 감성 분석 수행",
            "query_params": None,
            "path_params": [{"name": "post_id", "type": "Integer", "description": "게시글 ID"}],
            "headers": None,
            "body": {"content": "string"},
            "body_required": ["content"],
            "body_optional": [],
            "status_codes": [
                {"code": 201, "message": "create_comment_success", "body": {"message": "create_comment_success", "data": {"comment_id": 1}}, "msg": "댓글 작성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "post_not_found", "body": {"message": "post_not_found", "data": None}, "msg": "게시글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "4.3",
            "name": "댓글 수정",
            "method": "PATCH",
            "path": "/api/posts/{post_id}/comments/{comment_id}",
            "request": "CommentUpdateRequest",
            "response": "CommentUpdateResponse",
            "auth": True,
            "description": "댓글 수정 (작성자만 가능)",
            "query_params": None,
            "path_params": [
                {"name": "post_id", "type": "Integer", "description": "게시글 ID"},
                {"name": "comment_id", "type": "Integer", "description": "댓글 ID"}
            ],
            "headers": None,
            "body": {"content": "string"},
            "body_required": ["content"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "update_comment_success", "body": {"message": "update_comment_success", "data": {"comment_id": 1}}, "msg": "댓글 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "comment_not_found", "body": {"message": "comment_not_found", "data": None}, "msg": "댓글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "4.4",
            "name": "댓글 삭제",
            "method": "DELETE",
            "path": "/api/posts/{post_id}/comments/{comment_id}",
            "request": None,
            "response": "CommentDeleteResponse",
            "auth": True,
            "description": "댓글 삭제 (작성자만 가능)",
            "query_params": None,
            "path_params": [
                {"name": "post_id", "type": "Integer", "description": "게시글 ID"},
                {"name": "comment_id", "type": "Integer", "description": "댓글 ID"}
            ],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "delete_comment_success", "body": {"message": "delete_comment_success", "data": None}, "msg": "댓글 삭제 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "comment_not_found", "body": {"message": "comment_not_found", "data": None}, "msg": "댓글을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 챗봇 API 추가
API_DATA["sections"].append({
    "id": "5",
    "name": "챗봇 (Chat)",
    "apis": [
        {
            "id": "5.1",
            "name": "챗봇 대화 (스트리밍)",
            "method": "POST",
            "path": "/api/chat",
            "request": "ChatRequest",
            "response": "StreamingResponse (NDJSON)",
            "auth": True,
            "description": "스트리밍 챗봇 (NDJSON). RAG + 개인 데이터 통합 + Vector DB 검색",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"message": "string", "user_id": "integer | null", "include_context": "boolean (기본값: true)"},
            "body_required": ["message"],
            "body_optional": ["user_id", "include_context"],
            "status_codes": [
                {"code": 200, "message": "chat_success", "body": {"type": "content", "content": "..."}, "msg": "스트리밍 응답"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 캘린더 API 추가
API_DATA["sections"].append({
    "id": "6",
    "name": "캘린더 (Calendar)",
    "apis": [
        {
            "id": "6.1",
            "name": "예식일 설정",
            "method": "POST",
            "path": "/api/calendar/wedding-date",
            "request": "WeddingDateSetRequest",
            "response": "WeddingDateSetResponse",
            "auth": True,
            "description": "예식일 설정 (JWT 토큰에서 user_id 추출, 커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"wedding_date": "string (YYYY-MM-DD)"},
            "body_required": ["wedding_date"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "wedding_date_set", "body": {"message": "wedding_date_set", "data": {"wedding_date": "2025-05-01"}}, "msg": "예식일 설정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 422, "message": "invalid_date_format", "body": {"message": "invalid_date_format", "data": None}, "msg": "올바른 날짜 형식을 입력해주세요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "6.2",
            "name": "예식일 조회",
            "method": "GET",
            "path": "/api/calendar/wedding-date",
            "request": None,
            "response": "WeddingDateResponse",
            "auth": True,
            "description": "예식일 조회 (JWT 토큰에서 user_id 추출, 커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "wedding_date_retrieved", "body": {"message": "wedding_date_retrieved", "data": {"wedding_date": "2025-05-01"}}, "msg": "예식일 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "6.3",
            "name": "타임라인 자동 생성",
            "method": "POST",
            "path": "/api/calendar/timeline/generate",
            "request": "TimelineGenerateRequest",
            "response": "TimelineGenerateResponse",
            "auth": True,
            "description": "D-Day 기반 타임라인 자동 생성 (커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"wedding_date": "string (YYYY-MM-DD)"},
            "body_required": ["wedding_date"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "timeline_generated", "body": {"message": "timeline_generated", "data": {"events_created": 10}}, "msg": "타임라인 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 422, "message": "invalid_date_format", "body": {"message": "invalid_date_format", "data": None}, "msg": "올바른 날짜 형식을 입력해주세요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "6.4",
            "name": "일정/할일 생성",
            "method": "POST",
            "path": "/api/calendar/todos",
            "request": "TodoCreateRequest",
            "response": "TodoCreateResponse",
            "auth": True,
            "description": "일정/할일 생성 (통합 API, 커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "title": "string",
                "description": "string | null",
                "due_date": "string (YYYY-MM-DD)",
                "category": "string (기본값: 'todo')",
                "priority": "string (기본값: 'medium')",
                "assignee": "string (기본값: 'both')"
            },
            "body_required": ["title", "due_date"],
            "body_optional": ["description", "category", "priority", "assignee"],
            "status_codes": [
                {"code": 200, "message": "todo_created", "body": {"message": "todo_created", "data": {"todo_id": 1}}, "msg": "일정/할일 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 422, "message": "invalid_request", "body": {"message": "invalid_request", "data": None}, "msg": "유효성 검사 실패"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "6.5",
            "name": "일정/할일 조회",
            "method": "GET",
            "path": "/api/calendar/todos",
            "request": None,
            "response": "TodoListResponse",
            "auth": True,
            "description": "일정/할일 조회 (통합 API, 커플 공유)",
            "query_params": [
                {"name": "completed", "type": "Boolean", "required": False, "default": None, "description": "완료 여부 필터"},
                {"name": "start_date", "type": "String", "required": False, "default": None, "description": "시작 날짜 (YYYY-MM-DD)"},
                {"name": "end_date", "type": "String", "required": False, "default": None, "description": "종료 날짜 (YYYY-MM-DD)"},
                {"name": "category", "type": "String", "required": False, "default": None, "description": "카테고리 필터 ('todo'로 필터링하면 할일만)"}
            ],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "todos_retrieved", "body": {"message": "todos_retrieved", "data": {"todos": []}}, "msg": "일정/할일 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "6.6",
            "name": "일정/할일 수정",
            "method": "PUT",
            "path": "/api/calendar/todos/{todo_id}",
            "request": "TodoUpdateRequest",
            "response": "TodoUpdateResponse",
            "auth": True,
            "description": "일정/할일 수정 (통합 API, 커플 공유)",
            "query_params": None,
            "path_params": [{"name": "todo_id", "type": "Integer", "description": "일정/할일 ID"}],
            "headers": None,
            "body": {
                "title": "string | null",
                "description": "string | null",
                "due_date": "string (YYYY-MM-DD) | null",
                "completed": "boolean | null",
                "category": "string | null",
                "priority": "string | null",
                "assignee": "string | null"
            },
            "body_required": [],
            "body_optional": ["title", "description", "due_date", "completed", "category", "priority", "assignee"],
            "status_codes": [
                {"code": 200, "message": "todo_updated", "body": {"message": "todo_updated", "data": {"todo_id": 1}}, "msg": "일정/할일 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "todo_not_found", "body": {"message": "todo_not_found", "data": None}, "msg": "일정/할일을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "6.7",
            "name": "일정/할일 삭제",
            "method": "DELETE",
            "path": "/api/calendar/todos/{todo_id}",
            "request": None,
            "response": "TodoDeleteResponse",
            "auth": True,
            "description": "일정/할일 삭제 (통합 API, 커플 공유)",
            "query_params": None,
            "path_params": [{"name": "todo_id", "type": "Integer", "description": "일정/할일 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "todo_deleted", "body": {"message": "todo_deleted", "data": None}, "msg": "일정/할일 삭제 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "todo_not_found", "body": {"message": "todo_not_found", "data": None}, "msg": "일정/할일을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "6.8",
            "name": "주간 요약 조회",
            "method": "GET",
            "path": "/api/calendar/week-summary",
            "request": None,
            "response": "WeekSummaryResponse",
            "auth": True,
            "description": "이번 주 요약 (챗봇 연동용, 커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "week_summary_retrieved", "body": {"message": "week_summary_retrieved", "data": {"summary": "..."}}, "msg": "주간 요약 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 예산 API 추가
API_DATA["sections"].append({
    "id": "7",
    "name": "예산 (Budget)",
    "apis": [
        {
            "id": "7.1",
            "name": "예산 항목 생성",
            "method": "POST",
            "path": "/api/budget/items",
            "request": "BudgetItemCreateRequest",
            "response": "BudgetItemCreateResponse",
            "auth": True,
            "description": "예산 항목 생성",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": None,
            "body": {
                "item_name": "string",
                "category": "string (기본값: 'etc')",
                "estimated_budget": "number (float)",
                "actual_expense": "number (float, 기본값: 0.0)",
                "unit": "string | null",
                "quantity": "number (float, 기본값: 1.0)",
                "notes": "string | null",
                "payer": "string (기본값: 'both')"
            },
            "body_required": ["item_name", "estimated_budget"],
            "body_optional": ["category", "actual_expense", "unit", "quantity", "notes", "payer"],
            "status_codes": [
                {"code": 200, "message": "budget_item_created", "body": {"message": "budget_item_created", "data": {"item_id": 1}}, "msg": "예산 항목 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 422, "message": "invalid_request", "body": {"message": "invalid_request", "data": None}, "msg": "유효성 검사 실패"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.2",
            "name": "예산 항목 조회",
            "method": "GET",
            "path": "/api/budget/items",
            "request": None,
            "response": "BudgetItemListResponse",
            "auth": True,
            "description": "예산 항목 조회 (커플 공유)",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "budget_items_retrieved", "body": {"message": "budget_items_retrieved", "data": {"items": []}}, "msg": "예산 항목 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.3",
            "name": "예산 항목 수정",
            "method": "PUT",
            "path": "/api/budget/items/{item_id}",
            "request": "BudgetItemUpdateRequest",
            "response": "BudgetItemUpdateResponse",
            "auth": True,
            "description": "예산 항목 수정 (커플 공유)",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": [{"name": "item_id", "type": "Integer", "description": "예산 항목 ID"}],
            "headers": None,
            "body": {"item_name": "string | null", "category": "string | null", "estimated_budget": "float | null", "actual_expense": "float | null", "unit": "string | null", "quantity": "float | null", "notes": "string | null", "payer": "string | null"},
            "body_required": [],
            "body_optional": ["item_name", "category", "estimated_budget", "actual_expense", "unit", "quantity", "notes", "payer"],
            "status_codes": [
                {"code": 200, "message": "budget_item_updated", "body": {"message": "budget_item_updated", "data": {"item_id": 1}}, "msg": "예산 항목 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "budget_item_not_found", "body": {"message": "budget_item_not_found", "data": None}, "msg": "예산 항목을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.4",
            "name": "예산 항목 삭제",
            "method": "DELETE",
            "path": "/api/budget/items/{item_id}",
            "request": None,
            "response": "BudgetItemDeleteResponse",
            "auth": True,
            "description": "예산 항목 삭제 (커플 공유)",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": [{"name": "item_id", "type": "Integer", "description": "예산 항목 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "budget_item_deleted", "body": {"message": "budget_item_deleted", "data": None}, "msg": "예산 항목 삭제 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "budget_item_not_found", "body": {"message": "budget_item_not_found", "data": None}, "msg": "예산 항목을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.5",
            "name": "예산 요약 조회",
            "method": "GET",
            "path": "/api/budget/summary",
            "request": None,
            "response": "BudgetSummaryResponse",
            "auth": True,
            "description": "예산 요약 (카테고리별 합계, 커플 공유)",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "budget_summary_retrieved", "body": {"message": "budget_summary_retrieved", "data": {"summary": {}}}, "msg": "예산 요약 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.6",
            "name": "총 예산 설정",
            "method": "POST",
            "path": "/api/budget/total",
            "request": "TotalBudgetSetRequest",
            "response": "TotalBudgetSetResponse",
            "auth": True,
            "description": "총 예산 설정 (커플 공유)",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": None,
            "body": {"total_budget": "float"},
            "body_required": ["total_budget"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "total_budget_set", "body": {"message": "total_budget_set", "data": {"total_budget": 10000000}}, "msg": "총 예산 설정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.7",
            "name": "Excel Export",
            "method": "GET",
            "path": "/api/budget/export/excel",
            "request": None,
            "response": "File (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)",
            "auth": True,
            "description": "예산 데이터를 Excel 파일로 Export",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "excel_exported", "body": {"message": "excel_exported", "data": None}, "msg": "Excel Export 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.8",
            "name": "CSV Export",
            "method": "GET",
            "path": "/api/budget/export/csv",
            "request": None,
            "response": "File (text/csv)",
            "auth": True,
            "description": "예산 데이터를 CSV로 Export",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "csv_exported", "body": {"message": "csv_exported", "data": None}, "msg": "CSV Export 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.9",
            "name": "Excel Import",
            "method": "POST",
            "path": "/api/budget/import/excel",
            "request": "MultipartFormData",
            "response": "BudgetImportResponse",
            "auth": True,
            "description": "Excel 파일에서 예산 데이터 Import",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": [{"name": "Content-Type", "type": "String", "required": True, "description": "multipart/form-data"}],
            "body": {"file": "File (multipart/form-data, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)"},
            "body_required": ["file"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "budget_imported", "body": {"message": "budget_imported", "data": {"items_imported": 10, "items": []}}, "msg": "Excel Import 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 400, "message": "invalid_file_type", "body": {"message": "invalid_file_type", "data": None}, "msg": "지원하지 않는 파일 형식입니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.10",
            "name": "CSV Import",
            "method": "POST",
            "path": "/api/budget/import/csv",
            "request": "MultipartFormData",
            "response": "BudgetImportResponse",
            "auth": True,
            "description": "CSV 파일에서 예산 데이터 Import",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": [{"name": "Content-Type", "type": "String", "required": True, "description": "multipart/form-data"}],
            "body": {"file": "File (multipart/form-data, text/csv)"},
            "body_required": ["file"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "budget_imported", "body": {"message": "budget_imported", "data": {"items_imported": 10, "items": []}}, "msg": "CSV Import 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 400, "message": "invalid_file_type", "body": {"message": "invalid_file_type", "data": None}, "msg": "지원하지 않는 파일 형식입니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "7.11",
            "name": "영수증 이미지 처리",
            "method": "POST",
            "path": "/api/budget/process-receipt",
            "request": "MultipartFormData",
            "response": "ReceiptProcessResponse",
            "auth": True,
            "description": "영수증/견적서 이미지 처리 (OCR + LLM 구조화)",
            "query_params": [{"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}],
            "path_params": None,
            "headers": [{"name": "Content-Type", "type": "String", "required": True, "description": "multipart/form-data"}],
            "body": {"file": "File (multipart/form-data, image/jpeg, image/png, image/webp)"},
            "body_required": ["file"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "receipt_processed", "body": {"message": "receipt_processed", "data": {"items": []}}, "msg": "영수증 처리 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 400, "message": "invalid_file_type", "body": {"message": "invalid_file_type", "data": None}, "msg": "지원하지 않는 파일 형식입니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 음성 비서 API 추가
API_DATA["sections"].append({
    "id": "8",
    "name": "음성 비서 (Voice)",
    "apis": [
        {
            "id": "8.1",
            "name": "음성 처리",
            "method": "POST",
            "path": "/api/voice/process",
            "request": "VoiceProcessRequest",
            "response": "VoiceProcessResponse",
            "auth": False,
            "description": "음성 처리 (STT + 자동 정리 파이프라인)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"audio_data": "string (base64 encoded audio)"},
            "body_required": ["audio_data"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "voice_processed", "body": {"message": "voice_processed", "data": {"text": "...", "structured_data": {}}}, "msg": "음성 처리 성공"},
                {"code": 400, "message": "invalid_audio_format", "body": {"message": "invalid_audio_format", "data": None}, "msg": "지원하지 않는 오디오 형식입니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "8.2",
            "name": "음성 응답 생성",
            "method": "POST",
            "path": "/api/voice/response",
            "request": None,
            "response": "VoiceResponseResponse",
            "auth": False,
            "description": "음성 질문에 대한 답변 생성",
            "query_params": [
                {"name": "query", "type": "String", "required": True, "default": None, "description": "음성 질문"},
                {"name": "user_id", "type": "Integer", "required": True, "default": None, "description": "사용자 ID"}
            ],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "voice_response_generated", "body": {"message": "voice_response_generated", "data": {"response": "..."}}, "msg": "음성 응답 생성 성공"},
                {"code": 400, "message": "invalid_request", "body": {"message": "invalid_request", "data": None}, "msg": "유효하지 않은 요청입니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 업체 추천 API 추가
API_DATA["sections"].append({
    "id": "9",
    "name": "업체 추천 (Vendor)",
    "apis": [
        {
            "id": "9.1",
            "name": "결혼식 프로필 생성",
            "method": "POST",
            "path": "/api/wedding-profiles",
            "request": "WeddingProfileCreateRequest",
            "response": "WeddingProfileCreateResponse",
            "auth": True,
            "description": "결혼식 프로필 생성",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "wedding_date": "string (YYYY-MM-DD)",
                "guest_count_category": "string (SMALL, MEDIUM, LARGE)",
                "total_budget": "number (float)",
                "location_city": "string",
                "location_district": "string",
                "style_indoor": "boolean (기본값: true)",
                "style_outdoor": "boolean (기본값: false)",
                "outdoor_rain_plan_required": "boolean (기본값: false)"
            },
            "body_required": ["wedding_date", "guest_count_category", "total_budget", "location_city", "location_district"],
            "body_optional": ["style_indoor", "style_outdoor", "outdoor_rain_plan_required"],
            "status_codes": [
                {"code": 200, "message": "profile_created", "body": {"message": "profile_created", "data": {"profile_id": 1}}, "msg": "프로필 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 422, "message": "invalid_request", "body": {"message": "invalid_request", "data": None}, "msg": "유효성 검사 실패"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.2",
            "name": "결혼식 프로필 목록 조회",
            "method": "GET",
            "path": "/api/wedding-profiles",
            "request": None,
            "response": "WeddingProfileListResponse",
            "auth": True,
            "description": "결혼식 프로필 목록 조회 (커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "wedding_profiles_retrieved", "body": {"message": "wedding_profiles_retrieved", "data": {"profiles": []}}, "msg": "결혼식 프로필 목록 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.3",
            "name": "결혼식 프로필 상세 조회",
            "method": "GET",
            "path": "/api/wedding-profiles/{profile_id}",
            "request": None,
            "response": "WeddingProfileDetailResponse",
            "auth": True,
            "description": "결혼식 프로필 상세 조회 (커플 공유)",
            "query_params": None,
            "path_params": [{"name": "profile_id", "type": "Integer", "description": "프로필 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "wedding_profile_retrieved", "body": {"message": "wedding_profile_retrieved", "data": {"profile_id": 1, "wedding_date": "2025-05-01"}}, "msg": "결혼식 프로필 상세 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "profile_not_found", "body": {"message": "profile_not_found", "data": None}, "msg": "프로필을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.4",
            "name": "결혼식 프로필 수정",
            "method": "PUT",
            "path": "/api/wedding-profiles/{profile_id}",
            "request": "WeddingProfileUpdateRequest",
            "response": "WeddingProfileUpdateResponse",
            "auth": True,
            "description": "결혼식 프로필 수정 (커플 공유)",
            "query_params": None,
            "path_params": [{"name": "profile_id", "type": "Integer", "description": "프로필 ID"}],
            "headers": None,
            "body": {
                "wedding_date": "string (YYYY-MM-DD) | null",
                "guest_count_category": "string | null",
                "total_budget": "float | null",
                "location_city": "string | null",
                "location_district": "string | null",
                "style_indoor": "boolean | null",
                "style_outdoor": "boolean | null",
                "outdoor_rain_plan_required": "boolean | null"
            },
            "body_required": [],
            "body_optional": ["wedding_date", "guest_count_category", "total_budget", "location_city", "location_district", "style_indoor", "style_outdoor", "outdoor_rain_plan_required"],
            "status_codes": [
                {"code": 200, "message": "wedding_profile_updated", "body": {"message": "wedding_profile_updated", "data": {"profile_id": 1}}, "msg": "결혼식 프로필 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "profile_not_found", "body": {"message": "profile_not_found", "data": None}, "msg": "프로필을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.5",
            "name": "결혼식 프로필 삭제",
            "method": "DELETE",
            "path": "/api/wedding-profiles/{profile_id}",
            "request": None,
            "response": "WeddingProfileDeleteResponse",
            "auth": True,
            "description": "결혼식 프로필 삭제 (커플 공유)",
            "query_params": None,
            "path_params": [{"name": "profile_id", "type": "Integer", "description": "프로필 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "wedding_profile_deleted", "body": {"message": "wedding_profile_deleted", "data": None}, "msg": "결혼식 프로필 삭제 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "profile_not_found", "body": {"message": "profile_not_found", "data": None}, "msg": "프로필을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.6",
            "name": "업체 추천",
            "method": "GET",
            "path": "/api/vendors/recommend",
            "request": None,
            "response": "VendorRecommendResponse",
            "auth": True,
            "description": "업체 추천 (프로필 기반, 커플 공유)",
            "query_params": [
                {"name": "wedding_profile_id", "type": "Integer", "required": True, "default": None, "description": "결혼식 프로필 ID"},
                {"name": "vendor_type", "type": "String", "required": False, "default": None, "description": "업체 타입 (IPHONE_SNAP, MC, SINGER, STUDIO_PREWEDDING, VENUE_OUTDOOR)"},
                {"name": "min_price", "type": "Float", "required": False, "default": None, "description": "최소 가격"},
                {"name": "max_price", "type": "Float", "required": False, "default": None, "description": "최대 가격"},
                {"name": "location_city", "type": "String", "required": False, "default": None, "description": "지역 필터"},
                {"name": "has_rain_plan", "type": "Boolean", "required": False, "default": None, "description": "우천 대비 여부"},
                {"name": "sort", "type": "String", "required": False, "default": "score_desc", "description": "정렬 방식 (score_desc, price_asc, price_desc, review_desc)"}
            ],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "vendors_recommended", "body": {"message": "vendors_recommended", "data": {"vendors": [], "total": 0}}, "msg": "업체 추천 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "profile_not_found", "body": {"message": "profile_not_found", "data": None}, "msg": "프로필을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.7",
            "name": "벤더 목록 조회",
            "method": "GET",
            "path": "/api/vendors",
            "request": None,
            "response": "VendorListResponse",
            "auth": False,
            "description": "벤더 목록 조회 (카테고리별)",
            "query_params": [{"name": "vendor_type", "type": "String", "required": False, "default": None, "description": "벤더 타입 필터"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "vendors_retrieved", "body": {"message": "vendors_retrieved", "data": {"vendors": []}}, "msg": "벤더 목록 조회 성공"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.8",
            "name": "벤더 계정 정보 조회",
            "method": "GET",
            "path": "/api/vendors/my-vendor",
            "request": None,
            "response": "MyVendorResponse",
            "auth": True,
            "description": "벤더 계정의 자신의 벤더 정보 조회",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "my_vendor_retrieved", "body": {"message": "my_vendor_retrieved", "data": {"vendor": {}}}, "msg": "벤더 정보 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "vendor_not_found", "body": {"message": "vendor_not_found", "data": None}, "msg": "벤더를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.9",
            "name": "업체 상세 조회",
            "method": "GET",
            "path": "/api/vendors/{vendor_id}",
            "request": None,
            "response": "VendorDetailResponse",
            "auth": False,
            "description": "업체 상세 조회",
            "query_params": None,
            "path_params": [{"name": "vendor_id", "type": "Integer", "description": "벤더 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "vendor_retrieved", "body": {"message": "vendor_retrieved", "data": {"vendor": {}}}, "msg": "업체 상세 조회 성공"},
                {"code": 404, "message": "vendor_not_found", "body": {"message": "vendor_not_found", "data": None}, "msg": "업체를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.10",
            "name": "찜하기",
            "method": "POST",
            "path": "/api/favorites",
            "request": "FavoriteVendorCreateRequest",
            "response": "FavoriteVendorCreateResponse",
            "auth": True,
            "description": "찜하기 (커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"vendor_id": "integer", "wedding_profile_id": "integer"},
            "body_required": ["vendor_id", "wedding_profile_id"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "favorite_created", "body": {"message": "favorite_created", "data": {"favorite_id": 1}}, "msg": "찜하기 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "vendor_not_found", "body": {"message": "vendor_not_found", "data": None}, "msg": "업체를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.11",
            "name": "찜 목록 조회",
            "method": "GET",
            "path": "/api/favorites",
            "request": None,
            "response": "FavoriteListResponse",
            "auth": True,
            "description": "찜 목록 조회 (커플 공유)",
            "query_params": [{"name": "wedding_profile_id", "type": "Integer", "required": False, "default": None, "description": "결혼식 프로필 ID (필터링용)"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "favorites_retrieved", "body": {"message": "favorites_retrieved", "data": {"favorites": []}}, "msg": "찜 목록 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "9.12",
            "name": "찜 삭제",
            "method": "DELETE",
            "path": "/api/favorites/{favorite_id}",
            "request": None,
            "response": "FavoriteDeleteResponse",
            "auth": True,
            "description": "찜 삭제 (커플 공유)",
            "query_params": None,
            "path_params": [{"name": "favorite_id", "type": "Integer", "description": "찜 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "favorite_deleted", "body": {"message": "favorite_deleted", "data": None}, "msg": "찜 삭제 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "favorite_not_found", "body": {"message": "favorite_not_found", "data": None}, "msg": "찜을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 벤더 메시지 API 추가
API_DATA["sections"].append({
    "id": "12",
    "name": "벤더 메시지 & 결제 리마인더",
    "apis": [
        {
            "id": "12.1",
            "name": "벤더 메시지 쓰레드 생성",
            "method": "POST",
            "path": "/api/vendor-threads",
            "request": "VendorThreadCreateRequest",
            "response": "VendorThreadCreateResponse",
            "auth": True,
            "description": "벤더 메시지 쓰레드 생성 (선택적 커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"vendor_id": "integer", "title": "string | null", "is_shared_with_partner": "boolean (기본값: false)"},
            "body_required": ["vendor_id"],
            "body_optional": ["title", "is_shared_with_partner"],
            "status_codes": [
                {"code": 200, "message": "thread_created", "body": {"message": "thread_created", "data": {"thread_id": 1}}, "msg": "쓰레드 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "vendor_not_found", "body": {"message": "vendor_not_found", "data": None}, "msg": "벤더를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.2",
            "name": "벤더 메시지 쓰레드 목록 조회",
            "method": "GET",
            "path": "/api/vendor-threads",
            "request": None,
            "response": "VendorThreadListResponse",
            "auth": True,
            "description": "벤더 메시지 쓰레드 목록 조회 (사용자 또는 벤더, 선택적 커플 공유)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "threads_retrieved", "body": {"message": "threads_retrieved", "data": {"threads": []}}, "msg": "쓰레드 목록 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.3",
            "name": "벤더 메시지 쓰레드 상세 조회",
            "method": "GET",
            "path": "/api/vendor-threads/{thread_id}",
            "request": None,
            "response": "VendorThreadDetailResponse",
            "auth": True,
            "description": "벤더 메시지 쓰레드 상세 조회 (사용자 또는 벤더, 선택적 커플 공유)",
            "query_params": None,
            "path_params": [{"name": "thread_id", "type": "Integer", "description": "쓰레드 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "thread_retrieved", "body": {"message": "thread_retrieved", "data": {"thread": {}, "messages": []}}, "msg": "쓰레드 상세 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "thread_not_found", "body": {"message": "thread_not_found", "data": None}, "msg": "쓰레드를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.4",
            "name": "벤더 메시지 쓰레드 수정",
            "method": "PUT",
            "path": "/api/vendor-threads/{thread_id}",
            "request": "VendorThreadUpdateRequest",
            "response": "VendorThreadUpdateResponse",
            "auth": True,
            "description": "벤더 메시지 쓰레드 수정",
            "query_params": None,
            "path_params": [{"name": "thread_id", "type": "Integer", "description": "쓰레드 ID"}],
            "headers": None,
            "body": {"title": "string | null"},
            "body_required": [],
            "body_optional": ["title"],
            "status_codes": [
                {"code": 200, "message": "thread_updated", "body": {"message": "thread_updated", "data": {"thread_id": 1}}, "msg": "쓰레드 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "thread_not_found", "body": {"message": "thread_not_found", "data": None}, "msg": "쓰레드를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.5",
            "name": "메시지 전송",
            "method": "POST",
            "path": "/api/vendor-messages",
            "request": "VendorMessageCreateRequest",
            "response": "VendorMessageCreateResponse",
            "auth": True,
            "description": "메시지 전송 (사용자 또는 벤더)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"thread_id": "integer", "content": "string"},
            "body_required": ["thread_id", "content"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "message_sent", "body": {"message": "message_sent", "data": {"message_id": 1}}, "msg": "메시지 전송 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "thread_not_found", "body": {"message": "thread_not_found", "data": None}, "msg": "쓰레드를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.6",
            "name": "계약 정보 생성",
            "method": "POST",
            "path": "/api/vendor-contracts",
            "request": "VendorContractCreateRequest",
            "response": "VendorContractCreateResponse",
            "auth": True,
            "description": "계약 정보 생성",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"thread_id": "integer", "contract_amount": "float", "contract_date": "string (YYYY-MM-DD)", "notes": "string | null"},
            "body_required": ["thread_id", "contract_amount", "contract_date"],
            "body_optional": ["notes"],
            "status_codes": [
                {"code": 200, "message": "contract_created", "body": {"message": "contract_created", "data": {"contract_id": 1}}, "msg": "계약 정보 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "thread_not_found", "body": {"message": "thread_not_found", "data": None}, "msg": "쓰레드를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.7",
            "name": "계약 정보 수정",
            "method": "PUT",
            "path": "/api/vendor-contracts/{contract_id}",
            "request": "VendorContractUpdateRequest",
            "response": "VendorContractUpdateResponse",
            "auth": True,
            "description": "계약 정보 수정",
            "query_params": None,
            "path_params": [{"name": "contract_id", "type": "Integer", "description": "계약 ID"}],
            "headers": None,
            "body": {"contract_amount": "float | null", "contract_date": "string (YYYY-MM-DD) | null", "notes": "string | null"},
            "body_required": [],
            "body_optional": ["contract_amount", "contract_date", "notes"],
            "status_codes": [
                {"code": 200, "message": "contract_updated", "body": {"message": "contract_updated", "data": {"contract_id": 1}}, "msg": "계약 정보 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "contract_not_found", "body": {"message": "contract_not_found", "data": None}, "msg": "계약을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.8",
            "name": "문서 업로드",
            "method": "POST",
            "path": "/api/vendor-documents",
            "request": "VendorDocumentCreateRequest",
            "response": "VendorDocumentCreateResponse",
            "auth": True,
            "description": "문서 업로드 (견적서/계약서)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"thread_id": "integer", "document_type": "string", "document_url": "string", "notes": "string | null"},
            "body_required": ["thread_id", "document_type", "document_url"],
            "body_optional": ["notes"],
            "status_codes": [
                {"code": 200, "message": "document_created", "body": {"message": "document_created", "data": {"document_id": 1}}, "msg": "문서 업로드 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "thread_not_found", "body": {"message": "thread_not_found", "data": None}, "msg": "쓰레드를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.9",
            "name": "문서 상태 수정",
            "method": "PUT",
            "path": "/api/vendor-documents/{document_id}",
            "request": "VendorDocumentUpdateRequest",
            "response": "VendorDocumentUpdateResponse",
            "auth": True,
            "description": "문서 상태 수정 (서명 등)",
            "query_params": None,
            "path_params": [{"name": "document_id", "type": "Integer", "description": "문서 ID"}],
            "headers": None,
            "body": {"status": "string | null", "notes": "string | null"},
            "body_required": [],
            "body_optional": ["status", "notes"],
            "status_codes": [
                {"code": 200, "message": "document_updated", "body": {"message": "document_updated", "data": {"document_id": 1}}, "msg": "문서 상태 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "document_not_found", "body": {"message": "document_not_found", "data": None}, "msg": "문서를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.10",
            "name": "결제 일정 생성",
            "method": "POST",
            "path": "/api/vendor-payment-schedules",
            "request": "VendorPaymentScheduleCreateRequest",
            "response": "VendorPaymentScheduleCreateResponse",
            "auth": True,
            "description": "결제 일정 생성",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"thread_id": "integer", "payment_date": "string (YYYY-MM-DD)", "amount": "float", "payment_type": "string", "notes": "string | null"},
            "body_required": ["thread_id", "payment_date", "amount", "payment_type"],
            "body_optional": ["notes"],
            "status_codes": [
                {"code": 200, "message": "payment_schedule_created", "body": {"message": "payment_schedule_created", "data": {"schedule_id": 1}}, "msg": "결제 일정 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "thread_not_found", "body": {"message": "thread_not_found", "data": None}, "msg": "쓰레드를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.11",
            "name": "결제 일정 수정",
            "method": "PUT",
            "path": "/api/vendor-payment-schedules/{schedule_id}",
            "request": "VendorPaymentScheduleUpdateRequest",
            "response": "VendorPaymentScheduleUpdateResponse",
            "auth": True,
            "description": "결제 일정 수정",
            "query_params": None,
            "path_params": [{"name": "schedule_id", "type": "Integer", "description": "결제 일정 ID"}],
            "headers": None,
            "body": {"payment_date": "string (YYYY-MM-DD) | null", "amount": "float | null", "payment_type": "string | null", "notes": "string | null"},
            "body_required": [],
            "body_optional": ["payment_date", "amount", "payment_type", "notes"],
            "status_codes": [
                {"code": 200, "message": "payment_schedule_updated", "body": {"message": "payment_schedule_updated", "data": {"schedule_id": 1}}, "msg": "결제 일정 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "schedule_not_found", "body": {"message": "schedule_not_found", "data": None}, "msg": "결제 일정을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.12",
            "name": "결제 리마인더 조회",
            "method": "GET",
            "path": "/api/vendor-payment-reminders",
            "request": None,
            "response": "PaymentReminderResponse",
            "auth": True,
            "description": "결제 리마인더 조회",
            "query_params": [{"name": "days", "type": "Integer", "required": False, "default": "7", "description": "N일 이내 결제 예정 조회"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "payment_reminders_retrieved", "body": {"message": "payment_reminders_retrieved", "data": {"reminders": []}}, "msg": "결제 리마인더 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "12.13",
            "name": "벤더 비교",
            "method": "POST",
            "path": "/api/vendors/compare",
            "request": "VendorCompareRequest",
            "response": "VendorCompareResponse",
            "auth": True,
            "description": "벤더 비교",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {"vendor_ids": "array[integer]"},
            "body_required": ["vendor_ids"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "vendors_compared", "body": {"message": "vendors_compared", "data": {"comparison": {}}}, "msg": "벤더 비교 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 400, "message": "invalid_request", "body": {"message": "invalid_request", "data": None}, "msg": "유효하지 않은 요청입니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 디지털 초대장 + 축의금 결제 시스템 API 추가
API_DATA["sections"].append({
    "id": "13",
    "name": "디지털 초대장 + 축의금 결제 시스템",
    "apis": [
        {
            "id": "13.1",
            "name": "디지털 초대장 생성",
            "method": "POST",
            "path": "/api/digital-invitations",
            "request": "DigitalInvitationCreateReq",
            "response": "DigitalInvitationCreateResponse",
            "auth": True,
            "description": "디지털 초대장 생성 (청첩장 디자인과 연결)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "invitation_design_id": "integer",
                "title": "string",
                "wedding_date": "string (YYYY-MM-DD)",
                "wedding_time": "string | null",
                "wedding_venue": "string",
                "wedding_address": "string | null",
                "groom_name": "string",
                "bride_name": "string",
                "groom_parents": "string | null",
                "bride_parents": "string | null",
                "contact_info": "object | null",
                "bank_info": "object | null",
                "theme": "string (ELEGANT|MODERN|RUSTIC|MINIMALIST|LUXURY)",
                "main_image_url": "string | null",
                "gallery_image_urls": "array[string] | null",
                "greeting_message": "string | null",
                "map_url": "string | null",
                "parking_info": "string | null",
                "allow_payment": "boolean (기본값: true)",
                "allow_rsvp": "boolean (기본값: true)",
                "allow_guest_message": "boolean (기본값: true)"
            },
            "body_required": ["invitation_design_id", "title", "wedding_date", "wedding_venue", "groom_name", "bride_name"],
            "body_optional": ["wedding_time", "wedding_address", "groom_parents", "bride_parents", "contact_info", "bank_info", "theme", "main_image_url", "gallery_image_urls", "greeting_message", "map_url", "parking_info", "allow_payment", "allow_rsvp", "allow_guest_message"],
            "status_codes": [
                {"code": 201, "message": "digital_invitation_created", "body": {"message": "digital_invitation_created", "data": {"id": 1, "invitation_url": "abc123xyz", "design_qr_code_url": "https://..."}}, "msg": "디지털 초대장 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "invitation_design_not_found", "body": {"message": "invitation_design_not_found", "data": None}, "msg": "청첩장 디자인을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.2",
            "name": "내 디지털 초대장 목록 조회",
            "method": "GET",
            "path": "/api/digital-invitations/my",
            "request": None,
            "response": "DigitalInvitationListResponse",
            "auth": True,
            "description": "사용자/커플의 디지털 초대장 목록 조회",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "digital_invitations_retrieved", "body": {"message": "digital_invitations_retrieved", "data": {"invitations": []}}, "msg": "디지털 초대장 목록 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.3",
            "name": "디지털 초대장 조회 (공개)",
            "method": "GET",
            "path": "/api/digital-invitations/public/{invitation_url}",
            "request": None,
            "response": "DigitalInvitationDetailResponse",
            "auth": False,
            "description": "공개 디지털 초대장 조회 (하객용, 조회수 자동 증가)",
            "query_params": None,
            "path_params": [{"name": "invitation_url", "type": "String", "description": "초대장 고유 URL"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "public_digital_invitation_retrieved", "body": {"message": "public_digital_invitation_retrieved", "data": {"invitation": {}}}, "msg": "디지털 초대장 조회 성공"},
                {"code": 404, "message": "digital_invitation_not_found", "body": {"message": "digital_invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.4",
            "name": "디지털 초대장 수정",
            "method": "PUT",
            "path": "/api/digital-invitations/{invitation_id}",
            "request": "DigitalInvitationUpdateReq",
            "response": "DigitalInvitationUpdateResponse",
            "auth": True,
            "description": "디지털 초대장 수정 (소유자만)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": {
                "title": "string | null",
                "wedding_date": "string (YYYY-MM-DD) | null",
                "wedding_time": "string | null",
                "wedding_venue": "string | null",
                "wedding_address": "string | null",
                "groom_name": "string | null",
                "bride_name": "string | null",
                "groom_parents": "string | null",
                "bride_parents": "string | null",
                "contact_info": "object | null",
                "bank_info": "object | null",
                "theme": "string | null",
                "main_image_url": "string | null",
                "gallery_image_urls": "array[string] | null",
                "greeting_message": "string | null",
                "map_url": "string | null",
                "parking_info": "string | null",
                "allow_payment": "boolean | null",
                "allow_rsvp": "boolean | null",
                "allow_guest_message": "boolean | null"
            },
            "body_required": [],
            "body_optional": ["title", "wedding_date", "wedding_time", "wedding_venue", "wedding_address", "groom_name", "bride_name", "groom_parents", "bride_parents", "contact_info", "bank_info", "theme", "main_image_url", "gallery_image_urls", "greeting_message", "map_url", "parking_info", "allow_payment", "allow_rsvp", "allow_guest_message"],
            "status_codes": [
                {"code": 200, "message": "digital_invitation_updated", "body": {"message": "digital_invitation_updated", "data": {"id": 1}}, "msg": "디지털 초대장 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "digital_invitation_not_found", "body": {"message": "digital_invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.5",
            "name": "디지털 초대장 삭제",
            "method": "DELETE",
            "path": "/api/digital-invitations/{invitation_id}",
            "request": None,
            "response": "BaseResponse",
            "auth": True,
            "description": "디지털 초대장 삭제 (소유자만)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "digital_invitation_deleted", "body": {"message": "digital_invitation_deleted", "data": None}, "msg": "디지털 초대장 삭제 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "digital_invitation_not_found", "body": {"message": "digital_invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.6",
            "name": "RSVP 응답 생성 (공개)",
            "method": "POST",
            "path": "/api/digital-invitations/{invitation_id}/rsvps",
            "request": "RSVPCreateReq",
            "response": "RSVPCreateResponse",
            "auth": False,
            "description": "RSVP 응답 생성 (하객용, 공개 접근)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": {
                "invitation_id": "integer",
                "guest_name": "string",
                "guest_phone": "string | null",
                "guest_email": "string | null",
                "status": "string (ATTENDING|NOT_ATTENDING|MAYBE|PENDING)",
                "plus_one": "boolean (기본값: false)",
                "plus_one_name": "string | null",
                "dietary_restrictions": "string | null",
                "special_requests": "string | null"
            },
            "body_required": ["invitation_id", "guest_name", "status"],
            "body_optional": ["guest_phone", "guest_email", "plus_one", "plus_one_name", "dietary_restrictions", "special_requests"],
            "status_codes": [
                {"code": 201, "message": "rsvp_created", "body": {"message": "rsvp_created", "data": {"id": 1}}, "msg": "RSVP 응답 생성 성공"},
                {"code": 404, "message": "digital_invitation_not_found", "body": {"message": "digital_invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.7",
            "name": "RSVP 목록 조회",
            "method": "GET",
            "path": "/api/digital-invitations/{invitation_id}/rsvps",
            "request": None,
            "response": "RSVPListResponse",
            "auth": True,
            "description": "RSVP 목록 조회 (초대장 소유자만)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": {
                "guest_name": "string | null",
                "status": "string (ATTENDING|NOT_ATTENDING|MAYBE) | null",
                "attending_guests": "integer | null",
                "dietary_restrictions": "string | null",
                "contact_phone": "string | null"
            },
            "body_required": [],
            "body_optional": ["guest_name", "status", "attending_guests", "dietary_restrictions", "contact_phone"],
            "status_codes": [
                {"code": 200, "message": "rsvp_updated", "body": {"message": "rsvp_updated", "data": {"id": 1}}, "msg": "RSVP 응답 수정 성공"},
                {"code": 404, "message": "rsvp_not_found", "body": {"message": "rsvp_not_found", "data": None}, "msg": "RSVP를 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.8",
            "name": "축의금 결제 생성 (공개)",
            "method": "POST",
            "path": "/api/digital-invitations/{invitation_id}/payments",
            "request": "PaymentCreateReq",
            "response": "PaymentCreateResponse",
            "auth": False,
            "description": "축의금 결제 생성 (하객용, 공개 접근, 간편 결제 지원)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": {
                "invitation_id": "integer",
                "payer_name": "string",
                "payer_phone": "string | null",
                "payer_message": "string | null",
                "amount": "float",
                "payment_method": "string (BANK_TRANSFER|KAKAO_PAY|TOSS|CREDIT_CARD)"
            },
            "body_required": ["invitation_id", "payer_name", "amount", "payment_method"],
            "body_optional": ["payer_phone", "payer_message"],
            "status_codes": [
                {"code": 200, "message": "payment_created", "body": {"message": "payment_created", "data": {"id": 1, "amount": 50000.0, "payment_method": "KAKAO_PAY", "payment_status": "PENDING"}}, "msg": "축의금 결제 생성 성공"},
                {"code": 404, "message": "invitation_not_found", "body": {"message": "invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.9",
            "name": "결제 목록 조회",
            "method": "GET",
            "path": "/api/digital-invitations/{invitation_id}/payments",
            "request": None,
            "response": "PaymentListResponse",
            "auth": True,
            "description": "결제 목록 조회 (초대장 소유자만)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "payments_retrieved", "body": {"message": "payments_retrieved", "data": {"payments": []}}, "msg": "결제 목록 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "invitation_not_found", "body": {"message": "invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.10",
            "name": "하객 메시지 생성 (공개)",
            "method": "POST",
            "path": "/api/digital-invitations/{invitation_id}/guest-messages",
            "request": "GuestMessageCreateReq",
            "response": "GuestMessageCreateResponse",
            "auth": False,
            "description": "하객 메시지 및 사진 생성 (하객용, 공개 접근)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": {
                "invitation_id": "integer",
                "guest_name": "string",
                "guest_phone": "string | null",
                "message": "string | null",
                "image_url": "string | null"
            },
            "body_required": ["invitation_id", "guest_name"],
            "body_optional": ["guest_phone", "message", "image_url"],
            "status_codes": [
                {"code": 200, "message": "guest_message_created", "body": {"message": "guest_message_created", "data": {"id": 1, "guest_name": "테스트 하객", "message": "결혼 축하합니다!", "image_url": None}}, "msg": "하객 메시지 생성 성공"},
                {"code": 404, "message": "invitation_not_found", "body": {"message": "invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.11",
            "name": "하객 메시지 목록 조회",
            "method": "GET",
            "path": "/api/digital-invitations/{invitation_id}/guest-messages",
            "request": None,
            "response": "GuestMessageListResponse",
            "auth": False,
            "description": "하객 메시지 목록 조회 (공개)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "guest_messages_retrieved", "body": {"message": "guest_messages_retrieved", "data": {"messages": []}}, "msg": "하객 메시지 목록 조회 성공"},
                {"code": 404, "message": "invitation_not_found", "body": {"message": "invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "13.12",
            "name": "디지털 초대장 통계 조회",
            "method": "GET",
            "path": "/api/digital-invitations/{invitation_id}/statistics",
            "request": None,
            "response": "InvitationStatisticsResponse",
            "auth": True,
            "description": "디지털 초대장 통계 조회 (소유자용: 조회수, RSVP 현황, 결제 현황, 축하 메시지 수)",
            "query_params": None,
            "path_params": [{"name": "invitation_id", "type": "Integer", "description": "초대장 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "invitation_statistics_retrieved", "body": {"message": "invitation_statistics_retrieved", "data": {"view_count": 100, "rsvp_stats": {"total_responses": 50, "attending_guests_total": 60, "not_attending_count": 5, "maybe_count": 3, "no_response_count": 0}, "payment_stats": {"total_payments_count": 30, "total_amount_collected": 5000000}, "guest_message_count": 25}}, "msg": "통계 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "digital_invitation_not_found", "body": {"message": "digital_invitation_not_found", "data": None}, "msg": "초대장을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 청첩장 디자인 서비스 API 추가 (섹션 14)
API_DATA["sections"].append({
    "id": "14",
    "name": "청첩장 디자인 서비스 (Invitation Design)",
    "apis": [
        {
            "id": "14.1",
            "name": "템플릿 목록 조회",
            "method": "GET",
            "path": "/api/invitation-templates",
            "request": None,
            "response": "TemplatesResponse",
            "auth": False,
            "description": "청첩장 템플릿 목록을 조회합니다. 스타일 필터링 지원.",
            "query_params": [{"name": "style", "type": "String", "required": False, "default": None, "description": "템플릿 스타일 필터 (CLASSIC, MODERN, VINTAGE, MINIMAL, LUXURY, NATURE, ROMANTIC)"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "templates_retrieved", "body": {"message": "templates_retrieved", "data": {"templates": []}}, "msg": "템플릿 목록 조회 성공"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.2",
            "name": "템플릿 상세 조회",
            "method": "GET",
            "path": "/api/invitation-templates/{template_id}",
            "request": None,
            "response": "TemplateResponse",
            "auth": False,
            "description": "특정 템플릿의 상세 정보를 조회합니다.",
            "query_params": None,
            "path_params": [{"name": "template_id", "type": "Integer", "description": "템플릿 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "template_retrieved", "body": {"message": "template_retrieved", "data": {"id": 1, "name": "템플릿명", "style": "CLASSIC", "preview_image_url": "https://...", "template_data": {}}}, "msg": "템플릿 조회 성공"},
                {"code": 404, "message": "template_not_found", "body": {"message": "template_not_found", "data": None}, "msg": "템플릿을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.3",
            "name": "디자인 생성",
            "method": "POST",
            "path": "/api/invitation-designs",
            "request": "InvitationDesignCreateReq",
            "response": "DesignCreateResponse",
            "auth": True,
            "description": "새로운 청첩장 디자인을 생성합니다. 템플릿 선택 및 QR 코드 생성 지원.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "template_id": "integer | null",
                "design_data": "object",
                "qr_code_data": "object | null"
            },
            "body_required": ["design_data"],
            "body_optional": ["template_id", "qr_code_data"],
            "status_codes": [
                {"code": 201, "message": "design_created", "body": {"message": "design_created", "data": {"id": 1, "template_id": 1, "design_data": {}, "qr_code_url": "https://...", "status": "DRAFT"}}, "msg": "디자인 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "template_not_found", "body": {"message": "template_not_found", "data": None}, "msg": "템플릿을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.4",
            "name": "디자인 목록 조회",
            "method": "GET",
            "path": "/api/invitation-designs",
            "request": None,
            "response": "DesignsResponse",
            "auth": True,
            "description": "현재 사용자 또는 커플이 생성한 디자인 목록을 조회합니다.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "designs_retrieved", "body": {"message": "designs_retrieved", "data": {"designs": []}}, "msg": "디자인 목록 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.5",
            "name": "디자인 상세 조회",
            "method": "GET",
            "path": "/api/invitation-designs/{design_id}",
            "request": None,
            "response": "DesignResponse",
            "auth": True,
            "description": "특정 디자인의 상세 정보를 조회합니다. 본인 또는 파트너의 디자인만 조회 가능.",
            "query_params": None,
            "path_params": [{"name": "design_id", "type": "Integer", "description": "디자인 ID"}],
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "design_retrieved", "body": {"message": "design_retrieved", "data": {"id": 1, "template_id": 1, "design_data": {}, "qr_code_url": "https://...", "qr_code_data": {}, "preview_image_url": "https://...", "pdf_url": "https://...", "status": "DRAFT"}}, "msg": "디자인 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "design_not_found", "body": {"message": "design_not_found", "data": None}, "msg": "디자인을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.6",
            "name": "디자인 수정",
            "method": "PUT",
            "path": "/api/invitation-designs/{design_id}",
            "request": "InvitationDesignUpdateReq",
            "response": "DesignUpdateResponse",
            "auth": True,
            "description": "생성된 디자인의 정보를 수정합니다. 디자인 데이터, QR 코드, 상태 변경 지원.",
            "query_params": None,
            "path_params": [{"name": "design_id", "type": "Integer", "description": "디자인 ID"}],
            "headers": None,
            "body": {
                "design_data": "object | null",
                "qr_code_data": "object | null",
                "status": "string | null (DRAFT, COMPLETED)"
            },
            "body_required": [],
            "body_optional": ["design_data", "qr_code_data", "status"],
            "status_codes": [
                {"code": 200, "message": "design_updated", "body": {"message": "design_updated", "data": {"id": 1, "design_data": {}, "qr_code_url": "https://...", "status": "COMPLETED"}}, "msg": "디자인 수정 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 403, "message": "forbidden", "body": {"message": "forbidden", "data": None}, "msg": "권한 없음"},
                {"code": 404, "message": "design_not_found", "body": {"message": "design_not_found", "data": None}, "msg": "디자인을 찾을 수 없습니다"},
                {"code": 400, "message": "invalid_status", "body": {"message": "invalid_status", "data": None}, "msg": "유효하지 않은 상태입니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.7",
            "name": "AI 문구 추천",
            "method": "POST",
            "path": "/api/invitation-text-recommend",
            "request": "InvitationTextRecommendReq",
            "response": "TextRecommendResponse",
            "auth": False,
            "description": "AI를 활용하여 청첩장 문구를 추천합니다. 신랑/신부 이름, 예식 정보, 스타일을 기반으로 맞춤 문구 생성.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "groom_name": "string",
                "bride_name": "string",
                "wedding_date": "string (YYYY-MM-DD)",
                "wedding_time": "string | null (HH:MM)",
                "wedding_location": "string | null",
                "style": "string | null (CLASSIC, MODERN, VINTAGE 등)",
                "additional_info": "string | null"
            },
            "body_required": ["groom_name", "bride_name", "wedding_date"],
            "body_optional": ["wedding_time", "wedding_location", "style", "additional_info"],
            "status_codes": [
                {"code": 200, "message": "text_recommended", "body": {"message": "text_recommended", "data": {"recommended_text": "추천 문구..."}}, "msg": "문구 추천 성공"},
                {"code": 400, "message": "invalid_request", "body": {"message": "invalid_request", "data": None}, "msg": "잘못된 요청"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.8",
            "name": "QR 코드 생성",
            "method": "POST",
            "path": "/api/invitation-qr-code",
            "request": "InvitationQRCodeGenerateReq",
            "response": "QRCodeGenerateResponse",
            "auth": False,
            "description": "디지털 초대장, 축의금 결제, RSVP 링크를 포함한 QR 코드를 생성합니다.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "digital_invitation_url": "string | null",
                "payment_url": "string | null",
                "rsvp_url": "string | null"
            },
            "body_required": [],
            "body_optional": ["digital_invitation_url", "payment_url", "rsvp_url"],
            "status_codes": [
                {"code": 200, "message": "qr_code_generated", "body": {"message": "qr_code_generated", "data": {"qr_code_url": "https://...", "qr_code_data": {}}}, "msg": "QR 코드 생성 성공"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.9",
            "name": "PDF 생성 및 다운로드",
            "method": "POST",
            "path": "/api/invitation-pdf",
            "request": "InvitationPDFGenerateReq",
            "response": "PDFStreamResponse",
            "auth": True,
            "description": "디자인을 기반으로 청첩장 PDF를 생성하고 다운로드합니다. QR 코드 포함, 용지 크기 및 DPI 설정 지원.",
            "query_params": None,
            "path_params": None,
            "headers": {"Content-Type": "application/pdf"},
            "body": {
                "design_id": "integer",
                "paper_size": "string (기본값: A5)",
                "dpi": "integer (기본값: 300)"
            },
            "body_required": ["design_id"],
            "body_optional": ["paper_size", "dpi"],
            "status_codes": [
                {"code": 200, "message": "pdf_generated", "body": "PDF 파일 스트림", "msg": "PDF 생성 및 다운로드 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "design_not_found", "body": {"message": "design_not_found", "data": None}, "msg": "디자인을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.10",
            "name": "주문 생성",
            "method": "POST",
            "path": "/api/invitation-orders",
            "request": "InvitationOrderCreateReq",
            "response": "OrderCreateResponse",
            "auth": True,
            "description": "완성된 디자인을 기반으로 실물 청첩장 주문을 생성합니다. 수량, 용지 타입, 배송 정보 입력.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "design_id": "integer",
                "quantity": "integer",
                "paper_type": "string | null",
                "paper_size": "string (기본값: A5)",
                "shipping_address": "string",
                "shipping_phone": "string",
                "shipping_name": "string"
            },
            "body_required": ["design_id", "quantity", "shipping_address", "shipping_phone", "shipping_name"],
            "body_optional": ["paper_type", "paper_size"],
            "status_codes": [
                {"code": 201, "message": "order_created", "body": {"message": "order_created", "data": {"id": 1, "design_id": 1, "quantity": 100, "order_status": "PENDING"}}, "msg": "주문 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 404, "message": "design_not_found", "body": {"message": "design_not_found", "data": None}, "msg": "디자인을 찾을 수 없습니다"},
                {"code": 400, "message": "design_not_completed", "body": {"message": "design_not_completed", "data": None}, "msg": "디자인이 완성되지 않았습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "14.11",
            "name": "주문 목록 조회",
            "method": "GET",
            "path": "/api/invitation-orders",
            "request": None,
            "response": "OrdersResponse",
            "auth": True,
            "description": "현재 사용자의 청첩장 주문 목록을 조회합니다.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "orders_retrieved", "body": {"message": "orders_retrieved", "data": {"orders": []}}, "msg": "주문 목록 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# 커플 API 추가
API_DATA["sections"].append({
    "id": "11",
    "name": "커플 (Couple)",
    "apis": [
        {
            "id": "11.1",
            "name": "자신의 커플 키 조회",
            "method": "GET",
            "path": "/api/couple/my-key",
            "request": None,
            "response": "CoupleKeyResponse",
            "auth": True,
            "description": "자신의 커플 키를 조회합니다. 파트너와 연결하기 위해 사용됩니다.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "couple_key_retrieved", "body": {"message": "couple_key_retrieved", "data": {"couple_key": "ABC123", "gender": "BRIDE", "is_connected": False}}, "msg": "커플 키 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "11.2",
            "name": "커플 연결",
            "method": "POST",
            "path": "/api/couple/connect",
            "request": "CoupleConnectReq",
            "response": "CoupleConnectResponse",
            "auth": True,
            "description": "파트너의 커플 키를 입력하여 커플을 연결합니다. 양방향 매칭이 지원됩니다.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "partner_couple_key": "string"
            },
            "body_required": ["partner_couple_key"],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "couple_connected", "body": {"message": "couple_connected", "data": {"couple_id": 1, "partner_id": 2, "partner_nickname": "파트너"}}, "msg": "커플 연결 성공"},
                {"code": 400, "message": "invalid_couple_key", "body": {"message": "invalid_couple_key", "data": None}, "msg": "유효하지 않은 커플 키입니다"},
                {"code": 400, "message": "cannot_connect_to_self", "body": {"message": "cannot_connect_to_self", "data": None}, "msg": "자기 자신과는 연결할 수 없습니다"},
                {"code": 409, "message": "already_connected", "body": {"message": "already_connected", "data": None}, "msg": "이미 연결된 커플입니다"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "11.3",
            "name": "커플 정보 조회",
            "method": "GET",
            "path": "/api/couple/info",
            "request": None,
            "response": "CoupleInfoResponse",
            "auth": True,
            "description": "현재 사용자의 커플 연결 상태 및 정보를 조회합니다.",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "couple_info_retrieved", "body": {"message": "couple_info_retrieved", "data": {"is_connected": True, "couple_id": 1, "partner_id": 2, "partner_nickname": "파트너"}}, "msg": "커플 정보 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# Vector DB API 추가
API_DATA["sections"].append({
    "id": "10",
    "name": "Vector DB",
    "apis": [
        {
            "id": "10.1",
            "name": "게시글 벡터 검색",
            "method": "GET",
            "path": "/api/vector/posts/search",
            "request": None,
            "response": "VectorSearchResponse",
            "auth": True,
            "description": "게시글 벡터 검색 (Vector DB 기반)",
            "query_params": [
                {"name": "query", "type": "String", "required": True, "default": None, "description": "검색 쿼리"},
                {"name": "k", "type": "Integer", "required": False, "default": "5", "description": "반환할 결과 개수 (1-20)"},
                {"name": "board_type", "type": "String", "required": False, "default": None, "description": "게시판 타입 필터"}
            ],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "posts_searched", "body": {"message": "posts_searched", "data": {"query": "...", "results": [], "total": 0}}, "msg": "검색 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "10.2",
            "name": "게시글 벡터 통계",
            "method": "GET",
            "path": "/api/vector/posts/stats",
            "request": None,
            "response": "VectorStatsResponse",
            "auth": False,
            "description": "게시판 Vector DB 통계",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "vector_stats_retrieved", "body": {"message": "vector_stats_retrieved", "data": {"total_documents": 100, "collection_name": "posts"}}, "msg": "벡터 통계 조회 성공"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "10.3",
            "name": "게시글 일괄 벡터화",
            "method": "POST",
            "path": "/api/vector/posts/batch-vectorize",
            "request": None,
            "response": "BatchVectorizeResponse",
            "auth": True,
            "description": "기존 게시글들을 일괄 벡터화 (관리자용)",
            "query_params": [{"name": "limit", "type": "Integer", "required": False, "default": "100", "description": "처리할 최대 게시글 수 (1-1000)"}],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "posts_vectorized", "body": {"message": "posts_vectorized", "data": {"vectorized_count": 50, "limit": 100}}, "msg": "일괄 벡터화 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "10.4",
            "name": "사용자 메모리 검색",
            "method": "GET",
            "path": "/api/vector/user/memory",
            "request": None,
            "response": "UserMemorySearchResponse",
            "auth": True,
            "description": "사용자 메모리 검색",
            "query_params": [
                {"name": "query", "type": "String", "required": True, "default": None, "description": "검색 쿼리"},
                {"name": "k", "type": "Integer", "required": False, "default": "5", "description": "반환할 결과 개수 (1-20)"},
                {"name": "preference_type", "type": "String", "required": False, "default": None, "description": "선호도 타입 필터"}
            ],
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "user_memory_retrieved", "body": {"message": "user_memory_retrieved", "data": {"query": "...", "results": [], "total": 0}}, "msg": "메모리 검색 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "10.5",
            "name": "사용자 프로필 요약",
            "method": "GET",
            "path": "/api/vector/user/profile",
            "request": None,
            "response": "UserProfileSummaryResponse",
            "auth": True,
            "description": "사용자 프로필 요약 (예산 스타일, 선호 컨셉, 일정 패턴 등)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "user_profile_retrieved", "body": {"message": "user_profile_retrieved", "data": {"profile": {}, "stats": {}}}, "msg": "프로필 요약 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        },
        {
            "id": "10.6",
            "name": "사용자 메모리 통계",
            "method": "GET",
            "path": "/api/vector/user/stats",
            "request": None,
            "response": "UserMemoryStatsResponse",
            "auth": True,
            "description": "사용자 메모리 통계",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": None,
            "body_required": [],
            "body_optional": [],
            "status_codes": [
                {"code": 200, "message": "user_memory_stats_retrieved", "body": {"message": "user_memory_stats_retrieved", "data": {"stats": {}}}, "msg": "메모리 통계 조회 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

def escape_html(text):
    """HTML 특수문자 이스케이프"""
    if text is None:
        return ""
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def json_to_html(obj, indent=0):
    """JSON 객체를 HTML 형식으로 변환"""
    if isinstance(obj, dict):
        items = []
        for key, value in obj.items():
            items.append(f'"{escape_html(key)}": {json_to_html(value, indent+1)}')
        return "{\n" + ",\n".join("  " * (indent+1) + item for item in items) + "\n" + "  " * indent + "}"
    elif isinstance(obj, list):
        items = [json_to_html(item, indent+1) for item in obj]
        return "[\n" + ",\n".join("  " * (indent+1) + item for item in items) + "\n" + "  " * indent + "]"
    elif isinstance(obj, str):
        return f'"{escape_html(obj)}"'
    elif obj is None:
        return "null"
    else:
        return escape_html(str(obj))

def generate_html(api_data):
    """노션 템플릿 형식에 맞춘 HTML 생성"""
    
    html_parts = []
    html_parts.append('''<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wedding OS API Reference - 노션 템플릿 형식</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #05060a;
      --card: #10121a;
      --soft: #181b25;
      --text: #f7f8fc;
      --muted: #9da6bf;
      --line: rgba(255,255,255,0.08);
      --accent: #8b5cf6;
      --accent-2: #22d3ee;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Pretendard', system-ui, -apple-system, sans-serif;
      background: radial-gradient(circle at top, rgba(34,211,238,0.15), transparent 40%),
                  radial-gradient(circle at 30% 10%, rgba(139,92,246,0.2), transparent 35%),
                  var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 0;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    header {
      text-align: center;
      padding: 48px 0 32px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 48px;
    }
    header h1 {
      font-size: clamp(32px, 4vw, 46px);
      margin-bottom: 16px;
      background: linear-gradient(135deg, var(--accent-2), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    header p {
      color: var(--muted);
      max-width: 640px;
      margin: 0 auto;
    }
    .api-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 48px;
    }
    .api-table th {
      background: var(--soft);
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: var(--accent-2);
      border-bottom: 2px solid var(--line);
    }
    .api-table td {
      padding: 16px;
      border-bottom: 1px solid var(--line);
    }
    .api-table tr:hover {
      background: var(--soft);
    }
    .method-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .method-post { background: rgba(139,92,246,0.2); color: var(--accent); }
    .method-get { background: rgba(34,211,238,0.15); color: var(--accent-2); }
    .method-patch { background: rgba(250,204,21,0.2); color: #facc15; }
    .method-put { background: rgba(16,185,129,0.2); color: var(--success); }
    .method-delete { background: rgba(239,68,68,0.2); color: var(--danger); }
    .auth-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      background: var(--soft);
      color: var(--muted);
    }
    .auth-required { background: rgba(239,68,68,0.2); color: var(--danger); }
    .auth-optional { background: rgba(250,204,21,0.2); color: #facc15; }
    .api-detail {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .api-detail h3 {
      font-size: 20px;
      margin-bottom: 8px;
      color: var(--accent-2);
    }
    .api-detail .api-id {
      color: var(--muted);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .api-detail .description {
      color: var(--muted);
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 28px;
      margin: 48px 0 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--line);
      color: var(--accent-2);
    }
    .param-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: var(--soft);
      border-radius: 8px;
      overflow: hidden;
    }
    .param-table th,
    .param-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--line);
    }
    .param-table th {
      background: var(--card);
      font-weight: 600;
      color: var(--accent-2);
    }
    .code-block {
      background: var(--soft);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
      font-family: 'JetBrains Mono', 'Fira Code', Menlo, monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 16px 0;
      color: #dbeafe;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .status-code-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: var(--soft);
      border-radius: 8px;
      overflow: hidden;
    }
    .status-code-table th,
    .status-code-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--line);
    }
    .status-code-table th {
      background: var(--card);
      font-weight: 600;
      color: var(--accent-2);
    }
    .status-200 { color: var(--success); }
    .status-201 { color: var(--success); }
    .status-400 { color: var(--warning); }
    .status-401 { color: var(--danger); }
    .status-409 { color: var(--warning); }
    .status-422 { color: var(--warning); }
    .status-500 { color: var(--danger); }
    .required { color: var(--danger); font-weight: 600; }
    .optional { color: var(--muted); }
    
    /* 접기/펼치기 스타일 */
    .section-header {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 16px 20px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      margin-bottom: 8px;
      transition: background 0.2s ease;
      user-select: none;
    }
    .section-header:hover {
      background: var(--soft);
    }
    .section-header .toggle-icon {
      margin-right: 12px;
      font-size: 18px;
      color: var(--accent-2);
      transition: transform 0.3s ease;
      display: inline-block;
      width: 20px;
      text-align: center;
    }
    .section-header.expanded .toggle-icon {
      transform: rotate(90deg);
    }
    .section-header h2 {
      margin: 0;
      font-size: 20px;
      color: var(--accent-2);
      flex: 1;
    }
    .section-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      margin-left: 32px;
    }
    .section-content.expanded {
      max-height: 10000px;
    }
    .api-item {
      margin-bottom: 8px;
    }
    .api-item-header {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 12px 16px;
      background: var(--soft);
      border: 1px solid var(--line);
      border-radius: 6px;
      transition: background 0.2s ease;
      user-select: none;
    }
    .api-item-header:hover {
      background: rgba(34, 211, 238, 0.1);
    }
    .api-item-header .toggle-icon {
      margin-right: 10px;
      font-size: 14px;
      color: var(--accent);
      transition: transform 0.3s ease;
      display: inline-block;
      width: 16px;
      text-align: center;
    }
    .api-item-header.expanded .toggle-icon {
      transform: rotate(90deg);
    }
    .api-item-header .api-name {
      flex: 1;
      font-weight: 600;
      color: var(--text);
    }
    .api-item-header .method-badge {
      margin-right: 12px;
    }
    .api-item-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      margin-left: 26px;
      margin-top: 8px;
    }
    .api-item-content.expanded {
      max-height: 50000px;
    }
    
    @media (max-width: 768px) {
      .container { padding: 16px; }
      .api-table { font-size: 14px; }
      .api-table th,
      .api-table td { padding: 12px 8px; }
      .section-content { margin-left: 16px; }
      .api-item-content { margin-left: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Wedding OS API 명세서</h1>
      <p>노션 템플릿 형식에 맞춘 완성도 높은 API 문서</p>
      <p style="margin-top: 8px; font-size: 14px;">Base URL: <code>''' + api_data['base_url'] + '''</code></p>
    </header>
    
    <div class="api-detail" style="margin-bottom: 48px; background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.3);">
      <h2 style="color: var(--accent-2); margin-bottom: 24px;">📋 최근 업데이트 내역</h2>
      <div style="color: var(--muted); line-height: 1.8;">
        <h4 style="color: var(--text); margin-top: 16px; margin-bottom: 12px;">2025년 최신 업데이트</h4>
        <ul style="margin-left: 24px;">
          <li><strong>커플 기능 추가:</strong> 커플 등록 및 연결 기능 (섹션 11) - 파트너와 데이터 공유 지원</li>
          <li><strong>게시판 구조 개편:</strong> 공개 게시판(예비부부 게시판, 플래너 리뷰, 웨딩홀 리뷰)과 비공개 공간(우리만의 공간, 문서 보관함) 분리</li>
          <li><strong>문서 보관함 OCR 기능:</strong> 이미지 문서 업로드 시 자동 텍스트 추출 및 AI 요약/태깅 지원</li>
          <li><strong>제휴 업체 메시지 & 결제 리마인더:</strong> 업체와의 메시지, 계약 관리, 결제 일정 관리 기능 추가 (섹션 12)</li>
          <li><strong>디지털 초대장 + 축의금 결제 시스템:</strong> 모바일 초대장 생성, RSVP, 축의금 결제, 하객 메시지 기능 추가 (섹션 13)</li>
          <li><strong>청첩장 디자인 서비스:</strong> 템플릿 선택, AI 문구 추천, QR 코드 생성, PDF 다운로드, 실물 주문 기능 추가 (섹션 14)</li>
          <li><strong>Vector DB 통합:</strong> 게시글 벡터 검색 및 사용자 메모리 검색 기능 (섹션 10)</li>
          <li><strong>커플 데이터 공유:</strong> 게시판, 캘린더, 예산서, 업체 추천은 자동 공유, 메시지/AI 플래너/음성 비서는 선택적 공유</li>
          <li><strong>접기/펼치기 UI:</strong> Swagger 스타일의 섹션별 접기/펼치기 기능으로 가독성 향상</li>
          <li><strong>인증/인가 가이드:</strong> JWT 토큰 기반 인증 흐름 및 요청 구조 가이드 추가</li>
        </ul>
        <p style="margin-top: 16px; color: var(--muted); font-size: 14px;">※ 모든 API는 섹션별로 정렬되어 있으며, 각 섹션 내 API는 ID 순서대로 정렬되어 있습니다.</p>
      </div>
    </div>
    
    <div class="api-detail" style="margin-bottom: 48px;">
      <h2 style="color: var(--accent-2); margin-bottom: 24px;">🔐 인증/인가 흐름</h2>
      <h3 style="color: var(--text); margin-top: 24px; margin-bottom: 16px;">JWT 토큰 기반 인증</h3>
      <p style="color: var(--muted); margin-bottom: 24px;">Wedding OS API는 JWT(JSON Web Token) 기반의 Bearer 토큰 인증 방식을 사용합니다.</p>
      
      <h4 style="color: var(--text); margin-top: 20px; margin-bottom: 12px;">1. 로그인 및 토큰 발급</h4>
      <div class="code-block">POST /api/auth/login

Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

→ Response:
{
  "message": "login_success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user_id": 1,
    "nickname": "사용자",
    "profile_image_url": "https://..."
  }
}</div>
      
      <h4 style="color: var(--text); margin-top: 20px; margin-bottom: 12px;">2. 토큰 사용 (인증이 필요한 API 호출)</h4>
      <div class="code-block">GET /api/users/profile

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json</div>
      
      <h4 style="color: var(--text); margin-top: 20px; margin-bottom: 12px;">3. 토큰 검증 과정</h4>
      <ul style="color: var(--muted); margin-left: 24px; line-height: 1.8;">
        <li>클라이언트가 Authorization 헤더에 Bearer {token} 형식으로 토큰 전송</li>
        <li>서버가 토큰을 파싱하여 user_id 추출</li>
        <li>토큰 유효성 검증 (만료 여부, 서명 검증)</li>
        <li>사용자가 해당 기능을 사용할 수 있는지 판단</li>
        <li>인증 성공 시 요청 처리, 실패 시 401 Unauthorized 반환</li>
      </ul>
      
      <h4 style="color: var(--text); margin-top: 20px; margin-bottom: 12px;">4. 토큰 만료</h4>
      <ul style="color: var(--muted); margin-left: 24px; line-height: 1.8;">
        <li>토큰 만료 시간: 7일 (ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7)</li>
        <li>만료된 토큰으로 요청 시: 401 Unauthorized 응답</li>
        <li>해결 방법: 다시 로그인하여 새로운 토큰 발급</li>
      </ul>
    </div>
    
    <div class="api-detail" style="margin-bottom: 48px;">
      <h2 style="color: var(--accent-2); margin-bottom: 24px;">📝 요청 구조 가이드</h2>
      <h3 style="color: var(--text); margin-top: 24px; margin-bottom: 16px;">Request Header / Body / Query Parameter 구분 기준</h3>
      <p style="color: var(--muted); margin-bottom: 24px;">API 요청 시 Request Header, Request Body, Query Parameter를 언제 사용해야 하는지 명확한 기준을 제시합니다.</p>
      
      <h4 style="color: var(--text); margin-top: 20px; margin-bottom: 12px;">1. Request Header</h4>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>사용 시기:</strong></p>
      <ul style="color: var(--muted); margin-left: 24px; line-height: 1.8; margin-bottom: 16px;">
        <li>✅ 인증 정보 - Authorization: Bearer {token}</li>
        <li>✅ 콘텐츠 타입 - Content-Type: application/json 또는 multipart/form-data</li>
      </ul>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>예시:</strong></p>
      <div class="code-block">Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json</div>
      
      <h4 style="color: var(--text); margin-top: 20px; margin-bottom: 12px;">2. Request Body</h4>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>✅ 사용 시기 (반드시 Body 사용):</strong></p>
      <ul style="color: var(--muted); margin-left: 24px; line-height: 1.8; margin-bottom: 12px;">
        <li>✅ 등록·생성 작업 (POST) - 새로운 리소스 생성</li>
        <li>✅ 수정·업데이트 작업 (PUT, PATCH) - 기존 리소스 수정</li>
        <li>✅ 복잡한 데이터 구조 - 중첩된 객체, 배열 등</li>
        <li>✅ 파일 업로드 - multipart/form-data 형식</li>
      </ul>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>❌ 사용하지 않는 경우:</strong></p>
      <ul style="color: var(--muted); margin-left: 24px; line-height: 1.8; margin-bottom: 16px;">
        <li>❌ GET 요청 (일반적으로 Body 사용 안 함)</li>
        <li>❌ 검색·필터링 (Query Parameter 사용)</li>
        <li>❌ 단순 조회 (Query Parameter 사용)</li>
      </ul>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>형식:</strong></p>
      <ul style="color: var(--muted); margin-left: 24px; line-height: 1.8; margin-bottom: 12px;">
        <li>application/json - 일반적인 JSON 데이터</li>
        <li>multipart/form-data - 파일 업로드 (이미지, Excel, CSV 등)</li>
      </ul>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>예시:</strong></p>
      <div class="code-block">POST /api/posts

{
  "title": "게시글 제목",
  "content": "게시글 내용",
  "board_type": "couple"
}</div>
      
      <h4 style="color: var(--text); margin-top: 20px; margin-bottom: 12px;">3. Query Parameter</h4>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>✅ 사용 시기 (반드시 Query 사용):</strong></p>
      <ul style="color: var(--muted); margin-left: 24px; line-height: 1.8; margin-bottom: 12px;">
        <li>✅ 검색·필터링 (GET 요청) - 조건에 따른 데이터 조회</li>
        <li>✅ 페이지네이션 - page, limit 등</li>
        <li>✅ 정렬 옵션 - sort, order 등</li>
        <li>✅ 선택적 필터 조건 - 날짜 범위, 카테고리 등</li>
        <li>✅ 단순 조회 - 특정 조건으로 데이터 가져오기</li>
      </ul>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>❌ 사용하지 않는 경우:</strong></p>
      <ul style="color: var(--muted); margin-left: 24px; line-height: 1.8; margin-bottom: 16px;">
        <li>❌ 등록·생성 작업 (Request Body 사용)</li>
        <li>❌ 수정·업데이트 작업 (Request Body 사용)</li>
        <li>❌ 복잡한 중첩 데이터 (Request Body 사용)</li>
      </ul>
      <p style="color: var(--muted); margin-bottom: 12px;"><strong>예시:</strong></p>
      <div class="code-block">GET /api/posts?page=1&limit=10&board_type=couple

GET /api/calendar/todos?start_date=2025-01-01&end_date=2025-12-31&category=todo

GET /api/vendors/recommend?wedding_profile_id=1&vendor_type=IPHONE_SNAP&min_price=100000</div>
      
      <h4 style="color: var(--text); margin-top: 20px; margin-bottom: 12px;">📌 핵심 규칙 요약</h4>
      <table class="param-table" style="margin-top: 16px;">
        <thead>
          <tr>
            <th>작업 유형</th>
            <th>HTTP 메서드</th>
            <th>사용 방법</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>검색·필터링</td>
            <td>GET</td>
            <td>Query Parameter ✅</td>
          </tr>
          <tr>
            <td>목록 조회</td>
            <td>GET</td>
            <td>Query Parameter ✅</td>
          </tr>
          <tr>
            <td>등록·생성</td>
            <td>POST</td>
            <td>Request Body ✅</td>
          </tr>
          <tr>
            <td>수정·업데이트</td>
            <td>PUT, PATCH</td>
            <td>Request Body ✅</td>
          </tr>
          <tr>
            <td>파일 업로드</td>
            <td>POST</td>
            <td>Request Body (multipart/form-data) ✅</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <h2 class="section-title">API 명세서 테이블</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>기능</th>
          <th>HTTP 메서드</th>
          <th>API Path</th>
          <th>Request</th>
          <th>Response</th>
          <th>인증</th>
        </tr>
      </thead>
      <tbody>''')
    
    # API 테이블 행 생성 (섹션 순서대로 정렬)
    sections = sorted(api_data['sections'], key=lambda x: int(x['id']) if x['id'].isdigit() else 999)
    for section in sections:
        # 각 섹션 내 API도 ID 순서대로 정렬 (숫자로 변환하여 정렬)
        def api_sort_key(api):
            try:
                # "9.1" -> (9, 1), "12.10" -> (12, 10)
                parts = api['id'].split('.')
                return (int(parts[0]), int(parts[1]) if len(parts) > 1 else 0)
            except:
                return (999, 999)
        apis = sorted(section['apis'], key=api_sort_key)
        for api in apis:
            method_class = f"method-{api['method'].lower()}"
            auth_class = "auth-required" if api['auth'] else "auth-optional"
            auth_text = "필수" if api['auth'] else "선택"
            
            html_parts.append(f'''
        <tr>
          <td><strong>{api['id']} {api['name']}</strong></td>
          <td><span class="method-badge {method_class}">{api['method']}</span></td>
          <td><code>{api['path']}</code></td>
          <td><code>{api['request']}</code></td>
          <td><code>{api['response']}</code></td>
          <td><span class="auth-badge {auth_class}">{auth_text}</span></td>
        </tr>''')
    
    html_parts.append('''
      </tbody>
    </table>''')
    
    # 각 API 상세 정보 생성 (접기/펼치기 구조)
    html_parts.append('''
    <h2 class="section-title">API 상세 설명</h2>
    <div style="margin-top: 32px;">''')
    
    sections = sorted(api_data['sections'], key=lambda x: int(x['id']) if x['id'].isdigit() else 999)
    for section in sections:
        section_id = f"section-{section['id']}"
        html_parts.append(f'''
    <div class="section-item">
      <div class="section-header" onclick="toggleSection('{section_id}')">
        <span class="toggle-icon">▶</span>
        <h2>{section['id']}. {section['name']} ({len(section['apis'])}개 API)</h2>
      </div>
      <div class="section-content" id="{section_id}">''')
        
        for api in section['apis']:
            api_id = f"api-{api['id'].replace('.', '-')}"
            method_class = f"method-{api['method'].lower()}"
            html_parts.append(f'''
        <div class="api-item">
          <div class="api-item-header" onclick="toggleApi('{api_id}')">
            <span class="toggle-icon">▶</span>
            <span class="method-badge {method_class}">{api['method']}</span>
            <span class="api-name">{api['id']} {api['name']}</span>
            <span class="auth-badge {'auth-required' if api['auth'] else 'auth-optional'}">{'필수' if api['auth'] else '선택'}</span>
          </div>
          <div class="api-item-content" id="{api_id}">
            <div class="api-detail">''')
            
            html_parts.append(f'''
      <h3 id="api-{api['id'].replace('.', '-')}">{api['id']} {api['name']}</h3>
      <div class="api-id">API ID: {api['id']}</div>
      <div class="description">{api.get('description', '')}</div>
      
      <h4 style="margin-top: 24px; margin-bottom: 12px; color: var(--accent-2);">📋 요청 구조</h4>''')
            
            # Query Parameters
            if api.get('query_params'):
                html_parts.append('''
      <h5 style="margin-top: 16px; color: var(--text);">Query Parameters</h5>
      <table class="param-table">
        <thead>
          <tr>
            <th>파라미터</th>
            <th>타입</th>
            <th>필수</th>
            <th>기본값</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>''')
                for param in api['query_params']:
                    required_class = "required" if param.get('required') else "optional"
                    required_text = "필수" if param.get('required') else "선택"
                    html_parts.append(f'''
          <tr>
            <td><code>{param['name']}</code></td>
            <td>{param['type']}</td>
            <td><span class="{required_class}">{required_text}</span></td>
            <td>{param.get('default', '-')}</td>
            <td>{param.get('description', '')}</td>
          </tr>''')
                html_parts.append('''
        </tbody>
      </table>''')
            
            # Path Parameters
            if api.get('path_params'):
                html_parts.append('''
      <h5 style="margin-top: 16px; color: var(--text);">Path Parameters</h5>
      <table class="param-table">
        <thead>
          <tr>
            <th>파라미터</th>
            <th>타입</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>''')
                for param in api['path_params']:
                    html_parts.append(f'''
          <tr>
            <td><code>{param['name']}</code></td>
            <td>{param['type']}</td>
            <td>{param.get('description', '')}</td>
          </tr>''')
                html_parts.append('''
        </tbody>
      </table>''')
            
            # Request Body
            if api.get('body'):
                html_parts.append('''
      <h5 style="margin-top: 16px; color: var(--text);">Request Body</h5>
      <div class="code-block">''')
                html_parts.append(json_to_html(api['body']))
                html_parts.append('''
      </div>
      
      <h6 style="margin-top: 12px; color: var(--text);">필수 필드</h6>
      <ul style="margin-left: 24px; color: var(--muted);">''')
                for field in api.get('body_required', []):
                    field_type = api['body'].get(field, 'string')
                    html_parts.append(f'''
        <li><code>{field}</code>: {field_type} <span class="required">(필수)</span></li>''')
                html_parts.append('''
      </ul>''')
                
                if api.get('body_optional'):
                    html_parts.append('''
      <h6 style="margin-top: 12px; color: var(--text);">선택 필드</h6>
      <ul style="margin-left: 24px; color: var(--muted);">''')
                    for field in api['body_optional']:
                        field_type = api['body'].get(field, 'string')
                        html_parts.append(f'''
        <li><code>{field}</code>: {field_type} <span class="optional">(선택)</span></li>''')
                    html_parts.append('''
      </ul>''')
            
            # Response Status Codes
            if api.get('status_codes'):
                html_parts.append('''
      <h5 style="margin-top: 24px; color: var(--text);">응답 코드별 예시</h5>
      <table class="status-code-table">
        <thead>
          <tr>
            <th>Response Status Code</th>
            <th>Body</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>''')
                for status in api['status_codes']:
                    status_class = f"status-{status['code']}"
                    body_json = json.dumps(status.get('body', {}), ensure_ascii=False, indent=2)
                    html_parts.append(f'''
          <tr>
            <td><span class="{status_class}">{status['code']}</span></td>
            <td><div class="code-block" style="margin: 0; padding: 8px; font-size: 12px;">{escape_html(body_json)}</div></td>
            <td>{status.get('msg', status.get('message', ''))}</td>
          </tr>''')
                html_parts.append('''
        </tbody>
      </table>''')
            
            html_parts.append('''
            </div>
          </div>
        </div>''')
        
        html_parts.append('''
      </div>
    </div>''')
    
    html_parts.append('''
    </div>
    
    <script>
      function toggleSection(sectionId) {
        const content = document.getElementById(sectionId);
        const header = content.previousElementSibling;
        content.classList.toggle('expanded');
        header.classList.toggle('expanded');
      }
      
      function toggleApi(apiId) {
        const content = document.getElementById(apiId);
        const header = content.previousElementSibling;
        content.classList.toggle('expanded');
        header.classList.toggle('expanded');
      }
    </script>
  </div>
</body>
</html>''')
    
    return ''.join(html_parts)

if __name__ == '__main__':
    print("API 데이터 구조 생성 완료")
    print(f"섹션 수: {len(API_DATA['sections'])}")
    print(f"총 API 수: {sum(len(s['apis']) for s in API_DATA['sections'])}")
    print("\nHTML 생성 중...")
    html_content = generate_html(API_DATA)
    with open('api_reference_details.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    print('✅ HTML 파일 생성 완료: api_reference_details.html')
