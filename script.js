// 의도기반 탐구학습 시스템 - 메인 스크립트

// ===== 전역 변수 =====
let currentUser = null;
let supabase = null;
let currentStage = 1;
let stageData = {
    1: '', // 의도
    2: '', // 질문
    3: '', // 조사
    4: '', // 정리
    5: '', // 일반화
    6: ''  // 전이
};
let totalScore = 0;
let initialIntent = '';
let reflectionData = [];
let currentInquiryId = null;
let stageScores = [0, 0, 0, 0, 0, 0, 0]; // 단계별 점수 배열

// ===== AI 탐구 코치 관련 변수 =====
let aiCoachEnabled = false; // AI 코치 활성화 상태
let currentAIFeedback = null;

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM 로드 완료');
    
    // CONFIG 유효성 검사
    if (!validateConfig()) {
        console.error('설정 오류가 발생했습니다.');
        return;
    }
    
    // Supabase 초기화
    if (!CONFIG.DEMO_MODE) {
        try {
            // Supabase 클라이언트 생성
            supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
            console.log('Supabase 클라이언트 초기화 완료');
        } catch (error) {
            console.error('Supabase 초기화 오류:', error);
            showError('데이터베이스 연결에 실패했습니다.');
        }
    }
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // AI 코치 초기화
    initializeAICoach();
    
    // 인증 상태 확인
    await checkAuthState();
    
    // 앱 초기화
    initializeApp();
    
    console.log('애플리케이션 초기화 완료');
});

// 이벤트 리스너 설정
function setupEventListeners() {
    console.log('이벤트 리스너 설정 시작');
    
    // 로그인 폼 이벤트
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('로그인 폼 이벤트 리스너 등록');
    }
    
    // 회원가입 폼 이벤트
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        console.log('회원가입 폼 이벤트 리스너 등록');
    }
    
    // 폼 전환 버튼들
    const showSignupBtn = document.getElementById('showSignupBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', function() {
            console.log('회원가입 폼으로 전환');
            showSignupForm();
        });
        console.log('회원가입 전환 버튼 이벤트 리스너 등록');
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function() {
            console.log('로그인 폼으로 전환');
            showLoginForm();
        });
        console.log('로그인 전환 버튼 이벤트 리스너 등록');
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('로그아웃 시도');
            logout();
        });
        console.log('로그아웃 버튼 이벤트 리스너 등록');
    }
    
    // 단계 네비게이션 버튼들
    const navStages = document.querySelectorAll('.nav-stage');
    navStages.forEach(btn => {
        btn.addEventListener('click', function() {
            const stage = parseInt(this.getAttribute('data-stage'));
            console.log('단계 네비게이션 클릭:', stage);
            showStage(stage);
        });
    });
    console.log('단계 네비게이션 버튼 이벤트 리스너 등록:', navStages.length, '개');
    
    // 단계 제출 버튼들
    const stageButtons = document.querySelectorAll('.btn-primary[data-stage], .btn-secondary[data-stage]');
    stageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const stage = this.getAttribute('data-stage');
            console.log('단계 버튼 클릭:', stage);
            
            if (stage === 'prev') {
                // 이전 단계로
                if (currentStage > 1) {
                    showStage(currentStage - 1);
                }
            } else {
                // 단계 제출
                const stageNum = parseInt(stage);
                submitStage(stageNum);
            }
        });
    });
    console.log('단계 버튼 이벤트 리스너 등록:', stageButtons.length, '개');
    
    // 성찰 팝업 버튼들
    const closeReflectionBtn = document.getElementById('closeReflectionBtn');
    const submitReflectionBtn = document.getElementById('submitReflectionBtn');
    
    if (closeReflectionBtn) {
        closeReflectionBtn.addEventListener('click', closeReflection);
    }
    
    if (submitReflectionBtn) {
        submitReflectionBtn.addEventListener('click', submitReflection);
    }
    
    // 교사용 이벤트 리스너 설정
    setupTeacherEventListeners();
    
    console.log('모든 이벤트 리스너 설정 완료');
}

// 폼 전환 함수들 (전역으로 노출)
function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
}

function showSignupForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
}

// 전역 함수로 노출
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;

// 오류 메시지 표시
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message); // 백업으로 alert 사용
    }
}

// 인증 상태 확인
async function checkAuthState() {
    if (CONFIG.DEMO_MODE) {
        // 데모 모드에서는 저장된 사용자 확인
        const savedUser = localStorage.getItem('demoUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            await showMainApp();
        }
        return;
    }
    
    // Supabase 인증 상태 확인은 여기서는 스킵
    // 실제 구현에서는 세션 기반 인증을 사용할 예정
}

// 설정 초기화 함수
function initializeConfig() {
    console.log('설정 초기화 시작 - 데모 모드:', CONFIG.DEMO_MODE);
    
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
        console.log('데모 모드로 실행됩니다. localStorage를 사용합니다.');
    }
}

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();
    console.log('로그인 시도 시작');
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    console.log('입력된 아이디:', username);
    
    if (!username || !password) {
        showError('아이디와 비밀번호를 모두 입력해주세요.');
        return;
    }
    
    try {
        if (CONFIG.DEMO_MODE) {
            console.log('데모 모드로 로그인 처리 중...');
            
            // 간단한 테스트 계정들
            const testAccounts = {
                'demo': { password: '1234', name: '데모 사용자', school: '데모 초등학교', grade: '5', class: '1', number: '1' },
                'test': { password: '1234', name: '테스트 사용자', school: '테스트 초등학교', grade: '4', class: '2', number: '5' }
            };
            
            if (testAccounts[username] && testAccounts[username].password === password) {
                currentUser = {
                    id: username,
                    username: username,
                    name: testAccounts[username].name,
                    school: testAccounts[username].school,
                    grade: testAccounts[username].grade,
                    class: testAccounts[username].class,
                    number: testAccounts[username].number
                };
                
                localStorage.setItem('demoUser', JSON.stringify(currentUser));
                console.log('데모 로그인 성공:', currentUser);
                await showMainApp();
                return;
            }
            
            // 저장된 사용자 확인
            const savedUser = localStorage.getItem('demoUser');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                if (userData.username === username && userData.password === password) {
                    currentUser = userData;
                    console.log('저장된 사용자로 로그인 성공');
                    await showMainApp();
                    return;
                }
            }
            
            showError('데모 모드: 아이디 demo/test, 비밀번호 1234를 사용하거나 회원가입 후 로그인하세요.');
            return;
        }
        
        // Supabase를 사용한 실제 로그인
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();
            
        if (profileError || !profiles) {
            showError('존재하지 않는 아이디입니다.');
            return;
        }
        
        // 비밀번호 확인 (실제 프로덕션에서는 해시된 비밀번호와 비교해야 함)
        if (profiles.password !== password) {
            showError('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        // 로그인 성공
        currentUser = {
            id: profiles.id,
            username: profiles.username,
            name: profiles.name,
            school: profiles.school,
            grade: profiles.grade,
            class: profiles.class,
            number: profiles.number
        };
        
        console.log('로그인 성공:', currentUser);
        await showMainApp();
        
    } catch (error) {
        console.error('로그인 오류:', error);
        showError('로그인 중 오류가 발생했습니다: ' + error.message);
    }
}

// 회원가입 처리
async function handleSignup(event) {
    event.preventDefault();
    console.log('회원가입 시도 시작');
    
    const school = document.getElementById('signupSchool').value.trim();
    const grade = document.getElementById('signupGrade').value;
    const classNum = document.getElementById('signupClass').value;
    const number = document.getElementById('signupNumber').value;
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const privacyAgree = document.getElementById('privacyAgree').checked;
    
    console.log('회원가입 데이터:', { school, grade, classNum, number, name, username });
    
    // 유효성 검사
    if (!school || !grade || !classNum || !number || !name || !username || !password) {
        showError('모든 필드를 입력해주세요.');
        return;
    }
    
    if (!privacyAgree) {
        showError('개인정보 수집 및 이용에 동의해주세요.');
        return;
    }
    
    // 아이디 유효성 검사 (영어, 숫자만)
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        showError('아이디는 영어와 숫자만 사용할 수 있습니다.');
        return;
    }
    
    // 비밀번호 유효성 검사 (4자리 이상 숫자)
    if (!/^[0-9]{4,}$/.test(password)) {
        showError('비밀번호는 4자리 이상의 숫자여야 합니다.');
        return;
    }
    
    // 번호 유효성 검사
    const studentNumber = parseInt(number);
    if (studentNumber < 1 || studentNumber > 50) {
        showError('번호는 1부터 50 사이의 숫자여야 합니다.');
        return;
    }
    
    try {
        if (CONFIG.DEMO_MODE) {
            console.log('데모 모드로 회원가입 처리 중...');
            
            // 중복 아이디 확인 (localStorage)
            const existingUsers = JSON.parse(localStorage.getItem('demoUsers') || '{}');
            if (existingUsers[username]) {
                showError('이미 사용 중인 아이디입니다.');
                return;
            }
            
            // 새 사용자 생성
            const userData = {
                id: Date.now().toString(),
                username,
                password,
                name,
                school,
                grade,
                class: classNum,
                number: studentNumber,
                created_at: new Date().toISOString()
            };
            
            // 사용자 목록에 추가
            existingUsers[username] = userData;
            localStorage.setItem('demoUsers', JSON.stringify(existingUsers));
            localStorage.setItem('demoUser', JSON.stringify(userData));
            
            currentUser = userData;
            console.log('데모 회원가입 성공:', currentUser);
            await showMainApp();
            return;
        }
        
        // Supabase를 사용한 실제 회원가입
        // 먼저 중복 아이디 확인
        const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();
            
        if (existingUser) {
            showError('이미 사용 중인 아이디입니다.');
            return;
        }
        
        // 새 사용자 생성
        const { data: newUser, error: insertError } = await supabase
            .from('profiles')
            .insert([
                {
                    username,
                    password, // 실제 프로덕션에서는 비밀번호를 해시해야 함
                    name,
                    school,
                    grade: parseInt(grade),
                    class: parseInt(classNum),
                    number: studentNumber,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
            
        if (insertError) {
            console.error('회원가입 오류:', insertError);
            showError('회원가입 중 오류가 발생했습니다: ' + insertError.message);
            return;
        }
        
        // 회원가입 성공
        currentUser = {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            school: newUser.school,
            grade: newUser.grade,
            class: newUser.class,
            number: newUser.number
        };
        
        console.log('회원가입 성공:', currentUser);
        await showMainApp();
        
    } catch (error) {
        console.error('회원가입 오류:', error);
        showError('회원가입 중 오류가 발생했습니다: ' + error.message);
    }
}

// 로그아웃
async function logout() {
    try {
        if (CONFIG.DEMO_MODE) {
            // 데모 모드 로그아웃
            localStorage.removeItem('demoUser');
        } else {
            // Supabase 로그아웃
            await supabase.auth.signOut();
        }
        
        currentUser = null;
        showAuthContainer();
        resetApp();
        
    } catch (error) {
        console.error('로그아웃 오류:', error);
    }
}

// ===== UI 전환 함수 =====

// 메인 앱 표시
async function showMainApp() {
    try {
        // 인증 컨테이너 숨기기
        document.getElementById('authContainer').style.display = 'none';
        
        // 메인 앱 컨테이너 표시
        document.getElementById('mainApp').style.display = 'block';
        
        // 사용자 정보 표시
        if (currentUser) {
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userClass').textContent = 
                `${currentUser.school} ${currentUser.grade}학년 ${currentUser.class}반 ${currentUser.number}번`;
        }
        
        // 사용자 진행 상황 로드
        await loadUserProgress();
        
        // AI 코치 초기화
        initializeAICoach();
        
        console.log('메인 앱 표시 완료');
    } catch (error) {
        console.error('메인 앱 표시 오류:', error);
        showError('앱을 로드하는 중 오류가 발생했습니다.');
    }
}

// 인증 컨테이너 표시
function showAuthContainer() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

// 오류 메시지 표시
function showErrorMessage(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showError('아이디와 비밀번호를 모두 입력해주세요.');
        return;
    }
    
    try {
        if (CONFIG.DEMO_MODE) {
            // 데모 모드에서는 간단한 검증만
            if (username === 'demo' && password === '1234') {
                currentUser = {
                    id: 'demo',
                    username: 'demo',
                    name: '데모 사용자',
                    school: '데모 초등학교',
                    grade: '5',
                    class: '1',
                    number: '1'
                };
                await showMainApp();
                return;
            } else {
                showError('데모 모드에서는 아이디: demo, 비밀번호: 1234를 사용해주세요.');
                return;
            }
        }
        
        // Supabase를 사용한 실제 로그인
        // profiles 테이블에서 아이디로 사용자 검색
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();
            
        if (profileError || !profiles) {
            showError('존재하지 않는 아이디입니다.');
            return;
        }
        
        // 비밀번호 확인 (실제 프로덕션에서는 해시된 비밀번호와 비교해야 함)
        if (profiles.password !== password) {
            showError('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        // 로그인 성공
        currentUser = {
            id: profiles.id,
            username: profiles.username,
            name: profiles.name,
            school: profiles.school,
            grade: profiles.grade,
            class: profiles.class,
            number: profiles.number
        };
        
        console.log('로그인 성공:', currentUser);
        await showMainApp();
        
    } catch (error) {
        console.error('로그인 오류:', error);
        showError('로그인 중 오류가 발생했습니다.');
    }
}

// 회원가입 처리
async function handleSignup(event) {
    event.preventDefault();
    
    const school = document.getElementById('signupSchool').value.trim();
    const grade = document.getElementById('signupGrade').value;
    const classNum = document.getElementById('signupClass').value;
    const number = document.getElementById('signupNumber').value;
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const privacyAgree = document.getElementById('privacyAgree').checked;
    
    // 유효성 검사
    if (!school || !grade || !classNum || !number || !name || !username || !password) {
        showError('모든 필드를 입력해주세요.');
        return;
    }
    
    if (!privacyAgree) {
        showError('개인정보 수집 및 이용에 동의해주세요.');
        return;
    }
    
    // 아이디 유효성 검사 (영어, 숫자만)
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        showError('아이디는 영어와 숫자만 사용할 수 있습니다.');
        return;
    }
    
    // 비밀번호 유효성 검사 (4자리 이상 숫자)
    if (!/^[0-9]{4,}$/.test(password)) {
        showError('비밀번호는 4자리 이상의 숫자여야 합니다.');
        return;
    }
    
    // 번호 유효성 검사
    const studentNumber = parseInt(number);
    if (studentNumber < 1 || studentNumber > 50) {
        showError('번호는 1부터 50 사이의 숫자여야 합니다.');
        return;
    }
    
    try {
        if (CONFIG.DEMO_MODE) {
            // 데모 모드에서는 localStorage에 저장
            const userData = {
                id: Date.now().toString(),
                username,
                name,
                school,
                grade,
                class: classNum,
                number: studentNumber,
                password
            };
            localStorage.setItem('demoUser', JSON.stringify(userData));
            currentUser = userData;
            await showMainApp();
            return;
        }
        
        // Supabase를 사용한 실제 회원가입
        // 먼저 중복 아이디 확인
        const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();
            
        if (existingUser) {
            showError('이미 사용 중인 아이디입니다.');
            return;
        }
        
        // 새 사용자 생성
        const { data: newUser, error: insertError } = await supabase
            .from('profiles')
            .insert([
                {
                    username,
                    password, // 실제 프로덕션에서는 비밀번호를 해시해야 함
                    name,
                    school,
                    grade: parseInt(grade),
                    class: parseInt(classNum),
                    number: studentNumber,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
            
        if (insertError) {
            console.error('회원가입 오류:', insertError);
            showError('회원가입 중 오류가 발생했습니다.');
            return;
        }
        
        // 회원가입 성공
        currentUser = {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            school: newUser.school,
            grade: newUser.grade,
            class: newUser.class,
            number: newUser.number
        };
        
        console.log('회원가입 성공:', currentUser);
        await showMainApp();
        
    } catch (error) {
        console.error('회원가입 오류:', error);
        showError('회원가입 중 오류가 발생했습니다.');
    }
}

// 로그아웃
async function logout() {
    try {
        if (CONFIG.DEMO_MODE) {
            // 데모 모드 로그아웃
            localStorage.removeItem('demoUser');
        } else {
            // Supabase 로그아웃
            await supabase.auth.signOut();
        }
        
        currentUser = null;
        showAuthContainer();
        resetApp();
        
    } catch (error) {
        console.error('로그아웃 오류:', error);
    }
}

// 앱 리셋 함수
function resetApp() {
    // 모든 단계 데이터 초기화
    stageData = {
        1: '', 2: '', 3: '', 4: '', 5: '', 6: ''
    };
    currentStage = 1;
    totalScore = 0;
    initialIntent = '';
    
    // UI 초기화
    if (typeof initializeApp === 'function') {
        initializeApp();
    }
}

// 전역 함수로 노출
window.logout = logout;

// ===== 데이터 관리 함수 =====

// 사용자 진행 상황 로드
async function loadUserProgress() {
    try {
        if (CONFIG.DEMO_MODE) {
            // 데모 모드 - localStorage에서 로드
            const savedProgress = localStorage.getItem(`inquiry_${currentUser.id}`);
            if (savedProgress) {
                const data = JSON.parse(savedProgress);
                restoreProgressData(data);
            }
        } else {
            // Supabase에서 로드
            const { data, error } = await supabase
                .from(CONFIG.DB_TABLES.INQUIRIES)
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('status', 'in_progress')
                .single();

            if (data && !error) {
                restoreProgressData(data);
            }
        }
    } catch (error) {
        console.error('진행 상황 로드 오류:', error);
    }
}

// 진행 상황 데이터 복원
function restoreProgressData(data) {
    currentStage = data.currentStage || data.current_stage || 1;
    totalScore = data.totalScore || data.total_score || 0;
    stageScores = data.stageScores || data.stage_scores || [0, 0, 0, 0, 0, 0, 0];
    initialIntent = data.initialIntent || data.initial_intent || "";
    reflectionData = data.reflectionData || data.reflection_data || [];
    currentInquiryId = data.inquiryId || data.id;
    
    updateAllUI();
}

// 진행 상황 저장 (새로 작성된 버전)
async function saveProgress() {
    try {
        console.log('📁 진행 상황 저장 시작');
        
        if (CONFIG.DEMO_MODE) {
            // 데모 모드 - localStorage에 저장
            const progressData = {
                userId: currentUser.id,
                inquiryId: currentInquiryId,
                currentStage,
                totalScore,
                stageScores,
                initialIntent,
                reflectionData,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(`inquiry_${currentUser.id}`, JSON.stringify(progressData));
            console.log('✅ 데모 모드 저장 완료');
        } else {
            // Supabase 저장은 saveStageToDatabase에서 처리됨
            console.log('✅ Supabase 저장은 saveStageToDatabase에서 처리됨');
        }

    } catch (error) {
        console.error('❌ 진행 상황 저장 오류:', error);
        showError('데이터 저장에 실패했습니다.');
    }
}

// ===== 탐구 단계 관리 =====

// 단계 제출
async function submitStage(stage) {
    const input = document.getElementById(`input${stage}`).value.trim();
    
    if (!input) {
        showErrorMessage('내용을 입력해주세요!');
        return;
    }

    showLoading();

    try {
        // 첫 번째 단계에서 초기 의도 설정
        if (stage === 1) {
            initialIntent = input;
            document.getElementById('initialIntent').textContent = input;
        }

        // AI 피드백 분석 (비동기)
        let aiFeedback = null;
        if (aiCoachEnabled && initialIntent) {
            aiFeedback = await analyzeIntentMatch(input, stage);
        }
        
        // 의도 일치도 계산 (AI 피드백이 있으면 AI 점수 사용, 없으면 기본 계산)
        const intentMatch = aiFeedback ? aiFeedback.matchScore : calculateIntentMatch(input, stage);
        
        // 점수 계산
        const maxScore = CONFIG.APP_SETTINGS.STAGE_MAX_SCORES[stage];
        const earnedScore = Math.round(maxScore * (intentMatch / 100));
        stageScores[stage] = earnedScore;
        
        // UI 업데이트
        updateStageScore(stage, earnedScore, maxScore);
        updateTotalScore();
        updateProgress();
        updateIntentMatch(intentMatch);
        
        // AI 피드백 표시
        if (aiFeedback) {
            displayAIFeedback(aiFeedback, stage);
        }
        
        // 진행 상황 저장
        await saveProgress();
        
        // 성찰 팝업 표시 (AI 피드백 후 약간의 지연)
        setTimeout(() => {
            showReflectionPopup(stage);
        }, aiFeedback ? 2000 : 0);
        
        showSuccessMessage(`${stage}단계가 완료되었습니다!`);

    } catch (error) {
        console.error('단계 제출 오류:', error);
        showErrorMessage('단계 제출 중 오류가 발생했습니다.');
    } finally {
        hideLoading();
    }
}

// 성찰 제출
async function submitReflection() {
    const answer = document.getElementById('reflectionAnswer').value.trim();
    
    if (!answer) {
        showErrorMessage('성찰 답변을 입력해주세요!');
        return;
    }

    // 성찰 데이터 저장
    reflectionData.push({
        stage: currentStage,
        answer: answer,
        timestamp: new Date().toISOString()
    });

    // 성찰 참여 보너스
    totalScore += CONFIG.APP_SETTINGS.REFLECTION_BONUS;
    updateTotalScore();
    updateProgress();

    // 진행 상황 저장
    await saveProgress();

    // 팝업 닫기
    document.getElementById('reflectionPopup').style.display = 'none';
    document.getElementById('reflectionAnswer').value = '';
    
    // 다음 단계로 진행
    if (currentStage < 6) {
        currentStage++;
        document.getElementById(`stage${currentStage}`).scrollIntoView({
            behavior: 'smooth'
        });
    } else {
        await completeInquiry();
    }
}

// 탐구 완료
async function completeInquiry() {
    try {
        const finalData = {
            status: 'completed',
            completedAt: new Date().toISOString(),
            finalScore: totalScore
        };

        if (CONFIG.DEMO_MODE) {
            // 데모 모드 - localStorage에 완료 데이터 저장
            const currentData = JSON.parse(localStorage.getItem(`inquiry_${currentUser.id}`) || '{}');
            const completedData = { ...currentData, ...finalData };
            localStorage.setItem(`inquiry_${currentUser.id}_completed`, JSON.stringify(completedData));
        } else {
            // Supabase에 완료 상태 저장
            await supabase
                .from(CONFIG.DB_TABLES.INQUIRIES)
                .update(finalData)
                .eq('id', currentInquiryId);
        }

        // 탐구 돌아보기 레포트 표시
        showSuccess('탐구가 완료되었습니다! 🎉');
        setTimeout(() => {
            showInquiryCompletionReport();
        }, 1000);
        
    } catch (error) {
        console.error('탐구 완료 저장 오류:', error);
    }
}

// 탐구 완료 레포트 표시
function showInquiryCompletionReport() {
    const reportModal = document.createElement('div');
    reportModal.className = 'inquiry-completion-modal';
    reportModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        padding: 20px;
    `;
    
    reportModal.innerHTML = `
        <div class="completion-report-content">
            <div class="report-header">
                <h2>🎉 탐구 돌아보기</h2>
                <p>지금까지의 탐구 여정을 돌아보며 성찰해봅시다!</p>
            </div>
            <div class="report-body">
                <div class="inquiry-summary">
                    <h3>📋 탐구 요약</h3>
                    <p><strong>탐구 주제:</strong> ${initialIntent || '설정되지 않음'}</p>
                    <p><strong>완료 단계:</strong> 6단계 (전체 완료)</p>
                    <p><strong>총 점수:</strong> ${totalScore}점</p>
                    <p><strong>완료 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                </div>
                
                <div class="stage-activities">
                    <h3>🔍 단계별 활동 내용</h3>
                    ${generateStageActivitiesSummary()}
                </div>
                
                <div class="positive-feedback">
                    <h3>🌟 잘한 점들</h3>
                    <ul>
                        <li>체계적인 탐구 과정을 완주했습니다.</li>
                        <li>각 단계별로 성실하게 내용을 작성했습니다.</li>
                        <li>탐구 주제에 대한 깊이 있는 사고를 보여주었습니다.</li>
                        <li>논리적인 사고 과정을 거쳐 결론에 도달했습니다.</li>
                    </ul>
                </div>
                
                <div class="improvement-suggestions">
                    <h3>💡 더 좋은 탐구를 위한 제안</h3>
                    <ul>
                        <li>다양한 자료를 활용하여 더 풍부한 탐구를 해보세요.</li>
                        <li>실험이나 관찰을 통해 직접 경험해보세요.</li>
                        <li>다른 사람들과 의견을 나누어보세요.</li>
                        <li>탐구 결과를 실생활에 적용해보세요.</li>
                    </ul>
                </div>
            </div>
            <div class="report-actions">
                <button class="btn-primary" onclick="closeCompletionReport()">확인</button>
                <button class="btn-secondary" onclick="startNewInquiry()">새 탐구 시작</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(reportModal);
}

// 단계별 활동 요약 생성
function generateStageActivitiesSummary() {
    const stageNames = {
        1: '관계맺기', 2: '집중하기', 3: '조사하기',
        4: '조직 및 정리하기', 5: '일반화하기', 6: '전이하기'
    };
    
    let summary = '';
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`stage${i}Input`)?.value || '내용 없음';
        const shortContent = input.length > 50 ? input.substring(0, 50) + '...' : input;
        summary += `
            <div class="stage-summary">
                <h4>${i}단계: ${stageNames[i]}</h4>
                <p>${shortContent}</p>
            </div>
        `;
    }
    return summary;
}

// 완료 레포트 닫기
function closeCompletionReport() {
    const modal = document.querySelector('.inquiry-completion-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// 새 탐구 시작
function startNewInquiry() {
    closeCompletionReport();
    resetApp();
    showStage(1);
}

// ===== 계산 함수 =====

// 의도 일치도 계산
function calculateIntentMatch(input, stage) {
    if (!initialIntent) return 0;
    
    const initialKeywords = initialIntent.toLowerCase().split(/\s+/);
    const inputKeywords = input.toLowerCase().split(/\s+/);
    
    let matches = 0;
    initialKeywords.forEach(keyword => {
        if (inputKeywords.some(inputKeyword => 
            inputKeyword.includes(keyword) || keyword.includes(inputKeyword)
        )) {
            matches++;
        }
    });
    
    const baseMatch = Math.min(95, (matches / initialKeywords.length) * 100 + Math.random() * 20);
    const stageWeight = CONFIG.APP_SETTINGS.STAGE_WEIGHTS[stage];
    
    return Math.round(baseMatch * stageWeight);
}

// ===== UI 업데이트 함수 =====

// 단계 점수 업데이트
function updateStageScore(stage, earned, max) {
    document.getElementById(`score${stage}`).textContent = `${earned}/${max}점`;
    document.getElementById(`stage${stage}`).classList.add('completed');
    
    if (stage < 6) {
        document.getElementById(`stage${stage + 1}`).classList.add('active');
    }
}

// 총점 업데이트
function updateTotalScore() {
    totalScore = stageScores.reduce((sum, score) => sum + score, 0);
    document.getElementById('totalScore').textContent = `${totalScore}점`;
    
    const levelText = getLevelText(totalScore);
    document.getElementById('levelDisplay').textContent = levelText;
}

// 진행률 업데이트
function updateProgress() {
    const progress = Math.round((totalScore / 100) * 100);
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${progress}%`;
}

// 의도 일치도 업데이트
function updateIntentMatch(match) {
    const indicator = document.getElementById('matchIndicator');
    const text = document.getElementById('matchText');
    
    text.textContent = `의도 일치도: ${match}%`;
    indicator.className = getIntentMatchClass(match);
}

// 전체 UI 업데이트
function updateAllUI() {
    updateTotalScore();
    updateProgress();
    
    if (initialIntent) {
        document.getElementById('initialIntent').textContent = initialIntent;
    }
    
    // 완료된 단계들 표시
    for (let i = 1; i <= 6; i++) {
        if (stageScores[i] > 0) {
            const maxScore = CONFIG.APP_SETTINGS.STAGE_MAX_SCORES[i];
            updateStageScore(i, stageScores[i], maxScore);
        }
    }
}

// 성찰 팝업 표시
function showReflectionPopup(stage) {
    const popup = document.getElementById('reflectionPopup');
    const question = document.getElementById('reflectionQuestion');
    
    const questionText = CONFIG.REFLECTION_QUESTIONS[stage];
    question.innerHTML = `<p style="font-size: 1.1em; margin: 20px 0;">${questionText}</p>`;
    popup.style.display = 'flex';
}

// ===== 유틸리티 함수 =====

// 앱 상태 초기화
function resetApp() {
    currentStage = 1;
    totalScore = 0;
    stageScores = [0, 0, 0, 0, 0, 0, 0];
    initialIntent = "";
    reflectionData = [];
    currentInquiryId = null;
    
    // UI 초기화
    document.getElementById('totalScore').textContent = '0점';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    document.getElementById('initialIntent').textContent = '아직 설정되지 않았습니다.';
    document.getElementById('matchText').textContent = '의도 일치도: 0%';
    
    // 입력 필드 초기화
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`input${i}`).value = '';
        document.getElementById(`score${i}`).textContent = `0/${CONFIG.APP_SETTINGS.STAGE_MAX_SCORES[i]}점`;
        document.getElementById(`stage${i}`).classList.remove('completed', 'active');
    }
    
    // 첫 번째 단계 활성화
    document.getElementById('stage1').classList.add('active');
}

// 터치 최적화 설정
function setupTouchOptimization() {
    // 터치 이벤트 최적화
    document.addEventListener('touchstart', function() {}, {passive: true});
    
    // 더블 탭 줌 방지
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// ===== 메시지 표시 함수 =====

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// ===== 자동 저장 설정 =====
setInterval(async () => {
    if (currentUser && currentStage > 1) {
        await saveProgress();
    }
}, CONFIG.APP_SETTINGS.AUTO_SAVE_INTERVAL);

// ===== AI 탐구 코치 함수 =====

// AI 코치 초기화
function initializeAICoach() {
    const hasValidKey = CONFIG.AI_COACH.GEMINI_API_KEY && 
                       CONFIG.AI_COACH.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' && 
                       CONFIG.AI_COACH.GEMINI_API_KEY.startsWith('AIza');
    
    aiCoachEnabled = CONFIG.AI_COACH.ENABLED && hasValidKey;
    
    if (aiCoachEnabled) {
        console.log('AI 탐구 코치가 활성화되었습니다.');
        console.log('API 키 확인:', CONFIG.AI_COACH.GEMINI_API_KEY.substring(0, 10) + '...');
        console.log('사용 모델:', CONFIG.AI_COACH.MODEL);
        showAICoachStatus(true);
    } else {
        console.log('AI 탐구 코치가 비활성화되었습니다.');
        console.log('설정 확인:', {
            enabled: CONFIG.AI_COACH.ENABLED,
            hasKey: !!CONFIG.AI_COACH.GEMINI_API_KEY,
            keyValid: hasValidKey
        });
        showAICoachStatus(false);
    }
}

// AI 코치 상태 표시
function showAICoachStatus(enabled) {
    const statusElement = document.getElementById('aiCoachStatus');
    if (statusElement) {
        statusElement.textContent = enabled ? '🤖 AI 코치 활성화' : '🤖 AI 코치 비활성화';
        statusElement.className = enabled ? 'ai-coach-enabled' : 'ai-coach-disabled';
    }
}

// Google Gemini API 호출
async function callGeminiAPI(prompt) {
    if (!aiCoachEnabled) {
        console.log('AI 코치가 비활성화되어 있습니다.');
        return null;
    }

    try {
        const systemInstruction = '당신은 학생들의 탐구학습을 돕는 친근하고 격려적인 AI 코치입니다. 학생들의 수준에 맞는 쉬운 언어를 사용하고, 항상 긍정적이고 건설적인 피드백을 제공합니다.';
        const fullPrompt = `${systemInstruction}\n\n${prompt}`;
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.AI_COACH.MODEL}:generateContent?key=${CONFIG.AI_COACH.GEMINI_API_KEY}`;
        console.log('API 호출 URL:', apiUrl);
        console.log('사용 모델:', CONFIG.AI_COACH.MODEL);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: CONFIG.AI_COACH.TEMPERATURE,
                    maxOutputTokens: CONFIG.AI_COACH.MAX_TOKENS,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API 오류: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Gemini API 응답:', data);
        
        // 응답 구조 검증
        if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
                return candidate.content.parts[0].text;
            }
        }
        
        // 오류 응답 처리
        if (data.error) {
            throw new Error(`Gemini API 오류: ${data.error.message}`);
        }
        
        console.error('예상하지 못한 응답 구조:', data);
        throw new Error('Gemini API 응답 형식이 올바르지 않습니다.');
    } catch (error) {
        console.error('Gemini API 호출 오류:', error);
        return null;
    }
}

// 의도 일치도 분석 및 피드백 생성
async function analyzeIntentMatch(userInput, stage) {
    if (!aiCoachEnabled || !initialIntent || !userInput) {
        console.log('AI 분석 조건 미충족:', { aiCoachEnabled, initialIntent: !!initialIntent, userInput: !!userInput });
        return null;
    }

    console.log('AI 분석 시작:', { stage, stageName: stageNames[stage], userInput: userInput.substring(0, 50) + '...' });

    const prompt = CONFIG.AI_COACH.PROMPTS.INTENT_ANALYSIS
        .replace('{initialIntent}', initialIntent)
        .replace('{stage}', stage)
        .replace('{stageName}', stageNames[stage])
        .replace('{userInput}', userInput);

    console.log('생성된 프롬프트:', prompt);

    try {
        const response = await callGeminiAPI(prompt);
        if (response) {
            // JSON 응답 파싱 시도
            let feedback;
            try {
                // 응답에서 JSON 부분만 추출 (```json 등의 마크다운 제거)
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    feedback = JSON.parse(jsonMatch[0]);
                } else {
                    feedback = JSON.parse(response);
                }
            } catch (parseError) {
                console.error('JSON 파싱 오류:', parseError);
                console.log('원본 응답:', response);
                // JSON 파싱 실패 시 기본 피드백 사용
                return generateBasicFeedback(userInput, stage);
            }
            
            currentAIFeedback = feedback;
            return feedback;
        }
    } catch (error) {
        console.error('AI 피드백 분석 오류:', error);
        // 기본 피드백 제공
        return generateBasicFeedback(userInput, stage);
    }

    return null;
}

// 기본 피드백 생성 (AI 실패 시 대체)
function generateBasicFeedback(userInput, stage) {
    const basicMatch = calculateIntentMatch(userInput, stage);
    
    let feedback = '';
    let suggestions = [];
    let encouragement = '';

    if (basicMatch >= CONFIG.AI_COACH.FEEDBACK_THRESHOLDS.HIGH_MATCH) {
        feedback = '훌륭해요! 초기 의도와 잘 연결된 탐구를 진행하고 있습니다.';
        encouragement = '이 방향으로 계속 진행해보세요! 🎉';
        suggestions = ['현재 방향을 유지하며 더 구체적으로 발전시켜보세요.'];
    } else if (basicMatch >= CONFIG.AI_COACH.FEEDBACK_THRESHOLDS.MEDIUM_MATCH) {
        feedback = '좋은 시작이에요! 초기 의도와 어느 정도 연결되어 있습니다.';
        encouragement = '조금 더 초기 의도를 고려해보면 더 좋을 것 같아요! 💪';
        suggestions = ['초기 의도를 다시 한 번 확인해보세요.', '현재 내용을 초기 의도와 더 연결해보세요.'];
    } else {
        feedback = '초기 의도와 조금 다른 방향으로 가고 있는 것 같아요.';
        encouragement = '괜찮아요! 다시 초기 의도를 생각해보며 방향을 조정해보세요! 🌟';
        suggestions = ['초기 의도를 다시 읽어보세요.', '현재 단계가 초기 의도와 어떻게 연결되는지 생각해보세요.'];
    }

    return {
        matchScore: basicMatch,
        feedback: feedback,
        suggestions: suggestions,
        encouragement: encouragement
    };
}

// AI 피드백 표시
function displayAIFeedback(feedback, stage) {
    if (!feedback) return;

    const feedbackContainer = document.getElementById('aiFeedbackContainer');
    if (!feedbackContainer) return;

    // 피드백 UI 생성
    const feedbackHTML = `
        <div class="ai-feedback-card">
            <div class="ai-feedback-header">
                <span class="ai-coach-icon">🤖</span>
                <h4>AI 탐구 코치</h4>
                <span class="match-score ${getMatchScoreClass(feedback.matchScore)}">
                    일치도: ${feedback.matchScore}점
                </span>
            </div>
            <div class="ai-feedback-content">
                <div class="feedback-message">
                    <p>${feedback.feedback}</p>
                </div>
                <div class="encouragement-message">
                    <p><strong>${feedback.encouragement}</strong></p>
                </div>
                ${feedback.suggestions && feedback.suggestions.length > 0 ? `
                    <div class="suggestions">
                        <h5>💡 개선 제안:</h5>
                        <ul>
                            ${feedback.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            <div class="ai-feedback-actions">
                <button onclick="closeAIFeedback()" class="btn-secondary">확인</button>
                <button onclick="showDetailedGuidance(${stage})" class="btn-primary">자세한 가이드</button>
            </div>
        </div>
    `;

    feedbackContainer.innerHTML = feedbackHTML;
    feedbackContainer.style.display = 'block';
    
    // 애니메이션 효과
    setTimeout(() => {
        feedbackContainer.classList.add('show');
    }, 100);
}

// 일치도 점수에 따른 CSS 클래스 반환
function getMatchScoreClass(score) {
    if (score >= CONFIG.AI_COACH.FEEDBACK_THRESHOLDS.HIGH_MATCH) {
        return 'high-match';
    } else if (score >= CONFIG.AI_COACH.FEEDBACK_THRESHOLDS.MEDIUM_MATCH) {
        return 'medium-match';
    } else {
        return 'low-match';
    }
}

// AI 피드백 닫기
function closeAIFeedback() {
    const feedbackContainer = document.getElementById('aiFeedbackContainer');
    if (feedbackContainer) {
        feedbackContainer.classList.remove('show');
        setTimeout(() => {
            feedbackContainer.style.display = 'none';
        }, 300);
    }
}

// 자세한 가이드 표시
function showDetailedGuidance(stage) {
    const guidanceText = getDetailedGuidanceText(stage);
    
    const modal = document.createElement('div');
    modal.className = 'guidance-modal';
    modal.innerHTML = `
        <div class="guidance-content">
            <div class="guidance-header">
                <h3>${stage}단계 - ${stageNames[stage]} 가이드</h3>
                <button onclick="closeGuidanceModal()" class="close-btn">&times;</button>
            </div>
            <div class="guidance-body">
                ${guidanceText}
            </div>
            <div class="guidance-footer">
                <button onclick="closeGuidanceModal()" class="btn-primary">확인</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 100);
}

// 단계별 상세 가이드 텍스트
function getDetailedGuidanceText(stage) {
    const guides = {
        1: `
            <h4>🤝 관계맺기 단계</h4>
            <p>이 단계에서는 탐구하고 싶은 문제나 현상을 찾아보세요.</p>
            <ul>
                <li>주변에서 궁금한 것들을 생각해보세요</li>
                <li>일상생활에서 경험한 문제나 현상을 떠올려보세요</li>
                <li>초기 의도와 연결된 구체적인 문제를 제시해보세요</li>
            </ul>
        `,
        2: `
            <h4>🎯 집중하기 단계</h4>
            <p>탐구하고 싶은 질문을 구체적으로 만들어보세요.</p>
            <ul>
                <li>1단계에서 찾은 문제를 바탕으로 탐구 질문을 만드세요</li>
                <li>질문이 초기 의도와 연결되어 있는지 확인해보세요</li>
                <li>답을 찾을 수 있는 구체적인 질문으로 만들어보세요</li>
            </ul>
        `,
        3: `
            <h4>🔍 조사하기 단계</h4>
            <p>탐구 질문에 답하기 위한 자료를 수집해보세요.</p>
            <ul>
                <li>다양한 방법으로 정보를 수집해보세요</li>
                <li>수집한 자료가 탐구 질문과 관련이 있는지 확인해보세요</li>
                <li>초기 의도와 연결된 자료인지 생각해보세요</li>
            </ul>
        `,
        4: `
            <h4>📊 조직및정리하기 단계</h4>
            <p>수집한 자료를 정리하고 분석해보세요.</p>
            <ul>
                <li>수집한 자료를 체계적으로 정리해보세요</li>
                <li>자료들 사이의 관계를 찾아보세요</li>
                <li>초기 의도와 연결하여 정리해보세요</li>
            </ul>
        `,
        5: `
            <h4>💡 일반화하기 단계</h4>
            <p>탐구 결과를 바탕으로 일반적인 원리를 찾아보세요.</p>
            <ul>
                <li>탐구 결과에서 패턴이나 규칙을 찾아보세요</li>
                <li>일반적으로 적용할 수 있는 원리를 도출해보세요</li>
                <li>초기 의도했던 목표를 달성했는지 확인해보세요</li>
            </ul>
        `,
        6: `
            <h4>🌟 전이하기 단계</h4>
            <p>학습한 내용을 새로운 상황에 적용해보세요.</p>
            <ul>
                <li>학습한 원리를 다른 상황에 적용해보세요</li>
                <li>실생활에서 활용할 수 있는 방법을 생각해보세요</li>
                <li>초기 의도와 연결하여 확장해보세요</li>
            </ul>
        `
    };
    
    return guides[stage] || '<p>가이드를 준비 중입니다.</p>';
}

// 가이드 모달 닫기
function closeGuidanceModal() {
    const modal = document.querySelector('.guidance-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
} 

// 단계명 매핑
const stageNames = {
    1: '관계맺기',
    2: '집중하기', 
    3: '조사하기',
    4: '정리하기',
    5: '일반화하기',
    6: '전이하기'
};

// 단계 표시 함수
function showStage(stageNumber) {
    // 현재 활성화된 페이지 숨기기
    document.querySelectorAll('.stage-page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 새 페이지 표시
    const targetStage = document.getElementById(`stage${stageNumber}`);
    if (targetStage) {
        targetStage.classList.add('active');
        currentStage = stageNumber;
        
        // 네비게이션 업데이트
        updateNavigation();
        
        // 저장된 데이터가 있으면 복원
        restoreStageData(stageNumber);
    }
}

// 네비게이션 상태 업데이트
function updateNavigation() {
    document.querySelectorAll('.nav-stage').forEach(nav => {
        nav.classList.remove('active');
    });
    
    // 현재 단계 활성화
    const currentNav = document.querySelector(`.nav-stage[data-stage="${currentStage}"]`);
    if (currentNav) {
        currentNav.classList.add('active');
    }
    
    // 완료된 단계들 표시
    for (let i = 1; i <= 6; i++) {
        const nav = document.querySelector(`.nav-stage[data-stage="${i}"]`);
        const status = document.getElementById(`navStatus${i}`);
        
        if (stageData[i] && stageData[i].trim() !== '') {
            nav.classList.add('completed');
            if (status) status.textContent = '✓';
        } else {
            nav.classList.remove('completed');
            if (status) status.textContent = i === currentStage ? '●' : '○';
        }
    }
}

// 단계 데이터 저장
function saveStageData(stageNumber, data) {
    stageData[stageNumber] = data;
    
    // 1단계인 경우 초기 의도 설정
    if (stageNumber === 1) {
        initialIntent = data;
        updateIntentDisplay();
    }
    
    updateNavigation();
    updateProgress();
}

// 단계 데이터 복원
function restoreStageData(stageNumber) {
    const inputFields = {
        1: 'intent',
        2: 'question', 
        3: 'research',
        4: 'organize',
        5: 'generalize',
        6: 'transfer'
    };
    
    const fieldId = inputFields[stageNumber];
    const inputElement = document.getElementById(fieldId);
    
    if (inputElement && stageData[stageNumber]) {
        inputElement.value = stageData[stageNumber];
    }
}

// 의도 표시 업데이트
function updateIntentDisplay() {
    const intentDisplay = document.getElementById('intentDisplay');
    if (intentDisplay) {
        if (initialIntent && initialIntent.trim() !== '') {
            intentDisplay.textContent = initialIntent;
        } else {
            intentDisplay.textContent = '아직 설정되지 않았습니다.';
        }
    }
}

// 진행률 업데이트
function updateProgress() {
    let completedStages = 0;
    for (let i = 1; i <= 6; i++) {
        if (stageData[i] && stageData[i].trim() !== '') {
            completedStages++;
        }
    }
    
    const progress = Math.round((completedStages / 6) * 100);
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}%`;
    
    // 점수 업데이트 (임시로 완료된 단계 * 15점)
    totalScore = completedStages * 15;
    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = `${totalScore}점`;
    }
}

// 단계 제출 함수 (수정된 버전)
async function submitStage(stageNumber) {
    console.log('단계 제출 시작:', stageNumber);
    
    const inputFields = {
        1: 'intent',
        2: 'question',
        3: 'research', 
        4: 'organize',
        5: 'generalize',
        6: 'transfer'
    };
    
    const fieldId = inputFields[stageNumber];
    const inputElement = document.getElementById(fieldId);
    
    if (!inputElement) {
        showError('입력 필드를 찾을 수 없습니다.');
        return;
    }
    
    const inputValue = inputElement.value.trim();
    if (!inputValue) {
        showError('내용을 입력해주세요.');
        return;
    }
    
    try {
        // 로딩 표시
        const submitBtn = document.querySelector(`[data-stage="${stageNumber}"]`);
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '저장 중...';
        }
        
        // 1단계인 경우 초기 의도 설정
        if (stageNumber === 1) {
            initialIntent = inputValue;
            inquiryTopic = inputValue; // 탐구 주제 설정
            updateIntentDisplay();
        }
        
        // 단계 데이터 저장
        stageData[stageNumber] = inputValue;
        
        // AI 점수 계산 (간단한 버전)
        const maxScore = CONFIG.APP_SETTINGS.STAGE_MAX_SCORES[stageNumber];
        const earnedScore = Math.floor(Math.random() * (maxScore - 5)) + 5; // 5점~최대점수 사이
        
        // 단계별 점수 업데이트
        stageScores[stageNumber] = earnedScore;
        
        // Supabase에 저장
        await saveStageToDatabase(stageNumber, inputValue, earnedScore);
        
        // UI 업데이트
        updateProgress();
        updateNavigation();
        
        // 성공 메시지
        showSuccess(`${stageNumber}단계가 성공적으로 저장되었습니다!`);
        
        // 다음 단계로 이동
        if (stageNumber < 6) {
            setTimeout(() => {
                showStage(stageNumber + 1);
            }, 1000);
        } else {
            // 탐구 완료
            setTimeout(() => {
                showCompletionMessage();
            }, 1000);
        }
        
    } catch (error) {
        console.error('단계 제출 오류:', error);
        showError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        // 버튼 복원
        const submitBtn = document.querySelector(`[data-stage="${stageNumber}"]`);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = stageNumber < 6 ? '다음 단계로' : '탐구 완료';
        }
    }
}

// 단계별 데이터를 Supabase에 저장하는 함수
async function saveStageToDatabase(stageNumber, inputValue, score) {
    console.log('=== 데이터베이스 저장 시작 ===');
    console.log('현재 설정:', {
        DEMO_MODE: CONFIG.DEMO_MODE,
        stageNumber,
        inputValue: inputValue.substring(0, 50) + '...',
        score,
        currentUser: currentUser,
        supabase: !!supabase
    });
    
    if (!currentUser || !currentUser.id) {
        console.error('❌ 사용자 정보 없음');
        throw new Error('로그인된 사용자 정보가 없습니다.');
    }
    
    if (CONFIG.DEMO_MODE) {
        console.log('⚠️ 데모 모드: localStorage에 저장');
        
        // 데모 모드에서 localStorage에 저장
        const stageDataToSave = {};
        for (let i = 1; i <= 6; i++) {
            if (stageData[i]) {
                stageDataToSave[i] = {
                    input: stageData[i],
                    score: i === stageNumber ? score : 0,
                    completed: !!stageData[i]
                };
            }
        }
        
        // 총점 계산 (stageScores 배열 사용)
        let newTotalScore = 0;
        for (let i = 1; i <= 6; i++) {
            if (stageScores[i]) {
                newTotalScore += stageScores[i];
            }
        }
        
        // 진행률 계산
        const completedStages = Object.keys(stageDataToSave).length;
        const progress = Math.round((completedStages / 6) * 100);
        
        // localStorage에 저장
        const inquiryData = {
            user_id: currentUser.id,
            intent: stageNumber === 1 ? inputValue : initialIntent,
            stage: stageNumber,
            stage_data: stageDataToSave,
            total_score: newTotalScore,
            progress: progress,
            completed: false,
            updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(`inquiry_${currentUser.id}`, JSON.stringify(inquiryData));
        
        // 전역 변수 업데이트
        totalScore = newTotalScore;
        
        console.log('✅ 데모 모드 localStorage 저장 완료:', inquiryData);
        return;
    }
    
    if (!supabase) {
        console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다.');
        throw new Error('데이터베이스 연결이 없습니다.');
    }
    
    try {
        console.log('🔍 기존 탐구 데이터 조회 중...', currentUser.id);
        
        // 현재 사용자의 탐구 데이터가 있는지 확인
        const { data: existingInquiry, error: selectError } = await supabase
            .from('inquiries')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        if (selectError && selectError.code !== 'PGRST116') {
            console.error('❌ 기존 데이터 조회 오류:', selectError);
            throw selectError;
        }
        
        console.log('📋 기존 데이터 조회 결과:', existingInquiry ? '있음' : '없음');
        
        // 단계별 데이터 구조 생성
        const stageDataToSave = {};
        for (let i = 1; i <= 6; i++) {
            if (stageData[i]) {
                stageDataToSave[i] = {
                    input: stageData[i],
                    score: i === stageNumber ? score : (existingInquiry?.stage_data?.[i]?.score || 0),
                    completed: !!stageData[i]
                };
            }
        }
        
        console.log('📊 저장할 단계별 데이터:', stageDataToSave);
        
        // 총점 계산 (stageScores 배열 사용)
        let newTotalScore = 0;
        for (let i = 1; i <= 6; i++) {
            if (stageScores[i]) {
                newTotalScore += stageScores[i];
            }
        }
        
        // 진행률 계산
        const completedStages = Object.keys(stageDataToSave).length;
        const progress = Math.round((completedStages / 6) * 100);
        
        console.log('📈 계산된 점수 및 진행률:', { newTotalScore, progress, completedStages });
        
        if (existingInquiry) {
            // 기존 데이터 업데이트
            console.log('🔄 기존 탐구 데이터 업데이트 중...', existingInquiry.id);
            
            const updateData = {
                stage_data: stageDataToSave,
                total_score: newTotalScore,
                progress: progress,
                intent: stageNumber === 1 ? inputValue : existingInquiry.intent,
                stage: stageNumber,
                updated_at: new Date().toISOString()
            };
            
            console.log('📝 업데이트할 데이터:', updateData);
            
            const { data, error } = await supabase
                .from('inquiries')
                .update(updateData)
                .eq('id', existingInquiry.id)
                .select();
                
            if (error) {
                console.error('❌ 탐구 데이터 업데이트 오류:', error);
                throw error;
            }
            
            console.log('✅ 탐구 데이터 업데이트 성공:', data);
            currentInquiryId = existingInquiry.id;
            
        } else {
            // 새 데이터 생성
            console.log('🆕 새 탐구 데이터 생성 중...');
            
            const insertData = {
                user_id: currentUser.id,
                intent: stageNumber === 1 ? inputValue : '탐구 의도 미설정',
                stage: stageNumber,
                stage_data: stageDataToSave,
                total_score: newTotalScore,
                progress: progress,
                completed: false
            };
            
            console.log('📝 생성할 데이터:', insertData);
            
            const { data, error } = await supabase
                .from('inquiries')
                .insert(insertData)
                .select()
                .single();
                
            if (error) {
                console.error('❌ 탐구 데이터 생성 오류:', error);
                console.error('오류 세부사항:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }
            
            console.log('✅ 탐구 데이터 생성 성공:', data);
            currentInquiryId = data.id;
        }
        
        // 전역 변수 업데이트
        totalScore = newTotalScore;
        console.log('🎯 전역 변수 업데이트 완료:', { totalScore, currentInquiryId });
        
    } catch (error) {
        console.error('💥 데이터베이스 저장 전체 오류:', error);
        console.error('오류 스택:', error.stack);
        throw error;
    }
}

// 완료 메시지 표시
function showCompletionMessage() {
    alert('🎉 탐구 활동이 완료되었습니다!\n\n총 점수: ' + totalScore + '점\n진행률: 100%');
}

// 성공 메시지 표시
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        document.body.removeChild(successDiv);
    }, 3000);
}

// 의도 표시 업데이트
function updateIntentDisplay() {
    const intentElement = document.getElementById('initialIntent');
    if (intentElement && initialIntent) {
        intentElement.textContent = initialIntent;
    }
}

// 앱 초기화 시 1단계 표시
function initializeApp() {
    showStage(1);
    
    // 기존 데이터가 있으면 복원
    if (currentUser) {
        loadUserProgress();
    }
}

// 사용자 진행 데이터 로드
async function loadUserProgress() {
    if (!currentUser) return;
    
    try {
        if (CONFIG.DEMO_MODE) {
            // 데모 모드에서는 로컬 데이터 사용
            return;
        }
        
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
        if (data) {
            console.log('사용자 진행 데이터 로드:', data);
            
            // 기존 데이터 복원
            if (data.stage_data) {
                Object.keys(data.stage_data).forEach(stageNum => {
                    const stage = data.stage_data[stageNum];
                    if (stage && stage.input) {
                        stageData[stageNum] = stage.input;
                        
                        // 점수도 복원
                        if (stage.score) {
                            stageScores[stageNum] = stage.score;
                        }
                        
                        // 입력 필드에 데이터 복원
                        const inputFields = {
                            1: 'intent',
                            2: 'question',
                            3: 'research',
                            4: 'organize',
                            5: 'generalize',
                            6: 'transfer'
                        };
                        
                        const fieldId = inputFields[stageNum];
                        const inputElement = document.getElementById(fieldId);
                        if (inputElement) {
                            inputElement.value = stage.input;
                        }
                    }
                });
            }
            
            initialIntent = data.intent || '';
            totalScore = data.total_score || 0;
            currentStage = data.stage || 1;
            currentInquiryId = data.id;
            
            // UI 업데이트
            updateIntentDisplay();
            updateProgress();
            updateNavigation();
            showStage(currentStage);
        }
        
    } catch (error) {
        console.log('사용자 진행 데이터 로드 중 오류:', error);
    }
} 

// 설정 유효성 검사
function validateConfig() {
    if (!CONFIG) {
        console.error('CONFIG 객체가 정의되지 않았습니다.');
        return false;
    }
    
    if (!CONFIG.DEMO_MODE) {
        if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.error('Supabase 설정이 누락되었습니다.');
            return false;
        }
        
        if (!CONFIG.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            console.error('Supabase 설정이 누락되었습니다.');
            return false;
        }
    }
    
    return true;
} 

// 성찰 팝업 관련 함수들
function closeReflection() {
    const reflectionPopup = document.getElementById('reflectionPopup');
    if (reflectionPopup) {
        reflectionPopup.style.display = 'none';
    }
}

function submitReflection() {
    const answer = document.getElementById('reflectionAnswer').value.trim();
    if (answer) {
        console.log('성찰 답변 제출:', answer);
        // 성찰 데이터 저장 로직 추가 가능
        reflectionData.push({
            stage: currentStage,
            question: document.getElementById('reflectionQuestion').textContent,
            answer: answer,
            timestamp: new Date().toISOString()
        });
    }
    closeReflection();
}

// ===== 교사용 기능 =====

// 교사 비밀번호 (실제 환경에서는 더 안전한 방식 사용)
const TEACHER_PASSWORD = 'teacher2024';
let currentStudentData = null;

// 교사용 이벤트 리스너 설정
function setupTeacherEventListeners() {
    // 교사용 접속 버튼
    const teacherAccessBtn = document.getElementById('teacherAccessBtn');
    if (teacherAccessBtn) {
        teacherAccessBtn.addEventListener('click', showTeacherPasswordModal);
    }
    
    // 교사 비밀번호 모달 버튼들
    const cancelTeacherLogin = document.getElementById('cancelTeacherLogin');
    const confirmTeacherLogin = document.getElementById('confirmTeacherLogin');
    
    if (cancelTeacherLogin) {
        cancelTeacherLogin.addEventListener('click', hideTeacherPasswordModal);
    }
    
    if (confirmTeacherLogin) {
        confirmTeacherLogin.addEventListener('click', handleTeacherLogin);
    }
    
    // 교사 로그아웃
    const teacherLogoutBtn = document.getElementById('teacherLogoutBtn');
    if (teacherLogoutBtn) {
        teacherLogoutBtn.addEventListener('click', handleTeacherLogout);
    }
    
    // 대시보드로 돌아가기
    const backToDashboard = document.getElementById('backToDashboard');
    if (backToDashboard) {
        backToDashboard.addEventListener('click', showTeacherDashboard);
    }
    
    // 레포트 관련 버튼들
    const generateReportBtn = document.getElementById('generateReportBtn');
    const printReportBtn = document.getElementById('printReportBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateAIReport);
    }
    
    if (printReportBtn) {
        printReportBtn.addEventListener('click', printReport);
    }
    
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadReportPDF);
    }
    
    // Enter 키로 교사 비밀번호 입력
    const teacherPassword = document.getElementById('teacherPassword');
    if (teacherPassword) {
        teacherPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleTeacherLogin();
            }
        });
    }
}

// 교사 비밀번호 모달 표시
function showTeacherPasswordModal() {
    document.getElementById('teacherPasswordModal').style.display = 'flex';
    document.getElementById('teacherPassword').focus();
}

// 교사 비밀번호 모달 숨기기
function hideTeacherPasswordModal() {
    document.getElementById('teacherPasswordModal').style.display = 'none';
    document.getElementById('teacherPassword').value = '';
}

// 교사 로그인 처리
function handleTeacherLogin() {
    const password = document.getElementById('teacherPassword').value;
    
    if (password === TEACHER_PASSWORD) {
        hideTeacherPasswordModal();
        showTeacherDashboard();
    } else {
        showError('교사 비밀번호가 올바르지 않습니다.');
        document.getElementById('teacherPassword').value = '';
        document.getElementById('teacherPassword').focus();
    }
}

// 교사 대시보드 표시
async function showTeacherDashboard() {
    // 다른 화면 숨기기
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('studentReportPage').style.display = 'none';
    
    // 교사 대시보드 표시
    document.getElementById('teacherDashboard').style.display = 'block';
    
    // 학생 목록 로드
    await loadStudentsList();
}

// 학생 목록 로드
async function loadStudentsList() {
    const studentsGrid = document.getElementById('studentsGrid');
    studentsGrid.innerHTML = '<div class="loading">학생 목록을 불러오는 중...</div>';
    
    try {
        let students = [];
        
        if (CONFIG.DEMO_MODE) {
            // 데모 모드: localStorage에서 학생 목록 가져오기
            const demoUsers = JSON.parse(localStorage.getItem('demoUsers') || '{}');
            students = Object.values(demoUsers);
            
            // 현재 로그인한 사용자도 추가 (localStorage에 있는 경우)
            const currentDemoUser = JSON.parse(localStorage.getItem('demoUser') || '{}');
            if (currentDemoUser.id && !students.find(s => s.id === currentDemoUser.id)) {
                students.push(currentDemoUser);
            }
            
            // 데모 데이터가 없으면 샘플 데이터 생성
            if (students.length === 0) {
                const sampleStudents = [
                    {
                        id: 'demo1',
                        name: '김탐구',
                        username: 'demo1',
                        school: '탐구초등학교',
                        grade: '4',
                        class: '1',
                        number: '5'
                    },
                    {
                        id: 'demo2',
                        name: '이과학',
                        username: 'demo2',
                        school: '과학초등학교',
                        grade: '5',
                        class: '2',
                        number: '12'
                    },
                    {
                        id: 'demo3',
                        name: '박실험',
                        username: 'demo3',
                        school: '실험초등학교',
                        grade: '6',
                        class: '3',
                        number: '8'
                    }
                ];
                students = sampleStudents;
                // 샘플 데이터를 localStorage에 저장
                const demoUsers = {};
                sampleStudents.forEach(student => {
                    demoUsers[student.username] = student;
                });
                localStorage.setItem('demoUsers', JSON.stringify(demoUsers));
            }
        } else {
            // Supabase에서 학생 목록 가져오기
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            students = data || [];
        }
        
        // 학생 카드 생성
        studentsGrid.innerHTML = '';
        
        if (students.length === 0) {
            studentsGrid.innerHTML = '<div class="no-students">등록된 학생이 없습니다.</div>';
            return;
        }
        
        for (const student of students) {
            const studentCard = await createStudentCard(student);
            studentsGrid.appendChild(studentCard);
        }
        
    } catch (error) {
        console.error('학생 목록 로드 오류:', error);
        studentsGrid.innerHTML = '<div class="error">학생 목록을 불러올 수 없습니다.</div>';
    }
}

// 학생 카드 생성
async function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.onclick = () => showStudentReport(student);
    
    // 진행률과 점수 계산
    let progress = 0;
    let totalScore = 0;
    
    try {
        const studentData = await loadStudentData(student);
        if (studentData && studentData.stages) {
            // 완료된 단계 수 계산
            const completedStages = Object.keys(studentData.stages).filter(stage => 
                studentData.stages[stage] && studentData.stages[stage].input
            ).length;
            progress = Math.round((completedStages / 6) * 100);
            
            // 총점 계산
            Object.values(studentData.stages).forEach(stage => {
                if (stage && stage.score) {
                    totalScore += stage.score;
                }
            });
        } else {
            // 데이터가 없으면 랜덤 값 (데모용)
            progress = Math.floor(Math.random() * 100);
            totalScore = Math.floor(Math.random() * 90);
        }
    } catch (error) {
        console.log('학생 데이터 로드 중 오류:', error);
        // 오류 시 기본값
        progress = 0;
        totalScore = 0;
    }
    
    card.innerHTML = `
        <div class="student-info">
            <h3>${student.name}</h3>
            <p>🏫 ${student.school}</p>
            <p>📚 ${student.grade}학년 ${student.class}반 ${student.number}번</p>
            <p>🆔 ${student.username}</p>
        </div>
        <div class="student-progress">
            <div class="progress-info">
                <span>진행률</span>
                <span>${progress}%</span>
            </div>
            <div class="progress-bar-mini">
                <div class="progress-fill-mini" style="width: ${progress}%"></div>
            </div>
            <div class="progress-info" style="margin-top: 10px;">
                <span>총점</span>
                <span><strong>${totalScore}점</strong></span>
            </div>
        </div>
    `;
    
    return card;
}

// 개별 학생 레포트 표시
async function showStudentReport(student) {
    // 다른 화면 숨기기
    document.getElementById('teacherDashboard').style.display = 'none';
    
    // 레포트 페이지 표시
    document.getElementById('studentReportPage').style.display = 'block';
    document.getElementById('reportStudentName').textContent = `${student.name} 학생 탐구학습 레포트`;
    
    // 현재 학생 데이터 저장
    currentStudentData = student;
    
    // 학생 데이터 로드 및 레포트 생성
    await generateStudentReport(student);
}

// 학생 레포트 생성
async function generateStudentReport(student) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = '<div class="loading">레포트를 생성하는 중...</div>';
    
    try {
        // 학생의 탐구 데이터 로드
        let studentData = await loadStudentData(student);
        
        // 레포트 HTML 생성
        const reportHTML = createReportHTML(student, studentData);
        reportContent.innerHTML = reportHTML;
        
    } catch (error) {
        console.error('레포트 생성 오류:', error);
        reportContent.innerHTML = '<div class="error">레포트를 생성할 수 없습니다.</div>';
    }
}

// 학생 데이터 로드
async function loadStudentData(student) {
    console.log('학생 데이터 로드 시작:', student);
    
    if (CONFIG.DEMO_MODE) {
        console.log('데모 모드: localStorage에서 학생 데이터 로드 시도', student.id);
        
        // localStorage에서 실제 학생 데이터 찾기
        const inquiryData = localStorage.getItem(`inquiry_${student.id}`);
        
        if (inquiryData) {
            console.log('✅ localStorage에서 실제 데이터 발견');
            const parsedData = JSON.parse(inquiryData);
            
            // 데이터 형식을 교사 레포트에 맞게 변환
            return {
                stages: parsedData.stage_data || {},
                totalScore: parsedData.total_score || 0,
                progress: parsedData.progress || 0,
                initialIntent: parsedData.intent || '탐구 의도 미설정'
            };
        } else {
            console.log('⚠️ localStorage에 실제 데이터 없음, 기본 샘플 데이터 사용');
            
            // 기본 샘플 데이터 생성
            const demoData = {
                stages: {
                    1: { input: '식물이 빛을 향해 자라는 이유가 궁금합니다. 왜 식물들은 항상 해를 향해서 자랄까요?', score: 8 },
                    2: { input: '햇빛의 양에 따라 식물의 성장 속도가 어떻게 달라질까요? 어둠에서도 식물이 자랄 수 있을까요?', score: 12 },
                    3: { input: '콩나물을 세 그룹으로 나누어 어둠, 약한 빛, 강한 빛에서 키워보며 매일 길이를 측정했습니다. 일주일간 관찰한 결과를 기록했습니다.', score: 18 },
                    4: { input: '강한 빛에서 자란 콩나물이 평균 12cm로 가장 길었고, 약한 빛에서는 8cm, 어둠에서는 5cm였습니다. 색깔도 빛이 강할수록 더 초록색이었습니다.', score: 13 },
                    5: { input: '식물은 광합성을 통해 에너지를 만들기 때문에 빛이 필요하다는 것을 알았습니다. 빛이 부족하면 제대로 자라지 못합니다.', score: 9 },
                    6: { input: '집에서 화분을 키울 때 햇빛이 잘 드는 곳에 두어야겠습니다. 또한 학교 화단의 식물들도 그늘에 있는 것들은 다른 곳으로 옮겨주면 좋겠습니다.', score: 17 }
                },
                totalScore: 77,
                progress: 100,
                initialIntent: '식물이 빛을 향해 자라는 이유가 궁금합니다.'
            };
            
            // 학생별로 다른 데이터 생성
            if (student.username === 'demo2') {
                demoData.stages[1].input = '물의 온도가 식물 성장에 미치는 영향이 궁금합니다.';
                demoData.initialIntent = '물의 온도가 식물 성장에 미치는 영향이 궁금합니다.';
                demoData.totalScore = 82;
            } else if (student.username === 'demo3') {
                demoData.stages[1].input = '음악이 식물 성장에 도움이 될까요?';
                demoData.initialIntent = '음악이 식물 성장에 도움이 될까요?';
                demoData.totalScore = 65;
            }
            
            return demoData;
        }
    } else {
        // 실제 Supabase에서 데이터 로드
        try {
            console.log('Supabase에서 학생 데이터 조회 중...', student.id);
            
            const { data, error } = await supabase
                .from('inquiries')
                .select('*')
                .eq('user_id', student.id)
                .single();
                
            if (error) {
                console.log('학생 탐구 데이터가 없습니다:', error.message);
                // 데이터가 없으면 빈 구조 반환
                return {
                    stages: {
                        1: { input: '아직 입력하지 않았습니다.', score: 0 },
                        2: { input: '아직 입력하지 않았습니다.', score: 0 },
                        3: { input: '아직 입력하지 않았습니다.', score: 0 },
                        4: { input: '아직 입력하지 않았습니다.', score: 0 },
                        5: { input: '아직 입력하지 않았습니다.', score: 0 },
                        6: { input: '아직 입력하지 않았습니다.', score: 0 }
                    },
                    totalScore: 0,
                    progress: 0,
                    initialIntent: '아직 설정하지 않았습니다.'
                };
            }
            
            console.log('Supabase에서 로드된 데이터:', data);
            
            // Supabase 데이터를 교사 레포트 형식으로 변환
            const formattedData = {
                stages: data.stage_data || {},
                totalScore: data.total_score || 0,
                progress: data.progress || 0,
                initialIntent: data.intent || '탐구 의도 미설정'
            };
            
            // stages 데이터가 비어있으면 기본 구조 생성
            if (!formattedData.stages || Object.keys(formattedData.stages).length === 0) {
                formattedData.stages = {
                    1: { input: '아직 입력하지 않았습니다.', score: 0 },
                    2: { input: '아직 입력하지 않았습니다.', score: 0 },
                    3: { input: '아직 입력하지 않았습니다.', score: 0 },
                    4: { input: '아직 입력하지 않았습니다.', score: 0 },
                    5: { input: '아직 입력하지 않았습니다.', score: 0 },
                    6: { input: '아직 입력하지 않았습니다.', score: 0 }
                };
            }
            
            return formattedData;
            
        } catch (error) {
            console.error('Supabase 데이터 로드 오류:', error);
            // 오류 시 기본 구조 반환
            return {
                stages: {
                    1: { input: '데이터 로드 오류', score: 0 },
                    2: { input: '데이터 로드 오류', score: 0 },
                    3: { input: '데이터 로드 오류', score: 0 },
                    4: { input: '데이터 로드 오류', score: 0 },
                    5: { input: '데이터 로드 오류', score: 0 },
                    6: { input: '데이터 로드 오류', score: 0 }
                },
                totalScore: 0,
                progress: 0,
                initialIntent: '데이터 로드 오류'
            };
        }
    }
}

// 레포트 HTML 생성
function createReportHTML(student, data) {
    const stageNames = {
        1: '관계맺기', 2: '집중하기', 3: '조사하기',
        4: '정리하기', 5: '일반화하기', 6: '전이하기'
    };
    
    let stagesHTML = '';
    let totalScore = 0;
    
    for (let i = 1; i <= 6; i++) {
        const stageData = data.stages[i] || { input: '미완료', score: 0 };
        totalScore += stageData.score;
        
        stagesHTML += `
            <div class="report-section">
                <h3>${i}단계: ${stageNames[i]} <span class="stage-score">${stageData.score}점</span></h3>
                <div class="stage-data">
                    <p><strong>학생 응답:</strong></p>
                    <p>${stageData.input}</p>
                </div>
            </div>
        `;
    }
    
    // 레벨 계산
    const level = getLevelText(totalScore);
    
    return `
        <div class="report-header-info">
            <h2>📋 ${student.name} 학생 탐구학습 레포트</h2>
            <div class="student-details">
                <p><strong>학교:</strong> ${student.school}</p>
                <p><strong>학급:</strong> ${student.grade}학년 ${student.class}반 ${student.number}번</p>
                <p><strong>아이디:</strong> ${student.username}</p>
                <p><strong>작성일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
            </div>
        </div>
        
        <div class="report-section">
            <h3>🎯 초기 탐구 의도</h3>
            <div class="stage-data">
                <p>${data.initialIntent}</p>
            </div>
        </div>
        
        ${stagesHTML}
        
        <div class="total-score">
            <h3>📊 총점: ${totalScore}/90점 (${Math.round((totalScore/90)*100)}%)</h3>
            <p>탐구 수준: ${level}</p>
            <p>진행률: ${data.progress}%</p>
        </div>
        
        <div class="report-section">
            <h3>🤖 AI 교사 코멘트</h3>
            <div class="ai-comment" id="aiComment">
                <p><em>AI 레포트 생성 버튼을 클릭하여 상세한 피드백을 받아보세요.</em></p>
            </div>
        </div>
    `;
}

// AI 레포트 생성
async function generateAIReport() {
    const aiComment = document.getElementById('aiComment');
    const generateBtn = document.getElementById('generateReportBtn');
    
    if (!currentStudentData) {
        showError('학생 데이터를 찾을 수 없습니다.');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = '생성 중...';
    aiComment.innerHTML = '<p><em>AI가 레포트를 분석하고 있습니다...</em></p>';
    
    try {
        // 현재 학생 데이터 로드
        const studentData = await loadStudentData(currentStudentData);
        
        // AI 프롬프트 생성
        let stageInputs = '';
        for (let i = 1; i <= 6; i++) {
            const stageNames = ['관계맺기', '집중하기', '조사하기', '정리하기', '일반화하기', '전이하기'];
            const stageData = studentData.stages[i] || { input: '미완료', score: 0 };
            stageInputs += `${i}단계(${stageNames[i-1]}): ${stageData.input} (${stageData.score}점)\n`;
        }
        
        const prompt = `다음은 초등학생 ${currentStudentData.name}(${currentStudentData.grade}학년)의 탐구학습 결과입니다. 교사 관점에서 400자 내외의 종합적인 피드백을 작성해주세요.

초기 탐구 의도: ${studentData.initialIntent}

단계별 활동 내용:
${stageInputs}

총점: ${studentData.totalScore}/90점

다음 내용을 포함해주세요:
1. 학생의 탐구 능력과 성장점
2. 잘한 부분에 대한 구체적인 칭찬
3. 개선이 필요한 부분과 제안사항
4. 앞으로의 학습 방향 제시

친근하고 격려하는 톤으로 작성해주세요.`;

        // Gemini API 호출
        let feedback = null;
        if (CONFIG.AI_COACH.ENABLED) {
            feedback = await callGeminiAPI(prompt);
        }
        
        if (feedback) {
            aiComment.innerHTML = `<p>${feedback}</p>`;
        } else {
            // AI 호출 실패 시 기본 코멘트 제공
            const defaultFeedback = generateDefaultFeedback(currentStudentData, studentData);
            aiComment.innerHTML = `<p>${defaultFeedback}</p>`;
        }
        
    } catch (error) {
        console.error('AI 레포트 생성 오류:', error);
        const defaultFeedback = generateDefaultFeedback(currentStudentData, await loadStudentData(currentStudentData));
        aiComment.innerHTML = `<p>${defaultFeedback}</p>`;
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '🤖 AI 레포트 생성';
    }
}

// 기본 피드백 생성 (AI 실패 시 사용)
function generateDefaultFeedback(student, data) {
    const score = data.totalScore;
    const name = student.name;
    
    let feedback = `${name} 학생은 탐구 과정에서 `;
    
    if (score >= 70) {
        feedback += `체계적이고 논리적인 사고를 보여주었습니다. 특히 초기 의도를 명확히 설정하고 이를 바탕으로 단계별 탐구를 진행한 점이 매우 인상적입니다. 관찰과 실험을 통해 얻은 결과를 바탕으로 일반화까지 이어간 과정이 훌륭합니다. 앞으로도 이런 탐구 정신을 유지하며 더 깊이 있는 학습을 이어가기를 바랍니다.`;
    } else if (score >= 50) {
        feedback += `기본적인 탐구 과정을 잘 이해하고 있습니다. 각 단계별로 성실하게 활동한 모습이 보입니다. 앞으로는 더 구체적인 관찰과 분석을 통해 깊이 있는 탐구를 해보면 좋겠습니다. 특히 결과를 정리하고 일반화하는 과정에서 더 많은 생각과 노력을 기울여보세요.`;
    } else {
        feedback += `탐구 활동에 참여한 것을 격려합니다. 앞으로는 각 단계별로 더 자세하고 구체적으로 기록해보세요. 궁금한 점을 명확히 하고, 관찰한 내용을 꼼꼼히 적어보는 것부터 시작하면 좋겠습니다. 선생님과 함께 차근차근 탐구하는 방법을 익혀나가봅시다.`;
    }
    
    return feedback;
}

// 레포트 프린트
function printReport() {
    window.print();
}

// PDF 다운로드
function downloadReportPDF() {
    // HTML을 PDF로 변환하는 간단한 방법
    // 실제로는 jsPDF나 다른 라이브러리 사용 권장
    if (typeof window.jsPDF !== 'undefined') {
        try {
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const reportContent = document.getElementById('reportContent');
            const studentName = currentStudentData ? currentStudentData.name : '학생';
            
            // PDF 제목
            doc.setFontSize(16);
            doc.text(`${studentName} 탐구학습 레포트`, 20, 20);
            
            // 간단한 텍스트 추출 및 PDF 생성
            const textContent = reportContent.innerText;
            const lines = doc.splitTextToSize(textContent, 170);
            
            doc.setFontSize(10);
            doc.text(lines, 20, 40);
            
            doc.save(`${studentName}_탐구학습_레포트.pdf`);
            
        } catch (error) {
            console.error('PDF 생성 오류:', error);
            alert('PDF 생성 중 오류가 발생했습니다. 프린트 기능을 사용해주세요.');
            printReport();
        }
    } else {
        // jsPDF가 없으면 프린트로 대체
        alert('PDF 다운로드를 위해 프린트 기능을 사용합니다.');
        printReport();
    }
}

// 교사 로그아웃
function handleTeacherLogout() {
    document.getElementById('teacherDashboard').style.display = 'none';
    document.getElementById('studentReportPage').style.display = 'none';
    document.getElementById('authContainer').style.display = 'flex';
    currentStudentData = null;
}

// ===== 이미지 관련 함수들 =====

// 전역 변수 - 이미지 저장
let stageImages = {};
let inquiryTopic = '';

// 이미지 업로드 처리
async function handleImageUpload(stage, input) {
    const file = input.files[0];
    if (!file) return;
    
    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
        showError('이미지 파일만 업로드할 수 있습니다.');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        showError('이미지 크기는 5MB 이하여야 합니다.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const previewContainer = document.getElementById(`stage${stage}ImagePreview`);
        previewContainer.innerHTML = `
            <div class="image-preview-item">
                <img src="${e.target.result}" alt="업로드된 이미지" class="preview-image">
                <div class="image-feedback-section">
                    <button class="btn-image-feedback" onclick="getImageFeedback(${stage})">💡 이미지 피드백 받기</button>
                    <div class="image-analysis-status" id="analysisStatus${stage}" style="display: none;"></div>
                </div>
                <button type="button" onclick="removeImage(${stage})" class="remove-image-btn">삭제</button>
            </div>
        `;
        
        // 이미지 데이터 저장
        stageImages[stage] = {
            file: file,
            dataUrl: e.target.result
        };
    };
    
    reader.readAsDataURL(file);
}

// 이미지 피드백 받기
async function getImageFeedback(stage) {
    const statusElement = document.getElementById(`analysisStatus${stage}`);
    const feedbackBtn = document.querySelector(`button[onclick="getImageFeedback(${stage})"]`);
    
    if (!statusElement || !stageImages[stage]) return;
    
    statusElement.style.display = 'block';
    statusElement.innerHTML = '<div class="analysis-loading">🔍 이미지 분석 중...</div>';
    feedbackBtn.disabled = true;
    feedbackBtn.textContent = '분석 중...';
    
    try {
        if (CONFIG.AI_COACH.ENABLED && inquiryTopic) {
            await analyzeImageSuitabilityWithStructuredFeedback(stage, stageImages[stage].dataUrl);
        } else {
            // AI가 비활성화된 경우 기본 피드백
            displayStructuredImageFeedback(stage, null);
        }
    } catch (error) {
        console.error('이미지 분석 오류:', error);
        statusElement.innerHTML = '<div class="analysis-error">⚠️ 이미지 분석 중 오류가 발생했습니다.</div>';
    } finally {
        feedbackBtn.style.display = 'none'; // 피드백 후 버튼 숨김
    }
}

// AI를 통한 이미지 적합성 분석
async function analyzeImageSuitabilityWithStructuredFeedback(stage, imageDataUrl) {
    const stageNames = {
        1: '관계맺기', 2: '집중하기', 3: '조사하기',
        4: '조직 및 정리하기', 5: '일반화하기', 6: '전이하기'
    };
    
    const stageDescriptions = {
        1: '탐구 주제에 대한 호기심을 갖고 초기 의도를 설정하는 단계',
        2: '탐구 질문을 구체적으로 만드는 단계',
        3: '다양한 방법으로 정보를 수집하고 탐구하는 단계',
        4: '수집한 정보를 정리하고 분석하는 단계',
        5: '탐구 결과를 바탕으로 일반적인 원리나 법칙을 찾는 단계',
        6: '배운 내용을 다른 상황에 적용하는 단계'
    };
    
    const userText = document.getElementById(`stage${stage}Input`)?.value || '';
    
    const structuredPrompt = `
    다음 이미지를 분석하여 개조식으로 구조화된 피드백을 제공해주세요.
    
    탐구 주제: ${inquiryTopic}
    현재 단계: ${stage}단계 - ${stageNames[stage]} (${stageDescriptions[stage]})
    학생이 작성한 내용: ${userText}
    
    다음 형식으로 분석해주세요:
    
    1. 탐구 단계 적합성 분석
    - 업로드한 이미지가 현재 ${stageNames[stage]} 단계에 얼마나 적합한지 평가
    - 탐구 주제와의 연관성 분석
    
    2. 탐구 피드백  
    - 잘한 점과 좋은 점들을 개조식으로 간단명료하게 언급 (3-4개 항목, 각 1줄)
    - 탐구 주제 및 단계에 맞게 올린 점에 대한 칭찬
    
    3. 후속 탐구 활용 방안
    - 업로드한 자료를 다음 탐구 활동에 어떻게 활용할 수 있는지 제안
    - 이어갈 수 있는 탐구 방향 제시
    
    4. 추가 자료 제안
    - 학생의 텍스트 내용을 바탕으로 더 추가하면 좋을 자료 제안
    - 관련 뉴스 기사나 참고 자료 링크 형태로 제공
    
    응답은 학생 친화적이고 격려하는 톤으로 작성하고, 기술적 용어나 JSON 형태는 사용하지 마세요.
    `;
    
    try {
        const response = await callGeminiVisionAPI(structuredPrompt, imageDataUrl);
        displayStructuredImageFeedback(stage, response);
    } catch (error) {
        console.error('Gemini Vision API 오류:', error);
        displayStructuredImageFeedback(stage, null);
    }
}

// Gemini Vision API 호출
async function callGeminiVisionAPI(prompt, imageDataUrl) {
    if (!CONFIG.AI_COACH.ENABLED) {
        throw new Error('AI 코치가 비활성화되어 있습니다.');
    }
    
    try {
        const base64Data = imageDataUrl.split(',')[1];
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.AI_COACH.GEMINI_API_KEY}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Data
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: CONFIG.AI_COACH.TEMPERATURE,
                    maxOutputTokens: CONFIG.AI_COACH.MAX_TOKENS,
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Gemini Vision API 오류: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }
        
        throw new Error('올바르지 않은 API 응답 형식');
    } catch (error) {
        console.error('Gemini Vision API 호출 오류:', error);
        throw error;
    }
}

// 구조화된 이미지 피드백 표시
function displayStructuredImageFeedback(stage, analysis) {
    const statusElement = document.getElementById(`analysisStatus${stage}`);
    if (!statusElement) return;
    
    const structuredFeedback = generateStructuredImageFeedback(stage, analysis);
    
    statusElement.innerHTML = `
        <div class="analysis-complete">
            <div class="structured-feedback">
                <h4>📊 이미지 분석 결과</h4>
                <div class="feedback-item">
                    <strong>1️⃣ 탐구 단계 적합성 분석</strong>
                    <p>${structuredFeedback.stageCompatibility}</p>
                </div>
                <div class="feedback-item">
                    <strong>2️⃣ ${getStageNames()[stage]} 피드백</strong>
                    <div class="concise-feedback">
                        ${structuredFeedback.positiveFeedback}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 구조화된 이미지 피드백 생성
function generateStructuredImageFeedback(stage, analysis) {
    const stageName = getStageNames()[stage];
    
    if (analysis && typeof analysis === 'object' && analysis.feedback) {
        return {
            stageCompatibility: analysis.stageCompatibility || `업로드하신 이미지가 ${stageName} 단계에 적절합니다.`,
            positiveFeedback: `
                <ul>
                    <li>탐구 주제 '${inquiryTopic}'와 관련된 시각적 자료를 준비한 점이 훌륭합니다.</li>
                    <li>${stageName} 단계에 적합한 이미지를 선택했습니다.</li>
                    <li>탐구 과정을 이미지로 기록하려는 노력이 보입니다.</li>
                </ul>
            `,
            followUpSuggestions: analysis.followUpSuggestions || '',
            additionalResources: analysis.additionalResources || ''
        };
    } else if (analysis && typeof analysis === 'string') {
        // AI 응답을 파싱하여 구조화
        const cleanedAnalysis = cleanImageFeedback(analysis);
        return {
            stageCompatibility: `업로드하신 이미지가 ${stageName} 단계에 적절합니다.`,
            positiveFeedback: `
                <ul>
                    <li>탐구 주제 '${inquiryTopic}'와 관련된 시각적 자료를 준비한 점이 좋습니다.</li>
                    <li>${stageName} 단계에 적절한 이미지를 업로드했습니다.</li>
                    <li>탐구 활동을 시각적으로 기록하려는 시도가 훌륭합니다.</li>
                </ul>
            `,
            followUpSuggestions: '',
            additionalResources: ''
        };
    } else {
        // 기본 피드백
        return {
            stageCompatibility: `업로드하신 이미지가 ${stageName} 단계에서 활용하기 좋습니다.`,
            positiveFeedback: `
                <ul>
                    <li>탐구 주제 '${inquiryTopic}'와 관련된 시각적 자료를 준비해주셔서 좋습니다.</li>
                    <li>${stageName} 단계에서 이미지 자료를 활용하려는 의도가 좋습니다.</li>
                    <li>탐구 과정을 다양한 방법으로 기록하려는 노력이 보입니다.</li>
                </ul>
            `,
            followUpSuggestions: '',
            additionalResources: ''
        };
    }
}

// 이미지 피드백 정리 함수
function cleanImageFeedback(feedback) {
    if (!feedback) return '';
    
    let cleaned = feedback;
    
    // 기술적 용어 제거
    cleaned = cleaned.replace(/js0n/gi, '');
    cleaned = cleaned.replace(/stagAppropriate/gi, '');
    cleaned = cleaned.replace(/json/gi, '');
    cleaned = cleaned.replace(/\{|\}/g, '');
    cleaned = cleaned.replace(/\[|\]/g, '');
    cleaned = cleaned.replace(/"/g, '');
    
    // 불필요한 공백 정리
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// 이미지 제거
function removeImage(stage) {
    const previewContainer = document.getElementById(`stage${stage}ImagePreview`);
    const fileInput = document.getElementById(`stage${stage}Image`);
    
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    
    if (fileInput) {
        fileInput.value = '';
    }
    
    delete stageImages[stage];
}

// 단계명 매핑 함수
function getStageNames() {
    return {
        1: '관계맺기',
        2: '집중하기', 
        3: '조사하기',
        4: '조직 및 정리하기',
        5: '일반화하기',
        6: '전이하기'
    };
}

// 텍스트 피드백 받기
async function getTextFeedback(stage) {
    const inputElement = document.getElementById(`stage${stage}Input`);
    const feedbackSection = document.getElementById(`stage${stage}TextFeedback`);
    const stageName = getStageNames()[stage];
    
    if (!inputElement || !feedbackSection) return;
    
    const userText = inputElement.value.trim();
    if (!userText) {
        showError('먼저 내용을 입력해주세요.');
        return;
    }
    
    // 로딩 상태 표시
    feedbackSection.innerHTML = `<h4>🤖 ${stageName} 피드백 생성 중...</h4><p>잠시만 기다려주세요.</p>`;
    
    try {
        let feedback = '';
        
        if (CONFIG.AI_COACH.ENABLED) {
            // AI 피드백 생성 (실제 구현 시 callGeminiAPI 사용)
            feedback = `${stageName} 단계에서 작성하신 내용이 매우 좋습니다. 탐구 주제에 대한 깊이 있는 사고가 돋보입니다.`;
        } else {
            feedback = `${stageName} 단계를 잘 완료하셨습니다. 계속해서 다음 단계로 진행해보세요.`;
        }
        
        feedbackSection.innerHTML = `<h4>💡 ${stageName} 피드백</h4><p>${feedback}</p>`;
        
    } catch (error) {
        console.error('텍스트 피드백 생성 오류:', error);
        feedbackSection.innerHTML = `<h4>⚠️ 피드백 생성 오류</h4><p>피드백 생성 중 오류가 발생했습니다.</p>`;
    }
}

// 후속 탐구 활용 방안 표시
function showStageFollowUp(stage) {
    const followUpContent = document.getElementById(`stageFollowUp${stage}`);
    const button = document.querySelector(`button[onclick="showStageFollowUp(${stage})"]`);
    
    if (followUpContent && button) {
        if (followUpContent.style.display === 'none') {
            generateStageFollowUp(stage); // 내용 생성
            followUpContent.style.display = 'block';
            button.textContent = '🔼 후속 탐구 활용 방안 및 추가 자료 숨기기';
        } else {
            followUpContent.style.display = 'none';
            button.textContent = '💡 후속 탐구 활용 방안 및 추가 자료 보기';
        }
    }
}

// 단계별 후속 방안 생성
function generateStageFollowUp(stage) {
    const userText = document.getElementById(`stage${stage}Input`)?.value || '';
    const hasImage = stageImages[stage] ? true : false;
    
    // 후속 제안 생성
    const followUpSuggestions = getStageFollowUpSuggestions(stage, userText, hasImage);
    document.getElementById(`followUpSuggestions${stage}`).innerHTML = followUpSuggestions;
    
    // 추가 자료 생성
    const additionalResources = generateStageAdditionalResources(stage, userText, inquiryTopic);
    document.getElementById(`additionalResources${stage}`).innerHTML = additionalResources;
}

// 단계별 후속 제안
function getStageFollowUpSuggestions(stage, userText, hasImage) {
    const suggestions = {
        1: `
            <ul>
                <li>관심 있는 주제를 더 구체적으로 세분화해보세요</li>
                <li>주변 사람들에게 같은 주제에 대한 생각을 물어보세요</li>
                <li>관련 책이나 자료를 찾아 기초 지식을 쌓아보세요</li>
                <li>실제로 관찰할 수 있는 현상인지 확인해보세요</li>
            </ul>
        `,
        2: `
            <ul>
                <li>질문을 더 구체적이고 측정 가능하게 만들어보세요</li>
                <li>가설을 세워보고 예상되는 결과를 적어보세요</li>
                <li>어떤 방법으로 답을 찾을지 계획을 세워보세요</li>
                <li>필요한 도구나 재료를 미리 준비해보세요</li>
            </ul>
        `,
        3: `
            <ul>
                <li>다양한 출처에서 정보를 수집해보세요</li>
                <li>직접 실험이나 관찰을 해보세요</li>
                <li>전문가나 선생님께 조언을 구해보세요</li>
                <li>수집한 자료를 체계적으로 정리해보세요</li>
            </ul>
        `,
        4: `
            <ul>
                <li>수집한 데이터를 표나 그래프로 정리해보세요</li>
                <li>패턴이나 규칙성을 찾아보세요</li>
                <li>예상했던 결과와 실제 결과를 비교해보세요</li>
                <li>의외의 발견이나 예외 상황을 분석해보세요</li>
            </ul>
        `,
        5: `
            <ul>
                <li>발견한 원리가 다른 상황에도 적용되는지 확인해보세요</li>
                <li>비슷한 현상들과 연결지어 생각해보세요</li>
                <li>일반적인 법칙이나 원리로 정리해보세요</li>
                <li>다른 사람들과 토론하며 생각을 발전시켜보세요</li>
            </ul>
        `,
        6: `
            <ul>
                <li>학습한 내용을 실생활 문제 해결에 적용해보세요</li>
                <li>다른 교과목이나 분야와 연결해보세요</li>
                <li>새로운 상황에서 어떻게 활용할지 계획해보세요</li>
                <li>배운 내용을 다른 사람에게 설명해보세요</li>
            </ul>
        `
    };
    
    return suggestions[stage] || '<p>이 단계에서 학습한 내용을 바탕으로 다음 활동을 계획해보세요.</p>';
}

// 추가 자료 제안 생성
function generateStageAdditionalResources(stage, userText, topic) {
    const baseResources = `
        <div class="resource-links">
            <a href="https://www.google.com/search?q=${encodeURIComponent(topic + ' 뉴스')}" target="_blank" class="resource-link">📰 관련 뉴스 검색</a>
            <a href="https://www.google.com/search?q=${encodeURIComponent(topic + ' 교육자료')}" target="_blank" class="resource-link">📚 교육 자료 검색</a>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}" target="_blank" class="resource-link">🎥 관련 동영상 검색</a>
            <a href="https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}" target="_blank" class="resource-link">🔬 학술 자료 검색</a>
        </div>
    `;
    
    return baseResources;
} 