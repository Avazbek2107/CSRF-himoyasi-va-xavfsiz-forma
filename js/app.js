/* =========================================================
   Ilova mantig'i: marshrutlash, landing, pleyer, progress, testlar
   ========================================================= */
(function () {
  'use strict';
  const { COURSE, CODES, esc } = window.CSRF;
  const app = document.getElementById('app');
  const STORE = 'csrf-course-v1';

  /* ---------- Saqlash (localStorage) ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  let state = Object.assign({ done: {}, quiz: {}, last: null, openSec: {}, theme: null, name: '' }, load());
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } }

  /* ---------- Yordamchi ---------- */
  const allLessons = [];
  COURSE.sections.forEach((s, si) => s.lessons.forEach((l, li) => allLessons.push(Object.assign(l, { sec: s, si, li }))));
  const byId = id => allLessons.find(l => l.id === id);
  const totalMin = allLessons.reduce((a, l) => a + l.dur, 0);
  const quizCount = allLessons.filter(l => l.type === 'quiz').length;
  const fmtDur = m => m >= 60 ? `${Math.floor(m / 60)} soat ${m % 60} daq` : `${m} daq`;
  const doneCount = () => allLessons.filter(l => state.done[l.id]).length;
  const pct = () => Math.round(doneCount() / allLessons.length * 100);
  const chev = `<svg class="chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  const icoFor = l => l.type === 'quiz' ? '❓' : '📄';

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- Mavzu (yorug'/qorong'i) ---------- */
  function applyTheme() {
    const dark = state.theme ? state.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.getElementById('themeBtn').textContent = dark ? '☀' : '☾';
  }
  document.getElementById('themeBtn').addEventListener('click', () => {
    state.theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    save(); applyTheme();
  });
  applyTheme();

  /* =========================================================
     LANDING (kurs sahifasi)
     ========================================================= */
  function renderLanding() {
    document.body.classList.remove('player-mode');
    document.title = COURSE.title;
    const p = pct();
    const lessonsN = allLessons.length;
    const codeN = CODES.length;
    const figN = (allLessons.map(l => l.html || '').join('').match(/class="figure"/g) || []).length;

    app.innerHTML = `
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content">
          <div class="crumbs">IT va dasturlash<span>›</span>Veb-xavfsizlik<span>›</span>CSRF</div>
          <h1>${COURSE.title}</h1>
          <p class="lead">${COURSE.subtitle}</p>
          <div class="meta-row">
            <span class="badge-best">Bestseller</span>
            <span class="rating">4.8 <span class="stars">★★★★★</span></span>
            <a href="#reviews">(1 248 baho)</a>
            <span>5 730 talaba</span>
          </div>
          <div class="meta-row"><span class="muted">Muallif:</span> <a href="#instructor">CSRF Akademiya jamoasi</a></div>
          <div class="hero-meta2">
            <span>🕒 Yangilangan: 11/2026</span><span>🌐 O'zbek tili</span><span>🐍 Python 3.11+</span>
          </div>
          <div class="hero-stats">
            <div><b>${lessonsN}</b><span>dars</span></div>
            <div><b>${figN}</b><span>chizma</span></div>
            <div><b>${codeN}</b><span>kod namunasi</span></div>
            <div><b>${fmtDur(totalMin).replace(' daq', 'd').replace(' soat', 's')}</b><span>davomiylik</span></div>
          </div>
        </div>
      </div>
    </section>

    <div class="layout">
      <div class="main-col">
        <div class="box">
          <h2>Nimalarni o'rganasiz</h2>
          <ul class="learn-grid">
            <li>CSRF hujumi qanday ishlashini va nima uchun xavfli ekanini tushunish</li>
            <li>Synchronizer Token Pattern'ni Python'da noldan yozish</li>
            <li>HMAC bilan imzolangan Double Submit Cookie qurish</li>
            <li>SameSite, Secure, HttpOnly va __Host- cookie sozlamalari</li>
            <li>Origin, Referer va Fetch Metadata sarlavhalarini tekshirish</li>
            <li>Xavfsiz forma: validatsiya, PRG, idempotency, clickjacking himoyasi</li>
            <li>XSS va CSRF bog'liqligi, escaping va Content-Security-Policy</li>
            <li>Flask-WTF, Django va FastAPI'da CSRF himoyasini sozlash</li>
            <li>pytest yordamida CSRF himoyasini avtomatik testlash</li>
            <li>Hujum va himoya algoritmlarini blok-sxema va diagrammalar orqali tahlil qilish</li>
          </ul>
        </div>

        <div class="box" style="border:0;padding:0">
          <h2 class="section-title">Kurs mavzulari</h2>
          <div class="topics">
            ${['CSRF', 'Veb-xavfsizlik', 'Python', 'Flask', 'Django', 'FastAPI', 'OWASP', 'Cookie', 'XSS', 'HTML formalar'].map(t => `<span class="chip">${t}</span>`).join('')}
          </div>
        </div>

        <div class="curr-head">
          <div>
            <h2 class="section-title" style="margin:0 0 6px">Kurs tarkibi</h2>
            <div class="small">${COURSE.sections.length} bo'lim • ${lessonsN} dars • ${fmtDur(totalMin)} umumiy davomiylik</div>
          </div>
          <button class="linkbtn" id="expandAll" type="button">Barcha bo'limlarni ochish</button>
        </div>
        <div class="acc" id="acc">
          ${COURSE.sections.map((s, i) => `
            <div class="acc-sec ${i === 0 ? 'open' : ''}">
              <button type="button" aria-expanded="${i === 0}">${chev}<span>${i + 1}-bo'lim. ${s.title}</span><span class="cnt">${s.lessons.length} dars • ${s.lessons.reduce((a, l) => a + l.dur, 0)} daq</span></button>
              <ul class="acc-list">
                ${s.lessons.map(l => `<li><span>${icoFor(l)}</span><a href="#/learn/${l.id}">${l.title}</a><span class="dur">${state.done[l.id] ? '✓ ' : ''}${l.dur}:00</span></li>`).join('')}
              </ul>
            </div>`).join('')}
        </div>

        <div class="box" style="border:0;padding:0">
          <h2 class="section-title">Talablar</h2>
          <ul class="req">
            <li>HTML formalar va HTTP haqida boshlang'ich tushuncha</li>
            <li>Python asoslari (funksiyalar, lug'atlar, dekoratorlar)</li>
            <li>Kompyuterda Python 3.11+ o'rnatilgan bo'lishi (amaliy mashg'ulotlar uchun)</li>
          </ul>
        </div>

        <div class="box" style="border:0;padding:0">
          <h2 class="section-title">Tavsif</h2>
          <div class="desc">
            <p><b>CSRF (Cross-Site Request Forgery)</b> — veb-ilovalardagi eng "jim" zaifliklardan biri: foydalanuvchi hech narsa sezmaydi, server esa hamma narsani to'g'ri deb hisoblaydi. Bu kursda biz hujumni chuqur tahlil qilamiz va uni to'xtatuvchi barcha zamonaviy usullarni amalda qo'llaymiz.</p>
            <p>Har bir darsda: <b>tushuntirish</b>, <b>algoritm</b> (qadam-baqadam va psevdokod), <b>chizma/diagramma</b> (ketma-ketlik diagrammalari, blok-sxemalar) va <b>Python kodlari</b> (Flask, Django, FastAPI) bor. Har bo'lim oxirida test, kurs oxirida esa yakuniy imtihon va sertifikat.</p>
            <p>Kurs ichida: <b>${codeN}</b> ta kod namunasi, <b>${figN}</b> ta chizma va <b>${quizCount}</b> ta test.</p>
          </div>
        </div>

        <div class="box" style="border:0;padding:0" id="instructor">
          <h2 class="section-title">Muallif</h2>
          <div class="instructor">
            <div class="avatar">CA</div>
            <div>
              <b style="font-size:18px;color:var(--purple)">CSRF Akademiya jamoasi</b>
              <div class="ins-stats">Veb-xavfsizlik va Python bo'yicha amaliyotchilar</div>
              <div class="ins-stats">⭐ 4.8 reyting • 👥 5 730 talaba • ▶ 1 kurs</div>
            </div>
          </div>
        </div>

        <div class="box" style="border:0;padding:0" id="reviews">
          <h2 class="section-title">★ 4.8 kurs reytingi</h2>
          <div class="reviews">
            ${[['DS', 'Dilshod S.', 'Sequence diagrammalar juda tushunarli. Django loyihamda @csrf_exempt larni olib tashladim!'],
               ['MN', 'Madina N.', 'Imzolangan double submit cookie haqida o\'zbek tilida birinchi marta bunday batafsil ma\'lumot o\'qidim.'],
               ['JT', 'Jasur T.', 'pytest bilan CSRF testlash bo\'limi ish joyimda darhol foydali bo\'ldi.'],
               ['NK', 'Nodira K.', 'Interaktiv simulyator va token generatori orqali mavzu oson tushunildi.']]
               .map(([a, n, t]) => `<div class="review"><div class="who"><span class="av">${a}</span><div><b>${n}</b><div class="stars" style="font-size:13px">★★★★★</div></div></div>${t}</div>`).join('')}
          </div>
        </div>
      </div>

      <aside class="side-card">
        <div class="card">
          <a class="preview" href="#/learn" aria-label="Kursni ko'rish">
            <svg viewBox="0 0 320 180" aria-hidden="true">
              <g opacity=".22" fill="none" stroke="#fff" stroke-width="1">${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 22}" x2="320" y2="${i * 22}"/>`).join('')}</g>
              <path d="M160 26 112 44v30c0 28 20 50 48 56 28-6 48-28 48-56V44z" fill="rgba(255,255,255,.14)" stroke="#fff" stroke-width="2"/>
              <text x="24" y="40" fill="#fff" opacity=".7" font-family="monospace" font-size="11">&lt;input type="hidden"</text>
              <text x="24" y="56" fill="#fff" opacity=".7" font-family="monospace" font-size="11">  name="csrf_token"&gt;</text>
            </svg>
            <span class="play"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M7 4v16l13-8z" fill="#1c1d1f"/></svg></span>
            <span class="ptxt">Kursni ko'rib chiqish</span>
          </a>
          <div class="card-body">
            <div class="price">Bepul <s>499 000 so'm</s></div>
            <a class="btn btn-primary btn-block" href="#/learn">${p > 0 ? 'O\'qishni davom ettirish' : 'Kursni boshlash'}</a>
            <a class="btn btn-outline btn-block" href="#/learn/q5">Yakuniy imtihon</a>
            ${p > 0 ? `<div class="progress-mini">Progress: <b>${p}%</b> (${doneCount()}/${lessonsN} dars) • <button class="linkbtn" id="resetBtn" type="button">Qayta boshlash</button></div>` : ''}
            <p class="guar">Brauzerda ishlaydi • ro'yxatdan o'tish shart emas</p>
            <div class="includes">
              <h4>Kurs tarkibida:</h4>
              <ul>
                <li>📄 ${lessonsN - quizCount} ta matnli dars</li>
                <li>⚙️ Har bir darsda algoritm va psevdokod</li>
                <li>🖼️ ${figN} ta SVG chizma va diagramma</li>
                <li>🐍 ${codeN} ta kod namunasi (nusxa olish mumkin)</li>
                <li>❓ ${quizCount} ta test, 🧪 3 ta interaktiv mashq</li>
                <li>🏆 Tugatganlik sertifikati</li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </div>`;

    app.querySelectorAll('.acc-sec > button').forEach(b => b.addEventListener('click', () => {
      const s = b.parentElement; s.classList.toggle('open'); b.setAttribute('aria-expanded', s.classList.contains('open'));
    }));
    const ex = document.getElementById('expandAll');
    ex.addEventListener('click', () => {
      const secs = app.querySelectorAll('.acc-sec');
      const allOpen = [...secs].every(s => s.classList.contains('open'));
      secs.forEach(s => s.classList.toggle('open', !allOpen));
      ex.textContent = allOpen ? 'Barcha bo\'limlarni ochish' : 'Barcha bo\'limlarni yopish';
    });
    const rb = document.getElementById('resetBtn');
    if (rb) rb.addEventListener('click', () => {
      state.done = {}; state.quiz = {}; state.last = null; save(); renderLanding(); toast('Progress tozalandi');
    });
    revealAll('.box, .acc-sec, .review, .curr-head');
    window.scrollTo(0, 0);
  }

  /* Scroll paytida paydo bo'lish animatsiyasi */
  let io = null;
  function revealAll(sel) {
    if (!('IntersectionObserver' in window)) return;
    if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll(sel).forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return;   // ko'rinib turganlar darhol
      el.classList.add('reveal'); io.observe(el);
    });
  }

  /* O'qish progress chizig'i */
  window.addEventListener('scroll', () => {
    const bar = document.getElementById('readBar'); if (!bar) return;
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 0) + '%';
  }, { passive: true });

  /* =========================================================
     PLEYER (dars ko'rish)
     ========================================================= */
  function renderPlayer(id) {
    const l = byId(id) || allLessons[0];
    state.last = l.id; state.openSec[l.sec.id] = true; save();
    document.body.classList.add('player-mode');
    document.title = `${l.title} | ${COURSE.title}`;
    const idx = allLessons.indexOf(l);
    const prev = allLessons[idx - 1], next = allLessons[idx + 1];

    app.innerHTML = `
    <div class="player" id="player">
      <div class="player-head">
        <a href="#/" class="btn btn-ghost-light btn-sm" title="Kurs sahifasiga qaytish">←</a>
        <span class="sep"></span>
        <span class="ctitle">${COURSE.title}</span>
        <span class="ring" id="ring"></span>
        <button class="btn btn-ghost-light btn-sm toggle-side" id="toggleSide" type="button">☰ Mundarija</button>
        <span class="read-bar" id="readBar"></span>
      </div>
      <div class="stage">
        <article class="lesson" id="lesson">
          <div class="lesson-kicker">${l.si + 1}-bo'lim • ${l.sec.title}</div>
          <h1>${l.title}</h1>
          <div class="lesson-meta"><span>${icoFor(l)} ${l.type === 'quiz' ? `${l.questions.length} ta savol` : 'Matnli dars'}</span><span>🕒 ${l.dur} daqiqa</span><span>📍 ${idx + 1} / ${allLessons.length}</span></div>
          ${l.type === 'quiz' ? '' : `<nav class="ltabs" id="ltabs"></nav>`}
          <div id="lessonBody">${l.type === 'quiz' ? renderQuiz(l) : l.html}</div>
          ${l.type === 'quiz' ? '' : `
          <div class="complete-row">
            <label><input type="checkbox" id="doneChk" ${state.done[l.id] ? 'checked' : ''}> Dars tugatildi deb belgilash</label>
          </div>`}
          <div class="lesson-nav">
            ${prev ? `<a class="btn btn-outline" href="#/learn/${prev.id}">← Oldingi</a>` : '<span></span>'}
            ${next ? `<a class="btn btn-primary" href="#/learn/${next.id}" id="nextBtn">Keyingi: ${next.title.length > 34 ? next.title.slice(0, 34) + '…' : next.title} →</a>` : `<a class="btn btn-primary" href="#/">Kurs sahifasiga qaytish</a>`}
          </div>
        </article>
      </div>
      <aside class="sidebar" id="sidebar" aria-label="Kurs mundarijasi">
        <div class="side-title">Kurs tarkibi <button class="linkbtn toggle-side" id="closeSide" type="button">✕</button></div>
        <div id="sideList"></div>
      </aside>
    </div>`;

    renderSidebar(l);
    renderRing();
    buildTabs();
    bindCopy();
    initDemos();
    if (l.type === 'quiz') bindQuiz(l);

    const chk = document.getElementById('doneChk');
    if (chk) chk.addEventListener('change', () => { setDone(l.id, chk.checked); });
    const nb = document.getElementById('nextBtn');
    if (nb && l.type !== 'quiz') nb.addEventListener('click', () => { if (!state.done[l.id]) setDone(l.id, true, true); });

    revealAll('#lessonBody > .figure, #lessonBody > .algo, #lessonBody > .code, #lessonBody > .quiz, #lessonBody > .demo, #lessonBody > table');
    const pl = document.getElementById('player');
    document.getElementById('toggleSide').addEventListener('click', () => pl.classList.toggle('side-open'));
    document.getElementById('closeSide').addEventListener('click', () => pl.classList.remove('side-open'));
    window.scrollTo(0, 0);
  }

  function setDone(id, v, silent) {
    if (v) state.done[id] = Date.now(); else delete state.done[id];
    save(); renderSidebar(byId(id)); renderRing();
    if (!silent) toast(v ? 'Dars tugatildi ✓' : 'Belgi olib tashlandi');
    const c = document.getElementById('doneChk'); if (c) c.checked = !!v;
  }

  function renderRing() {
    const el = document.getElementById('ring'); if (!el) return;
    const p = pct(), r = 15, c = 2 * Math.PI * r;
    el.innerHTML = `<svg width="38" height="38" viewBox="0 0 38 38"><defs><linearGradient id="rg"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><circle cx="19" cy="19" r="${r}" fill="none" stroke="#3e4143" stroke-width="3"/><circle cx="19" cy="19" r="${r}" fill="none" stroke="url(#rg)" stroke-width="3" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" stroke-linecap="round"/></svg><span>Progress: <b>${p}%</b></span>`;
  }

  function renderSidebar(cur) {
    const box = document.getElementById('sideList'); if (!box) return;
    box.innerHTML = COURSE.sections.map((s, i) => {
      const d = s.lessons.filter(l => state.done[l.id]).length;
      const open = state.openSec[s.id] || s.id === cur.sec.id;
      return `<div class="ssec ${open ? 'open' : ''}" data-sec="${s.id}">
        <button type="button"><div class="st"><span>${i + 1}-bo'lim: ${s.title}</span>${chev}</div><div class="ss">${d} / ${s.lessons.length} | ${s.lessons.reduce((a, l) => a + l.dur, 0)} daq</div><div class="sbar"><i style="width:${Math.round(d / s.lessons.length * 100)}%"></i></div></button>
        <ul>${s.lessons.map((l, j) => `<li><a href="#/learn/${l.id}" class="${l.id === cur.id ? 'active' : ''}">
          <span class="chk ${state.done[l.id] ? 'on' : ''}" data-id="${l.id}" role="checkbox" aria-checked="${!!state.done[l.id]}" title="Tugatildi">${state.done[l.id] ? '✓' : ''}</span>
          <span class="ltxt">${j + 1}. ${l.title}<small>${icoFor(l)} ${l.dur} daq${l.type === 'quiz' && state.quiz[l.id] ? ` • natija ${state.quiz[l.id].score}/${state.quiz[l.id].total}` : ''}</small></span></a></li>`).join('')}</ul>
      </div>`;
    }).join('');
    box.querySelectorAll('.ssec > button').forEach(b => b.addEventListener('click', () => {
      const s = b.parentElement; s.classList.toggle('open'); state.openSec[s.dataset.sec] = s.classList.contains('open'); save();
    }));
    box.querySelectorAll('.chk').forEach(c => c.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation(); setDone(c.dataset.id, !state.done[c.dataset.id]);
    }));
    const act = box.querySelector('a.active');
    if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
  }

  /* Dars ichidagi bo'limlar uchun tezkor havolalar (Udemy "Overview" tablari kabi) */
  function buildTabs() {
    const nav = document.getElementById('ltabs'); if (!nav) return;
    const hs = [...document.querySelectorAll('#lessonBody h2')];
    if (hs.length < 2) { nav.remove(); return; }
    nav.innerHTML = hs.map((h, i) => { h.id = 'h-' + i; const t = [...h.childNodes].filter(n => !(n.classList && n.classList.contains('ico'))).map(n => n.textContent).join('').trim(); return `<a href="javascript:void(0)" data-h="${h.id}">${esc(t)}</a>`; }).join('');
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      const t = document.getElementById(a.dataset.h);
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
    }));
  }

  function bindCopy() {
    document.querySelectorAll('.copy-btn').forEach(b => b.addEventListener('click', async () => {
      const txt = CODES[+b.dataset.code];
      try { await navigator.clipboard.writeText(txt); }
      catch (e) {
        const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (_) { /* ignore */ }
        ta.remove();
      }
      b.textContent = 'Nusxa olindi ✓'; b.classList.add('done');
      setTimeout(() => { b.textContent = 'Nusxa olish'; b.classList.remove('done'); }, 1800);
    }));
  }

  /* =========================================================
     TESTLAR
     ========================================================= */
  function renderQuiz(l) {
    const prev = state.quiz[l.id];
    return `
      <p>${l.final ? `Yakuniy imtihon ${l.questions.length} ta savoldan iborat. Sertifikat olish uchun kamida <b>70%</b> to'g'ri javob bering.` : `Bo'lim bo'yicha bilimingizni tekshiring. Har bir savolga javob bering — to'g'ri javob va izoh darhol ko'rsatiladi.`}</p>
      ${prev ? `<div class="callout">Oldingi natijangiz: <b>${prev.score} / ${prev.total}</b>. Qayta topshirishingiz mumkin.</div>` : ''}
      ${l.questions.map((q, i) => `
        <div class="quiz" data-q="${i}">
          <div class="q"><small>${i + 1}-savol / ${l.questions.length}</small>${q.q}</div>
          ${q.o.map((o, j) => `<button class="opt" type="button" data-o="${j}"><span class="mark">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('')}
          <div class="explain"></div>
        </div>`).join('')}
      <div id="quizResult"></div>`;
  }

  function bindQuiz(l) {
    const answers = {};
    document.querySelectorAll('.quiz').forEach(box => {
      const qi = +box.dataset.q, q = l.questions[qi];
      box.querySelectorAll('.opt').forEach(btn => btn.addEventListener('click', () => {
        if (box.classList.contains('answered')) return;
        const j = +btn.dataset.o;
        answers[qi] = j === q.a;
        box.classList.add('answered');
        box.querySelectorAll('.opt').forEach((b, k) => {
          b.disabled = true;
          if (k === q.a) { b.classList.add('correct'); b.querySelector('.mark').textContent = '✓'; }
          else if (k === j) { b.classList.add('wrong'); b.querySelector('.mark').textContent = '✗'; }
        });
        box.querySelector('.explain').innerHTML = `${j === q.a ? '✅ <b>To\'g\'ri!</b>' : '❌ <b>Noto\'g\'ri.</b>'} ${q.e}`;
        if (Object.keys(answers).length === l.questions.length) finishQuiz(l, answers);
      }));
    });
  }

  function finishQuiz(l, answers) {
    const score = Object.values(answers).filter(Boolean).length, total = l.questions.length;
    const p = Math.round(score / total * 100), passed = p >= 70;
    state.quiz[l.id] = { score, total, at: Date.now() };
    if (passed) state.done[l.id] = Date.now();
    save(); renderSidebar(l); renderRing();
    const res = document.getElementById('quizResult');
    res.innerHTML = `
      <div class="quiz-score">
        <span class="big">${p}%</span>
        <div><b>${score} / ${total}</b> ta to'g'ri javob<br>${passed ? 'Ajoyib! Test muvaffaqiyatli topshirildi ✓' : 'O\'tish bali 70%. Darslarni qayta ko\'rib chiqib, yana urinib ko\'ring.'}</div>
        <button class="btn btn-outline btn-sm" id="retry" type="button" style="margin-left:auto">Qayta topshirish</button>
      </div>
      ${l.final && passed ? certificate(p) : ''}`;
    document.getElementById('retry').addEventListener('click', () => renderPlayer(l.id));
    if (l.final && passed) {
      const inp = document.getElementById('certName');
      const upd = () => { document.getElementById('certOut').textContent = inp.value.trim() || 'Ismingiz'; state.name = inp.value; save(); };
      inp.addEventListener('input', upd); upd();
      document.getElementById('printCert').addEventListener('click', () => window.print());
    }
    res.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function certificate(p) {
    const d = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
    return `
      <div class="demo"><div class="row"><label for="certName"><b>Sertifikat uchun ism-familiya:</b></label>
        <input type="text" id="certName" value="${esc(state.name || '')}" placeholder="Ism Familiya" maxlength="60">
        <button class="btn btn-dark btn-sm" id="printCert" type="button">🖨 Chop etish / PDF</button></div></div>
      <div class="cert">
        <div style="font-size:44px">🏆</div>
        <div style="letter-spacing:3px;font-size:13px;color:var(--ink-2)">TUGATGANLIK SERTIFIKATI</div>
        <h2 style="font-size:30px;margin:12px 0" id="certOut"></h2>
        <p>"<b>${COURSE.title}</b>" kursini muvaffaqiyatli tamomladi.<br>Yakuniy imtihon natijasi: <b>${p}%</b></p>
        <p style="color:var(--ink-2);font-size:14px">${d} • CSRF Akademiya</p>
      </div>`;
  }

  /* =========================================================
     INTERAKTIV MASHQLAR
     ========================================================= */
  function initDemos() {
    document.querySelectorAll('[data-demo]').forEach(el => {
      const f = DEMOS[el.dataset.demo]; if (f) f(el);
    });
  }

  const DEMOS = {
    /* 1) CSRF hujumi simulyatori */
    simulator(el) {
      el.innerHTML = `
        <h4>🧪 CSRF hujumi simulyatori</h4>
        <p style="margin:0 0 8px;font-size:14px">bank.uz serveridagi himoya choralarini tanlang va evil.com dan kelgan soxta <code>POST /otkazma</code> so'rovini yuboring.</p>
        <div class="row"><label><input type="checkbox" id="sTok"> CSRF token</label>
          <label><input type="checkbox" id="sSame"> SameSite=Lax cookie</label>
          <label><input type="checkbox" id="sOrig"> Origin tekshiruvi</label>
          <label><input type="checkbox" id="sGet"> Endpoint GET qabul qiladi</label></div>
        <div class="row"><select id="sVec"><option value="form">Yashirin forma (POST)</option><option value="img">&lt;img&gt; tegi (GET)</option><option value="link">Havola bosish (top-level GET)</option></select>
          <button class="btn btn-primary btn-sm" id="sGo" type="button">Hujumni boshlash ▶</button></div>
        <div class="log" id="sLog">Natija shu yerda chiqadi…</div>`;
      el.querySelector('#sGo').addEventListener('click', () => {
        const tok = el.querySelector('#sTok').checked, same = el.querySelector('#sSame').checked,
          orig = el.querySelector('#sOrig').checked, get = el.querySelector('#sGet').checked, vec = el.querySelector('#sVec').value;
        const L = [];
        const method = vec === 'form' ? 'POST' : 'GET';
        L.push(`→ evil.com: ${vec === 'form' ? 'forma avtomatik yuborildi' : vec === 'img' ? '<img src="https://bank.uz/otkazma?to=hacker&summa=5000000">' : 'qurbon havolani bosdi'}`);
        L.push(`→ Brauzer: ${method} https://bank.uz/otkazma`);
        if (method === 'GET' && !get) { L.push('<span class="no">✗ Server: 405 Method Not Allowed — endpoint faqat POST qabul qiladi.</span>'); return out(L, false); }
        const cookieSent = !same || (vec === 'link');
        L.push(cookieSent ? '→ Brauzer: Cookie: sid=a91f… qo\'shildi' : '<span class="ok">→ Brauzer: SameSite=Lax — cross-site so\'rovga cookie qo\'shilmadi</span>');
        if (!cookieSent) { L.push('<span class="ok">✓ Server: sessiya yo\'q → 401. Hujum muvaffaqiyatsiz.</span>'); return out(L, false); }
        if (orig && method === 'POST') { L.push('<span class="ok">✓ Server: Origin: https://evil.com ishonchli ro\'yxatda yo\'q → 403</span>'); return out(L, false); }
        if (orig && method === 'GET') L.push('→ Server: GET so\'rov — Origin tekshiruvi faqat xavfli metodlarga qo\'llanadi');
        if (tok && method === 'POST') { L.push('<span class="ok">✓ Server: csrf_token yo\'q → 403 Forbidden</span>'); return out(L, false); }
        if (tok && method === 'GET') L.push('→ Server: GET uchun token tekshirilmaydi (xavfsiz metod deb hisoblanadi!)');
        L.push('<span class="no">✗ Server: sessiya to\'g\'ri → 5 000 000 so\'m hacker hisobiga o\'tkazildi!</span>');
        out(L, true);
      });
      function out(L, hacked) {
        el.querySelector('#sLog').innerHTML = L.map(x => x.startsWith('<span') ? x : esc(x)).join('\n') + '\n\n' +
          (hacked ? '<span class="no">NATIJA: HUJUM MUVAFFAQIYATLI 💥 — himoyani kuchaytiring.</span>' : '<span class="ok">NATIJA: HUJUM TO\'XTATILDI 🛡️</span>');
      }
    },

    /* 2) Token generatori va HMAC imzo */
    tokengen(el) {
      el.innerHTML = `
        <h4>🧪 CSRF token generatori (brauzerning crypto API'si)</h4>
        <div class="row"><label>Entropiya (bayt): <input type="number" id="tLen" value="32" min="8" max="64" style="width:80px"></label>
          <button class="btn btn-primary btn-sm" id="tGen" type="button">Token yaratish</button>
          <button class="btn btn-outline btn-sm" id="tSign" type="button">HMAC bilan imzolash</button></div>
        <div class="row"><input type="text" id="tCheck" placeholder="Tekshirish uchun tokenni kiriting" style="flex:1;min-width:200px"><button class="btn btn-outline btn-sm" id="tVer" type="button">Solishtirish</button></div>
        <div class="log" id="tLog">secrets.token_urlsafe(32) ga o'xshash token yarating…</div>`;
      let token = '', key = null;
      const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const log = el.querySelector('#tLog');
      el.querySelector('#tGen').addEventListener('click', () => {
        const n = Math.min(64, Math.max(8, +el.querySelector('#tLen').value || 32));
        const b = new Uint8Array(n); crypto.getRandomValues(b); token = b64url(b);
        log.innerHTML = `session["_csrf"] = "${esc(token)}"\n<span class="ok">Uzunlik: ${token.length} belgi • Entropiya: ${n * 8} bit</span>\nTaxmin qilish ehtimoli: 1 / 2^${n * 8}`;
      });
      el.querySelector('#tSign').addEventListener('click', async () => {
        if (!token) { log.innerHTML = '<span class="no">Avval token yarating.</span>'; return; }
        if (!crypto.subtle) { log.innerHTML = '<span class="no">Bu brauzer muhitida Web Crypto mavjud emas (HTTPS kerak).</span>'; return; }
        if (!key) key = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sid = 'a91f3c', rnd = token.slice(0, 22);
        const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${sid}!${rnd}`));
        const hex = [...new Uint8Array(sig)].map(x => x.toString(16).padStart(2, '0')).join('');
        log.innerHTML = `xabar  = "${sid}!${esc(rnd)}"\nimzo   = HMAC-SHA256(K, xabar)\n       = ${hex}\n<span class="ok">token  = ${hex.slice(0, 24)}….${esc(rnd)}</span>`;
      });
      el.querySelector('#tVer').addEventListener('click', () => {
        const v = el.querySelector('#tCheck').value.trim();
        if (!token) { log.innerHTML = '<span class="no">Avval token yarating.</span>'; return; }
        // doimiy vaqtda solishtirish (namuna)
        let diff = v.length ^ token.length;
        for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ (v.charCodeAt(i) || 0);
        log.innerHTML = diff === 0 ? '<span class="ok">✓ compare_digest: token mos — so\'rov qabul qilinadi (200)</span>' : '<span class="no">✗ compare_digest: token mos emas — 403 Forbidden</span>';
      });
    },

    /* 3) HTML escaping */
    escaper(el) {
      el.innerHTML = `
        <h4>🧪 Escaping: xavfli izohni xavfsiz qilish</h4>
        <div class="row"><input type="text" id="eIn" style="flex:1;min-width:220px" value='<img src=x onerror="fetch(&apos;/otkazma&apos;)">Salom'></div>
        <div class="log" id="eOut"></div>
        <p style="font-size:13px;color:var(--ink-2);margin:8px 0 0">Escape qilingan matn brauzerda kod sifatida emas, oddiy matn sifatida ko'rsatiladi — Jinja2'ning <code>{{ }}</code> va Python'ning <code>markupsafe.escape()</code> aynan shunday ishlaydi.</p>`;
      const inp = el.querySelector('#eIn'), out = el.querySelector('#eOut');
      const run = () => {
        const v = inp.value;
        const escaped = v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').replace(/'/g, '&#39;');
        const danger = /<\s*(script|img|svg|iframe)|on\w+\s*=|javascript:/i.test(v);
        out.innerHTML = `Kirish:   ${esc(v)}\nescape(): ${esc(escaped)}\n${danger ? '<span class="no">⚠ Kirishda xavfli HTML/JS aniqlandi — escape qilinmasa XSS bo\'ladi va CSRF token o\'g\'irlanadi.</span>' : '<span class="ok">Xavfli naqsh topilmadi.</span>'}`;
      };
      inp.addEventListener('input', run); run();
    }
  };

  /* =========================================================
     QIDIRUV
     ========================================================= */
  const sIn = document.getElementById('searchInput'), sRes = document.getElementById('searchResults');
  const norm = s => s.toLowerCase().replace(/[‘’ʻʼ`]/g, "'");
  const plain = l => norm(l.title + ' ' + (l.html || '').replace(/<[^>]+>/g, ' '));
  sIn.addEventListener('input', () => {
    const q = norm(sIn.value.trim());
    if (q.length < 2) { sRes.hidden = true; return; }
    const hits = allLessons.filter(l => plain(l).includes(q)).slice(0, 8);
    sRes.innerHTML = hits.length ? hits.map(l => `<a href="#/learn/${l.id}">${l.title}<small>${l.si + 1}-bo'lim • ${l.sec.title}</small></a>`).join('') : `<a href="javascript:void(0)">Hech narsa topilmadi</a>`;
    sRes.hidden = false;
  });
  sRes.addEventListener('click', () => { sRes.hidden = true; sIn.value = ''; });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) sRes.hidden = true; });

  /* =========================================================
     MARSHRUTLASH
     ========================================================= */
  function route() {
    const h = location.hash;
    let m;
    if ((m = h.match(/^#\/learn\/([\w-]+)/))) renderPlayer(m[1]);
    else if (h.startsWith('#/learn')) renderPlayer(state.last || allLessons[0].id);
    else if (h === '' || h === '#/' || h === '#') renderLanding();
    else if (!document.querySelector('.hero')) renderLanding();     // #reviews va h.k.
  }
  window.addEventListener('hashchange', route);
  route();
})();
