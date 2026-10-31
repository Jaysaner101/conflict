/*
 * episodes.js — fills an episode row from a YouTube playlist, newest first.
 *
 * The row (sections/episodes.liquid) carries data-playlist, data-key and
 * data-count only when a playlist and the Theme settings key are both set.
 * The cards already in the row are the fallback: if YouTube can't be
 * reached, or the key is wrong, nothing is replaced.
 *
 * Cost: 2 to 3 API units per visitor per hour (the result is cached for an
 * hour in the browser); the free daily allowance is 10,000.
 */
(function () {
  var API = 'https://www.googleapis.com/youtube/v3/';
  var HOUR = 36e5;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  function dur(iso) {
    var m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || ''); if (!m) return '';
    var h = +m[1] || 0, mi = +m[2] || 0, s = +m[3] || 0, p = function (n) { return (n < 10 ? '0' : '') + n; };
    return h ? h + ':' + p(mi) + ':' + p(s) : mi + ':' + p(s);
  }

  function ago(iso) {
    var secs = (Date.parse(iso) - Date.now()) / 1000, rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    var units = [['year', 31536e3], ['month', 2592e3], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (var i = 0; i < units.length; i++) if (Math.abs(secs) >= units[i][1]) return rtf.format(Math.round(secs / units[i][1]), units[i][0]);
    return 'just now';
  }

  function get(path) {
    return fetch(API + path).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  // Every video in the playlist (a playlist can list oldest first), up to 200.
  function playlist(id, key, page, acc) {
    acc = acc || [];
    return get('playlistItems?part=contentDetails&maxResults=50&playlistId=' + encodeURIComponent(id) + '&key=' + key + (page ? '&pageToken=' + page : ''))
      .then(function (j) {
        (j.items || []).forEach(function (it) { acc.push(it.contentDetails.videoId); });
        return j.nextPageToken && acc.length < 200 ? playlist(id, key, j.nextPageToken, acc) : acc;
      });
  }

  function load(id, key, n) {
    return playlist(id, key).then(function (ids) {
      var batches = [];
      for (var i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));
      return Promise.all(batches.map(function (b) {
        return get('videos?part=snippet,contentDetails,liveStreamingDetails,status&id=' + b.join(',') + '&key=' + key);
      }));
    }).then(function (pages) {
      var vids = [];
      pages.forEach(function (p) { vids = vids.concat(p.items || []); });
      return vids
        .filter(function (v) { return v.status && v.status.privacyStatus === 'public' && v.snippet.liveBroadcastContent !== 'upcoming'; })
        .map(function (v) {
          var live = v.liveStreamingDetails || {}, t = v.snippet.thumbnails || {};
          var when = live.actualStartTime || v.snippet.publishedAt;
          return {
            id: v.id, title: v.snippet.title, when: when,
            streamed: !!live.actualStartTime, live: v.snippet.liveBroadcastContent === 'live',
            dur: dur(v.contentDetails.duration),
            thumb: (t.maxres || t.standard || t.high || t.medium || {}).url || ''
          };
        })
        .sort(function (a, b) { return Date.parse(b.when) - Date.parse(a.when); })
        .slice(0, n);
    });
  }

  function card(v, short) {
    var meta = v.live ? 'Live now' : (v.streamed ? 'Streamed ' : '') + ago(v.when);
    return '<a class="ep' + (short ? ' short' : '') + '" href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener">' +
      '<div class="th"><img src="' + esc(v.thumb) + '" alt="" loading="lazy">' +
      '<span class="pb"><svg class="ic" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>' +
      (v.dur && !v.live ? '<span class="du">' + esc(v.dur) + '</span>' : '') + '</div>' +
      '<div class="t">' + esc(v.title) + '</div><div class="m">' + esc(meta) + '</div></a>';
  }

  document.querySelectorAll('.eps[data-playlist]').forEach(function (row) {
    var id = row.dataset.playlist, key = row.dataset.key, n = +row.dataset.count || 8, short = row.dataset.short === 'true';
    var cacheKey = 'eps:' + id + ':' + n, cached = null;
    try { cached = JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch (e) {}
    var show = function (list) { if (list && list.length) row.innerHTML = list.map(function (v) { return card(v, short); }).join(''); };
    if (cached && Date.now() - cached.t < HOUR) return show(cached.list);
    load(id, key, n).then(function (list) {
      show(list);
      try { localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), list: list })); } catch (e) {}
    }).catch(function () { if (cached) show(cached.list); });
  });
})();
