/* 字級設定（2026-11-18 老師指示：文字太小，讓學員自己調）
 * 右下角「字 A− 數字 A＋」浮動鈕；設定存在這台電腦的瀏覽器，課程首頁與講義共用。
 * 投影模式（?show=1）不套用，投影片本身會自動縮放到螢幕大小。 */
(function () {
  if (/[?&]show=1/.test(location.search)) return;
  var KEY = 'vi-fontscale', MIN = 0.9, MAX = 1.8, STEP = 0.1, DEF = 1.15;
  function get() { try { var v = parseFloat(localStorage.getItem(KEY)); return v >= MIN && v <= MAX ? v : DEF; } catch (e) { return DEF; } }
  function apply(v) {
    v = Math.round(Math.min(MAX, Math.max(MIN, v)) * 100) / 100;
    document.body.style.zoom = v;
    try { localStorage.setItem(KEY, v); } catch (e) {}
    var n = document.getElementById('fsz-n'); if (n) n.textContent = Math.round(v * 100) + '%';
    window.dispatchEvent(new Event('resize'));
    return v;
  }
  function init() {
    var cur = apply(get());
    var box = document.createElement('div');
    box.id = 'fsz';
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', '字級設定');
    box.innerHTML = '<span class="fsz-l">字級</span><button type="button" data-d="-1" aria-label="字變小">A−</button>' +
      '<button type="button" id="fsz-n" data-d="0" title="恢復預設">' + Math.round(cur * 100) + '%</button>' +
      '<button type="button" data-d="1" aria-label="字變大">A＋</button>';
    var st = document.createElement('style');
    st.textContent = '#fsz{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;align-items:center;gap:4px;padding:5px 7px;background:#fff;border:1.5px solid #cbd5e1;border-radius:999px;box-shadow:0 4px 14px rgba(15,23,42,.18);font:700 15px/1 system-ui,"Microsoft JhengHei",sans-serif;color:#1d3557}' +
      '#fsz .fsz-l{padding:0 4px 0 6px}#fsz button{border:0;background:#eef3f8;color:#1d3557;border-radius:999px;min-width:40px;height:34px;font:inherit;cursor:pointer}#fsz button:hover{background:#dbe7f3}' +
      '@media print{#fsz{display:none}}';
    document.head.appendChild(st);
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var d = +b.getAttribute('data-d');
      cur = apply(d === 0 ? DEF : cur + d * STEP);
    });
    document.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey && e.altKey)) return;
      if (e.key === '=' || e.key === '+') { cur = apply(cur + STEP); e.preventDefault(); }
      else if (e.key === '-') { cur = apply(cur - STEP); e.preventDefault(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
