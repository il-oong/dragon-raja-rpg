# Tauri 빌드 가이드

기존 Electron 빌드(~63MB)를 대체하는 Tauri 빌드(~5~10MB).

## 사전 설치

### 1. Rust
https://rustup.rs → rustup-init.exe 실행 → 기본값(Enter) 선택
```cmd
rustc --version
cargo --version
```

### 2. Visual Studio Build Tools
https://visualstudio.microsoft.com/downloads/ → "Build Tools for Visual Studio 2022" 다운로드
- 설치 시 **Desktop development with C++** 워크로드 체크
- 용량 ~5GB, 설치 시간 ~10분

### 3. WebView2 Runtime
Windows 11은 기본 포함. Windows 10은:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/
→ "Evergreen Standalone Installer" 다운로드·설치

## Tauri CLI 설치

```cmd
cd C:\Users\testos\Desktop\개인\몰래
npm install
```

## 빌드

### 개발 모드 (핫리로드)
```cmd
npm run tauri:dev
```

### 릴리스 빌드 (최종 exe)
```cmd
npm run tauri:build
```

결과물 위치:
- **MSI**: `src-tauri/target/release/bundle/msi/System Monitor_1.0.0_x64_ko.msi`
- **NSIS**: `src-tauri/target/release/bundle/nsis/System Monitor_1.0.0_x64-setup.exe`

## 아이콘 (선택)

`src-tauri/icons/icon.ico` 파일이 없으면 기본 아이콘 사용. 커스텀 아이콘 쓰려면 `icon.ico` 넣으면 됨.

## 문제 해결

- 빌드 에러 "link.exe not found": VS Build Tools 재설치 (C++ 워크로드 확인)
- "webview2 not found" (실행 시): WebView2 Runtime 설치
- 빌드 중 `cargo` 느림: 첫 빌드만 오래 걸림 (~5~10분). 2번째부턴 빠름.

## Electron vs Tauri 병행

현재 프로젝트는 **둘 다 동시 지원**:
- `npm run dist:portable` → Electron 빌드 (~63MB)
- `npm run tauri:build` → Tauri 빌드 (~5~10MB)

Rust 설치 안 된 환경에선 Electron만 사용 가능.
