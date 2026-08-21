-- ════════════════════════════════════════════════════════════════
--  컨텐츠 허브 — 5칸 퍼널 (2026-08-20 사장님 B안)
--
--  지금 퍼널은 «방문 → 둘러봄 → 전환» 3칸이라 «어디서 새는지»가 뭉뚱그려집니다.
--  이 파일을 한 번 실행하면 5칸이 됩니다:
--     ① 홈에 들어옴  ② 10초 넘게 머묾  ③ 무언가 누름  ④ 예약창 엶  ⑤ 예약 끝냄
--
--  ⚠️ 기존 것을 건드리지 않습니다 — li_stats·li_events 그대로 두고 «읽기 함수 하나»만 새로 답니다.
--     프런트는 이 함수가 없으면 그냥 무시하고 옛 3칸을 그립니다(무회귀).
--
--  쓰는 법: Supabase → SQL Editor → 이 파일 전체 복사·붙여넣기 → RUN
--           여러 번 실행해도 안전합니다.
--
--  ※ ④⑤(예약 단계)는 «실행한 날 이후»부터 쌓입니다. 그 전 방문은 단계 구분이
--    저장돼 있지 않아 0으로 나옵니다 — 고장이 아닙니다.
-- ════════════════════════════════════════════════════════════════

create or replace function public.li_funnel(p_code text, p_pin_hash text)
returns json language plpgsql security definer set search_path = public as $f$
declare
  h text;
  s1 int; s2 int; s3 int; s4 int; s5 int;
  since timestamptz := now() - interval '30 days';
begin
  -- 본인 확인 (li_stats 와 같은 규칙)
  if not public.li_verify(p_code, p_pin_hash) then
    return json_build_object('ok', false, 'reason', 'auth');
  end if;

  select handle into h from public.li_users where code = p_code;
  if h is null then
    return json_build_object('ok', true, 'steps', '[]'::json);
  end if;

  -- ① 홈에 들어옴 — 사람 수(세션 수)
  select count(distinct sid) into s1
    from public.li_events
   where handle = h and created_at >= since and type = 'view' and coalesce(sid,'') <> '';

  -- ② 10초 넘게 머묾 — 그냥 스쳐간 사람을 걸러낸다
  select count(distinct sid) into s2
    from public.li_events
   where handle = h and created_at >= since and type = 'dwell'
     and coalesce(sec,0) >= 10 and coalesce(sid,'') <> '';

  -- ③ 무언가 누름 — 사진·글·채널·버튼 무엇이든
  select count(distinct sid) into s3
    from public.li_events
   where handle = h and created_at >= since and type = 'click' and coalesce(sid,'') <> '';

  -- ④ 예약창을 엶  (u.html 이 label='open' 으로 보냄)
  select count(distinct sid) into s4
    from public.li_events
   where handle = h and created_at >= since and type = 'resv' and label = 'open'
     and coalesce(sid,'') <> '';

  -- ⑤ 예약을 끝냄  (label='submit')
  select count(distinct sid) into s5
    from public.li_events
   where handle = h and created_at >= since and type = 'resv' and label = 'submit'
     and coalesce(sid,'') <> '';

  return json_build_object(
    'ok', true,
    'days', 30,
    'steps', json_build_array(
      json_build_object('k','in',    'name','홈에 들어옴',      'n', coalesce(s1,0)),
      json_build_object('k','stay',  'name','10초 넘게 머묾',    'n', coalesce(s2,0)),
      json_build_object('k','click', 'name','무언가 누름',       'n', coalesce(s3,0)),
      json_build_object('k','open',  'name','예약창을 엶',       'n', coalesce(s4,0)),
      json_build_object('k','done',  'name','예약을 끝냄',       'n', coalesce(s5,0))
    )
  );
end $f$;

grant execute on function public.li_funnel(text, text) to anon, authenticated;

-- 조회가 느려지지 않게 (이미 있으면 그냥 넘어감)
create index if not exists li_events_funnel_idx
  on public.li_events (handle, type, created_at);

-- 끝. 편집기 「고객·분석 → 🪣 퍼널」에서 5칸으로 보입니다.
