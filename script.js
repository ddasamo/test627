// 의도기반 탐구학습 시스템 - 메인 스크립트

// ===== 전역 변수 =====
let currentUser = null;
let currentStage = 1;
let totalScore = 0;
let stageScores = [0, 0, 0, 0, 0, 0, 0];
let initialIntent = "";
let reflectionData = [];
let currentInquiryId = null;
let aiCoachEnabled = false; // AI 코치 활성화 상태

// ===== AI 탐구 코치 관련 변수 =====
let currentAIFeedback = null;
let stageNames = ['', '관계맺기', '집중하기', '조사하기', '조직및정리하기', '일반화하기', '전이하기'];

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async () => {
    // 설정 초기화
    initializeConfig();
    validateConfig();
    
    // AI 코치 초기화
    initializeAICoach();
    
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