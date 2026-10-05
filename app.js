/* HSW365 Stream — client. Contact: hsw365media@gmail.com */
(function () {
  'use strict';

  var SB_URL = 'https://lsxdlmrjrcivxwgfkpop.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeGRsbXJqcmNpdnh3Z2ZrcG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMjY1NTcsImV4cCI6MjEwMzcwMjU1N30.F34TbogHzNEjgS22oIicHZ71HMOqOkJ-Z9uBsYOoT6s';
  var BUCKET = 'stream';
  var CONTACT = 'hsw365media@gmail.com';
  var MAX_BYTES = 50 * 1024 * 1024;
  var PAGE = 24;
  var CATS = ['Music', 'Podcasts', 'Motivation', 'Gaming', 'Sports', 'Comedy', 'News', 'Education', 'Lifestyle', 'Business', 'Other'];
  var OWNER_SEL = 'owner:stream_profiles!stream_videos_owner_id_fkey(id,handle,display_name,avatar_path,is_verified,subs_count)';
  var VIDEO_SEL = '*,' + OWNER_SEL;

  var sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { storageKey: 'hsw365stream-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  var S = { user: null, profile: null, ready: false };
  var view = document.getElementById('view');
  var routeToken = 0;

  /* ---------- utils ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pub(path) { return path ? SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/') : ''; }
  function count(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
  function plural(n, w) { return count(n) + ' ' + w + (Number(n) === 1 ? '' : 's'); }
  function dur(s) {
    s = Math.max(0, Math.round(Number(s) || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  }
  function ago(iso) {
    var d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 60) return 'just now';
    var u = [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
    for (var i = 0; i < u.length; i++) {
      if (d >= u[i][0]) { var n = Math.floor(d / u[i][0]); return n + ' ' + u[i][1] + (n === 1 ? '' : 's') + ' ago'; }
    }
    return 'just now';
  }
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }
  function busy(on) { document.getElementById('signal').classList.toggle('busy', !!on); }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function needAuth() {
    if (S.user) return false;
    sessionStorage.setItem('hsw-next', location.hash || '#/');
    go('#/login');
    return true;
  }
  function icon(name, size) {
    var p = {
      home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
      fire: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
      subs: '<rect x="3" y="8" width="18" height="12" rx="1"/><path d="M7 4h10M5 6h14"/><path d="M10 11.5v5l4.5-2.5z" fill="currentColor" stroke="none"/>',
      heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',
      film: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M10 9.500v5l4.500-2.500z" fill="currentColor" stroke="none"/>',
      up: '<path d="M12 16V5M7 10l5-5 5 5M5 19h14"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
      share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 15V4M8 8l4-4 4 4"/>',
      flag: '<path d="M5 21V4h11l-1.500 4L16 12H5"/>',
      shield: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/>'
    }[name] || '';
    size = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }
  var CHECK = '<svg class="check" viewBox="0 0 24 24" width="15" height="15" aria-label="Verified"><path fill="currentColor" d="M12 2l2.400 2.200 3.200-.400.800 3.100 2.800 1.600-1.300 3 1.300 3-2.800 1.600-.800 3.100-3.200-.400L12 22l-2.400-2.200-3.200.400-.800-3.100-2.800-1.600 1.300-3-1.300-3 2.800-1.600.800-3.100 3.200.400z"/><path d="M8.500 12.200l2.400 2.400 4.600-5" fill="none" stroke="#0a0a0f" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function avatar(p, size) {
    size = size || 40;
    var st = 'width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.42) + 'px';
    if (p && p.avatar_path) return '<img class="avatar" style="' + st + '" src="' + esc(pub(p.avatar_path)) + '" alt="" loading="lazy">';
    var name = (p && (p.display_name || p.handle)) || '?';
    var c = name.charCodeAt(0) % 4;
    return '<span class="avatar c' + c + '" style="' + st + '">' + esc(name.charAt(0)) + '</span>';
  }
  function nameOf(p) { return esc(p ? p.display_name : 'Unknown') + (p && p.is_verified ? CHECK : ''); }
  function thumb(v, cls) {
    var inner = v.thumb_path
      ? '<img src="' + esc(pub(v.thumb_path)) + '" alt="" loading="lazy">'
      : '<span class="ph">' + esc(v.title.slice(0, 40)) + '</span>';
    return '<a class="thumb ' + (cls || '') + '" href="#/watch/' + v.id + '" aria-label="' + esc(v.title) + '">' + inner +
      (v.is_hidden ? '<span class="flag">Hidden</span>' : '') +
      (v.duration ? '<span class="dur">' + dur(v.duration) + '</span>' : '') + '</a>';
  }
  function card(v) {
    var o = v.owner || {};
    return '<article class="card">' + thumb(v) +
      '<div class="card-meta"><a href="#/c/' + esc(o.handle) + '" aria-label="' + esc(o.display_name) + '">' + avatar(o, 36) + '</a>' +
      '<div><a class="t" href="#/watch/' + v.id + '">' + esc(v.title) + '</a>' +
      '<div class="s"><a href="#/c/' + esc(o.handle) + '">' + nameOf(o) + '</a></div>' +
      '<div class="stat">' + plural(v.views, 'view') + ' / ' + ago(v.created_at) + '</div></div></div></article>';
  }
  function emptyBlock(title, text, cta) {
    return '<div class="empty"><h2>' + title + '</h2><p>' + text + '</p>' + (cta || '') + '</div>';
  }
  function fail(e) {
    console.error(e);
    view.innerHTML = emptyBlock('Could not load this page', esc((e && e.message) || 'Check your connection and try again.'),
      '<button class="btn" onclick="location.reload()">Reload</button>');
  }

  /* ---------- chrome ---------- */
  function renderChrome() {
    var h = location.hash || '#/';
    var links = [
      ['#/', 'home', 'Home'], ['#/trending', 'fire', 'Trending'], ['#/subs', 'subs', 'Subscriptions'],
      ['#/liked', 'heart', 'Liked'], ['#/studio', 'film', 'Your videos']
    ];
    if (S.profile && S.profile.is_admin) links.push(['#/admin', 'shield', 'Moderation']);
    function act(x) { return (x === '#/' ? (h === '#/' || h === '') : h.indexOf(x) === 0) ? ' class="active"' : ''; }
    var rail = links.map(function (l) { return '<a href="' + l[0] + '"' + act(l[0]) + '>' + icon(l[1]) + l[2] + '</a>'; }).join('');
    rail += '<h3>Categories</h3>' + CATS.map(function (c) {
      var x = '#/cat/' + c;
      return '<a class="cat' + (h === x ? ' active' : '') + '" href="' + x + '">' + c + '</a>';
    }).join('');
    rail += '<div class="foot"><a href="#/legal">Terms, rules and copyright</a><br>Contact <a href="mailto:' + CONTACT + '">' + CONTACT + '</a><br>HSW365 Media LLC</div>';
    document.getElementById('rail').innerHTML = rail;

    var you = S.profile ? '#/c/' + S.profile.handle : '#/login';
    document.getElementById('tabs').innerHTML =
      '<a href="#/"' + act('#/') + '>' + icon('home') + 'Home</a>' +
      '<a href="#/trending"' + act('#/trending') + '>' + icon('fire') + 'Trending</a>' +
      '<a href="#/upload"' + act('#/upload') + '>' + icon('up') + 'Upload</a>' +
      '<a href="#/subs"' + act('#/subs') + '>' + icon('subs') + 'Subs</a>' +
      '<a href="' + you + '"' + (h === you ? ' class="active"' : '') + '>' + icon('user') + 'You</a>';

    var ta = document.getElementById('topActions');
    if (!S.user) {
      ta.innerHTML = '<a class="btn hide-m" href="#/upload">' + icon('up', 16) + 'Upload</a><a class="btn primary" href="#/login">Sign in</a>';
    } else {
      var p = S.profile || { display_name: S.user.email, handle: '' };
      ta.innerHTML = '<a class="btn primary hide-m" href="#/upload">' + icon('up', 16) + 'Upload</a>' +
        '<div class="menu-wrap"><button class="avatar-btn" id="avBtn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' + avatar(p, 38) + '</button>' +
        '<div class="menu" id="avMenu" hidden><div class="who"><b>' + nameOf(p) + '</b><span>@' + esc(p.handle) + '</span></div>' +
        '<a href="#/c/' + esc(p.handle) + '">Your channel</a><a href="#/studio">Your videos</a><a href="#/settings">Channel settings</a>' +
        (p.is_admin ? '<a href="#/admin">Moderation</a>' : '') +
        '<button id="signOut">Sign out</button></div></div>';
      var btn = document.getElementById('avBtn'), menu = document.getElementById('avMenu');
      btn.onclick = function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute('aria-expanded', String(!menu.hidden)); };
      document.getElementById('signOut').onclick = function () { sb.auth.signOut().then(function () { toast('Signed out'); go('#/'); }); };
    }
  }
  document.addEventListener('click', function () { var m = document.getElementById('avMenu'); if (m) m.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var m = document.getElementById('avMenu'); if (m) m.hidden = true; closeModal(); } });
  document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = document.getElementById('searchInput').value.trim();
    if (q) go('#/search/' + encodeURIComponent(q));
  });

  function modal(html) {
    document.getElementById('modalRoot').innerHTML = '<div class="modal-bg" id="modalBg"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
    document.getElementById('modalBg').addEventListener('click', function (e) { if (e.target.id === 'modalBg') closeModal(); });
  }
  function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

  /* ---------- feeds ---------- */
  function chips(active) {
    return '<div class="chips"><a href="#/"' + (active === 'home' ? ' class="active"' : '') + '>All</a><a href="#/trending"' + (active === 'trending' ? ' class="active"' : '') + '>Trending</a>' +
      CATS.map(function (c) { return '<a href="#/cat/' + c + '"' + (active === c ? ' class="active"' : '') + '>' + c + '</a>'; }).join('') + '</div>';
  }

  // Renders a paged grid. build(from, to) returns a query promise.
  async function feed(opts) {
    var token = routeToken, page = 0, list = [];
    async function load() {
      busy(true);
      var r = await opts.build(page * PAGE, page * PAGE + PAGE - 1);
      busy(false);
      if (token !== routeToken) return;
      if (r.error) return fail(r.error);
      var rows = opts.map ? r.data.map(opts.map).filter(Boolean) : r.data;
      list = list.concat(rows);
      draw(r.data.length === PAGE);
    }
    function draw(more) {
      var html = opts.head || '';
      if (!list.length) {
        html += opts.empty;
      } else {
        var rest = list;
        if (opts.feature) {
          var f = list[0], o = f.owner || {};
          rest = list.slice(1);
          html += '<section class="feature">' + thumb(f) + '<div class="feature-body"><div><span class="feature-tag">Latest upload</span>' +
            '<h2><a href="#/watch/' + f.id + '">' + esc(f.title) + '</a></h2></div>' +
            '<div><div class="by"><a href="#/c/' + esc(o.handle) + '">' + avatar(o, 44) + '</a><div><a href="#/c/' + esc(o.handle) + '"><b>' + nameOf(o) + '</b></a>' +
            '<div class="stat">' + plural(f.views, 'view') + ' / ' + ago(f.created_at) + '</div></div></div>' +
            '<a class="btn primary" style="margin-top:20px" href="#/watch/' + f.id + '">Watch now</a></div></div></section>';
        }
        html += '<div class="grid">' + rest.map(card).join('') + '</div>';
        if (more) html += '<div class="more"><button class="btn" id="moreBtn">Load more</button></div>';
      }
      view.innerHTML = html;
      var mb = document.getElementById('moreBtn');
      if (mb) mb.onclick = function () { mb.disabled = true; page++; load(); };
    }
    await load();
  }

  var uploadCta = '<a class="btn primary" href="#/upload">Upload a video</a>';

  function vHome() {
    document.title = 'HSW365 Stream';
    return feed({
      head: chips('home'), feature: true,
      empty: emptyBlock('Nothing on air yet', 'This is a new platform. The first upload leads the home page.', uploadCta),
      build: function (a, b) { return sb.from('stream_videos').select(VIDEO_SEL).eq('is_hidden', false).order('created_at', { ascending: false }).range(a, b); }
    });
  }
  function vTrending() {
    document.title = 'Trending / HSW365 Stream';
    return feed({
      head: chips('trending') + '<div class="page-head"><div><h1>Trending</h1><p>Most watched videos on HSW365 Stream.</p></div></div>',
      empty: emptyBlock('No views yet', 'Videos show up here once people start watching.', uploadCta),
      build: function (a, b) { return sb.from('stream_videos').select(VIDEO_SEL).eq('is_hidden', false).order('views', { ascending: false }).order('created_at', { ascending: false }).range(a, b); }
    });
  }
  function vCat(c) {
    if (CATS.indexOf(c) < 0) return go('#/');
    document.title = c + ' / HSW365 Stream';
    return feed({
      head: chips(c) + '<div class="page-head"><h1>' + c + '</h1></div>',
      empty: emptyBlock('No ' + c.toLowerCase() + ' videos yet', 'Be the first to post in this category.', uploadCta),
      build: function (a, b) { return sb.from('stream_videos').select(VIDEO_SEL).eq('is_hidden', false).eq('category', c).order('created_at', { ascending: false }).range(a, b); }
    });
  }
  function vSearch(q) {
    document.getElementById('searchInput').value = q;
    document.title = q + ' / HSW365 Stream';
    var safe = q.replace(/[%_,()\\*"]/g, ' ').trim();
    return feed({
      head: '<div class="page-head"><div><h1>Search</h1><p>Results for "' + esc(q) + '"</p></div></div>',
      empty: emptyBlock('No matches', 'Nothing matches "' + esc(q) + '". Try fewer or different words.'),
      build: function (a, b) {
        return sb.from('stream_videos').select(VIDEO_SEL).eq('is_hidden', false)
          .or('title.ilike.*' + safe + '*,description.ilike.*' + safe + '*').order('views', { ascending: false }).range(a, b);
      }
    });
  }
  async function vSubs() {
    if (needAuth()) return;
    document.title = 'Subscriptions / HSW365 Stream';
    var token = routeToken;
    var r = await sb.from('stream_subs').select('channel_id').eq('subscriber_id', S.user.id);
    if (token !== routeToken) return;
    if (r.error) return fail(r.error);
    var ids = r.data.map(function (x) { return x.channel_id; });
    var head = '<div class="page-head"><div><h1>Subscriptions</h1><p>New videos from channels you follow.</p></div></div>';
    if (!ids.length) { view.innerHTML = head + emptyBlock('No subscriptions yet', 'Subscribe to a channel and its new videos land here.', '<a class="btn primary" href="#/trending">Find channels</a>'); return; }
    return feed({
      head: head, empty: emptyBlock('Nothing new', 'The channels you follow have not posted yet.'),
      build: function (a, b) { return sb.from('stream_videos').select(VIDEO_SEL).eq('is_hidden', false).in('owner_id', ids).order('created_at', { ascending: false }).range(a, b); }
    });
  }
  function vLiked() {
    if (needAuth()) return;
    document.title = 'Liked / HSW365 Stream';
    return feed({
      head: '<div class="page-head"><h1>Liked videos</h1></div>',
      empty: emptyBlock('No liked videos', 'Videos you like are saved here.', '<a class="btn primary" href="#/">Browse videos</a>'),
      map: function (x) { return x.video; },
      build: function (a, b) { return sb.from('stream_likes').select('created_at,video:stream_videos!stream_likes_video_id_fkey(' + VIDEO_SEL + ')').eq('user_id', S.user.id).order('created_at', { ascending: false }).range(a, b); }
    });
  }

  /* ---------- watch ---------- */
  async function vWatch(id) {
    var token = routeToken;
    busy(true);
    var r = await sb.from('stream_videos').select(VIDEO_SEL).eq('id', id).maybeSingle();
    busy(false);
    if (token !== routeToken) return;
    if (r.error) return fail(r.error);
    var v = r.data;
    if (!v) { view.innerHTML = emptyBlock('Video not found', 'It may have been removed by its owner.', '<a class="btn primary" href="#/">Go home</a>'); return; }
    var o = v.owner || {};
    document.title = v.title + ' / HSW365 Stream';
    var mine = S.user && S.user.id === v.owner_id;
    var admin = S.profile && S.profile.is_admin;

    view.innerHTML = '<div class="watch"><div>' +
      '<div class="player"><video id="vid" controls playsinline preload="metadata" ' + (v.thumb_path ? 'poster="' + esc(pub(v.thumb_path)) + '" ' : '') + 'src="' + esc(pub(v.video_path)) + '"></video></div>' +
      '<h1>' + esc(v.title) + '</h1>' +
      '<div class="bar"><div class="chan"><a href="#/c/' + esc(o.handle) + '">' + avatar(o, 46) + '</a><div><a href="#/c/' + esc(o.handle) + '"><b>' + nameOf(o) + '</b></a>' +
      '<span class="stat" id="subCount">' + plural(o.subs_count, 'subscriber') + '</span></div>' +
      (mine ? '<a class="btn sm" href="#/studio">Manage</a>' : '<button class="btn primary" id="subBtn">Subscribe</button>') + '</div>' +
      '<div class="acts"><button class="btn" id="likeBtn">' + icon('heart', 17) + '<span id="likeN">' + count(v.likes_count) + '</span></button>' +
      '<button class="btn" id="shareBtn">' + icon('share', 17) + 'Share</button>' +
      (mine ? '' : '<button class="btn" id="reportBtn">' + icon('flag', 17) + 'Report</button>') +
      (admin ? '<button class="btn danger" id="hideBtn">' + (v.is_hidden ? 'Unhide' : 'Hide') + '</button>' : '') + '</div></div>' +
      '<div class="desc"><span class="stat">' + plural(v.views + 1, 'view') + ' / ' + ago(v.created_at) + ' / ' + esc(v.category) + '</span>' + esc(v.description || 'No description.') + '</div>' +
      '<section class="comments"><h2 id="cTitle">' + plural(v.comments_count, 'comment') + '</h2><div id="cForm"></div><div id="cList"></div></section>' +
      '</div><aside class="side"><h2>Up next</h2><div class="rows" id="upNext"></div></aside></div>';

    // count a view once per browser session
    var key = 'hsw-v-' + id;
    if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); sb.rpc('stream_view', { p_video: id }).then(function () {}); }

    // like
    var liked = false, likes = v.likes_count, likeBtn = document.getElementById('likeBtn');
    function paintLike() { likeBtn.classList.toggle('on', liked); document.getElementById('likeN').textContent = count(likes); likeBtn.setAttribute('aria-pressed', String(liked)); }
    if (S.user) sb.from('stream_likes').select('video_id').eq('video_id', id).eq('user_id', S.user.id).maybeSingle().then(function (x) { if (token === routeToken && x.data) { liked = true; paintLike(); } });
    likeBtn.onclick = async function () {
      if (needAuth()) return;
      likeBtn.disabled = true;
      var q = liked ? sb.from('stream_likes').delete().eq('video_id', id).eq('user_id', S.user.id) : sb.from('stream_likes').insert({ video_id: id, user_id: S.user.id });
      var x = await q; likeBtn.disabled = false;
      if (x.error) return toast('Could not save your like');
      liked = !liked; likes += liked ? 1 : -1; paintLike();
    };

    // subscribe
    var subBtn = document.getElementById('subBtn');
    if (subBtn) {
      var subbed = false, subs = o.subs_count || 0;
      var paintSub = function () {
        subBtn.textContent = subbed ? 'Subscribed' : 'Subscribe';
        subBtn.className = 'btn ' + (subbed ? 'on' : 'primary');
        document.getElementById('subCount').textContent = plural(subs, 'subscriber');
      };
      if (S.user) sb.from('stream_subs').select('channel_id').eq('channel_id', v.owner_id).eq('subscriber_id', S.user.id).maybeSingle().then(function (x) { if (token === routeToken && x.data) { subbed = true; paintSub(); } });
      subBtn.onclick = async function () {
        if (needAuth()) return;
        subBtn.disabled = true;
        var q = subbed ? sb.from('stream_subs').delete().eq('channel_id', v.owner_id).eq('subscriber_id', S.user.id) : sb.from('stream_subs').insert({ channel_id: v.owner_id, subscriber_id: S.user.id });
        var x = await q; subBtn.disabled = false;
        if (x.error) return toast('Could not update subscription');
        subbed = !subbed; subs += subbed ? 1 : -1; paintSub();
        toast(subbed ? 'Subscribed to ' + o.display_name : 'Unsubscribed');
      };
    }

    document.getElementById('shareBtn').onclick = function () {
      var url = location.href;
      if (navigator.share) navigator.share({ title: v.title, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copied'); });
      else toast(url);
    };

    var rb = document.getElementById('reportBtn');
    if (rb) rb.onclick = function () {
      if (needAuth()) return;
      modal('<h2>Report this video</h2><div class="field"><label for="rReason">What is wrong with it?</label><textarea id="rReason" maxlength="1000" placeholder="Copyright, harassment, spam, illegal content..."></textarea></div>' +
        '<div class="acts"><button class="btn" id="rCancel">Cancel</button><button class="btn primary" id="rSend">Send report</button></div>');
      document.getElementById('rCancel').onclick = closeModal;
      document.getElementById('rSend').onclick = async function () {
        var reason = document.getElementById('rReason').value.trim();
        if (reason.length < 3) return toast('Describe the problem first');
        var x = await sb.from('stream_reports').insert({ video_id: id, reporter_id: S.user.id, reason: reason });
        closeModal(); toast(x.error ? 'Could not send report' : 'Report sent');
      };
    };

    var hb = document.getElementById('hideBtn');
    if (hb) hb.onclick = async function () {
      var x = await sb.rpc('stream_set_hidden', { p_video: id, p_hidden: !v.is_hidden });
      if (x.error) return toast('Could not update');
      toast(v.is_hidden ? 'Video is visible again' : 'Video hidden'); route();
    };

    // comments
    var cCount = v.comments_count;
    var cForm = document.getElementById('cForm');
    if (S.user) {
      cForm.innerHTML = '<form class="cform" id="cf">' + avatar(S.profile, 40) + '<textarea id="cBody" maxlength="2000" placeholder="Add a comment" aria-label="Add a comment" required></textarea><button class="btn primary">Comment</button></form>';
      document.getElementById('cf').onsubmit = async function (e) {
        e.preventDefault();
        var body = document.getElementById('cBody').value.trim();
        if (!body) return;
        var x = await sb.from('stream_comments').insert({ video_id: id, user_id: S.user.id, body: body });
        if (x.error) return toast('Could not post comment');
        document.getElementById('cBody').value = ''; cCount++; loadComments();
      };
    } else {
      cForm.innerHTML = '<p class="note"><a class="link" href="#/login">Sign in</a> to comment.</p>';
    }
    async function loadComments() {
      var x = await sb.from('stream_comments').select('*,author:stream_profiles!stream_comments_user_id_fkey(id,handle,display_name,avatar_path,is_verified)').eq('video_id', id).order('created_at', { ascending: false }).limit(200);
      if (token !== routeToken || x.error) return;
      document.getElementById('cTitle').textContent = plural(Math.max(cCount, x.data.length), 'comment');
      document.getElementById('cList').innerHTML = x.data.map(function (c) {
        var a = c.author || {};
        var can = S.user && (S.user.id === c.user_id || mine || admin);
        return '<div class="comment"><a href="#/c/' + esc(a.handle) + '">' + avatar(a, 40) + '</a><div><div class="head"><a href="#/c/' + esc(a.handle) + '"><b>' + nameOf(a) + '</b></a> ' + ago(c.created_at) + '</div>' +
          '<div class="body">' + esc(c.body) + '</div>' + (can ? '<button class="del" data-id="' + c.id + '">Delete</button>' : '') + '</div></div>';
      }).join('') || '<p class="stat">No comments yet.</p>';
    }
    document.getElementById('cList').onclick = async function (e) {
      var cid = e.target.getAttribute && e.target.getAttribute('data-id');
      if (!cid) return;
      var x = await sb.from('stream_comments').delete().eq('id', cid);
      if (x.error) return toast('Could not delete comment');
      cCount = Math.max(0, cCount - 1); loadComments();
    };
    loadComments();

    // up next: same category first, then newest
    sb.from('stream_videos').select(VIDEO_SEL).eq('is_hidden', false).neq('id', id).order('created_at', { ascending: false }).limit(40).then(function (x) {
      if (token !== routeToken || x.error) return;
      var rows = x.data.sort(function (a, b) { return (b.category === v.category) - (a.category === v.category); }).slice(0, 14);
      document.getElementById('upNext').innerHTML = rows.map(function (n) {
        return '<div class="row">' + thumb(n) + '<div><a class="t" href="#/watch/' + n.id + '">' + esc(n.title) + '</a><div class="s">' + nameOf(n.owner) + '</div><div class="stat">' + plural(n.views, 'view') + ' / ' + ago(n.created_at) + '</div></div></div>';
      }).join('') || '<p class="stat">More videos will show here as channels upload.</p>';
    });
  }

  /* ---------- channel ---------- */
  async function vChannel(handle) {
    var token = routeToken;
    busy(true);
    var r = await sb.from('stream_profiles').select('*').eq('handle', handle.toLowerCase()).maybeSingle();
    busy(false);
    if (token !== routeToken) return;
    if (r.error) return fail(r.error);
    var p = r.data;
    if (!p) { view.innerHTML = emptyBlock('Channel not found', 'There is no channel at @' + esc(handle) + '.', '<a class="btn primary" href="#/">Go home</a>'); return; }
    document.title = p.display_name + ' / HSW365 Stream';
    var mine = S.user && S.user.id === p.id;
    var subbed = false;
    if (S.user && !mine) {
      var s = await sb.from('stream_subs').select('channel_id').eq('channel_id', p.id).eq('subscriber_id', S.user.id).maybeSingle();
      if (token !== routeToken) return;
      subbed = !!s.data;
    }
    var head = '<section class="chead">' + avatar(p, 112) + '<div class="info"><h1>' + nameOf(p) + '</h1>' +
      '<span class="stat">@' + esc(p.handle) + ' / <span id="chSubs">' + plural(p.subs_count, 'subscriber') + '</span> / joined ' + ago(p.created_at) + '</span>' +
      (p.bio ? '<p class="bio">' + esc(p.bio) + '</p>' : '') + '</div>' +
      (mine ? '<div class="acts"><a class="btn" href="#/settings">Edit channel</a><a class="btn primary" href="#/upload">Upload</a></div>'
        : '<button class="btn ' + (subbed ? 'on' : 'primary') + '" id="chSub">' + (subbed ? 'Subscribed' : 'Subscribe') + '</button>') + '</section>';
    await feed({
      head: head,
      empty: emptyBlock('No videos yet', mine ? 'Your channel is live. Post your first video.' : esc(p.display_name) + ' has not uploaded anything yet.', mine ? uploadCta : ''),
      build: function (a, b) { return sb.from('stream_videos').select(VIDEO_SEL).eq('owner_id', p.id).eq('is_hidden', false).order('created_at', { ascending: false }).range(a, b); }
    });
    // feed() redraws on "load more", so delegate the subscribe click from the view
    view.onclick = async function (e) {
      var b = e.target.closest && e.target.closest('#chSub');
      if (!b) return;
      if (needAuth()) return;
      b.disabled = true;
      var q = subbed ? sb.from('stream_subs').delete().eq('channel_id', p.id).eq('subscriber_id', S.user.id) : sb.from('stream_subs').insert({ channel_id: p.id, subscriber_id: S.user.id });
      var x = await q;
      if (x.error) { b.disabled = false; return toast('Could not update subscription'); }
      toast(subbed ? 'Unsubscribed' : 'Subscribed to ' + p.display_name);
      route();
    };
  }

  /* ---------- upload ---------- */
  function captureFrame(video) {
    return new Promise(function (resolve) {
      try {
        var W = 1280, H = 720, c = document.createElement('canvas');
        c.width = W; c.height = H;
        var g = c.getContext('2d');
        g.fillStyle = '#0a0a0f'; g.fillRect(0, 0, W, H);
        var vw = video.videoWidth, vh = video.videoHeight;
        if (!vw || !vh) return resolve(null);
        var k = Math.min(W / vw, H / vh), w = vw * k, h = vh * k;
        g.drawImage(video, (W - w) / 2, (H - h) / 2, w, h);
        c.toBlob(function (b) { resolve(b); }, 'image/jpeg', 0.84);
      } catch (e) { resolve(null); }
    });
  }
  function resizeImage(file, max) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error('Could not read that image')); }, 'image/jpeg', 0.86);
      };
      img.onerror = function () { reject(new Error('Could not read that image')); };
      img.src = URL.createObjectURL(file);
    });
  }
  function xhrUpload(path, file, token, onProgress) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open('POST', SB_URL + '/storage/v1/object/' + BUCKET + '/' + path);
      x.setRequestHeader('Authorization', 'Bearer ' + token);
      x.setRequestHeader('apikey', SB_KEY);
      x.setRequestHeader('x-upsert', 'false');
      x.setRequestHeader('cache-control', 'max-age=31536000');
      x.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      x.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) return resolve();
        var m = 'Upload failed';
        try { m = JSON.parse(x.responseText).message || m; } catch (e) {}
        reject(new Error(m));
      };
      x.onerror = function () { reject(new Error('Connection lost during upload. Try again.')); };
      x.send(file);
    });
  }

  function vUpload() {
    if (needAuth()) return;
    document.title = 'Upload / HSW365 Stream';
    var file = null, thumbBlob = null, objUrl = null;
    view.innerHTML = '<div class="page-head"><div><h1>Upload a video</h1><p>MP4 or WebM, up to 50 MB. Your video goes live as soon as it finishes.</p></div></div>' +
      '<div class="form wide" id="upStage"><div class="drop" id="drop"><div><h2>Drop a video here</h2><p>or pick one from your device</p>' +
      '<button class="btn primary" id="pick">Choose video</button><input type="file" id="fileIn" accept="video/mp4,video/webm,video/quicktime" hidden></div></div></div>';

    var drop = document.getElementById('drop'), fileIn = document.getElementById('fileIn');
    document.getElementById('pick').onclick = function () { fileIn.click(); };
    fileIn.onchange = function () { if (fileIn.files[0]) chosen(fileIn.files[0]); };
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = function () { drop.classList.remove('over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) chosen(e.dataTransfer.files[0]); };

    function chosen(f) {
      if (['video/mp4', 'video/webm', 'video/quicktime'].indexOf(f.type) < 0) return toast('Use an MP4, WebM or MOV file');
      if (f.size > MAX_BYTES) return toast('That file is ' + Math.round(f.size / 1048576) + ' MB. The limit is 50 MB.');
      file = f; objUrl = URL.createObjectURL(f);
      var base = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120);
      document.getElementById('upStage').innerHTML = '<div class="upgrid"><div class="preview"><video id="pv" src="' + objUrl + '" controls muted playsinline preload="auto"></video>' +
        '<div class="thumbrow"><img id="thImg" alt="Thumbnail preview"><div><button class="btn sm" id="useFrame" type="button">Use current frame</button> ' +
        '<button class="btn sm" id="pickThumb" type="button">Upload image</button><input type="file" id="thIn" accept="image/jpeg,image/png,image/webp" hidden>' +
        '<div class="hint stat" style="margin-top:8px">Scrub the video, then set the thumbnail.</div></div></div>' +
        (f.type === 'video/quicktime' ? '<p class="note" style="margin-top:16px">MOV files do not play in every browser. MP4 (H.264) plays everywhere.</p>' : '') + '</div>' +
        '<form id="upForm"><div class="field"><label for="uTitle">Title</label><input type="text" id="uTitle" maxlength="120" required value="' + esc(base) + '"></div>' +
        '<div class="field"><label for="uDesc">Description</label><textarea id="uDesc" maxlength="5000" rows="6" placeholder="Tell viewers what this video is about"></textarea></div>' +
        '<div class="field"><label for="uCat">Category</label><select id="uCat">' + CATS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
        '<p class="err" id="uErr"></p><div id="uProg" hidden><div class="progress" id="uBar"><i></i><i></i><i></i><i></i></div><span class="stat" id="uPct">0%</span></div>' +
        '<div class="acts"><button class="btn primary" id="uGo">Publish video</button><a class="btn" href="#/upload" id="uCancel">Start over</a></div>' +
        '<p class="hint stat" style="margin-top:16px">Only upload video you own or have the rights to. See the <a class="link" href="#/legal">rules</a>.</p></form></div>';

      var pv = document.getElementById('pv'), thImg = document.getElementById('thImg');
      function setThumb(b) { if (!b) return; thumbBlob = b; thImg.src = URL.createObjectURL(b); }
      pv.addEventListener('loadeddata', function () {
        var t = Math.min(1, (pv.duration || 2) / 4);
        var once = function () { pv.removeEventListener('seeked', once); captureFrame(pv).then(setThumb); };
        pv.addEventListener('seeked', once);
        try { pv.currentTime = t; } catch (e) {}
      }, { once: true });
      document.getElementById('useFrame').onclick = function () { captureFrame(pv).then(function (b) { if (b) { setThumb(b); toast('Thumbnail set'); } else toast('Could not grab a frame from this file'); }); };
      var thIn = document.getElementById('thIn');
      document.getElementById('pickThumb').onclick = function () { thIn.click(); };
      thIn.onchange = function () { if (thIn.files[0]) resizeImage(thIn.files[0], 1280).then(setThumb).catch(function (e) { toast(e.message); }); };
      document.getElementById('uCancel').onclick = function (e) { e.preventDefault(); route(); };

      document.getElementById('upForm').onsubmit = async function (e) {
        e.preventDefault();
        var err = document.getElementById('uErr'), goBtn = document.getElementById('uGo');
        err.textContent = '';
        var title = document.getElementById('uTitle').value.trim();
        if (!title) { err.textContent = 'Add a title.'; return; }
        var sess = (await sb.auth.getSession()).data.session;
        if (!sess) return needAuth();
        goBtn.disabled = true; goBtn.textContent = 'Publishing';
        document.getElementById('uProg').hidden = false;
        var uid = S.user.id, vidId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
        var ext = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }[file.type];
        var vPath = uid + '/v/' + vidId + '.' + ext, tPath = thumbBlob ? uid + '/t/' + vidId + '.jpg' : null;
        var bar = document.getElementById('uBar'), pct = document.getElementById('uPct');
        try {
          await xhrUpload(vPath, file, sess.access_token, function (p) { bar.style.setProperty('--p', p); pct.textContent = Math.round(p * 100) + '%'; });
          if (tPath) {
            var t = await sb.storage.from(BUCKET).upload(tPath, thumbBlob, { contentType: 'image/jpeg', cacheControl: '31536000' });
            if (t.error) tPath = null;
          }
          var ins = await sb.from('stream_videos').insert({
            owner_id: uid, title: title, description: document.getElementById('uDesc').value.trim(),
            category: document.getElementById('uCat').value, video_path: vPath, thumb_path: tPath,
            duration: isFinite(pv.duration) ? Math.round(pv.duration) : 0, size_bytes: file.size
          }).select('id').single();
          if (ins.error) throw ins.error;
          URL.revokeObjectURL(objUrl);
          toast('Published');
          go('#/watch/' + ins.data.id);
        } catch (ex) {
          sb.storage.from(BUCKET).remove([vPath].concat(tPath ? [tPath] : []));
          err.textContent = /exceeded|too large|413/i.test(ex.message) ? 'That file is over the 50 MB limit.' : ex.message;
          goBtn.disabled = false; goBtn.textContent = 'Publish video';
          document.getElementById('uProg').hidden = true;
        }
      };
    }
  }

  /* ---------- studio ---------- */
  async function vStudio() {
    if (needAuth()) return;
    document.title = 'Your videos / HSW365 Stream';
    var token = routeToken;
    busy(true);
    var r = await sb.from('stream_videos').select('*').eq('owner_id', S.user.id).order('created_at', { ascending: false });
    busy(false);
    if (token !== routeToken) return;
    if (r.error) return fail(r.error);
    var head = '<div class="page-head"><div><h1>Your videos</h1><p>' + plural(r.data.length, 'video') + ' on your channel.</p></div><a class="btn primary" href="#/upload">' + icon('up', 16) + 'Upload</a></div>';
    if (!r.data.length) { view.innerHTML = head + emptyBlock('You have not posted yet', 'Your uploads and their numbers show up here.', uploadCta); return; }
    view.innerHTML = head + '<div class="list">' + r.data.map(function (v) {
      return '<div class="item">' + thumb(v) + '<div><a class="t" href="#/watch/' + v.id + '">' + esc(v.title) + '</a>' +
        '<div class="stat">' + plural(v.views, 'view') + ' / ' + plural(v.likes_count, 'like') + ' / ' + plural(v.comments_count, 'comment') + ' / ' + ago(v.created_at) + (v.is_hidden ? ' / hidden by moderation' : '') + '</div></div>' +
        '<div class="acts"><button class="btn sm" data-edit="' + v.id + '">Edit</button><button class="btn sm danger" data-del="' + v.id + '">Delete</button></div></div>';
    }).join('') + '</div>';
    view.onclick = function (e) {
      var ed = e.target.getAttribute('data-edit'), del = e.target.getAttribute('data-del');
      var v = r.data.filter(function (x) { return x.id === (ed || del); })[0];
      if (!v) return;
      if (ed) editVideo(v); else confirmDelete(v);
    };
  }
  function editVideo(v) {
    modal('<h2>Edit video</h2><div class="field"><label for="eTitle">Title</label><input type="text" id="eTitle" maxlength="120" value="' + esc(v.title) + '"></div>' +
      '<div class="field"><label for="eDesc">Description</label><textarea id="eDesc" maxlength="5000" rows="5">' + esc(v.description) + '</textarea></div>' +
      '<div class="field"><label for="eCat">Category</label><select id="eCat">' + CATS.map(function (c) { return '<option' + (c === v.category ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="acts"><button class="btn" id="eCancel">Cancel</button><button class="btn primary" id="eSave">Save changes</button></div>');
    document.getElementById('eCancel').onclick = closeModal;
    document.getElementById('eSave').onclick = async function () {
      var title = document.getElementById('eTitle').value.trim();
      if (!title) return toast('Add a title');
      var x = await sb.from('stream_videos').update({ title: title, description: document.getElementById('eDesc').value.trim(), category: document.getElementById('eCat').value }).eq('id', v.id);
      if (x.error) return toast('Could not save changes');
      closeModal(); toast('Changes saved'); route();
    };
  }
  function confirmDelete(v) {
    modal('<h2>Delete this video?</h2><p>"' + esc(v.title) + '" and its comments and likes will be removed for good.</p>' +
      '<div class="acts"><button class="btn" id="dCancel">Keep it</button><button class="btn danger" id="dGo">Delete video</button></div>');
    document.getElementById('dCancel').onclick = closeModal;
    document.getElementById('dGo').onclick = async function () {
      var x = await sb.from('stream_videos').delete().eq('id', v.id);
      if (x.error) return toast('Could not delete video');
      await sb.storage.from(BUCKET).remove([v.video_path].concat(v.thumb_path ? [v.thumb_path] : []));
      closeModal(); toast('Video deleted'); route();
    };
  }

  /* ---------- settings ---------- */
  function vSettings() {
    if (needAuth()) return;
    document.title = 'Channel settings / HSW365 Stream';
    var p = S.profile;
    if (!p) { view.innerHTML = emptyBlock('Setting up your channel', 'Reload in a moment.'); return; }
    view.innerHTML = '<div class="page-head"><h1>Channel settings</h1></div><form class="form" id="sf">' +
      '<div class="field"><label>Channel picture</label><div class="thumbrow" style="margin:0"><span id="avPrev">' + avatar(p, 84) + '</span><button class="btn sm" type="button" id="avPick">Change picture</button><input type="file" id="avIn" accept="image/jpeg,image/png,image/webp" hidden></div></div>' +
      '<div class="field"><label for="sName">Channel name</label><input type="text" id="sName" maxlength="50" required value="' + esc(p.display_name) + '"></div>' +
      '<div class="field"><label for="sHandle">Handle</label><input type="text" id="sHandle" maxlength="24" required pattern="[a-z0-9_]{3,24}" value="' + esc(p.handle) + '"><div class="hint">3 to 24 characters: lowercase letters, numbers, underscore. Changing it changes your channel link.</div></div>' +
      '<div class="field"><label for="sBio">About</label><textarea id="sBio" maxlength="500" rows="4">' + esc(p.bio) + '</textarea></div>' +
      '<p class="err" id="sErr"></p><button class="btn primary">Save changes</button>' +
      '<p class="hint stat" style="margin-top:22px">Signed in as ' + esc(S.user.email) + (p.is_admin ? ' / owner account, full access' : '') + '</p></form>';
    var newAvatar = null, avIn = document.getElementById('avIn');
    document.getElementById('avPick').onclick = function () { avIn.click(); };
    avIn.onchange = function () {
      if (!avIn.files[0]) return;
      resizeImage(avIn.files[0], 320).then(function (b) {
        newAvatar = b;
        document.getElementById('avPrev').innerHTML = '<img class="avatar" style="width:84px;height:84px" src="' + URL.createObjectURL(b) + '" alt="">';
      }).catch(function (e) { toast(e.message); });
    };
    document.getElementById('sf').onsubmit = async function (e) {
      e.preventDefault();
      var err = document.getElementById('sErr'); err.textContent = '';
      var patch = { display_name: document.getElementById('sName').value.trim(), handle: document.getElementById('sHandle').value.trim().toLowerCase(), bio: document.getElementById('sBio').value.trim() };
      if (!/^[a-z0-9_]{3,24}$/.test(patch.handle)) { err.textContent = 'Handle must be 3 to 24 characters: lowercase letters, numbers, underscore.'; return; }
      if (newAvatar) {
        var path = S.user.id + '/a/' + Date.now() + '.jpg';
        var up = await sb.storage.from(BUCKET).upload(path, newAvatar, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (up.error) { err.textContent = 'Could not upload the picture.'; return; }
        if (p.avatar_path) sb.storage.from(BUCKET).remove([p.avatar_path]);
        patch.avatar_path = path;
      }
      var x = await sb.from('stream_profiles').update(patch).eq('id', S.user.id).select('*').single();
      if (x.error) { err.textContent = x.error.code === '23505' ? 'That handle is taken. Pick another.' : 'Could not save changes.'; return; }
      S.profile = x.data; renderChrome(); toast('Changes saved');
    };
  }

  /* ---------- moderation ---------- */
  async function vAdmin() {
    if (needAuth()) return;
    if (!S.profile || !S.profile.is_admin) return go('#/');
    document.title = 'Moderation / HSW365 Stream';
    var token = routeToken;
    var r = await sb.from('stream_reports').select('*,video:stream_videos!stream_reports_video_id_fkey(id,title,thumb_path,duration,is_hidden,video_path,owner_id),reporter:stream_profiles!stream_reports_reporter_id_fkey(handle,display_name)').eq('resolved', false).order('created_at', { ascending: false });
    var st = await Promise.all([
      sb.from('stream_videos').select('id', { count: 'exact', head: true }),
      sb.from('stream_profiles').select('id', { count: 'exact', head: true })
    ]);
    if (token !== routeToken) return;
    if (r.error) return fail(r.error);
    var head = '<div class="page-head"><div><h1>Moderation</h1><p>' + count(st[1].count) + ' channels / ' + count(st[0].count) + ' videos / ' + plural(r.data.length, 'open report') + '</p></div></div>';
    if (!r.data.length) { view.innerHTML = head + emptyBlock('No open reports', 'Reports from viewers show up here.'); return; }
    view.innerHTML = head + '<div class="list">' + r.data.map(function (x) {
      var v = x.video || { id: '', title: 'Deleted video' };
      return '<div class="item">' + (x.video ? thumb(v) : '<span></span>') + '<div><a class="t" href="#/watch/' + v.id + '">' + esc(v.title) + '</a>' +
        '<div style="margin:4px 0;white-space:pre-wrap;overflow-wrap:anywhere">' + esc(x.reason) + '</div><div class="stat">@' + esc(x.reporter ? x.reporter.handle : '?') + ' / ' + ago(x.created_at) + '</div></div>' +
        '<div class="acts"><button class="btn sm" data-a="resolve" data-r="' + x.id + '">Dismiss</button>' +
        (x.video ? '<button class="btn sm" data-a="hide" data-r="' + x.id + '">' + (v.is_hidden ? 'Unhide' : 'Hide') + '</button><button class="btn sm danger" data-a="del" data-r="' + x.id + '">Delete video</button>' : '') + '</div></div>';
    }).join('') + '</div>';
    view.onclick = async function (e) {
      var a = e.target.getAttribute('data-a'), rid = e.target.getAttribute('data-r');
      if (!a) return;
      var rep = r.data.filter(function (x) { return x.id === rid; })[0];
      if (!rep) return;
      var res;
      if (a === 'resolve') res = await sb.rpc('stream_resolve_report', { p_report: rid });
      if (a === 'hide') res = await sb.rpc('stream_set_hidden', { p_video: rep.video.id, p_hidden: !rep.video.is_hidden });
      if (a === 'del') {
        if (!confirm('Delete "' + rep.video.title + '" for good?')) return;
        res = await sb.from('stream_videos').delete().eq('id', rep.video.id);
        if (!res.error) await sb.storage.from(BUCKET).remove([rep.video.video_path].concat(rep.video.thumb_path ? [rep.video.thumb_path] : []));
      }
      toast(res && res.error ? 'Action failed' : 'Done'); route();
    };
  }

  /* ---------- auth ---------- */
  function afterAuth() {
    var next = sessionStorage.getItem('hsw-next') || '#/';
    sessionStorage.removeItem('hsw-next');
    go(/^#\/(login|signup)/.test(next) ? '#/' : next);
  }
  function vLogin() {
    if (S.user) return go('#/');
    document.title = 'Sign in / HSW365 Stream';
    view.innerHTML = '<div class="auth"><h1>Sign in</h1><p>Welcome back to HSW365 Stream.</p><form id="lf">' +
      '<div class="field"><label for="lEmail">Email</label><input type="email" id="lEmail" autocomplete="email" required></div>' +
      '<div class="field"><label for="lPass">Password</label><input type="password" id="lPass" autocomplete="current-password" required></div>' +
      '<p class="err" id="lErr"></p><button class="btn primary" style="width:100%">Sign in</button></form>' +
      '<p class="alt">New here? <a href="#/signup">Create a channel</a></p><p class="alt">Locked out? Email <a href="mailto:' + CONTACT + '">' + CONTACT + '</a>.</p></div>';
    document.getElementById('lf').onsubmit = async function (e) {
      e.preventDefault();
      var err = document.getElementById('lErr'), b = e.target.querySelector('button');
      err.textContent = ''; b.disabled = true;
      var x = await sb.auth.signInWithPassword({ email: document.getElementById('lEmail').value.trim(), password: document.getElementById('lPass').value });
      b.disabled = false;
      if (x.error) { err.textContent = /confirm/i.test(x.error.message) ? 'Confirm your email first. Check your inbox for the link.' : 'Wrong email or password.'; return; }
      await loadProfile(x.data.user); afterAuth();
    };
  }
  function vSignup() {
    if (S.user) return go('#/');
    document.title = 'Create a channel / HSW365 Stream';
    view.innerHTML = '<div class="auth"><h1>Create a channel</h1><p>Free to join. Upload, comment and subscribe.</p><form id="gf">' +
      '<div class="field"><label for="gName">Channel name</label><input type="text" id="gName" maxlength="50" required autocomplete="name"></div>' +
      '<div class="field"><label for="gHandle">Handle</label><input type="text" id="gHandle" maxlength="24" required autocapitalize="none" placeholder="yourname"><div class="hint">Your channel link. Lowercase letters, numbers, underscore.</div></div>' +
      '<div class="field"><label for="gEmail">Email</label><input type="email" id="gEmail" autocomplete="email" required></div>' +
      '<div class="field"><label for="gPass">Password</label><input type="password" id="gPass" minlength="8" maxlength="72" autocomplete="new-password" required><div class="hint">At least 8 characters.</div></div>' +
      '<input class="hp" type="text" id="gSite" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="err" id="gErr"></p><button class="btn primary" style="width:100%">Create channel</button></form>' +
      '<p class="alt">By joining you agree to the <a href="#/legal">terms and rules</a>.</p><p class="alt">Have an account? <a href="#/login">Sign in</a></p></div>';
    var nameEl = document.getElementById('gName'), handleEl = document.getElementById('gHandle'), touched = false;
    handleEl.oninput = function () { touched = true; handleEl.value = handleEl.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); };
    nameEl.oninput = function () { if (!touched) handleEl.value = nameEl.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24); };
    document.getElementById('gf').onsubmit = async function (e) {
      e.preventDefault();
      var err = document.getElementById('gErr'), b = e.target.querySelector('button');
      var body = { email: document.getElementById('gEmail').value.trim(), password: document.getElementById('gPass').value, handle: handleEl.value.trim(), display_name: nameEl.value.trim(), website: document.getElementById('gSite').value };
      err.textContent = '';
      if (!/^[a-z0-9_]{3,24}$/.test(body.handle)) { err.textContent = 'Handle must be 3 to 24 characters: lowercase letters, numbers, underscore.'; return; }
      b.disabled = true; b.textContent = 'Creating';
      try {
        var res = await fetch(SB_URL + '/functions/v1/stream-signup', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }, body: JSON.stringify(body) });
        var j = await res.json();
        if (j.owner) {
          // owner addresses must confirm by email before they get full access
          var su = await sb.auth.signUp({ email: body.email, password: body.password, options: { data: { handle: body.handle, display_name: body.display_name }, emailRedirectTo: location.origin + location.pathname } });
          if (su.error) throw su.error;
          view.innerHTML = '<div class="auth"><h1>Check your email</h1><p>We sent a confirmation link to ' + esc(body.email) + '. Open it, then sign in. Owner accounts get full access once the email is confirmed.</p><a class="btn primary" href="#/login">Sign in</a></div>';
          return;
        }
        if (!res.ok || j.error) throw new Error(j.error || 'Could not create the account.');
        var si = await sb.auth.signInWithPassword({ email: body.email, password: body.password });
        if (si.error) throw si.error;
        await loadProfile(si.data.user, body.handle, body.display_name);
        toast('Channel created'); afterAuth();
      } catch (ex) {
        err.textContent = ex.message || 'Could not create the account.';
        b.disabled = false; b.textContent = 'Create channel';
      }
    };
  }

  /* ---------- legal ---------- */
  function vLegal() {
    document.title = 'Terms, rules and copyright / HSW365 Stream';
    var m = '<a class="link" href="mailto:' + CONTACT + '">' + CONTACT + '</a>';
    view.innerHTML = '<div class="legal"><div class="page-head"><div><h1>Terms, rules and copyright</h1><p>HSW365 Stream is operated by HSW365 Media LLC.</p></div></div>' +
      '<h2>Using HSW365 Stream</h2><p>You must be at least 13 years old to create a channel. You are responsible for your account and for everything posted from it. The service is provided as is, without warranties, and may change or be interrupted at any time.</p>' +
      '<h2>Your videos</h2><p>You keep ownership of what you upload. By uploading you give HSW365 Media LLC a non-exclusive license to host, stream and display your video on the service. You can delete your videos at any time, which ends that license.</p>' +
      '<h2>Community rules</h2><ul><li>Only upload video you made or have the rights to.</li><li>No sexual content involving minors, and no content that sexualizes minors in any way.</li><li>No threats, harassment, doxxing or content that promotes violence against people.</li><li>No spam, scams, malware or impersonation.</li><li>No content that is illegal where you live or in the United States.</li></ul><p>Videos and channels that break these rules can be hidden or removed, and accounts can be closed. Use the Report button on any video to flag it.</p>' +
      '<h2>Copyright</h2><p>If your copyrighted work was posted without permission, email ' + m + ' with: the link to the video, a description of your work, your contact details, a statement that you have a good-faith belief the use is not authorized, a statement under penalty of perjury that your notice is accurate and that you are the owner or authorized to act for the owner, and your signature. We remove infringing videos and close the accounts of repeat infringers.</p>' +
      '<h2>Privacy</h2><p>We store your email address, channel details and the content you post. We do not sell personal information. Videos, comments and channel pages are public. To delete your account and data, email ' + m + '.</p>' +
      '<h2>Contact</h2><p>' + m + '</p></div>';
  }

  /* ---------- router ---------- */
  function route() {
    var h = location.hash || '#/';
    if (h.indexOf('#/') !== 0) { if (!S.ready) return; h = '#/'; }
    var parts = h.slice(2).split('/').map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
    routeToken++;
    view.onclick = null;
    closeModal(); busy(false);
    renderChrome();
    window.scrollTo(0, 0);
    var p = parts[0], a = parts.slice(1).join('/');
    if (p !== 'search') document.getElementById('searchInput').value = '';
    var fn = { '': vHome, trending: vTrending, subs: vSubs, liked: vLiked, upload: vUpload, studio: vStudio, settings: vSettings, admin: vAdmin, login: vLogin, signup: vSignup, legal: vLegal }[p];
    var out;
    if (fn) out = fn();
    else if (p === 'watch' && a) out = vWatch(a);
    else if (p === 'c' && a) out = vChannel(a);
    else if (p === 'cat' && a) out = vCat(a);
    else if (p === 'search' && a) out = vSearch(a);
    else out = vHome();
    if (out && out.catch) out.catch(fail);
  }
  window.addEventListener('hashchange', route);

  /* ---------- session ---------- */
  var profileJob = null, profileFor = null;
  function loadProfile(user, handle, name) {
    S.user = user || null;
    if (!user) { S.profile = null; profileJob = null; profileFor = null; return Promise.resolve(); }
    if (profileJob && profileFor === user.id) return profileJob; // one request per user, shared by all callers
    profileFor = user.id;
    profileJob = sb.rpc('stream_ensure_profile', { p_handle: handle || null, p_name: name || null }).then(function (r) {
      if (r.error) { console.error(r.error); profileJob = null; S.profile = null; return; }
      S.profile = r.data;
    });
    return profileJob;
  }
  sb.auth.onAuthStateChange(function (event, session) {
    // never await Supabase calls inside this callback
    setTimeout(async function () {
      var u = session ? session.user : null;
      if (event === 'SIGNED_OUT') { S.user = null; S.profile = null; if (S.ready) renderChrome(); return; }
      if (u && (!S.user || S.user.id !== u.id)) { await loadProfile(u); if (S.ready) route(); }
    }, 0);
  });
  (async function init() {
    try {
      var s = await sb.auth.getSession();
      if (s.data.session) await loadProfile(s.data.session.user);
    } catch (e) { console.error(e); }
    S.ready = true;
    if ((location.hash || '').indexOf('#/') !== 0 && location.hash) history.replaceState(null, '', location.pathname + '#/');
    route();
  })();
})();
