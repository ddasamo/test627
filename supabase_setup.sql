-- 의도기반 탐구학습 시스템 - Supabase 데이터베이스 설정

-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    class TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 2. inquiries 테이블 생성
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    stage_scores INTEGER[] DEFAULT ARRAY[0,0,0,0,0,0,0],
    initial_intent TEXT,
    reflection_data JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. reflections 테이블 생성 (선택사항 - 성찰 데이터를 별도로 관리하고 싶은 경우)
CREATE TABLE IF NOT EXISTS reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    stage INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS (Row Level Security) 정책 설정

-- profiles 테이블 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- profiles 테이블 정책: 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- profiles 테이블 정책: 사용자는 자신의 프로필만 삽입할 수 있음
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles 테이블 정책: 사용자는 자신의 프로필만 업데이트할 수 있음
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- inquiries 테이블 RLS 활성화
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- inquiries 테이블 정책: 사용자는 자신의 탐구 데이터만 볼 수 있음
CREATE POLICY "Users can view own inquiries" ON inquiries
    FOR SELECT USING (auth.uid() = user_id);

-- inquiries 테이블 정책: 사용자는 자신의 탐구 데이터만 삽입할 수 있음
CREATE POLICY "Users can insert own inquiries" ON inquiries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- inquiries 테이블 정책: 사용자는 자신의 탐구 데이터만 업데이트할 수 있음
CREATE POLICY "Users can update own inquiries" ON inquiries
    FOR UPDATE USING (auth.uid() = user_id);

-- reflections 테이블 RLS 활성화
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- reflections 테이블 정책: 사용자는 자신의 성찰 데이터만 볼 수 있음
CREATE POLICY "Users can view own reflections" ON reflections
    FOR SELECT USING (auth.uid() = user_id);

-- reflections 테이블 정책: 사용자는 자신의 성찰 데이터만 삽입할 수 있음
CREATE POLICY "Users can insert own reflections" ON reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_reflections_inquiry_id ON reflections(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);

-- 6. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 트리거 생성
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at 
    BEFORE UPDATE ON inquiries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 설정 완료 메시지
SELECT 'Supabase 데이터베이스 설정이 완료되었습니다!' as message; 