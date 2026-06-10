// ══════════════════════════════════════════════════
// MI DASHBOARD — DATA INTEGRATION ENGINE
// Connects MI_DATA dummy data to all pages.
// Reads ?get-wilayah=WXX from URL and refreshes metrics.
// ══════════════════════════════════════════════════

(function () {
  if (typeof MI_DATA === 'undefined') {
    console.error('[MI] data.js not loaded — check script src path');
    return;
  }

  // ── Helpers ──────────────────────────────────────
  var sum = function (arr, k) { return arr.reduce(function (a, b) { return a + b[k]; }, 0); };

  var fmt = function (n, decimals) {
    decimals = decimals === undefined ? 2 : decimals;
    var s = parseFloat(n).toFixed(decimals);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  };

  var pct = function (val, target) {
    if (!target || target === 0) return 0;
    return Math.round((val / target) * 100);
  };

  var getWilayah = function () {
    var params = new URLSearchParams(window.location.search);
    return params.get('get-wilayah') || null;
  };

  var setEl = function (id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  var setAmountH = function (id, amount_m, target_m, unit) {
    unit = unit || 'M';
    var el = document.getElementById(id);
    if (!el) return;
    var p = pct(amount_m, target_m);
    el.innerHTML = fmt(amount_m) + ' ' + unit + ' &nbsp;'
      + '<a class="text-gray-400 fs-8">T. FY : ' + fmt(target_m) + ' ' + unit + '</a>'
      + '<a class="text-gray-400 fs-8">(' + p + ' %)</a>';
  };

  var setProdCard = function (prodId, amount, target, unit, barPct) {
    unit = unit || 'M';
    barPct = barPct || pct(amount, target);
    barPct = Math.min(barPct, 100);
    var diff = +(amount - target).toFixed(2);
    var diffStr = (diff >= 0 ? '+' : '') + fmt(diff) + ' ' + unit;

    var h6 = document.querySelector('[data-bni-prod="' + prodId + '"]');
    if (!h6) return;
    var cardInner = h6.closest('.col.ms-2') || h6.closest('.col');
    if (!cardInner) return;

    // Amount span (sibling of h6's parent flex-row)
    var flexRow = h6.closest('.d-flex.justify-content-between.fw-bold') || h6.parentElement.parentElement;
    var spans = flexRow ? flexRow.querySelectorAll('span') : [];
    if (spans[0]) spans[0].textContent = fmt(amount) + unit + ' (' + pct(amount, target) + '%)';

    // Progress bar
    var bar = cardInner.querySelector('[role="progressbar"]');
    if (bar) bar.style.width = barPct + '%';

    // T.FY and diff row
    var fwNormal = cardInner.querySelector('.fw-normal');
    if (fwNormal) {
      var nSpans = fwNormal.querySelectorAll('span');
      if (nSpans[0]) nSpans[0].textContent = 'T.FY : ' + fmt(target) + ' ' + unit;
      if (nSpans[1]) nSpans[1].textContent = diffStr;
    }
  };

  // ── Page: executive ──────────────────────────────
  function initExecutive() {
    var wCode = getWilayah();
    var recs  = MI_DATA.filterByWilayah(wCode);

    var dpk   = recs.filter(function(r){ return r.kategori === 'DPK'; });
    var dpkWil = dpk.filter(function(r){ return r.segmen === 'Consumer' || r.segmen === 'Mikro'; });
    var dpkCR  = dpk.filter(function(r){ return r.segmen === 'Bisnis' || r.segmen === 'Korporasi'; });
    var lend  = recs.filter(function(r){ return r.kategori === 'Lending'; });
    var griya = lend.filter(function(r){ return r.produk === 'KPR Griya' || r.produk === 'Griya Ekspress'; });
    var fleksi= lend.filter(function(r){ return r.produk === 'KPR Fleksi'; });
    var kk    = recs.filter(function(r){ return r.kategori === 'KK'; });
    var mer   = recs.filter(function(r){ return r.kategori === 'Merchant'; });

    var dpkWilOS = sum(dpkWil,'outstanding_m'), dpkWilTgt = sum(dpkWil,'target_m');
    var dpkCROS  = sum(dpkCR,'outstanding_m'),  dpkCRTgt  = sum(dpkCR,'target_m');
    var tabOS  = sum(dpkWil.filter(function(r){return r.produk==='Tabungan';}), 'outstanding_m');
    var tabTgt = sum(dpkWil.filter(function(r){return r.produk==='Tabungan';}), 'target_m');
    var girOS  = sum(dpkWil.filter(function(r){return r.produk==='Giro';}), 'outstanding_m');
    var girTgt = sum(dpkWil.filter(function(r){return r.produk==='Giro';}), 'target_m');
    var depOS  = sum(dpkWil.filter(function(r){return r.produk==='Deposito';}), 'outstanding_m');
    var depTgt = sum(dpkWil.filter(function(r){return r.produk==='Deposito';}), 'target_m');
    var tabCROS = sum(dpkCR.filter(function(r){return r.produk==='Tabungan';}), 'outstanding_m');
    var tabCRTgt= sum(dpkCR.filter(function(r){return r.produk==='Tabungan';}), 'target_m');
    var girCROS = sum(dpkCR.filter(function(r){return r.produk==='Giro';}), 'outstanding_m');
    var girCRTgt= sum(dpkCR.filter(function(r){return r.produk==='Giro';}), 'target_m');
    var depCROS = sum(dpkCR.filter(function(r){return r.produk==='Deposito';}), 'outstanding_m');
    var depCRTgt= sum(dpkCR.filter(function(r){return r.produk==='Deposito';}), 'target_m');

    var bdOS = sum(lend,'outstanding_m'), bdTgt = sum(lend,'target_m');
    var bkOS = sum(griya,'outstanding_m') + sum(fleksi,'outstanding_m');
    var bkTgt= sum(griya,'target_m') + sum(fleksi,'target_m');
    var kkOS = sum(kk,'outstanding_m'),   kkTgt = sum(kk,'target_m');
    var merOS= sum(mer,'outstanding_m'),  merTgt= sum(mer,'target_m');

    setAmountH('bni-dpk-wil-amount', dpkWilOS, dpkWilTgt);
    setAmountH('bni-dpk-cr-amount',  dpkCROS,  dpkCRTgt);
    setAmountH('bni-bd-amount',      bdOS, bdTgt);
    setAmountH('bni-booking-amount', bkOS, bkTgt);
    setAmountH('bni-kk-amount',      kkOS, kkTgt, 'CIF');
    setAmountH('bni-mer-amount',     merOS, merTgt, 'MID');

    setProdCard('bni-prod-tabungan', tabOS, tabTgt);
    setProdCard('bni-prod-giro',     girOS, girTgt);
    setProdCard('bni-prod-deposito', depOS, depTgt);
    setProdCard('bni-prod-griya',    sum(griya,'outstanding_m'), sum(griya,'target_m'));
    setProdCard('bni-prod-fleksi',   sum(fleksi,'outstanding_m'), sum(fleksi,'target_m'));

    // DPK CR products (second set)
    var h6cr = document.querySelectorAll('[data-bni-prod]');
    setProdCard('bni-prod-griya2',  tabCROS, tabCRTgt);
    setProdCard('bni-prod-fleksi2', depCROS, depCRTgt);

    var ds  = kk.filter(function(r){return r.produk==='Direct Sales';});
    var stf = kk.filter(function(r){return r.produk==='Staff';});
    var dip = kk.filter(function(r){return r.produk==='Digital Partnership';});
    setProdCard('bni-prod-directsales', sum(ds,'outstanding_m'),  sum(ds,'target_m'),  'CIF');
    setProdCard('bni-prod-staff',       sum(stf,'outstanding_m'), sum(stf,'target_m'), 'CIF');
    setProdCard('bni-prod-digital',     sum(dip,'outstanding_m'), sum(dip,'target_m'), 'CIF');

    var edc  = mer.filter(function(r){return r.produk==='EDC';});
    var qris = mer.filter(function(r){return r.produk==='QRIS';});
    setProdCard('bni-prod-edc',  sum(edc,'outstanding_m'),  sum(edc,'target_m'),  'MID');
    setProdCard('bni-prod-qris', sum(qris,'outstanding_m'), sum(qris,'target_m'), 'MID');
  }

  // ── Page: kualitas_kredit ────────────────────────
  function initKualitasKredit() {
    var wCode = getWilayah();
    var rows  = MI_DATA.getKKByWilayah(wCode);
    var tbody = document.querySelector('.bni-kk-table tbody') || document.querySelector('table tbody');
    if (!tbody) return;

    var html = rows.map(function(r) {
      return '<tr>'
        + '<td class="sticky-col">' + r.cabang_kode + '</td>'
        + '<td class="text-end">' + fmt(r.commitment_bal) + '</td>'
        + '<td class="text-end">' + fmt(r.outstanding) + '</td>'
        + '<td class="text-end bni-rate-col">' + r.rate_lama + '%</td>'
        + '<td class="text-end bni-rate-col">' + r.rate_baru + '%</td>'
        + '<td class="text-end">' + fmt(r.saldo_blokir) + '</td>'
        + '<td class="text-end">' + fmt(r.baki_debet) + '</td>'
        + '<td class="text-end">' + fmt(r.saldo_akhir) + '</td>'
        + '<td class="text-end">' + fmt(r.saldo_akhir_afiliasi) + '</td>'
        + '<td class="text-end">' + fmt(r.baki_debet_new) + '</td>'
        + '<td class="text-end">' + fmt(r.saldo_akhir_new) + '</td>'
        + '<td class="text-end">' + fmt(r.saldo_akhir_aff_new) + '</td>'
        + '<td class="text-end">' + fmt(r.tunggakan_new) + '</td>'
        + '<td class="text-end">' + fmt(r.angsuran_new) + '</td>'
        + '<td class="text-end">' + fmt(r.total_kewajiban_new) + '</td>'
        + '</tr>';
    }).join('');

    tbody.innerHTML = html || '<tr><td colspan="15" class="text-center text-muted py-3">Tidak ada data</td></tr>';

    // Update count badge
    var badge = document.querySelector('.bni-kk-count');
    if (badge) badge.textContent = rows.length + ' cabang';
  }

  // ── Page: sales / leads / business / developer ──
  function initGenericPage() {
    var wCode = getWilayah();
    var recs  = MI_DATA.filterByWilayah(wCode);
    var lend  = recs.filter(function(r){ return r.kategori === 'Lending'; });
    var kk    = recs.filter(function(r){ return r.kategori === 'KK'; });
    var dpk   = recs.filter(function(r){ return r.kategori === 'DPK'; });

    // Update any element with data-bni-total attribute
    document.querySelectorAll('[data-bni-total]').forEach(function(el) {
      var cat = el.getAttribute('data-bni-total');
      var subset = cat === 'lending' ? lend : cat === 'kk' ? kk : cat === 'dpk' ? dpk : recs;
      var unit = el.getAttribute('data-bni-unit') || 'M';
      el.textContent = fmt(sum(subset, 'outstanding_m')) + ' ' + unit;
    });

    // Update nasabah counts
    document.querySelectorAll('[data-bni-count]').forEach(function(el) {
      var cat = el.getAttribute('data-bni-count');
      var subset = cat === 'lending' ? lend : cat === 'kk' ? kk : cat === 'dpk' ? dpk : recs;
      el.textContent = subset.length.toLocaleString();
    });
  }

  // ── Router ───────────────────────────────────────
  // Scripts run at end of body — DOM is guaranteed ready
  var path = window.location.href;  // use full href for reliable file:// detection
  try {
    if (path.indexOf('executive') !== -1)            initExecutive();
    else if (path.indexOf('kualitas_kredit') !== -1) initKualitasKredit();
    else                                              initGenericPage();
    console.log('[MI] OK:', path.split('/').pop().split('?')[0]);
  } catch(e) {
    console.error('[MI] Error:', e.message, e.stack);
  }

  // Expose for manual call
  window.MI_INTEGRATION = { initExecutive, initKualitasKredit, initGenericPage };

})();
