# 의도기반 탐구학습 시스템

🎯 학생들의 초기 탐구 의도를 기준으로 하는 체계적인 탐구학습 지원 시스템입니다.

## 📋 프로젝트 개요

이 시스템은 개념기반탐구학습의 6단계 과정을 디지털화하여, 학생들이 처음 설정한 탐구 의도를 끝까지 유지하며 학습할 수 있도록 지원합니다.

### 주요 특징

- **의도 추적**: 초기 탐구 의도와의 일치도를 실시간으로 분석
- **점수화 시스템**: 의도 일치도 기반 점수 산정 (총 100점)
- **성찰 시스템**: 각 단계마다 AI가 성찰 질문 제시
- **게이미피케이션**: 레벨 시스템과 진행률 표시
- **태블릿 최적화**: 터치 친화적 UI 설계
- **데이터 관리**: Supabase 연동 또는 로컬 저장 지원

## 🏗️ 탐구학습 단계

1. **관계맺기** (Engaging) - 10점
2. **집중하기** (Focusing) - 15점  
3. **조사하기** (Exploring) - 20점
4. **조직 및 정리하기** (Organizing) - 15점
5. **일반화하기** (Generalizing) - 10점
6. **전이하기** (Transferring) - 20점

각 단계마다 성찰 참여 시 보너스 점수(3점) 획득 가능

## 📁 파일 구조

```
project/
├── index.html          # 메인 HTML 파일
├── styles.css          # CSS 스타일시트
├── script.js           # JavaScript 메인 로직
├── config.js           # 설정 및 구성 파일
└── README.md           # 프로젝트 가이드 (이 파일)
```

## ⚙️ 설정 방법

### 1. 기본 설정

모든 파일을 웹 서버에 업로드하거나 로컬에서 실행하세요.

### 2. Supabase 연동 (선택사항)

실제 데이터베이스를 사용하려면 `config.js` 파일을 수정하세요:

```javascript
const CONFIG = {
    // Supabase 설정
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    
    // 데모 모드 비활성화
    DEMO_MODE: false,
    
    // ... 기타 설정
};
```

### 3. Supabase 데이터베이스 스키마

다음 테이블들을 생성하세요:

#### profiles 테이블
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    class TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);
```

#### inquiries 테이블
```sql
CREATE TABLE inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    stage_scores INTEGER[] DEFAULT ARRAY[0,0,0,0,0,0,0],
    initial_intent TEXT,
    reflection_data JSONB DEFAULT '[]',
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. 데모 모드 사용

Supabase 설정 없이 바로 사용하려면 `config.js`에서:

```javascript
DEMO_MODE: true  // 이미 기본값으로 설정됨
```

데모 모드에서는 모든 데이터가 브라우저의 localStorage에 저장됩니다.

## 🚀 사용 방법

### 1. 시스템 접속

웹 브라우저에서 `index.html` 파일을 열거나 웹 서버 주소로 접속합니다.

### 2. 계정 생성/로그인

- **데모 모드**: 임의의 이메일과 비밀번호로 로그인 가능
- **Supabase 모드**: 실제 이메일 인증 필요

### 3. 탐구 과정 진행

1. **1단계**: 궁금한 점이나 탐구하고 싶은 주제 입력
2. **2단계**: 구체적인 탐구 질문 설정
3. **3단계**: 조사 방법과 계획 수립
4. **4단계**: 수집한 정보 정리 및 패턴 분석
5. **5단계**: 일반적인 원리나 법칙 도출
6. **6단계**: 다른 상황에의 적용 방안 제시

각 단계마다 성찰 질문에 답변하여 보너스 점수를 획득하세요!

## 🎯 점수 시스템

### 기본 점수 구성
- **의도 일치도**: 70점 (단계별 차등 배점)
- **성찰 참여도**: 20점 (단계당 3점 + 완료 보너스)
- **탐구 완성도**: 10점 (모든 단계 완료 시)

### 레벨 시스템
- ⭐⭐⭐⭐⭐ **탐구 마스터** (90점 이상)
- ⭐⭐⭐⭐☆ **탐구 전문가** (75점 이상)
- ⭐⭐⭐☆☆ **탐구 숙련자** (60점 이상)
- ⭐⭐☆☆☆ **탐구 초보자** (60점 미만)

## 🔧 커스터마이징

### 1. 성찰 질문 수정

`config.js`의 `REFLECTION_QUESTIONS` 객체를 수정하세요:

```javascript
REFLECTION_QUESTIONS: {
    1: "새로운 성찰 질문 1",
    2: "새로운 성찰 질문 2",
    // ...
}
```

### 2. 점수 배점 조정

`config.js`의 `STAGE_MAX_SCORES` 배열을 수정하세요:

```javascript
STAGE_MAX_SCORES: [0, 15, 20, 25, 20, 10, 10]  // 예시
```

### 3. UI 메시지 변경

`config.js`의 `MESSAGES` 객체에서 각종 메시지를 수정할 수 있습니다.

### 4. 스타일 커스터마이징

`styles.css` 파일을 수정하여 색상, 폰트, 레이아웃 등을 변경하세요.

## 📱 태블릿 최적화

- **터치 친화적**: 최소 44px 버튼 크기
- **반응형 디자인**: 다양한 화면 크기 지원
- **더블 탭 줌 방지**: 실수로 인한 확대/축소 방지
- **부드러운 스크롤**: 단계 간 자동 스크롤

## 🔒 데이터 보안

- **로컬 저장**: 데모 모드에서는 브라우저 로컬 저장소 사용
- **암호화**: Supabase 연동 시 자동 암호화 적용
- **인증**: 이메일/비밀번호 기반 사용자 인증

## 🐛 문제 해결

### 자주 발생하는 문제

1. **Supabase 연결 오류**
   - `config.js`의 URL과 키가 정확한지 확인
   - 네트워크 연결 상태 확인
   - 자동으로 데모 모드로 전환됨

2. **데이터 저장 안됨**
   - 브라우저의 localStorage 설정 확인
   - 시크릿/프라이빗 모드에서는 데이터가 저장되지 않을 수 있음

3. **터치 반응 없음**
   - 최신 브라우저 사용 권장
   - JavaScript 활성화 확인

### 디버그 모드

브라우저 콘솔에서 다음 명령어로 디버그 모드를 활성화할 수 있습니다:

```javascript
localStorage.setItem('debug', 'true');
```

## 📞 지원

문제가 발생하거나 개선 제안이 있으시면 이슈를 등록해주세요.

## 📄 라이선스

이 프로젝트는 교육 목적으로 자유롭게 사용할 수 있습니다.

---

**🎯 의도기반 탐구학습으로 더 깊이 있는 학습을 경험해보세요!**

## ✨ 주요 기능

### 🎯 의도기반 탐구 6단계
1. **관계맺기** - 탐구 문제 발견
2. **집중하기** - 탐구 질문 구체화
3. **조사하기** - 자료 수집 계획
4. **조직및정리하기** - 정보 분석 및 정리
5. **일반화하기** - 원리 도출
6. **전이하기** - 새로운 상황에 적용

### 🤖 AI 탐구 코치 (NEW!)
- **실시간 피드백**: 각 단계별 입력 내용을 AI가 분석하여 즉시 피드백 제공
- **의도 일치도 분석**: 초기 의도와 현재 탐구 방향의 일치도를 정확하게 측정
- **맞춤형 가이드**: 일치도에 따라 긍정적 피드백 또는 방향 수정 제안
- **단계별 상세 가이드**: 각 단계에 맞는 구체적인 탐구 방법 안내

### 📊 게이미피케이션 요소
- 실시간 점수 추적 (총 100점)
- 레벨 시스템 (초보자 → 숙련자 → 전문가 → 마스터)
- 성찰 참여 보너스
- 진행률 시각화

## 🚀 설치 및 실행

### 1. 파일 다운로드
모든 파일을 동일한 폴더에 저장하세요:
- `index.html`
- `styles.css`
- `script.js`
- `config.js`
- `README.md`

### 2. AI 코치 설정 (선택사항)
AI 탐구 코치 기능을 사용하려면 Google Gemini API 키가 필요합니다.

#### Google Gemini API 키 발급 방법:
1. [Google AI Studio](https://aistudio.google.com/)에 접속
2. 구글 계정으로 로그인
3. 'Get API Key' 버튼을 클릭하여 API 키 생성
4. `config.js` 파일에서 다음 부분 수정:

```javascript
AI_COACH: {
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY', // 여기에 실제 API 키 입력
    ENABLED: true, // AI 코치 활성화
    // ... 기타 설정
}
```

#### AI 코치 없이 사용하기:
```javascript
AI_COACH: {
    ENABLED: false, // AI 코치 비활성화
    // ... 기타 설정
}
```

### 3. 데이터베이스 설정 (선택사항)

#### 데모 모드 (추천):
```javascript
const CONFIG = {
    DEMO_MODE: true, // 로컬 저장소 사용
    // ... 기타 설정
}
```

#### Supabase 연동:
1. [Supabase](https://supabase.com/)에서 프로젝트 생성
2. `supabase_setup.sql` 파일의 SQL 명령어 실행
3. `config.js`에서 Supabase 정보 입력:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',
    DEMO_MODE: false,
    // ... 기타 설정
}
```

### 4. 웹 서버 실행
브라우저에서 `index.html` 파일을 직접 열거나, 로컬 웹 서버를 실행하세요.

## 🎮 사용 방법

### 1. 회원가입/로그인
- 데모 모드: 임의의 이메일과 비밀번호로 가입/로그인
- Supabase 모드: 실제 이메일 주소 필요

### 2. 탐구 시작
1. **1단계(관계맺기)**: 궁금한 것을 자유롭게 입력 → 이것이 **초기 의도**가 됩니다
2. **2-6단계**: 각 단계별 안내에 따라 탐구 진행
3. **AI 피드백**: 각 단계 완료 시 AI 코치의 분석과 피드백 확인
4. **성찰**: 각 단계마다 성찰 질문에 답변하여 보너스 점수 획득

### 3. AI 피드백 활용
- **높은 일치도 (80점 이상)**: 긍정적 피드백과 격려
- **보통 일치도 (60-79점)**: 격려 + 개선 제안
- **낮은 일치도 (60점 미만)**: 방향 수정 가이드 제공
- **자세한 가이드**: 각 단계별 구체적인 탐구 방법 안내

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (선택사항)
- **AI**: Google Gemini 2.0 Flash (선택사항)
- **Storage**: LocalStorage (데모 모드) / Supabase (프로덕션)

## 📱 지원 환경

- **데스크톱**: Chrome, Firefox, Safari, Edge
- **모바일**: iOS Safari, Android Chrome
- **태블릿**: iPad, Android 태블릿 최적화

## 🔒 개인정보 보호

- 데모 모드: 모든 데이터는 브라우저 로컬 저장소에만 저장
- Supabase 모드: 암호화된 데이터베이스에 안전하게 저장
- AI 분석: Google Gemini API를 통해 처리되며, 개인정보는 전송되지 않음

## 🛠️ 커스터마이징

### 점수 기준 변경
`config.js`의 `APP_SETTINGS` 섹션에서 각종 점수 기준을 조정할 수 있습니다.

### AI 프롬프트 수정
`config.js`의 `AI_COACH.PROMPTS` 섹션에서 AI의 분석 방식을 변경할 수 있습니다.

### 성찰 질문 변경
`config.js`의 `REFLECTION_QUESTIONS` 섹션에서 각 단계별 성찰 질문을 수정할 수 있습니다.

## 📄 라이선스

이 프로젝트는 교육 목적으로 자유롭게 사용할 수 있습니다.

## 🤝 기여하기

버그 리포트나 기능 제안은 언제든 환영합니다!

---

**개발자**: 의도기반 탐구학습 연구팀  
**버전**: 2.0 (AI 코치 기능 추가)  
**최종 업데이트**: 2024년 12월 