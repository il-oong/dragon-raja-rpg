; Custom NSIS include for electron-builder.
; electron-builder의 기본 close-application 로직이 WM_CLOSE에 반응하지 않는 인스턴스를
; 끝까지 종료시키지 못해 "System Monitor cannot be closed" 다이얼로그가 뜨는 문제를
; 해결하기 위해 설치 시작 전/설치 직전에 프로세스를 강제 종료한다.
;
; productName = "System Monitor" → 실행 파일 이름 "System Monitor.exe"
;
; v1.0.3 의 Sleep 300/500 ms 는 너무 짧아 taskkill 직후 tasklist 가 갱신되기 전에
; electron-builder 가 재확인하고 다이얼로그를 띄우는 race 가 있었다.
; v1.0.4: Sleep 을 충분히 늘리고 두 번째 패스로 자식·업데이터 프로세스까지 정리.

!macro killSysMon
  ; 1차: 메인 프로세스 + 자식 프로세스 트리 종료.
  nsExec::Exec 'taskkill /F /T /IM "System Monitor.exe"'
  Pop $0
  ; tasklist 가 갱신될 시간 확보 (Windows 에서 1~2초 걸리는 경우가 있음).
  Sleep 2000
  ; 2차: electron-updater 가 새로 spawn 한 인스턴스 / 잔여 자식 정리.
  nsExec::Exec 'taskkill /F /T /IM "System Monitor.exe"'
  Pop $0
  Sleep 1000
!macroend

; 설치 시작 직후: 실행 중인 인스턴스 강제 종료.
!macro customInit
  !insertmacro killSysMon
!macroend

; electron-builder 기본 customCloseApplication 매크로를 오버라이드.
; 창 제목 탐색이 아닌 프로세스 이름 기반 종료로 확실히 끝낸다.
!macro customCloseApplication
  !insertmacro killSysMon
!macroend

; 파일 복사 직전 한번 더 보강 (업데이터 경로 대비).
!macro customInstall
  !insertmacro killSysMon
!macroend

