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
  /* 🚨 2026-08-20 — 캐시 버스터 없이 받아오다가 «어제 파일»을 검사하고 있었다.
        서비스워커·브라우저 캐시가 옛 사본을 내주면 점검이 통째로 거짓말이 된다(통과도 실패도 못 믿음).
        ?_smoke=시각 + no-store 로 «지금 서버에 있는 것»만 검사한다. */
  const _fresh = (name) => fetch(location.pathname.replace(/[^/]*$/, name) + '?_smoke=' + Date.now(), { cache: 'no-store' }).then(r => r.text());
  let selfHtml = ''; try { selfHtml = await _fresh('edit.html'); } catch (e) {}
  let uHtml = '';    try { uHtml    = await _fresh('u.html'); } catch (e) {}

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
    add('u: ⚙메뉴 클릭 가능(스킨)', uHtml.indexOf('.gear-menu{ pointer-events:auto') > -1,
      '스킨 켠 페이지에서 topbar의 pointer-events:none 가 ⚙메뉴까지 먹어 「운영자 모드·로그아웃」이 무반응이던 사고 (2026-08-20)');
    add('u: 예약 바 가운데정렬(transform 비의존)', uHtml.indexOf('.cta-sticky{position:fixed; left:0; right:0; margin-left:auto') > -1,
      'left:50%+translateX(-50%) 로 되돌리면 등장 애니(.reveal-blk.in{transform:none})가 지워 바가 오른쪽으로 188px 밀린다 (2026-08-20)');
    add('u: 채널 아이콘이 예약 바를 안 덮음', uHtml.indexOf('body.has-cta-sticky #home-fab{ bottom:calc(168px') > -1,
      '128px 이면 바 윗변(157px)과 29px 겹쳐 「지금 예약하기」를 가린다 (2026-08-20)');
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
    /* 🚨 2026-08-20 — 여기도 캐시 버스터가 없어 «어제 파일»을 검사했다.
          위에서 이미 받아둔 최신본(selfHtml/uHtml)을 그대로 쓴다 — 왕복도 줄고 항상 «지금 것»이다. */
    const et = selfHtml || await _fresh('edit.html').catch(() => '');
    const ut = uHtml    || await _fresh('u.html').catch(() => '');
    if (et) {
      add('테마 9종(라임)', et.indexOf("['lime','#070A05','#C6FF4D'") >= 0, 'THEMES 라임 항목');
      /* 🚪 왕복 (2026-08-20) — 로그인하면 손님 화면 · ⚙로 편집실 · 비번 안 물음 */
      add('e 손님 화면 착지', et.indexOf("location.replace('u.html?u='") >= 0 && et.indexOf("get('desk')==='1'") >= 0,
        '로그인하면 «편집 도구가 얹힌 현장»이 아니라 진짜 손님 페이지로');
      add('e 착지 루프 차단', et.indexOf('!_fromGear') >= 0, '⚙로 들어왔을 땐 다시 안 튕긴다');
      add('e 👁 손님 화면 버튼', et.indexOf('id="go-customer-top"') >= 0 && et.indexOf('id="go-customer-top" style="display:none;"') < 0,
        '2026-07-07에 숨겨졌던 것 — 다시 숨으면 여기서 걸린다');
      add('e 손님 화면 = 진짜 페이지', et.indexOf('window.__openRealHome(true)') >= 0 && et.indexOf('goCT.onclick=function(){ if(window.__openCustomerPreview)') < 0,
        '🚨 주석은 «진짜 페이지»인데 미리보기를 부르던 배선 사고');
      add('e 자동 로그인', et.indexOf("Promise.resolve(window.laRpc('li_get_own'") >= 0 && et.indexOf('if(r && r.ok){ enter(); }') >= 0,
        'enter()가 «로그인 버튼»에서만 불려 매번 코드+PIN을 쳐야 했다');
      add('e 자동 로그인 만료 검사', et.indexOf('AUTH.expiresAt!=null') >= 0 && et.indexOf('_ex < new Date()') >= 0,
        '기간 지난 열쇠로 들어가지지 않게');
      add('e 폰 상단바 접기', et.indexOf('.topbar #ws-title .tb-who, .topbar .tb-lg') >= 0 && et.indexOf("_who.className='tb-who'") >= 0 && et.indexOf('class="tb-lg"') >= 0,
        '버튼 4개가 되며 제목이 16px로 눌리던 것 (실측 70px 회복)');
      /* ✏️ C안 + 📝 글쓰기 + 🚧 도크 잠금 (2026-08-20) */
      add('e ?live=1 바로 현장편집', et.indexOf("_wantLive=_q.get('live')==='1'") >= 0 && et.indexOf('window.__openLiveAuto()') >= 0,
        '«고치기»를 누르면 작업실을 안 거치고 바로 편집');
      add('e ?live=1 착지 안 튕김', et.indexOf('!_fromGear && !_wantLive') >= 0, '현장 편집으로 들어왔는데 손님 화면으로 다시 튕기면 안 된다');
      add('e 📝 글쓰기 버튼', et.indexOf('id="le-write"') >= 0 && et.indexOf("window.__switchWs('posts')") >= 0,
        '현장 편집엔 «홈 구성» 도구뿐이라 글을 쓰려면 작업실을 거쳐야 했다');
      add('e switchWs 노출', et.indexOf('window.__switchWs=switchWs') >= 0, '글쓰기 버튼이 부른다');
      add('e 🚧 도크 잠금(판매·예약만)', et.indexOf('var WS_SOON = { sales:1 }') >= 0 && et.indexOf('if(WS_SOON[name])') >= 0,
        '2026-08-20 「고객·분석」 개방 — 판매·예약만 잠금. 열 때 WS_SOON만 비우면 된다');
      add('e 📊 고객·분석 개방', et.indexOf('<button class="ws-tab" data-ws="data">') >= 0 && et.indexOf("WS_SOON = { sales:1, data:1 }") < 0,
        '추적은 쌓이는데 볼 화면이 막혀 있던 것 — 다시 잠기면 여기서 걸린다 (2026-08-20)');
      add('e 🗺 홈 지도 탭', et.indexOf('data-antab="hm"') >= 0 && et.indexOf('function anHomeMap') >= 0,
        '어느 칸이 일하고 어느 칸이 죽었나 — C안 (2026-08-20 사장님 픽)');
      add('e 홈 지도 온도색 톤독립', et.indexOf("HC={high:'#7DE0A6', mid:'#E6B84A', low:'#E0564B'}") >= 0,
        'var(--coral)로 되돌리면 초록 톤 계정에서 «잘 눌림»과 «보통»이 같은 색이 된다 (실측 #7DBF8E)');
      add('e 분석 탭바 한 줄', et.indexOf('.an-tabs{display:flex; gap:5px;') >= 0 && et.indexOf('overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none;}') >= 0,
        '탭 7개가 되며 글자가 두 줄로 눌리던 것 — 가로 스크롤로 한 줄 유지 (75px→45px)');
      add('e 🚧 잠금 표시', et.indexOf('class="ws-tab ws-soon" data-ws="sales"') >= 0 && et.indexOf('.ws-tab.ws-soon{ opacity:.34; }') >= 0,
        '«없음»을 «고장»처럼 그리지 않는다 — 흐릿하게 + 점 하나');
      add('e 열린 방 4개', et.indexOf('data-ws="home"') >= 0 && et.indexOf('data-ws="page"') >= 0 && et.indexOf('data-ws="posts"') >= 0 && et.indexOf('data-ws="data"') >= 0,
        '홈 · 프로필 · 포스팅 · 고객·분석 — 이 넷은 늘 열려 있어야 한다 (2026-08-20 분석 개방)');
      /* 🆕 신규 첫 경험 (2026-08-20 사장님 지시 5종) */
      add('e 자동저장은 공개 안 함', et.indexOf('여기서 li_publish(true) 를 부르는 바람에') >= 0,
        '🚨 가입만 해도 예시가 손님에게 공개되던 것 — 공개는 「적용」 누를 때만');
      add('e 예시 남음 경고', et.indexOf('window.__sampleLeft') >= 0 && et.indexOf('아직 예시 그대로인 곳이') >= 0,
        '배포해도 예시가 남아 있으면 알려준다(막지는 않음)');
      add('e 크리에이터 기본형', et.indexOf("applyStyle('tcreator')") >= 0,
        '신규 기본형 = 크리에이터 (이전은 에디토리얼 — 안내문·가짜 이벤트가 딸려왔다)');
      add('e 광고 = 메인 메뉴', et.indexOf("nm:'광고'") >= 0 && et.indexOf('window.__openAdRoom') >= 0,
        '사장님 «메인 메뉴답게» — 홈 지도에 광고 칸 + 온/오프');
      add('e 광고 온오프 한 값', et.indexOf('h.adOverlay=!!v') >= 0,
        '광고 방과 «꾸미기» 스위치가 home.adOverlay 하나를 같이 쓴다 — 어긋나지 않게');
      add('e 홈 지도 이름 통일', et.indexOf("nm:'프로필'") >= 0 && et.indexOf("nm:'포스팅'") >= 0 && et.indexOf("nm:'전문성 가시화'") < 0,
        '하단 도크와 홈 지도가 같은 이름이어야 헷갈리지 않는다');
      add('e 홈 지도 준비 중', et.indexOf('if(s.soon) cls+=') >= 0 && et.indexOf('!STEPS[_s].soon') >= 0,
        '잠근 칸은 «지금 할 일»로 안 잡힌다');
      add('e 추천 3개', et.indexOf('function paintAddReco') >= 0 && et.indexOf('이런 걸 더 놓을 수 있어요') >= 0,
        '구성 40종이라 처음엔 막막 — 지금 상태를 재서 다음 하나를 짚는다');
      add('e 추천은 이미 넣은 건 안 권함', et.indexOf('(has(c[0]) ? done : pick)') >= 0,
        '이미 있는 구성을 또 권하면 «앱이 내 홈을 모른다»가 된다');
      add('e 추천 = 기존 검색으로', et.indexOf("q.dispatchEvent(new Event('input'") >= 0,
        '별도 경로를 안 만든다(한 기능 두 군데 금지) — 검색칸에 넣어 아래 목록에서 찾게');
      add('e build 표시 없앰', et.indexOf('build 07·10') < 0,
        '로그인 화면은 처음 오는 사람이 보는 곳 — 개발용 표시를 두지 않는다');
      add('e 저장됨 초기 오표시', et.indexOf('id="le-autosave" title="고치면 자동으로 저장돼요"') >= 0 && et.indexOf('le-autosave is-saved" id=') < 0,
        '🚨 아무것도 저장 안 했는데 「저장됨 ✓」이라 적혀 있던 것 → 「자동 저장」');
      add('e 제목 한 줄 고정', et.indexOf('white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}') >= 0 && et.indexOf('.topbar{flex-wrap:nowrap;}') >= 0,
        '🚨 버튼 4개 + 채널 칩이면 제목이 «한 글자씩 세로로» 쏟아져 바가 287px로 부풀었다(실측)');
      add('e 상단바 접기 폭', et.indexOf('@media (max-width: 980px)') >= 0,
        '480px가 아니라 «버튼이 다 안 들어가는 폭»부터 접어야 한다 — 760px에서도 눌렸다');
      /* 👁 깜빡임 (2026-08-20 사장님 제보 «홈이나 운영자실이 얼핏 뜨다가 넘어간다») */
      add('e 착지 전 작업실 안 보임', et.indexOf('function __willLandHome') >= 0 && et.indexOf('내 홈으로 가는 중…') >= 0,
        '🚨 enter()가 덮개를 즉시 걷어 작업실이 900ms 보였다 — 착지 예정이면 덮개를 유지한다');
      add('e 착지 판정은 서버 안 기다림', et.indexOf("localStorage.getItem('cm-hub-landing')") >= 0 && et.indexOf("q.get('desk')==='1' || q.get('live')==='1'") >= 0,
        'localStorage·URL 만으로 즉시 판정 — 서버를 기다리면 그 사이 화면이 번쩍인다');
      add('e 검사용 파일 안 남음', et.indexOf('_flick.js') < 0, '임시 검사기가 배포에 섞이지 않게');
      /* 🚪 로그아웃 (2026-08-20 사장님 «로그아웃해도 로그아웃 안 돼») */
      add('e 로그아웃 = 흔적 전부', et.indexOf('window.__hubLogout') >= 0 && et.indexOf("'la-auth','la-last-code','la-ch-new','cm-hub-landing'") >= 0,
        '🚨 la-auth 만 지워 로그인칸에 내 코드가 남았다 — «로그아웃 안 된 것처럼» 보였다');
      add('e 로그아웃 스냅도 삭제', et.indexOf("k.indexOf('la-snap-')===0") >= 0,
        '옛 계정 데이터가 다음 로그인에 섞이지 않게');
      add('e 로그아웃 안내', et.indexOf('로그아웃됐어요') >= 0,
        '끝났다고 눈에 보이게 말해준다 — 안 그러면 «안 됐나?» 한다');
      add('유형 4종 프리셋', ['tbeauty:','tcreator:','texpert:','tresult:'].every(k => et.indexOf(k) >= 0), 'STYLE_PRESETS t*');
      add('유형 등급 (2026-08-20 확정)', et.indexOf('tbeauty:1, tresult:1') >= 0 && /SET_PRO[^;]*tcreator/.test(et) === false, '뷰티·비포애프터=프로 / 크리에이터·전문가=기본');
      add('잠금 이름 정확', et.indexOf("SET_NAME[setKey]") >= 0 && et.indexOf("tbeauty:'🌸 뷰티형'") >= 0, '잠길 때 남의 템플릿 이름이 뜨던 것 방지');
      add('그래프 기본=막대', et.indexOf("chart:'bars'") >= 0 && et.indexOf("[['bars','막대'") >= 0, '2026-08-20 사장님 확정');
      add('타임라인 flow 기본', et.indexOf("steps:'flow'") >= 0 && et.indexOf("[['flow','세로 타임라인'") >= 0, '세로 선+점 (1번 픽)');
      add('꾸미기 2단계', et.indexOf('색 · 테마</span>') >= 0 && et.indexOf('더 다듬기</span>') >= 0 && et.indexOf('for(var i=1;i<=2;i++)') >= 0, '4단계 구조 회귀 금지');
      add('내보내기 엔진', ['function expCaption','function expCards','function openPostExport','window.__openPostExport'].every(function(k){ return et.indexOf(k) >= 0; }), '인스타 캡션 · 카드뉴스 대본 (AI 0원)');
      add('내보내기 버튼 수명', et.indexOf("id='exp-fab'") >= 0 && et.indexOf("if(eb) eb.style.display='none'") >= 0, '포스팅 나가면 숨김 (떠 있는 채로 남던 사고 방지)');
      add('광고 스위치', et.indexOf('dz-adov') >= 0 && et.indexOf('home.adOverlay') >= 0, '홈 위에 띄우기 온오프');
      add('칩·매거진 기본값', et.indexOf("marquee:'chips'") >= 0 && et.indexOf("[['chips','정지 칩'") >= 0, '흐르는 띠는 선택지로만');
      add('구성 고르기 화면', ['function openTypePick','window.__openTypePick','tpick-open','tpk-rail','scroll-snap-type'].every(function(k){ return et.indexOf(k) >= 0; }), '유형 4종 스와이프 픽커 (2026-08-20 확정판)');
      add('유형 적용 기록', et.indexOf('home.htype=setKey') >= 0, '«지금 쓰는 중» 배지 근거');
      add('뷰티 확정 구성', et.indexOf("{type:'stylegallery',name:'스타일 갤러리',content:[]},   /* 2026-08-20 확정") >= 0, '사진 아래 = 갤러리·가격·후기');
      add('포스팅별 모션 스위치', et.indexOf('post-f-motion') >= 0 && et.indexOf("p.motion=this.checked?'':'off'") >= 0, '발행 전 온오프 (2026-08-20 확정)');
      add('기호 사전', et.indexOf('pst-help') >= 0 && (et.match(/pr-row/g)||[]).length >= 8, '붙여넣기 화면 8가지 규칙 — 초보자 혼자 쓰기');
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
      add('u 광고 오버레이', ['function initAdOverlay','function __adShow','function __adPill','uad-rail','scroll-snap-type'].every(function(k){ return ut.indexOf(k) >= 0; }), '3단 흐름 (2026-08-20)');
      add('u 광고 5원칙', ut.indexOf('__adKey()') >= 0 && ut.indexOf('adOverlay===false') >= 0 && ut.indexOf('uad-x') >= 0, '하루 한 번·사장님 스위치·✕ 오른쪽 위');
      add('u 광고 손님말 금지', (ut.split('function __adShow')[1]||'').split('function __adClose')[0].indexOf('>광고<') < 0, '손님 화면엔 «광고»라는 글자 안 씀');
      add('u 별표 강조', ut.indexOf('mk-em') >= 0 && ut.indexOf('function __markPass') >= 0, '**글자** = 강조 (기호 사전이 약속한 것)');
      add('u 마크 태그 안전', ut.indexOf("split(/(<[^>]+>)/)") >= 0, '태그 안(src·alt)은 안 건드림');
      add('u 정지 칩', ut.indexOf("layout==='chips'") >= 0 && ut.indexOf('.mq-chips{') >= 0, '흐르는 띠 대신 (발열 0)');
      add('u 매거진 격자', ut.indexOf("layout==='mag'") >= 0, '3장=큰1+작2 · 4장=2×2');
      // 🚨 발열 헌법 — «장식» 무한 반복은 0. 사용자가 켠 연출(갤러리·진입·레일)만 허용하되 안전망 필수
      var decorInf = ['laSlotBreathe','rvShim','evSoftPulse','lbPing','lbBlink','lvFloat','lsgPulse','avFloat','avGlow','prepB']
        .filter(function(k){ return new RegExp(k + '[^;}]*infinite').test(ut); });
      add('u 장식 무한애니 0', decorInf.length === 0, decorInf.length ? ('아직 무한: ' + decorInf.join(',')) : '장식 반복 전부 3회로 (2026-08-20)');
      add('u 모션 안전망', ut.indexOf('u-bg-idle') >= 0 && ut.indexOf('animation-play-state:paused') >= 0 && ut.indexOf('발열 헌법 전역 안전망') >= 0, '모션줄이기 + 백그라운드 탭이면 남은 반복도 정지');
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
      add('u 도크 위성 보정', ['.cta-sticky{position:fixed; left:0; right:0; margin-left:auto; margin-right:auto; bottom:calc(', '.resv-fab{position:fixed; right:16px; bottom:calc(', '.fab{position:fixed; right:18px; bottom:calc('].every(k => ut.indexOf(k) >= 0), 'CTA·FAB 2종이 도크 위로(2026-08-20 겹침 사고)');
    }
      /* ══ 📱 UX 마감 (2026-08-20) — 손님이 폰에서 실제로 겪던 4가지. 다시 빠지면 여기서 걸린다 ══ */
      add('u 입력칸 16px 하한', /font-size: 16px !important/.test(ut) && ut.indexOf('max-width: 768px') >= 0,
        'iOS가 16px 미만 입력칸에서 화면을 제멋대로 확대하던 것');
      add('u 체크박스 제외', ut.indexOf('input:not([type="checkbox"])') >= 0,
        '16px 일괄 적용에서 체크박스·라디오·range는 빼야 모양이 안 깨짐');
      add('u 글자 확대 차단', ut.indexOf('text-size-adjust: 100%') >= 0, '가로 화면에서 글자만 커지던 것');
      add('u 고무줄 차단', ut.indexOf('overscroll-behavior-y: none') >= 0 && ut.indexOf('overscroll-behavior: contain') >= 0,
        '목록 끝에서 뒤 화면이 딸려 내려오던 것');
      add('u 눌림 반응', /\.uad-go:active[^{]*\{[^}]*scale\(\.96\)/.test(ut),
        '광고·칩·영상 썸네일에 «쏙 들어갔다 나옴»이 없었음');
      /* 🚨 폰엔 «마우스 올림»이 없다 — hover 효과가 한 번 누르면 붙어버린다 (2026-08-20 사고) */
      var hovLeft = (ut.match(/^\s*[^@{}\n]*:hover[^{\n]*\{/gm) || []).filter(function (l) {
        return l.indexOf('data-edit') < 0            /* 편집기 전용 = 사장님만, 마우스 사용 */
          && l.indexOf('@media (hover:hover)') < 0   /* 이미 가드 안 */
          && l.indexOf('.la-slot') < 0              /* display:none, 편집 삽입 모드에서만 보임 */
          && l.indexOf('.settings-link') < 0;       /* opacity:.9 하나 + :active 짝 있음 = 무해 */
      });
      add('u hover 폰 가드', hovLeft.length === 0,
        hovLeft.length ? ('가드 없는 hover ' + hovLeft.length + '곳: ' + hovLeft[0].trim().slice(0, 50)) : '손님 화면 hover 14곳 전부 @media (hover:hover) 안');
      add('u hover 가드 개수', (ut.match(/@media \(hover:hover\) and \(pointer:fine\)/g) || []).length >= 14,
        '가드 블록이 통째로 지워지면 여기서 걸린다');
      add('u 자동재생도 가드', ut.indexOf("matchMedia('(hover:hover) and (pointer:fine)').matches") >= 0,
        '룩북 mouseenter 자동재생 — 폰에선 아예 안 단다');
      /* 🚪 왕복 (2026-08-20 사장님 픽) — 손님 화면 먼저 · ⚙로 편집실 */
      add('u ⚙ → 작업실 직행', ut.indexOf('href="edit.html?desk=1"') >= 0,
        '?desk=1 이 없으면 작업실이 다시 손님 화면으로 튕겨 무한 루프');
      /* ✏️ C안 (2026-08-20 사장님 픽) — 깨끗한 손님 화면 + «고치기» 한 번 */
      add('u ✏️ 고치기 = 내 홈만', ut.indexOf("String(a.handle).trim().toLowerCase()!==cur") >= 0 && ut.indexOf("edit.html?live=1") >= 0,
        '🚨 손님·남의 홈에서 보이면 안 된다 (요소를 아예 안 만든다)');
      add('u ✏️ 고치기 만료 검사', ut.indexOf('if(a.expiresAt!=null){ var ex=new Date(a.expiresAt)') >= 0,
        '기간 지난 열쇠로는 안 뜬다');
      /* 🙋 고객용 모드 탭 (2026-08-20 사장님 지시) — 소개→프로필 · 제품관/물어보는 칸은 아직 안 연다 */
      add('u 탭 = 프로필', ut.indexOf('<span>프로필</span>') >= 0 && ut.indexOf('<span>소개</span>') < 0,
        '손님 화면 하단 탭 「소개」 → 「프로필」');
      add('u 프로필 바로가기', ut.indexOf("'👤 프로필 보기 <b>→</b>'") >= 0 && ut.indexOf("['about','👤','프로필']") >= 0,
        '홈 안 링크·이름표까지 같이 바뀌었나');
      add('u 스토어·Q&A 잠금', ut.indexOf('var TAB_SOON = { shop:1, qna:1 }') >= 0 && ut.indexOf('if(TAB_SOON[tab]) hasData=false;') >= 0,
        '내용이 있어도 손님에겐 감춘다 — 열 때 TAB_SOON만 비우면 됨');
      /* 🆕 손님 메뉴 3개 확정 (2026-08-20) */
      add('u 포스팅 탭 상시', ut.indexOf("hideTab('archive', true)") >= 0 && ut.indexOf('arc-blank') >= 0,
        '글 0개여도 탭은 남기고 방 안에 정직한 한 줄');
      /* 🙋 손님 눈 — 「전문성」은 우리끼리 쓰는 말, 손님에겐 «프로필» (2026-08-20) */
      add('u 손님 화면 전문성 없앰', ut.indexOf('🏅 전문성 · 증거') < 0 && ut.indexOf('🏅 프로필 · 증거') >= 0,
        '손님이 보는 섹션 제목');
      add('u 빈 안내도 프로필', ut.indexOf('소개를 채워보세요') < 0,
        '«소개»가 아니라 «프로필»로 통일');
      /* 🔑 ⚙ 메뉴 (2026-08-20) — 운영자 모드 / 로그아웃 */
      add('u ⚙ 메뉴 2갈래', ut.indexOf("data-g=\"admin\"") >= 0 && ut.indexOf("data-g=\"out\"") >= 0,
        '사장님 «오른쪽 상단 누르면 운영자 모드·로그아웃 골라서»');
      add('u ⚙ 손님은 바로 통과', ut.indexOf('if(!a || !a.code){ return; }') >= 0,
        '로그인 안 한 손님은 메뉴 없이 바로 로그인 화면으로');
      add('u 로그아웃 열쇠 지움', ut.indexOf("'la-auth','la-last-code'") >= 0,
        '로그아웃하면 저장된 열쇠를 지운다(자동 로그인도 같이 풀림) · 2026-08-20 «흔적 전부» 방식으로 바뀜');
      add('u 로그아웃 같은 규칙', ut.indexOf("['la-auth','la-last-code','la-ch-new','cm-hub-landing']") >= 0,
        '손님 화면 ⚙ 로그아웃도 편집기와 똑같이 지운다 — 한 기능 두 규칙 금지');
      add('u :active 짝 생존', ut.indexOf('.pg-card:active') >= 0 && ut.indexOf('.gcard:active') >= 0 && ut.indexOf('.lbc.vplay .lbc-video') >= 0,
        'hover를 가드로 옮기며 :active·vplay를 같이 날리지 않았나');

      /* ══ 🔒 편집 게이트 (2026-08-20 보안 사고) — 손님이 주소에 &edit=1 을 붙이면 편집 버튼 9개가 보였다 ══ */
      add('u 편집=iframe 안에서만', /get\('edit'\)==='1'[\s\S]{0,220}window\.parent !== window/.test(ut),
        '주소 조작으로 «＋후기 추가·× 삭제»가 보이던 구멍');
      add('u 브릿지 출처 검사', ut.indexOf('ev.origin !== location.origin') >= 0,
        '남이 iframe 으로 감싸 가짜 데이터를 넣는 것 차단');
      /* ══ 📗 글 표지 3단 (2026-08-20) — ①고른 표지 ②글 안 첫 사진 ③제목 첫 글자 ══ */
      add('u ▦ 없앰', ut.indexOf('"arc-crow-th">\u25a6') < 0, '표지 없는 글에 ▦ 네모가 뜨던 것');
      add('u 표지 3단 함수', ut.indexOf('function postCover') >= 0 && ut.indexOf('function firstPhotoIn') >= 0 && ut.indexOf('function firstChar') >= 0, '세 함수 생존');
      add('u 타이포 표지', ut.indexOf('arc-crow-typo') >= 0 && ut.indexOf('arc-nocov-i') >= 0, '줄=첫 글자 칩 · 카드=분류색 큰 글자');
      /* 🚨 2026-08-20 사고 — .arc-crow-typo 를 .arc-crow-th «앞»에 두니 뒤엣것이 조용히 이겨 글자색이 안 먹었다(에러 0) */
      add('u 타이포 표지 순서', ut.indexOf('.arc-crow-th.arc-crow-typo{') >= 0 && ut.indexOf('.arc-crow-th{') < ut.indexOf('.arc-crow-th.arc-crow-typo{'), '.arc-crow-th 뒤 + 특이도 (0,2,0)');
      add('u 대표카드 빈표지', ut.indexOf("_fc?' style=\"background-image:url('") >= 0, '표지 없으면 «그냥 검정»이던 것 → 분류색');

    }
    /* 🔬 런타임 — 표지 뽑기가 «링크를 사진으로 오인»하지 않나 (제일 위험한 실수) */
    if (typeof window.__firstPhotoIn === 'function') {
      var F = window.__firstPhotoIn, C = window.__postCover, FC = window.__firstChar;
      var eq = function (g, w) { return g === w; };
      add('표지 깊은 곳 사진 찾기',
        eq(F([{ type: 'lookbook', content: ['t', '', '', [['x', 'data:image/webp;base64,LB', '', '']]] }], 0), 'data:image/webp;base64,LB'),
        '중첩 배열 안 사진도 찾는다');
      add('표지 링크 오인 금지',
        eq(F([{ type: 'video', content: ['https://youtu.be/abc', 't'] }], 0), '') &&
        eq(F([{ type: 'links', content: [['예약', 'https://booking.example.com/x']] }], 0), ''),
        '유튜브·일반 링크를 사진으로 쓰면 깨진 이미지가 뜬다');
      add('표지 우선순위',
        eq(C({ id: '_t1', cover: 'data:image/png;base64,MINE', blocks: [{ content: ['data:image/png;base64,AUTO'] }] }), 'data:image/png;base64,MINE') &&
        eq(C({ id: '_t2', cover: '', blocks: [{ content: ['data:image/png;base64,AUTO'] }] }), 'data:image/png;base64,AUTO'),
        '사장님이 고른 표지가 항상 이긴다');
      add('표지 무한재귀 방지', eq(F([[[[[[[['data:image/png;base64,X']]]]]]]], 0), ''), '깊이 6단에서 멈춘다');
      add('첫 글자 이모지 안전', eq(FC('🔥 시스루뱅'), '🔥') && eq(FC(''), '·'), 'charAt(0)이면 이모지가 반 토막 난다');
    }
    if (true) {
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
