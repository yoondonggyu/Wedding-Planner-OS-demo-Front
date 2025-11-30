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
                {"name": "board_type", "type": "String", "required": False, "default": "couple", "description": "게시판 타입 (couple, planner, preparation)"}
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
                {"code": 404, "message": "not_found", "body": {"message": "not_found", "data": None}, "msg": "게시글을 찾을 수 없습니다"},
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

# 캘린더 API 추가 (주요 API만)
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
            "description": "예식일 설정 (JWT 토큰에서 user_id 추출)",
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
            "name": "일정 생성",
            "method": "POST",
            "path": "/api/calendar/events",
            "request": "CalendarEventCreateRequest",
            "response": "CalendarEventCreateResponse",
            "auth": True,
            "description": "일정 생성 (JWT 토큰에서 user_id 추출)",
            "query_params": None,
            "path_params": None,
            "headers": None,
            "body": {
                "title": "string",
                "description": "string | null",
                "start_date": "string (YYYY-MM-DD)",
                "end_date": "string (YYYY-MM-DD) | null",
                "start_time": "string (HH:MM) | null",
                "end_time": "string (HH:MM) | null",
                "location": "string | null",
                "category": "string (기본값: 'general')",
                "priority": "string (기본값: 'medium')",
                "assignee": "string (기본값: 'both')"
            },
            "body_required": ["title", "start_date"],
            "body_optional": ["description", "end_date", "start_time", "end_time", "location", "category", "priority", "assignee"],
            "status_codes": [
                {"code": 200, "message": "event_created", "body": {"message": "event_created", "data": {"event_id": 1}}, "msg": "일정 생성 성공"},
                {"code": 401, "message": "unauthorized", "body": {"message": "unauthorized", "data": None}, "msg": "인증 필요"},
                {"code": 422, "message": "invalid_request", "body": {"message": "invalid_request", "data": None}, "msg": "유효성 검사 실패"},
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
        }
    ]
})

# 업체 추천 API 추가
API_DATA["sections"].append({
    "id": "8",
    "name": "업체 추천 (Vendor)",
    "apis": [
        {
            "id": "8.1",
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
            "id": "8.2",
            "name": "업체 추천",
            "method": "GET",
            "path": "/api/vendors/recommend",
            "request": None,
            "response": "VendorRecommendResponse",
            "auth": True,
            "description": "업체 추천 (프로필 기반)",
            "query_params": [
                {"name": "wedding_profile_id", "type": "Integer", "required": True, "default": None, "description": "결혼식 프로필 ID"},
                {"name": "vendor_type", "type": "String", "required": False, "default": None, "description": "업체 타입 (IPHONE_SNAP, MC, SINGER, STUDIO_PREWEDDING, VENUE_OUTDOOR)"},
                {"name": "min_price", "type": "Float", "required": False, "default": None, "description": "최소 가격"},
                {"name": "max_price", "type": "Float", "required": False, "default": None, "description": "최대 가격"},
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
                {"code": 404, "message": "not_found", "body": {"message": "not_found", "data": None}, "msg": "프로필을 찾을 수 없습니다"},
                {"code": 500, "message": "internal_server_error", "body": {"message": "internal_server_error", "data": None}, "msg": "서버 오류"}
            ]
        }
    ]
})

# Vector DB API 추가
API_DATA["sections"].append({
    "id": "9",
    "name": "Vector DB",
    "apis": [
        {
            "id": "9.1",
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
    @media (max-width: 768px) {
      .container { padding: 16px; }
      .api-table { font-size: 14px; }
      .api-table th,
      .api-table td { padding: 12px 8px; }
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
    
    # API 테이블 행 생성
    for section in api_data['sections']:
        for api in section['apis']:
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
    
    # 각 API 상세 정보 생성
    for section in api_data['sections']:
        html_parts.append(f'''
    <h2 class="section-title">{section['name']}</h2>''')
        
        for api in section['apis']:
            html_parts.append(f'''
    <div class="api-detail">
      <h3>{api['id']} {api['name']}</h3>
      <div class="api-id">API ID: {api['id']}</div>
      <div class="description">{api['description']}</div>
      
      <h4 style="margin-top: 24px; margin-bottom: 12px; color: var(--accent-2);">Body / Parameter / Header / Query</h4>''')
            
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
            
            # Headers
            if api.get('headers') or api['auth']:
                html_parts.append('''
      <h5 style="margin-top: 16px; color: var(--text);">Headers</h5>
      <table class="param-table">
        <thead>
          <tr>
            <th>헤더</th>
            <th>타입</th>
            <th>필수</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>''')
                if api['auth']:
                    html_parts.append('''
          <tr>
            <td><code>Authorization</code></td>
            <td>String</td>
            <td><span class="required">필수</span></td>
            <td>Bearer &lt;token&gt;</td>
          </tr>''')
                if api.get('headers'):
                    headers_list = api['headers']
                    if isinstance(headers_list, list):
                        for header in headers_list:
                            if isinstance(header, dict):
                                required_class = "required" if header.get('required') else "optional"
                                required_text = "필수" if header.get('required') else "선택"
                                html_parts.append(f'''
          <tr>
            <td><code>{header.get('name', '')}</code></td>
            <td>{header.get('type', '')}</td>
            <td><span class="{required_class}">{required_text}</span></td>
            <td>{header.get('description', '')}</td>
          </tr>''')
                    elif isinstance(headers_list, dict):
                        # 단일 헤더 딕셔너리인 경우
                        required_class = "required" if headers_list.get('required') else "optional"
                        required_text = "필수" if headers_list.get('required') else "선택"
                        html_parts.append(f'''
          <tr>
            <td><code>{headers_list.get('name', '')}</code></td>
            <td>{headers_list.get('type', '')}</td>
            <td><span class="{required_class}">{required_text}</span></td>
            <td>{headers_list.get('description', '')}</td>
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
    </div>''')
    
    html_parts.append('''
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
    with open('api_reference.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    print('✅ HTML 파일 생성 완료: api_reference.html')
