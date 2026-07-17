# BUILD:UP 배포 가이드 (처음 하시는 분용)

이 문서를 위에서부터 순서대로 따라 하시면 실제 인터넷 주소로 접속 가능한 사이트가 완성됩니다.
전체 과정은 크게 4단계입니다: **① Firebase(데이터 저장소) 만들기 → ② 내 컴퓨터에서 테스트 → ③ GitHub에 코드 올리기 → ④ Vercel로 배포**

예상 소요 시간: 30~50분 (설치 프로그램 다운로드 시간 포함)

---

## 0. 준비물

- 구글 계정 (Firebase용)
- 이메일 주소 (GitHub 가입용)
- Windows 또는 Mac 컴퓨터

---

## 1. 필요한 프로그램 설치

### 1-1. Node.js 설치
1. https://nodejs.org 접속
2. **LTS** 버전 다운로드 후 설치 (설치 중 옵션은 모두 기본값으로 "다음" 누르면 됨)
3. 설치가 끝나면 확인: 터미널(Mac은 `터미널` 앱, Windows는 `명령 프롬프트` 또는 `PowerShell`)을 열고 아래 입력

   ```
   node -v
   ```
   버전 번호(예: v20.11.0)가 나오면 성공입니다.

### 1-2. Git 설치
1. https://git-scm.com/downloads 접속 후 운영체제에 맞는 설치 파일 다운로드, 설치 (옵션 모두 기본값)
2. 터미널에서 확인:
   ```
   git --version
   ```

---

## 2. Firebase 프로젝트 만들기 (데이터 저장소)

게시글과 지원자 정보를 저장할 무료 데이터베이스를 만드는 단계입니다.

1. https://console.firebase.google.com 접속 후 구글 계정으로 로그인
2. **프로젝트 추가** 클릭 → 프로젝트 이름 입력 (예: `buildup-board`) → 계속
3. Google Analytics는 꺼도 됩니다 → **프로젝트 만들기**
4. 왼쪽 메뉴에서 **빌드 > Firestore Database** 클릭 → **데이터베이스 만들기**
5. 위치는 `asia-northeast3 (서울)` 선택 권장 → **테스트 모드에서 시작** 선택 → 사용 설정
   - 테스트 모드는 30일간 누구나 읽고 쓸 수 있게 열어두는 설정입니다. 30일이 지나면 아래 "보안 규칙" 항목을 다시 확인해 주세요.
6. 왼쪽 위 **⚙️ 프로젝트 설정** 클릭 → 아래로 스크롤해서 **내 앱** 항목에서 `</>` (웹) 아이콘 클릭
7. 앱 닉네임 입력 (예: `web`) → Firebase Hosting은 체크하지 않아도 됩니다 → **앱 등록**
8. 화면에 나오는 `firebaseConfig` 코드가 보입니다. 아래처럼 생겼어요:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "buildup-board.firebaseapp.com",
     projectId: "buildup-board",
     storageBucket: "buildup-board.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
   };
   ```
   이 값들을 이 프로젝트의 `src/firebase.js` 파일을 열어서 `"여기에_..."` 부분에 각각 붙여넣고 저장하세요.

### Firestore 보안 규칙 (30일 이후를 위해)
Firestore Database > 규칙 탭에서 아래 규칙을 붙여넣고 **게시**하면, 별도 로그인 시스템 없이도 계속 열려있는 게시판으로 유지됩니다. (이 사이트는 회원 로그인이 없는 구조라 완전한 보안은 어렵습니다. 학교/동아리 같은 소규모 용도로 적합해요.)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boardData/main {
      allow read, write: if true;
    }
  }
}
```

---

## 3. 내 컴퓨터에서 테스트 실행 (선택이지만 추천)

1. 이 프로젝트 폴더를 원하는 위치에 압축 해제
2. 터미널에서 그 폴더로 이동 (예시):
   ```
   cd 경로/buildup-team-board
   ```
3. 필요한 패키지 설치:
   ```
   npm install
   ```
4. 실행:
   ```
   npm run dev
   ```
5. 터미널에 나오는 주소(예: `http://localhost:5173`)를 브라우저에서 열어 정상 작동하는지 확인
   - 게시글이 잘 등록되고 새로고침해도 남아있으면 Firebase 연결 성공입니다.
6. 확인이 끝나면 터미널에서 `Ctrl + C`로 종료

---

## 4. GitHub에 코드 올리기

1. https://github.com 에서 계정 만들기 (이미 있다면 로그인)
2. 오른쪽 위 **+** → **New repository** 클릭
3. Repository name에 `buildup-team-board` 입력 → Public 선택 → **Create repository**
4. 프로젝트 폴더에서 터미널로 아래 명령을 순서대로 입력 (GitHub이 만들어준 화면에 나오는 주소로 `깃허브주소` 부분을 바꿔주세요):

   ```
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin 깃허브주소.git
   git push -u origin main
   ```
5. GitHub 저장소 페이지를 새로고침하면 파일들이 올라와 있는 것을 확인할 수 있습니다.

---

## 5. Vercel로 배포하기

1. https://vercel.com 접속 → **Continue with GitHub**으로 가입/로그인 (방금 만든 GitHub 계정 사용)
2. **Add New... > Project** 클릭
3. 방금 올린 `buildup-team-board` 저장소를 찾아 **Import**
4. 설정은 대부분 자동 인식됩니다 (Framework: Vite). 별도 입력 없이 **Deploy** 클릭
5. 1~2분 기다리면 배포 완료! `https://buildup-team-board-xxxx.vercel.app` 같은 주소가 생성됩니다.
6. 이 주소를 아무에게나 공유하면 바로 접속해서 사용할 수 있습니다.

앞으로 코드를 수정하고 싶으면, 파일을 고친 뒤 아래 명령으로 GitHub에 다시 올리면 Vercel이 자동으로 재배포합니다:
```
git add .
git commit -m "수정 내용"
git push
```

---

## 6. 배포 후 확인할 것

- **관리자 비밀번호 변경**: `src/App.jsx` 파일에서 `const ADMIN_PASSWORD = "admin1234";` 부분을 원하는 비밀번호로 바꾼 뒤, 다시 `git add . / git commit / git push` 하면 반영됩니다.
- **여러 사람이 동시 접속 가능**: 모든 방문자가 같은 Firestore 데이터베이스를 함께 봅니다. 실시간으로 새로고침해야 최신 글이 보입니다.
- **개인정보(학번 등) 주의**: 이 구조는 회원 인증이 없는 공개 게시판이라, 지원자 정보 보호를 위해 꼭 필요한 최소한의 인원에게만 게시판 주소를 공유하시길 권장합니다.

## 7. (선택) 내 도메인 연결하기
Vercel 프로젝트 > Settings > Domains 에서 보유한 도메인을 입력하고, 도메인 구매처(가비아, 후이즈 등)의 DNS 설정에 Vercel이 안내하는 값을 등록하면 `www.내주소.com` 같은 형태로 접속 가능합니다.

## 문제 해결
- **화면이 하얗게 뜨고 아무것도 안 보임**: 브라우저에서 F12 눌러 콘솔 오류 확인 → 대부분 `firebase.js`의 값이 잘못 붙여넣어진 경우입니다.
- **글을 등록해도 저장이 안 됨**: Firestore 보안 규칙이 게시(발행)되지 않았을 수 있습니다. 2단계 "Firestore 보안 규칙"을 다시 확인하세요.
- **npm install 오류**: Node.js가 제대로 설치되었는지 `node -v`로 다시 확인하세요.
