// 의도기반 탐구학습 시스템 - 설정 파일

const CONFIG = {
    // Supabase 설정
    SUPABASE_URL: 'https://yiypcqfzdtmcpdrmxzlx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpeXBjcWZ6ZHRtY3Bkcm14emx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjQyNzEsImV4cCI6MjA2NjYwMDI3MX0.BpG75MTBGaWXTz5fP_-4d_xzWfPdIe_8579cRfNUli0',
    
    // 데모 모드 설정 (Supabase 연동)
    DEMO_MODE: true, // 변수 중복 오류 해결까지 임시 활성화
    
    // 교사용 설정
    TEACHER: {
        PASSWORD: 'teacher2024',
        REPORT_SETTINGS: {
            MAX_AI_FEEDBACK_LENGTH: 400,
            DEFAULT_FEEDBACK_ENABLED: true,
            PDF_EXPORT_ENABLED: true,
            PRINT_ENABLED: true
        }
    },
    
    // AI 탐구 코치 설정
    AI_COACH: {
        GEMINI_API_KEY: 'AIzaSyBMYsUtKWZO2wDNzSFtCjp34oMo0Jp4Fvo',
        MODEL: 'gemini-1.5-flash',
        MAX_TOKENS: 500,
        TEMPERATURE: 0.7,
        ENABLED: true,
        
        FEEDBACK_THRESHOLDS: {
            HIGH_MATCH: 80,
            MEDIUM_MATCH: 60,
            LOW_MATCH: 40
        },
        
        PROMPTS: {
            INTENT_ANALYSIS: `당신은 학생들의 탐구학습을 돕는 AI 코치입니다. 
학생이 처음에 설정한 탐구 의도와 현재 단계의 입력 내용을 비교 분석해주세요.

초기 의도: {INITIAL_INTENT}
현재 단계: {STAGE_NAME}
학생 입력: {USER_INPUT}

다음 기준으로 분석해주세요:
1. 의도 일치도 (0-100점)
2. 긍정적인 부분
3. 개선이 필요한 부분
4. 구체적인 제안사항

응답은 친근하고 격려하는 톤으로 작성해주세요.`,

            REFLECTION_GUIDE: `학생의 탐구 과정에 대한 성찰을 도와주세요.

현재 단계: {STAGE_NAME}
학생 활동: {USER_INPUT}

성찰 질문을 1-2개 제시해주세요.`
        }
    },

    // 앱 설정
    APP_SETTINGS: {
        STAGE_MAX_SCORES: {
            1: 10, 2: 15, 3: 20, 4: 20, 5: 15, 6: 20
        },
        REFLECTION_BONUS: 3,
        AUTO_SAVE_INTERVAL: 30000,
        LEVEL_THRESHOLDS: {
            BEGINNER: 0, SKILLED: 25, EXPERT: 60, MASTER: 90
        }
    },

    // 성찰 질문
    REFLECTION_QUESTIONS: {
        1: "이번 탐구 주제를 선택한 이유는 무엇인가요?",
        2: "탐구 질문을 구체화하면서 어떤 점이 명확해졌나요?",
        3: "조사 과정에서 가장 흥미로웠던 발견은 무엇인가요?",
        4: "수집한 정보를 정리하면서 어떤 패턴을 발견했나요?",
        5: "이번 탐구를 통해 알게 된 원리는 무엇인가요?",
        6: "배운 내용을 실생활에 어떻게 활용할 수 있을까요?"
    },

    // UI 메시지
    MESSAGES: {
        LOGIN_SUCCESS: '로그인 성공!',
        SIGNUP_SUCCESS: '회원가입 성공!',
        COMPLETE_SUCCESS: '탐구 활동이 완료되었습니다!',
        ERRORS: {
            LOGIN_FAILED: '로그인 실패',
            EMPTY_FIELD: '모든 필드를 입력해주세요',
            SAVE_FAILED: '데이터 저장에 실패했습니다'
        }
    },
    
    // 데이터베이스 테이블
    DB_TABLES: {
        PROFILES: 'profiles',
        INQUIRIES: 'inquiries',
        REFLECTIONS: 'reflections'
    }
};

// 설정 검증 함수
function validateConfig() {
    if (!CONFIG.DEMO_MODE) {
        if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
            console.warn('Supabase 설정 누락, 데모 모드로 전환');
            CONFIG.DEMO_MODE = true;
        }
    }
    return true;
}

// 레벨 텍스트 함수
function getLevelText(score) {
    if (score >= 90) return '⭐⭐⭐⭐⭐ 탐구 마스터';
    if (score >= 60) return '⭐⭐⭐⭐☆ 탐구 전문가';
    if (score >= 25) return '⭐⭐⭐☆☆ 탐구 숙련자';
    return '⭐⭐☆☆☆ 탐구 초보자';
} 