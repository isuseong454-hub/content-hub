#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
컨텐츠 허브 — DM 카드 껍데기 만들기 (2026-08-21)

무엇을 하나
  카톡·인스타에 링크를 붙이면 «미리 읽는 로봇»이 한 번 다녀갑니다.
  그 로봇은 화면 그리는 코드를 실행하지 않습니다 — 이름·표지를 넣는 일이 바로 그 코드라
  지금은 모든 사람의 카드가 앱 아이콘 하나로 똑같이 보입니다.

  그래서 «미리 적어 둔» 껍데기 파일을 만들어 둡니다:
      u/<핸들>.html                프로필 카드
      u/<핸들>/<글id>.html          글 카드
      og/<해시>.<확장자>            표지 사진 (data URI → 진짜 파일)
      og/manifest.json             무엇을 만들었는지 목록

  사람이 열면 곧바로 진짜 앱으로 넘어갑니다. 로봇은 넘어가지 않고 적힌 것만 읽어 갑니다.

안전장치
  · 공개(published=true)된 것만 만듭니다.
  · 껍데기는 «옆에» 새로 놓는 파일입니다 — 기존 화면·주소는 하나도 안 건드립니다.
  · 표지는 내용 해시로 이름 짓습니다 → 같은 사진은 한 번만 저장됩니다.
  · manifest.json 이 «만들어진 것»의 유일한 근거입니다.
    앱은 이 목록에 있는 글만 짧은 주소로 공유하고, 없으면 예전 주소를 씁니다
    (방금 쓴 글을 공유해도 404가 안 나게 하는 장치).

쓰는 법
  python3 tools/og-shells.py            # 저장소 루트에서
  python3 tools/og-shells.py --dry-run  # 만들지 않고 무엇이 바뀌는지만 봄
"""

import base64
import hashlib
import json
import os
import re
import shutil
import sys
import urllib.request

SUPA_URL = 'https://goaqxjecotkwxrbzbdzc.supabase.co'
SUPA_KEY = 'sb_publishable_Naq2_XethYcwMKG3pR4KUg_9KIxuHNM'   # 공개키 (브라우저에도 이미 있음)
SITE = 'https://isuseong454-hub.github.io/content-hub'
FALLBACK_IMG = SITE + '/la-512.png'

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
U_DIR = os.path.join(ROOT, 'u')
OG_DIR = os.path.join(ROOT, 'og')

DRY = False          # --dry-run 이면 True — 아무것도 쓰지 않는다

MIME_EXT = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/gif': 'gif',
}


def rpc(fn, args=None):
    """Supabase 공개 RPC 호출. 실패하면 그대로 터뜨린다 — 조용히 빈 껍데기를 만드느니 멈추는 게 낫다."""
    req = urllib.request.Request(
        SUPA_URL + '/rest/v1/rpc/' + fn,
        data=json.dumps(args or {}).encode('utf-8'),
        headers={
            'apikey': SUPA_KEY,
            'Authorization': 'Bearer ' + SUPA_KEY,
            'Content-Type': 'application/json',
            # 🚨 User-Agent 를 안 붙이면 Cloudflare 가 1010 으로 막는다 (2026-08-20 겪음)
            'User-Agent': 'content-hub-og-shells/1.0',
        },
        method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))


def esc(s):
    """meta 태그 안에 들어갈 값. 따옴표까지 막아야 태그가 안 깨진다."""
    return (str(s or '')
            .replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            .replace('"', '&quot;').replace("'", '&#39;'))


def one_line(s, limit=110):
    """줄바꿈을 없애고 길이를 자른다 — 카드 설명은 두어 줄까지만 보인다."""
    s = re.sub(r'\s+', ' ', str(s or '')).strip()
    return s if len(s) <= limit else s[:limit].rstrip() + '…'


def save_data_uri(uri, written):
    """data:image/...;base64,... → og/<해시>.<확장자> 로 저장하고 절대 URL 을 돌려준다.
       http(s) 주소면 그대로 쓴다. 그 밖엔 None (표지 없음)."""
    u = str(uri or '').strip()
    if not u:
        return None
    if u.startswith('http://') or u.startswith('https://'):
        return u
    m = re.match(r'^data:([^;,]+);base64,(.+)$', u, re.S)
    if not m:
        return None
    mime, b64 = m.group(1).lower(), m.group(2)
    ext = MIME_EXT.get(mime)
    if not ext:
        return None
    try:
        raw = base64.b64decode(b64)
    except Exception:
        return None
    if len(raw) < 500:          # 너무 작으면 사진이 아니다 (투명 1px 등)
        return None
    name = hashlib.sha1(raw).hexdigest()[:16] + '.' + ext
    path = os.path.join(OG_DIR, name)
    if not DRY and not os.path.exists(path):
        os.makedirs(OG_DIR, exist_ok=True)
        with open(path, 'wb') as f:
            f.write(raw)
    written.add(name)
    return SITE + '/og/' + name


SHELL = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="{ogtype}">
<meta property="og:site_name" content="{site_name}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{img}">
<meta property="og:url" content="{canon}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img}">
<!-- 사람은 곧바로 진짜 화면으로. 미리 읽는 로봇은 여기까지만 읽고 간다. -->
<script>location.replace({go});</script>
<style>
  body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#16161A;
    color:#9296A0;font:400 14px/1.7 'Apple SD Gothic Neo',system-ui,sans-serif;}}
  a{{color:#A78BFF;}}
</style>
</head>
<body>
<noscript><p>여는 중… <a href="{gohref}">눌러서 이동</a></p></noscript>
<p>여는 중…</p>
</body>
</html>
"""


def write_shell(path, *, title, desc, img, canon, go_rel, ogtype, site_name, dry, changed):
    html = SHELL.format(
        title=esc(title), desc=esc(desc), img=esc(img), canon=esc(canon),
        ogtype=ogtype, site_name=esc(site_name),
        go=json.dumps(go_rel, ensure_ascii=False), gohref=esc(go_rel))
    old = None
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            old = f.read()
    if old == html:
        return False
    changed.append(os.path.relpath(path, ROOT))
    if not dry:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
    return True


def main():
    global DRY
    dry = DRY = '--dry-run' in sys.argv
    if not dry:
        os.makedirs(U_DIR, exist_ok=True)
        os.makedirs(OG_DIR, exist_ok=True)

    handles = rpc('li_og_handles')
    if not isinstance(handles, list):
        print('핸들 목록을 못 받았습니다:', handles)
        return 1
    print('공개 핸들 %d개: %s' % (len(handles), ', '.join(handles)))

    manifest = {'site': SITE, 'profiles': [], 'posts': {}}
    imgs_written, changed = set(), []
    kept_shells = set()

    for h in handles:
        res = rpc('li_public_get', {'p_handle': h})
        if not (isinstance(res, dict) and res.get('ok')):
            print('  · %-10s 건너뜀 (%s)' % (h, (res or {}).get('reason', '응답 없음')))
            continue
        data = res.get('data') or {}
        prof = data.get('profile') or {}
        name = (prof.get('name') or res.get('name') or h).strip()
        bio = one_line(prof.get('bio') or '')
        avatar = save_data_uri(prof.get('avatar'), imgs_written)

        # ── 프로필 껍데기 ──
        p_path = os.path.join(U_DIR, h + '.html')
        write_shell(
            p_path,
            title=name,
            desc=bio or (name + ' · 컨텐츠 허브'),
            img=avatar or FALLBACK_IMG,
            canon='%s/u/%s.html' % (SITE, h),
            go_rel='../u.html?u=' + h,
            ogtype='profile', site_name=name, dry=dry, changed=changed)
        manifest['profiles'].append(h)
        kept_shells.add(os.path.relpath(p_path, ROOT))

        # ── 글 껍데기 ──
        ids = []
        for post in (data.get('posts') or []):
            if not isinstance(post, dict):
                continue
            if post.get('on') is False:
                continue
            pid = str(post.get('id') or '').strip()
            # 파일 이름이 되므로 «안전한 글자»만 (경로 탈출·대소문자 사고 방지)
            if not pid or not re.match(r'^[A-Za-z0-9_-]{3,64}$', pid):
                continue
            title = (post.get('title') or '').strip() or name
            desc = one_line(post.get('summary') or '') or bio or (name + ' · 컨텐츠 허브')
            cover = save_data_uri(post.get('cover'), imgs_written)
            s_path = os.path.join(U_DIR, h, pid + '.html')
            write_shell(
                s_path,
                title=title,
                desc=desc,
                img=cover or avatar or FALLBACK_IMG,
                canon='%s/u/%s/%s.html' % (SITE, h, pid),
                go_rel='../../u.html?u=%s&p=%s' % (h, pid),
                ogtype='article', site_name=name, dry=dry, changed=changed)
            ids.append(pid)
            kept_shells.add(os.path.relpath(s_path, ROOT))
        manifest['posts'][h] = ids
        print('  · %-10s 프로필 1 + 글 %d  (표지 %s)'
              % (h, len(ids), '있음' if avatar or imgs_written else '없음'))

    # ── 비공개로 바뀌거나 지워진 껍데기 치우기 ──
    stale = []
    for base, _dirs, files in os.walk(U_DIR):
        for fn in files:
            if not fn.endswith('.html'):
                continue
            rel = os.path.relpath(os.path.join(base, fn), ROOT)
            if rel not in kept_shells:
                stale.append(rel)
    for rel in stale:
        changed.append('- ' + rel)
        if not dry:
            os.remove(os.path.join(ROOT, rel))

    # ── 아무도 안 쓰는 표지 사진 치우기 ──
    stale_img = []
    if os.path.isdir(OG_DIR):
        for fn in os.listdir(OG_DIR):
            if fn == 'manifest.json' or fn in imgs_written:
                continue
            stale_img.append(fn)
            if not dry:
                os.remove(os.path.join(OG_DIR, fn))

    mpath = os.path.join(OG_DIR, 'manifest.json')
    mtext = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'))
    old_m = open(mpath, encoding='utf-8').read() if os.path.exists(mpath) else None
    if old_m != mtext:
        changed.append('og/manifest.json')
        if not dry:
            os.makedirs(OG_DIR, exist_ok=True)
            with open(mpath, 'w', encoding='utf-8') as f:
                f.write(mtext)

    print('\n표지 사진 %d장 · 껍데기 %d개' % (len(imgs_written), len(kept_shells)))
    if stale or stale_img:
        print('치움: 껍데기 %d · 사진 %d' % (len(stale), len(stale_img)))
    print('바뀐 파일 %d개%s' % (len(changed), ' (--dry-run: 실제로 안 씀)' if dry else ''))
    for c in changed[:20]:
        print('   ', c)
    if len(changed) > 20:
        print('    … 외 %d개' % (len(changed) - 20))
    return 0


if __name__ == '__main__':
    sys.exit(main())
