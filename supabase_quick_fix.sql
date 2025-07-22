-- Supabase 빠른 수정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 모든 테이블의 RLS 비활성화 (개발/테스트용)
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reflections DISABLE ROW LEVEL SECURITY;

-- 2. 기존 정책들 삭제 (오류 방지)
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on inquiries" ON inquiries;
DROP POLICY IF EXISTS "Allow all operations on reflections" ON reflections;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can manage own reflections" ON reflections;

-- 3. 테이블 존재 확인 및 생성
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    school VARCHAR(100) NOT NULL,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 6),
    class INTEGER NOT NULL CHECK (class BETWEEN 1 AND 12),
    number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    intent TEXT DEFAULT '탐구 의도 미설정',
    stage INTEGER DEFAULT 1 CHECK (stage BETWEEN 1 AND 6),
    stage_data JSONB DEFAULT '{}',
    total_score INTEGER DEFAULT 0,
    progress FLOAT DEFAULT 0.0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reflections (
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

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_stage ON inquiries(stage);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_inquiry_id ON reflections(inquiry_id);

-- 5. 테스트 데이터 삽입
INSERT INTO profiles (username, password, name, school, grade, class, number) 
VALUES 
    ('demo', '1234', '데모 사용자', '데모 초등학교', 5, 1, 1),
    ('test', '1234', '테스트 사용자', '테스트 초등학교', 4, 2, 5)
ON CONFLICT (username) DO NOTHING;

-- 6. 확인
SELECT 'Setup completed successfully!' as message;
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as inquiry_count FROM inquiries;
SELECT COUNT(*) as reflection_count FROM reflections; 