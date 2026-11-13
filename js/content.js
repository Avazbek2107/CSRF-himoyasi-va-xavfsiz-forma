/* =========================================================
   CSRF himoyasi va xavfsiz forma yaratish — kurs kontenti
   Yordamchi funksiyalar + 1-2 bo'limlar
   ========================================================= */
(function (G) {
  'use strict';

  /* ---------- HTML escaping ---------- */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- Syntax highlighter (Python / HTML / JS / Bash / Text) ---------- */
  const PY_KW = 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' ');
  const PY_BI = 'print len str int float dict list set tuple bool bytes range open isinstance hasattr getattr setattr super type object Exception ValueError KeyError TypeError abs min max sum any all sorted enumerate zip map filter repr hex'.split(' ');
  const JS_KW = 'const let var function return if else for while do new this class extends import export from default async await try catch finally throw typeof instanceof of in null undefined true false switch case break continue'.split(' ');
  const JS_BI = 'document window fetch console JSON Promise Array Object String Number Math crypto Headers FormData URLSearchParams'.split(' ');

  function hlGeneric(src, kw, bi, opts) {
    const rules = [];
    if (opts.py) {
      rules.push(['com', /#[^\n]*/y]);
      rules.push(['str', /[rbfuRBFU]{0,2}("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y]);
      rules.push(['dec', /@[\w.]+/y]);
    } else if (opts.sh) {
      rules.push(['com', /#[^\n]*/y]);
      rules.push(['str', /"(?:\\.|[^"\\])*"|'[^']*'/y]);
    } else {
      rules.push(['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y]);
      rules.push(['str', /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y]);
    }
    rules.push(['num', /\b\d+(?:\.\d+)?\b/y]);
    rules.push(['id', /[A-Za-z_$][\w$]*/y]);
    let out = '', i = 0, prev = '';
    while (i < src.length) {
      let m = null, kind = null;
      for (const [k, re] of rules) { re.lastIndex = i; const r = re.exec(src); if (r) { m = r[0]; kind = k; break; } }
      if (!m) { out += esc(src[i]); i++; continue; }
      if (kind === 'id') {
        let cls = '';
        if (kw.includes(m)) cls = 'kw';
        else if (opts.py && (m === 'self' || m === 'cls')) cls = 'self';
        else if (bi.includes(m)) cls = 'bi';
        else if (prev === 'def' || prev === 'function') cls = 'fn';
        else if (prev === 'class') cls = 'cls';
        else if (src[i + m.length] === '(') cls = 'fn';
        else if (/^[A-Z][a-z]/.test(m) && opts.py) cls = 'cls';
        out += cls ? `<span class="tok-${cls}">${esc(m)}</span>` : esc(m);
        prev = m;
      } else {
        out += `<span class="tok-${kind}">${esc(m)}</span>`;
      }
      i += m.length;
    }
    return out;
  }
  function hlHtml(src) {
    let out = '', i = 0;
    const re = /<!--[\s\S]*?-->|\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|<\/?[\w-]+|\/?>|[\w-:]+(?==)|"[^"]*"|'[^']*'/y;
    while (i < src.length) {
      re.lastIndex = i; const r = re.exec(src);
      if (!r) { out += esc(src[i]); i++; continue; }
      const m = r[0]; let cls = 'attr';
      if (m.startsWith('<!--')) cls = 'com';
      else if (m.startsWith('{{') || m.startsWith('{%')) cls = 'dec';
      else if (m.startsWith('<') || m.endsWith('>')) cls = 'tag';
      else if (m[0] === '"' || m[0] === "'") cls = 'str';
      out += `<span class="tok-${cls}">${esc(m)}</span>`;
      i += m.length;
    }
    return out;
  }
  function highlight(src, lang) {
    if (lang === 'python') return hlGeneric(src, PY_KW, PY_BI, { py: true });
    if (lang === 'javascript') return hlGeneric(src, JS_KW, JS_BI, {});
    if (lang === 'bash') return hlGeneric(src, ['curl', 'pip', 'python', 'export', 'pytest', 'django-admin'], [], { sh: true });
    if (lang === 'html') return hlHtml(src);
    return esc(src);
  }

  /* ---------- Content blocks ---------- */
  const CODES = [];
  let figN = 0;

  const B = {
    p: html => `<p>${html}</p>`,
    h: (t, ico) => `<h2>${ico ? `<span class="ico">${ico}</span>` : ''}${t}</h2>`,
    h3: t => `<h3>${t}</h3>`,
    ul: items => `<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>`,
    ol: items => `<ol>${items.map(x => `<li>${x}</li>`).join('')}</ol>`,
    note: (html, kind) => `<div class="callout ${kind || ''}">${html}</div>`,
    table: (head, rows) => `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
    demo: id => `<div class="demo" data-demo="${id}"></div>`,

    /* Algorithm: numbered steps + optional pseudocode */
    algo(title, steps, pseudo) {
      let h = `<div class="algo"><div class="algo-head">⚙️ Algoritm: ${title}</div><ol class="steps">${steps.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
      if (pseudo) h += B.code('text', 'psevdokod.txt', pseudo);
      return h;
    },

    /* Code block with highlighting & copy button */
    code(lang, file, src) {
      src = src.replace(/^\n+|\s+$/g, '');
      const idx = CODES.push(src) - 1;
      const lines = highlight(src, lang).split('\n');
      const body = lines.map((l, n) => `<span class="ln-no">${n + 1}</span>${l}`).join('\n');
      const label = { python: 'Python', html: 'HTML / Jinja', javascript: 'JavaScript', bash: 'Terminal', text: 'Psevdokod' }[lang] || lang;
      return `<div class="code"><div class="code-head"><span class="dots"><i></i><i></i><i></i></span><span>${esc(file)}</span><span class="lang">${label}</span><button class="copy-btn" type="button" data-code="${idx}">Nusxa olish</button></div><pre><code>${body}</code></pre></div>`;
    },

    /* Figure wrapper. Markers: url(#A) default, url(#AG) good, url(#AB) bad, url(#AA) accent */
    fig(vb, inner, caption) {
      const n = ++figN;
      const mk = (id, cls) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" class="${cls}" style="fill:${cls === 't' ? 'var(--d-stroke)' : ''}"/></marker>`;
      const defs = `<defs>${mk('m' + n, 't')}${mk('m' + n + 'g', 'good')}${mk('m' + n + 'b', 'bad')}${mk('m' + n + 'a', 'acc')}</defs>`;
      inner = inner.replace(/url\(#A(G|B|A)?\)/g, (_, k) => `url(#m${n}${k ? k.toLowerCase() : ''})`);
      return `<figure class="figure"><div class="fig-svg"><svg viewBox="${vb}" role="img" aria-label="${esc(caption.replace(/<[^>]+>/g, ''))}" xmlns="http://www.w3.org/2000/svg">${defs}${inner}</svg></div><figcaption>${caption}</figcaption></figure>`;
    },

    /* Sequence diagram generator */
    seq(actors, steps, caption) {
      const W = 760, top = 20, boxH = 50, rowH = 46;
      const colW = W / actors.length;
      const cx = i => colW * i + colW / 2;
      const H = top + boxH + 24 + steps.length * rowH + 20;
      let s = '';
      actors.forEach((a, i) => {
        const bw = Math.min(colW - 24, 190);
        s += `<rect class="${a.cls || 'box'}" x="${cx(i) - bw / 2}" y="${top}" width="${bw}" height="${boxH}" rx="8"/>`;
        s += `<text class="tb" x="${cx(i)}" y="${top + (a.sub ? 22 : 30)}" text-anchor="middle">${a.name}</text>`;
        if (a.sub) s += `<text class="tm" x="${cx(i)}" y="${top + 39}" text-anchor="middle">${a.sub}</text>`;
        s += `<line class="ln-d" x1="${cx(i)}" y1="${top + boxH}" x2="${cx(i)}" y2="${H - 10}"/>`;
      });
      steps.forEach((st, k) => {
        const y = top + boxH + 40 + k * rowH;
        if (st.note !== undefined) {
          const x1 = cx(Math.min(...st.at)) - 70, x2 = cx(Math.max(...st.at)) + 70;
          const cls = st.k === 'bad' ? 'box-bad' : st.k === 'good' ? 'box-good' : 'box-acc';
          s += `<rect class="${cls}" x="${Math.max(4, x1)}" y="${y - 20}" width="${Math.min(W - 8, x2) - Math.max(4, x1)}" height="30" rx="6"/>`;
          s += `<text class="t" x="${(Math.max(4, x1) + Math.min(W - 8, x2)) / 2}" y="${y}" text-anchor="middle">${st.note}</text>`;
          return;
        }
        st.l = String(st.l).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const x1 = cx(st.f), x2 = cx(st.t);
        const ln = st.k === 'bad' ? 'ln-bad' : st.k === 'good' ? 'ln-good' : st.k === 'acc' ? 'ln-acc' : 'ln';
        const mk = st.k === 'bad' ? 'AB' : st.k === 'good' ? 'AG' : st.k === 'acc' ? 'AA' : 'A';
        if (st.f === st.t) {
          const left = x1 > W * 0.6, dir = left ? -1 : 1;
          s += `<path class="${ln}" d="M${x1} ${y - 4} h${40 * dir} v16 h${-36 * dir}" marker-end="url(#${mk})"/>`;
          s += `<text class="t" x="${x1 + 48 * dir}" y="${y + 8}" text-anchor="${left ? 'end' : 'start'}">${st.l}</text>`;
        } else {
          s += `<line class="${ln}" x1="${x1}" y1="${y + 6}" x2="${x2 + (x2 > x1 ? -3 : 3)}" y2="${y + 6}" ${st.d ? 'stroke-dasharray="6 4"' : ''} marker-end="url(#${mk})"/>`;
          s += `<text class="t" x="${(x1 + x2) / 2}" y="${y - 2}" text-anchor="middle">${st.l}</text>`;
        }
        if (st.n) s += `<circle cx="${Math.min(x1, x2) - 16}" cy="${y + 6}" r="9" class="${st.k === 'bad' ? 'bad' : 'acc'}"/><text x="${Math.min(x1, x2) - 16}" y="${y + 10}" text-anchor="middle" style="fill:#fff;font:700 11px var(--font)">${st.n}</text>`;
      });
      return B.fig(`0 0 ${W} ${H}`, s, caption);
    },

    /* Vertical flowchart generator (start / proc / dec / end) */
    flow(nodes, caption) {
      const W = 700, cx = 260, bw = 300, gap = 26;
      let y = 16, s = '';
      const heights = { start: 40, end: 40, bad: 40, proc: 46, dec: 64 };
      nodes.forEach((n, i) => {
        const h = heights[n.t];
        if (n.t === 'dec') {
          s += `<path class="box-acc" d="M${cx} ${y} L${cx + bw / 2 + 20} ${y + h / 2} L${cx} ${y + h} L${cx - bw / 2 - 20} ${y + h / 2} Z"/>`;
          s += `<text class="t" x="${cx}" y="${y + h / 2 + 4}" text-anchor="middle">${n.text}</text>`;
          // "No" branch to the right
          const rx = cx + bw / 2 + 20;
          const g = n.nok === 'good';
          s += `<line class="${g ? 'ln-good' : 'ln-bad'}" x1="${rx}" y1="${y + h / 2}" x2="${rx + 74}" y2="${y + h / 2}" marker-end="url(#${g ? 'AG' : 'AB'})"/>`;
          s += `<text class="tm" x="${rx + 14}" y="${y + h / 2 - 6}">Yo'q</text>`;
          s += `<rect class="${g ? 'box-good' : 'box-bad'}" x="${rx + 78}" y="${y + h / 2 - 20}" width="${W - rx - 86}" height="40" rx="6"/>`;
          s += `<text class="t" x="${(rx + 78 + W - 8) / 2}" y="${y + h / 2 + 4}" text-anchor="middle">${n.no}</text>`;
        } else {
          const cls = n.t === 'start' ? 'box-acc' : n.t === 'end' ? 'box-good' : n.t === 'bad' ? 'box-bad' : 'box';
          const r = (n.t === 'start' || n.t === 'end' || n.t === 'bad') ? 20 : 6;
          s += `<rect class="${cls}" x="${cx - bw / 2}" y="${y}" width="${bw}" height="${h}" rx="${r}"/>`;
          s += `<text class="t" x="${cx}" y="${y + h / 2 + 4}" text-anchor="middle">${n.text}</text>`;
        }
        if (i < nodes.length - 1) {
          s += `<line class="ln" x1="${cx}" y1="${y + h}" x2="${cx}" y2="${y + h + gap - 2}" marker-end="url(#A)"/>`;
          if (n.t === 'dec') s += `<text class="tm" x="${cx + 8}" y="${y + h + 16}">Ha</text>`;
        }
        y += h + gap;
      });
      return B.fig(`0 0 ${W} ${y - gap + 16}`, s, caption);
    }
  };

  /* ---------- Course model ---------- */
  const COURSE = {
    title: `CSRF himoyasi va xavfsiz forma yaratish`,
    subtitle: `Cross-Site Request Forgery hujumlarini chuqur tushuning va Python (Flask, Django, FastAPI) yordamida xavfsiz veb-formalar yarating: algoritmlar, chizmalar va amaliy kodlar bilan.`,
    sections: []
  };

  G.CSRF = { B, COURSE, CODES, esc, highlight };
})(window);

/* =========================================================
   1-BO'LIM. Kirish: CSRF asoslari
   ========================================================= */
(function () {
  const { B, COURSE } = window.CSRF;

  COURSE.sections.push({
    id: 's1',
    title: `Kirish: veb asoslari va CSRF tushunchasi`,
    lessons: [
      /* ---------------- 1.1 ---------------- */
      {
        id: 'l1-1', title: `HTTP, cookie va sessiya: CSRF uchun zarur poydevor`, dur: 12,
        html: [
          B.p(`CSRF hujumini tushunish uchun avvalo brauzer va server qanday "gaplashishini" bilish kerak. HTTP protokoli <b>holatsiz</b> (stateless): har bir so'rov alohida, server oldingi so'rovni "eslab qolmaydi". Foydalanuvchi tizimga kirganini eslab qolish uchun server <b>sessiya</b> yaratadi va uning identifikatorini <b>cookie</b> orqali brauzerga beradi.`),
          B.h(`Asosiy tushunchalar`, '📘'),
          B.table([`Tushuncha`, `Ma'nosi`, `CSRF bilan bog'liqligi`], [
            [`<b>Cookie</b>`, `Server <code>Set-Cookie</code> sarlavhasi orqali brauzerga saqlatadigan kichik ma'lumot`, `Brauzer uni shu domenga ketayotgan har bir so'rovga <b>avtomatik</b> qo'shadi`],
            [`<b>Sessiya</b>`, `Serverdagi foydalanuvchi holati (kim kirgan, savatcha va h.k.)`, `Sessiya ID cookie'da bo'lgani uchun so'rov "autentifikatsiyalangan" bo'lib qoladi`],
            [`<b>GET / POST</b>`, `GET - ma'lumot olish, POST - holatni o'zgartirish`, `Holatni o'zgartiruvchi so'rovlar CSRF nishoni bo'ladi`],
            [`<b>Origin</b>`, `Sxema + domen + port (masalan <code>https://bank.uz:443</code>)`, `Himoyada so'rov qayerdan kelganini aniqlashda ishlatiladi`],
            [`<b>Same-site</b>`, `Bir xil ro'yxatdan o'tgan domen (eTLD+1), masalan <code>a.bank.uz</code> va <code>b.bank.uz</code>`, `SameSite cookie qoidasi shunga asoslanadi`]
          ]),
          B.h(`Sessiya qanday ishlaydi: chizma`, '🖼️'),
          B.seq(
            [{ name: `Brauzer`, sub: `foydalanuvchi` }, { name: `bank.uz`, sub: `veb-server`, cls: 'box-acc' }],
            [
              { f: 0, t: 1, l: `POST /login (login, parol)`, n: 1 },
              { f: 1, t: 1, l: `sessiya yaratish: sid=a91f…` },
              { f: 1, t: 0, l: `Set-Cookie: sid=a91f…; HttpOnly; Secure`, d: true, k: 'acc', n: 2 },
              { f: 0, t: 1, l: `GET /hisob   Cookie: sid=a91f…`, n: 3 },
              { f: 1, t: 0, l: `200 OK: "Salom, Avaz!"`, d: true },
              { note: `Brauzer cookie'ni har safar O'ZI qo'shadi — foydalanuvchi buni sezmaydi`, at: [0, 1], k: 'bad' }
            ],
            `<b>1-rasm.</b> Cookie asosidagi sessiya. 3-qadamda brauzer cookie'ni avtomatik yuboradi — CSRF aynan shu xususiyatdan foydalanadi.`
          ),
          B.h(`Algoritm: brauzer cookie'ni qachon qo'shadi?`, '⚙️'),
          B.algo(`So'rovga cookie biriktirish (soddalashtirilgan)`, [
            `Brauzer yangi HTTP so'rov tayyorlaydi (havola, forma, <code>&lt;img&gt;</code>, <code>fetch</code> va h.k.).`,
            `So'rovning maqsad domeni va yo'li aniqlanadi.`,
            `Cookie bazasidan shu domen/yo'lga mos, muddati o'tmagan cookie'lar tanlanadi.`,
            `Har bir cookie uchun <code>Secure</code> (faqat HTTPS) va <code>SameSite</code> qoidalari tekshiriladi.`,
            `Shartlardan o'tgan cookie'lar <code>Cookie:</code> sarlavhasiga qo'shiladi — <b>so'rovni qaysi sayt boshlaganidan qat'i nazar</b> (SameSite yo'q bo'lsa).`
          ], `FUNKSIYA cookie_qosh(sorov):
    natija = []
    HAR BIR c IN cookie_bazasi:
        AGAR c.domen mos(sorov.url) VA c.muddati_otmagan:
            AGAR c.secure VA sorov.sxema != "https": DAVOM_ET
            AGAR samesite_ruxsat_bermaydi(c, sorov): DAVOM_ET
            natija.qosh(c)
    sorov.sarlavha["Cookie"] = birlashtir(natija)
    QAYTAR sorov`),
          B.h(`Python: minimal sessiyali Flask ilovasi`, '🐍'),
          B.p(`Quyidagi kod oddiy login va "hisob" sahifasini ko'rsatadi. Hozircha unda <b>hech qanday CSRF himoyasi yo'q</b> — keyingi darslarda shu ilovani bosqichma-bosqich himoyalaymiz.`),
          B.code('bash', 'terminal', `pip install flask
python app.py`),
          B.code('python', 'app.py', String.raw`
from flask import Flask, session, request, redirect, url_for
import secrets

app = Flask(__name__)
# Sessiya cookie'sini imzolash uchun maxfiy kalit (har doim tasodifiy va maxfiy!)
app.config["SECRET_KEY"] = secrets.token_hex(32)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,   # JavaScript cookie'ni o'qiy olmaydi
    SESSION_COOKIE_SECURE=False,    # ishlab chiqarishda True (faqat HTTPS)
)

USERS = {"avaz": "parol123"}  # faqat namuna uchun!

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = request.form.get("username", "")
        if USERS.get(user) == request.form.get("password"):
            session.clear()
            session["user"] = user          # sessiyaga yozamiz
            return redirect(url_for("account"))
        return "Login yoki parol xato", 401
    return """
        <form method="post">
          <input name="username" placeholder="Login">
          <input name="password" type="password" placeholder="Parol">
          <button>Kirish</button>
        </form>"""

@app.route("/hisob")
def account():
    user = session.get("user")
    if not user:
        return redirect(url_for("login"))
    return f"Salom, {user}! Siz tizimdasiz."

if __name__ == "__main__":
    app.run(debug=True)
`),
          B.note(`<b>Muhim xulosa</b>Server so'rovni kim yuborganini faqat cookie orqali biladi. Agar boshqa sayt brauzerni bank.uz ga so'rov yuborishga "majburlasa", brauzer cookie'ni baribir qo'shadi va server uni haqiqiy foydalanuvchi so'rovi deb qabul qiladi. Bu — CSRF'ning mohiyati.`, 'warn')
        ].join('')
      },

      /* ---------------- 1.2 ---------------- */
      {
        id: 'l1-2', title: `CSRF nima va nima uchun xavfli?`, dur: 14,
        html: [
          B.p(`<b>CSRF (Cross-Site Request Forgery)</b> — saytlararo so'rovni soxtalashtirish. Bu hujumda yovuz niyatli sayt foydalanuvchining brauzeridan foydalanib, u allaqachon tizimga kirgan boshqa saytga (masalan, bank yoki ijtimoiy tarmoq) <b>foydalanuvchi bilmagan holda</b> so'rov yuboradi. Server so'rovni haqiqiy deb hisoblaydi, chunki unda foydalanuvchining sessiya cookie'si bor.`),
          B.note(`<b>Oddiy tilda</b>CSRF — bu "sizning nomingizdan imzo qo'yish". Hujumchi sizning parolingizni bilmaydi, lekin sizning brauzeringiz uning o'rniga "imzo" (cookie) qo'yib beradi.`),
          B.h(`Hujumning uch ishtirokchisi`, '🖼️'),
          B.fig('0 0 760 300', `
            <rect class="box" x="290" y="20" width="180" height="70" rx="10"/>
            <text class="tb" x="380" y="50" text-anchor="middle">👤 Qurbon</text>
            <text class="tm" x="380" y="70" text-anchor="middle">bank.uz ga kirgan</text>
            <rect class="box-good" x="40" y="200" width="200" height="74" rx="10"/>
            <text class="tb" x="140" y="230" text-anchor="middle">🏦 bank.uz</text>
            <text class="tm" x="140" y="250" text-anchor="middle">ishonchli sayt (nishon)</text>
            <rect class="box-bad" x="520" y="200" width="200" height="74" rx="10"/>
            <text class="tb" x="620" y="230" text-anchor="middle">😈 evil.com</text>
            <text class="tm" x="620" y="250" text-anchor="middle">hujumchi sayti</text>
            <path class="ln" d="M300 88 Q200 120 160 196" marker-end="url(#A)"/>
            <text class="t" x="60" y="130">① tizimga kiradi</text>
            <text class="tm" x="60" y="146">cookie: sid=a91f…</text>
            <path class="ln" d="M460 88 Q560 120 600 196" marker-end="url(#A)"/>
            <text class="t" x="585" y="130">② evil.com ni ochadi</text>
            <path class="ln-bad" d="M516 240 L246 240" marker-end="url(#AB)"/>
            <text class="t" x="381" y="228" text-anchor="middle" style="fill:var(--d-bad);font-weight:700">③ soxta so'rov + qurbonning cookie'si</text>
            <text class="tm" x="381" y="262" text-anchor="middle">POST /otkazma  to=hacker&amp;summa=5 000 000</text>
          `, `<b>2-rasm.</b> CSRF uchburchagi: qurbon, ishonchli sayt va hujumchi sayti. Soxta so'rov qurbonning brauzeridan ketadi.`),
          B.h(`CSRF muvaffaqiyatli bo'lishi uchun shartlar`, '✅'),
          B.ol([
            `<b>Muhim harakat mavjud:</b> pul o'tkazish, e-mail/parolni o'zgartirish, xabar yuborish, akkauntni o'chirish.`,
            `<b>Faqat cookie'ga tayanilgan autentifikatsiya:</b> server foydalanuvchini faqat avtomatik yuboriladigan ma'lumot (cookie, HTTP Basic auth, klient sertifikat) orqali taniydi.`,
            `<b>Oldindan bilinadigan parametrlar:</b> so'rovdagi barcha qiymatlarni hujumchi oldindan bilishi mumkin (masalan, eski parol so'ralmaydi).`
          ]),
          B.p(`Agar uchala shartdan birortasi buzilsa, CSRF ishlamaydi. Barcha himoya usullari aynan shu shartlardan birini buzishga qaratilgan: masalan, <b>CSRF token</b> 3-shartni (hujumchi tokenni bilmaydi), <b>SameSite</b> esa 2-shartni buzadi.`),
          B.flow([
            { t: 'start', text: `So'rov serverga keldi` },
            { t: 'dec', text: `Holatni o'zgartiradimi?`, no: `CSRF xavfi past (GET/HEAD)`, nok: 'good' },
            { t: 'dec', text: `Cookie bilan autentifikatsiyami?`, no: `CSRF mumkin emas (Bearer)`, nok: 'good' },
            { t: 'dec', text: `Himoya (token/SameSite) yo'qmi?`, no: `Hujum to'xtatiladi`, nok: 'good' },
            { t: 'bad', text: `⚠️ CSRF ga zaif!` }
          ], `<b>3-rasm.</b> Endpoint CSRF ga zaifligini aniqlash algoritmi (blok-sxema).`),
          B.algo(`Endpoint zaifligini baholash`, [
            `Endpoint serverda holatni o'zgartiradimi (yozish, o'chirish, to'lov)? Yo'q bo'lsa — xavf past.`,
            `Foydalanuvchi qanday aniqlanadi? Faqat cookie bo'lsa — keyingi qadamga o'ting.`,
            `So'rovda hujumchi bilmaydigan maxfiy qiymat (CSRF token, joriy parol) bormi?`,
            `Sessiya cookie'sida <code>SameSite=Lax/Strict</code> o'rnatilganmi va Origin tekshiriladimi?`,
            `Agar 3 va 4-qadamlar "yo'q" bo'lsa — endpoint CSRF'ga zaif deb belgilanadi.`
          ]),
          B.h(`Python: zaif endpoint namunasi`, '🐍'),
          B.code('python', 'zaif_bank.py', String.raw`
from flask import Flask, session, request, abort

app = Flask(__name__)
app.config["SECRET_KEY"] = "dev-only"

BALANCE = {"avaz": 10_000_000, "hacker": 0}

@app.post("/otkazma")
def transfer():
    user = session.get("user")
    if not user:
        abort(401)
    to = request.form["to"]
    amount = int(request.form["summa"])
    # ❌ ZAIFLIK: so'rov qaysi saytdan kelgani tekshirilmaydi,
    #    CSRF token yo'q, cookie esa avtomatik keladi.
    BALANCE[user] -= amount
    BALANCE[to] = BALANCE.get(to, 0) + amount
    return f"{amount} so'm {to} ga o'tkazildi"
`),
          B.h(`CSRF oqibatlari`, '💥'),
          B.table([`Sayt turi`, `Mumkin bo'lgan zarar`], [
            [`Bank / to'lov`, `Pul o'tkazish, karta qo'shish, limitni o'zgartirish`],
            [`Ijtimoiy tarmoq`, `Post yozish, do'st qo'shish, maxfiylik sozlamalarini o'zgartirish`],
            [`Admin panel`, `Yangi admin yaratish — butun tizimni egallash`],
            [`Router / IoT`, `DNS sozlamasini o'zgartirish (<code>192.168.1.1</code> ga so'rov)`],
            [`Har qanday sayt`, `E-mailni o'zgartirish → parolni tiklash → akkauntni o'g'irlash`]
          ]),
          B.note(`<b>OWASP</b>CSRF uzoq yillar OWASP Top 10 ro'yxatida alohida o'rinda bo'lgan. Hozir u "Broken Access Control" toifasiga kiritilgan — ya'ni muammo yo'qolmagan, balki kengroq toifaning bir qismiga aylangan.`, 'warn')
        ].join('')
      },

      /* ---------------- 1.3 ---------------- */
      {
        id: 'l1-3', title: `CSRF hujumi qanday amalga oshiriladi: bosqichma-bosqich`, dur: 16,
        html: [
          B.p(`Endi hujumchi nuqtai nazaridan qaraymiz. Maqsad — hujumni tushunish orqali to'g'ri himoya qurish. Quyidagi misollar faqat o'z test muhitingizda o'rganish uchun.`),
          B.h(`Hujum ketma-ketligi (sequence diagram)`, '🖼️'),
          B.seq(
            [{ name: `Qurbon brauzeri`, sub: `sid cookie bor` }, { name: `evil.com`, sub: `hujumchi`, cls: 'box-bad' }, { name: `bank.uz`, sub: `zaif server`, cls: 'box-good' }],
            [
              { f: 0, t: 2, l: `Login → Set-Cookie: sid=a91f`, n: 1 },
              { f: 0, t: 1, l: `Havolani bosadi: evil.com/sovga`, n: 2 },
              { f: 1, t: 0, l: `Yashirin forma + auto-submit JS`, d: true, k: 'bad', n: 3 },
              { f: 0, t: 2, l: `POST /otkazma  Cookie: sid=a91f`, k: 'bad', n: 4 },
              { f: 2, t: 2, l: `sessiya to'g'ri ✓ → bajaradi` },
              { f: 2, t: 0, l: `200 OK "o'tkazildi"`, d: true },
              { note: `Qurbon hech narsa sezmaydi — javob yashirin iframe'da`, at: [0, 2], k: 'bad' }
            ],
            `<b>4-rasm.</b> Klassik POST-CSRF hujumining ketma-ketlik diagrammasi.`
          ),
          B.algo(`Hujumchi qadamlari`, [
            `<b>Razvedka:</b> nishon saytdagi muhim harakatning so'rovini o'rganish (URL, metod, parametrlar).`,
            `<b>Tekshirish:</b> so'rovda oldindan bilib bo'lmaydigan qiymat (token) yo'qligiga ishonch hosil qilish.`,
            `<b>Yuk tayyorlash:</b> shu so'rovni takrorlaydigan HTML sahifa yaratish (forma, <code>&lt;img&gt;</code> yoki <code>fetch</code>).`,
            `<b>Yetkazish:</b> qurbonni sahifaga jalb qilish (e-mail, chat, reklama, forum posti).`,
            `<b>Ishga tushirish:</b> sahifa ochilganda forma avtomatik yuboriladi, brauzer cookie qo'shadi.`,
            `<b>Natija:</b> server so'rovni bajaradi; javobni hujumchi o'qiy olmaydi (Same-Origin Policy), lekin harakat allaqachon bajarilgan.`
          ]),
          B.h(`Hujumchi sahifasi (HTML)`, '💻'),
          B.code('html', 'evil.com/sovga.html', `
<!-- Qurbon bu sahifani ochishi bilan hujum boshlanadi -->
<h1>Tabriklaymiz! Siz sovg'a yutdingiz 🎁</h1>

<iframe name="yashirin" style="display:none"></iframe>

<form id="f" action="https://bank.uz/otkazma" method="POST" target="yashirin">
  <input type="hidden" name="to" value="hacker">
  <input type="hidden" name="summa" value="5000000">
</form>

<script>
  document.getElementById("f").submit();   // avtomatik yuborish
</script>`),
          B.note(`<b>E'tibor bering</b>Hujumchi javobni o'qiy olmaydi — Same-Origin Policy bunga yo'l qo'ymaydi. Lekin CSRF uchun bu shart emas: so'rov serverga yetib borib, bajarilsa kifoya. Shuning uchun <b>SOP CSRF'dan himoya qilmaydi</b>.`, 'bad'),
          B.h(`Python: o'quv laboratoriyasi (ikki server)`, '🐍'),
          B.p(`Hujumni xavfsiz tarzda o'z kompyuteringizda ko'rish uchun ikkita lokal server ishga tushiramiz: <code>127.0.0.1:5000</code> (bank) va <code>localhost:8000</code> (hujumchi). Brauzer ular uchun alohida origin deb hisoblaydi.`),
          B.code('python', 'hujumchi_server.py', String.raw`
"""Faqat o'quv laboratoriyasi uchun: localhost:8000 da hujumchi sahifasini beradi."""
from http.server import HTTPServer, BaseHTTPRequestHandler

PAYLOAD = b"""<!doctype html>
<h1>Sovg'a sahifasi</h1>
<form id="f" action="http://127.0.0.1:5000/otkazma" method="POST">
  <input type="hidden" name="to" value="hacker">
  <input type="hidden" name="summa" value="1000">
</form>
<script>document.getElementById('f').submit()</script>"""

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(PAYLOAD)

if __name__ == "__main__":
    print("Hujumchi sahifasi: http://localhost:8000")
    HTTPServer(("localhost", 8000), Handler).serve_forever()
`),
          B.code('bash', 'terminal', `# 1-terminal: zaif bank (oldingi darsdagi zaif_bank.py, login qo'shilgan holda)
flask --app zaif_bank run --port 5000
# 2-terminal: hujumchi
python hujumchi_server.py
# Brauzerda: avval 127.0.0.1:5000/login, so'ng localhost:8000 ni oching`),
          B.note(`<b>Zamonaviy brauzerlar haqida</b>Chrome kabi brauzerlar SameSite atributi ko'rsatilmagan cookie'ni <code>Lax</code> deb hisoblaydi, shuning uchun bu laboratoriyada hujum to'xtatilishi mumkin. Zaiflikni ko'rish uchun serverda <code>SESSION_COOKIE_SAMESITE=None</code> va HTTPS ishlatish kerak. Bu — SameSite himoyasi qanchalik muhimligini ko'rsatadi (2.3-darsga qarang).`, 'warn'),
          B.h(`Interaktiv simulyator`, '🧪'),
          B.p(`Quyida himoya choralarini yoqib-o'chirib, soxta so'rov qanday natija berishini kuzating:`),
          B.demo('simulator')
        ].join('')
      },

      /* ---------------- 1.4 ---------------- */
      {
        id: 'l1-4', title: `CSRF turlari: GET, POST, JSON va Login CSRF`, dur: 13,
        html: [
          B.p(`CSRF yagona texnika emas. So'rov turi va kontekstga qarab bir nechta ko'rinishlari bor. Har birini bilish to'g'ri himoyani tanlashga yordam beradi.`),
          B.fig('0 0 760 250', `
            <rect class="box-acc" x="290" y="14" width="180" height="44" rx="8"/>
            <text class="tb" x="380" y="41" text-anchor="middle">CSRF turlari</text>
            <path class="ln" d="M380 58 V82 M95 82 H665 M95 82 V104 M285 82 V104 M475 82 V104 M665 82 V104"/>
            <rect class="box-bad" x="15" y="106" width="160" height="56" rx="8"/><text class="tb" x="95" y="130" text-anchor="middle">GET-CSRF</text><text class="tm" x="95" y="148" text-anchor="middle">&lt;img src="…"&gt;</text>
            <rect class="box-bad" x="205" y="106" width="160" height="56" rx="8"/><text class="tb" x="285" y="130" text-anchor="middle">POST-CSRF</text><text class="tm" x="285" y="148" text-anchor="middle">auto-submit forma</text>
            <rect class="box-bad" x="395" y="106" width="160" height="56" rx="8"/><text class="tb" x="475" y="130" text-anchor="middle">JSON-CSRF</text><text class="tm" x="475" y="148" text-anchor="middle">text/plain hiylasi</text>
            <rect class="box-bad" x="585" y="106" width="160" height="56" rx="8"/><text class="tb" x="665" y="130" text-anchor="middle">Login CSRF</text><text class="tm" x="665" y="148" text-anchor="middle">hujumchi akkaunti</text>
            <text class="tm" x="95" y="186" text-anchor="middle">Eng oson; GET holat</text><text class="tm" x="95" y="200" text-anchor="middle">o'zgartirmasligi kerak</text>
            <text class="tm" x="285" y="186" text-anchor="middle">Eng keng tarqalgan</text><text class="tm" x="285" y="200" text-anchor="middle">→ CSRF token</text>
            <text class="tm" x="475" y="186" text-anchor="middle">Content-Type tekshir,</text><text class="tm" x="475" y="200" text-anchor="middle">custom header</text>
            <text class="tm" x="665" y="186" text-anchor="middle">Login formada ham</text><text class="tm" x="665" y="200" text-anchor="middle">token kerak!</text>
          `, `<b>5-rasm.</b> CSRF turlarining tasnifi va har biriga asosiy qarshi chora.`),
          B.h(`1. GET orqali CSRF`, '1️⃣'),
          B.p(`Agar server holatni GET so'rov orqali o'zgartirsa, hujum uchun bitta rasm tegi yetarli. Brauzer rasmni yuklashga harakat qiladi va cookie qo'shadi:`),
          B.code('html', 'forum-posti.html', `<img src="https://bank.uz/otkazma?to=hacker&summa=500000" width="1" height="1">`),
          B.note(`<b>Qoida №1</b>GET, HEAD, OPTIONS so'rovlari <b>hech qachon</b> holatni o'zgartirmasligi kerak (RFC 9110 "safe methods"). Bu birinchi va eng arzon himoya.`, 'good'),
          B.h(`2. POST orqali CSRF`, '2️⃣'),
          B.p(`Oldingi darsda ko'rgan yashirin forma. HTML forma <code>application/x-www-form-urlencoded</code>, <code>multipart/form-data</code> va <code>text/plain</code> turlarini preflight'siz istalgan saytga yubora oladi.`),
          B.h(`3. JSON API'ga CSRF`, '3️⃣'),
          B.p(`Ko'pchilik "API'm JSON qabul qiladi, demak xavfsiz" deb o'ylaydi. Ammo server <code>Content-Type</code> ni tekshirmasa, hujumchi <code>text/plain</code> formasi orqali JSON'ga o'xshash tana yubora oladi:`),
          B.code('html', 'json-csrf.html', `<form action="https://api.bank.uz/v1/transfer" method="POST" enctype="text/plain">
  <!-- name + "=" + value => {"to":"hacker","amount":5000,"x":"="} -->
  <input name='{"to":"hacker","amount":5000,"x":"' value='"}'>
</form>
<script>document.forms[0].submit()</script>`),
          B.code('python', 'json_tekshiruv.py', String.raw`
from flask import request, abort

@app.post("/v1/transfer")
def api_transfer():
    # ✅ Faqat haqiqiy JSON qabul qilinadi. text/plain forma rad etiladi,
    #    application/json esa boshqa saytdan faqat CORS preflight orqali yuboriladi.
    if request.mimetype != "application/json":
        abort(415, "Faqat application/json qabul qilinadi")
    data = request.get_json(silent=False)
    ...
`),
          B.h(`4. Login CSRF`, '4️⃣'),
          B.p(`Bu turda hujumchi qurbonni <b>o'zining (hujumchining) akkauntiga</b> kiritib qo'yadi. Qurbon buni sezmay, karta ma'lumotlarini kiritadi yoki qidiruv tarixi hujumchining akkauntida saqlanadi. Shuning uchun <b>login formasi ham CSRF token bilan himoyalanishi</b> kerak (sessiyagacha bo'lgan "pre-session" token).`),
          B.algo(`Hujum turini aniqlash va chora tanlash`, [
            `Endpoint metodini aniqlang: GET bo'lsa → uni POST ga o'tkazing.`,
            `Qabul qilinadigan <code>Content-Type</code> ni aniqlang: forma turlari bo'lsa → CSRF token majburiy.`,
            `JSON bo'lsa → <code>application/json</code> ni qat'iy talab qiling va custom header qo'shing.`,
            `Login/ro'yxatdan o'tish formasi bo'lsa → sessiyagacha token ishlating.`,
            `Barcha holatda: <code>SameSite</code> cookie va Origin tekshiruvini qo'shimcha qatlam sifatida yoqing.`
          ]),
          B.h(`Python: zaiflikni avtomatik tekshirish skripti`, '🐍'),
          B.p(`Quyidagi skript o'z test serveringizdagi endpoint token'siz va begona Origin bilan so'rovni qabul qilishini tekshiradi (faqat o'zingizga tegishli tizimlarda ishlating):`),
          B.code('python', 'csrf_tekshir.py', String.raw`
import requests

BASE = "http://127.0.0.1:5000"

def check_endpoint(path: str, data: dict, session_cookie: str) -> None:
    """Begona Origin va token'siz POST yuborib, server javobini tahlil qiladi."""
    headers = {
        "Origin": "https://evil.example",
        "Referer": "https://evil.example/sovga",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    r = requests.post(BASE + path, data=data, headers=headers,
                      cookies={"session": session_cookie}, allow_redirects=False)
    if r.status_code in (200, 201, 302):
        print(f"[!] {path}: ZAIF — {r.status_code} qaytdi")
    elif r.status_code in (400, 403):
        print(f"[✓] {path}: himoyalangan — {r.status_code}")
    else:
        print(f"[?] {path}: noaniq javob {r.status_code}")

if __name__ == "__main__":
    cookie = input("Test akkauntingiz sessiya cookie'si: ")
    check_endpoint("/otkazma", {"to": "test", "summa": "1"}, cookie)
    check_endpoint("/profil/email", {"email": "test@example.com"}, cookie)
`)
        ].join('')
      },

      /* ---------------- Quiz 1 ---------------- */
      {
        id: 'q1', title: `1-bo'lim testi`, dur: 5, type: 'quiz',
        questions: [
          { q: `CSRF hujumida hujumchi qurbonning nimasidan foydalanadi?`, o: [`Parolini o'g'irlab oladi`, `Brauzer cookie'ni avtomatik yuborishidan`, `Serverdagi SQL zaiflikdan`, `Qurbonning IP manzilini almashtiradi`], a: 1, e: `Hujumchi parolni bilmaydi; brauzer so'rovga sessiya cookie'sini o'zi qo'shadi.` },
          { q: `Quyidagilardan qaysi biri CSRF uchun zarur shart EMAS?`, o: [`Muhim harakat mavjudligi`, `Faqat cookie'ga asoslangan autentifikatsiya`, `Hujumchi server javobini o'qiy olishi`, `Parametrlarni oldindan bilish mumkinligi`], a: 2, e: `CSRF "ko'r" hujum: javobni o'qish shart emas, harakat bajarilsa kifoya.` },
          { q: `Same-Origin Policy (SOP) CSRF'dan himoya qiladimi?`, o: [`Ha, to'liq himoya qiladi`, `Yo'q: SOP javobni o'qishni cheklaydi, so'rov yuborishni emas`, `Faqat GET so'rovlarda`, `Faqat HTTPS bo'lsa`], a: 1, e: `SOP boshqa origin javobini o'qishni taqiqlaydi, lekin forma yuborishga ruxsat beradi.` },
          { q: `<code>&lt;img src="https://bank.uz/delete?id=5"&gt;</code> qaysi muammoni ko'rsatadi?`, o: [`XSS`, `GET so'rov holatni o'zgartiryapti`, `SQL injection`, `Clickjacking`], a: 1, e: `GET xavfsiz metod bo'lishi, ya'ni holatni o'zgartirmasligi kerak.` },
          { q: `Login CSRF'da qurbon nimaga duch keladi?`, o: [`Akkaunti o'chiriladi`, `Hujumchining akkauntiga kiritib qo'yiladi`, `Paroli o'zgaradi`, `Hech narsa bo'lmaydi`], a: 1, e: `Qurbon hujumchi akkauntida ishlaydi va kiritgan ma'lumotlari hujumchiga qoladi.` }
        ]
      }
    ]
  });
})();

/* =========================================================
   2-BO'LIM. Himoya mexanizmlari
   ========================================================= */
(function () {
  const { B, COURSE } = window.CSRF;

  COURSE.sections.push({
    id: 's2',
    title: `CSRF'dan himoyalanish mexanizmlari`,
    lessons: [
      /* ---------------- 2.1 ---------------- */
      {
        id: 'l2-1', title: `Synchronizer Token Pattern (sinxronizator token)`, dur: 18,
        html: [
          B.p(`Bu eng ishonchli va OWASP tomonidan birinchi tavsiya etiladigan usul. G'oya oddiy: server har bir sessiya (yoki har bir forma) uchun <b>oldindan taxmin qilib bo'lmaydigan tasodifiy token</b> yaratadi, uni formaga yashirin maydon sifatida joylaydi va so'rov kelganda tokenni sessiyadagi nusxa bilan solishtiradi. Hujumchi bu tokenni bilmaydi (SOP uni o'qishga ruxsat bermaydi), shuning uchun soxta so'rov tokensiz keladi va rad etiladi.`),
          B.seq(
            [{ name: `Brauzer` }, { name: `Server`, cls: 'box-acc' }, { name: `Sessiya ombori`, sub: `Redis / DB` }],
            [
              { f: 0, t: 1, l: `GET /otkazma (forma sahifasi)`, n: 1 },
              { f: 1, t: 1, l: `token = secrets.token_urlsafe(32)` },
              { f: 1, t: 2, l: `session["csrf"] = token`, k: 'acc', n: 2 },
              { f: 1, t: 0, l: `HTML + <input hidden csrf=token>`, d: true, n: 3 },
              { f: 0, t: 1, l: `POST forma + csrf=token + Cookie`, k: 'good', n: 4 },
              { f: 1, t: 2, l: `saqlangan tokenni olish` },
              { note: `compare_digest(forma_token, sessiya_token) → ✓ 200 / ✗ 403`, at: [1, 2], k: 'good' },
              { f: 0, t: 1, l: `evil.com dan POST (token yo'q)`, k: 'bad' },
              { f: 1, t: 0, l: `403 Forbidden`, d: true, k: 'bad' }
            ],
            `<b>6-rasm.</b> Synchronizer Token Pattern: token serverda saqlanadi va formadan kelgan qiymat bilan solishtiriladi.`
          ),
          B.h(`Algoritm`, '⚙️'),
          B.algo(`Token yaratish va tekshirish`, [
            `Foydalanuvchi sessiyasi boshlanganda (yoki forma chiqarilganda) kriptografik xavfsiz generator bilan kamida 128 bit tasodifiy token yarating.`,
            `Tokenni <b>server tomonida</b> sessiyaga saqlang.`,
            `Har bir holatni o'zgartiruvchi formaga tokenni <code>&lt;input type="hidden"&gt;</code> sifatida qo'shing (AJAX uchun — sarlavhada).`,
            `So'rov kelganda: metod xavfsiz (GET/HEAD/OPTIONS) bo'lsa — o'tkazib yuboring.`,
            `Aks holda formadan/sarlavhadan tokenni oling; bo'sh bo'lsa — 403.`,
            `Sessiyadagi token bilan <b>doimiy vaqtda</b> (constant-time) solishtiring; mos kelmasa — 403 va log yozing.`,
            `Login, logout va huquq o'zgarganda tokenni yangilang (rotation).`
          ], `FUNKSIYA token_ber(sessiya):
    AGAR "csrf" YO'Q sessiya ICHIDA:
        sessiya["csrf"] = TASODIFIY_BAYTLAR(32) -> base64url
    QAYTAR sessiya["csrf"]

FUNKSIYA tekshir(sorov, sessiya):
    AGAR sorov.metod IN {GET, HEAD, OPTIONS, TRACE}: QAYTAR OK
    kelgan  = sorov.forma["csrf_token"] YOKI sorov.sarlavha["X-CSRF-Token"]
    saqlangan = sessiya.get("csrf")
    AGAR kelgan BO'SH YOKI saqlangan BO'SH: QAYTAR 403
    AGAR NOT doimiy_vaqtda_teng(kelgan, saqlangan): QAYTAR 403
    QAYTAR OK`),
          B.note(`<b>Nega <code>==</code> emas, <code>hmac.compare_digest</code>?</b>Oddiy taqqoslash birinchi farq qiluvchi belgida to'xtaydi. Javob vaqtini o'lchab, hujumchi tokenni belgima-belgi topishi mumkin (timing attack). <code>compare_digest</code> har doim bir xil vaqt sarflaydi.`, 'warn'),
          B.h(`Python: tokenni noldan amalga oshirish (Flask)`, '🐍'),
          B.code('python', 'csrf_sync.py', String.raw`
import hmac
import secrets
from functools import wraps
from flask import Flask, session, request, abort, render_template_string

app = Flask(__name__)
app.config["SECRET_KEY"] = secrets.token_hex(32)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"   # qo'shimcha qatlam

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

def get_csrf_token() -> str:
    """Sessiyada token bo'lmasa — yaratadi, bo'lsa — qaytaradi."""
    if "_csrf" not in session:
        session["_csrf"] = secrets.token_urlsafe(32)   # 256 bit entropiya
    return session["_csrf"]

# Shablonlarda {{ csrf_token() }} ko'rinishida ishlatish uchun
app.jinja_env.globals["csrf_token"] = get_csrf_token

@app.before_request
def csrf_protect():
    if request.method in SAFE_METHODS:
        return
    sent = request.form.get("csrf_token") or request.headers.get("X-CSRF-Token", "")
    stored = session.get("_csrf", "")
    if not sent or not stored or not hmac.compare_digest(sent, stored):
        app.logger.warning("CSRF rad etildi: %s %s", request.remote_addr, request.path)
        abort(403, "CSRF token yaroqsiz yoki yo'q")

FORM = """
<form method="post" action="/otkazma">
  <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
  <input name="to" placeholder="Kimga" required>
  <input name="summa" type="number" min="1" required>
  <button>O'tkazish</button>
</form>
"""

@app.get("/otkazma")
def transfer_form():
    return render_template_string(FORM)

@app.post("/otkazma")
def transfer():
    # Bu yerga faqat to'g'ri token bilan kelgan so'rovlar yetib keladi
    return f"{request.form['summa']} so'm {request.form['to']} ga o'tkazildi"

@app.post("/login")
def login():
    ...
    session.clear()                     # sessiya fixation'ga qarshi
    session["user"] = "avaz"
    session["_csrf"] = secrets.token_urlsafe(32)   # ✅ token rotation
    return "ok"
`),
          B.h(`Har-so'rov (per-request) va har-sessiya token`, '⚖️'),
          B.table([`Variant`, `Afzallik`, `Kamchilik`], [
            [`Har sessiya uchun bitta token`, `Oddiy, "Orqaga" tugmasi va bir nechta tab bilan muammo yo'q`, `Token oqib chiqsa, sessiya oxirigacha yaroqli`],
            [`Har so'rov uchun yangi token`, `Juda yuqori xavfsizlik, token qayta ishlatilmaydi`, `Bir nechta tab, orqaga qaytish, AJAX'da noqulay`]
          ]),
          B.p(`Amalda ko'pchilik framework'lar (Django, Flask-WTF) <b>sessiya tokeni + har sahifada niqoblangan (masked) nusxa</b> yondashuvidan foydalanadi. Niqoblash BREACH hujumidan himoya qiladi.`),
          B.h(`Interaktiv: token generatori`, '🧪'),
          B.demo('tokengen')
        ].join('')
      },

      /* ---------------- 2.2 ---------------- */
      {
        id: 'l2-2', title: `Double Submit Cookie va imzolangan token`, dur: 15,
        html: [
          B.p(`Agar server sessiya holatini saqlamasa (stateless arxitektura, mikroservislar), Synchronizer Token'ni qo'llash qiyin. Bunda <b>Double Submit Cookie</b> usuli ishlatiladi: token ham cookie'da, ham so'rov parametri/sarlavhasida yuboriladi va server ikkalasi mos kelishini tekshiradi. Hujumchi boshqa domendan qurbonning cookie'sini o'qiy olmaydi, shuning uchun parametrga to'g'ri qiymatni qo'ya olmaydi.`),
          B.seq(
            [{ name: `Brauzer (JS)` }, { name: `Server`, sub: `stateless`, cls: 'box-acc' }],
            [
              { f: 0, t: 1, l: `GET /sahifa`, n: 1 },
              { f: 1, t: 0, l: `Set-Cookie: csrf=T; Secure; SameSite=Lax`, d: true, k: 'acc', n: 2 },
              { f: 0, t: 0, l: `JS cookie'dan T ni o'qiydi` },
              { f: 0, t: 1, l: `POST  Cookie: csrf=T   X-CSRF-Token: T`, k: 'good', n: 3 },
              { note: `cookie["csrf"] == header["X-CSRF-Token"] ?  → ✓`, at: [0, 1], k: 'good' },
              { f: 0, t: 1, l: `evil.com: Cookie: csrf=T   (sarlavha yo'q)`, k: 'bad', n: 4 },
              { f: 1, t: 0, l: `403 — mos kelmadi`, d: true, k: 'bad' }
            ],
            `<b>7-rasm.</b> Double Submit Cookie: server hech narsani saqlamaydi, faqat ikki nusxani solishtiradi.`
          ),
          B.note(`<b>Oddiy (naive) variantning zaifligi</b>Agar hujumchi subdomen (masalan, <code>blog.bank.uz</code>) orqali yoki HTTP (shifrlanmagan) ulanishda cookie <b>yozib qo'ya</b> olsa (cookie tossing), u o'z tokenini cookie'ga ham, formaga ham qo'yadi — tekshiruv o'tib ketadi. Shuning uchun OWASP <b>imzolangan (signed) double-submit</b> usulini tavsiya qiladi.`, 'bad'),
          B.h(`Imzolangan Double Submit: algoritm`, '⚙️'),
          B.algo(`HMAC bilan bog'langan token`, [
            `Server maxfiy kalit <code>K</code> saqlaydi (faqat serverda).`,
            `Tasodifiy qiymat <code>r</code> yaratiladi (kamida 128 bit).`,
            `Xabar tuziladi: <code>m = sessiya_id + "!" + r</code> — token aynan shu sessiyaga bog'lanadi.`,
            `Imzo hisoblanadi: <code>s = HMAC-SHA256(K, m)</code>.`,
            `Token: <code>s_hex + "." + r</code>; u cookie'ga yoziladi va formaga/sarlavhaga qo'yiladi.`,
            `Tekshirishda: cookie va parametr teng bo'lishi, so'ng <code>s</code> ni joriy sessiya_id bilan qayta hisoblab, doimiy vaqtda solishtirish kerak.`
          ], `FUNKSIYA token_yarat(sid, K):
    r = TASODIFIY_HEX(16)
    s = HMAC_SHA256(K, sid + "!" + r)
    QAYTAR hex(s) + "." + r

FUNKSIYA token_tekshir(token_cookie, token_param, sid, K):
    AGAR NOT doimiy_teng(token_cookie, token_param): QAYTAR YOLG'ON
    (s, r) = ajrat(token_param, ".")
    kutilgan = HMAC_SHA256(K, sid + "!" + r)
    QAYTAR doimiy_teng(hex(kutilgan), s)`),
          B.fig('0 0 760 170', `
            <rect class="box-acc" x="10" y="20" width="130" height="44" rx="6"/><text class="t" x="75" y="47" text-anchor="middle">sessiya_id</text>
            <rect class="box-acc" x="10" y="100" width="130" height="44" rx="6"/><text class="t" x="75" y="127" text-anchor="middle">r (tasodifiy)</text>
            <path class="ln" d="M140 42 H190 V72 M140 122 H190 V92" /><rect class="box" x="190" y="62" width="120" height="40" rx="6"/><text class="tc" x="250" y="87" text-anchor="middle">sid + "!" + r</text>
            <line class="ln" x1="310" y1="82" x2="372" y2="82" marker-end="url(#A)"/>
            <rect class="box-good" x="375" y="56" width="150" height="52" rx="6"/><text class="tb" x="450" y="80" text-anchor="middle">HMAC-SHA256</text><text class="tm" x="450" y="97" text-anchor="middle">kalit K (serverda)</text>
            <line class="ln" x1="525" y1="82" x2="572" y2="82" marker-end="url(#A)"/>
            <rect class="box" x="575" y="56" width="175" height="52" rx="6"/><text class="tc" x="662" y="80" text-anchor="middle">9f2c…e1 . 7a3b…</text><text class="tm" x="662" y="97" text-anchor="middle">token = imzo.r</text>
            <path class="ln-d" d="M75 144 V160 H662 V108"/><text class="tm" x="400" y="156" text-anchor="middle">r tokenning ichida ochiq yuboriladi; imzo esa uni sessiyaga bog'laydi</text>
          `, `<b>8-rasm.</b> Imzolangan tokenning tuzilishi. Hujumchi K ni bilmagani uchun o'z tokenini soxtalashtira olmaydi.`),
          B.h(`Python: imzolangan Double Submit (Flask)`, '🐍'),
          B.code('python', 'double_submit.py', String.raw`
import hashlib
import hmac
import secrets
from flask import Flask, request, abort, make_response, session

app = Flask(__name__)
app.config["SECRET_KEY"] = secrets.token_hex(32)
CSRF_KEY = secrets.token_bytes(32)          # alohida maxfiy kalit (env'dan oling!)
COOKIE = "__Host-csrf"                      # __Host- prefiksi: Secure, Path=/, Domain yo'q

def _sid() -> str:
    if "sid" not in session:
        session["sid"] = secrets.token_hex(16)
    return session["sid"]

def make_token(sid: str) -> str:
    rnd = secrets.token_hex(16)
    sig = hmac.new(CSRF_KEY, f"{sid}!{rnd}".encode(), hashlib.sha256).hexdigest()
    return f"{sig}.{rnd}"

def verify_token(token: str, sid: str) -> bool:
    try:
        sig, rnd = token.split(".", 1)
    except ValueError:
        return False
    expected = hmac.new(CSRF_KEY, f"{sid}!{rnd}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected)

@app.get("/")
def index():
    token = make_token(_sid())
    resp = make_response(f"""
      <form method="post" action="/profil">
        <input type="hidden" name="csrf_token" value="{token}">
        <input name="email" type="email" required> <button>Saqlash</button>
      </form>""")
    resp.set_cookie(COOKIE, token, secure=True, httponly=False,  # JS (SPA) o'qishi uchun
                    samesite="Lax", path="/")
    return resp

@app.before_request
def check_double_submit():
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    cookie_tok = request.cookies.get(COOKIE, "")
    sent_tok = request.form.get("csrf_token") or request.headers.get("X-CSRF-Token", "")
    if not cookie_tok or not hmac.compare_digest(cookie_tok, sent_tok):
        abort(403, "Cookie va token mos emas")
    if not verify_token(sent_tok, _sid()):
        abort(403, "Token imzosi noto'g'ri")

@app.post("/profil")
def profile():
    return "E-mail yangilandi"
`),
          B.note(`<b><code>__Host-</code> prefiksi nima beradi?</b>Brauzer <code>__Host-</code> bilan boshlanuvchi cookie'ni faqat <code>Secure</code>, <code>Path=/</code> va <code>Domain</code> atributisiz bo'lsagina qabul qiladi. Natijada subdomen bu cookie'ni ustiga yoza olmaydi — cookie tossing hujumi yopiladi.`, 'good'),
          B.table([`Mezon`, `Synchronizer Token`, `Signed Double Submit`], [
            [`Server holati`, `Kerak (sessiya)`, `Kerak emas`],
            [`Masshtablash`, `Umumiy sessiya ombori kerak`, `Oson, istalgan serverda tekshiriladi`],
            [`Xavfsizlik`, `Juda yuqori`, `Yuqori (imzo + __Host- bilan)`],
            [`Qo'llanish`, `Klassik server-render saytlar`, `SPA, mikroservislar, API gateway`]
          ])
        ].join('')
      },

      /* ---------------- 2.3 ---------------- */
      {
        id: 'l2-3', title: `SameSite cookie atributi: Strict, Lax, None`, dur: 14,
        html: [
          B.p(`<code>SameSite</code> — brauzerga cookie'ni <b>boshqa saytdan boshlangan</b> so'rovlarga qo'shish-qo'shmaslikni aytuvchi atribut. U CSRF'ning asosiy sababini (cookie avtomatik yuborilishini) brauzer darajasida cheklaydi.`),
          B.code('text', 'HTTP javob sarlavhasi', `Set-Cookie: sessionid=a91f…; Path=/; Secure; HttpOnly; SameSite=Lax`),
          B.fig('0 0 760 268', `
            <rect class="box" x="10" y="10" width="740" height="40" rx="6"/>
            <text class="tb" x="140" y="35" text-anchor="middle">evil.com dan bank.uz ga so'rov</text>
            <text class="tb" x="355" y="35" text-anchor="middle">Strict</text>
            <text class="tb" x="505" y="35" text-anchor="middle">Lax (standart)</text>
            <text class="tb" x="665" y="35" text-anchor="middle">None; Secure</text>
            ${[
              ['Havola bosish (GET, top-level)', 'bad', 'good', 'good'],
              ['Forma POST (top-level)', 'bad', 'bad', 'good'],
              ['<img>, <iframe>, <script>', 'bad', 'bad', 'good'],
              ['fetch / XHR (credentials)', 'bad', 'bad', 'good'],
              ['Bir sayt ichidagi so\'rov', 'good', 'good', 'good']
            ].map((r, i) => {
              const y = 60 + i * 40;
              const cell = (x, k) => `<rect class="${k === 'good' ? 'box-good' : 'box-bad'}" x="${x - 62}" y="${y + 4}" width="124" height="30" rx="15"/><text class="t" x="${x}" y="${y + 24}" text-anchor="middle" style="font-weight:700;fill:var(--d-${k})">${k === 'good' ? '✓ yuboriladi' : '✗ yuborilmaydi'}</text>`;
              return `<text class="t" x="20" y="${y + 24}">${r[0].replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>${cell(355, r[1])}${cell(505, r[2])}${cell(665, r[3])}<line class="ln-d" x1="10" y1="${y + 38}" x2="750" y2="${y + 38}"/>`;
            }).join('')}
          `, `<b>9-rasm.</b> SameSite qiymatlariga ko'ra cookie qachon yuborilishi. Qizil — cookie qo'shilmaydi, ya'ni CSRF ishlamaydi.`),
          B.h(`Qiymatlar tavsifi`, '📘'),
          B.ul([
            `<b>Strict</b> — cookie faqat shu saytning o'zidan boshlangan so'rovlarda yuboriladi. Eng xavfsiz, lekin boshqa saytdagi havoladan kelgan foydalanuvchi "tizimdan chiqib ketgandek" ko'rinadi.`,
            `<b>Lax</b> — top-level navigatsiya (havola bosish) GET so'rovlarida yuboriladi, lekin begona saytdan POST, iframe, rasm va fetch'da yuborilmaydi. Zamonaviy brauzerlarda <b>standart qiymat</b>.`,
            `<b>None</b> — har doim yuboriladi (eski xatti-harakat). Albatta <code>Secure</code> bilan birga bo'lishi shart. Faqat uchinchi tomon integratsiyalari (to'lov vidjeti, SSO iframe) uchun.`
          ]),
          B.h(`Algoritm: brauzer qarori`, '⚙️'),
          B.flow([
            { t: 'start', text: `Cross-site so'rov: cookie qo'shilsinmi?` },
            { t: 'dec', text: `SameSite qiymati Strict emasmi?`, no: `Strict → yuborilmaydi` },
            { t: 'dec', text: `None, yoki Lax + top-level GET?`, no: `Lax → yuborilmaydi` },
            { t: 'end', text: `Cookie qo'shiladi` }
          ], `<b>10-rasm.</b> Brauzerning cross-site so'rov uchun SameSite qarori (soddalashtirilgan). Same-site so'rovlarda cookie har doim qo'shiladi. Qizil — CSRF to'xtatiladi.`),
          B.note(`<b>SameSite yetarlimi? Yo'q!</b><ul><li><b>Same-site ≠ same-origin:</b> <code>blog.bank.uz</code> dagi XSS yoki zaif subdomen <code>bank.uz</code> ga "same-site" so'rov yubora oladi.</li><li>Lax rejimida holatni o'zgartiruvchi <b>GET</b> endpoint baribir zaif.</li><li>Eski brauzerlar atributni qo'llab-quvvatlamaydi.</li><li>Chrome'da yangi o'rnatilgan cookie uchun 2 daqiqalik "Lax+POST" istisnosi bo'lgan.</li></ul>Shuning uchun SameSite — <b>qo'shimcha himoya qatlami</b> (defense in depth), CSRF tokenning o'rnini bosmaydi.`, 'warn'),
          B.h(`Python: SameSite sozlamalari`, '🐍'),
          B.code('python', 'flask_config.py', String.raw`
# Flask
app.config.update(
    SESSION_COOKIE_SECURE=True,      # faqat HTTPS
    SESSION_COOKIE_HTTPONLY=True,    # JS o'qiy olmaydi (XSS'da o'g'irlanmaydi)
    SESSION_COOKIE_SAMESITE="Lax",   # yoki "Strict"
    SESSION_COOKIE_NAME="__Host-session",
)

# Qo'lda cookie o'rnatish
@app.get("/til")
def set_lang():
    resp = make_response("ok")
    resp.set_cookie("til", "uz", max_age=3600 * 24 * 30,
                    secure=True, httponly=True, samesite="Strict")
    return resp
`),
          B.code('python', 'django_settings.py', String.raw`
# Django settings.py
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"      # Django standarti ham "Lax"

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False         # AJAX'da JS o'qishi kerak bo'lsa False
CSRF_COOKIE_SAMESITE = "Strict"
`),
          B.algo(`To'g'ri SameSite qiymatini tanlash`, [
            `Cookie autentifikatsiya uchunmi? Ha bo'lsa — kamida <code>Lax</code>.`,
            `Foydalanuvchi boshqa saytlardan havola orqali kirib, darhol tizimda ko'rinishi kerakmi? Yo'q bo'lsa — <code>Strict</code>.`,
            `Cookie iframe/uchinchi tomon kontekstida kerakmi (SSO, vidjet)? Ha bo'lsa — <code>None; Secure</code> va <b>albatta</b> CSRF token.`,
            `Har holda <code>Secure</code> va <code>HttpOnly</code> qo'shing, imkon bo'lsa <code>__Host-</code> prefiksini ishlating.`
          ])
        ].join('')
      },

      /* ---------------- 2.4 ---------------- */
      {
        id: 'l2-4', title: `Origin, Referer va Fetch Metadata tekshiruvi`, dur: 14,
        html: [
          B.p(`Brauzer har bir cross-origin POST so'rovga <code>Origin</code> sarlavhasini, ko'pincha <code>Referer</code> ni ham qo'shadi. Bu sarlavhalarni JavaScript orqali soxtalashtirib bo'lmaydi ("forbidden headers"). Server ularni tekshirib, so'rov o'z saytidan kelganiga ishonch hosil qiladi. Zamonaviy brauzerlar yana <b>Fetch Metadata</b> sarlavhalarini (<code>Sec-Fetch-Site</code>, <code>Sec-Fetch-Mode</code>, <code>Sec-Fetch-Dest</code>) yuboradi.`),
          B.table([`Sarlavha`, `Misol`, `Ishonchlilik`], [
            [`<code>Origin</code>`, `https://evil.com`, `Yuqori; ba'zan <code>null</code> bo'ladi (sandbox iframe, data: URL)`],
            [`<code>Referer</code>`, `https://evil.com/sovga.html`, `O'rtacha; maxfiylik sozlamalari/<code>Referrer-Policy</code> uni olib tashlashi mumkin`],
            [`<code>Sec-Fetch-Site</code>`, `same-origin, same-site, cross-site, none`, `Yuqori; zamonaviy brauzerlarda mavjud`]
          ]),
          B.flow([
            { t: 'start', text: `POST/PUT/DELETE so'rov keldi` },
            { t: 'dec', text: `Sec-Fetch-Site cross-site emasmi?`, no: `403 (cross-site)` },
            { t: 'dec', text: `Origin bor va ruxsat ro'yxatida?`, no: `403 (begona Origin/Referer)` },
            { t: 'dec', text: `CSRF token to'g'rimi?`, no: `403 (token)` },
            { t: 'end', text: `So'rov qabul qilinadi ✓` }
          ], `<b>11-rasm.</b> Ko'p qatlamli tekshiruv: Fetch Metadata → Origin/Referer → CSRF token.`),
          B.algo(`Origin/Referer tekshiruvi`, [
            `Ishonchli originlar ro'yxatini konfiguratsiyada saqlang (masalan, <code>https://bank.uz</code>). Uni <code>Host</code> sarlavhasidan olmang — u soxtalashtirilishi mumkin (proksi ortida).`,
            `Agar <code>Sec-Fetch-Site</code> mavjud va <code>cross-site</code> bo'lsa — rad eting (top-level navigatsiya GET bundan mustasno).`,
            `<code>Origin</code> mavjud bo'lsa: ro'yxatda bo'lishi shart, aks holda 403.`,
            `<code>Origin</code> yo'q bo'lsa: <code>Referer</code> dan sxema+host+port ni ajratib, ro'yxat bilan solishtiring.`,
            `Ikkalasi ham yo'q bo'lsa: siyosatga ko'ra rad eting (qat'iy) yoki CSRF token'ga tayaning.`,
            `Satrni <b>prefiks</b> bilan emas, to'liq origin sifatida solishtiring (<code>bank.uz.evil.com</code> hiylasi!).`
          ]),
          B.note(`<b>Klassik xato</b><code>if referer.startswith("https://bank.uz")</code> — <code>https://bank.uz.evil.com/</code> ham bu shartdan o'tadi! Har doim URL'ni tahlil qilib (parse), origin'ni to'liq solishtiring.`, 'bad'),
          B.h(`Python: Origin + Fetch Metadata middleware`, '🐍'),
          B.code('python', 'origin_check.py', String.raw`
from urllib.parse import urlsplit
from flask import Flask, request, abort

app = Flask(__name__)
TRUSTED_ORIGINS = {"https://bank.uz", "https://www.bank.uz"}
UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}

def origin_of(url: str) -> str | None:
    """'https://bank.uz:443/a?b' -> 'https://bank.uz' (standart port olib tashlanadi)."""
    try:
        p = urlsplit(url)
    except ValueError:
        return None
    if p.scheme not in ("http", "https") or not p.hostname:
        return None
    default = {"http": 80, "https": 443}[p.scheme]
    port = f":{p.port}" if p.port and p.port != default else ""
    return f"{p.scheme}://{p.hostname.lower()}{port}"

@app.before_request
def verify_source():
    if request.method not in UNSAFE:
        return

    # 1) Fetch Metadata (zamonaviy brauzerlar)
    site = request.headers.get("Sec-Fetch-Site")
    if site == "cross-site":
        abort(403, "Cross-site so'rov taqiqlangan")

    # 2) Origin, bo'lmasa Referer
    origin = request.headers.get("Origin")
    if origin and origin != "null":
        if origin_of(origin) not in TRUSTED_ORIGINS:
            abort(403, "Ishonchsiz Origin")
        return
    referer = request.headers.get("Referer")
    if referer:
        if origin_of(referer) not in TRUSTED_ORIGINS:
            abort(403, "Ishonchsiz Referer")
        return

    # 3) Hech qanday manba ma'lumoti yo'q — qat'iy siyosat
    abort(403, "So'rov manbasini aniqlab bo'lmadi")
`),
          B.code('python', 'test_origin.py', String.raw`
assert origin_of("https://bank.uz/a/b?x=1") == "https://bank.uz"
assert origin_of("https://BANK.uz:443/") == "https://bank.uz"
assert origin_of("https://bank.uz.evil.com/") == "https://bank.uz.evil.com"  # ro'yxatda yo'q ✓
assert origin_of("javascript:alert(1)") is None
`),
          B.note(`<b>Django eslatmasi</b>Django 4.0+ <code>CsrfViewMiddleware</code> Origin sarlavhasini avtomatik tekshiradi. HTTPS orqali boshqa domendan (masalan, frontend <code>app.bank.uz</code>) so'rov kelsa, uni <code>CSRF_TRUSTED_ORIGINS = ["https://app.bank.uz"]</code> ga qo'shish kerak.`, 'good')
        ].join('')
      },

      /* ---------------- 2.5 ---------------- */
      {
        id: 'l2-5', title: `AJAX va SPA: custom header va CORS`, dur: 12,
        html: [
          B.p(`Single Page Application (React, Vue) va AJAX so'rovlarida token odatda yashirin maydonda emas, <b>maxsus HTTP sarlavhada</b> (masalan <code>X-CSRF-Token</code>) yuboriladi. Brauzer qoidasiga ko'ra boshqa origin'dan custom sarlavha bilan so'rov yuborish uchun avval <b>CORS preflight</b> (OPTIONS) so'rovi bajariladi — server ruxsat bermasa, asosiy so'rov umuman jo'natilmaydi.`),
          B.seq(
            [{ name: `evil.com JS`, cls: 'box-bad' }, { name: `Brauzer` }, { name: `api.bank.uz`, cls: 'box-good' }],
            [
              { f: 0, t: 1, l: `fetch(POST, X-CSRF-Token)`, n: 1 },
              { f: 1, t: 2, l: `OPTIONS (preflight) Origin: evil.com`, n: 2 },
              { f: 2, t: 1, l: `CORS ruxsati yo'q`, d: true, k: 'bad' },
              { f: 1, t: 0, l: `TypeError: Failed to fetch`, d: true, k: 'bad', n: 3 },
              { note: `Asosiy POST so'rov hech qachon serverga yetib bormaydi`, at: [1, 2], k: 'good' }
            ],
            `<b>12-rasm.</b> Custom sarlavha CORS preflight'ni majburlaydi va begona saytning so'rovini to'xtatadi.`
          ),
          B.algo(`SPA uchun CSRF oqimi`, [
            `Sahifa yuklanganda server CSRF tokenni cookie'da (<code>HttpOnly=false</code>) yoki <code>&lt;meta&gt;</code> tegida beradi.`,
            `Frontend tokenni o'qib, barcha xavfli so'rovlarga <code>X-CSRF-Token</code> sarlavhasi sifatida qo'shadi.`,
            `Server sarlavhadagi tokenni tekshiradi (Synchronizer yoki Double Submit).`,
            `CORS sozlamalarida <code>Access-Control-Allow-Origin</code> ga faqat ishonchli domenlarni yozing, hech qachon <code>*</code> + credentials emas.`,
            `<code>Content-Type: application/json</code> ni talab qiling — bu ham preflight'ni majburlaydi.`
          ]),
          B.h(`Frontend: token bilan fetch`, '💻'),
          B.code('html', 'templates/base.html', `<meta name="csrf-token" content="{{ csrf_token() }}">`),
          B.code('javascript', 'static/api.js', `// Barcha so'rovlar uchun yagona yordamchi
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]').content;
}

async function api(url, data, method = "POST") {
  const res = await fetch(url, {
    method,
    credentials: "same-origin",            // cookie faqat o'z origin'iga
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify(data),
  });
  if (res.status === 403) throw new Error("CSRF tekshiruvidan o'tmadi");
  return res.json();
}

api("/api/profil", { email: "yangi@pochta.uz" }).then(console.log);`),
          B.h(`Backend: Flask + CORS qat'iy sozlamasi`, '🐍'),
          B.code('python', 'api.py', String.raw`
import hmac
from flask import Flask, request, session, jsonify, abort

app = Flask(__name__)
ALLOWED = {"https://app.bank.uz"}

@app.after_request
def cors(resp):
    origin = request.headers.get("Origin")
    if origin in ALLOWED:                       # ✅ aniq ro'yxat, '*' emas
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Access-Control-Allow-Credentials"] = "true"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, X-CSRF-Token"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE"
        resp.headers["Vary"] = "Origin"
    return resp

@app.before_request
def require_header_token():
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    if request.mimetype != "application/json":
        abort(415)
    token = request.headers.get("X-CSRF-Token", "")
    if not hmac.compare_digest(token, session.get("_csrf", "")) or not token:
        abort(403)

@app.post("/api/profil")
def update_profile():
    data = request.get_json()
    return jsonify(ok=True, email=data.get("email"))
`),
          B.note(`<b>Xavfli sozlama</b><code>Access-Control-Allow-Origin</code> ga so'rovdagi Origin'ni tekshirmasdan qaytarish (reflect) va <code>Allow-Credentials: true</code> qo'yish — har qanday sayt API'ingizni foydalanuvchi nomidan chaqirib, <b>javobni ham o'qishiga</b> imkon beradi. Bu CSRF'dan ham yomonroq.`, 'bad')
        ].join('')
      },

      /* ---------------- Quiz 2 ---------------- */
      {
        id: 'q2', title: `2-bo'lim testi`, dur: 6, type: 'quiz',
        questions: [
          { q: `CSRF token yaratish uchun Python'da qaysi funksiya to'g'ri?`, o: [`random.randint(0, 999999)`, `secrets.token_urlsafe(32)`, `uuid.uuid1()`, `str(time.time())`], a: 1, e: `secrets moduli kriptografik xavfsiz generatordan foydalanadi. random va uuid1 taxmin qilinishi mumkin.` },
          { q: `Tokenlarni solishtirishda nega <code>hmac.compare_digest</code> ishlatiladi?`, o: [`Tezroq ishlagani uchun`, `Timing hujumining oldini olish uchun`, `Unicode'ni qo'llab-quvvatlagani uchun`, `Tokenni shifrlagani uchun`], a: 1, e: `Doimiy vaqtda solishtirish javob vaqti orqali ma'lumot oqishining oldini oladi.` },
          { q: `Oddiy (imzosiz) Double Submit Cookie'ning asosiy zaifligi nima?`, o: [`Serverda ko'p xotira talab qiladi`, `Subdomen cookie'ni yozib qo'yishi (cookie tossing)`, `GET so'rovlarda ishlamaydi`, `HTTPS bilan ishlamaydi`], a: 1, e: `Hujumchi cookie'ni yozib qo'ysa, ikkala qiymatni ham o'zi tanlaydi. Imzo va __Host- prefiksi buni yopadi.` },
          { q: `SameSite=Lax cookie qaysi holatda cross-site so'rovga qo'shiladi?`, o: [`evil.com dagi yashirin forma POST`, `evil.com dagi <img>`, `evil.com dagi havolani bosib top-level GET o'tish`, `evil.com dagi fetch()`], a: 2, e: `Lax faqat top-level navigatsiya GET so'rovlariga ruxsat beradi.` },
          { q: `<code>referer.startswith("https://bank.uz")</code> tekshiruvidagi muammo?`, o: [`Hech qanday muammo yo'q`, `https://bank.uz.evil.com ham o'tib ketadi`, `Referer har doim bo'sh keladi`, `Faqat HTTP'da ishlaydi`], a: 1, e: `URL'ni tahlil qilib, origin'ni to'liq tenglik bilan solishtirish kerak.` },
          { q: `Custom sarlavha (X-CSRF-Token) nima uchun himoya beradi?`, o: [`Sarlavhalar shifrlanadi`, `Boshqa origin uchun CORS preflight majburiy bo'ladi`, `Brauzer uni keshlaydi`, `Server tezroq ishlaydi`], a: 1, e: `Preflight'da server ruxsat bermasa, asosiy so'rov yuborilmaydi.` }
        ]
      }
    ]
  });
})();
