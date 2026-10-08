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

  var S = { user: null, profile: null, access: null, ready: false };
  var teardown = null; // set by a view that holds timers, media or channels; runs when the route changes
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
      shield: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/>',
      live: '<circle cx="12" cy="12" r="2.500" fill="currentColor" stroke="none"/><path d="M7.800 16.200a6 6 0 0 1 0-8.400M16.200 7.800a6 6 0 0 1 0 8.400M4.900 19.100a10 10 0 0 1 0-14.200M19.100 4.900a10 10 0 0 1 0 14.200"/>',
      mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
      cam: '<rect x="3" y="6" width="13" height="12" rx="1"/><path d="M16 10.500l5-3v9l-5-3z"/>',
      screen: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/>'
    }[name] || '';
    size = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }
  var CHECK = '<svg class="check" viewBox="0 0 24 24" width="15" height="15" aria-label="Verified"><path fill="currentColor" d="M12 2l2.400 2.200 3.200-.400.800 3.100 2.800 1.600-1.300 3 1.300 3-2.800 1.600-.800 3.100-3.200-.400L12 22l-2.400-2.200-3.200.400-.800-3.100-2.800-1.600 1.300-3-1.300-3 2.800-1.600.800-3.100 3.200.400z"/><path d="M8.500 12.200l2.400 2.400 4.600-5" fill="none" stroke="#0a0a0f" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var VCHECK = CHECK;

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
      ['#/', 'home', 'Home'], ['#/live', 'live', 'Live'], ['#/trending', 'fire', 'Trending'], ['#/subs', 'subs', 'Subscriptions'],
      ['#/liked', 'heart', 'Liked'], ['#/studio', 'film', 'Your videos']
    ];
    if (S.profile && S.profile.is_admin) links.push(['#/admin', 'shield', 'Owner panel']);
    function act(x) { return (x === '#/' ? (h === '#/' || h === '') : x === '#/live' ? (h === '#/live' || h.indexOf('#/live/') === 0 || h === '#/golive') : h.indexOf(x) === 0) ? ' class="active"' : ''; }
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
      '<a href="#/live"' + act('#/live') + '>' + icon('live') + 'Live</a>' +
      '<a href="#/upload"' + act('#/upload') + '>' + icon('up') + 'Upload</a>' +
      '<a href="#/subs"' + act('#/subs') + '>' + icon('subs') + 'Subs</a>' +
      '<a href="' + you + '"' + (h === you ? ' class="active"' : '') + '>' + icon('user') + 'You</a>';

    var ta = document.getElementById('topActions');
    if (!S.user) {
      ta.innerHTML = '<a class="btn golive hide-m" href="#/golive">' + icon('live', 16) + 'Go live</a><a class="btn hide-m" href="#/upload">' + icon('up', 16) + 'Upload</a><a class="btn primary" href="#/login">Sign in</a>';
    } else {
      var p = S.profile || { display_name: S.user.email, handle: '' };
      var ac = S.access, pill = '';
      if (ac && ac.paywall && !ac.owner && !ac.is_member) pill = '<a class="pill hide-m' + (ac.on_trial ? '' : ' warn') + '" href="#/membership">' + (ac.on_trial ? 'Free trial / ' + daysLeft(ac.trial_ends) + 'd left' : 'Trial ended') + '</a>';
      ta.innerHTML = pill + '<a class="btn golive hide-m" href="#/golive">' + icon('live', 16) + 'Go live</a><a class="btn primary hide-m" href="#/upload">' + icon('up', 16) + 'Upload</a>' +
        '<div class="menu-wrap"><button class="avatar-btn" id="avBtn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' + avatar(p, 38) + '</button>' +
        '<div class="menu" id="avMenu" hidden><div class="who"><b>' + nameOf(p) + '</b><span>@' + esc(p.handle) + '</span></div>' +
        '<a href="#/c/' + esc(p.handle) + '">Your channel</a><a href="#/golive">Go live</a><a href="#/studio">Your videos</a><a href="#/membership">Membership</a><a href="#/settings">Channel settings</a>' +
        (p.is_admin ? '<a href="#/admin">Owner panel</a>' : '') +
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
    return '<div class="chips"><a href="#/"' + (active === 'home' ? ' class="active"' : '') + '>All</a><a href="#/live"' + (active === 'live' ? ' class="active"' : '') + '>Live</a><a href="#/trending"' + (active === 'trending' ? ' class="active"' : '') + '>Trending</a>' +
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

  async function vHome() {
    document.title = 'HSW365 Stream';
    var token = routeToken, lives = await fetchLives(4);
    if (token !== routeToken) return;
    var strip = lives.length ? '<section class="live-strip"><div class="page-head"><h2><i class="pulse"></i>Live now</h2><a class="btn sm" href="#/live">All live streams</a></div><div class="grid">' + lives.map(liveCard).join('') + '</div></section>' : '';
    return feed({
      head: chips('home') + strip, feature: true,
      empty: emptyBlock('Nothing on air yet', 'This is a new platform. Go live or post the first video and you lead the home page.', '<div class="acts center"><a class="btn golive" href="#/golive">' + icon('live', 16) + 'Go live</a>' + uploadCta + '</div>'),
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
        if (needMember()) return;
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
    var lv = await sb.from('stream_live_now').select('id,title,viewers').eq('owner_id', p.id).maybeSingle();
    if (token !== routeToken) return;
    var head = (lv.data ? '<a class="onair" href="#/live/' + lv.data.id + '"><span class="live-badge">Live</span><b>' + esc(lv.data.title) + '</b><span class="stat">' + count(lv.data.viewers) + ' watching</span><span class="btn sm primary">Watch</span></a>' : '') +
      '<section class="chead">' + avatar(p, 112) + '<div class="info"><h1>' + nameOf(p) + '</h1>' +
      '<span class="stat">@' + esc(p.handle) + ' / <span id="chSubs">' + plural(p.subs_count, 'subscriber') + '</span> / joined ' + ago(p.created_at) + '</span>' +
      (p.bio ? '<p class="bio">' + esc(p.bio) + '</p>' : '') + '</div>' +
      (mine ? '<div class="acts"><a class="btn" href="#/settings">Edit channel</a><a class="btn golive" href="#/golive">' + icon('live', 16) + 'Go live</a><a class="btn primary" href="#/upload">Upload</a></div>'
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
    if (needMember()) return;
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

  /* ---------- owner panel: moderation, members, pricing switch ---------- */
  async function vAdmin() {
    if (needAuth()) return;
    if (!S.profile || !S.profile.is_admin) return go('#/');
    document.title = 'Owner panel / HSW365 Stream';
    var token = routeToken;
    busy(true);
    var res = await Promise.all([
      sb.from('stream_reports').select('*,video:stream_videos!stream_reports_video_id_fkey(id,title,thumb_path,duration,is_hidden,video_path,owner_id),live:stream_lives!stream_reports_live_id_fkey(id,title,status),reporter:stream_profiles!stream_reports_reporter_id_fkey(handle,display_name)').eq('resolved', false).order('created_at', { ascending: false }),
      sb.from('stream_videos').select('id', { count: 'exact', head: true }),
      sb.from('stream_members').select('*,profile:stream_profiles!stream_members_id_fkey(handle,display_name,is_verified,is_admin)').order('created_at', { ascending: false }).limit(500),
      loadAccess()
    ]);
    busy(false);
    if (token !== routeToken) return;
    var r = res[0], mem = res[2];
    if (r.error) return fail(r.error);
    if (mem.error) return fail(mem.error);
    var members = mem.data, pay = !S.access || S.access.paywall, now = Date.now();
    var paying = members.filter(function (m) { return m.member_until && new Date(m.member_until).getTime() > now; }).length;

    var html = '<div class="page-head"><div><h1>Owner panel</h1><p>' + plural(members.length, 'channel') + ' / ' + plural(paying, 'paid member') + ' / ' + count(res[1].count) + ' videos / ' + plural(r.data.length, 'open report') + '</p></div></div>' +
      '<section class="switch"><div><h2>Creator membership: ' + (pay ? 'on' : 'off') + '</h2><p>' +
      (pay ? 'New channels get 7 free days, then need the $7 a month membership to go live, upload and chat. Watching is free.' : 'Everything is free for everyone. Only the $10 a month verified checkmark is sold.') +
      '</p></div><button class="btn" id="payTog">' + (pay ? 'Make everything free' : 'Turn the $7 membership on') + '</button></section>';

    html += '<h2 class="sec">Reports</h2>';
    html += r.data.length ? '<div class="list">' + r.data.map(function (x) {
      var v = x.video || { id: '', title: x.live ? 'Live stream: ' + x.live.title : 'Deleted video' };
      return '<div class="item">' + (x.video ? thumb(v) : '<span></span>') + '<div><a class="t" href="' + (x.live ? '#/live/' + x.live.id : '#/watch/' + v.id) + '">' + esc(v.title) + '</a>' +
        '<div style="margin:4px 0;white-space:pre-wrap;overflow-wrap:anywhere">' + esc(x.reason) + '</div><div class="stat">@' + esc(x.reporter ? x.reporter.handle : '?') + ' / ' + ago(x.created_at) + '</div></div>' +
        '<div class="acts"><button class="btn sm" data-a="resolve" data-r="' + x.id + '">Dismiss</button>' +
        (x.live && x.live.status === 'live' ? '<button class="btn sm danger" data-a="endlive" data-r="' + x.id + '">End stream</button>' : '') +
        (x.video ? '<button class="btn sm" data-a="hide" data-r="' + x.id + '">' + (v.is_hidden ? 'Unhide' : 'Hide') + '</button><button class="btn sm danger" data-a="del" data-r="' + x.id + '">Delete video</button>' : '') + '</div></div>';
    }).join('') + '</div>' : '<p class="stat">No open reports.</p>';

    html += '<h2 class="sec">Members</h2><p class="stat" style="margin-bottom:12px">Everyone who signed up, newest first. Phone numbers and emails are only visible here.</p>' +
      '<div class="members">' + members.map(function (m) {
        var p = m.profile || {}, st;
        if (p.is_admin) st = '<span class="pill ok">Owner</span>';
        else if (m.member_until && new Date(m.member_until).getTime() > now) st = '<span class="pill ok">Paid to ' + dateOf(m.member_until) + '</span>';
        else if (new Date(m.trial_ends).getTime() > now) st = '<span class="pill">Trial / ' + daysLeft(m.trial_ends) + 'd</span>';
        else st = '<span class="pill warn">Trial ended</span>';
        return '<div class="member"><div><a class="t" href="#/c/' + esc(p.handle) + '">' + nameOf({ display_name: m.full_name || p.display_name, is_verified: p.is_verified }) + '</a><div class="stat">@' + esc(p.handle) + ' / joined ' + ago(m.created_at) + '</div></div>' +
          '<div class="contact">' + (m.email ? '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>' : '') + (m.phone ? '<a href="tel:' + esc(m.phone) + '">' + esc(m.phone) + '</a>' : '<span class="stat">no phone</span>') + '</div>' +
          '<div>' + st + '</div>' +
          (p.is_admin ? '<div></div>' : '<div class="acts"><button class="btn sm" data-m="add" data-u="' + m.id + '">+30 days</button>' +
            (m.member_until ? '<button class="btn sm" data-m="clear" data-u="' + m.id + '">Remove paid</button>' : '') +
            '<button class="btn sm' + (p.is_verified ? '' : ' verify') + '" data-m="' + (p.is_verified ? 'unverify' : 'verify') + '" data-u="' + m.id + '">' + (p.is_verified ? 'Unverify' : 'Verify') + '</button></div>') + '</div>';
      }).join('') + '</div>';
    view.innerHTML = html;

    document.getElementById('payTog').onclick = async function () {
      if (!confirm(pay ? 'Make going live, uploading and chatting free for everyone?' : 'Require the $7 a month membership after the 7-day trial?')) return;
      var x = await sb.rpc('stream_set_paywall', { p_on: !pay });
      toast(x.error ? 'Could not change it' : 'Saved'); route();
    };
    view.onclick = async function (e) {
      var t = e.target.closest ? e.target.closest('button') : null;
      if (!t) return;
      var a = t.getAttribute('data-a'), rid = t.getAttribute('data-r'), m = t.getAttribute('data-m'), uid = t.getAttribute('data-u'), out;
      if (m) {
        if (m === 'add') out = await sb.rpc('stream_admin_grant', { p_user: uid, p_days: 30 });
        if (m === 'clear') out = await sb.rpc('stream_admin_grant', { p_user: uid, p_days: 0 });
        if (m === 'verify') out = await sb.rpc('stream_admin_grant', { p_user: uid, p_verified: true });
        if (m === 'unverify') out = await sb.rpc('stream_admin_grant', { p_user: uid, p_verified: false });
        toast(out && out.error ? 'Action failed' : 'Done'); return route();
      }
      if (!a) return;
      var rep = r.data.filter(function (x) { return x.id === rid; })[0];
      if (!rep) return;
      if (a === 'resolve') out = await sb.rpc('stream_resolve_report', { p_report: rid });
      if (a === 'endlive') out = await sb.rpc('stream_end_live', { p_live: rep.live.id });
      if (a === 'hide') out = await sb.rpc('stream_set_hidden', { p_video: rep.video.id, p_hidden: !rep.video.is_hidden });
      if (a === 'del') {
        if (!confirm('Delete "' + rep.video.title + '" for good?')) return;
        out = await sb.from('stream_videos').delete().eq('id', rep.video.id);
        if (!out.error) await sb.storage.from(BUCKET).remove([rep.video.video_path].concat(rep.video.thumb_path ? [rep.video.thumb_path] : []));
      }
      toast(out && out.error ? 'Action failed' : 'Done'); route();
    };
  }

  /* ---------- membership ---------- */
  // Watching is free. Going live, uploading, commenting and chatting need an active
  // 7-day trial or a paid membership while the paywall is on. The server enforces this;
  // these checks only route people to the right page.
  function loadAccess() {
    if (!S.user) { S.access = null; return Promise.resolve(); }
    return sb.rpc('stream_access').then(function (r) { S.access = r.error ? null : r.data; });
  }
  function needMember() {
    if (!S.access || S.access.can_post) return false;
    toast('Your free week is over. Membership keeps you posting.');
    go('#/membership');
    return true;
  }
  function daysLeft(iso) { return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)); }
  function dateOf(iso) { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  async function billing(body) {
    var sess = (await sb.auth.getSession()).data.session;
    if (!sess) { needAuth(); return null; }
    body.return_url = location.origin + location.pathname;
    try {
      var res = await fetch(SB_URL + '/functions/v1/stream-billing', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: 'Bearer ' + sess.access_token }, body: JSON.stringify(body) });
      var j = await res.json();
      if (j.url) { location.href = j.url; return j; }
      return j;
    } catch (e) { return { error: 'Connection problem. Try again.' }; }
  }
  function payFallback(what, amount) {
    var h = S.profile ? '@' + S.profile.handle : 'your handle';
    modal('<h2>' + what + '</h2><p>Card checkout is not switched on yet. You can pay <b>' + amount + '</b> by Cash App to <b>$hsw365</b>. Put <b>' + esc(h) + '</b> in the note so we know which channel to switch on.</p>' +
      '<p class="stat">Your account is updated once the payment is confirmed. Questions: ' + CONTACT + '</p>' +
      '<div class="acts"><a class="btn" href="mailto:' + CONTACT + '">Email us</a><button class="btn primary" id="pfOk">Got it</button></div>');
    document.getElementById('pfOk').onclick = closeModal;
  }
  async function vMembership(sub) {
    if (needAuth()) return;
    document.title = 'Membership / HSW365 Stream';
    var token = routeToken;
    busy(true); await loadAccess(); busy(false);
    if (token !== routeToken) return;
    var a = S.access || {};
    if (sub === 'thanks') {
      view.innerHTML = '<div class="auth"><h1>Payment received</h1><p id="thMsg">Updating your account. This takes a few seconds.</p><a class="btn primary" href="#/membership">View membership</a></div>';
      var tries = 0, before = JSON.stringify([a.is_member, a.verified]);
      var poll = setInterval(async function () {
        tries++;
        await loadAccess();
        var now = S.access || {};
        if (JSON.stringify([now.is_member, now.verified]) !== before || tries > 10) {
          clearInterval(poll);
          if (token !== routeToken) return;
          if (S.profile) S.profile.is_verified = !!now.verified;
          renderChrome();
          var el = document.getElementById('thMsg');
          if (el) el.textContent = tries > 10 ? 'Your payment went through. If your account does not update within a few minutes, email ' + CONTACT + '.' : 'You are all set. Thank you for backing HSW365 Stream.';
        }
      }, 2000);
      teardown = function () { clearInterval(poll); };
      return;
    }
    var mState, mBtn = '';
    if (a.owner) mState = '<span class="pill ok">Owner account / full access</span>';
    else if (!a.paywall) mState = '<span class="pill ok">Free for everyone right now</span>';
    else if (a.is_member) { mState = '<span class="pill ok">Active / renews ' + dateOf(a.member_until) + '</span>'; mBtn = a.has_billing ? '<button class="btn" id="mManage">Manage or cancel</button>' : ''; }
    else if (a.on_trial) { mState = '<span class="pill">Free trial / ' + daysLeft(a.trial_ends) + ' days left</span>'; mBtn = '<button class="btn primary" id="mJoin">Start membership</button>'; }
    else { mState = '<span class="pill warn">Free trial ended</span>'; mBtn = '<button class="btn primary" id="mJoin">Start membership</button>'; }
    var vState = a.verified ? '<span class="pill ok">Verified</span>' : '<span class="pill">Not verified</span>';
    view.innerHTML = '<div class="page-head"><div><h1>Membership</h1><p>Watching is always free. Membership is for people who go live, upload and chat.</p></div></div>' +
      '<div class="plans"><section class="plan"><span class="feature-tag">Creator membership</span><div class="price"><b>$7</b><span>per month</span></div>' + mState +
      '<ul><li>Go live from your camera or screen</li><li>Upload videos to your channel</li><li>Live chat and comments</li><li>First 7 days free, no card needed</li><li>Cancel any time</li></ul>' + mBtn + '</section>' +
      '<section class="plan v"><span class="feature-tag">Verified</span><div class="price"><b>$10</b><span>per month</span></div>' + vState +
      '<ul><li>Green checkmark next to your name' + VCHECK + '</li><li>Shows on your channel, videos, streams and chat</li><li>Stays on while you subscribe. Cancel any time</li></ul>' +
      (a.verified ? (a.has_billing && !a.owner ? '<button class="btn" id="vManage">Manage or cancel</button>' : '') : '<button class="btn verify" id="vBuy">Get verified</button>') + '</section></div>' +
      '<p class="hint stat" style="margin-top:22px">Payments are handled by Stripe. Billing questions: <a class="link" href="mailto:' + CONTACT + '">' + CONTACT + '</a></p>';
    function wire(id, body, label, amount) {
      var b = document.getElementById(id);
      if (!b) return;
      b.onclick = async function () {
        b.disabled = true;
        var j = await billing(body);
        b.disabled = false;
        if (!j || j.url) return;
        if (j.error === 'not_configured') return payFallback(label, amount);
        toast(j.error || 'Could not open checkout');
      };
    }
    wire('mJoin', { a: 'checkout', kind: 'member' }, 'Start membership', '$7 for the month');
    wire('vBuy', { a: 'checkout', kind: 'verify' }, 'Get verified', '$10 for the month');
    wire('vManage', { a: 'portal' }, 'Manage verification', '');
    wire('mManage', { a: 'portal' }, 'Manage membership', '');
  }

  /* ---------- live ---------- */
  // Live video goes straight from the broadcaster's browser to each viewer (WebRTC).
  // Supabase Realtime carries the handshake, the viewer count and the chat.
  var ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
  var MAX_PEERS = 25;
  var LIVE_SEL = '*,owner:stream_profiles!stream_lives_owner_id_fkey(id,handle,display_name,avatar_path,is_verified,subs_count)';

  function fetchLives(limit) {
    return sb.from('stream_live_now').select('*').order('viewers', { ascending: false }).order('started_at', { ascending: false }).limit(limit || 48)
      .then(function (r) { return r.error ? [] : r.data; });
  }
  function liveCard(l) {
    var inner = l.thumb_path ? '<img src="' + esc(pub(l.thumb_path)) + '" alt="" loading="lazy">' : '<span class="ph">' + esc(l.title.slice(0, 40)) + '</span>';
    return '<article class="card"><a class="thumb" href="#/live/' + l.id + '" aria-label="' + esc(l.title) + '">' + inner +
      '<span class="live-badge">Live</span><span class="dur">' + count(l.viewers) + ' watching</span></a>' +
      '<div class="card-meta"><a href="#/c/' + esc(l.handle) + '" aria-label="' + esc(l.display_name) + '">' + avatar(l, 36) + '</a>' +
      '<div><a class="t" href="#/live/' + l.id + '">' + esc(l.title) + '</a>' +
      '<div class="s"><a href="#/c/' + esc(l.handle) + '">' + nameOf(l) + '</a></div>' +
      '<div class="stat">' + esc(l.category) + ' / started ' + ago(l.started_at) + '</div></div></div></article>';
  }
  function waitIce(pc) {
    return new Promise(function (resolve) {
      if (pc.iceGatheringState === 'complete') return resolve();
      var done = false, fin = function () { if (!done) { done = true; resolve(); } };
      pc.addEventListener('icegatheringstatechange', function () { if (pc.iceGatheringState === 'complete') fin(); });
      setTimeout(fin, 2500);
    });
  }
  function sig(ch, payload) { return ch.send({ type: 'broadcast', event: 'sig', payload: payload }); }
  function roles(ch) {
    var st = ch.presenceState(), viewers = 0, host = false, keys = {};
    Object.keys(st).forEach(function (k) {
      var m = st[k] && st[k][0];
      if (!m) return;
      keys[k] = true;
      if (m.role === 'host') host = true; else viewers++;
    });
    return { viewers: viewers, host: host, keys: keys };
  }
  function clock(from) {
    var s = Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  }

  // Chat panel. Register on the channel before it is subscribed.
  function mountChat(el, ch, live, token) {
    el.innerHTML = '<div class="chat-head"><h2>Live chat</h2></div><div class="chat-log" id="chatLog" aria-live="polite"></div><div class="chat-form" id="chatForm"></div>';
    var log = document.getElementById('chatLog'), people = {}, queue = Promise.resolve();
    if (S.profile) people[S.user.id] = S.profile;
    var canMod = S.user && (S.user.id === live.owner_id || (S.profile && S.profile.is_admin));
    function line(m) {
      if (log.querySelector('[data-id="' + m.id + '"]')) return;
      var a = people[m.user_id] || { display_name: 'Viewer', handle: '' };
      var e0 = log.querySelector('.chat-empty'); if (e0) e0.remove();
      var stick = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
      var d = document.createElement('div');
      d.className = 'chat-msg'; d.setAttribute('data-id', m.id);
      d.innerHTML = '<a class="who' + (m.user_id === live.owner_id ? ' host' : '') + '" href="#/c/' + esc(a.handle) + '">' + nameOf(a) + '</a><span class="txt">' + esc(m.body) + '</span>' +
        (canMod || (S.user && S.user.id === m.user_id) ? '<button class="del" data-del="' + m.id + '" aria-label="Delete message">&times;</button>' : '');
      log.appendChild(d);
      while (log.children.length > 300) log.removeChild(log.firstChild);
      if (stick) log.scrollTop = log.scrollHeight;
    }
    async function who(ids) {
      var need = ids.filter(function (id, i) { return !people[id] && ids.indexOf(id) === i; });
      if (!need.length) return;
      var r = await sb.from('stream_profiles').select('id,handle,display_name,is_verified').in('id', need);
      (r.data || []).forEach(function (p) { people[p.id] = p; });
    }
    function add(m) {
      queue = queue.then(function () { return who([m.user_id]); }).then(function () { if (token === routeToken) line(m); });
    }
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stream_chat', filter: 'live_id=eq.' + live.id }, function (p) { add(p.new); });
    ch.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stream_chat' }, function (p) {
      var n = p.old && log.querySelector('[data-id="' + p.old.id + '"]');
      if (n) n.remove();
    });
    queue = queue.then(function () {
      return sb.from('stream_chat').select('*').eq('live_id', live.id).order('id', { ascending: false }).limit(60);
    }).then(async function (r) {
      if (r.error || token !== routeToken) return;
      var rows = r.data.reverse();
      await who(rows.map(function (x) { return x.user_id; }));
      if (!rows.length) log.innerHTML = '<p class="stat chat-empty">Say something. Chat is open.</p>';
      rows.forEach(line);
      log.scrollTop = log.scrollHeight;
    });
    log.onclick = async function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-del');
      if (!id) return;
      var x = await sb.from('stream_chat').delete().eq('id', id);
      if (x.error) return toast('Could not delete message');
      var n = log.querySelector('[data-id="' + id + '"]');
      if (n) n.remove();
    };
    var form = document.getElementById('chatForm');
    if (live.status !== 'live') { form.innerHTML = '<p class="stat">Chat closed when the stream ended.</p>'; return; }
    if (!S.user) { form.innerHTML = '<a class="btn" style="width:100%" href="#/login" id="chatIn">Sign in to chat</a>'; document.getElementById('chatIn').onclick = function () { sessionStorage.setItem('hsw-next', location.hash); }; return; }
    form.innerHTML = '<form id="chatF"><input type="text" id="chatBody" maxlength="300" placeholder="Send a message" aria-label="Chat message" autocomplete="off"><button class="btn primary">Chat</button></form>';
    document.getElementById('chatF').onsubmit = async function (e) {
      e.preventDefault();
      var inp = document.getElementById('chatBody'), body = inp.value.trim();
      if (!body) return;
      if (needMember()) return;
      inp.value = '';
      var x = await sb.from('stream_chat').insert({ live_id: live.id, user_id: S.user.id, body: body }).select().single();
      if (x.error) { inp.value = body; return toast(/Slow down/.test(x.error.message) ? 'Slow down. Too many messages.' : /row-level/.test(x.error.message) ? 'Chat is closed for this stream.' : 'Could not send message'); }
      add(x.data);
    };
  }

  async function vLive() {
    document.title = 'Live / HSW365 Stream';
    var token = routeToken;
    busy(true);
    var lives = await fetchLives(48);
    busy(false);
    if (token !== routeToken) return;
    var cta = '<a class="btn golive" href="#/golive">' + icon('live', 16) + 'Go live</a>';
    view.innerHTML = chips('live') + '<div class="page-head"><div><h1><i class="pulse"></i>Live now</h1><p>' + (lives.length ? plural(lives.length, 'channel') + ' on air.' : 'Streams happening right now on HSW365 Stream.') + '</p></div>' + cta + '</div>' +
      (lives.length ? '<div class="grid">' + lives.map(liveCard).join('') + '</div>'
        : emptyBlock('Nobody is live', 'Be the first on air. Go live from your camera or share your screen, straight from this browser.', cta));
    var timer = setInterval(async function () {
      var next = await fetchLives(48);
      if (token !== routeToken) return;
      if (next.map(function (x) { return x.id; }).join() !== lives.map(function (x) { return x.id; }).join()) route();
    }, 30000);
    teardown = function () { clearInterval(timer); };
  }

  /* viewer */
  async function vLiveWatch(id) {
    var token = routeToken;
    busy(true);
    var r = await sb.from('stream_lives').select(LIVE_SEL).eq('id', id).maybeSingle();
    busy(false);
    if (token !== routeToken) return;
    if (r.error) return fail(r.error);
    var live = r.data;
    if (!live) { view.innerHTML = emptyBlock('Stream not found', 'This link does not point to a live stream.', '<a class="btn primary" href="#/live">See who is live</a>'); return; }
    var o = live.owner || {};
    document.title = live.title + ' / HSW365 Stream';
    var mine = S.user && S.user.id === live.owner_id, admin = S.profile && S.profile.is_admin;
    var on = live.status === 'live';

    view.innerHTML = '<div class="watch live"><div>' +
      '<div class="player"><video id="lv" playsinline autoplay controls></video><div class="veil" id="veil"></div></div>' +
      '<h1>' + esc(live.title) + '</h1>' +
      '<div class="bar"><div class="chan"><a href="#/c/' + esc(o.handle) + '">' + avatar(o, 46) + '</a><div><a href="#/c/' + esc(o.handle) + '"><b>' + nameOf(o) + '</b></a>' +
      '<span class="stat" id="subCount">' + plural(o.subs_count, 'subscriber') + '</span></div>' +
      (mine ? '<a class="btn sm" href="#/golive">Broadcast studio</a>' : '<button class="btn primary" id="subBtn">Subscribe</button>') + '</div>' +
      '<div class="acts"><button class="btn" id="shareBtn">' + icon('share', 17) + 'Share</button>' +
      (mine ? '' : '<button class="btn" id="reportBtn">' + icon('flag', 17) + 'Report</button>') +
      (admin && on ? '<button class="btn danger" id="killBtn">End stream</button>' : '') + '</div></div>' +
      '<div class="desc"><span class="stat" id="liveStat"></span>' + esc(live.category) + '</div>' +
      '</div><aside class="chat" id="chat"></aside></div>';

    var vid = document.getElementById('lv'), veil = document.getElementById('veil'), stat = document.getElementById('liveStat');
    function say(title, text, btn) {
      veil.hidden = !title;
      veil.innerHTML = title ? '<div><h2>' + title + '</h2>' + (text ? '<p>' + text + '</p>' : '') + (btn || '') + '</div>' : '';
    }
    function paintStat(n) {
      stat.innerHTML = on ? '<span class="live-badge inline">Live</span> ' + count(n) + ' watching / started ' + ago(live.started_at)
        : 'Stream ended ' + ago(live.ended_at || live.last_beat) + ' / peak ' + plural(live.peak, 'viewer');
    }
    paintStat(live.viewers);

    document.getElementById('shareBtn').onclick = function () {
      var url = location.href;
      if (navigator.share) navigator.share({ title: live.title, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copied'); });
      else toast(url);
    };
    var subBtn = document.getElementById('subBtn');
    if (subBtn) {
      var subbed = false, subs = o.subs_count || 0;
      var paintSub = function () {
        subBtn.textContent = subbed ? 'Subscribed' : 'Subscribe';
        subBtn.className = 'btn ' + (subbed ? 'on' : 'primary');
        document.getElementById('subCount').textContent = plural(subs, 'subscriber');
      };
      if (S.user) sb.from('stream_subs').select('channel_id').eq('channel_id', live.owner_id).eq('subscriber_id', S.user.id).maybeSingle().then(function (x) { if (token === routeToken && x.data) { subbed = true; paintSub(); } });
      subBtn.onclick = async function () {
        if (needAuth()) return;
        subBtn.disabled = true;
        var q = subbed ? sb.from('stream_subs').delete().eq('channel_id', live.owner_id).eq('subscriber_id', S.user.id) : sb.from('stream_subs').insert({ channel_id: live.owner_id, subscriber_id: S.user.id });
        var x = await q; subBtn.disabled = false;
        if (x.error) return toast('Could not update subscription');
        subbed = !subbed; subs += subbed ? 1 : -1; paintSub();
        toast(subbed ? 'Subscribed to ' + o.display_name : 'Unsubscribed');
      };
    }
    var rb = document.getElementById('reportBtn');
    if (rb) rb.onclick = function () {
      if (needAuth()) return;
      modal('<h2>Report this stream</h2><div class="field"><label for="rReason">What is wrong with it?</label><textarea id="rReason" maxlength="1000" placeholder="Copyright, harassment, spam, illegal content..."></textarea></div>' +
        '<div class="acts"><button class="btn" id="rCancel">Cancel</button><button class="btn primary" id="rSend">Send report</button></div>');
      document.getElementById('rCancel').onclick = closeModal;
      document.getElementById('rSend').onclick = async function () {
        var reason = document.getElementById('rReason').value.trim();
        if (reason.length < 3) return toast('Describe the problem first');
        var x = await sb.from('stream_reports').insert({ live_id: id, reporter_id: S.user.id, reason: reason });
        closeModal(); toast(x.error ? 'Could not send report' : 'Report sent');
      };
    };
    var kb = document.getElementById('killBtn');
    if (kb) kb.onclick = async function () {
      if (!confirm('End this stream for everyone?')) return;
      var x = await sb.rpc('stream_end_live', { p_live: id });
      toast(x.error ? 'Could not end stream' : 'Stream ended'); if (!x.error) route();
    };

    var key = 'v' + Math.random().toString(36).slice(2, 12);
    var ch = sb.channel('live-' + id, { config: { broadcast: { self: false }, presence: { key: key } } });
    mountChat(document.getElementById('chat'), ch, live, token);

    if (!on) {
      vid.remove();
      say('Stream ended', esc(o.display_name) + ' is off air.', '<a class="btn primary" href="#/c/' + esc(o.handle) + '">Visit channel</a>');
      ch.subscribe();
      teardown = function () { sb.removeChannel(ch); };
      return;
    }

    var pc = null, asking = null, tries = 0, over = false, connected = false;
    function closePc() { if (pc) { pc.ontrack = null; pc.onconnectionstatechange = null; try { pc.close(); } catch (e) {} pc = null; } connected = false; }
    function ended() {
      if (over) return;
      over = true; on = false; clearTimeout(asking); closePc();
      vid.srcObject = null; vid.remove();
      live.ended_at = new Date().toISOString();
      say('Stream ended', 'Thanks for watching ' + esc(o.display_name) + '.', '<a class="btn primary" href="#/c/' + esc(o.handle) + '">Visit channel</a>');
      paintStat(0);
    }
    function ask() {
      if (over || connected) return;
      clearTimeout(asking);
      tries++;
      sig(ch, { t: 'join', from: key });
      asking = setTimeout(function () {
        if (over || connected) return;
        if (tries >= 6) return say('Could not connect', 'Your network is blocking the live video connection. Try another network or turn off your VPN.', '<button class="btn primary" id="retryBtn">Try again</button>');
        ask();
      }, 7000);
    }
    veil.onclick = function (e) {
      if (e.target.id === 'retryBtn') { tries = 0; say('Connecting', 'Reaching the broadcaster.'); ask(); }
      if (e.target.id === 'unmuteBtn') { vid.muted = false; say(''); }
    };
    async function onOffer(m) {
      closePc();
      var mypc = pc = new RTCPeerConnection({ iceServers: ICE });
      mypc.ontrack = function (e) {
        if (vid.srcObject !== e.streams[0]) vid.srcObject = e.streams[0];
        var p = vid.play();
        if (p && p.catch) p.catch(function () {
          vid.muted = true;
          vid.play().then(function () { say('Stream is muted', '', '<button class="btn primary" id="unmuteBtn">Tap for sound</button>'); }).catch(function () {});
        });
      };
      mypc.onconnectionstatechange = function () {
        if (pc !== mypc || over) return;
        var s = mypc.connectionState;
        if (s === 'connected') { connected = true; tries = 0; clearTimeout(asking); if (!vid.muted) say(''); }
        if (s === 'failed' || s === 'disconnected') { connected = false; say('Reconnecting', 'The connection dropped. Getting it back.'); setTimeout(ask, 1500); }
      };
      try {
        await mypc.setRemoteDescription(m.sdp);
        await mypc.setLocalDescription(await mypc.createAnswer());
        await waitIce(mypc);
        if (pc !== mypc) return;
        sig(ch, { t: 'answer', from: key, sdp: mypc.localDescription.toJSON() });
      } catch (e) { console.error(e); }
    }
    ch.on('broadcast', { event: 'sig' }, function (x) {
      var m = x.payload || {};
      if (m.t === 'end') return ended();
      if (m.to !== key) return;
      if (m.t === 'offer') onOffer(m);
      if (m.t === 'full') { clearTimeout(asking); say('Stream is full', 'This stream has reached its viewer limit. Try again in a moment.', '<button class="btn primary" id="retryBtn">Try again</button>'); }
    });
    ch.on('presence', { event: 'sync' }, function () {
      if (over) return;
      var p = roles(ch);
      paintStat(p.viewers);
      if (p.host) { if (!connected && !pc) { say('Connecting', 'Reaching the broadcaster.'); tries = 0; ask(); } }
      else { clearTimeout(asking); closePc(); say('Waiting for the broadcaster', esc(o.display_name) + ' is not sending video right now. This page reconnects on its own.'); }
    });
    say('Connecting', 'Reaching the broadcaster.');
    ch.subscribe(function (status) {
      if (status === 'SUBSCRIBED') ch.track({ role: 'viewer' });
    });
    // the row flips to ended if the broadcaster closed the tab without saying goodbye
    var check = setInterval(async function () {
      var x = await sb.from('stream_lives').select('status').eq('id', id).maybeSingle();
      if (token === routeToken && x.data && x.data.status !== 'live') ended();
    }, 30000);
    teardown = function () { over = true; clearInterval(check); clearTimeout(asking); closePc(); vid.srcObject = null; sb.removeChannel(ch); };
  }

  /* broadcaster */
  async function vGoLive() {
    if (needAuth()) return;
    document.title = 'Go live / HSW365 Stream';
    if (!S.profile) { view.innerHTML = emptyBlock('Setting up your channel', 'Reload in a moment.'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection) {
      view.innerHTML = emptyBlock('This browser cannot broadcast', 'Use a current version of Chrome, Edge, Safari or Firefox to go live.'); return;
    }
    var token = routeToken;
    await loadAccess();
    if (token !== routeToken) return;
    if (needMember()) return;

    var canScreen = !!navigator.mediaDevices.getDisplayMedia;
    var media = null, raw = [], micTracks = [], actx = null, source = null;
    var live = null, ch = null, peers = {}, beat = null, tick = null, access = null, done = false, lastN = -1, peakSeen = 0, soon = null;
    function beatNow() { if (live && !done) sb.rpc('stream_live_beat', { p_live: live.id, p_viewers: viewersNow() }).then(function () {}); }

    view.innerHTML = '<div class="watch live"><div>' +
      '<div class="player"><video id="pv" playsinline autoplay muted></video><div class="veil" id="veil"><div><h2>Camera is off</h2><p>Pick a source to see your preview.</p></div></div><div class="hud" id="hud" hidden></div></div>' +
      '<div id="stage"></div></div><aside class="chat" id="chat"><div class="chat-head"><h2>Before you go live</h2></div><div class="tips">' +
      '<p>Your video goes straight from this device to each viewer, so your upload speed sets the limit. Up to ' + MAX_PEERS + ' people can watch at once.</p>' +
      '<p>Keep this tab open while you are live. Closing it ends the stream.</p>' +
      '<p>Wi-Fi or a wired connection gives viewers the cleanest picture.</p>' +
      '<p>Follow the <a class="link" href="#/legal">rules</a>. Streams that break them are ended.</p></div></aside></div>';
    var pv = document.getElementById('pv'), veil = document.getElementById('veil'), stage = document.getElementById('stage'), hud = document.getElementById('hud');

    function stopRaw(list) { list.forEach(function (s) { s.getTracks().forEach(function (t) { t.stop(); }); }); }
    async function acquire(kind) {
      var streams = [], mics = [], out, ctx = null;
      if (kind === 'camera') {
        var cam;
        try { cam = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: { echoCancellation: true, noiseSuppression: true } }); }
        catch (e) { cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
        streams.push(cam); mics = cam.getAudioTracks(); out = cam;
      } else {
        var disp = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30 } }, audio: true });
        streams.push(disp);
        var mic = null;
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); streams.push(mic); mics = mic.getAudioTracks(); } catch (e) {}
        var tracks = [disp.getVideoTracks()[0]];
        var withAudio = [disp, mic].filter(function (s) { return s && s.getAudioTracks().length; });
        if (withAudio.length === 1) tracks.push(withAudio[0].getAudioTracks()[0]);
        else if (withAudio.length === 2) {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          var dest = ctx.createMediaStreamDestination();
          withAudio.forEach(function (s) { ctx.createMediaStreamSource(new MediaStream(s.getAudioTracks())).connect(dest); });
          tracks.push(dest.stream.getAudioTracks()[0]);
        }
        out = new MediaStream(tracks);
        disp.getVideoTracks()[0].addEventListener('ended', function () { if (!done && source === 'screen') setSource('camera'); });
      }
      return { out: out, streams: streams, mics: mics, ctx: ctx };
    }
    async function setSource(kind) {
      var got;
      try { got = await acquire(kind); }
      catch (e) {
        if (token !== routeToken) return false;
        toast(kind === 'camera' ? 'Allow camera and microphone access to go live' : 'Screen share was cancelled');
        return false;
      }
      if (token !== routeToken || done) { stopRaw(got.streams); return false; }
      var oldRaw = raw, oldCtx = actx;
      media = got.out; raw = got.streams; micTracks = got.mics; actx = got.ctx; source = kind;
      pv.srcObject = media; pv.classList.toggle('mirror', kind === 'camera');
      veil.hidden = true;
      Object.keys(peers).forEach(function (k) {
        peers[k].getSenders().forEach(function (s) {
          if (!s.track) return;
          var nt = media.getTracks().filter(function (t) { return t.kind === s.track.kind; })[0];
          if (nt) s.replaceTrack(nt).catch(function () {});
        });
      });
      stopRaw(oldRaw); if (oldCtx) oldCtx.close().catch(function () {});
      paintControls();
      return true;
    }
    function paintControls() {
      var micOn = micTracks.length && micTracks[0].enabled, vt = media && media.getVideoTracks()[0], camOn = vt && vt.enabled;
      var el = document.getElementById('ctl');
      if (!el) return;
      el.innerHTML = '<button class="btn' + (source === 'camera' ? ' on' : '') + '" data-src="camera">' + icon('cam', 17) + 'Camera</button>' +
        (canScreen ? '<button class="btn' + (source === 'screen' ? ' on' : '') + '" data-src="screen">' + icon('screen', 17) + 'Share screen</button>' : '') +
        (media ? '<button class="btn' + (micOn ? '' : ' danger') + '" data-tog="mic"' + (micTracks.length ? '' : ' disabled') + '>' + icon('mic', 17) + (micTracks.length ? (micOn ? 'Mic on' : 'Mic muted') : 'No mic') + '</button>' +
          '<button class="btn' + (camOn ? '' : ' danger') + '" data-tog="vid">' + (camOn ? 'Video on' : 'Video off') + '</button>' : '');
    }
    view.onclick = function (e) {
      var b = e.target.closest && e.target.closest('[data-src],[data-tog]');
      if (!b) return;
      var src = b.getAttribute('data-src'), tog = b.getAttribute('data-tog');
      if (src && src !== source) setSource(src);
      if (tog === 'mic') { micTracks.forEach(function (t) { t.enabled = !t.enabled; }); paintControls(); }
      if (tog === 'vid' && media) { media.getVideoTracks().forEach(function (t) { t.enabled = !t.enabled; }); paintControls(); }
    };

    stage.innerHTML = '<div class="acts ctl" id="ctl"></div><form class="form golive-form" id="gl">' +
      '<div class="field"><label for="glTitle">Stream title</label><input type="text" id="glTitle" maxlength="120" required placeholder="What are you streaming?"></div>' +
      '<div class="field"><label for="glCat">Category</label><select id="glCat">' + CATS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
      '<p class="err" id="glErr"></p><button class="btn golive big" id="glGo">' + icon('live', 18) + 'Go live</button></form>';
    paintControls();
    setSource('camera');

    function viewersNow() { return ch ? roles(ch).viewers : 0; }
    async function offerTo(key) {
      if (peers[key]) { try { peers[key].close(); } catch (e) {} delete peers[key]; }
      if (Object.keys(peers).length >= MAX_PEERS) return sig(ch, { t: 'full', to: key });
      var pc = new RTCPeerConnection({ iceServers: ICE });
      peers[key] = pc;
      media.getTracks().forEach(function (t) { pc.addTrack(t, media); });
      pc.onconnectionstatechange = function () {
        if (pc.connectionState === 'connected') {
          pc.getSenders().forEach(function (s) {
            if (!s.track || s.track.kind !== 'video') return;
            var p = s.getParameters();
            if (!p.encodings || !p.encodings.length) p.encodings = [{}];
            p.encodings[0].maxBitrate = 1500000;
            s.setParameters(p).catch(function () {});
          });
        }
        if ((pc.connectionState === 'failed' || pc.connectionState === 'closed') && peers[key] === pc) { try { pc.close(); } catch (e) {} delete peers[key]; }
      };
      try {
        await pc.setLocalDescription(await pc.createOffer());
        await waitIce(pc);
        if (peers[key] !== pc || done) return;
        sig(ch, { t: 'offer', to: key, sdp: pc.localDescription.toJSON() });
      } catch (e) { console.error(e); }
    }
    function paintHud() {
      if (!live) return;
      hud.innerHTML = '<span class="live-badge inline">Live</span><span>' + clock(live.started_at) + '</span><span>' + count(viewersNow()) + ' watching</span>';
    }

    document.getElementById('gl').onsubmit = async function (e) {
      e.preventDefault();
      var err = document.getElementById('glErr'), goBtn = document.getElementById('glGo');
      err.textContent = '';
      var title = document.getElementById('glTitle').value.trim();
      if (!title) { err.textContent = 'Give your stream a title.'; return; }
      if (!media) { if (!(await setSource('camera'))) { err.textContent = 'Turn on your camera or share your screen first.'; return; } }
      goBtn.disabled = true;
      var sess = (await sb.auth.getSession()).data.session;
      if (!sess) return needAuth();
      access = sess.access_token;
      var tPath = null;
      try {
        var frame = await captureFrame(pv);
        if (frame) {
          tPath = S.user.id + '/l/' + Date.now() + '.jpg';
          var up = await sb.storage.from(BUCKET).upload(tPath, frame, { contentType: 'image/jpeg', cacheControl: '3600' });
          if (up.error) tPath = null;
        }
      } catch (ex) { tPath = null; }
      var r = await sb.rpc('stream_go_live', { p_title: title, p_category: document.getElementById('glCat').value, p_thumb: tPath });
      if (token !== routeToken) return;
      if (r.error) {
        goBtn.disabled = false;
        if (/MEMBERSHIP/.test(r.error.message)) { S.access = null; await loadAccess(); needMember(); return; }
        err.textContent = r.error.message; return;
      }
      live = r.data;

      ch = sb.channel('live-' + live.id, { config: { broadcast: { self: false }, presence: { key: 'host' } } });
      ch.on('broadcast', { event: 'sig' }, function (x) {
        var m = x.payload || {};
        if (m.t === 'join' && m.from) offerTo(m.from);
        if (m.t === 'answer' && peers[m.from]) peers[m.from].setRemoteDescription(m.sdp).catch(function () {});
      });
      ch.on('presence', { event: 'sync' }, function () {
        var p = roles(ch);
        Object.keys(peers).forEach(function (k) { if (!p.keys[k]) { try { peers[k].close(); } catch (e) {} delete peers[k]; } });
        peakSeen = Math.max(peakSeen, p.viewers);
        if (p.viewers !== lastN) { lastN = p.viewers; clearTimeout(soon); soon = setTimeout(beatNow, 1500); }
        paintHud();
      });
      mountChat(document.getElementById('chat'), ch, live, token);
      ch.subscribe(function (status) { if (status === 'SUBSCRIBED') ch.track({ role: 'host' }); });

      var link = location.origin + location.pathname + '#/live/' + live.id;
      stage.innerHTML = '<h1>' + esc(live.title) + '</h1><div class="acts ctl" id="ctl"></div>' +
        '<div class="sharebox"><span class="stat">Share your stream</span><div><input type="text" readonly id="glLink" value="' + esc(link) + '" aria-label="Stream link"><button class="btn" id="glCopy">Copy link</button></div></div>' +
        '<button class="btn danger big" id="glEnd">End stream</button>';
      paintControls();
      hud.hidden = false; paintHud();
      document.title = 'LIVE: ' + live.title + ' / HSW365 Stream';
      document.getElementById('glCopy').onclick = function () {
        var el = document.getElementById('glLink'); el.select();
        if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { toast('Link copied'); }); else { document.execCommand('copy'); toast('Link copied'); }
      };
      document.getElementById('glEnd').onclick = function () { if (confirm('End your stream?')) finish(true); };
      tick = setInterval(paintHud, 1000);
      beat = setInterval(beatNow, 15000);
      toast('You are live');
    };

    function release() {
      clearInterval(tick); clearInterval(beat); clearTimeout(soon);
      Object.keys(peers).forEach(function (k) { try { peers[k].close(); } catch (e) {} });
      peers = {};
      stopRaw(raw); raw = []; if (actx) actx.close().catch(function () {});
      if (pv) pv.srcObject = null;
      window.removeEventListener('beforeunload', warn);
      window.removeEventListener('pagehide', bye);
    }
    async function finish(show) {
      if (done) return;
      done = true;
      var was = live, peak = 0;
      if (was) {
        peak = Math.max(peakSeen, viewersNow());
        try { sig(ch, { t: 'end' }); } catch (e) {}
        await sb.rpc('stream_live_beat', { p_live: was.id, p_viewers: peak });
        await sb.rpc('stream_end_live', { p_live: was.id });
        var x = await sb.from('stream_lives').select('peak').eq('id', was.id).maybeSingle();
        if (x.data) peak = Math.max(peak, x.data.peak);
      }
      release();
      if (ch) { var c = ch; ch = null; setTimeout(function () { sb.removeChannel(c); }, 400); }
      if (show && was && token === routeToken) {
        teardown = null;
        view.innerHTML = emptyBlock('Stream ended', 'You were live for ' + clock(was.started_at) + ' with a peak of ' + plural(peak, 'viewer') + '.',
          '<div class="acts center"><a class="btn golive" href="#/golive" id="again">' + icon('live', 16) + 'Go live again</a><a class="btn" href="#/c/' + esc(S.profile.handle) + '">Your channel</a></div>');
        document.getElementById('again').onclick = function (e) { e.preventDefault(); route(); };
        document.title = 'Go live / HSW365 Stream';
      }
    }
    function warn(e) { if (live && !done) { e.preventDefault(); e.returnValue = ''; } }
    function bye() {
      if (!live || done || !access) return;
      try { fetch(SB_URL + '/rest/v1/rpc/stream_end_live', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: 'Bearer ' + access }, body: JSON.stringify({ p_live: live.id }) }); } catch (e) {}
    }
    window.addEventListener('beforeunload', warn);
    window.addEventListener('pagehide', bye);
    teardown = function () { if (live && !done) finish(false); else { done = true; release(); } };
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
    view.innerHTML = '<div class="auth"><h1>Create a channel</h1><p>Free to join. Your first 7 days include going live, uploads and chat. No card needed.</p><form id="gf">' +
      '<div class="field"><label for="gName">Name</label><input type="text" id="gName" maxlength="50" required autocomplete="name"></div>' +
      '<div class="field"><label for="gHandle">Handle</label><input type="text" id="gHandle" maxlength="24" required autocapitalize="none" placeholder="yourname"><div class="hint">Your channel link. Lowercase letters, numbers, underscore.</div></div>' +
      '<div class="field"><label for="gEmail">Email</label><input type="email" id="gEmail" autocomplete="email" required></div>' +
      '<div class="field"><label for="gPhone">Phone number</label><input type="tel" id="gPhone" maxlength="24" autocomplete="tel" inputmode="tel" required placeholder="(555) 555-5555"><div class="hint">Kept private. Never shown on your channel.</div></div>' +
      '<div class="field"><label for="gPass">Password</label><input type="password" id="gPass" minlength="8" maxlength="72" autocomplete="new-password" required><div class="hint">At least 8 characters.</div></div>' +
      '<input class="hp" type="text" id="gSite" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="err" id="gErr"></p><button class="btn primary" style="width:100%">Create channel</button></form>' +
      '<p class="alt">After the free week, creator membership is $7 a month. Watching stays free. By joining you agree to the <a href="#/legal">terms and rules</a>.</p><p class="alt">Have an account? <a href="#/login">Sign in</a></p></div>';
    var nameEl = document.getElementById('gName'), handleEl = document.getElementById('gHandle'), touched = false;
    handleEl.oninput = function () { touched = true; handleEl.value = handleEl.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); };
    nameEl.oninput = function () { if (!touched) handleEl.value = nameEl.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24); };
    document.getElementById('gf').onsubmit = async function (e) {
      e.preventDefault();
      var err = document.getElementById('gErr'), b = e.target.querySelector('button');
      var body = { email: document.getElementById('gEmail').value.trim(), password: document.getElementById('gPass').value, handle: handleEl.value.trim(), display_name: nameEl.value.trim(), phone: document.getElementById('gPhone').value.trim(), website: document.getElementById('gSite').value };
      err.textContent = '';
      if (!/^[a-z0-9_]{3,24}$/.test(body.handle)) { err.textContent = 'Handle must be 3 to 24 characters: lowercase letters, numbers, underscore.'; return; }
      var pd = body.phone.replace(/\D/g, '');
      if (pd.length < 10 || pd.length > 15) { err.textContent = 'Enter a valid phone number with area code.'; return; }
      b.disabled = true; b.textContent = 'Creating';
      try {
        var res = await fetch(SB_URL + '/functions/v1/stream-signup', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }, body: JSON.stringify(body) });
        var j = await res.json();
        if (j.owner) {
          // owner addresses must confirm by email before they get full access
          var su = await sb.auth.signUp({ email: body.email, password: body.password, options: { data: { handle: body.handle, display_name: body.display_name, phone: j.phone }, emailRedirectTo: location.origin + location.pathname } });
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
      '<h2>Membership and payments</h2><p>Creating a channel is free and watching is always free. New channels get 7 days of creator access (going live, uploading, commenting and chatting) at no charge and without a card. After that, creator access is $7 per month, billed monthly through Stripe until you cancel. You can cancel any time from the Membership page and keep access through the period you paid for. The verified green checkmark is a separate subscription at $10 per month, billed monthly until you cancel; the checkmark comes off when that subscription ends. Payments are not refundable except where the law requires it. Verification can be removed from accounts that break the rules.</p>' +
      '<h2>Live streams</h2><p>Live video is sent directly from the broadcaster to each viewer and is not recorded by HSW365 Stream. Chat messages are stored and are public.</p>' +
      '<h2>Your videos</h2><p>You keep ownership of what you upload. By uploading you give HSW365 Media LLC a non-exclusive license to host, stream and display your video on the service. You can delete your videos at any time, which ends that license.</p>' +
      '<h2>Community rules</h2><ul><li>Only upload or broadcast video you made or have the rights to. The same rules apply to live streams and live chat.</li><li>No sexual content involving minors, and no content that sexualizes minors in any way.</li><li>No threats, harassment, doxxing or content that promotes violence against people.</li><li>No spam, scams, malware or impersonation.</li><li>No content that is illegal where you live or in the United States.</li></ul><p>Videos and channels that break these rules can be hidden or removed, and accounts can be closed. Live streams that break the rules can be ended at any time. Use the Report button on any video or live stream to flag it.</p>' +
      '<h2>Copyright</h2><p>If your copyrighted work was posted without permission, email ' + m + ' with: the link to the video, a description of your work, your contact details, a statement that you have a good-faith belief the use is not authorized, a statement under penalty of perjury that your notice is accurate and that you are the owner or authorized to act for the owner, and your signature. We remove infringing videos and close the accounts of repeat infringers.</p>' +
      '<h2>Privacy</h2><p>We store your name, email address, phone number, channel details and the content you post. Your phone number and email are never shown publicly; we use them to run your account and to contact you about HSW365 Stream. We do not sell personal information. Videos, comments and channel pages are public. To delete your account and data, email ' + m + '.</p>' +
      '<h2>Contact</h2><p>' + m + '</p></div>';
  }

  /* ---------- router ---------- */
  function route() {
    var h = location.hash || '#/';
    if (h.indexOf('#/') !== 0) { if (!S.ready) return; h = '#/'; }
    var parts = h.slice(2).split('/').map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
    routeToken++;
    if (teardown) { var td = teardown; teardown = null; try { td(); } catch (e) { console.error(e); } }
    view.onclick = null;
    closeModal(); busy(false);
    renderChrome();
    window.scrollTo(0, 0);
    var p = parts[0], a = parts.slice(1).join('/');
    if (p !== 'search') document.getElementById('searchInput').value = '';
    var fn = { '': vHome, trending: vTrending, subs: vSubs, liked: vLiked, upload: vUpload, studio: vStudio, settings: vSettings, admin: vAdmin, login: vLogin, signup: vSignup, legal: vLegal, golive: vGoLive }[p];
    var out;
    if (p === 'live') out = a ? vLiveWatch(a) : vLive();
    else if (p === 'membership') out = vMembership(a);
    else if (fn) out = fn();
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
    if (!user) { S.profile = null; S.access = null; profileJob = null; profileFor = null; return Promise.resolve(); }
    if (profileJob && profileFor === user.id) return profileJob; // one request per user, shared by all callers
    profileFor = user.id;
    profileJob = sb.rpc('stream_ensure_profile', { p_handle: handle || null, p_name: name || null }).then(function (r) {
      if (r.error) { console.error(r.error); profileJob = null; S.profile = null; return; }
      S.profile = r.data;
      return loadAccess();
    });
    return profileJob;
  }
  sb.auth.onAuthStateChange(function (event, session) {
    // never await Supabase calls inside this callback
    setTimeout(async function () {
      var u = session ? session.user : null;
      if (event === 'SIGNED_OUT') { S.user = null; S.profile = null; S.access = null; profileJob = null; profileFor = null; if (S.ready) renderChrome(); return; }
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
