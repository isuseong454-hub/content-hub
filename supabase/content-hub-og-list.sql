-- ════════════════════════════════════════════════════════════════
--  컨텐츠 허브 — 공개 핸들 목록 (2026-08-21) · DM 카드 미리보기 공사용
--
--  왜 필요한가: GitHub Pages 는 서버가 없어서, 카톡·인스타의 «미리 읽는 로봇»에게
--  보여줄 제목·표지를 미리 파일로 만들어 둬야 한다. 그 파일을 만들려면
--  «지금 공개된 핸들이 누구누구인지» 목록이 있어야 한다.
--
--  안전한가: 여기서 나가는 것은 «이미 누구나 볼 수 있는» 공개 페이지의 핸들뿐이다.
--  비공개(published=false)는 안 나간다. 이름·소개·글은 기존 li_public_get 이 이미 공개한다.
--
--  쓰는 법: Supabase → SQL Editor → 붙여넣기 → RUN. 여러 번 실행해도 안전.
-- ════════════════════════════════════════════════════════════════

create or replace function public.li_og_handles()
returns json language sql security definer set search_path = public as $f$
  select coalesce(json_agg(u.handle order by u.handle), '[]'::json)
    from public.li_users u
    join public.li_pages p on p.code = u.code
   where coalesce(p.published, false) = true
     and coalesce(u.handle, '') <> '';
$f$;

grant execute on function public.li_og_handles() to anon, authenticated;

-- 끝. 껍데기 만드는 도구(tools/og-shells.py)가 이 함수를 부른다.
