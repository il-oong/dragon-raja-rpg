; Custom NSIS include for electron-builder.
; electron-builder의 기본 close-application 로직이 WM_CLOSE에 반응하지 않는 인스턴스를
; 끝까지 종료시키지 못해 "System Monitor cannot be closed" 다이얼로그가 뜨는 문제를
; 해결하기 위해 설치 시작 전/설치 직전에 프로세스를 강제 종료한다.
;
; productName = "System Monitor" → 실행 파일 이름 "System Monitor.exe"

!macro customInit
  ; 설치 시작 직후: 실행 중인 인스턴스 강제 종료 (자식 프로세스 포함).
  nsExec::Exec 'taskkill /F /T /IM "System Monitor.exe"'
  Pop $0
  Sleep 500
!macroend

!macro customInstall
  ; 파일 복사 직전 한번 더 보강 (업데이터 경로 대비).
  nsExec::Exec 'taskkill /F /T /IM "System Monitor.exe"'
  Pop $0
  Sleep 300
!macroend

; electron-builder 기본 customCloseApplication 매크로를 오버라이드.
; 창 제목 탐색이 아닌 프로세스 이름 기반 종료로 확실히 끝낸다.
!macro customCloseApplication
  nsExec::Exec 'taskkill /F /T /IM "System Monitor.exe"'
  Pop $0
  Sleep 300
!macroend
