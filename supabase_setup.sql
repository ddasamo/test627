-- ===== 의도기반 탐구학습 시스템 데이터베이스 설정 =====

-- 1. 사용자 프로필 테이블
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL, -- 실제 프로덕션에서는 해시된 비밀번호 저장
    name VARCHAR(100) NOT NULL,
    school VARCHAR(100) NOT NULL,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 6),
    class INTEGER NOT NULL CHECK (class BETWEEN 1 AND 12),
    number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 탐구 활동 테이블
DROP TABLE IF EXISTS inquiries CASCADE;
CREATE TABLE inquiries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    intent TEXT NOT NULL,
    stage INTEGER DEFAULT 1 CHECK (stage BETWEEN 1 AND 6),
    stage_data JSONB DEFAULT '{}',
    score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    progress FLOAT DEFAULT 0.0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 성찰 활동 테이블
DROP TABLE IF EXISTS reflections CASCADE;
CREATE TABLE reflections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
    stage INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    ai_feedback TEXT,
    intent_match_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 인덱스 생성 =====
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_stage ON inquiries(stage);
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_reflections_inquiry_id ON reflections(inquiry_id);

-- ===== 트리거 함수 생성 (updated_at 자동 업데이트) =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===== 트리거 적용 =====
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== Row Level Security (RLS) 정책 =====

-- profiles 테이블 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (true); -- 모든 사용자가 프로필 조회 가능 (로그인 용도)

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = (SELECT id FROM profiles WHERE username = current_user));

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (true); -- 회원가입 허용

-- inquiries 테이블 RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own inquiries" ON inquiries
    FOR ALL USING (user_id = (SELECT id FROM profiles WHERE username = current_user));

-- reflections 테이블 RLS
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reflections" ON reflections
    FOR ALL USING (user_id = (SELECT id FROM profiles WHERE username = current_user));

-- ===== 샘플 데이터 (테스트용) =====
INSERT INTO profiles (username, password, name, school, grade, class, number) VALUES
('demo', '1234', '데모 사용자', '데모 초등학교', 5, 1, 1),
('student1', '1234', '김학생', '서울초등학교', 4, 2, 5),
('student2', '5678', '이학생', '부산초등학교', 6, 3, 12);

-- ===== 설정 완료 메시지 =====
SELECT 'Supabase 데이터베이스 설정이 완료되었습니다!' as message; 각 과정별로 학생들이 탐구 질문이나  조사 결과, 보고서를 비롯해서 일반화된 문장 등을 입력하면 이를 분석하는 프로그램을 만들려고 합니다. 이때 학생들이 처음에 탐구의 목표로 정한 의도에 맞게 조사하거나 결과보고서를 작성하는지  AI 가 학생들이 입력한 것을 바탕으로 피드백을 하려고 합니다 가능할까요?