-- RLS 정책 문제 해결을 위한 SQL 스크립트

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on inquiries" ON inquiries;
DROP POLICY IF EXISTS "Allow all operations on reflections" ON reflections;

-- 2. 임시로 RLS 비활성화 (개발/테스트용)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;

-- 3. 테이블 구조 확인 및 수정
-- inquiries 테이블에 필요한 컬럼이 있는지 확인
DO $$
BEGIN
    -- stage_data 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inquiries' AND column_name = 'stage_data'
    ) THEN
        ALTER TABLE inquiries ADD COLUMN stage_data JSONB DEFAULT '{}';
    END IF;
    
    -- progress 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inquiries' AND column_name = 'progress'
    ) THEN
        ALTER TABLE inquiries ADD COLUMN progress FLOAT DEFAULT 0.0;
    END IF;
END $$;

-- 4. 테스트 데이터 삽입 (선택사항)
INSERT INTO profiles (username, password, name, school, grade, class, number) 
VALUES ('testuser', '1234', '테스트사용자', '테스트학교', 4, 1, 1)
ON CONFLICT (username) DO NOTHING;

-- 5. 확인 쿼리
SELECT 'Tables created successfully!' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'; 