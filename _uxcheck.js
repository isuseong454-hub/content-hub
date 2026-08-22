/* ══════════════════════════════════════════════════════════════
   ✏️ 편집툴 «손맛» 점검 — 네이버 블로그 쓰는 느낌인가
   쓰는 법: 글 편집기(문서형)를 띄운 뒤 콘솔에서
            fetch('/_uxcheck.js').then(r=>r.text()).then(t=>eval(t))
   설계: «코드가 있나»가 아니라 «눌렀을 때 어색한가»를 잰다.
         이질감의 정체는 대부분 다음 여섯 가지다 —
           ① 누르면 커서가 사라진다      ② 화면이 통째로 다시 그려진다
           ③ 두 번 누르면 중첩된다        ④ 넣었는데 그 안에 못 쓴다
           ⑤ ⌘Z 가 안 먹는다             ⑥ 한글 조합 중에 깨진다
   ⚠️ 읽고, 넣고, 되돌린다 — 끝나면 원래 내용으로 복구한다.
   ══════════════════════════════════════════════════════════════ */
(async function ux() {
  const R = [];
  const add = (n, ok, m, lv) => { window.__UXP = n; return R.push({ n, ok: !!ok, m: m || '', lv: lv || 'err' }); };
  /* 🚨 2026-08-21 — setTimeout 으로 기다리면 «숨은 탭»에서 크롬이 타이머를 얼려 검사가 멈춘다.
        여기서 필요한 건 «진짜 시간»이 아니라 «한 틱 양보»뿐이다. MessageChannel 은 안 얼린다. */
  const tick = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
  const sleep = async (ms) => { const n = Math.max(1, Math.round((ms || 0) / 20)); for (let i = 0; i < n; i++) await tick(); };
  const mk = s2 => { window.__UXP = s2; };

  const H = document.getElementById('docwrap');
  if (!H) { console.log('%c⛔ 문서 편집기(#docwrap)가 안 떠 있습니다 — 글 편집 화면에서 실행하세요', 'color:#E0564B;font-weight:900'); return { verdict: 'SKIP' }; }
  const bar = H.querySelector('#dtool');
  if (!bar) { console.log('%c⛔ 도구막대(#dtool)가 없습니다', 'color:#E0564B;font-weight:900'); return { verdict: 'BLOCK' }; }

  const field = () => H.querySelector('.dtx[data-drich]');
  let F = field();
  if (!F) { console.log('%c⛔ 서식 칸(.dtx[data-drich])이 없습니다 — 글 단락이 하나는 있어야 합니다', 'color:#E0564B;font-weight:900'); return { verdict: 'BLOCK' }; }

  const rowOf = f => {
    const rows = [...document.getElementById('rows').children]
      .filter(x => x.classList && x.classList.contains('row') && x.id !== 'profile-row');
    return rows[+f.getAttribute('data-di2')];
  };
  const saved = () => { const r = rowOf(field()); return r ? String((r._content || [])[1] || '') : ''; };
  const 원본 = saved();
  const 원본HTML = F.innerHTML;

  const btn = k => H.querySelector('[data-dt="' + k + '"]');
  function 선택(from, to) {
    mk('선택 진입');
    const f = field(); const tn = f.firstChild;
    if (!tn || tn.nodeType !== 3) return false;
    const r = document.createRange();
    r.setStart(tn, Math.min(from, tn.length)); r.setEnd(tn, Math.min(to, tn.length));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
    return true;
  }
  function 커서끝() {
    const f = field(); const r = document.createRange();
    r.selectNodeContents(f); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  }
  async function 누름(k) {
    mk('누름:'+k+' 진입');
    const b = btn(k); if (!b) return { 없음: true };
    const before = { node: field(), html: field().innerHTML, err: 0 };
    const onErr = () => before.err++;
    addEventListener('error', onErr);
    b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    mk('누름:'+k+' click 전'); b.click(); mk('누름:'+k+' click 후');
    await sleep(90);
    removeEventListener('error', onErr);
    return {
      바뀜: field().innerHTML !== before.html,
      같은칸: field() === before.node,      /* false = 화면을 통째로 다시 그렸다는 뜻 */
      오류: before.err,
      html: field().innerHTML
    };
  }
  const 복구 = () => {
    mk('복구 진입');
    const f = field(); if (!f) return;
    f.innerHTML = 원본HTML;
    f.dispatchEvent(new Event('input', { bubbles: true }));
    mk('복구 끝');
  };

  /* ── ① 툴바가 손 닿는 곳에 있나 ───────────────────────────── */
  add('툴바가 위에 붙어 있다', getComputedStyle(bar).position === 'sticky',
    '스크롤하면 따라와야 «블로거처럼». 지금: ' + getComputedStyle(bar).position);
  const 앞줄 = [...bar.querySelectorAll('[data-dt]')].length;
  add('앞줄은 6개까지', 앞줄 <= 6, '앞줄 ' + 앞줄 + '개 — 많으면 그것만으로 화면이 찬다', 앞줄 <= 6 ? 'err' : 'warn');
  const more = H.querySelector('#dtool2');
  add('더보기는 처음에 접혀 있다', more && !more.classList.contains('on'),
    '펼쳐진 채로 시작하면 앞줄을 6개로 줄인 뜻이 없다');
  const 총도구 = 앞줄 + (more ? more.querySelectorAll('[data-dt]').length : 0);
  add('도구가 다 있다', 총도구 >= 15, '앞줄+더보기 = ' + 총도구 + '개');

  /* ── ② 누르면 커서·선택이 살아 있나 (제일 흔한 이질감) ────── */
  선택(0, 4);
  const selBefore = getSelection().toString();
  bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  await sleep(30);
  add('툴바를 눌러도 선택이 안 풀린다', getSelection().toString() === selBefore,
    '풀리면 «드래그 → 버튼»이 매번 헛손질이 된다 (전: "' + selBefore + '" / 후: "' + getSelection().toString() + '")');

  /* ── ③ 글자 서식 — 굵게·형광펜·강조 ───────────────────────── */
  for (const [k, cls, 이름] of [['bold', 'b', '굵게'], ['hl-y', '.hl-y', '노랑 형광펜'], ['em', '.em', '강조색']]) {
    복구(); await sleep(40); 선택(0, 4); await sleep(40);
    const r = await 누름(k);
    if (r.없음) { add(이름, false, '버튼이 없다'); continue; }
    const f = field();
    add(이름 + ' 먹는다', !!f.querySelector(cls) && r.오류 === 0, r.오류 ? '오류 ' + r.오류 + '건' : f.innerHTML.slice(0, 46));
    add(이름 + ' 저장된다', saved().indexOf(cls.replace('.', '')) >= 0 || (k === 'bold' && /<b>/.test(saved())),
      '저장값: ' + saved().slice(0, 46));
    add(이름 + ' 화면 안 튄다', r.같은칸, '칸을 다시 그리면 커서가 맨 앞으로 튄다');
  }

  /* ── ④ 두 번 눌러 중첩되나 (네이버는 안 겹친다) ───────────── */
  복구(); await sleep(40); 선택(0, 4); await sleep(40);
  await 누름('hl-y');
  const 한번 = field().querySelectorAll('.hl-y').length;
  선택(0, 4); await sleep(40);
  await 누름('hl-y');
  const 두번 = field().querySelectorAll('.hl-y').length;
  add('형광펜 두 번 눌러도 안 겹친다', 두번 <= 한번,
    '겹치면 <span><span>글자</span></span> 이 되어 지우기가 안 된다 (1회:' + 한번 + ' → 2회:' + 두번 + ')', 'warn');

  /* ── ⑤ 빈 선택으로 누르면 «안내»가 뜨나 (조용히 무시 = 이질감) ── */
  복구(); await sleep(40); 커서끝(); await sleep(40);
  let 안내 = '';
  const _t = window.toast; window.toast = m => { 안내 = String(m); };
  await 누름('bold');   // 굵게는 execCommand 라 통과할 수 있음
  선택(0, 0); await sleep(30);
  await 누름('hl-y');
  window.toast = _t;
  add('글자 안 고르고 누르면 알려준다', /드래그|선택|골라|눌러/.test(안내),
    안내 ? '안내: ' + 안내 : '조용히 아무 일도 안 일어나면 «고장 났나?» 싶어진다', 'warn');

  /* ── ⑥ 덩어리 넣기 — 체크·박스·표·접기·구분선 ─────────────── */
  const 덩어리 = [
    ['check',   'ul.lc-check li',        '체크리스트'],
    ['co-tip',  '.lc-callout.lc-co-tip', '팁 박스'],
    ['co-warn', '.lc-callout.lc-co-warn','주의 박스'],
    ['co-ok',   '.lc-callout.lc-co-ok',  '포인트 박스'],
    ['table',   'table.lc-tb tr',        '표'],
    ['toggle',  'details.lc-tg',         '접기'],
    ['hr',      'hr',                    '구분선']
  ];
  for (const [k, sel, 이름] of 덩어리) {
    복구(); await sleep(40); 커서끝(); await sleep(40);
    const r = await 누름(k);
    if (r.없음) { add(이름, false, '버튼이 없다'); continue; }
    const f = field();
    add(이름 + ' 들어간다', f.querySelectorAll(sel).length > 0 && r.오류 === 0,
      r.오류 ? '오류 ' + r.오류 + '건' : f.querySelectorAll(sel).length + '개');
    add(이름 + ' 저장된다', saved().length > 원본.length, '저장값 ' + saved().length + '자');
    add(이름 + ' 화면 안 튄다', r.같은칸, '');
    /* 네이버는 넣으면 «그 안»에 바로 쓸 수 있다 */
    if (k !== 'hr') {
      const el = f.querySelector(sel.split(' ')[0]);
      const 안에글 = el && el.textContent.trim().length > 0;
      add(이름 + ' 바로 고칠 수 있다', !!el && el.closest('[contenteditable="true"]') === f && 안에글,
        안에글 ? '보기 글이 들어 있어 덮어쓰기만 하면 된다' : '빈 껍데기면 어디를 눌러야 할지 모른다', 'warn');
    }
    /* 넣은 뒤에도 계속 쓸 자리가 있나 (마지막이면 아래에 빈 줄) */
    if (k !== 'hr') {
      const last = f.lastChild;
      add(이름 + ' 뒤에 이어 쓸 자리', !!last && !(last.matches && last.matches(sel.split(' ')[0])),
        '덩어리가 맨 끝이면 그 뒤에 커서를 놓을 수 없다', 'warn');
    }
  }

  /* ── ⑦ 소제목·인용·번호목록 (문단 통째 바꾸기) ────────────── */
  for (const [k, tag, 이름] of [['h4', 'h4', '소제목'], ['quote', 'blockquote', '인용'], ['ol', 'ol li', '번호 목록']]) {
    복구(); await sleep(40); 선택(0, 5); await sleep(40);
    const r = await 누름(k);
    if (r.없음) { add(이름, false, '버튼이 없다'); continue; }
    add(이름 + ' 먹는다', field().querySelectorAll(tag).length > 0 && r.오류 === 0,
      field().innerHTML.slice(0, 50));
  }

  /* ── ⑧ ⌘Z 되돌리기 ─────────────────────────────────────── */
  복구(); await sleep(50); 선택(0, 4); await sleep(40);
  await 누름('bold');
  const 굵게됨 = /<b>/.test(field().innerHTML);
  field().focus(); document.execCommand('undo'); await sleep(80);
  add('⌘Z 로 되돌아간다', 굵게됨 && !/<b>/.test(field().innerHTML),
    '안 되면 «잘못 눌렀을 때» 손이 갈 데가 없다', 'warn');

  /* ── ⑨ 한글 조합(IME) 안전 ────────────────────────────────── */
  {
    const src = [...document.scripts].map(s => s.text || '').join('\n');
    add('한글 조합 중 안 깨진다', src.indexOf('isComposing') >= 0,
      '엔터·백스페이스가 조합 중에 끼어들면 «ㅎ»만 남고 글자가 날아간다');
  }

  /* ── ⑩ 사진 — 끌어다 놓기·크기 손잡이 ─────────────────────── */
  {
    const 손잡이 = H.querySelector('.dpsz');
    const 사진칸 = H.querySelector('.dpic.has');
    add('사진 칸이 끌어놓기를 받는다', !!H._dropArmed, '#docwrap 에 drop 배선이 걸려 있어야 한다');
    if (사진칸) {
      add('크기 손잡이가 사진에 있다', !!손잡이, '사진마다 오른쪽 아래 ↔');
      if (손잡이) {
        const cs = getComputedStyle(손잡이);
        add('손잡이는 평소 숨어 있다', +cs.opacity === 0, '항상 떠 있으면 사진을 가린다 (지금 ' + cs.opacity + ')', 'warn');
        add('손잡이 커서가 «좌우»', cs.cursor === 'ew-resize', '커서가 손 모양이면 «누르는 것»으로 오해한다');
        add('손잡이가 터치를 먹는다', cs.touchAction === 'none', 'touch-action:none 이 없으면 폰에서 화면이 같이 스크롤된다');
      }
    } else {
      add('사진 있을 때 손잡이', true, '글에 사진이 없어 건너뜀 — 사진 넣고 다시 실행', 'warn');
    }
  }

  /* ── ⑪ 폰에서 툴바가 글을 가리나 ─────────────────────────── */
  {
    const h = bar.getBoundingClientRect().height;
    add('툴바가 두껍지 않다', h <= 52, '툴바 ' + Math.round(h) + 'px — 폰에서 두 줄이 되면 글이 절반만 보인다', 'warn');
  }

  /* ── 복구 ────────────────────────────────────────────────── */
  복구(); await sleep(60);
  add('검사 뒤 원래대로', saved() === 원본, '원본 ' + 원본.length + '자 / 지금 ' + saved().length + '자');

  /* ── 결과 ────────────────────────────────────────────────── */
  const bad = R.filter(x => !x.ok && x.lv !== 'warn');
  const warn = R.filter(x => !x.ok && x.lv === 'warn');
  const line = x => (x.ok ? '✅' : x.lv === 'warn' ? '⚠️' : '❌') + ' ' + x.n + (x.m ? ' — ' + x.m : '');
  const report = R.map(line).join('\n');
  console.log('%c✏️ 편집툴 손맛 점검', 'font-size:15px;font-weight:900');
  console.log(report);
  console.log(bad.length ? '%c⛔ 어색한 곳 ' + bad.length + '개' : '%c✅ 손맛 이상 없음' + (warn.length ? ' (다듬을 곳 ' + warn.length + ')' : ''),
    'font-size:14px;font-weight:900;color:' + (bad.length ? '#E0564B' : '#9BE8B4'));
  return { verdict: bad.length ? 'BLOCK' : (warn.length ? 'PASS_WITH_WARN' : 'PASS'), fail: bad.length, warn: warn.length, report };
})();
