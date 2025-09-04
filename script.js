// 의도기반 탐구학습 시스템 - 메인 스크립트

// ===== 전역 변수 =====
var currentUser = null;
var currentStage = 'setup';
var inquirySettings = {};
var stageData = {};
var stageScores = {};
var stageEvaluations = {};
var totalScore = 0;
var initialIntent = '';
var currentInquiryId = null;
var supabase = null;
var aiCoachEnabled = true;

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM 로드 완료');
    
    // CONFIG 유효성 검사
    if (!validateConfig()) {
        console.error('설정 오류가 발생했습니다.');
        return;
    }
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 인증 상태 확인
    await checkAuthState();
    
    console.log('애플리케이션 초기화 완료');
});

// 설정 유효성 검사
function validateConfig() {
    if (!CONFIG) {
        console.error('CONFIG 객체가 정의되지 않았습니다.');
        return false;
    }
    return true;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    console.log('이벤트 리스너 설정 시작');
    
    // 탐구 시작하기 버튼 이벤트
    const startInquiryBtn = document.getElementById('startInquiryBtn');
    if (startInquiryBtn) {
        startInquiryBtn.addEventListener('click', function(e) {
            console.log('탐구 시작하기 버튼 클릭됨!');
            e.preventDefault();
            showAuthContainer();
        });
        console.log('탐구 시작하기 버튼 이벤트 리스너 등록 완료');
    } else {
        console.error('startInquiryBtn 요소를 찾을 수 없습니다!');
    }
    
    // 로그인 폼 submit 이벤트
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleDemoLogin();
        });
        console.log('로그인 폼 이벤트 리스너 등록 완료');
    }
    
    // 회원가입 폼 submit 이벤트
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleDemoSignup();
        });
        console.log('회원가입 폼 이벤트 리스너 등록 완료');
    }
    
    // 폼 전환 버튼들
    const showSignupBtn = document.getElementById('showSignupBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', function() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('signupForm').style.display = 'block';
        });
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function() {
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        });
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
        console.log('로그아웃 버튼 이벤트 리스너 등록 완료');
    }
    
    // 교사용 접속 버튼
    const teacherAccessBtn = document.getElementById('teacherAccessBtn');
    if (teacherAccessBtn) {
        teacherAccessBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showTeacherPasswordModal();
        });
        console.log('교사용 접속 버튼 이벤트 리스너 등록 완료');
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
    
    // 교사 로그아웃 버튼
    const teacherLogoutBtn = document.getElementById('teacherLogoutBtn');
    if (teacherLogoutBtn) {
        teacherLogoutBtn.addEventListener('click', handleTeacherLogout);
    }
    
    // 교사 비밀번호 입력 필드 Enter 키 처리
    const teacherPassword = document.getElementById('teacherPassword');
    if (teacherPassword) {
        teacherPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleTeacherLogin();
            }
        });
    }
    
    // 탐구 형태 선택 변경 이벤트
    const inquiryTypeRadios = document.querySelectorAll('input[name="inquiryType"]');
    inquiryTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleInquiryTypeChange);
    });
    
    // 단계 이동 버튼들 이벤트 리스너 등록
    setupStageNavigationListeners();
    
    console.log('모든 이벤트 리스너 설정 완료');
}

// 대문 페이지에서 로그인 화면으로 전환
function showAuthContainer() {
    console.log('showAuthContainer 함수 실행 시작');
    
    const welcomeContainer = document.getElementById('welcomeContainer');
    const authContainer = document.getElementById('authContainer');
    
    if (welcomeContainer) {
        welcomeContainer.style.display = 'none';
        console.log('welcomeContainer 숨김 완료');
    } else {
        console.error('welcomeContainer를 찾을 수 없습니다!');
    }
    
    if (authContainer) {
        authContainer.style.display = 'flex';
        console.log('authContainer 표시 완료');
    } else {
        console.error('authContainer를 찾을 수 없습니다!');
    }
    
    console.log('대문 페이지에서 로그인 화면으로 전환 완료');
}

// 인증 상태 확인
async function checkAuthState() {
    if (CONFIG.DEMO_MODE) {
        // 교사 로그인 상태 확인
        const savedTeacher = localStorage.getItem('teacherUser');
        if (savedTeacher) {
            currentUser = JSON.parse(savedTeacher);
            showTeacherDashboard();
            return;
        }
        
        // 학생 로그인 상태 확인
        const savedUser = localStorage.getItem('demoUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            await showMainApp();
        } else {
            // 로그인된 사용자가 없으면 대문 페이지 표시
            showWelcomePage();
        }
        return;
    }
    
    // 로그인된 사용자가 없으면 대문 페이지 표시
    showWelcomePage();
}

// 대문 페이지 표시
function showWelcomePage() {
    const welcomeContainer = document.getElementById('welcomeContainer');
    const authContainer = document.getElementById('authContainer');
    const mainApp = document.getElementById('mainApp');
    
    if (welcomeContainer) {
        welcomeContainer.style.display = 'flex';
    }
    
    if (authContainer) {
        authContainer.style.display = 'none';
    }
    
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    
    console.log('대문 페이지 표시');
}

// 메인 앱 표시
async function showMainApp() {
    try {
        // 모든 컨테이너 숨기기
        const welcomeContainer = document.getElementById('welcomeContainer');
        const authContainer = document.getElementById('authContainer');
        const mainApp = document.getElementById('mainApp');
        
        if (welcomeContainer) {
            welcomeContainer.style.display = 'none';
        }
        
        if (authContainer) {
            authContainer.style.display = 'none';
        }
        
        // 메인 앱 컨테이너 표시
        if (mainApp) {
            mainApp.style.display = 'block';
        } else {
            throw new Error('mainApp 요소를 찾을 수 없습니다.');
        }
        
        // 사용자 정보 업데이트
        if (currentUser) {
            const userName = document.getElementById('userName');
            const userClass = document.getElementById('userClass');
            
            if (userName) {
                userName.textContent = currentUser.name || currentUser.username || '사용자';
            }
            
            if (userClass) {
                if (currentUser.school && currentUser.grade && currentUser.class) {
                    userClass.textContent = `${currentUser.school} ${currentUser.grade}학년 ${currentUser.class}반`;
                } else {
                    userClass.textContent = currentUser.class || '학급 정보';
                }
            }
        }
        
        console.log('메인 앱 표시 완료');
    } catch (error) {
        console.error('메인 앱 표시 오류:', error);
        showError('앱을 로드하는 중 오류가 발생했습니다.');
    }
}

// 오류 메시지 표시
function showError(message) {
    console.error(message);
    alert(message); // 간단한 알림으로 대체
}

// 성공 메시지 표시
function showSuccess(message) {
    console.log(message);
    alert(message); // 간단한 알림으로 대체
}

// ===== 로그인/회원가입 처리 =====

// 데모 로그인 처리
async function handleDemoLogin() {
    const email = document.getElementById('loginUsername')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    console.log('데모 로그인 시도:', { email, password });
    
    if (!email || !password) {
        showError('이메일과 비밀번호를 입력해주세요.');
        return;
    }
    
    try {
        // 데모 사용자 생성
        const demoUser = {
            id: 'demo_' + Date.now(),
            username: email,
            name: email || 'Demo User',
            class: '데모',
            created_at: new Date().toISOString()
        };
        
        // localStorage에 저장
        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        currentUser = demoUser;
        
        console.log('데모 로그인 성공:', currentUser);
        showSuccess('로그인 성공!');
        
        // 메인 앱으로 전환
        await showMainApp();
        
    } catch (error) {
        console.error('데모 로그인 오류:', error);
        showError('로그인 중 오류가 발생했습니다.');
    }
}

// 데모 회원가입 처리
async function handleDemoSignup() {
    const name = document.getElementById('signupName')?.value;
    const username = document.getElementById('signupUsername')?.value;
    const password = document.getElementById('signupPassword')?.value;
    const school = document.getElementById('signupSchool')?.value;
    const grade = document.getElementById('signupGrade')?.value;
    const className = document.getElementById('signupClass')?.value;
    const number = document.getElementById('signupNumber')?.value;
    
    console.log('데모 회원가입 시도:', { name, username, school, grade, className, number });
    
    if (!name || !username || !password || !school) {
        showError('필수 필드를 모두 입력해주세요.');
        return;
    }
    
    try {
        // 데모 사용자 생성
        const demoUser = {
            id: 'demo_' + Date.now(),
            username: username,
            name: name,
            school: school,
            grade: grade || '미지정',
            class: className || '미지정',
            number: number || '미지정',
            created_at: new Date().toISOString()
        };
        
        // localStorage에 저장
        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        currentUser = demoUser;
        
        console.log('데모 회원가입 성공:', currentUser);
        showSuccess('회원가입 성공!');
        
        // 메인 앱으로 전환
        await showMainApp();
        
    } catch (error) {
        console.error('데모 회원가입 오류:', error);
        showError('회원가입 중 오류가 발생했습니다.');
    }
}

// 로그아웃 처리
function handleLogout() {
    console.log('로그아웃 처리');
    
    // localStorage에서 사용자 정보 제거
    localStorage.removeItem('demoUser');
    localStorage.removeItem('currentInquiry');
    
    // 전역 변수 초기화
    currentUser = null;
    currentStage = 'setup';
    inquirySettings = {};
    stageData = {};
    stageScores = {};
    totalScore = 0;
    initialIntent = '';
    currentInquiryId = null;
    
    // 대문 페이지로 돌아가기
    showWelcomePage();
    
    console.log('로그아웃 완료');
}

// ===== 교사용 접속 처리 =====

// 교사 비밀번호 모달 표시
function showTeacherPasswordModal() {
    console.log('교사 비밀번호 모달 표시');
    const modal = document.getElementById('teacherPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        // 비밀번호 입력 필드 초기화 및 포커스
        const passwordInput = document.getElementById('teacherPassword');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

// 교사 비밀번호 모달 숨기기
function hideTeacherPasswordModal() {
    console.log('교사 비밀번호 모달 숨기기');
    const modal = document.getElementById('teacherPasswordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 교사 로그인 처리
function handleTeacherLogin() {
    const password = document.getElementById('teacherPassword')?.value;
    
    console.log('교사 로그인 시도');
    
    if (!password) {
        showError('비밀번호를 입력해주세요.');
        return;
    }
    
    // 교사 비밀번호 확인 (데모용: "teacher123")
    const correctPassword = 'teacher123';
    
    if (password === correctPassword) {
        console.log('교사 로그인 성공');
        
        // 교사 정보 설정
        currentUser = {
            id: 'teacher_' + Date.now(),
            name: '교사',
            role: 'teacher',
            created_at: new Date().toISOString()
        };
        
        // localStorage에 교사 정보 저장
        localStorage.setItem('teacherUser', JSON.stringify(currentUser));
        
        showSuccess('교사 로그인 성공!');
        hideTeacherPasswordModal();
        showTeacherDashboard();
        
    } else {
        showError('비밀번호가 올바르지 않습니다.');
        // 입력 필드 초기화 및 포커스
        const passwordInput = document.getElementById('teacherPassword');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

// 교사용 대시보드 표시
function showTeacherDashboard() {
    console.log('교사용 대시보드 표시');
    
    try {
        // 모든 컨테이너 숨기기
        const welcomeContainer = document.getElementById('welcomeContainer');
        const authContainer = document.getElementById('authContainer');
        const mainApp = document.getElementById('mainApp');
        const teacherDashboard = document.getElementById('teacherDashboard');
        
        if (welcomeContainer) welcomeContainer.style.display = 'none';
        if (authContainer) authContainer.style.display = 'none';
        if (mainApp) mainApp.style.display = 'none';
        
        // 교사용 대시보드 표시
        if (teacherDashboard) {
            teacherDashboard.style.display = 'block';
            loadStudentsList();
        } else {
            throw new Error('teacherDashboard 요소를 찾을 수 없습니다.');
        }
        
        console.log('교사용 대시보드 표시 완료');
        
    } catch (error) {
        console.error('교사용 대시보드 표시 오류:', error);
        showError('대시보드를 로드하는 중 오류가 발생했습니다.');
    }
}

// 학생 목록 로드
function loadStudentsList() {
    console.log('학생 목록 로드');
    
    const studentsGrid = document.getElementById('studentsGrid');
    if (!studentsGrid) return;
    
    // localStorage에서 등록된 학생들 찾기
    const students = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('demoUser_')) {
            try {
                const student = JSON.parse(localStorage.getItem(key));
                if (student && student.name) {
                    students.push(student);
                }
            } catch (e) {
                console.warn('학생 데이터 파싱 오류:', key, e);
            }
        }
    }
    
    // 현재 demoUser도 확인
    const currentDemo = localStorage.getItem('demoUser');
    if (currentDemo) {
        try {
            const student = JSON.parse(currentDemo);
            if (student && student.name) {
                students.push(student);
            }
        } catch (e) {
            console.warn('현재 데모 사용자 파싱 오류:', e);
        }
    }
    
    if (students.length === 0) {
        studentsGrid.innerHTML = `
            <div class="no-students">
                <p>🎓 등록된 학생이 없습니다.</p>
                <p>학생들이 회원가입을 완료하면 여기에 표시됩니다.</p>
            </div>
        `;
        return;
    }
    
    // 학생 목록 HTML 생성
    studentsGrid.innerHTML = students.map(student => `
        <div class="student-card" data-student-id="${student.id}">
            <div class="student-info">
                <h3>${student.name}</h3>
                <p>${student.school || '학교 정보 없음'}</p>
                <p>${student.grade || ''}학년 ${student.class || ''}반 ${student.number || ''}번</p>
            </div>
            <div class="student-actions">
                <button class="btn-view-report" onclick="viewStudentReport('${student.id}')">
                    📊 레포트 보기
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`학생 목록 로드 완료: ${students.length}명`);
}

// 교사 로그아웃 처리
function handleTeacherLogout() {
    console.log('교사 로그아웃 처리');
    
    // localStorage에서 교사 정보 제거
    localStorage.removeItem('teacherUser');
    
    // 전역 변수 초기화
    currentUser = null;
    
    // 대문 페이지로 돌아가기
    showWelcomePage();
    
    console.log('교사 로그아웃 완료');
}

// 학생 레포트 보기 (간단한 구현)
function viewStudentReport(studentId) {
    console.log('학생 레포트 보기:', studentId);
    
    // 현재는 간단한 알림으로 대체
    showSuccess('학생 레포트 기능은 개발 중입니다.');
    
    // TODO: 실제 레포트 페이지 구현
    // - 학생의 탐구 진행 상황
    // - 단계별 입력 내용
    // - AI 피드백 결과
    // - 점수 및 평가 결과
}

// ===== 탐구 설정 및 진행 관리 =====

// 탐구 설정 완료 처리
function completeInquirySetup() {
    console.log('탐구 설정 완료 처리 시작');
    
    try {
        // 입력 값 수집
        const inquiryType = document.querySelector('input[name="inquiryType"]:checked')?.value;
        const groupMembers = document.getElementById('groupMembers')?.value;
        const topic = document.getElementById('inquiryTopic')?.value;
        const intent = document.getElementById('inquiryIntent')?.value;
        
        console.log('수집된 데이터:', { inquiryType, groupMembers, topic, intent });
        
        // 필수 필드 검증
        if (!topic || topic.trim().length < 3) {
            showError('탐구 주제를 3글자 이상 입력해주세요.');
            document.getElementById('inquiryTopic')?.focus();
            return;
        }
        
        if (!intent || intent.trim().length < 10) {
            showError('탐구 의도를 10글자 이상 구체적으로 입력해주세요.');
            document.getElementById('inquiryIntent')?.focus();
            return;
        }
        
        if (inquiryType === 'group' && (!groupMembers || groupMembers.trim().length < 2)) {
            showError('모둠 탐구를 선택하셨다면 모둠 구성원을 입력해주세요.');
            document.getElementById('groupMembers')?.focus();
            return;
        }
        
        // 탐구 설정 저장
        inquirySettings = {
            type: inquiryType,
            groupMembers: groupMembers?.trim() || '',
            topic: topic.trim(),
            intent: intent.trim()
        };
        
        // 초기 의도 저장
        initialIntent = intent.trim();
        
        // UI 업데이트
        updateInquiryInfo();
        
        // 1단계로 이동
        showStage(1);
        
        console.log('탐구 설정 완료:', inquirySettings);
        showSuccess('탐구 설정이 완료되었습니다! 1단계 관계맺기를 시작해보세요.');
        
    } catch (error) {
        console.error('탐구 설정 완료 오류:', error);
        showError('탐구 설정 중 오류가 발생했습니다.');
    }
}

// 탐구 정보 UI 업데이트
function updateInquiryInfo() {
    console.log('탐구 정보 UI 업데이트');
    
    const topicDisplay = document.getElementById('topicDisplay');
    const intentDisplay = document.getElementById('intentDisplay');
    
    if (topicDisplay && inquirySettings.topic) {
        topicDisplay.textContent = inquirySettings.topic;
    }
    
    if (intentDisplay && inquirySettings.intent) {
        intentDisplay.textContent = inquirySettings.intent;
    }
    
    // 의도 일치도 초기화
    const intentMatch = document.getElementById('intentMatch');
    if (intentMatch) {
        intentMatch.textContent = '0%';
    }
}

// 단계 전환 함수
function showStage(stageNumber) {
    console.log('단계 전환:', stageNumber);
    
    try {
        // 모든 단계 페이지 숨기기
        const allStages = document.querySelectorAll('.stage-page');
        allStages.forEach(stage => {
            stage.classList.remove('active');
        });
        
        // 선택된 단계 표시
        let targetStageId;
        if (stageNumber === 'setup') {
            targetStageId = 'inquirySetup';
        } else {
            targetStageId = `stage${stageNumber}`;
        }
        
        const targetStage = document.getElementById(targetStageId);
        if (targetStage) {
            targetStage.classList.add('active');
            currentStage = stageNumber;
            
            // 네비게이션 상태 업데이트
            updateNavigationStatus(stageNumber);
            
            console.log(`${stageNumber}단계로 전환 완료`);
        } else {
            throw new Error(`${targetStageId} 요소를 찾을 수 없습니다.`);
        }
        
    } catch (error) {
        console.error('단계 전환 오류:', error);
        showError('단계 전환 중 오류가 발생했습니다.');
    }
}

// 네비게이션 상태 업데이트
function updateNavigationStatus(currentStage) {
    console.log('네비게이션 상태 업데이트:', currentStage);
    
    // 모든 네비게이션 상태 초기화
    for (let i = 1; i <= 6; i++) {
        const navStatus = document.getElementById(`navStatus${i}`);
        if (navStatus) {
            navStatus.textContent = '○'; // 비활성
            navStatus.parentElement.classList.remove('active', 'completed');
        }
    }
    
    const setupStatus = document.getElementById('navStatusSetup');
    if (setupStatus) {
        setupStatus.textContent = '●'; // 완료
        setupStatus.parentElement.classList.add('completed');
    }
    
    // 현재 단계 활성화
    if (currentStage !== 'setup') {
        const currentNavStatus = document.getElementById(`navStatus${currentStage}`);
        if (currentNavStatus) {
            currentNavStatus.textContent = '●'; // 활성
            currentNavStatus.parentElement.classList.add('active');
        }
    }
}

// 모둠/개인 탐구 선택 변경 처리
function handleInquiryTypeChange() {
    const inquiryType = document.querySelector('input[name="inquiryType"]:checked')?.value;
    const groupMembersSection = document.getElementById('groupMembersSection');
    
    if (groupMembersSection) {
        if (inquiryType === 'group') {
            groupMembersSection.style.display = 'block';
        } else {
            groupMembersSection.style.display = 'none';
        }
    }
}

// 단계 네비게이션 이벤트 리스너 설정
function setupStageNavigationListeners() {
    console.log('단계 네비게이션 이벤트 리스너 설정');
    
    // 모든 data-stage 속성을 가진 버튼들 찾기
    const stageButtons = document.querySelectorAll('button[data-stage]');
    
    stageButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const stage = this.getAttribute('data-stage');
            
            console.log('단계 이동 버튼 클릭:', stage);
            
            if (stage === 'prev') {
                // 이전 단계로 이동
                handlePreviousStage();
            } else if (stage === 'setup') {
                // 설정 단계로 이동
                showStage('setup');
            } else if (!isNaN(stage)) {
                // 숫자 단계로 이동
                const stageNumber = parseInt(stage);
                handleNextStage(stageNumber);
            }
        });
    });
    
    // 사이드바 네비게이션 버튼들
    const navStageButtons = document.querySelectorAll('.nav-stage[data-stage]');
    navStageButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const stage = this.getAttribute('data-stage');
            
            console.log('사이드바 네비게이션 클릭:', stage);
            
            if (stage === 'setup') {
                showStage('setup');
            } else if (!isNaN(stage)) {
                showStage(parseInt(stage));
            }
        });
    });
    
    console.log(`단계 네비게이션 버튼 ${stageButtons.length}개 등록 완료`);
}

// 다음 단계로 이동 처리
function handleNextStage(stageNumber) {
    console.log(`${stageNumber}단계로 이동 요청`);
    
    try {
        // 현재 단계의 입력 검증 (선택사항)
        const currentInput = document.getElementById(`stage${currentStage}Input`);
        if (currentInput && currentInput.value.trim().length < 10) {
            const confirm = window.confirm('현재 단계의 내용이 부족합니다. 그래도 다음 단계로 이동하시겠습니까?');
            if (!confirm) {
                return;
            }
        }
        
        // 다음 단계로 이동
        const nextStage = stageNumber + 1;
        if (nextStage <= 6) {
            showStage(nextStage);
            showSuccess(`${getStageNames()[nextStage]} 단계로 이동했습니다.`);
        } else {
            // 6단계 완료 처리
            handleInquiryCompletion();
        }
        
    } catch (error) {
        console.error('다음 단계 이동 오류:', error);
        showError('단계 이동 중 오류가 발생했습니다.');
    }
}

// 이전 단계로 이동 처리
function handlePreviousStage() {
    console.log('이전 단계로 이동 요청');
    
    try {
        let prevStage;
        
        if (currentStage === 1) {
            prevStage = 'setup';
        } else if (currentStage > 1 && currentStage <= 6) {
            prevStage = currentStage - 1;
        } else {
            console.warn('이전 단계가 없습니다.');
            return;
        }
        
        showStage(prevStage);
        const stageName = prevStage === 'setup' ? '탐구 설정' : getStageNames()[prevStage];
        showSuccess(`${stageName} 단계로 이동했습니다.`);
        
    } catch (error) {
        console.error('이전 단계 이동 오류:', error);
        showError('단계 이동 중 오류가 발생했습니다.');
    }
}

// 단계 이름 반환
function getStageNames() {
    return {
        1: "1단계: 관계맺기",
        2: "2단계: 집중하기", 
        3: "3단계: 조사하기",
        4: "4단계: 정리하기",
        5: "5단계: 일반화하기",
        6: "6단계: 전이하기"
    };
}

// 탐구 완료 처리
function handleInquiryCompletion() {
    console.log('탐구 활동 완료 처리');
    
    // 완료 섹션 표시
    const completionSection = document.getElementById('stage6ResultSection');
    if (completionSection) {
        completionSection.style.display = 'block';
    }
    
    showSuccess('🎉 6단계 탐구 활동을 모두 완료했습니다!');
}

// 학생용 최종 결과 보고서 표시
function showStudentFinalResult() {
    console.log('학생 최종 결과 보고서 표시');
    
    // 각 단계별 데이터 수집
    const stageResults = [];
    for (let i = 1; i <= 6; i++) {
        const inputElement = document.getElementById(`stage${i}Input`);
        const content = inputElement ? inputElement.value.trim() : '';
        
        // 간단한 평가 수행 (실제로는 저장된 피드백 사용)
        let trafficLight = '🔴';
        let trafficText = '미완료';
        
        if (content.length > 0) {
            if (content.length > 100 && content.split(/\s+/).length > 15) {
                trafficLight = '🟢';
                trafficText = '우수';
            } else if (content.length > 50) {
                trafficLight = '🟡';
                trafficText = '보통';
            } else {
                trafficLight = '🔴';
                trafficText = '개선필요';
            }
        }
        
        stageResults.push({
            stage: i,
            content: content,
            trafficLight: trafficLight,
            trafficText: trafficText
        });
    }
    
    // 결과 보고서 HTML 생성
    const stageResultsHtml = stageResults.map(result => `
        <div class="stage-result-item">
            <div class="stage-result-header">
                <span class="stage-number">${result.stage}단계</span>
                <span class="stage-traffic-light">${result.trafficLight} ${result.trafficText}</span>
            </div>
            <div class="stage-result-content">
                ${result.content.length > 0 ? 
                    (result.content.length > 100 ? result.content.substring(0, 100) + '...' : result.content) :
                    '내용이 입력되지 않았습니다.'
                }
            </div>
        </div>
    `).join('');
    
    // 전체 평가
    const completedStages = stageResults.filter(r => r.content.length > 0).length;
    const excellentStages = stageResults.filter(r => r.trafficLight === '🟢').length;
    
    let overallRating = '🔴 더 노력이 필요해요';
    if (excellentStages >= 4) {
        overallRating = '🟢 훌륭한 탐구 활동이었어요!';
    } else if (excellentStages >= 2) {
        overallRating = '🟡 좋은 탐구 활동이었어요!';
    }
    
    // 모달 생성 및 표시
    const modalHtml = `
        <div class="student-report-modal" id="studentReportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 탐구 결과 보고서</h3>
                    <button class="modal-close" onclick="closeStudentReportModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="overall-rating">
                        <h4>전체 평가</h4>
                        <p class="rating-text">${overallRating}</p>
                        <p class="completion-info">완료된 단계: ${completedStages}/6단계</p>
                    </div>
                    
                    <div class="stage-results">
                        <h4>단계별 결과</h4>
                        ${stageResultsHtml}
                    </div>
                    
                    <div class="inquiry-info-summary">
                        <h4>탐구 정보</h4>
                        <p><strong>주제:</strong> ${inquirySettings.topic || '설정되지 않음'}</p>
                        <p><strong>의도:</strong> ${inquirySettings.intent || '설정되지 않음'}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeStudentReportModal()">닫기</button>
                    <button class="btn-primary" onclick="startNewInquiry()">새 탐구 시작</button>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거 후 새로 추가
    const existingModal = document.getElementById('studentReportModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 모달 표시
    const modal = document.getElementById('studentReportModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 학생 결과 보고서 모달 닫기
function closeStudentReportModal() {
    const modal = document.getElementById('studentReportModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

// 새 탐구 시작하기
function startNewInquiry() {
    console.log('새 탐구 시작하기');
    
    const confirm = window.confirm('새로운 탐구를 시작하시겠습니까? 현재 진행 중인 내용은 초기화됩니다.');
    
    if (confirm) {
        // 데이터 초기화
        inquirySettings = {};
        stageData = {};
        stageScores = {};
        stageEvaluations = {};
        totalScore = 0;
        initialIntent = '';
        currentInquiryId = null;
        currentStage = 'setup';
        
        // 모든 입력 필드 초기화
        for (let i = 1; i <= 6; i++) {
            const inputElement = document.getElementById(`stage${i}Input`);
            if (inputElement) {
                inputElement.value = '';
            }
            
            const feedbackElement = document.getElementById(`stage${i}TextFeedback`);
            if (feedbackElement) {
                feedbackElement.innerHTML = '';
            }
        }
        
        // 탐구 설정 필드 초기화
        const topicElement = document.getElementById('inquiryTopic');
        const intentElement = document.getElementById('inquiryIntent');
        const groupMembersElement = document.getElementById('groupMembers');
        
        if (topicElement) topicElement.value = '';
        if (intentElement) intentElement.value = '';
        if (groupMembersElement) groupMembersElement.value = '';
        
        // 개인 탐구로 초기화
        const individualRadio = document.querySelector('input[name="inquiryType"][value="individual"]');
        if (individualRadio) {
            individualRadio.checked = true;
            handleInquiryTypeChange();
        }
        
        // UI 초기화
        const topicDisplay = document.getElementById('topicDisplay');
        const intentDisplay = document.getElementById('intentDisplay');
        const intentMatch = document.getElementById('intentMatch');
        
        if (topicDisplay) topicDisplay.textContent = '아직 설정되지 않았습니다.';
        if (intentDisplay) intentDisplay.textContent = '아직 설정되지 않았습니다.';
        if (intentMatch) intentMatch.textContent = '0%';
        
        // 설정 단계로 이동
        showStage('setup');
        
        // 모달 닫기
        closeStudentReportModal();
        
        showSuccess('새로운 탐구를 시작합니다! 탐구 설정부터 다시 시작해주세요.');
    }
}

// ===== 텍스트 피드백 시스템 =====

// 텍스트 피드백 받기
async function getTextFeedback(stageNumber) {
    console.log(`${stageNumber}단계 텍스트 피드백 요청`);
    
    try {
        // 입력 텍스트 가져오기
        const inputElement = document.getElementById(`stage${stageNumber}Input`);
        const feedbackElement = document.getElementById(`stage${stageNumber}TextFeedback`);
        
        if (!inputElement || !feedbackElement) {
            throw new Error('입력 요소 또는 피드백 요소를 찾을 수 없습니다.');
        }
        
        const inputText = inputElement.value.trim();
        
        // 입력 검증
        if (!inputText || inputText.length < 10) {
            showError('10글자 이상의 내용을 입력해주세요.');
            inputElement.focus();
            return;
        }
        
        // 로딩 상태 표시
        feedbackElement.innerHTML = `
            <div class="feedback-loading">
                <div class="loading-spinner"></div>
                <p>🤖 AI가 텍스트를 분석하고 있습니다...</p>
            </div>
        `;
        
        // AI 텍스트 분석 수행
        const feedback = await analyzeTextContent(stageNumber, inputText);
        
        // 피드백 표시
        displayTextFeedback(stageNumber, feedback);
        
        // 의도 일치도 업데이트
        if (initialIntent && feedback.intentMatch !== undefined) {
            updateIntentMatch(feedback.intentMatch);
        }
        
        console.log(`${stageNumber}단계 텍스트 피드백 완료`);
        
    } catch (error) {
        console.error('텍스트 피드백 오류:', error);
        
        const feedbackElement = document.getElementById(`stage${stageNumber}TextFeedback`);
        if (feedbackElement) {
            feedbackElement.innerHTML = `
                <div class="feedback-error">
                    <p>❌ 피드백 생성 중 오류가 발생했습니다.</p>
                    <p>잠시 후 다시 시도해주세요.</p>
                </div>
            `;
        }
        
        showError('텍스트 피드백 생성 중 오류가 발생했습니다.');
    }
}

// AI 텍스트 분석 (시뮬레이션)
async function analyzeTextContent(stageNumber, content) {
    console.log(`${stageNumber}단계 텍스트 분석:`, content.substring(0, 50) + '...');
    
    // 실제 AI 분석 대신 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    
    // 단계별 분석 기준
    const stageAnalysis = {
        1: {
            title: "1단계: 관계맺기 분석",
            criteria: ["주제와의 연관성", "개인적 경험", "호기심 표현", "구체성"],
            suggestions: [
                "주제에 대한 개인적 경험을 더 구체적으로 서술해보세요",
                "왜 이 주제에 관심을 갖게 되었는지 이유를 명확히 해보세요",
                "관련된 감정이나 느낌을 표현해보세요"
            ]
        },
        2: {
            title: "2단계: 집중하기 분석", 
            criteria: ["질문의 구체성", "탐구 가능성", "개방성", "명확성"],
            suggestions: [
                "질문을 더 구체적이고 측정 가능하게 만들어보세요",
                "단순한 사실 확인을 넘어서는 탐구 질문으로 발전시켜보세요",
                "여러 답변이 가능한 개방형 질문으로 수정해보세요"
            ]
        },
        3: {
            title: "3단계: 조사하기 분석",
            criteria: ["조사 방법의 다양성", "출처의 신뢰성", "정보의 구체성", "체계성"],
            suggestions: [
                "다양한 출처에서 정보를 수집해보세요",
                "출처를 명확히 기록해주세요",
                "수집한 정보를 더 구체적으로 기술해보세요"
            ]
        },
        4: {
            title: "4단계: 정리하기 분석",
            criteria: ["분류의 체계성", "관계 파악", "패턴 인식", "종합적 사고"],
            suggestions: [
                "정보들 간의 공통점과 차이점을 더 명확히 해보세요",
                "분류 기준을 더 체계적으로 설정해보세요",
                "발견한 패턴을 구체적으로 설명해보세요"
            ]
        },
        5: {
            title: "5단계: 일반화하기 분석",
            criteria: ["원리의 명확성", "일반화 가능성", "논리적 근거", "적용 범위"],
            suggestions: [
                "발견한 원리를 더 명확하게 표현해보세요",
                "다른 상황에 적용할 수 있는 근거를 제시해보세요",
                "일반화의 한계도 함께 고려해보세요"
            ]
        },
        6: {
            title: "6단계: 전이하기 분석",
            criteria: ["실용성", "창의성", "실현 가능성", "구체성"],
            suggestions: [
                "실생활 적용 방안을 더 구체적으로 제시해보세요",
                "창의적이고 혁신적인 활용 방법을 생각해보세요",
                "실제로 실행 가능한 계획을 세워보세요"
            ]
        }
    };
    
    const analysis = stageAnalysis[stageNumber] || stageAnalysis[1];
    
    // 무의미한 입력 감지 및 처리
    const trimmedContent = content.trim();
    const isRepeatedChars = /^(.)\1{2,}$/.test(trimmedContent) || /^(.{1,3})\1{3,}$/.test(trimmedContent);
    const isMeaninglessPattern = /^[a-zA-Z]{1,3}\1*$|^[ㄱ-ㅎㅏ-ㅣ가-힣]{1,2}\1*$/.test(trimmedContent);
    const hasNoMeaning = ['ㅁㄴㅇㄹ', 'asdf', 'qwer', 'test', 'aaaa', 'bbbb'].some(pattern => 
        trimmedContent.toLowerCase().includes(pattern)
    );
    
    // 간단한 점수 계산 (실제로는 더 복잡한 AI 분석)
    const contentLength = content.length;
    const wordCount = content.split(/\s+/).length;
    const uniqueChars = new Set(content.toLowerCase().replace(/\s/g, '')).size;
    
    let score = 30; // 기본 점수를 낮춤
    
    // 무의미한 입력 처리
    if (isRepeatedChars || isMeaninglessPattern || hasNoMeaning || uniqueChars < 3) {
        score = Math.min(score, 25); // 매우 낮은 점수
    } else {
        // 의미 있는 내용에 대한 점수 계산
        score = 40; // 기본 점수 상향
        
        // 길이 기반 점수 조정
        if (contentLength > 50) score += 10;
        if (contentLength > 100) score += 15;
        if (contentLength > 200) score += 10;
        
        // 단어 다양성 점수
        if (wordCount > 10) score += 8;
        if (wordCount > 20) score += 7;
        if (wordCount > 50) score += 5;
        
        // 문자 다양성 점수
        if (uniqueChars > 10) score += 5;
        if (uniqueChars > 20) score += 5;
        
        // 키워드 기반 점수 조정
        const keywords = ['왜냐하면', '그러므로', '따라서', '구체적으로', '예를 들어', '생각', '경험', '느낌', '관찰', '발견'];
        keywords.forEach(keyword => {
            if (content.includes(keyword)) score += 3;
        });
        
        // 문장 구조 점수
        const sentenceCount = content.split(/[.!?]/).filter(s => s.trim().length > 0).length;
        if (sentenceCount > 2) score += 5;
        if (sentenceCount > 4) score += 5;
    }
    
    // 의도 일치도 계산
    let intentMatch = 0;
    if (initialIntent) {
        intentMatch = calculateTextSimilarity(initialIntent, content);
    }
    
    // 점수 범위 제한
    score = Math.min(Math.max(score, 15), 100);
    
    // 신호등 색상 시스템으로 변경
    let trafficLight, trafficText;
    if (score >= 70) {
        trafficLight = '🟢';
        trafficText = '우수';
    } else if (score >= 40) {
        trafficLight = '🟡';
        trafficText = '보통';
    } else {
        trafficLight = '🔴';
        trafficText = '개선필요';
    }
    
    return {
        score: score,
        level: score >= 80 ? '상' : score >= 60 ? '중' : '하',
        trafficLight: trafficLight,
        trafficText: trafficText,
        title: analysis.title,
        strengths: generateStrengths(content, score),
        improvements: analysis.suggestions.slice(0, 2),
        feedback: generateOverallFeedback(score, stageNumber),
        intentMatch: intentMatch
    };
}

// 강점 생성
function generateStrengths(content, score) {
    const strengths = [];
    const trimmedContent = content.trim();
    const uniqueChars = new Set(content.toLowerCase().replace(/\s/g, '')).size;
    const wordCount = content.split(/\s+/).length;
    
    // 무의미한 입력 감지
    const isRepeatedChars = /^(.)\1{2,}$/.test(trimmedContent) || /^(.{1,3})\1{3,}$/.test(trimmedContent);
    const isMeaninglessPattern = /^[a-zA-Z]{1,3}\1*$|^[ㄱ-ㅎㅏ-ㅣ가-힣]{1,2}\1*$/.test(trimmedContent);
    const hasNoMeaning = ['ㅁㄴㅇㄹ', 'asdf', 'qwer', 'test', 'aaaa', 'bbbb'].some(pattern => 
        trimmedContent.toLowerCase().includes(pattern)
    );
    
    // 무의미한 입력인 경우 강점을 찾지 않음
    if (isRepeatedChars || isMeaninglessPattern || hasNoMeaning || uniqueChars < 3) {
        return ["입력을 시도했습니다"]; // 최소한의 긍정적 표현
    }
    
    // 의미 있는 내용에 대한 강점 분석
    if (content.length > 50) {
        strengths.push("적절한 분량으로 내용을 작성했습니다");
    }
    
    if (content.length > 100) {
        strengths.push("충분히 자세하게 설명했습니다");
    }
    
    if (content.includes('?')) {
        strengths.push("의문을 제기하며 탐구적 사고를 보여줍니다");
    }
    
    if (content.includes('경험') || content.includes('느낌') || content.includes('생각')) {
        strengths.push("개인적 경험과 생각을 잘 연결했습니다");
    }
    
    if (wordCount > 15) {
        strengths.push("다양한 어휘를 사용하여 표현했습니다");
    }
    
    if (uniqueChars > 15) {
        strengths.push("풍부한 표현력을 보여줍니다");
    }
    
    const keywords = ['구체적', '자세히', '명확히', '정확히', '체계적'];
    const hasGoodKeywords = keywords.some(keyword => content.includes(keyword));
    if (hasGoodKeywords) {
        strengths.push("구체적이고 체계적인 사고를 보여줍니다");
    }
    
    if (score >= 70) {
        strengths.push("전반적으로 잘 구성된 답변입니다");
    }
    
    return strengths.length > 0 ? strengths : ["탐구 주제에 대한 관심을 보여줍니다"];
}

// 전체 피드백 생성
function generateOverallFeedback(score, stageNumber) {
    const stageNames = {
        1: "관계맺기", 2: "집중하기", 3: "조사하기", 
        4: "정리하기", 5: "일반화하기", 6: "전이하기"
    };
    
    const stageName = stageNames[stageNumber] || "탐구";
    
    if (score >= 80) {
        return `${stageName} 단계를 훌륭하게 수행했습니다! 탐구 의도와 잘 연결된 깊이 있는 내용입니다.`;
    } else if (score >= 60) {
        return `${stageName} 단계를 잘 수행했습니다. 몇 가지 부분을 보완하면 더욱 완성도 높은 탐구가 될 것입니다.`;
    } else if (score >= 40) {
        return `${stageName} 단계의 기본 요구사항을 일부 충족했습니다. 더 구체적이고 의미 있는 내용으로 보완해보세요.`;
    } else if (score >= 25) {
        return `${stageName} 단계에 대한 답변이 부족합니다. 탐구 주제와 관련된 구체적인 내용을 작성해주세요.`;
    } else {
        return `의미 있는 답변을 작성해주세요. 현재 입력은 ${stageName} 단계의 요구사항에 적합하지 않습니다.`;
    }
}

// 텍스트 피드백 표시
function displayTextFeedback(stageNumber, feedback) {
    const feedbackElement = document.getElementById(`stage${stageNumber}TextFeedback`);
    
    if (!feedbackElement) return;
    
    const strengthsHtml = feedback.strengths.map(strength => 
        `<li>✅ ${strength}</li>`
    ).join('');
    
    const improvementsHtml = feedback.improvements.map(improvement => 
        `<li>💡 ${improvement}</li>`
    ).join('');
    
    // 현재 사용자가 교사인지 학생인지 확인
    const isTeacher = currentUser && currentUser.role === 'teacher';
    
    feedbackElement.innerHTML = `
        <div class="structured-feedback">
            <div class="feedback-header">
                <h4>🤖 AI 텍스트 분석 결과</h4>
                <div class="feedback-score">
                    ${isTeacher ? 
                        `<span class="score-badge score-${feedback.level}">${feedback.score}점 (${feedback.level})</span>` :
                        `<span class="traffic-light-badge">${feedback.trafficLight} ${feedback.trafficText}</span>`
                    }
                </div>
            </div>
            
            <div class="feedback-content">
                <div class="feedback-item">
                    <strong>💪 잘한 점:</strong>
                    <ul>${strengthsHtml}</ul>
                </div>
                
                <div class="feedback-item">
                    <strong>🔧 개선 제안:</strong>
                    <ul>${improvementsHtml}</ul>
                </div>
                
                <div class="feedback-summary">
                    <strong>📝 종합 의견:</strong>
                    <p>${feedback.feedback}</p>
                </div>
            </div>
        </div>
    `;
}

// 의도 일치도 업데이트
function updateIntentMatch(matchPercentage) {
    const intentMatchElement = document.getElementById('intentMatch');
    if (intentMatchElement) {
        intentMatchElement.textContent = `${Math.round(matchPercentage)}%`;
        
        // 색상 변경
        if (matchPercentage >= 70) {
            intentMatchElement.style.color = '#28a745';
        } else if (matchPercentage >= 50) {
            intentMatchElement.style.color = '#ffc107';
        } else {
            intentMatchElement.style.color = '#dc3545';
        }
    }
}

// 텍스트 유사도 계산 (개선된 알고리즘)
function calculateTextSimilarity(intent, input) {
    if (!intent || !input) return 0;
    
    // 무의미한 입력 검증 추가
    const trimmedInput = input.trim();
    const isOnlyNumbers = /^\d+$/.test(trimmedInput);
    const isRepeatedChars = /^(.)\1{2,}$/.test(trimmedInput);
    const isMeaningless = trimmedInput.length < 5 || 
                         /^[^가-힣a-zA-Z]*$/.test(trimmedInput) ||
                         ['test', 'ㅁㄴㅇㄹ', 'asdf', 'qwer', '123', '1234', 'abc'].includes(trimmedInput.toLowerCase());
    
    if (isOnlyNumbers || isRepeatedChars || isMeaningless) {
        console.log('⚠️ 무의미한 입력으로 낮은 유사도 반환:', trimmedInput);
        return 15; // 매우 낮은 점수 반환
    }
    
    // 1. 키워드 매칭 (40%)
    const intentKeywords = extractKeywords(intent);
    const inputKeywords = extractKeywords(input);
    
    let keywordMatches = 0;
    intentKeywords.forEach(keyword => {
        if (inputKeywords.some(inputKeyword => 
            inputKeyword.includes(keyword) || keyword.includes(inputKeyword) ||
            getSimilarity(keyword, inputKeyword) > 0.7
        )) {
            keywordMatches++;
        }
    });
    
    const keywordScore = intentKeywords.length > 0 ? 
        (keywordMatches / intentKeywords.length) * 40 : 0;
    
    // 2. 의미적 연관성 (40%)
    const semanticScore = calculateSemanticSimilarity(intent, input) * 40;
    
    // 3. 길이 및 구조 유사도 (20%)
    const structureScore = calculateStructureSimilarity(intent, input) * 20;
    
    return Math.min(100, keywordScore + semanticScore + structureScore);
}

// 키워드 추출 (불용어 제거)
function extractKeywords(text) {
    const stopWords = ['은', '는', '이', '가', '을', '를', '에', '에서', '와', '과', '의', '로', '으로', '한', '하는', '하다', '있다', '없다', '그', '저', '이런', '저런', '등'];
    
    // 무의미한 입력 체크
    const trimmedText = text.trim();
    if (/^\d+$/.test(trimmedText) || trimmedText.length < 3) {
        return []; // 빈 배열 반환으로 키워드 매칭 실패
    }
    
    return text.toLowerCase()
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.includes(word) && !/^\d+$/.test(word))
        .slice(0, 10); // 상위 10개 키워드만 사용
}

// 문자열 유사도 계산 (편집 거리 기반)
function getSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

// 편집 거리 계산 (레벤슈타인 거리)
function getEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// 의미적 유사도 계산 (간단한 휴리스틱)
function calculateSemanticSimilarity(intent, input) {
    // 공통 주제어나 개념어가 있는지 확인
    const commonConcepts = ['식물', '동물', '실험', '관찰', '조사', '연구', '분석', '비교', '측정', '변화', '원인', '결과', '관계', '영향', '효과'];
    
    let conceptMatches = 0;
    commonConcepts.forEach(concept => {
        if (intent.includes(concept) && input.includes(concept)) {
            conceptMatches++;
        }
    });
    
    return Math.min(1.0, conceptMatches / 3); // 최대 3개 개념 매칭으로 정규화
}

// 구조적 유사도 계산
function calculateStructureSimilarity(intent, input) {
    const intentLength = intent.length;
    const inputLength = input.length;
    
    // 길이 유사도 (0.5 가중치)
    const lengthSimilarity = 1 - Math.abs(intentLength - inputLength) / Math.max(intentLength, inputLength);
    
    // 문장 구조 유사도 (0.5 가중치)
    const intentSentences = intent.split(/[.!?]/).length;
    const inputSentences = input.split(/[.!?]/).length;
    const structureSimilarity = 1 - Math.abs(intentSentences - inputSentences) / Math.max(intentSentences, inputSentences);
    
    return (lengthSimilarity * 0.5 + structureSimilarity * 0.5);
}

// 전역 함수로 노출
window.showAuthContainer = showAuthContainer;
window.showWelcomePage = showWelcomePage;

console.log('script.js 로드 완료');