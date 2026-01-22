# 클로토 개발 환경 설정 가이드

## 1. Firebase 프로젝트 생성

### 1-1. Firebase Console 접속
1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭

### 1-2. 프로젝트 설정
1. **프로젝트 이름**: `clotho-dev` (또는 원하는 이름)
2. **Google Analytics**: 선택 사항 (일단 비활성화 가능)
3. 프로젝트 생성 완료

### 1-3. 웹 앱 추가
1. 프로젝트 개요 > 웹 아이콘(</>) 클릭
2. 앱 닉네임: `clotho-web`
3. Firebase Hosting 설정은 건너뛰기
4. **설정 정보 복사** (나중에 .env에 붙여넣기)

### 1-4. Firestore Database 생성
1. 왼쪽 메뉴 > **Firestore Database** 클릭
2. "데이터베이스 만들기" 클릭
3. **테스트 모드**로 시작 (개발용)
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
4. 위치: `asia-northeast3 (서울)` 선택
5. 완료

---

## 2. Gemini API 키 발급

### 2-1. Google AI Studio 접속
1. https://aistudio.google.com/ 접속
2. Google 계정으로 로그인

### 2-2. API 키 생성
1. 왼쪽 메뉴 > **Get API key** 클릭
2. **Create API key** 클릭
3. API 키 복사 (나중에 .env에 붙여넣기)

⚠️ **주의**: API 키는 절대 GitHub에 올리지 마세요!

---

## 3. 환경 변수 설정

### 3-1. .env 파일 수정
프로젝트 루트의 `.env` 파일을 열어서 다음과 같이 설정:

```env
# Firebase 설정 (Firebase Console의 앱 설정에서 복사)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=clotho-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=clotho-dev
VITE_FIREBASE_STORAGE_BUCKET=clotho-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Gemini API (Google AI Studio에서 발급받은 키)
VITE_GEMINI_API_KEY=AIzaSy...
```

### 3-2. 개발 서버 재시작
환경 변수 수정 후 개발 서버를 재시작해야 적용됩니다:

```bash
# 기존 서버 종료 (Ctrl + C)
# 다시 시작
npm run dev
```

---

## 4. 테스트

### 4-1. 기본 동작 확인
1. http://localhost:5173 접속
2. 텍스트 입력창에 아무 글이나 작성
3. "저장" 버튼 클릭
4. AI 분석 결과 확인 (카테고리, 감정, 키워드)

### 4-2. Firebase에서 데이터 확인
1. Firebase Console > Firestore Database
2. `entries` 컬렉션에 방금 저장한 데이터 확인

---

## 5. API 키 없이 테스트하기

Firebase나 Gemini API 키가 없어도 Mock 데이터로 테스트 가능합니다:

- **Firebase 미설정 시**: 브라우저 콘솔에 에러가 표시되지만 AI 분석은 작동
- **Gemini API 미설정 시**: 간단한 키워드 추출 알고리즘으로 분석

---

## 비용 확인

### 무료 티어 한도
- **Firestore**: 읽기 50,000회/일, 쓰기 20,000회/일
- **Gemini 1.5 Flash**: 분당 15 RPM (무료)

개인 사용 시 거의 무료입니다! 🎉

---

## 문제 해결

### Firebase 연결 오류
```
Error: Firebase: Error (auth/api-key-not-valid)
```
→ `.env` 파일의 `VITE_FIREBASE_API_KEY` 확인

### Gemini API 오류
```
Error: API key not valid
```
→ `.env` 파일의 `VITE_GEMINI_API_KEY` 확인

### 환경 변수가 적용되지 않음
→ 개발 서버 재시작 (`npm run dev`)

---

## 다음 단계

✅ Firebase 프로젝트 생성
✅ Firestore 데이터베이스 초기화
✅ Gemini API 키 발급
✅ .env 파일 설정
✅ 기본 저장 기능 테스트

다음으로 구현할 것:
- [ ] 기록 목록 및 상세 화면
- [ ] 카테고리별 시각화 탭
- [ ] 심층 분석 기능
