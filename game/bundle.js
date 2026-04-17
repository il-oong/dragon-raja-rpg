// Tauri 환경용 브리지
// game/data.js 와 game/engine.js 는 CommonJS (module.exports) 인데
// Tauri 웹뷰는 브라우저라 require가 없다. 전역에 노출한다.
// 이 파일은 Electron에선 무시됨 (require 로드 실패 시 fallback 용).
(function (global) {
  // data.js / engine.js 는 이 bundle.js 호출 전에 classic script로 로드되어
  // module.exports 패턴이 통하지 않으므로, 아래 global에 수동 연결을 기대한다.
  // 실제 연결은 빌드 시 별도 스크립트로 하거나, index.html에서 직접 require polyfill 제공.
})(typeof window !== 'undefined' ? window : globalThis);
