// 링크 아카이브 — Supabase 연결 설정 (불씨 프로젝트)
// publishable 키는 공개용(브라우저 노출 안전, RLS로 보호). secret 키는 절대 여기 X.
window.LA_SUPABASE_URL = 'https://goaqxjecotkwxrbzbdzc.supabase.co';
window.LA_SUPABASE_KEY = 'sb_publishable_Naq2_XethYcwMKG3pR4KUg_9KIxuHNM';

// 공통 RPC 호출 헬퍼
window.laRpc = async function(fn, args){
  var r = await fetch(window.LA_SUPABASE_URL + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: {
      'apikey': window.LA_SUPABASE_KEY,
      'Authorization': 'Bearer ' + window.LA_SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args || {})
  });
  try { return await r.json(); } catch(e){ return { ok:false, reason:'parse' }; }
};

// PIN → sha256 16진수
window.laSha256 = async function(s){
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
};
