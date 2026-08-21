/* ══════════════════════════════════════════════════════════════
   🚨 배포 전 자동 점검 (스모크 테스트) — 컨텐츠 허브
   쓰는 법: edit.html을 로그인 상태로 띄우고 콘솔에서
            fetch('/_smoke.js').then(r=>r.text()).then(t=>eval(t))
   설계: «실제로 터진 사고»가 곧 항목. 사고가 나면 여기 한 줄 추가.
   🚨 «이 문구가 있으면 안 된다» 류 항목을 쓸 때 주의 — 그 문구를 «주석에» 적으면
      검사기가 자기 주석을 잡아 빨간 줄이 뜬다. 2026-08-20에만 세 번 밟았다. 주석엔 풀어서 쓸 것.
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
    /* 🧱 대공사 2026-08-20 — 라이트(현장 편집) 정리 */
    add('u: 칸 «⋯ 수정» 하나로', uHtml.indexOf("more.className='la-ed-btn la-ed-more'") > -1 && uHtml.indexOf("type:'la-block-menu'") > -1,
      '칸마다 ✎수정+🗑삭제 두 개가 붙어 «버튼이 너무 많다»던 것 — 하나로 모음 (2026-08-20 사장님 지시)');
    add('u: 옛 칸 삭제버튼 부활 금지', uHtml.indexOf("la-ed-btn la-ed-del'; del.textContent='🗑 삭제'") < 0,
      '되살아나면 칸마다 버튼이 다시 두 개가 된다');
    add('u: 칸 버튼은 오른쪽 위', uHtml.indexOf('.la-ed-bar{position:absolute; top:-30px; right:4px') > -1,
      '세로 가운데·선택해야 보임으로 되돌리면 있는 줄도 모른다 (사장님: «틀 오른쪽 상단에 조그마한 수정»)');
    add('u: 흐린 뼈대(애플식)', uHtml.indexOf('la-sk-b') > -1 && uHtml.indexOf('.la-empty-block{background:rgba(255,255,255,.022)') > -1,
      '또렷한 보라 박스로 되돌리면 «가짜 내용»처럼 읽힌다 — 자리표시는 흐리게 + 막대만 (2026-08-20)');
    add('u: 예약 단계가 label로 저장', uHtml.indexOf("track('resv',{step:'open', label:'open'})") > -1 && uHtml.indexOf("label:'submit'") > -1,
      'li_event 는 payload의 step 키를 버린다 — label 에 안 실으면 예약 4단계가 한 덩어리가 되어 5칸 퍼널이 0으로 나온다 (2026-08-20)');
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

  /* ══════════════════════════════════════════════════════════════
     📏 실측 검사 (2026-08-20 신설) — 사장님 «자동검수를 몇 번 했는데 왜 못 잡느냐»
        여태 184개가 전부 «코드에 이 글자가 있나»만 봤다. 화면을 안 그려보니
        겹침·안 읽히는 글씨·중복·작은 버튼을 원리상 못 잡았다.
        여기부터는 «진짜 화면을 재본다». 열려 있지 않은 화면은 조용히 건너뛴다.
     ══════════════════════════════════════════════════════════════ */
  function _vis(el){ if(!el) return false; var cs=getComputedStyle(el);
    return cs.display!=='none' && cs.visibility!=='hidden' && el.getClientRects().length>0; }
  function _rect(el){ return el.getBoundingClientRect(); }
  function _hit(a,b){ return !(a.bottom<=b.top||a.top>=b.bottom||a.right<=b.left||a.left>=b.right); }
  function _lum(c){ var m=(c||'').match(/[\d.]+/g); if(!m) return null;
    var f=[0,1,2].map(function(i){ var v=parseFloat(m[i])/255; return v<=.03928? v/12.92 : Math.pow((v+.055)/1.055,2.4); });
    return .2126*f[0]+.7152*f[1]+.0722*f[2]; }
  function _contrast(fg,bg){ var a=_lum(fg), b=_lum(bg); if(a==null||b==null) return null;
    var hi=Math.max(a,b), lo=Math.min(a,b); return (hi+.05)/(lo+.05); }

  /* ① 중복 — 같은 껍데기가 두 번 그려지면 상단바·도크가 두 겹으로 보인다 (2026-08-20 실제 사고) */
  (function(){
    var dup=[];
    [['상단바','.le-bar'],['편집 도크','.le-dock'],['편집 오버레이','#live-edit-ov'],['브랜드 인트로','#cm-intro'],['로그인 덮개','#login-ov']]
      .forEach(function(x){ var n=document.querySelectorAll(x[1]).length; if(n>1) dup.push(x[0]+' '+n+'개'); });
    add('📏 껍데기 중복 없음', !dup.length, dup.length? dup.join(', ') : '상단바·도크·오버레이 각 1개');
  })();

  /* ①-2 같은 버튼이 두 번 — «편집 끝내기가 왜 또 두 개냐» (2026-08-21 사고). 화면에 보이는 글자로 센다 */
  (function(){
    var seen={}, dup=[];
    [].slice.call(document.querySelectorAll('button, a[role="button"], .mine-edit')).forEach(function(el){
      if(!_vis(el)) return;
      var t=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(!t || t.length<3 || t.length>16) return;
      if(!/편집|끝내기|저장|글쓰기|구성 추가|미리보기/.test(t)) return;   // 헷갈리면 큰일 나는 «행동 버튼»만
      seen[t]=(seen[t]||0)+1;
    });
    Object.keys(seen).forEach(function(k){ if(seen[k]>1) dup.push(k+' ×'+seen[k]); });
    add('📏 같은 행동 버튼 중복 없음', !dup.length, dup.length? dup.join(', ') : '행동 버튼 이름 겹침 0');
  })();

  /* ② 겹침 — 화면에 «떠 있는» 것들끼리 자리를 뺏는지 (편집 버튼 ↔ 배너 사고) */
  (function(){
    var fixed=[].slice.call(document.querySelectorAll('body *')).filter(function(el){
      if(!_vis(el)) return false; var cs=getComputedStyle(el); if(cs.position!=='fixed') return false;
      var r=_rect(el); return r.width>24 && r.height>16 && r.width<innerWidth*0.98;
    }).slice(0,24);
    var bad=[];
    for(var i=0;i<fixed.length;i++) for(var j=i+1;j<fixed.length;j++){
      if(fixed[i].contains(fixed[j])||fixed[j].contains(fixed[i])) continue;
      var a=_rect(fixed[i]), b=_rect(fixed[j]);
      if(!_hit(a,b)) continue;
      var ov=Math.min(a.right,b.right)-Math.max(a.left,b.left);
      var oh=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
      if(ov>10 && oh>10) bad.push((fixed[i].id||fixed[i].className||'?').toString().slice(0,18)+' ↔ '+(fixed[j].id||fixed[j].className||'?').toString().slice(0,18));
    }
    add('📏 떠 있는 것 겹침 없음', !bad.length, bad.length? bad.slice(0,3).join(' / ') : '검사한 고정요소 '+fixed.length+'개 · 겹침 0', bad.length?'err':'ok');
  })();

  /* ③ 글씨가 배경에 묻히나 — «안 보이잖아» 사고 (WCAG 3:1 미만이면 잡는다) */
  (function(){
    /* 🚨 2026-08-20 — 반투명 배경(rgba(0,0,0,.05))을 «검정»으로 읽어 멀쩡한 버튼을 1.4:1 로 잡던 계산 결함.
          알파가 있으면 «뒤 배경 위에 겹쳐» 실제 보이는 색을 만들어야 한다. */
    function _parse(c){ var m=(c||'').match(/[\d.]+/g); if(!m) return null;
      return {r:+m[0], g:+m[1], b:+m[2], a:(m.length>3? +m[3] : 1)}; }
    function bgOf(el){
      var stack=[], n=el;
      while(n && n!==document.documentElement){ var c=_parse(getComputedStyle(n).backgroundColor);
        if(c && c.a>0){ stack.push(c); if(c.a>=1) break; } n=n.parentElement; }
      var base=_parse(getComputedStyle(document.body).backgroundColor)||{r:255,g:255,b:255,a:1};
      if(!stack.length || stack[stack.length-1].a<1) stack.push({r:base.r,g:base.g,b:base.b,a:1});
      var out=stack.pop();
      while(stack.length){ var t=stack.pop();
        out={ r:t.r*t.a+out.r*(1-t.a), g:t.g*t.a+out.g*(1-t.a), b:t.b*t.a+out.b*(1-t.a), a:1 }; }
      return 'rgb('+Math.round(out.r)+', '+Math.round(out.g)+', '+Math.round(out.b)+')';
    }
    /* 🚨 그라데이션 배경은 backgroundColor 가 «투명»이라 뒷 배경과 비교돼 «흰 위 흰 글씨»로 오판된다.
          실제로는 그라데이션(진한 보라) 위 흰 글씨라 잘 보인다 → 그런 요소는 건너뛴다. */
    function _hasGrad(el){ var n=el; for(var i=0;i<4&&n;i++,n=n.parentElement){
      var bi=getComputedStyle(n).backgroundImage||''; if(bi.indexOf('gradient')>=0) return true; } return false; }
    var bad=[], skipped=0;
    [].slice.call(document.querySelectorAll('.le-bar button, .le-dock .le-d-lbl, .an-tabs button, .ws-tab')).forEach(function(el){
      if(!_vis(el)) return;
      if(el.disabled){ skipped++; return; }              /* 꺼진 버튼은 일부러 흐리다 */
      if(_hasGrad(el)){ skipped++; return; }
      var r=_contrast(getComputedStyle(el).color, bgOf(el));
      if(r!=null && r<3) bad.push((el.textContent||'').trim().slice(0,10)+' '+r.toFixed(1)+':1');
    });
    add('📏 글씨 대비 3:1 이상', !bad.length, bad.length? ('묻힘: '+bad.slice(0,4).join(', ')) : ('검사한 글자 전부 읽힘'+(skipped?' · 그라데 배경 '+skipped+'개는 잴 수 없어 건너뜀':'')));
  })();

  /* ④ 손가락 자리 — 44px 권장, 40px 미만이면 잡는다 */
  (function(){
    var small=[];
    [].slice.call(document.querySelectorAll('.le-bar button, .le-dock button, .ws-tab, .an-tabs button')).forEach(function(el){
      if(!_vis(el)) return; var r=_rect(el);
      if(r.height>0 && r.height<40) small.push((el.textContent||el.id||'?').trim().slice(0,10)+' '+Math.round(r.height)+'px');
    });
    add('📏 누르는 자리 40px 이상', !small.length, small.length? small.slice(0,4).join(', ') : '검사한 버튼 전부 충분', small.length?'warn':'ok');
  })();

  /* ⑤ 진짜 눌리나 — 버튼 한가운데를 눌렀을 때 그 버튼이 잡히는지 (⚙메뉴 pointer-events 사고) */
  (function(){
    /* 🚨 시트·팝업이 열려 있으면 뒤 버튼이 가려지는 게 «정상»이다 — 그걸 사고로 잡으면 안 된다 */
    if(document.querySelector('.ov.open, #tpk-ov.open, #live-sheet-ov.open')){
      add('📏 버튼이 실제로 눌림', true, '시트가 열려 있어 건너뜀 — 닫고 다시 돌리면 검사한다', 'ok'); return;
    }
    var blocked=[];
    ['le-quit','le-x','new-content-btn'].forEach(function(id){
      var el=document.getElementById(id); if(!el||!_vis(el)) return;
      var r=_rect(el); var top=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
      if(!top || !(top===el || el.contains(top) || top.contains(el))) blocked.push(id);
    });
    add('📏 버튼이 실제로 눌림', !blocked.length, blocked.length? ('가려짐: '+blocked.join(', ')) : '검사한 버튼 전부 손가락이 닿음');
  })();

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
      /* 🧭 세 걸음 도크 (2026-08-20 A안 → 글쓰기는 포스팅 칸으로 이사) */
      add('e ⭐ 칸 메뉴 5+1', et.indexOf('function openBlockMenu') >= 0 && et.indexOf("m.type==='la-block-menu'") >= 0,
        '고치기·바꾸기·위·아래·숨기기·빼기 — 숨기기와 빼기를 나눈 게 핵심 (2026-08-20)');
      add('e 🧥 스킨 고르는 칸 삭제', et.indexOf('id="dz-skin"') < 0,
        '스킨은 «홈 유형» 4종이 자동으로 입힌다 — 고르는 칸이 부활하면 안 된다 (사장님 지시)');
      /* 🧱 새 세팅 (2026-08-20) — 유형 4종을 3칸으로 + 구독·문의·예약신청 기본 제외 */
      add('e 만들어진 카피 없음(홈 프리셋)', ['이런 고민, **있으시죠?**','사실, **이게 원인**이에요','그래서, **이렇게 해결**해요','이렇게 바뀐 **당신**을 상상해보세요','이번 달 신규 예약 5분께'].every(function(k){ return et.indexOf(k)<0; }),
        '🚨 사장님 «AI 냄새가 난다» — 홈 기본 구성에 미리 써 둔 카피가 깔리면 안 된다 (2026-08-20)');
      add('e 안내문이 내용칸에 안 들어감', et.indexOf('고객이 겪는 문제를 공감되게 적어요') < 0,
        '사장님더러 읽으라고 쓴 안내문이 내용 자리에 들어가 손님 화면에 그대로 나가던 것 (2026-08-20)');
      add('e 유형 4종 = 3칸', ['tbeauty','tcreator','texpert','tresult'].every(function(k){
        var m=et.match(new RegExp('\\n    '+k+': \\[([\\s\\S]*?)\\n    \\]'));
        if(!m) return false;
        var n=(m[1].match(/\{type:'/g)||[]).length + (m[1].indexOf('P_REVIEW')>=0?1:0);
        return n===3;
      }), '새 계정 홈은 3칸으로 시작 — 늘리면 «관리할 목록»처럼 보인다 (사장님 픽)');
      add('e 홈 기본에 구독·문의 없음', ['tbeauty','tcreator','texpert','tresult'].every(function(k){
        var m=et.match(new RegExp('\\n    '+k+': \\[([\\s\\S]*?)\\n    \\]'));
        return m && m[1].indexOf("type:'lead'")<0 && m[1].indexOf("type:'newsletter'")<0 && m[1].indexOf("type:'reservation'")<0;
      }), '아직 아무것도 없는 홈이 손님에게 뭘 달라고 하면 안 된다 (2026-08-20 사장님 지시)');
      add('e 크리에이터 예시 문구 비움', et.indexOf('클래스 · 모집 알림 신청') < 0,
        '또렷한 가짜 문구가 부활하면 «내 것 같지 않다»로 되돌아간다 — 비우면 흐린 뼈대가 뜬다');
      /* 🔄 2026-08-20 밤 — 사장님 «커버냐 프사냐 구분이 되어야 한다» 지적으로 이름이 바뀌었다.
            이 칸은 커버(맨 위 배경)다. 동그라미 프사는 프로필 편집에 따로 있다. */
      add('e 🖼 커버 2개 (캐릭터 삭제)', et.indexOf('data-pm="char"') < 0 && et.indexOf('커버 없음') >= 0,
        '커버 없음 / 내 사진 두 가지만 · 캐릭터는 「내 것 같지 않다」로 삭제 (2026-08-20)');
      /* 🔄 2026-08-21 사장님 재배치 — 위=모양(홈 유형·테마) / 아래=채우기(구성 추가·새 포스팅) */
      add('e 🧭 위=모양 아래=채우기', et.indexOf('le-mini" id="le-type"') >= 0 && et.indexOf('le-mini" id="le-design"') >= 0
        && et.indexOf('id="le-add-top"') >= 0 && et.indexOf('le-d-write" id="le-write"') >= 0,
        '홈 유형·테마는 위로(작게), 구성 추가·새 포스팅은 아래 도크로 (2026-08-21)');
      add('e ✍️ 이름은 «새 포스팅»', et.indexOf('<span class="le-d-lbl">새 포스팅</span>') >= 0,
        '«글쓰기»가 아니라 «새 포스팅» — 사장님 지시 (2026-08-21)');
      add('e 🚪 홈 인라인 «구성 추가» 박스 삭제', uHtml.indexOf("s.className='la-addslot'") < 0,
        '같은 카탈로그를 여는 문이 둘이 된다 (홈 박스 + 도크 ③번) — 사장님 「가」 픽 (2026-08-20)');
      /* 🔄 2026-08-20 밤 — 사장님 «편집하는데 위에 이런 기능들이 왜 필요해» 로 상단바가 3개로 줄었다.
            미리보기·운영은 «위로»가 아니라 «아예 안 보이게»가 됐다(배선은 살려둠). 항목을 새 기준으로. */
      add('e 상단바는 세 개만', et.indexOf('id="le-quit"') >= 0 && et.indexOf('le-d" id="le-home" style="display:none !important;"') >= 0,
        '편집 중엔 «나가기 · 되돌리기 · 저장» 뿐 — 👁미리보기·⚙운영이 다시 나오면 안 된다');
      add('e 도크에 미리보기 없음', et.indexOf('le-dock le-flow') >= 0 && (et.split('le-dock le-flow')[1]||'').slice(0,600).indexOf('le-home') < 0,
        '도크로 되돌아오면 버튼이 다시 5개가 된다');
      add('e 홈 유형 배선', et.indexOf("getElementById('le-type')") >= 0 && et.indexOf('window.__openTypePick') >= 0,
        '1걸음이 무반응이면 흐름 전체가 죽는다');
      add('e ✍️ 글쓰기 방 두 개', et.indexOf('function openWriteChooser') >= 0 && et.indexOf("data-w=\"paste\"") >= 0 && et.indexOf('window.__openWriteChooser') >= 0,
        '글쓰기 → ①직접 쓰기 ②붙여넣기로 만들기. 전엔 붙여넣기가 새 글 시트 «안»에 작은 글씨로 숨어 있었다 (2026-08-20 사장님 픽)');
      add('e 📿 구슬 1-2', et.indexOf('function markPostSteps') >= 0 && et.indexOf('data-pstepon') >= 0,
        '썸네일 → 본문. 한 화면에 쌓으면 스크롤이 길어 «내가 뭘 적었더라»가 된다 (사장님 「나」 픽)');
      add('e 구슬은 다시 그린다', et.indexOf("['pbeads','pstep-next','pstep-done'].forEach") >= 0,
        'openPostEdit 이 폼을 다시 그리면 내가 넣은 구슬이 날아간다 — 열 때마다 새로 붙인다 (2026-08-20 실측 사고)');
      add('e 커버/프사 구분', et.indexOf('🖼 커버 사진') >= 0 && et.indexOf('👤 프로필 꾸미기') < 0,
        '🚨 커버(맨 위 배경)를 「프로필 꾸미기」로 잘못 이름 붙였던 것 — 동그라미 프사와 헷갈린다 (2026-08-20)');
      add('e 👤 라이트 프로필 = 마지노선', et.indexOf("card.classList.add('lite')") >= 0 && et.indexOf('#profile-card.lite [data-deep]{display:none;}') >= 0,
        '라이트(현장)는 사진·이름·한 줄 소개까지 — 숫자 증거·작업 사진·전문성은 운영자 모드 (2026-08-20 사장님 지시)');
      add('e 작업실에선 프로필 전부', et.indexOf("_pc.classList.remove('lite')") >= 0,
        '시트를 닫고도 lite 가 남으면 작업실에서 깊은 칸이 영영 안 보인다');
      add('e ✍️ 글쓰기는 현장에서', et.indexOf('window.__newPostSheet){ window.__newPostSheet(); return;') >= 0,
        '🚨 눌렀더니 현장을 닫고 작업실(운영자 모드)로 튕기던 것 — 라이브 시트로 손님 화면 위에 올린다 (2026-08-20 사장님 확인)');
      add('e 📝 글쓰기 배선 생존', et.indexOf('id="le-write"') >= 0 && et.indexOf("window.__switchWs('posts')") >= 0,
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
      add('e 🪣 5칸 퍼널', et.indexOf('function an5Funnel') >= 0 && et.indexOf("laRpc('li_funnel'") >= 0,
        '홈→머묾→누름→예약창→예약완료 · content-hub-funnel5.sql 있을 때만 (B안, 2026-08-20)');
      add('e 5칸 없어도 안 깨짐', et.indexOf('s.funnel5 ? an5Funnel(s)') >= 0 && et.indexOf('f5-need') >= 0,
        'SQL 안 깔린 계정은 옛 3칸 그대로 + 안내 한 줄 — 무회귀 보장');
      add('e \\U 이스케이프 금지', et.indexOf('\\U0001') < 0,
        'JS는 \\U(대문자) 이스케이프를 모른다 — 이모지가 «U0001FAA3» 글자로 새어나온다 (2026-08-20 사고)');
      add('e 🚧 잠금 표시', et.indexOf('class="ws-tab ws-soon" data-ws="sales"') >= 0 && et.indexOf('.ws-tab.ws-soon{ opacity:.34; }') >= 0,
        '«없음»을 «고장»처럼 그리지 않는다 — 흐릿하게 + 점 하나');
      add('e 열린 방 4개', et.indexOf('data-ws="home"') >= 0 && et.indexOf('data-ws="page"') >= 0 && et.indexOf('data-ws="posts"') >= 0 && et.indexOf('data-ws="data"') >= 0,
        '홈 · 프로필 · 포스팅 · 고객·분석 — 이 넷은 늘 열려 있어야 한다 (2026-08-20 분석 개방)');
      /* 🆕 신규 첫 경험 (2026-08-20 사장님 지시 5종) */
      add('e 자동저장은 공개 안 함', et.indexOf('여기서 li_publish(true) 를 부르는 바람에') >= 0,
        '🚨 가입만 해도 예시가 손님에게 공개되던 것 — 공개는 「적용」 누를 때만');
      add('e 예시 남음 경고', et.indexOf('window.__sampleLeft') >= 0 && et.indexOf('아직 예시 그대로인 곳이') >= 0,
        '배포해도 예시가 남아 있으면 알려준다(막지는 않음)');
      add('e 템플릿 강제 지정 없음', et.indexOf("h0.template='editorial'") < 0,
        '«유형»과 «템플릿»이 각각 모양을 정하면 부딪힌다 — 모양은 홈 유형 하나가 책임진다 (2026-08-20 사장님 「가」 픽)');
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
      /* 🚨 2026-08-21 — 이 항목이 «더 다듬기»라는 «이름»을 박아 둬서, 사장님이 이름을
        «커버 사진»으로 바꾸자 빨간 줄이 났다. 항목의 뜻은 «4단계로 되돌아가지 않았나»이다.
        이름이 아니라 «단계가 둘인가»를 본다 (id 는 이름이 바뀌어도 그대로다). */
      add('꾸미기 2단계', et.indexOf('id="dz-st1"') >= 0 && et.indexOf('id="dz-st2"') >= 0 && et.indexOf('for(var i=1;i<=2;i++)') >= 0, '4단계 구조 회귀 금지');
      add('내보내기 엔진', ['function expCaption','function expCards','function openPostExport','window.__openPostExport'].every(function(k){ return et.indexOf(k) >= 0; }), '인스타 캡션 · 카드뉴스 대본 (AI 0원)');
      add('내보내기 버튼 수명', et.indexOf("id='exp-fab'") >= 0 && et.indexOf("if(eb) eb.style.display='none'") >= 0, '포스팅 나가면 숨김 (떠 있는 채로 남던 사고 방지)');
      add('광고 스위치', et.indexOf('dz-adov') >= 0 && et.indexOf('home.adOverlay') >= 0, '홈 위에 띄우기 온오프');
      add('칩·매거진 기본값', et.indexOf("marquee:'chips'") >= 0 && et.indexOf("[['chips','정지 칩'") >= 0, '흐르는 띠는 선택지로만');
      add('구성 고르기 화면', ['function openTypePick','window.__openTypePick','tpick-open','tpk-rail','scroll-snap-type'].every(function(k){ return et.indexOf(k) >= 0; }), '유형 4종 스와이프 픽커 (2026-08-20 확정판)');
      add('유형 적용 기록', et.indexOf('home.htype=setKey') >= 0, '«지금 쓰는 중» 배지 근거');
      /* 🔄 2026-08-20 밤 — 사장님 «3칸으로, 예약·문의는 기본에서 빼» 로 결정이 바뀌었다.
            옛 항목은 «갤러리·가격·후기»를 요구해 새 결정과 충돌했다. 새 결정 기준으로 갱신. */
      add('뷰티 확정 구성', et.indexOf("{type:'stylegallery',name:'스타일 갤러리',content:[]}") >= 0, '사진(글로우·룩북) 아래 = 스타일 갤러리 · 3칸');
      add('포스팅별 모션 스위치', et.indexOf('post-f-motion') >= 0 && et.indexOf("p.motion=this.checked?'':'off'") >= 0, '발행 전 온오프 (2026-08-20 확정)');
      add('기호 사전', et.indexOf('pst-help') >= 0 && (et.match(/pr-row/g)||[]).length >= 8, '붙여넣기 화면 8가지 규칙 — 초보자 혼자 쓰기');
      add('붙여넣기 자동 제안', et.indexOf('pstSuggest') >= 0 && et.indexOf('__pstSug') >= 0, '자동으로 «제안»만, 넣는 건 사장님 (다안)');
      add('전문가형=사진 위', et.indexOf('C1 원 픽') >= 0 && /texpert:\s*\[\s*\/\*[^*]*\*\/\s*\{type:'cover3'/.test(et), '이름을 위로 올렸던 드리프트 원복(2026-08-20)');
      add('붙여넣기 포스팅 엔진', ['function pstAnalyze','function pstToBlocks','function openPasteStart','window.__openPasteStart'].every(function(k){ return et.indexOf(k) >= 0; }), '규칙 엔진 4개 생존 (AI 0원)');
      add('붙여넣기 입구', et.indexOf("id=\"sfs-paste\"") >= 0 && et.indexOf("getElementById('sfs-paste').onclick") >= 0, '새 글 시트의 «붙여넣기로 시작» 버튼 + 배선');
      /* 🚨 2026-08-21 — 이 항목이 «괄호까지» 박아 두는 바람에, 뒤에 인자 하나(요약) 붙였다고
        빨간 줄이 났다. 항목의 뜻은 «세 번째가 제목이고, 그 제목을 그리기 전에 쓴다»이다.
        자릿수가 아니라 «순서»를 본다 — 닫는 괄호를 뺀다. */
      add('제목 렌더 전 확정', et.indexOf('createPost(type, blocksOverride, titleOverride') >= 0 && et.indexOf('(titleOverride&&String(titleOverride).trim())') >= 0, '카드에 «새 글»로 남던 사고(2026-08-20)');
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

      /* 🔗 2026-08-21 사장님 «친구들끼리 공유 가능하게» — 보내기가 클립보드 복사만 하던 것.
            폰에서 그 폰의 보내기 창이 떠야 카톡·DM으로 친구에게 간다. */
      add('u 글끝 보내기 버튼', ut.indexOf('ig-btn share') >= 0, '글 끝 ♥·✈ 액션바');
      add('u 보내기 = 폰 보내기창', ut.indexOf('navigator.share(') >= 0 && ut.indexOf("matchMedia('(pointer:coarse)')") >= 0, '폰이면 보내기창, 컴퓨터면 복사');
      add('u 보내기 주소 청소', ut.indexOf("var hu=q0.get('u'); if(hu) q.set('u', hu);") >= 0, '주소 전체를 물려주면 편집 화면 링크가 친구에게 간다');
      add('u 보내기 기록', ut.indexOf("track('share'") >= 0, '몇 명이 친구에게 보냈는지 분석에 쌓인다');
      add('u 보내기 취소는 실패 아님', ut.indexOf("n==='AbortError'") >= 0, '손님이 창을 닫았는데 복사창이 또 뜨면 성가시다');

      /* 🚨 2026-08-21 최악의 사고 — 글 쓰기 시트의 «껍데기»(#live-sheet-ov)가 마크업에서 통째로
            사라져 있었다. 안쪽 .ls-body 만 #live-edit-ov 안에 고아로 남아,
            시트를 여는 함수 다섯 개가 «전부» 정의조차 안 됐다 (if(!lsOv) return 에서 되돌아감).
            증상: AI 포스팅 「이대로 만들기」를 눌러도 글이 안 만들어지고 홈으로 돌아옴. 에러는 0건.
            → 껍데기·안쪽·«바깥에 있는지»를 셋 다 본다. */
      add('글쓰기 시트 껍데기', et.indexOf('<div id="live-sheet-ov">') >= 0, '이게 없으면 시트 함수 다섯 개가 통째로 죽는다');
      add('글쓰기 시트 속살', et.indexOf('id="ls-title"') >= 0 && et.indexOf('id="ls-host"') >= 0 && et.indexOf('id="ls-done"') >= 0, '제목·담는곳·완료 버튼');
      add('글쓰기 시트는 편집틀 밖', (function(){
        var i = et.indexOf('<div id="live-sheet-ov">');
        var j = et.indexOf('<div class="le-dock');
        var k = et.indexOf('</div>', j);
        return i > 0 && i > k;   /* 도크가 닫힌 «뒤»에 온다 = #live-edit-ov 밖 */
      })(), '안에 넣으면 손님 화면 위로 못 올라온다');
      add('AI 포스팅은 현장 시트로', et.indexOf('window.__pstToSheet') >= 0 && et.indexOf('if(window.__liveEditActive && window.__pstToSheet)') >= 0, '작업실로 튕기면 쓴 글이 사라진 것처럼 보인다');

      /* 🎨 사장님 «라이트 톤이 깨지지 않게» — 시트가 없던 탓에 여기만 어두운 채로 남아 있었다 */
      add('글쓰기 시트 라이트 톤', et.indexOf('html[data-litetone] #live-sheet-ov{') >= 0, '현장은 밝고 시트만 까맣던 것');
      add('글쓰기 시트 누르는 자리', et.indexOf('.ls-bar .ls-back, .ls-bar .ls-done{ min-height:40px; }') >= 0, '31px 였다 — 손가락 최소 40px');
      add('블록 줄에 설정값 누출 금지', et.indexOf('!/^[a-z]+-[a-z0-9]+\\|/.test(c[i])') >= 0, '사진 줄에 꾸미기 설정값이 요약으로 뜨던 것');

      /* 📝 2026-08-21 사장님 «이쪽은 글에 맞는 것만 남기고 라이트 톤으로» —
            글 쓰기 시트에서 「구성 추가」를 누르면 «홈» 카탈로그가 통째로 떴다.
            홈 템플릿·홈 진단·프로필 카드·매장·뉴스레터가 글 안에 나왔고, 패널만 새까맸다. */
      add('글 카탈로그 맥락 판별', et.indexOf('function inPostSheet()') >= 0 && et.indexOf("ov.setAttribute('data-ctx'") >= 0, '시트가 열려 있고 게시물 머리띠가 있으면 «글»');
      add('글 카탈로그 허용 목록', et.indexOf('var POST_OK_BLOG=') >= 0 && et.indexOf('var POST_OK_LANDING=') >= 0, '블로그 글과 랜딩 글은 넣을 게 다르다');
      add('글에선 홈 물건 감춤', et.indexOf('#add-ov[data-ctx="post"] #add-tpl,') >= 0 && et.indexOf('#add-ov[data-ctx="post"] .tpl[data-special]{ display:none !important; }') >= 0, '홈 템플릿·진단·프로필 카드');
      add('글에선 홈 세트 감춤', et.indexOf('(searching||_post) ? \'none\'') >= 0, '«통째로 시작» 세트는 홈을 갈아 끼우는 것 — 글에 나오면 안 된다');
      add('글 섹션 이름은 글의 말', et.indexOf("var _PS=['글감','사진·영상','증거 보여주기','다른 글 붙이기','글 끝 행동']") >= 0, '«첫인상·유입»은 홈 깔때기 용어');
      add('홈으로 돌아오면 원복', et.indexOf("h.getAttribute('data-homelbl')") >= 0, '이름을 기억해 두지 않으면 홈 카탈로그가 «글감»으로 굳는다');
      add('글 카탈로그 라이트 톤', et.indexOf('html[data-litetone] #add-ov .sheet{') >= 0, '현장은 밝은데 이 패널만 까맣던 것');

      /* 🏠 2026-08-21 사장님 ㉮ — 홈 템플릿 4종은 홈 유형에 밀려 중복. 눈에서만 치운다.
            기능은 살아 있다(u.html 이 home.template 으로 홈을 다르게 그림) → «지우지 않았나»도 같이 본다. */
      add('홈 템플릿 스위처 숨김', et.indexOf('#add-tpl-seg,') >= 0 && et.indexOf('#add-tpl-hint{ display:none !important; }') >= 0, '홈 유형과 겹쳐 헷갈리던 것');
      add('홈 템플릿 기능은 생존', et.indexOf('id="add-tpl-seg"') >= 0 && ut.indexOf('applyEditorial') >= 0, '지워버리면 그 값으로 저장된 홈의 모양이 바뀐다');
      add('대문 문구 칸은 생존', et.indexOf('id="ed-hook-in"') >= 0 && et.indexOf('#add-ov.ed-on #add-tpl-fields{display:block;}') >= 0, '스위처와 같이 지우면 옛 템플릿 쓰던 사람이 문구를 못 고친다');

      /* ✏️ 2026-08-21 사장님 «한 줄도 뽑아줘» — 손님이 목록 카드에서 보는 그 한 줄.
            인사말(「안녕하세요…」)이 그대로 요약이 되면 카드가 다 똑같아 보인다. */
      add('AI가 한 줄 요약도 뽑음', et.indexOf('return { title: title||\'새 포스팅\', summary: summary, items: out };') >= 0, '제목만 채우고 요약은 비어 있던 것');
      add('요약에서 인사말 떼기', et.indexOf('var GREET=/^(안녕하세요|안녕하십니까|반갑습니다') >= 0, '「안녕하세요.」로 시작하면 카드가 전부 똑같아진다');
      add('요약이 썸네일 칸까지', et.indexOf('function createPost(type, blocksOverride, titleOverride, summaryOverride)') >= 0 && et.indexOf('window.__pstToSheet=function(bl, title, summary)') >= 0, '뽑아만 놓고 안 넘기면 헛일');
      add('요약을 만들기 전에 보여줌', et.indexOf("if(r.summary) h+='<div class=\"pstp-sum\">'") >= 0, '눈으로 보고 만들지 말지 정한다');

      /* 🧭 2026-08-21 사장님 «AI 포스팅인데 썸네일로 튀어서 흐름이 끊긴다» —
            AI가 제목·요약을 이미 채웠는데 1단계로 떨어뜨리면 «왜 또?»가 된다.
            쓴 글 맨 위(2단계)에 내려놓고, 썸네일은 위에 접은 채 ▲ 표시만 남긴다. */
      add('AI 포스팅은 본문에 도착', et.indexOf('function markPostSteps(opt)') >= 0 && et.indexOf('go(opt.start===2 ? 2 : 1)') >= 0, '썸네일로 튀면 흐름이 끊긴다');
      add('AI 도착 표시는 위쪽 화살표', et.indexOf('위에 썸네일이 있어요') >= 0, '접어 뒀다는 걸 모르면 제목을 못 찾는다');
      add('직접 쓰기는 그대로 1단계', et.indexOf('window.__markPostSteps(null)') >= 0, '빈 글은 썸네일부터 채우는 게 맞다');

      /* 📄 2026-08-21 사장님 «나안» — 네이버 블로그처럼 글이 그대로 보이고 그 자리에서 고쳐진다.
            🚨 제일 무서운 사고: 데이터가 두 벌이 되는 것. #rows 가 «유일한 진짜»여야 하고
               문서 화면은 그것을 다르게 그린 껍데기여야 한다. serialize()·저장·발행은 #rows 만 읽는다. */
      add('문서형 글 편집 엔진', et.indexOf('window.__docViewOn=') >= 0 && et.indexOf('window.__renderDocView=render') >= 0, '글이 그대로 보이고 그 자리에서 고쳐진다');
      add('문서형은 껍데기일 뿐', et.indexOf('#home-body[data-docview="1"] #rows{ display:none !important; }') >= 0 && et.indexOf('cont(row)[+e.dataset.dk] = e.textContent') >= 0, '#rows 를 숨길 뿐 지우지 않는다 — 고친 값은 곧바로 row._content 로');
      add('문서형은 본문 단계에서만', et.indexOf('window.__docViewOn(n===2)') >= 0, '1단계 썸네일은 원래 폼 그대로');
      add('인용은 layout 으로 가른다', et.indexOf("ty==='text' && (ly==='quote' || ly==='impact')") >= 0, 'AI가 만드는 건 전부 text 블록 — type 만 보면 인용이 소제목 칸으로 떨어진다');
      add('문단 사이 넣기 네 가지', et.indexOf("['photocard','🖼','사진'") >= 0 && et.indexOf("['text','❝','인용'") >= 0, '글 단락·소제목·사진·인용');
      add('사진은 보관함으로', et.indexOf('window.__openVault=openVault') >= 0 && et.indexOf('window.__openVault(function(url)') >= 0, '문서에서 사진 자리를 누르면 보관함이 열려야 한다');
      add('다른 구성 입구는 남긴다', et.indexOf("class=\"dmore\" id=\"dmore\"") >= 0, '「구성 추가」를 그냥 없애면 후기·CTA·숫자를 글에 못 넣는다');
      add('문서형 붙여넣기는 글자만', et.indexOf("insertText") >= 0, '남의 서식이 딸려오면 글이 깨진다');

      /* 🚨 2026-08-21 사장님 «운영자 모드는 어디로 가?» — 있긴 있었다. 19x19px 로.
            📏「누르는 자리 40px」검사는 편집기(edit.html)만 재고 있어서 손님 화면은 통과했다.
            작업실로 가는 «유일한 문»이라 못 누르면 갇힌다. */
      add('u ⚙ 손에 잡히나', ut.indexOf('width:44px; height:44px; margin:-12px; border-radius:50%;') >= 0, '19x19 였다 — 작업실 가는 유일한 문');
      add('u ⚙ 안에 운영자 모드', ut.indexOf("data-g=\"admin\"") >= 0 && ut.indexOf("location.href='edit.html?desk=1'") >= 0, '이 메뉴가 사라지면 작업실에 못 간다');

      /* 🚨 2026-08-21 사장님 «테마가 잘 안 나와» — 진짜였다.
            테마 칸은 «1페이지»에 있는데 그리는 함수는 «2페이지»일 때만 불렸다.
            (페이지 4장 → 2장으로 줄일 때 조건이 안 따라온 것. 에러 0건 — 그냥 빈 칸) */
      add('테마 칩이 1페이지에서 그려짐', et.indexOf('if(n===1){ renderDzThemes(); }') >= 0, '2페이지일 때만 그리면 영영 빈 칸이다');
      add('테마 칸 실물', et.indexOf('id="dz-theme-grid"') >= 0 && et.indexOf('function renderDzThemes()') >= 0, '칸과 그리는 함수 둘 다');
      add('기본 테마는 크림', et.indexOf("theme:'cream'") >= 0 && et.indexOf("if(THEMES[_c][0]==='cream')") >= 0, '첫 로그인은 크림 · 값이 깨져도 크림으로 떨어진다');
      add('꾸미기 2단계 = 커버 사진', et.indexOf('<span class="n">2</span>커버 사진</span>') >= 0, '«더 다듬기»는 뭘 하는 칸인지 알 수 없었다');

      /* 🚨 2026-08-21 사장님 «막상 이런 식으로 정리가 된 느낌이 아니네» — 실제 원고로 확인했다.
            네이버 블로그를 통째로 복사한 글이 «블록 90개»로 쪼개져 있었다. 원인 셋을 다 막는다. */
      add('붙여넣기 빈 줄 청소', et.indexOf('function pstClean(raw)') >= 0 && et.indexOf('\\u200B-\\u200D') >= 0, '블로그 빈 줄은 제로폭 공백이라 «빈 줄»로 안 걸러졌다');
      add('블로그 화면 글자 걸러냄', et.indexOf('function PST_JUNK_TEST(t)') >= 0 && et.indexOf('var PST_JUNK_W') >= 0, '「이웃추가 본문 기타 기능」이 원고로 들어왔다');
      add('찌꺼기 필터 안전장치', et.indexOf('if(!w.length || w.length>5) return false;') >= 0, '5단어 넘으면 손대지 않는다 — 진짜 원고를 지우는 게 더 큰 사고');
      add('소제목은 본문이 따라올 때만', et.indexOf('var 본문이따라옴') >= 0, '블로그·인스타 원고는 마침표 없이 짧게 쓴다 — 그 조건만 보면 전부 소제목이 된다');
      add('소제목엔 강조바', et.indexOf("layout: head ? 'bar' : ''") >= 0, '전부 기본 카드라 «정리된 느낌»이 안 났다');

      /* 🧰 2026-08-21 사장님 «무기고를 열자» — 앱엔 표현이 40종 넘는데 붙여넣기는 둘만 썼다.
            글의 «생김새»만 보고 어떤 표현이 맞는지 알아낸다. 확신 높은 것만 자동으로 바꾼다. */
      add('무기고 감지 규칙', et.indexOf('var PST_NUM') >= 0 && et.indexOf('var PST_REV') >= 0 && et.indexOf('var PST_CTA') >= 0, '숫자·후기·행동 — 내용을 안 읽고 생김새로');
      add('숫자 띠', et.indexOf("out.push({k:'num', items:_ns})") >= 0 && et.indexOf("type:'stat'") >= 0, '「경력 10년 · 누적 2,300명」이 그냥 문장이던 것');
      add('숫자 띠는 짧은 줄만', et.indexOf('if(t.length<=64){') >= 0, '긴 문장을 숫자로 토막 내면 뜻이 깨진다');
      add('Q·A 말풍선', et.indexOf("out.push({k:'qa'") >= 0 && et.indexOf("type:'qna'") >= 0, 'Q. A. 가 그냥 줄글이던 것');
      add('후기 인용', et.indexOf("out.push({k:'rev'") >= 0 && et.indexOf("type:'review'") >= 0, '「"…" — 30대 직장인」 패턴');
      add('행동 버튼', et.indexOf("out.push({k:'cta'") >= 0 && et.indexOf("type:'cta'") >= 0, '「상담 문의 주세요」가 소제목이 되던 것');
      add('방법 목록은 단계로', et.indexOf('var PST_HOWTO') >= 0 && et.indexOf("type:'steps'") >= 0, '체크목록은 «가진 것», 타임라인은 «하는 차례»');
      add('단계 꼬리 줄 분리', et.indexOf('var chk=[], tail=[];') >= 0, '한 줄 딸려왔다고 단계 전체가 무산되면 안 된다');
      add('블로그 머리글 줄 제거', et.indexOf('var PST_BYLINE') >= 0, '「이벨로 ・ 2026. 6. 10. 16:06」');
      add('블로그 UI 줄 제거', et.indexOf('var PST_JUNK_LINE') >= 0 && et.indexOf('접기\\/펴기') >= 0, '「접기/펴기」가 소제목이 되던 것');
      add('출처 줄 제거', et.indexOf('var PST_SRC_LINE') >= 0, '「[출처] …|작성자 …」');
      add('위치 줄은 살림', et.indexOf('var PST_LOC_LINE') >= 0, '「위치이벨로 의정부점」은 찌꺼기가 아니라 정보다');

      /* 🚨 2026-08-21 사장님 픽 ㉮ — 「1. 2. 3.」이 목록인지 «글의 뼈대»인지 가른다.
            목록은 항목이 연달아 나온다. 뼈대는 항목마다 문단이 붙는다.
            전엔 무조건 ☑ 체크목록이라 그 단발 글의 유형 1·2가 본문에 파묻혔다. */
      add('번호 줄 = 목록인가 뼈대인가', et.indexOf('function pstNextLine(lines, i)') >= 0 && et.indexOf('function pstLooksBody(t)') >= 0, '내용을 안 읽고도 구조를 아는 유일한 신호');
      add('번호 뼈대는 소제목으로', et.indexOf("if(_bare.length<=40 && !PST_LIST.test(_nx) && pstLooksBody(_nx))") >= 0, '「1. 하안부…」 뒤에 문단이 붙으면 소제목이다');
      add('목록 앞줄도 소제목', et.indexOf('pstLooksBody(_nl) || PST_LIST.test(_nl)') >= 0, '「준비물」 다음에 「- 빗 - 가위」면 준비물은 소제목');
      add('판정 규칙은 한 벌', (et.match(/pstLooksBody\(/g) || []).length >= 2, '소제목·번호 판정이 각자 놀면 반드시 어긋난다');
      add('인스타·카톡 찌꺼기', et.indexOf('var PST_TAGS') >= 0 && et.indexOf('var PST_KKT') >= 0, '해시태그 뭉치·「오전 11:23」 — 출처를 묻지 않고 생김새로 안다');

      /* ⌨️ 사장님 «다 불편한데» — 손잡이를 6개로 늘리는 대신 버튼 0개로 */
      add('엔터로 나누기', et.indexOf("if(ev.key==='Enter' && !ev.shiftKey && !ev.isComposing)") >= 0, '노션·워드와 같은 손동작 — 배울 게 없다');
      add('백스페이스로 합치기', et.indexOf("if(ev.key==='Backspace'") >= 0 && et.indexOf('sel.isCollapsed && caret()===0') >= 0, '맨 앞에서만 — 글 지우다 블록이 합쳐지면 사고');
      add('한글 조합 중엔 안 가름', (et.match(/isComposing/g) || []).length >= 2, '한글 입력 중 엔터는 «글자 확정»이지 줄바꿈이 아니다');
      add('사진과는 안 합침', et.indexOf("prev.dataset.type==='photocard' || prev.dataset.type==='imagetext'") >= 0, '글자가 사진 속으로 사라진 것처럼 보인다');
      add('빈 소제목 칸 안 그림', et.indexOf("if(f[0]===0 && ty==='text' && !String(c[0]||'').length) return;") >= 0, '빈 칸이 첫 칸이 되면 맨 앞 백스페이스가 글자를 삼킨다');
      add('합칠 땐 모든 칸을 가져감', et.indexOf('var mineTx=') >= 0, '칸이 둘인 블록을 합치면 한 칸이 사라진다');

      /* 📸 사장님 «사진을 화질 나쁘지 않게 적당히 눌러줘» — 전엔 1080px·JPEG 0.72 한 방이었다 */
      add('사진 WebP 우선', et.indexOf('var IMG_WEBP') >= 0 && et.indexOf("toDataURL('image/webp')") >= 0, '같은 화질에서 JPEG보다 30~40% 작다');
      add('사진 용량 예산', et.indexOf('var IMG_BUDGET') >= 0, '사진은 글 데이터 «안»에 들어간다 — 예산이 없으면 저장이 막힌다');
      add('사진 품질 먼저 폭 나중', et.indexOf('var qs = [quality || 0.86') >= 0, '품질을 더 깎는 것보다 폭을 줄이는 게 덜 티난다');
      add('사진 실패해도 뭔가 돌려줌', et.indexOf('resolve(best);') >= 0, '예산 못 맞춰도 올리기 자체가 막히면 안 된다');

      /* ✨ 사장님 «표지 자동 만들기» */
      add('표지 자동 만들기', et.indexOf('function autoCover(title, sub)') >= 0 && et.indexOf('window.__autoCover=autoCover') >= 0, '사진이 없을 때 회색 네모보다 낫다');
      add('표지는 테마 색을 따름', et.indexOf('if(THEMES[i][0]===home.theme){ bg=THEMES[i][1]; ac=THEMES[i][2]; break; }') >= 0, '홈과 따로 놀면 안 된다');
      add('표지 버튼 실물', et.indexOf('id="post-autocover"') >= 0 && et.indexOf('.autocover-btn{') >= 0, '썸네일 칸 안, 커버 사진 바로 밑');

      /* 🧰 사장님 «비공개도 익숙한 곳에 · 임시저장함·캡션 뽑기도» */
      add('글 도구 세 개', et.indexOf('id=\"dhide\"') >= 0 && et.indexOf('id=\"dexport\"') >= 0 && et.indexOf('id=\"ddrafts\"') >= 0, '비공개·캡션 뽑기·임시저장함 — 작업실 깊은 곳에만 있던 것');
      add('비공개 토글 배선', et.indexOf('q.on = (q.on===false);') >= 0, '껐다 켰다 — 글 하나에 대한 일이라 글 쓰는 자리가 제자리');
      add('캡션 뽑기 배선', et.indexOf('window.__openPostExport()') >= 0, '이미 있는 기능인데 입구가 깊어 묻혀 있었다');

      /* 🔑 사장님 «자동 로그인 버튼» — 기능은 있었는데 «보이지 않아» 모르셨다 */
      add('자동 로그인 스위치', et.indexOf('id="lg-auto"') >= 0 && et.indexOf('cm-autologin') >= 0, '있는 걸 보이게 + 끌 수 있게');
      add('자동 로그인 끄면 통과 금지', et.indexOf("localStorage.getItem('cm-autologin')==='0') return;") >= 0, '남의 컴퓨터에서 켜 두면 그대로 열린다');

      /* 🗑 사장님 «포스팅에 편집은 있는데 삭제가 없다» — 랜딩 캔버스 안에만 묻혀 있었다 */
      add('글 삭제 공용 함수', et.indexOf('window.__deletePost=function()') >= 0, '한 기능 두 규칙 금지 — 랜딩·블로그가 같은 것을 쓴다');
      add('글 삭제 버튼 실물', et.indexOf('id=\"ddelpost\"') >= 0 && et.indexOf('.ddelpost{') >= 0, '문서형 편집 맨 아래');
      add('글 삭제는 이름을 대고 묻는다', et.indexOf('되돌릴 수 없어요') >= 0, '«이 글»만 물으면 어느 글인지 모른 채 지운다');

      /* 사장님 «비용이 전혀 안 듭니다 이런 말 없애줘» */
      add('AI 비용 문구 없앰', ut.length >= 0 && et.indexOf('비용 0원 · 이 글은 서버로 안 나가요') < 0, '화면에서 뺐다 (코드 주석은 남겨도 된다)');

      /* 📇 2026-08-21 DM 카드 공사 — 카톡·인스타의 «미리 읽는 로봇»은 화면 그리는 코드를
            실행하지 않는다. 그래서 글마다 제목·표지를 미리 적어 둔 껍데기를 만들어 둔다.
            🚨 짧은 주소는 «껍데기가 있는 글»에만 써야 한다 — 없으면 404다. */
      add('껍데기 목록 미리 받기', ut.indexOf('function ogPrime()') >= 0 && ut.indexOf("fetch(base+'og/manifest.json'") >= 0, '보내기 누를 때 기다리면 늦다');
      add('껍데기 없으면 예전 주소', ut.indexOf("if(lst && lst.indexOf(id)>=0)") >= 0 && ut.indexOf('return plain;') >= 0, '방금 쓴 글은 껍데기가 아직 없다 — 404 나면 안 된다');
      /* 🔬 실물 검사 — «코드가 있나»가 아니라 «파일이 실제로 있고 내용이 맞나».
            글자 검사만으로는 껍데기가 통째로 없어도 전부 통과한다 (2026-08-21 시트 사고와 같은 종류). */
      try {
        const mf = await _fresh('og/manifest.json').then(t => JSON.parse(t)).catch(() => null);
        add('껍데기 목록 실물', !!(mf && mf.posts && Object.keys(mf.posts).length), mf ? ('핸들 ' + Object.keys(mf.posts || {}).length + '명') : 'og/manifest.json 을 못 읽음');
        if (mf && mf.posts) {
          const h0 = Object.keys(mf.posts).find(k => (mf.posts[k] || []).length);
          const id0 = h0 ? mf.posts[h0][0] : null;
          if (h0 && id0) {
            const shell = await _fresh('u/' + h0 + '/' + id0 + '.html').catch(() => '');
            const og = (shell.match(/property="og:title" content="([^"]*)"/) || [])[1] || '';
            add('껍데기 실물 + 제목', shell.length > 0 && og.length > 0, og ? ('예: ' + og.slice(0, 24)) : '파일이 없거나 제목이 비었다');
            add('껍데기 제목이 기본값 아님', og.indexOf('나만의 컨텐츠 공간') < 0, '기본값이면 모두의 카드가 똑같아진다 — 공사한 의미가 없다');
            add('껍데기가 사람은 통과시킴', shell.indexOf('location.replace(') >= 0, '로봇은 여기서 멈추고, 사람은 진짜 화면으로 가야 한다');
          }
        }
      } catch (e) { add('껍데기 실물 검사', false, '검사 자체가 터짐: ' + e.message); }

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
