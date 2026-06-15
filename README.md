# 컨텐츠 허브 (Content Hub)

크리에이터·헤어디자이너를 위한 **전환형 개인 랜딩 페이지(link-in-bio)**.
흩어진 콘텐츠를 한곳에 모아 **신뢰 → 안심 → 예약·매출**로 이어지게 만드는 허브.

## 구성 (정적 사이트 + Supabase)

| 파일 | 역할 |
|---|---|
| `index.html` | 진입점 → 편집기로 자동 연결 |
| `edit.html` | 크리에이터 편집기 (로그인) |
| `u.html` | 공개 페이지 (방문자, `u.html?u=핸들`) |
| `admin.html` | 관리자 (코드 발급·현황) |
| `la-config.js` | Supabase 연결 (publishable 키 — 공개 안전, RLS로 보호) |
| `la-manifest.json` · `la-*.png/svg` | PWA 매니페스트 · 아이콘 |

## 배포

정적 파일이라 **Netlify / GitHub Pages / Vercel** 어디든 폴더째 올리면 끝.
내용·사진은 Supabase DB에서 실시간으로 불러오므로, 한 번 배포하면 코드 변경 없이 운영됩니다.

- 백엔드: Supabase (PostgreSQL + Storage), 모든 접근은 SECURITY DEFINER RPC(`li_*`)로만.
- `la-config.js`의 키는 **publishable(공개용)** 이라 브라우저 노출이 안전합니다. (secret 키는 포함하지 않음)
