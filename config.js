// 의도기반 탐구학습 시스템 - 설정 파일

// ===== Supabase 설정 =====
// 실제 사용 시 아래 값들을 본인의 Supabase 프로젝트 정보로 교체하세요
const CONFIG = {
    // Supabase 설정
    SUPABASE_URL: 'https://yiypcqfzdtmcpdrmxzlx.supabase.co', // 예: 'https://your-project.supabase.co'
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpeXBjcWZ6ZHRtY3Bkcm14emx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjQyNzEsImV4cCI6MjA2NjYwMDI3MX0.BpG75MTBGaWXTz5fP_-4d_xzWfPdIe_8579cRfNUli0', // 예: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    
    // 데모 모드 설정 (개발/테스트용)
    DEMO_MODE: false, // true: localStorage 사용, false: Supabase 사용
    
    // ===== AI 탐구 코치 설정 =====
    AI_COACH: {
        // Google Gemini API 설정
        GEMINI_API_KEY: 'AIzaSyAdcD_Q6oGohDQ7HfToeWrd6n4R-kwUKGQ',
        MODEL: 'gemini-1.5-flash',
        MAX_TOKENS: 500,
        TEMPERATURE: 0.7,
        
        // AI 코치 활성화 여부
        ENABLED: false,
        
        // 피드백 기준 점수
        FEEDBACK_THRESHOLDS: {
            HIGH_MATCH: 80,     // 높은 일치도 - 긍정적 피드백
            MEDIUM_MATCH: 60,   // 보통 일치도 - 격려 + 개선 제안
            LOW_MATCH: 40       // 낮은 일치도 - 방향 수정 가이드
        },
        
        // AI 프롬프트 템플릿
        PROMPTS: {
            INTENT_ANALYSIS: `
당신은 학생들의 탐구학습을 돕는 AI 코치입니다. 
학생의 초기 탐구 의도와 현재 단계의 입력 내용을 비교하여 일치도를 0-100점으로 평가하고, 
적절한 피드백을 제공해주세요.

초기 의도: "{initialIntent}"
현재 단계: {stage}단계 - {stageName}
학생 입력: "{userInput}"

다음 JSON 형식으로 응답해주세요:
{
  "matchScore": 숫자 (0-100),
  "feedback": "학생에게 제공할 피드백 메시지",
  "suggestions": ["구체적인 개선 제안1", "개선 제안2"],
  "encouragement": "격려 메시지"
}
`,
            
            REFLECTION_GUIDE: `
학생이 성찰 질문에 답변한 내용을 바탕으로 더 깊이 있는 성찰을 유도하는 후속 질문을 생성해주세요.

초기 의도: "{initialIntent}"
성찰 질문: "{reflectionQuestion}"
학생 답변: "{studentAnswer}"

다음 JSON 형식으로 응답해주세요:
{
  "followUpQuestions": ["후속 질문1", "후속 질문2"],
  "insight": "학생의 답변에서 발견한 통찰",
  "guidance": "성찰 방향 가이드"
}
`
        }
    },
    
    // 앱 설정
    APP_SETTINGS: {
        // 탐구 단계별 최대 점수
        STAGE_MAX_SCORES: [0, 10, 15, 20, 15, 10, 20], // 인덱스 0은 사용하지 않음
        
        // 성찰 참여 보너스 점수
        REFLECTION_BONUS: 3,
        
        // 의도 일치도 계산 가중치
        STAGE_WEIGHTS: [0, 1.0, 0.95, 0.9, 0.85, 0.9, 0.95],
        
        // 자동 저장 간격 (밀리초)
        AUTO_SAVE_INTERVAL: 30000, // 30초
        
        // 레벨 기준 점수
        LEVEL_THRESHOLDS: {
            MASTER: 90,     // 탐구 마스터
            EXPERT: 75,     // 탐구 전문가  
            SKILLED: 60,    // 탐구 숙련자
            BEGINNER: 0     // 탐구 초보자
        },
        
        // 의도 일치도 표시 기준
        INTENT_MATCH_THRESHOLDS: {
            HIGH: 80,       // 높음 (초록색)
            MEDIUM: 60,     // 보통 (주황색)
            LOW: 0          // 낮음 (빨간색)
        }
    },
    
    // 성찰 질문 설정
    REFLECTION_QUESTIONS: {
        1: "지금 제시한 문제가 정말 너희가 궁금해하는 것과 일치하나요?",
        2: "지금 설정한 탐구 질문이 처음 의도와 연결되어 있나요?", 
        3: "지금까지 수집한 자료가 탐구 질문에 답하는 데 도움이 되고 있나요?",
        4: "정리한 내용이 처음 궁금했던 것과 관련이 있나요?",
        5: "도출한 원리가 처음 의도했던 탐구 목표를 달성했나요?",
        6: "학습한 내용을 새로운 상황에 적용할 때 어려움은 없었나요?"
    },
    
    // UI 메시지 설정
    MESSAGES: {
        LOGIN_SUCCESS: '로그인 성공!',
        SIGNUP_SUCCESS: '회원가입 성공! 로그인해주세요.',
        LOGOUT_SUCCESS: '로그아웃되었습니다.',
        SAVE_SUCCESS: '진행 상황이 저장되었습니다.',
        COMPLETE_SUCCESS: '🎉 축하합니다! 의도기반 탐구학습을 완료했습니다!',
        
        ERRORS: {
            LOGIN_FAILED: '로그인에 실패했습니다.',
            SIGNUP_FAILED: '회원가입에 실패했습니다.',
            SAVE_FAILED: '저장에 실패했습니다.',
            NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
            INVALID_INPUT: '입력 내용을 확인해주세요.',
            EMPTY_FIELD: '모든 필드를 입력해주세요.'
        }
    },
    
    // 데이터베이스 테이블 이름
    DB_TABLES: {
        PROFILES: 'profiles',
        INQUIRIES: 'inquiries',
        REFLECTIONS: 'reflections'
    }
};

// Supabase 클라이언트 초기화
let supabase = null;

// 설정 초기화 함수
function initializeConfig() {
    if (!CONFIG.DEMO_MODE && typeof window !== 'undefined' && window.supabase) {
        try {
            supabase = window.supabase.createClient(
                CONFIG.SUPABASE_URL, 
                CONFIG.SUPABASE_ANON_KEY
            );
            console.log('Supabase 클라이언트가 초기화되었습니다.');
        } catch (error) {
            console.error('Supabase 초기화 오류:', error);
            console.log('데모 모드로 전환합니다.');
            CONFIG.DEMO_MODE = true;
        }
    } else {
        console.log('데모 모드로 실행됩니다.');
    }
}

// 설정 검증 함수
function validateConfig() {
    const errors = [];
    
    if (!CONFIG.DEMO_MODE) {
        if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            errors.push('SUPABASE_URL이 설정되지 않았습니다.');
        }
        
        if (!CONFIG.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            errors.push('SUPABASE_ANON_KEY가 설정되지 않았습니다.');
        }
    }
    
    if (errors.length > 0) {
        console.warn('설정 경고:', errors);
        console.log('데모 모드로 전환합니다.');
        CONFIG.DEMO_MODE = true;
    }
    
    return errors.length === 0;
}

// 환경별 설정 함수
function getEnvironmentConfig() {
    const hostname = window.location.hostname;
    
    // 로컬 개발 환경
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return {
            ...CONFIG,
            DEMO_MODE: true,
            DEBUG: true
        };
    }
    
    // 프로덕션 환경
    return {
        ...CONFIG,
        DEBUG: false
    };
}

// 레벨 텍스트 반환 함수
function getLevelText(score) {
    const thresholds = CONFIG.APP_SETTINGS.LEVEL_THRESHOLDS;
    
    if (score >= thresholds.MASTER) {
        return '⭐⭐⭐⭐⭐ 탐구 마스터';
    } else if (score >= thresholds.EXPERT) {
        return '⭐⭐⭐⭐☆ 탐구 전문가';
    } else if (score >= thresholds.SKILLED) {
        return '⭐⭐⭐☆☆ 탐구 숙련자';
    } else {
        return '⭐⭐☆☆☆ 탐구 초보자';
    }
}

// 의도 일치도 클래스 반환 함수
function getIntentMatchClass(matchPercentage) {
    const thresholds = CONFIG.APP_SETTINGS.INTENT_MATCH_THRESHOLDS;
    
    if (matchPercentage >= thresholds.HIGH) {
        return 'match-indicator';
    } else if (matchPercentage >= thresholds.MEDIUM) {
        return 'match-indicator medium';
    } else {
        return 'match-indicator low';
    }
}

// 디버그 모드 확인
function isDebugMode() {
    return CONFIG.DEBUG || localStorage.getItem('debug') === 'true';
}

// 설정 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        initializeConfig,
        validateConfig,
        getEnvironmentConfig,
        getLevelText,
        getIntentMatchClass,
        isDebugMode
    };
}

// 디버깅: CONFIG 로드 확인
console.log('config.js 로드 완료');
console.log('DEMO_MODE 설정:', CONFIG.DEMO_MODE);
console.log('AI_COACH.ENABLED:', CONFIG.AI_COACH.ENABLED); 