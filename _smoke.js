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
  // 2026-08-19 사장님 픽 4건
  add('커버 단위 통일(bgpos)', src.indexOf('function covApplyFit') > -1 && src.indexOf("c.fit.u!=='pct'") < 0,
    '홈꾸미기 pct가 부활하면 커버가 다시 «가운데로» 리셋됨');
  add('프로필 채널 격리(2B)', src.indexOf('__reviewsSet) window.__reviewsSet([])') > -1,
    '빈 채널에 이전 채널 명함·후기가 새던 것');
  add('연락 걸음 진짜 판정(3A)', src.indexOf('resv-onoff') > -1 && src.indexOf('var actTypes={lead:1,service:1') < 0,
    '기본 틀만으로 3걸음이 ✓완료 되던 거짓 완료');
  add('A안 착지 뒤집기', src.indexOf("cm-hub-landing") > -1 && src.indexOf("__openLive && !window.__liveEditActive") > -1,
    '로그인하면 내 홈(현장 편집)으로 착지 — 되돌리기 토글 포함');
  add('작업실→현장 문', !!document.getElementById('hub-golive') || src.indexOf('hub-golive') > -1,
    '작업실 홈에서 현장 편집으로 가는 큰 문');
  add('링크 실주소(5B)', src.indexOf('function custUrl') > -1 && src.indexOf("'https://contenthub.kr/u/'+h") < 0,
    '미연결 도메인(contenthub.kr) 링크로 손님이 404 받던 것');

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
  const cw = document.documentElement.clientWidth;
  const over = document.documentElement.scrollWidth - cw;
  if (cw <= 0) add('가로 넘침', false, '창이 0px — 측정 불가(브라우저 창을 띄우고 다시)', 'warn');   // 헤드리스·숨겨진 창에서 거짓 BLOCK 방지
  else add('가로 넘침', over <= 1, over > 1 ? over + 'px 넘침' : '0px');

  // ── 8. 로그인·데이터 무결 (읽기만) ──
  let auth = null; try { auth = JSON.parse(localStorage.getItem('la-auth') || 'null'); } catch (e) {}
  add('로그인', !!(auth && auth.code), auth && auth.code ? auth.code + ' 로그인됨' : '로그인 후 다시 실행하세요', 'warn');
  try { JSON.parse(localStorage.getItem('cm-home-v1') || '{}'); add('홈 설정 파싱', true, 'cm-home-v1 정상'); }
  catch (e) { add('홈 설정 파싱', false, 'cm-home-v1 JSON 깨짐'); }

  // ── 9. 중복 id (런타임 DOM) ──
  const seen = {}, dups = [];
  document.querySelectorAll('[id]').forEach(el => { const i = el.id; if (seen[i]) { if (dups.indexOf(i) < 0) dups.push(i); } seen[i] = 1; });
  add('중복 id', !dups.length, dups.length ? dups.slice(0, 6).join(', ') : '0건', 'warn');

  // ── 10. 2026-08-20 리디자인 항목 (유형 4종·라임·유리 도크·작업실 톤) ──
  {
    const et = await fetch('edit.html').then(r => r.text()).catch(() => '');
    const ut = await fetch('u.html').then(r => r.text()).catch(() => '');
    if (et) {
      add('테마 9종(라임)', et.indexOf("['lime','#070A05','#C6FF4D'") >= 0, 'THEMES 라임 항목');
      add('유형 4종 프리셋', ['tbeauty:','tcreator:','texpert:','tresult:'].every(k => et.indexOf(k) >= 0), 'STYLE_PRESETS t*');
      add('유형 등급 (2026-08-20 확정)', et.indexOf('tbeauty:1, tresult:1') >= 0 && /SET_PRO[^;]*tcreator/.test(et) === false, '뷰티·비포애프터=프로 / 크리에이터·전문가=기본');
      add('잠금 이름 정확', et.indexOf("SET_NAME[setKey]") >= 0 && et.indexOf("tbeauty:'🌸 뷰티형'") >= 0, '잠길 때 남의 템플릿 이름이 뜨던 것 방지');
      add('그래프 기본=막대', et.indexOf("chart:'bars'") >= 0 && et.indexOf("[['bars','막대'") >= 0, '2026-08-20 사장님 확정');
      add('타임라인 flow 기본', et.indexOf("steps:'flow'") >= 0 && et.indexOf("[['flow','세로 타임라인'") >= 0, '세로 선+점 (1번 픽)');
      add('꾸미기 2단계', et.indexOf('색 · 테마</span>') >= 0 && et.indexOf('더 다듬기</span>') >= 0 && et.indexOf('for(var i=1;i<=2;i++)') >= 0, '4단계 구조 회귀 금지');
      add('내보내기 엔진', ['function expCaption','function expCards','function openPostExport','window.__openPostExport'].every(function(k){ return et.indexOf(k) >= 0; }), '인스타 캡션 · 카드뉴스 대본 (AI 0원)');
      add('내보내기 버튼 수명', et.indexOf("id='exp-fab'") >= 0 && et.indexOf("if(eb) eb.style.display='none'") >= 0, '포스팅 나가면 숨김 (떠 있는 채로 남던 사고 방지)');
      add('구성 고르기 화면', ['function openTypePick','window.__openTypePick','tpick-open','tpk-rail','scroll-snap-type'].every(function(k){ return et.indexOf(k) >= 0; }), '유형 4종 스와이프 픽커 (2026-08-20 확정판)');
      add('유형 적용 기록', et.indexOf('home.htype=setKey') >= 0, '«지금 쓰는 중» 배지 근거');
      add('뷰티 확정 구성', et.indexOf("{type:'stylegallery',name:'스타일 갤러리',content:[]},   /* 2026-08-20 확정") >= 0, '사진 아래 = 갤러리·가격·후기');
      add('포스팅별 모션 스위치', et.indexOf('post-f-motion') >= 0 && et.indexOf("p.motion=this.checked?'':'off'") >= 0, '발행 전 온오프 (2026-08-20 확정)');
      add('붙여넣기 자동 제안', et.indexOf('pstSuggest') >= 0 && et.indexOf('__pstSug') >= 0, '자동으로 «제안»만, 넣는 건 사장님 (다안)');
      add('전문가형=사진 위', et.indexOf('C1 원 픽') >= 0 && /texpert:\s*\[\s*\/\*[^*]*\*\/\s*\{type:'cover3'/.test(et), '이름을 위로 올렸던 드리프트 원복(2026-08-20)');
      add('붙여넣기 포스팅 엔진', ['function pstAnalyze','function pstToBlocks','function openPasteStart','window.__openPasteStart'].every(function(k){ return et.indexOf(k) >= 0; }), '규칙 엔진 4개 생존 (AI 0원)');
      add('붙여넣기 입구', et.indexOf("id=\"sfs-paste\"") >= 0 && et.indexOf("getElementById('sfs-paste').onclick") >= 0, '새 글 시트의 «붙여넣기로 시작» 버튼 + 배선');
      add('제목 렌더 전 확정', et.indexOf('createPost(type, blocksOverride, titleOverride)') >= 0 && et.indexOf('(titleOverride&&String(titleOverride).trim())') >= 0, '카드에 «새 글»로 남던 사고(2026-08-20)');
      add('logowall 배열형', et.indexOf("[['브랜드 1'],['브랜드 2']") >= 0, '문자열이면 한 글자 칩 «브·브·매·매» (2026-08-20 사고)');
      add('유형 타일 4종', ['data-set="tbeauty"','data-set="tcreator"','data-set="texpert"','data-set="tresult"'].every(k => et.indexOf(k) >= 0), '구성추가 타일');
      add('유형=통째 교체', et.indexOf('__typeSwapOK') >= 0 && et.indexOf('T4={tbeauty:1') >= 0, 'insertSet 명시 집합 분기');
      add('transform 삼킴 금지', et.indexOf('/^t/.test(setKey)') < 0, '정규식 /^t/가 기존 transform 템플릿을 삼키던 사고(2026-08-20)');
      add('작업실 개인 톤', et.indexOf('function applyEditorTone') >= 0 && /applyEditorTone\(\);\s*\}catch/.test(et), 'applyEditorTone + 즉시 1회');
      add('작업실 유리 도크', et.indexOf('작업실 유리 도크') >= 0 && et.indexOf('.ws-tab.on::before') >= 0, 'ws-tabs 알약');
      add('스코프 회귀 금지', et.indexOf('applyComposition(list);') < 0, 'insertSet에서 다른 스코프 applyComposition 직접 호출 금지(2026-08-20 사고)');
    }
    if (ut) {
      add('u 라임 테마', ut.indexOf('data-theme="lime"') >= 0, 'html[data-theme=lime]');
      add('u 유리 도크', ut.indexOf('유리 도크') >= 0 && ut.indexOf('.navitem.active::before') >= 0, 'botnav 알약+활성 원');
      add('u 영상=썸네일 클릭', ut.indexOf('vid-thumb') >= 0 && ut.indexOf("closest('.vid-thumb')") >= 0 && ut.indexOf('title="영상" loading="lazy"') < 0, '즉시 iframe 로드 금지 + 문서 위임(개별 리스너 소실 사고)');
      add('u 숫자 자동 강조', ut.indexOf('function numMark') >= 0 && ut.indexOf('.num-c{') >= 0 && ut.indexOf('html[data-bright="light"] .num-c') >= 0, '다크=칩/라이트=형광펜');
      add('u 세로 타임라인', ut.indexOf("layout==='flow'") >= 0 && ut.indexOf('.stf-dot{') >= 0, '선+점 레이아웃');
      add('u 숫자 차오름', ut.indexOf('function statCountWire') >= 0 && ut.indexOf('io.unobserve') >= 0, '보일 때 1회 (무한 금지)');
      add('u 글별 모션 끄기', ut.indexOf('rv-off') >= 0 && ut.indexOf("p.motion==='off'") >= 0, '#post-modal.rv-off 존중');
      add('u 라이트 유리 보정', ut.indexOf('라이트 유리 보정') >= 0 && ut.indexOf('html[data-theme="lavender"] .block') >= 0, '라이트 4종 .block 규칙 (.card는 존재하지 않는 클래스였음 — 2026-08-20 사고)');
      add('u 라이트 .card 금지', ut.indexOf('html[data-theme="lavender"] .card,') < 0, '매칭 0개 유령 선택자 재발 금지');
      // 🚨2026-08-20: 주석 문자열로 검사하다 내가 주석을 덮어써 오탐 BLOCK — «실물»로 검사한다
      var lightBodyDup = ['lavender','cream','pearl','aqua'].filter(function(k){
        return (ut.match(new RegExp('html\\[data-theme="' + k + '"\\] body\\{', 'g')) || []).length !== 1;
      });
      add('라이트 body 규칙 1곳씩', lightBodyDup.length === 0, lightBodyDup.length ? ('중복/누락: ' + lightBodyDup.join(',')) : '4종 각 1곳 (뒤엣것만 이기던 사고 방지)');
      add('광원 상·하 2점', ['lavender','cream','pearl','aqua','banghouse','night','dusk','sea','lime'].every(function(k){
        var m = ut.split('html[data-theme="' + k + '"] body')[1] || '';
        m = m.slice(0, 400);
        return m.indexOf('at 50% -3%') >= 0 && m.indexOf('at 50% 103%') >= 0;
      }), '9종 전부 위 하나 + 아래 하나 (사장님 «위에만 몰려 있다»)');
      add('u 도크 위성 보정', ['.cta-sticky{position:fixed; left:50%; transform:translateX(-50%); bottom:calc(', '.resv-fab{position:fixed; right:16px; bottom:calc(', '.fab{position:fixed; right:18px; bottom:calc('].every(k => ut.indexOf(k) >= 0), 'CTA·FAB 2종이 도크 위로(2026-08-20 겹침 사고)');
    }
    // 런타임: 테마 배열 9종 + 이름표
    if (typeof THEMES !== 'undefined') add('THEMES 런타임 9종', THEMES.length === 9, 'THEMES.length=' + THEMES.length);
    if (typeof THEME_NAMES !== 'undefined') add('라임 이름표', THEME_NAMES.lime === '라임', String(THEME_NAMES.lime));
  }

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
