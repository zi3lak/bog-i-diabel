/* ============================================================
   BÓG i DIABEŁ — warstwa strony
   - render rozmowy z data/rozmowa.json
   - auto-odswiezanie (strona sama sie odswieza)
   - tlo animowane: wicher, iskry, popiol
   ============================================================ */
'use strict';

const ZRODLO = 'data/rozmowa.json';
const ODSTEP_ODZIEZANIA = 60 * 1000;   // 60 s

let ostatniaTura = -1;
let ostatniaSygnatura = '';

/* ---------------- pomocnicze ---------------- */
const $ = (sel) => document.querySelector(sel);

function bezpieczny(tekst) {
  const d = document.createElement('div');
  d.textContent = tekst == null ? '' : String(tekst);
  return d.innerHTML;
}

/* Zamienia pozostawiona w mowie skladnie markdown na typografie.
   Argument jest juz zescapowany (bezpieczny) — dlatego tylko proste
   podstawianie, bez wstawiania surowego HTML. */
function typografia(html) {
  return html
    // artefakty oryginalnego formatowania: "że‡" (klamka + ligatura),
    // "—" z kreska, bullety i nadmiarowe gwiazdki
    .replace(/‡/g, '')
    .replace(/^[ \t]*[-*•][ \t]+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(„"])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function czytajJSON(url) {
  // cache-busting: strona ma zawsze dostac do aktualnych danych
  const sep = url.includes('?') ? '&' : '?';
  return fetch(url + sep + 't=' + Date.now(), { cache: 'no-store' })
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
}

/* ---------------- tlo: wicher, iskry, popiol ---------------- */
function uruchomTlo() {
  const cv = document.getElementById('tlo');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let w = 0, h = 0, iskry = [], popiol = [];

  const zmianaRozmiaru = () => {
    w = cv.width = window.innerWidth;
    h = cv.height = window.innerHeight;
    const gest = Math.round((w * h) / 26000);
    iskry = Array.from({ length: Math.min(gest, 130) }, () => nowaIskra());
    popiol = Array.from({ length: Math.min(Math.round(gest * 0.7), 90) }, () => nowyPopiol());
  };

  const nowaIskra = () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.5 + 0.35,
    vx: (Math.random() - 0.5) * 0.24,
    vy: -(Math.random() * 0.22 + 0.03),
    zy: 0.006 + Math.random() * 0.016,
    wibr: Math.random() * Math.PI * 2,
    zloto: Math.random() > 0.62,
  });

  const nowyPopiol = () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.1 + 0.25,
    vx: (Math.random() - 0.5) * 0.14,
    vy: (Math.random() * 0.1 + 0.02),
    zy: 0.003 + Math.random() * 0.007,
    wibr: Math.random() * Math.PI * 2,
    przezrocz: 0.10 + Math.random() * 0.22,
  });

  const kres = () => {
    ctx.clearRect(0, 0, w, h);
    // wicher: slabe smugi w powietrzu
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const y = (h / 5) * i + Math.sin(Date.now() / 5200 + i) * 30;
      const g = ctx.createLinearGradient(0, y, w, y + 90);
      g.addColorStop(0, 'rgba(217,164,65,0)');
      g.addColorStop(0.5, 'rgba(217,164,65,0.035)');
      g.addColorStop(1, 'rgba(194,69,31,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, w, 90);
    }
    // iskry (ogień / złoto)
    for (const p of iskry) {
      p.x += p.vx + Math.sin(p.wibr) * 0.16;
      p.y += p.vy;
      p.wibr += 0.035;
      if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
      if (p.x < -6) p.x = w + 6;
      if (p.x > w + 6) p.x = -6;
      const a = Math.max(0, Math.min(0.55, 0.32 * p.zy * 30));
      ctx.fillStyle = p.zloto
        ? 'rgba(240,198,116,' + a + ')'
        : 'rgba(232,102,58,' + a * 0.8 + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // popiół
    for (const p of popiol) {
      p.x += p.vx + Math.sin(p.wibr) * 0.09;
      p.y += p.vy;
      p.wibr += 0.022;
      if (p.y > h + 6) { p.y = -6; p.x = Math.random() * w; }
      if (p.x < -6) p.x = w + 6;
      if (p.x > w + 6) p.x = -6;
      ctx.fillStyle = 'rgba(190,178,168,' + p.przezrocz + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(kres);
  };

  zmianaRozmiaru();
  window.addEventListener('resize', zmianaRozmiaru);
  kres();
}

/* ---------------- render ---------------- */
function renderTure(tury) {
  const lista = $('#lista-tur');
  lista.innerHTML = '';

  if (!tury.length) {
    lista.innerHTML = '<div class="wskaz"><span class="kula"></span> rozmowa jeszcze nie zaczęta</div>';
    return;
  }

  tury.forEach((t) => {
    const art = document.createElement('article');
    const rola = t.rola === 'bog' ? 'bog' : 'diabel';
    art.className = 'tura ' + rola;

    const head = document.createElement('div');
    head.className = 'tura-head';
    head.innerHTML =
      '<span class="mowca ' + rola + '">' + bezpieczny(t.mowca) + '</span>' +
      '<span class="nr-tury">Tura ' + bezpieczny(t.tura) + '</span>' +
      (t.nastroj ? '<span class="nastroj">' + bezpieczny(t.nastroj) + '</span>' : '') +
      '<span class="czas">' + bezpieczny((t.czas || '').replace('T', ' ')) + '</span>';
    art.appendChild(head);

    const mowa = document.createElement('div');
    mowa.className = 'mowa';
    // Cytaty w formacie [plik|ref] „fragment" wycina z tekstu mowy —
    // w mowie mają zostac same slowa, cytat zyje w osobnej sekcji.
    const akapity = (t.mowa || '')
      .replace(/\[[^\]|]+\|[^\]]+\]\s*[„"][^”"]+[”"]/g, '')
      .split(/\n{2,}/)
      .map((s) => s.replace(/[ \t]{2,}/g, ' ').trim())
      .filter((s) => s.length > 0);
    akapity.forEach((p) => {
      const el = document.createElement('p');
      el.innerHTML = typografia(bezpieczny(p.trim()));
      mowa.appendChild(el);
    });
    art.appendChild(mowa);

    if (t.cytaty && t.cytaty.length) {
      const sek = document.createElement('div');
      sek.className = 'cytaty';
      sek.innerHTML = '<h4>Cytowania — ' + t.cytaty.length + '</h4>';
      t.cytaty.forEach((c) => {
        const klasa = c.zweryfikowany
          ? (c.status === 'DOKLADNIE' ? 'ok' : 'bliz')
          : 'zly';
        const znaczka = c.zweryfikowany
          ? (c.status === 'DOKLADNIE' ? 'dokładnie' : 'zbliżenie')
          : 'nie znaleziono';
        const el = document.createElement('blockquote');
        el.className = 'citat ' + klasa;
        el.innerHTML =
          '<span class="frag">„' + bezpieczny(c.fragment) + '”</span>' +
          '<span class="ref">' + bezpieczny(c.plik + ' | ' + c.ref) +
          ' <span class="znaczka">' + znaczka + '</span></span>';
        sek.appendChild(el);
      });
      art.appendChild(sek);
    }

    if (t.sekcje && Object.keys(t.sekcje).length) {
      const sek = document.createElement('div');
      sek.className = 'sekcje';
      Object.keys(t.sekcje).forEach((k) => {
        if (!t.sekcje[k]) return;
        const el = document.createElement('div');
        el.className = 'sekcja';
        el.innerHTML = '<b>' + bezpieczny(k) + '</b>' + bezpieczny(t.sekcje[k]);
        sek.appendChild(el);
      });
      if (sek.children.length) art.appendChild(sek);
    }

    lista.appendChild(art);
  });
}

function renderStatusy(d) {
  $('#s-tura').textContent = d.meta.tura + (d.meta.liczba_tur ? ' / ' + d.meta.liczba_tur : '');
  $('#s-bog').textContent = (d.nastroje && d.nastroje.bog) || '—';
  $('#s-diabel').textContent = (d.nastroje && d.nastroje.diabel) || '—';
  $('#temat').textContent = d.temat || 'rozmowa o ludzkości';

  const ostatnia = d.tury && d.tury.length ? d.tury[d.tury.length - 1] : null;
  $('#s-czas').textContent = ostatnia && ostatnia.czas ? ostatnia.czas.replace('T', ' ') : '—';
  $('#f-stopka').textContent = 'stan na ' + (d.meta.zaktualizowano || '—');
}

function renderWeryfikacje(d) {
  const st = d.meta.cytaty_statusy || {};
  const ok = (st.DOKLADNIE || 0) + (st.ZBLIZENIE || 0);
  const razem = d.meta.liczba_cytow || 0;

  $('#v-ok').textContent = ok + '/' + razem;

  const pct = (n) => (razem ? (n / razem) * 100 : 0);
  const pas = $('#v-pasek').children;
  pas[0].style.width = pct(st.DOKLADNIE || 0) + '%';
  pas[1].style.width = pct(st.ZBLIZENIE || 0) + '%';
  pas[2].style.width = pct((st.NIE_ZNALEZIONO || 0) + (st.CZESCIOWO || 0)) + '%';

  $('#v-legendka').innerHTML =
    '<li><span><i class="k dokladnie"></i>dokładnie co do znaku</span><span>' + (st.DOKLADNIE || 0) + '</span></li>' +
    '<li><span><i class="k zblizenie"></i>treść zgadza się</span><span>' + (st.ZBLIZENIE || 0) + '</span></li>' +
    '<li><span><i class="k nie"></i>nie znaleziono</span><span>' + ((st.NIE_ZNALEZIONO || 0) + (st.CZESCIOWO || 0)) + '</span></li>';

  const ks = d.meta.cytaty_ksiegi || {};
  const sortowane = Object.keys(ks).sort((a, b) => ks[b] - ks[a]).slice(0, 10);
  $('#v-ksiegi').innerHTML = sortowane
    .map((k) => '<li><span class="nazwa">' + bezpieczny(k) + '</span><b>' + ks[k] + '</b></li>')
    .join('');
}

function renderTokeny(d) {
  const t = d.meta.tokeny || {};
  const liczba = (n) => (n || 0).toLocaleString('pl-PL');
  const el = $('#v-tokeny');
  if (!t.tury) {
    el.innerHTML = '<p class="zero">telemetria zacznie się od następnej tury</p>';
    return;
  }
  el.innerHTML =
    '<dl class="metryki">' +
    '<div><dt>wejście</dt><dd>' + liczba(t.input) + '</dd></div>' +
    '<div><dt>wyjście</dt><dd>' + liczba(t.output) + '</dd></div>' +
    '<div><dt>cache odczyt</dt><dd>' + liczba(t.cache_read) + '</dd></div>' +
    '<div><dt>cache zapis</dt><dd>' + liczba(t.cache_write) + '</dd></div>' +
    '<div><dt>razem</dt><dd>' + liczba((t.input || 0) + (t.output || 0)) + '</dd></div>' +
    '<div class="koszt"><dt>koszt</dt><dd>$' + (t.koszt_usd || 0).toFixed(4) + '</dd></div>' +
    '<div><dt>tur z metryką</dt><dd>' + t.tury + '</dd></div>' +
    '</dl>';
}

function renderWatki(d) {
  const ul = $('#s-watki');
  ul.innerHTML = '';
  if (!d.watki || !d.watki.length) {
    ul.innerHTML = '<li style="color:var(--tekst-cichy);font-style:italic">brak otwartych wątków</li>';
    return;
  }
  d.watki.forEach((w) => {
    const li = document.createElement('li');
    li.innerHTML = bezpieczny(w);
    ul.appendChild(li);
  });
}

function renderPamiec(d) {
  $('#p-bog').textContent = (d.pamiec && d.pamiec.bog) || '—';
  $('#p-diabel').textContent = (d.pamiec && d.pamiec.diabel) || '—';
}

/* ---------------- odswiezanie ---------------- */
function odswiez(scisle) {
  return czytajJSON(ZRODLO).then((d) => {
    const sygnatura = JSON.stringify(d.meta) + '|' + (d.tury ? d.tury.length : 0);
    if (!scisle && sygnatura === ostatniaSygnatura) return false;

    ostatniaSygnatura = sygnatura;
    const lad = $('#ladowanie');
    if (lad) lad.remove();

    renderStatusy(d);
    renderWeryfikacje(d);
    renderTokeny(d);
    renderWatki(d);
    renderPamiec(d);

    const nowaTura = d.meta.tura;
    const jestNowa = nowaTura !== ostatniaTura;
    renderTure(d.tury || []);
    ostatniaTura = nowaTura;

    if (jestNowa && !scisle) {
      // nowa tura — przewij do najnowszej
      const ostatniaEl = document.querySelector('#lista-tur .tura:last-child');
      if (ostatniaEl) ostatniaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return true;
  }).catch((e) => {
    const lad = $('#ladowanie');
    if (lad) {
      lad.innerHTML = '<span class="kula"></span> nie mogę dosięgnąć rozmowy: ' + bezpieczny(e.message);
    }
    return false;
  });
}

/* ---------------- start ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  uruchomTlo();
  odswiez(true);
  setInterval(() => odswiez(false), ODSTEP_ODZIEZANIA);

  // klawisz: odwież teraz
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'r' && !ev.metaKey && !ev.ctrlKey && !ev.altKey) odswiez(true);
  });
});
