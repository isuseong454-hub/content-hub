/* ══════════════════════════════════════════════════════════════
   🚨 배포 전 자동 점검 (스모크 테스트) — 컨텐츠 허브
   쓰는 법: edit.html을 로그인 상태로 띄우고 콘솔에서
            fetch('/_smoke.js').then(r=>r.text()).then(t=>eval(t))
   설계: «실제로 터진 사고»가 곧 항목. 사고가 나면 여기 한 줄 추가.
   ⚠️ 읽기만 한다 — 어떤 데이터도 만들거나 지우지 않는다.
   (2026-08-19 전수검수에서 신설 — 항목 대부분이 그날 잡은 사고들)
   ══════════════════════════════════════════════════════════════ */
(async function smoke() {
  const R = [];
  const add = (name, ok, msg, level) => R.push({ name, ok: !!ok, msg: msg || '', level: level || 'err' });
  const blocks = [...document.scripts].map(s => s.text || '').filter(t => t.trim());
  const src = blocks.join('\n');   // 문자열 검사는 «전 블록 합본»으로 (블록 나뉘어 있어 최대 블록만 보면 오탐)
  let selfHtml = ''; try { selfHtml = await fetch(location.pathname.replace(/[^/]*$/, 'edit.html')).then(r => r.text()); } catch (e) {}
  let uHtml = '';    try { uHtml    = await fetch(location.pathname.replace(/[^/]*$/, 'u.html')).then(r => r.text()); } catch (e) {}

  // ── 1. 문법 — 스크립트가 통째로 죽는 사고 (블록별 파싱) ──
  try { blocks.forEach(b => new Function(b)); add('스크립트 문법', true, blocks.length + '개 블록 · ' + (src.length / 1024 / 1024).toFixed(2) + 'MB 파싱 OK'); }
  catch (e) { add('스크립트 문법', false, String(e.message).slice(0, 80)); }

  // ── 2. 필수 함수 정의 — 지우다 옆 함수까지 잘리는 사고 ──
  const FN = ['applyData', 'loadPage', 'serialize', 'createPost', 'createGoalPost', 'openPostEdit',
    'buildScaffold', 'applyScaffold', 'openScaffoldStart', 'startScaffoldPost',
    'lcSanitizeHtml', 'lcRichToHtml', 'renderLandingCanvas', 'applyFmt',
    'openLandingInterview', 'buildInterviewLanding', 'autosaveDraft', 'cmTier', 'ensureLgfCss'];
  const missFn = FN.filter(f => src.indexOf('function ' + f) < 0);
  add('필수 함수 정의', !missFn.length, missFn.length ? '사라짐: ' + missFn.join(', ') : FN.length + '개 모두 존재');

  // ── 3. 필수 버튼·칸 — 마크업 실종 사고 ──
  const IDS = ['content-chooser', 'new-content-btn', 'drafts-folder-btn', 'top-save', 'open-settings',
    'landing-canvas', 'home-body', 'prod-lib', 'lg-code', 'lg-btn'];
  const missId = IDS.filter(i => !document.getElementById(i));
  add('필수 요소(id)', !missId.length, missId.length ? '없음: ' + missId.join(', ') : IDS.length + '개 모두 존재');

  // ── 4. 2026-08-19 전수검수 사고 항목들 (edit.html) ──
  add('소제목·인용 버튼(3인자 formatBlock)', src.indexOf("execCommand('formatBlock', false") > -1,
    '2인자 호출로 되돌아가면 소제목·❝인용 4버튼이 다시 죽는다');
  add('「그냥 글」·「카드뉴스」 배선', src.indexOf(".cc-opt, [data-cc]") > -1,
    'data-cc 버튼이 배선 밖으로 나가면 다시 무반응');
  add('임시저장 이어쓰기 복원', src.indexOf('__draftDirtyBaseline') > -1,
    '초안을 안 덮고 열면 옛 글이 열리고 4초 뒤 초안 소멸');
  add('CTA·소개 이중위임 가드', src.indexOf("hasAttribute('data-abfmt')") > -1,
    'CTA 세그가 소개 구성을 몰래 리셋하던 사고');
  add('채널 격리 리셋(빈 채널)', src.indexOf('postsData=[]; productsData=[]; qnaData=[]') > -1,
    '빈 채널 전환 시 이전 채널 글·상품 복제 사고');
  add('프로필 채우기 → page', src.indexOf("__switchWs('page')") > -1 && src.indexOf("__switchWs('profile')") < 0,
    "'profile' pane은 없어 백지가 되던 사고");
  add('상품 시트 재배선', src.indexOf('sl-pane[data-slpane="sell"]') > -1,
    '라이브편집 ＋상품이 옛 pane을 불러 죽은 버튼이던 사고');
  add('window.AUTH 노출', src.indexOf('window.AUTH=AUTH') > -1 || src.indexOf('window.AUTH = AUTH') > -1,
    '멀티채널 핸들 동기화가 전부 no-op이던 사고');
  add('dz→메뉴 자동저장 재개', src.indexOf('__pageAutosaveResume) window.__pageAutosaveResume();') > -1,
    '브릿지가 pause를 안 풀어 이후 편집이 저장 안 되던 사고');

  // ── 5. CSS 층 사고 항목 (자기 소스 fetch로 검사) ──
  add('토스트 최상위(z100200)', /\.toast\{[^}]*z-index:100200/.test(selfHtml),
    'z90이면 모달 안 토스트가 전부 가려진다', selfHtml ? 'err' : 'warn');
  add('예약 미리보기 z(130)', /#allprev-ov\{[^}]*z-index:130/.test(selfHtml),
    'z95면 예약설정 뒤에 열려 죽은 버튼처럼 보인다', selfHtml ? 'err' : 'warn');
  add('iOS 입력 16px 규칙', selfHtml.indexOf('pointer:coarse){ input:not([type=checkbox])') > -1,
    '없으면 아이폰에서 입력마다 화면 확대', selfHtml ? 'err' : 'warn');
  add('선택버블 개명(.lc-selbar)', selfHtml.indexOf('.lc-selbar{') > -1 && !/\.lc-tb\{\s*position:fixed/.test(selfHtml),
    '표(.lc-tb)와 이름 충돌하던 옛 버블 CSS 부활 감지');

  // ── 6. 손님 화면(u.html) 사고 항목 ──
  if (uHtml) {
    add('u: 강조 CSS(.em/.gd)', uHtml.indexOf('.post-body .em{') > -1 && uHtml.indexOf('.post-body .gd{') > -1,
      '강조색·그라데가 손님에게 평문으로 보이던 사고');
    add('u: 크창 스킨 잔류 방지', (uHtml.split("classList.remove('lps-dark'")[1] || '').slice(0, 200).indexOf('lps-crchang') > -1,
      '스킨 remove 목록에 crchang 빠지면 다음 글이 오염');
    add('u: 직링크 닫기 이탈 방지', uHtml.indexOf('history.replaceState(null') > -1 && uHtml.indexOf('history.state.hnp') > -1,
      '?p= 직링크 닫으면 인스타로 튕기던 사고');
    add('u: 아카이브 빈탭 판정(live)', uHtml.indexOf('var liveN=') > -1,
      '전부 비공개여도 가짜 샘플이 노출되던 사고');
    add('u: 룩북 그리드 파싱', uHtml.indexOf('b.content&&b.content[3]') > -1,
      '제목 첫 글자가 스타일 타일로 깨져 들어가던 사고');
    add('u: 표 가로 스크롤', uHtml.indexOf('lc-tbwrap') > -1, '넓은 표가 잘리던 사고');
  } else {
    add('u.html 읽기', false, 'fetch 실패 — u 항목 검사 못 함', 'warn');
  }

  // ── 7. 화면 — 가로 넘침 ──
  const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  add('가로 넘침', over <= 1, over > 1 ? over + 'px 넘침' : '0px');

  // ── 8. 로그인·데이터 무결 (읽기만) ──
  let auth = null; try { auth = JSON.parse(localStorage.getItem('la-auth') || 'null'); } catch (e) {}
  add('로그인', !!(auth && auth.code), auth && auth.code ? auth.code + ' 로그인됨' : '로그인 후 다시 실행하세요', 'warn');
  try { JSON.parse(localStorage.getItem('cm-home-v1') || '{}'); add('홈 설정 파싱', true, 'cm-home-v1 정상'); }
  catch (e) { add('홈 설정 파싱', false, 'cm-home-v1 JSON 깨짐'); }

  // ── 9. 중복 id (런타임 DOM) ──
  const seen = {}, dups = [];
  document.querySelectorAll('[id]').forEach(el => { const i = el.id; if (seen[i]) { if (dups.indexOf(i) < 0) dups.push(i); } seen[i] = 1; });
  add('중복 id', !dups.length, dups.length ? dups.slice(0, 6).join(', ') : '0건', 'warn');

  /* ── 결과 출력 ── */
  const bad = R.filter(x => !x.ok && x.level !== 'warn');
  const warn = R.filter(x => !x.ok && x.level === 'warn');
  const line = x => (x.ok ? '✅' : x.level === 'warn' ? '⚠️' : '❌') + ' ' + x.name + (x.msg ? ' — ' + x.msg : '');
  const report = R.map(line).join('\n');
  console.log('%c🚨 배포 전 자동 점검 — 컨텐츠 허브', 'font-size:15px;font-weight:900');
  console.log(report);
  console.log(bad.length ? '%c⛔ 배포 금지 — 빨간 줄 ' + bad.length + '개' : '%c✅ 배포 가능' + (warn.length ? ' (경고 ' + warn.length + ')' : ''),
    'font-size:14px;font-weight:900;color:' + (bad.length ? '#E0564B' : '#9BE8B4'));
  return { verdict: bad.length ? 'BLOCK' : (warn.length ? 'PASS_WITH_WARN' : 'PASS'), fail: bad.length, warn: warn.length, report };
})();
