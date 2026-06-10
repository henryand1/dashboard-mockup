
// ══════════════════════════════════════════════
//  MI Dashboard Shared JS
//  Requires data.js to be loaded first
// ══════════════════════════════════════════════

window.MIDash = (function() {
  'use strict';

  // ── State ──────────────────────────────────
  var state = {
    wilayah: null,  // null = all
    pageCharts: {}
  };

  // ── Helpers ────────────────────────────────
  function fmtM(n) {
    if (n === undefined || n === null || isNaN(n)) return '-';
    var abs = Math.abs(n);
    if (abs >= 1000000) return (n/1000000).toFixed(2).replace('.',',') + ' T';
    if (abs >= 1000)    return (n/1000).toFixed(2).replace('.',',') + ' M';
    return n.toFixed(0) + ' Jt';
  }

  function fmtNum(n) {
    if (n === undefined || n === null || isNaN(n)) return '-';
    return Math.round(n).toLocaleString('id-ID');
  }

  function fmtPct(n) {
    if (n === undefined || n === null || isNaN(n)) return '-';
    return n.toFixed(1).replace('.',',') + '%';
  }

  function pctClass(p) {
    if (p >= 100) return 'good';
    if (p >= 80)  return 'warn';
    return 'bad';
  }

  function barColor(p) {
    if (p >= 100) return '#059669';
    if (p >= 80)  return '#D97706';
    return '#DC2626';
  }

  function barWidth(p) {
    return Math.min(Math.max(p, 0), 120) + '%';  // allow a bit over 100 visually
  }

  // ── Data access ────────────────────────────
  function getRecords() {
    return state.wilayah ? MI_DATA.filterByWilayah(state.wilayah) : MI_DATA.records;
  }

  function getSummary() {
    return MI_DATA.getSummary(state.wilayah);
  }

  function getByKategoriProduk(kategori, produkList) {
    var recs = getRecords().filter(function(r) {
      return r.kategori === kategori && (!produkList || produkList.indexOf(r.produk) >= 0);
    });
    var outstanding = recs.reduce(function(a,b){return a+b.outstanding_m;},0);
    var target = recs.reduce(function(a,b){return a+b.target_m;},0);
    var pct = target > 0 ? outstanding/target*100 : 0;
    return { outstanding: outstanding, target: target, pct: pct, count: recs.length };
  }

  function getByProduk(produk) {
    var recs = getRecords().filter(function(r){return r.produk === produk;});
    var outstanding = recs.reduce(function(a,b){return a+b.outstanding_m;},0);
    var target = recs.reduce(function(a,b){return a+b.target_m;},0);
    var pct = target > 0 ? outstanding/target*100 : 0;
    return { outstanding: outstanding, target: target, pct: pct };
  }

  function getWilayahSeries() {
    var wList = MI_DATA.masterWilayah;
    if (state.wilayah) {
      wList = wList.filter(function(w){return w.kode === state.wilayah;});
    }
    return wList.map(function(w) {
      var s = MI_DATA.summaryWilayah.filter(function(x){return x.wilayah_kode === w.kode;})[0] || {};
      return {
        nama: w.nama,
        dpk: s.dpk_outstanding || 0,
        dpk_target: s.dpk_target || 0,
        dpk_pct: s.dpk_target > 0 ? s.dpk_outstanding/s.dpk_target*100 : 0,
        lending: s.lending_outstanding || 0,
        lending_target: s.lending_target || 0,
        lending_pct: s.lending_target > 0 ? s.lending_outstanding/s.lending_target*100 : 0,
        kk: s.kk_outstanding || 0,
        merchant: s.merchant_outstanding || 0,
        nasabah: s.total_nasabah || 0,
        rm: s.total_rm || 0,
      };
    });
  }

  function getKolektibilitasBreakdown() {
    var recs = getRecords().filter(function(r){return r.kategori === 'Lending';});
    var breakdown = {1:0,2:0,3:0,4:0,5:0};
    recs.forEach(function(r){
      var k = r.kolektibilitas || 1;
      if (breakdown[k] !== undefined) breakdown[k] += r.outstanding_m;
    });
    var total = Object.values(breakdown).reduce(function(a,b){return a+b;},0);
    return { breakdown: breakdown, total: total };
  }

  // ── Filter UI ──────────────────────────────
  function initFilter(activeWilayah) {
    var sel = document.getElementById('wilayah-filter');
    if (!sel) return;
    // Populate options
    var html = '<option value="">Semua Wilayah</option>';
    MI_DATA.masterWilayah.forEach(function(w) {
      var sel2 = (w.kode === activeWilayah) ? ' selected' : '';
      html += '<option value="' + w.kode + '"' + sel2 + '>' + w.kode + ' – ' + w.nama + '</option>';
    });
    sel.innerHTML = html;
    // Restore saved filter
    var saved = localStorage.getItem('bni_wilayah');
    if (saved && !activeWilayah) {
      sel.value = saved;
      state.wilayah = saved || null;
    }
    if (activeWilayah) {
      state.wilayah = activeWilayah;
    }
    updateFilterInfo();
  }

  function applyFilter() {
    var sel = document.getElementById('wilayah-filter');
    if (!sel) return;
    state.wilayah = sel.value || null;
    localStorage.setItem('bni_wilayah', sel.value);
    updateFilterInfo();
    if (window._renderPage) window._renderPage();
  }

  function resetFilter() {
    var sel = document.getElementById('wilayah-filter');
    if (sel) sel.value = '';
    state.wilayah = null;
    localStorage.removeItem('bni_wilayah');
    updateFilterInfo();
    if (window._renderPage) window._renderPage();
  }

  function updateFilterInfo() {
    var el = document.getElementById('filter-info');
    if (!el) return;
    if (state.wilayah) {
      var w = MI_DATA.masterWilayah.filter(function(x){return x.kode===state.wilayah;})[0];
      el.textContent = 'Menampilkan: ' + (w ? w.kode + ' – ' + w.nama : state.wilayah);
      el.style.color = '#003C7D';
      el.style.fontWeight = '600';
    } else {
      el.textContent = 'Menampilkan semua wilayah';
      el.style.color = '';
      el.style.fontWeight = '';
    }
  }

  // ── Chart helpers ──────────────────────────
  function destroyChart(id) {
    if (state.pageCharts[id]) {
      state.pageCharts[id].destroy();
      delete state.pageCharts[id];
    }
  }

  function makeBarChart(canvasId, labels, datasets, opts) {
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId);
    if (!ctx) return;
    var defaults = {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: datasets.length > 1,
            labels: { font: { size: 11, family: 'Inter' }, boxWidth: 12 }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ' ' + ctx.dataset.label + ': ' + fmtM(ctx.raw);
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 10, family: 'Inter' }, maxRotation: 45 },
            grid: { display: false }
          },
          y: {
            ticks: {
              font: { size: 10, family: 'Inter' },
              callback: function(v) { return fmtM(v); }
            },
            grid: { color: '#F1F5F9' }
          }
        }
      }
    };
    // deep merge opts if provided
    if (opts && opts.options) {
      if (opts.options.scales) Object.assign(defaults.options.scales, opts.options.scales);
      if (opts.options.plugins) Object.assign(defaults.options.plugins, opts.options.plugins);
    }
    state.pageCharts[canvasId] = new Chart(ctx, defaults);
  }

  function makeDonutChart(canvasId, labels, data, colors) {
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId);
    if (!ctx) return;
    state.pageCharts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ' ' + ctx.label + ': ' + fmtM(ctx.raw);
              }
            }
          }
        }
      }
    });
  }

  // ── Render helpers ─────────────────────────
  function renderProdItems(containerId, items) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = '';
    items.forEach(function(item) {
      var pct = item.pct || 0;
      var cls = pctClass(pct);
      var w = Math.min(pct, 100);
      html += '<div class="prod-item">' +
        '<div class="prod-row">' +
          '<span class="prod-name">' + item.name + '</span>' +
          '<span class="prod-pct ' + cls + '">' + fmtPct(pct) + '</span>' +
        '</div>' +
        '<div class="prod-bar-track"><div class="prod-bar-fill ' + cls + '" style="width:' + w + '%"></div></div>' +
        '<div class="prod-amounts">' + fmtM(item.outstanding) + ' / Target: ' + fmtM(item.target) + '</div>' +
      '</div>';
    });
    el.innerHTML = html || '<div class="empty-state"><div class="icon">📊</div><p>Tidak ada data</p></div>';
  }

  function renderKPICard(id, value, sub, pct) {
    var el = document.getElementById(id);
    if (!el) return;
    var pEl = el.querySelector('.kpi-value');
    var sEl = el.querySelector('.kpi-sub');
    if (pEl) pEl.textContent = value;
    if (sEl && sub !== undefined) {
      var cls = pctClass(pct);
      sEl.innerHTML = '<span class="kpi-pct ' + cls + '">' + fmtPct(pct) + '</span> dari target';
    }
  }

  function setBadge(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Public API ─────────────────────────────
  return {
    state: state,
    fmtM: fmtM,
    fmtNum: fmtNum,
    fmtPct: fmtPct,
    pctClass: pctClass,
    barColor: barColor,
    getRecords: getRecords,
    getSummary: getSummary,
    getByKategoriProduk: getByKategoriProduk,
    getByProduk: getByProduk,
    getWilayahSeries: getWilayahSeries,
    getKolektibilitasBreakdown: getKolektibilitasBreakdown,
    initFilter: initFilter,
    applyFilter: applyFilter,
    resetFilter: resetFilter,
    renderProdItems: renderProdItems,
    renderKPICard: renderKPICard,
    setBadge: setBadge,
    makeBarChart: makeBarChart,
    makeDonutChart: makeDonutChart,
  };
})();

// Expose to global for onclick handlers
function applyFilter() { MIDash.applyFilter(); }
function resetFilter()  { MIDash.resetFilter(); }
