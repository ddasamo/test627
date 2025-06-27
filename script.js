// 의도기반 탐구학습 시스템 - 메인 스크립트

// ===== 전역 변수 =====
let currentUser = null;
let currentStage = 1;
let totalScore = 0;
let stageScores = [0, 0, 0, 0, 0, 0, 0];
let initialIntent = "";
let reflectionData = [];
let currentInquiryId = null;

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async () => {
    // 설정 초기화
    initializeConfig();
    validateConfig();
    
    // 인증 상태 확인
    await checkAuthState();
    
    // 인증 폼 설정
    setupAuthForms();
    
    // 터치 이벤트 최적화
    setupTouchOptimization();
});

// ===== 인증 관련 함수 =====

// 인증 상태 확인
async function checkAuthState() {
    try {
        if (CONFIG.DEMO_MODE) {
            // 데모 모드 - localStorage 확인
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                await showMainApp();
                await loadUserProgress();
            }
        } else {
            // Supabase 인증 확인
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                currentUser = user;
                await showMainApp();
                await loadUserProgress();
            }
        }
    } catch (error) {
        console.error('인증 상태 확인 오류:', error);
    }
}

// 인증 폼 설정
function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const switchLink = document.getElementById('switchLink');
    const switchText = document.getElementById('switchText');

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);

    switchLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms();
    });
}

// 로그인/회원가입 폼 전환
function toggleAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');

    if (loginForm.style.display === 'none') {
        // 회원가입 -> 로그인
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        switchText.textContent = '계정이 없으신가요?';
        switchLink.textContent = '회원가입';
    } else {
        // 로그인 -> 회원가입
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        switchText.textContent = '이미 계정이 있으신가요?';
        switchLink.textContent = '로그인';
    }
    hideMessages();
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    showLoading();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        if (!email || !password) {
            throw new Error(CONFIG.MESSAGES.ERRORS.EMPTY_FIELD);
        }

        if (CONFIG.DEMO_MODE) {
            // 데모 모드 로그인
            currentUser = {
                id: 'demo_user_' + Date.now(),
                email: email,
                name: email.split('@')[0],
                class: '3학년 2반'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showSuccessMessage(CONFIG.MESSAGES.LOGIN_SUCCESS);
            
            setTimeout(async () => {
                await showMainApp();
                await loadUserProgress();
            }, 1000);
        } else {
            // Supabase 로그인
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            
            currentUser = data.user;
            await showMainApp();
            await loadUserProgress();
        }

    } catch (error) {
        showErrorMessage(error.message || CONFIG.MESSAGES.ERRORS.LOGIN_FAILED);
    } finally {
        hideLoading();
    }
}

// 회원가입 처리
async function handleSignup(e) {
    e.preventDefault();
    showLoading();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const className = document.getElementById('signupClass').value.trim();

    try {
        if (!name || !email || !password || !className) {
            throw new Error(CONFIG.MESSAGES.ERRORS.EMPTY_FIELD);
        }

        if (CONFIG.DEMO_MODE) {
            // 데모 모드 회원가입
            showSuccessMessage(CONFIG.MESSAGES.SIGNUP_SUCCESS);
            
            // 로그인 폼으로 전환
            toggleAuthForms();
            
            // 로그인 폼에 이메일 자동 입력
            document.getElementById('loginEmail').value = email;
        } else {
            // Supabase 회원가입
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name,
                        class: className
                    }
                }
            });

            if (error) throw error;
            
            // 사용자 프로필 저장 (회원가입 성공 후)
            if (data.user) {
                const { error: profileError } = await supabase.from(CONFIG.DB_TABLES.PROFILES).insert({
                    id: data.user.id,
                    name: name,
                    class: className,
                    email: email
                });

                if (profileError) {
                    console.error('프로필 저장 오류:', profileError);
                    // 프로필 저장 실패해도 회원가입은 성공한 상태
                }
            }

            showSuccessMessage(CONFIG.MESSAGES.SIGNUP_SUCCESS);
        }

    } catch (error) {
        showErrorMessage(error.message || CONFIG.MESSAGES.ERRORS.SIGNUP_FAILED);
    } finally {
        hideLoading();
    }
}

// 로그아웃
async function logout() {
    try {
        if (CONFIG.DEMO_MODE) {
            // 데모 모드 로그아웃
            localStorage.removeItem('currentUser');
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
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // 사용자 정보 표시
    let userName = '사용자';
    let userClass = '학급 정보 없음';
    
    if (CONFIG.DEMO_MODE) {
        userName = currentUser.name || currentUser.email?.split('@')[0] || '사용자';
        userClass = currentUser.class || '학급 정보 없음';
    } else {
        // Supabase에서 프로필 정보 가져오기
        try {
            const { data: profile, error } = await supabase
                .from(CONFIG.DB_TABLES.PROFILES)
                .select('name, class')
                .eq('id', currentUser.id)
                .single();
            
            if (profile && !error) {
                userName = profile.name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || '사용자';
                userClass = profile.class || currentUser.user_metadata?.class || '학급 정보 없음';
            } else {
                // 프로필이 없으면 user_metadata에서 가져오기
                userName = currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || '사용자';
                userClass = currentUser.user_metadata?.class || '학급 정보 없음';
            }
        } catch (error) {
            console.error('프로필 로드 오류:', error);
            userName = currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || '사용자';
            userClass = currentUser.user_metadata?.class || '학급 정보 없음';
        }
    }
    
    document.getElementById('userName').textContent = userName + '님';
    document.getElementById('userClass').textContent = userClass;
}

// 인증 컨테이너 표시
function showAuthContainer() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

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

// 진행 상황 저장
async function saveProgress() {
    try {
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

        if (CONFIG.DEMO_MODE) {
            // 데모 모드 - localStorage에 저장
            localStorage.setItem(`inquiry_${currentUser.id}`, JSON.stringify(progressData));
        } else {
            // Supabase에 저장
            if (currentInquiryId) {
                console.log('기존 탐구 데이터 업데이트 중...', currentInquiryId);
                const { data, error } = await supabase
                    .from(CONFIG.DB_TABLES.INQUIRIES)
                    .update({
                        current_stage: currentStage,
                        total_score: totalScore,
                        stage_scores: stageScores,
                        initial_intent: initialIntent,
                        reflection_data: reflectionData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentInquiryId)
                    .select();
                
                if (error) {
                    console.error('탐구 데이터 업데이트 오류:', error);
                    throw error;
                } else {
                    console.log('탐구 데이터 업데이트 성공:', data);
                }
            } else {
                console.log('새 탐구 데이터 생성 중...', currentUser.id);
                const { data, error } = await supabase
                    .from(CONFIG.DB_TABLES.INQUIRIES)
                    .insert({
                        user_id: currentUser.id,
                        current_stage: currentStage,
                        total_score: totalScore,
                        stage_scores: stageScores,
                        initial_intent: initialIntent,
                        reflection_data: reflectionData,
                        status: 'in_progress'
                    })
                    .select()
                    .single();
                
                if (error) {
                    console.error('탐구 데이터 생성 오류:', error);
                    throw error;
                } else {
                    console.log('탐구 데이터 생성 성공:', data);
                    if (data) currentInquiryId = data.id;
                }
            }
        }

        if (isDebugMode()) {
            console.log('진행 상황 저장 완료:', progressData);
        }

    } catch (error) {
        console.error('진행 상황 저장 오류:', error);
        showErrorMessage(CONFIG.MESSAGES.ERRORS.SAVE_FAILED);
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

    // 첫 번째 단계에서 초기 의도 설정
    if (stage === 1) {
        initialIntent = input;
        document.getElementById('initialIntent').textContent = input;
    }

    // 의도 일치도 계산
    const intentMatch = calculateIntentMatch(input, stage);
    
    // 점수 계산
    const maxScore = CONFIG.APP_SETTINGS.STAGE_MAX_SCORES[stage];
    const earnedScore = Math.round(maxScore * (intentMatch / 100));
    stageScores[stage] = earnedScore;
    
    // UI 업데이트
    updateStageScore(stage, earnedScore, maxScore);
    updateTotalScore();
    updateProgress();
    updateIntentMatch(intentMatch);
    
    // 진행 상황 저장
    await saveProgress();
    
    // 성찰 팝업 표시
    showReflectionPopup(stage);
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

        // 완료 메시지 표시
        const completionMessage = `${CONFIG.MESSAGES.COMPLETE_SUCCESS}\n\n최종 점수: ${totalScore}점\n성찰 참여: ${reflectionData.length}회\n\n훌륭한 탐구 여정이었습니다!`;
        alert(completionMessage);
        
    } catch (error) {
        console.error('탐구 완료 저장 오류:', error);
    }
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

// ===== 자동 저장 설정 =====
setInterval(async () => {
    if (currentUser && currentStage > 1) {
        await saveProgress();
    }
}, CONFIG.APP_SETTINGS.AUTO_SAVE_INTERVAL); 