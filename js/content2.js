/* =========================================================
   3-5 bo'limlar: xavfsiz forma, framework'lar, yakuniy test
   ========================================================= */

/* ---------------- 3-BO'LIM. Xavfsiz forma yaratish ---------------- */
(function () {
  const { B, COURSE } = window.CSRF;

  COURSE.sections.push({
    id: 's3',
    title: `Xavfsiz forma yaratish`,
    lessons: [
      /* ---------------- 3.1 ---------------- */
      {
        id: 'l3-1', title: `Xavfsiz forma dizayni: chuqur himoya (defense in depth)`, dur: 15,
        html: [
          B.p(`Xavfsiz forma — bu faqat CSRF token emas. Forma foydalanuvchidan serverga ma'lumot olib boruvchi "eshik"; har bir qatlam o'z xavfini yopadi. Bitta qatlam yiqilsa, keyingisi hujumni to'xtatadi — bu <b>defense in depth</b> tamoyili.`),
          B.fig('0 0 760 300', `
            ${[
              ['HTTPS + HSTS', 'Tarmoqda tinglash va o\'zgartirishdan himoya', 'box-acc'],
              ['SameSite + Secure + HttpOnly cookie', 'Brauzer darajasida CSRF/XSS cheklovi', 'box-acc'],
              ['Origin / Sec-Fetch-Site tekshiruvi', 'Begona saytdan kelgan so\'rovni rad etish', 'box-acc'],
              ['CSRF token (Synchronizer / Signed)', 'Asosiy CSRF himoyasi', 'box-good'],
              ['Server tomonida validatsiya', 'Tur, uzunlik, format, biznes qoidalari', 'box-good'],
              ['Avtorizatsiya + qayta tasdiqlash', 'Huquq tekshiruvi, muhim amallarda parol/OTP', 'box-good'],
              ['Xavfsiz chiqarish (escaping) + CSP', 'XSS orqali tokenni o\'g\'irlashni oldini olish', 'box-good']
            ].map((r, i) => {
              const inset = i * 18, y = 10 + i * 40;
              return `<rect class="${r[2]}" x="${10 + inset}" y="${y}" width="${740 - inset * 2}" height="34" rx="6"/><text class="tb" x="${26 + inset}" y="${y + 22}">${i + 1}. ${r[0]}</text><text class="tm" x="${734 - inset}" y="${y + 22}" text-anchor="end">${r[1]}</text>`;
            }).join('')}
          `, `<b>13-rasm.</b> Xavfsiz formaning himoya qatlamlari: tashqi qatlamdan (tarmoq) ichki qatlamgacha (ma'lumotni chiqarish).`),
          B.h(`Xavfsiz forma uchun nazorat ro'yxati`, '✅'),
          B.table([`#`, `Talab`, `Nima uchun`], [
            [`1`, `<code>method="post"</code> — holatni o'zgartiruvchi amallar uchun`, `GET URL'da qoladi, loglarga, tarixga, Referer'ga tushadi`],
            [`2`, `Yashirin CSRF token maydoni`, `Soxta so'rovni ajratish`],
            [`3`, `<code>action</code> — nisbiy yoki o'z domeningiz`, `Ma'lumot begona joyga ketmasligi`],
            [`4`, `<code>autocomplete</code> to'g'ri qiymatlari (<code>new-password</code>, <code>one-time-code</code>)`, `Brauzer parol menejeri xavfsiz ishlashi`],
            [`5`, `HTML validatsiya (<code>required</code>, <code>maxlength</code>, <code>pattern</code>) <b>+ server validatsiya</b>`, `HTML faqat qulaylik, himoya emas`],
            [`6`, `Muhim amallar uchun joriy parol yoki OTP`, `CSRF va sessiya o'g'irlanishiga qarshi`],
            [`7`, `Xatolarni umumiy matnda ko'rsatish`, `"Bunday foydalanuvchi yo'q" — ma'lumot oqishi`],
            [`8`, `Qayta yuborishga qarshi (idempotency / PRG)`, `To'lovning ikki marta bajarilishi`],
            [`9`, `<code>X-Frame-Options</code> / <code>frame-ancestors</code>`, `Clickjacking'dan himoya`],
            [`10`, `Rate limiting va CAPTCHA (kerak bo'lsa)`, `Brute-force va spam'ga qarshi`]
          ]),
          B.algo(`Forma so'rovini qayta ishlash (server)`, [
            `Metod va <code>Content-Type</code> ni tekshirish.`,
            `Origin/Fetch Metadata tekshiruvi.`,
            `CSRF tokenni doimiy vaqtda tekshirish.`,
            `Foydalanuvchi autentifikatsiyasi va shu amalga huquqi (avtorizatsiya).`,
            `Har bir maydonni whitelist qoidalari bo'yicha validatsiya qilish va normallashtirish.`,
            `Biznes qoidalarini tekshirish (balans yetarlimi, limit va h.k.).`,
            `Amalni tranzaksiya ichida bajarish, audit log yozish.`,
            `Post/Redirect/Get: muvaffaqiyatdan so'ng 303 redirect qaytarish.`
          ], `FUNKSIYA forma_qabul(sorov):
    tekshir_metod(sorov)            # 405
    tekshir_manba(sorov)            # 403
    tekshir_csrf(sorov)             # 403
    foyd = autentifikatsiya(sorov)  # 401
    tekshir_huquq(foyd, amal)       # 403
    malumot, xatolar = validatsiya(sorov.forma)
    AGAR xatolar: QAYTAR forma_qayta(xatolar, 422)
    TRANZAKSIYA:
        bajar(amal, malumot)
        audit_log(foyd, amal)
    QAYTAR REDIRECT_303("/natija")`),
          B.h(`Python + Jinja: xavfsiz forma shabloni`, '🐍'),
          B.code('html', 'templates/parol_ozgartirish.html', `<form method="post" action="{{ url_for('change_password') }}" novalidate>
  <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">

  <label for="old">Joriy parol</label>
  <input id="old" name="old_password" type="password"
         autocomplete="current-password" required>

  <label for="new">Yangi parol</label>
  <input id="new" name="new_password" type="password"
         autocomplete="new-password" minlength="12" maxlength="128" required>

  {% for err in errors %}
    <p class="error">{{ err }}</p>   {# Jinja avtomatik escape qiladi #}
  {% endfor %}

  <button type="submit">Parolni o'zgartirish</button>
</form>`),
          B.code('python', 'parol.py', String.raw`
from flask import render_template, request, session, redirect, url_for, abort
from werkzeug.security import check_password_hash, generate_password_hash

@app.route("/parol", methods=["GET", "POST"])
def change_password():
    user = current_user_or_401()                  # autentifikatsiya
    errors = []
    if request.method == "POST":                  # CSRF before_request'da tekshirilgan
        old = request.form.get("old_password", "")
        new = request.form.get("new_password", "")
        if not check_password_hash(user.password_hash, old):
            errors.append("Joriy parol noto'g'ri")       # ✅ qayta tasdiqlash
        if not (12 <= len(new) <= 128):
            errors.append("Parol 12-128 belgidan iborat bo'lishi kerak")
        if not errors:
            user.password_hash = generate_password_hash(new)
            db.session.commit()
            session.clear()                       # boshqa sessiyalarni bekor qilish
            return redirect(url_for("login"), code=303)   # PRG
    resp = render_template("parol_ozgartirish.html", errors=errors)
    return resp, (422 if errors else 200)

@app.after_request
def security_headers(resp):
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp
`),
          B.note(`<b>Joriy parolni so'rash — kuchli himoya</b>Hujumchi joriy parolni bilmaydi, demak CSRF'ning 3-sharti ("barcha parametrlar ma'lum") buziladi. Parol, e-mail, 2FA sozlamalarini o'zgartirish va pul o'tkazishda qayta autentifikatsiya so'rang.`, 'good')
        ].join('')
      },

      /* ---------------- 3.2 ---------------- */
      {
        id: 'l3-2', title: `Kiritilgan ma'lumotlarni validatsiya qilish`, dur: 16,
        html: [
          B.p(`Formadan kelgan har qanday ma'lumot — <b>ishonchsiz</b>. Brauzerdagi <code>required</code>, <code>pattern</code> yoki JavaScript tekshiruvlarini hujumchi bir zumda chetlab o'tadi (DevTools, curl, Burp). Shuning uchun haqiqiy validatsiya <b>faqat serverda</b> bo'ladi.`),
          B.fig('0 0 760 150', `
            ${[['Xom kirish', 'request.form', 'box-bad'], ['Normallash', 'strip, NFC', 'box'], ['Sintaksis', 'tur, uzunlik, regex', 'box'], ['Semantika', 'diapazon', 'box'], ['Biznes qoida', 'balans, limit', 'box'], ['Toza ma\'lumot', 'dict / model', 'box-good']].map((r, i) => {
              const x = 10 + i * 125;
              return `<rect class="${r[2]}" x="${x}" y="40" width="110" height="60" rx="8"/><text class="tb" x="${x + 55}" y="66" text-anchor="middle" style="font-size:12.5px">${r[0]}</text><text class="tm" x="${x + 55}" y="84" text-anchor="middle">${r[1]}</text>${i < 5 ? `<line class="ln" x1="${x + 110}" y1="70" x2="${x + 123}" y2="70" marker-end="url(#A)"/>` : ''}${i > 0 && i < 5 ? `<line class="ln-bad" x1="${x + 55}" y1="100" x2="${x + 55}" y2="128" marker-end="url(#AB)"/>` : ''}`;
            }).join('')}
            <text class="tm" x="380" y="146" text-anchor="middle" style="fill:var(--d-bad)">istalgan bosqichda xato → 422 + tushunarli xabar (ma'lumot saqlanmaydi)</text>
            <text class="tm" x="380" y="24" text-anchor="middle">Validatsiya quvuri (pipeline)</text>
          `, `<b>14-rasm.</b> Server tomonidagi validatsiya quvuri. Har bir bosqich ma'lumotni toraytiradi.`),
          B.h(`Asosiy tamoyillar`, '📘'),
          B.ul([
            `<b>Whitelist (ruxsat ro'yxati)</b>, blacklist emas: "nima ruxsat etilgan" ni aniqlang. Masalan, telefon raqam — faqat <code>^\\+998\\d{9}$</code>.`,
            `<b>Turga o'tkazish</b>: <code>int()</code>, <code>Decimal()</code>, <code>date.fromisoformat()</code> — xatoni ushlab, 422 qaytaring.`,
            `<b>Uzunlik chegarasi</b> har bir maydon uchun (DoS va bazaga sig'maslikning oldini olish).`,
            `<b>Kutilmagan maydonlarni rad etish</b> (mass assignment: <code>is_admin=1</code> qo'shib yuborish).`,
            `<b>Validatsiya ≠ escaping</b>: validatsiya kirishda, escaping esa chiqishda (HTML, SQL, shell) kontekstga mos qilinadi.`
          ]),
          B.algo(`Maydonni validatsiya qilish`, [
            `Maydon mavjudligini tekshiring; ixtiyoriy bo'lsa standart qiymat bering.`,
            `Satrni normallashtiring: chetdagi bo'shliqlarni olib tashlang, Unicode NFC, kerak bo'lsa kichik harf.`,
            `Uzunlikni tekshiring (min/max).`,
            `Formatni whitelist regex yoki parser bilan tekshiring (<code>re.fullmatch</code>!).`,
            `Turga o'tkazing va diapazonni tekshiring.`,
            `Xatolarni yig'ib, foydalanuvchiga hammasini birdan ko'rsating.`
          ], `FUNKSIYA validatsiya(forma, sxema):
    toza = {}; xatolar = {}
    HAR BIR maydon IN forma: AGAR maydon NOT IN sxema: xatolar[maydon] = "ruxsat etilmagan"
    HAR BIR (nom, qoida) IN sxema:
        q = normallashtir(forma.get(nom, qoida.standart))
        AGAR q BO'SH VA qoida.majburiy: xatolar[nom] = "majburiy"; DAVOM_ET
        AGAR NOT (qoida.min <= uzunlik(q) <= qoida.max): xatolar[nom] = "uzunlik"; DAVOM_ET
        AGAR qoida.regex VA NOT TO'LIQ_MOS(qoida.regex, q): xatolar[nom] = "format"; DAVOM_ET
        toza[nom] = qoida.tur(q)
    QAYTAR toza, xatolar`),
          B.h(`Python: qo'lda yozilgan validator`, '🐍'),
          B.code('python', 'validator.py', String.raw`
import re
import unicodedata
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

@dataclass
class Rule:
    required: bool = True
    min_len: int = 0
    max_len: int = 255
    pattern: str | None = None
    cast: type = str

SCHEMA = {
    "full_name": Rule(min_len=2, max_len=80, pattern=r"[A-Za-zʻ'\- ]+"),
    "phone":     Rule(pattern=r"\+998\d{9}"),
    "email":     Rule(max_len=254, pattern=r"[^@\s]+@[^@\s]+\.[a-z]{2,}"),
    "amount":    Rule(max_len=12, pattern=r"\d+(\.\d{1,2})?", cast=Decimal),
}

def normalize(value: str) -> str:
    return unicodedata.normalize("NFC", value).strip()

def validate(form: dict, schema: dict = SCHEMA) -> tuple[dict, dict]:
    clean, errors = {}, {}
    for extra in set(form) - set(schema) - {"csrf_token"}:
        errors[extra] = "Ruxsat etilmagan maydon"          # mass assignment'ga qarshi
    for name, rule in schema.items():
        value = normalize(form.get(name, ""))
        if not value:
            if rule.required:
                errors[name] = "Majburiy maydon"
            continue
        if not (rule.min_len <= len(value) <= rule.max_len):
            errors[name] = f"{rule.min_len}-{rule.max_len} belgi bo'lishi kerak"
            continue
        if rule.pattern and not re.fullmatch(rule.pattern, value):   # ✅ fullmatch
            errors[name] = "Noto'g'ri format"
            continue
        try:
            clean[name] = rule.cast(value)
        except (ValueError, InvalidOperation):
            errors[name] = "Noto'g'ri qiymat"
    if "amount" in clean and not (Decimal("1") <= clean["amount"] <= Decimal("50000000")):
        errors["amount"] = "Summa 1 dan 50 mln so'mgacha bo'lishi kerak"
    return clean, errors

# Sinov
print(validate({"full_name": " Avazbek ", "phone": "+998901234567",
                "email": "a@pochta.uz", "amount": "15000.50", "is_admin": "1"}))
`),
          B.note(`<b><code>re.match</code> va <code>re.fullmatch</code> farqi</b><code>re.match(r"\\d+", "123; DROP TABLE")</code> muvaffaqiyatli bo'ladi, chunki u faqat boshini tekshiradi! Validatsiyada doimo <code>re.fullmatch</code> yoki <code>^...$</code> ishlating (va <code>$</code> satr oxiridagi <code>\\n</code> ga ham mos kelishini unutmang — <code>\\Z</code> xavfsizroq).`, 'bad'),
          B.h(`Python: WTForms bilan deklarativ validatsiya`, '🐍'),
          B.code('python', 'forms.py', String.raw`
from flask_wtf import FlaskForm            # CSRF token avtomatik qo'shiladi
from wtforms import StringField, DecimalField, EmailField
from wtforms.validators import DataRequired, Length, Regexp, NumberRange, Email

class TransferForm(FlaskForm):
    to_account = StringField("Hisob raqam", validators=[
        DataRequired(), Regexp(r"^\d{20}\Z", message="20 ta raqam kiriting")])
    amount = DecimalField("Summa", places=2, validators=[
        DataRequired(), NumberRange(min=1, max=50_000_000)])
    email = EmailField("Chek uchun e-mail", validators=[Length(max=254), Email()])

@app.route("/otkazma", methods=["GET", "POST"])
def transfer():
    form = TransferForm()
    if form.validate_on_submit():          # POST + CSRF + barcha validatorlar
        do_transfer(current_user, form.to_account.data, form.amount.data)
        return redirect(url_for("transfer_done"), code=303)
    return render_template("otkazma.html", form=form)
`)
        ].join('')
      },

      /* ---------------- 3.3 ---------------- */
      {
        id: 'l3-3', title: `XSS va CSRF aloqasi: nega XSS barcha himoyani buzadi`, dur: 14,
        html: [
          B.p(`<b>XSS (Cross-Site Scripting)</b> — hujumchining JavaScript kodi sizning saytingiz ichida, sizning origin'ingiz nomidan ishlashi. Agar saytda XSS bo'lsa, hujumchi kodi xuddi o'sha origin'da ishlaydi va <b>CSRF tokenni sahifadan o'qib olib</b>, to'g'ri so'rov yubora oladi. Ya'ni XSS mavjud bo'lsa, hech qanday CSRF himoyasi ishlamaydi.`),
          B.seq(
            [{ name: `Qurbon brauzeri`, sub: `bank.uz sahifasi` }, { name: `XSS skript`, sub: `bank.uz ichida!`, cls: 'box-bad' }, { name: `bank.uz server`, cls: 'box-good' }],
            [
              { f: 0, t: 2, l: `GET /izohlar (zararli izoh bor)`, n: 1 },
              { f: 2, t: 0, l: `HTML + <script> (escape qilinmagan)`, d: true, k: 'bad', n: 2 },
              { f: 1, t: 2, l: `fetch GET /otkazma (same-origin)`, k: 'bad', n: 3 },
              { f: 2, t: 1, l: `forma + csrf_token=T`, d: true },
              { f: 1, t: 1, l: `DOM'dan T ni o'qiydi` },
              { f: 1, t: 2, l: `POST /otkazma csrf_token=T`, k: 'bad', n: 4 },
              { note: `Token to'g'ri, Origin to'g'ri, SameSite o'tadi → so'rov bajariladi!`, at: [0, 2], k: 'bad' }
            ],
            `<b>15-rasm.</b> XSS yordamida CSRF himoyasini aylanib o'tish. Barcha tekshiruvlar "same-origin" ko'rinadi.`
          ),
          B.table([``, `CSRF`, `XSS`], [
            [`Kod qayerda ishlaydi`, `Hujumchi saytida`, `Nishon saytning ichida`],
            [`Javobni o'qiy oladimi`, `Yo'q`, `Ha`],
            [`Asosiy himoya`, `Token, SameSite, Origin`, `Escaping, CSP, validatsiya, sanitizatsiya`],
            [`Bir-biriga ta'siri`, `XSS'dan himoya qilmaydi`, `CSRF himoyasini to'liq buzadi`]
          ]),
          B.h(`XSS'ning oldini olish algoritmi`, '⚙️'),
          B.algo(`Chiqishni xavfsiz qilish`, [
            `Ma'lumot qaysi kontekstga chiqarilishini aniqlang: HTML matn, HTML atribut, JavaScript, URL, CSS.`,
            `Shu kontekstga mos <b>escaping</b> qo'llang (HTML uchun <code>&amp;lt; &amp;gt; &amp;amp; &amp;quot; &amp;#x27;</code>).`,
            `Shablon dvigatelining avtomatik escaping'ini o'chirmang (<code>|safe</code>, <code>Markup()</code>, <code>mark_safe</code> dan ehtiyot bo'ling).`,
            `Foydalanuvchi HTML kiritishi kerak bo'lsa — ruxsat ro'yxati asosidagi sanitizer (<code>bleach</code>/<code>nh3</code>) ishlating.`,
            `<code>Content-Security-Policy</code> bilan inline skriptlarni taqiqlang (nonce yoki hash orqali ruxsat).`,
            `Sessiya cookie'siga <code>HttpOnly</code> qo'ying — XSS bo'lsa ham cookie o'g'irlanmaydi.`
          ]),
          B.h(`Python: escaping, sanitizatsiya va CSP`, '🐍'),
          B.code('python', 'xss_himoya.py', String.raw`
from markupsafe import escape, Markup
import secrets
import nh3                                  # pip install nh3 (Rust asosidagi sanitizer)
from flask import Flask, render_template_string, g

app = Flask(__name__)

comment = '<img src=x onerror="fetch(\'/otkazma\')">Salom'

# ❌ XAVFLI: foydalanuvchi matnini to'g'ridan-to'g'ri HTML'ga qo'shish
bad_html = "<p>" + comment + "</p>"

# ✅ Escaping: matn sifatida ko'rsatiladi
safe_html = Markup("<p>{}</p>").format(comment)   # format avtomatik escape qiladi
print(escape(comment))
# &lt;img src=x onerror=&#34;fetch(&#39;/otkazma&#39;)&#34;&gt;Salom

# ✅ Cheklangan HTML kerak bo'lsa — whitelist sanitizer
clean = nh3.clean(comment, tags={"b", "i", "a", "p"}, attributes={"a": {"href"}})
print(clean)    # <img> va onerror olib tashlanadi -> "Salom"

# ✅ CSP nonce: faqat server bergan skriptlar ishlaydi
@app.before_request
def make_nonce():
    g.csp_nonce = secrets.token_urlsafe(16)

@app.after_request
def csp(resp):
    resp.headers["Content-Security-Policy"] = (
        f"default-src 'self'; script-src 'self' 'nonce-{g.csp_nonce}'; "
        "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    )
    return resp

@app.get("/izohlar")
def comments():
    # Jinja2 {{ }} avtomatik escape qiladi; |safe ishlatmang!
    return render_template_string(
        "<p>{{ c }}</p><script nonce='{{ g.csp_nonce }}'>console.log('ok')</script>",
        c=comment)
`),
          B.note(`<b><code>form-action 'self'</code></b>CSP'ning bu direktivasi sahifadagi formalar faqat o'z domeningizga yuborilishini ta'minlaydi. Agar hujumchi HTML in'ektsiya qila olsa ham, formani o'z serveriga yo'naltira olmaydi.`, 'good'),
          B.h(`Interaktiv: escaping qanday ishlaydi`, '🧪'),
          B.demo('escaper')
        ].join('')
      },

      /* ---------------- 3.4 ---------------- */
      {
        id: 'l3-4', title: `Qo'shimcha himoya: clickjacking, qayta yuborish, rate limit`, dur: 12,
        html: [
          B.p(`CSRF token so'rov soxta emasligini isbotlaydi, lekin foydalanuvchini <b>aldab o'z qo'li bilan bosishga</b> majburlash (clickjacking) yoki formani ikki marta yuborish kabi muammolarni hal qilmaydi. Bu darsda xavfsiz formaning qolgan "qulflari"ni ko'rib chiqamiz.`),
          B.h(`1. Clickjacking (UI redressing)`, '🖱️'),
          B.fig('0 0 760 230', `
            <rect class="box-bad" x="20" y="20" width="330" height="190" rx="10"/>
            <text class="tb" x="185" y="46" text-anchor="middle">evil.com (ko'rinadigan qism)</text>
            <rect class="box" x="85" y="130" width="200" height="44" rx="6"/><text class="tb" x="185" y="157" text-anchor="middle">🎁 Sovg'ani olish</text>
            <rect x="30" y="60" width="310" height="140" rx="6" fill="none" stroke="var(--d-acc)" stroke-dasharray="6 4" stroke-width="2"/>
            <text class="tm" x="185" y="78" text-anchor="middle" style="fill:var(--d-acc)">shaffof iframe: bank.uz/otkazma (opacity: 0)</text>
            <text class="tm" x="185" y="122" text-anchor="middle" style="fill:var(--d-acc)">[ Tasdiqlash ] tugmasi aynan shu yerda</text>
            <line class="ln" x1="360" y1="115" x2="420" y2="115" marker-end="url(#A)"/>
            <rect class="box-good" x="430" y="20" width="310" height="190" rx="10"/>
            <text class="tb" x="585" y="50" text-anchor="middle">Himoya</text>
            <text class="tc" x="450" y="90">X-Frame-Options: DENY</text>
            <text class="tc" x="450" y="120">Content-Security-Policy:</text>
            <text class="tc" x="470" y="140">frame-ancestors 'none'</text>
            <text class="tm" x="450" y="180">Brauzer sahifani iframe ichida</text>
            <text class="tm" x="450" y="196">ko'rsatishdan bosh tortadi</text>
          `, `<b>16-rasm.</b> Clickjacking: foydalanuvchi "sovg'a" tugmasini bosadi, aslida esa ko'rinmas iframe'dagi bank tugmasini bosgan bo'ladi. CSRF token bu yerda yordam bermaydi, chunki so'rov haqiqiy sahifadan ketadi.`),
          B.h(`2. Qayta yuborish va idempotentlik`, '🔁'),
          B.p(`Foydalanuvchi "Yuborish" ni ikki marta bossa yoki sahifani yangilasa, to'lov ikki marta bajarilishi mumkin. Yechim: <b>Post/Redirect/Get</b> va bir martalik <b>idempotency kaliti</b>.`),
          B.seq(
            [{ name: `Brauzer` }, { name: `Server`, cls: 'box-acc' }],
            [
              { f: 0, t: 1, l: `POST /tolov  idem_key=K1`, n: 1 },
              { f: 1, t: 1, l: `K1 yangi → bajarish, K1 ni saqlash` },
              { f: 1, t: 0, l: `303 See Other → /tolov/123`, d: true, k: 'good', n: 2 },
              { f: 0, t: 1, l: `GET /tolov/123 (F5 xavfsiz)`, n: 3 },
              { f: 0, t: 1, l: `POST /tolov  idem_key=K1 (takror)`, k: 'bad', n: 4 },
              { f: 1, t: 0, l: `409 / oldingi natija qaytariladi`, d: true, k: 'good' }
            ],
            `<b>17-rasm.</b> Post/Redirect/Get va idempotency kaliti takroriy to'lovning oldini oladi.`
          ),
          B.algo(`Bir martalik forma kaliti`, [
            `Forma chiqarilganda <code>idem_key = uuid4()</code> yarating va yashirin maydonga qo'ying.`,
            `So'rov kelganda kalitni atomar ravishda "ishlatilgan" deb belgilang (Redis <code>SET NX</code> yoki DB unique index).`,
            `Belgilash muvaffaqiyatsiz bo'lsa (kalit allaqachon bor) — amalni bajarmang, oldingi natijani qaytaring.`,
            `Muvaffaqiyatdan keyin 303 redirect qiling.`
          ]),
          B.h(`3. Rate limiting`, '⏱️'),
          B.p(`Login, parolni tiklash va OTP formalari brute-force hujumiga uchraydi. Har bir IP/akkaunt uchun vaqt oynasida urinishlar sonini cheklang.`),
          B.h(`Python: uchala himoya bitta faylda`, '🐍'),
          B.code('python', 'qoshimcha_himoya.py', String.raw`
import time
import uuid
from collections import defaultdict, deque
from flask import Flask, request, abort, redirect, render_template_string, session

app = Flask(__name__)
app.config["SECRET_KEY"] = "change-me"

# --- 1. Clickjacking ---
@app.after_request
def no_framing(resp):
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers.setdefault("Content-Security-Policy", "frame-ancestors 'none'")
    return resp

# --- 2. Idempotency (namuna uchun xotirada; amalda Redis SET NX) ---
USED_KEYS: dict[str, str] = {}

@app.get("/tolov")
def pay_form():
    key = str(uuid.uuid4())
    session.setdefault("idem", []).append(key)
    session.modified = True
    return render_template_string("""
      <form method="post">
        <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
        <input type="hidden" name="idem_key" value="{{ key }}">
        <input name="summa" type="number" min="1" required>
        <button onclick="this.disabled=true;this.form.submit()">To'lash</button>
      </form>""", key=key)

@app.post("/tolov")
def pay():
    key = request.form.get("idem_key", "")
    if key not in session.get("idem", []):
        abort(400, "Noma'lum forma kaliti")
    if key in USED_KEYS:                          # takroriy yuborish
        return redirect(USED_KEYS[key], code=303)
    payment_id = 123                              # ... to'lovni bajarish ...
    USED_KEYS[key] = f"/tolov/{payment_id}"
    return redirect(USED_KEYS[key], code=303)     # PRG

# --- 3. Sliding window rate limit ---
ATTEMPTS: dict[str, deque] = defaultdict(deque)

def rate_limit(key: str, limit: int = 5, window: int = 300) -> None:
    now = time.monotonic()
    q = ATTEMPTS[key]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        abort(429, "Juda ko'p urinish. Keyinroq qayta urinib ko'ring.")
    q.append(now)

@app.post("/login")
def login():
    rate_limit(f"ip:{request.remote_addr}")
    rate_limit(f"user:{request.form.get('username', '').lower()}")
    ...
`)
        ].join('')
      },

      /* ---------------- Quiz 3 ---------------- */
      {
        id: 'q3', title: `3-bo'lim testi`, dur: 5, type: 'quiz',
        questions: [
          { q: `Brauzerdagi <code>required</code> va <code>pattern</code> atributlari haqida qaysi gap to'g'ri?`, o: [`Ular yetarli himoya beradi`, `Ular faqat foydalanuvchi qulayligi uchun; server validatsiyasi baribir shart`, `Ular CSRF'dan himoya qiladi`, `Ular XSS'ni to'xtatadi`], a: 1, e: `Hujumchi so'rovni brauzersiz (curl) yuborishi mumkin.` },
          { q: `Saytda saqlangan XSS bo'lsa, CSRF token himoyasi...`, o: [`To'liq ishlaydi`, `Aylanib o'tiladi, chunki skript tokenni sahifadan o'qiydi`, `Faqat GET'da buziladi`, `SameSite tufayli saqlanib qoladi`], a: 1, e: `XSS same-origin'da ishlaydi va tokenni DOM'dan oladi.` },
          { q: `Validatsiyada qaysi funksiya to'g'ri?`, o: [`re.match(r"\\d+", s)`, `re.search(r"\\d+", s)`, `re.fullmatch(r"\\d+", s)`, `s.isdigit() or True`], a: 2, e: `fullmatch butun satr naqshga mos kelishini talab qiladi.` },
          { q: `Clickjacking'dan himoya qiluvchi sarlavha?`, o: [`X-Frame-Options: DENY`, `X-CSRF-Token`, `Access-Control-Allow-Origin: *`, `Cache-Control: no-store`], a: 0, e: `Shuningdek CSP frame-ancestors 'none' ham ishlatiladi.` },
          { q: `Post/Redirect/Get naqshining maqsadi?`, o: [`CSRF tokenni yashirish`, `Sahifa yangilanganda formaning qayta yuborilishining oldini olish`, `Tezlikni oshirish`, `SEO uchun`], a: 1, e: `POST'dan keyin 303 redirect qilinsa, F5 faqat GET'ni takrorlaydi.` }
        ]
      }
    ]
  });
})();

/* ---------------- 4-BO'LIM. Framework'larda amaliyot ---------------- */
(function () {
  const { B, COURSE } = window.CSRF;

  COURSE.sections.push({
    id: 's4',
    title: `Python framework'larida amaliyot`,
    lessons: [
      /* ---------------- 4.1 ---------------- */
      {
        id: 'l4-1', title: `Flask: Flask-WTF va CSRFProtect`, dur: 16,
        html: [
          B.p(`Flask o'zida CSRF himoyasiga ega emas, lekin <b>Flask-WTF</b> kengaytmasi to'liq, sinovdan o'tgan yechim beradi. U HMAC bilan imzolangan, vaqt cheklovli token yaratadi va sessiyadagi tasodifiy qiymatga bog'laydi.`),
          B.code('bash', 'terminal', `pip install flask flask-wtf email-validator`),
          B.fig('0 0 760 200', `
            <rect class="box-acc" x="10" y="20" width="160" height="50" rx="8"/><text class="tb" x="90" y="50" text-anchor="middle">csrf.init_app(app)</text>
            <line class="ln" x1="170" y1="45" x2="218" y2="45" marker-end="url(#A)"/>
            <rect class="box" x="220" y="20" width="180" height="50" rx="8"/><text class="t" x="310" y="42" text-anchor="middle">before_request</text><text class="tm" x="310" y="60" text-anchor="middle">POST/PUT/PATCH/DELETE</text>
            <line class="ln" x1="400" y1="45" x2="448" y2="45" marker-end="url(#A)"/>
            <rect class="box" x="450" y="20" width="140" height="50" rx="8"/><text class="t" x="520" y="42" text-anchor="middle">validate_csrf()</text><text class="tm" x="520" y="60" text-anchor="middle">imzo + muddat</text>
            <line class="ln-good" x1="590" y1="45" x2="638" y2="45" marker-end="url(#AG)"/>
            <rect class="box-good" x="640" y="20" width="110" height="50" rx="8"/><text class="tb" x="695" y="50" text-anchor="middle">view()</text>
            <line class="ln-bad" x1="520" y1="70" x2="520" y2="118" marker-end="url(#AB)"/>
            <rect class="box-bad" x="430" y="120" width="180" height="50" rx="8"/><text class="tb" x="520" y="142" text-anchor="middle">CSRFError → 400</text><text class="tm" x="520" y="160" text-anchor="middle">errorhandler orqali</text>
            <text class="tc" x="20" y="110">token = sign(sha1(session_rnd), muddat)</text>
            <text class="tc" x="20" y="132">form: csrf_token | header: X-CSRFToken</text>
            <text class="tm" x="20" y="160">WTF_CSRF_TIME_LIMIT = 3600 s (standart)</text>
          `, `<b>18-rasm.</b> Flask-WTF CSRFProtect ishlash oqimi.`),
          B.algo(`Flask loyihasida CSRF'ni yoqish`, [
            `<code>SECRET_KEY</code> ni muhit o'zgaruvchisidan o'qing (kodda saqlamang).`,
            `<code>CSRFProtect(app)</code> — butun ilova uchun global himoya.`,
            `Shablonlarda <code>{{ form.hidden_tag() }}</code> yoki <code>{{ csrf_token() }}</code> qo'shing.`,
            `AJAX uchun tokenni <code>&lt;meta&gt;</code> ga qo'yib, <code>X-CSRFToken</code> sarlavhasida yuboring.`,
            `<code>CSRFError</code> uchun tushunarli xato sahifasi yozing.`,
            `Faqat tashqi webhook'lar uchun <code>@csrf.exempt</code> ishlating va ularni imzo bilan himoyalang.`
          ]),
          B.h(`To'liq ilova`, '🐍'),
          B.code('python', 'app.py', String.raw`
import os
from flask import Flask, render_template, redirect, url_for, flash, request
from flask_wtf import FlaskForm
from flask_wtf.csrf import CSRFProtect, CSRFError
from wtforms import StringField, EmailField, TextAreaField
from wtforms.validators import DataRequired, Email, Length

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ["SECRET_KEY"],          # export SECRET_KEY=$(python -c "import secrets;print(secrets.token_hex(32))")
    WTF_CSRF_TIME_LIMIT=3600,                    # token 1 soat yaroqli
    WTF_CSRF_SSL_STRICT=True,                    # HTTPS'da Referer tekshiruvi
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)
csrf = CSRFProtect(app)

class ContactForm(FlaskForm):
    name = StringField("Ism", validators=[DataRequired(), Length(2, 80)])
    email = EmailField("E-mail", validators=[DataRequired(), Email(), Length(max=254)])
    message = TextAreaField("Xabar", validators=[DataRequired(), Length(10, 2000)])

@app.route("/aloqa", methods=["GET", "POST"])
def contact():
    form = ContactForm()
    if form.validate_on_submit():
        save_message(form.name.data, form.email.data, form.message.data)
        flash("Xabaringiz yuborildi!")
        return redirect(url_for("contact"), code=303)
    return render_template("aloqa.html", form=form)

@app.errorhandler(CSRFError)
def handle_csrf_error(e):
    app.logger.warning("CSRF xato: %s (%s)", e.description, request.remote_addr)
    return render_template("csrf_xato.html", reason=e.description), 400

# Tashqi to'lov tizimi webhook'i: CSRF o'rniga HMAC imzo tekshiriladi
@app.post("/webhook/payme")
@csrf.exempt
def payme_webhook():
    verify_provider_signature(request)             # ✅ albatta!
    ...
`),
          B.code('html', 'templates/aloqa.html', `<form method="post" novalidate>
  {{ form.hidden_tag() }}   {# <input type="hidden" name="csrf_token" value="..."> #}

  {{ form.name.label }} {{ form.name(maxlength=80) }}
  {% for e in form.name.errors %}<small class="err">{{ e }}</small>{% endfor %}

  {{ form.email.label }} {{ form.email() }}
  {{ form.message.label }} {{ form.message(rows=5) }}

  <button type="submit">Yuborish</button>
</form>`),
          B.code('python', 'test_app.py', String.raw`
def test_post_without_token_is_rejected(client):
    r = client.post("/aloqa", data={"name": "Ali", "email": "a@b.uz", "message": "x" * 20})
    assert r.status_code == 400

def test_post_with_token_passes(client):
    page = client.get("/aloqa").get_data(as_text=True)
    token = page.split('name="csrf_token" type="hidden" value="')[1].split('"')[0]
    r = client.post("/aloqa", data={"csrf_token": token, "name": "Ali",
                                    "email": "a@b.uz", "message": "x" * 20})
    assert r.status_code == 303
`)
        ].join('')
      },

      /* ---------------- 4.2 ---------------- */
      {
        id: 'l4-2', title: `Django: CsrfViewMiddleware`, dur: 16,
        html: [
          B.p(`Django'da CSRF himoyasi <b>standart holatda yoqilgan</b>. <code>django.middleware.csrf.CsrfViewMiddleware</code> har bir xavfli so'rovda Origin (va HTTPS'da Referer) ni tekshiradi hamda cookie'dagi maxfiy qiymat bilan formadagi niqoblangan tokenni solishtiradi.`),
          B.seq(
            [{ name: `Brauzer` }, { name: `CsrfViewMiddleware`, cls: 'box-acc' }, { name: `View` }],
            [
              { f: 0, t: 1, l: `GET /profil/`, n: 1 },
              { f: 1, t: 2, l: `o'tkazadi (xavfsiz metod)` },
              { f: 2, t: 0, l: `HTML {% csrf_token %} + Set-Cookie csrftoken`, d: true, k: 'acc', n: 2 },
              { f: 0, t: 1, l: `POST + token + cookie`, n: 3 },
              { note: `1) Origin ∈ CSRF_TRUSTED_ORIGINS/host  2) Referer (HTTPS)  3) unmask(token) == cookie`, at: [0, 2], k: 'acc' },
              { f: 1, t: 2, l: `✓ view() chaqiriladi`, k: 'good' },
              { f: 1, t: 0, l: `✗ 403 CSRF verification failed`, d: true, k: 'bad' }
            ],
            `<b>19-rasm.</b> Django CsrfViewMiddleware tekshiruv tartibi.`
          ),
          B.note(`<b>Token niqoblash (masking)</b>Django har sahifada tokenni yangi tasodifiy "niqob" bilan qayta kodlaydi: <code>masked = mask + (secret ⊕ mask)</code>. Asosiy secret o'zgarmaydi, lekin HTML'dagi qiymat har safar boshqacha — bu HTTPS siqishiga asoslangan BREACH hujumidan himoya qiladi.`),
          B.algo(`Django loyihasida to'g'ri sozlash`, [
            `<code>MIDDLEWARE</code> da <code>CsrfViewMiddleware</code> borligiga ishonch hosil qiling (o'chirmang!).`,
            `Har bir POST formaga <code>{% csrf_token %}</code> qo'shing.`,
            `HTTPS'da <code>CSRF_COOKIE_SECURE</code>, <code>SESSION_COOKIE_SECURE</code> ni yoqing.`,
            `Boshqa subdomen/front-end'dan so'rov bo'lsa — <code>CSRF_TRUSTED_ORIGINS</code> ga sxema bilan qo'shing.`,
            `AJAX: tokenni cookie'dan yoki <code>{% csrf_token %}</code> dan o'qib, <code>X-CSRFToken</code> sarlavhasida yuboring.`,
            `<code>@csrf_exempt</code> ni faqat alohida imzo bilan himoyalangan webhook'larda ishlating.`
          ]),
          B.h(`settings.py`, '🐍'),
          B.code('python', 'config/settings.py', String.raw`
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",        # ✅ CSRF himoyasi
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",  # ✅ clickjacking
]

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_USE_SESSIONS = False             # True: token cookie o'rniga sessiyada saqlanadi
CSRF_TRUSTED_ORIGINS = ["https://app.misol.uz"]   # sxema bilan!
CSRF_FAILURE_VIEW = "core.views.csrf_failure"

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SECURE_HSTS_SECONDS = 31536000
X_FRAME_OPTIONS = "DENY"
`),
          B.h(`View, forma va shablon`, '🐍'),
          B.code('python', 'core/forms.py', String.raw`
from django import forms
from django.core.validators import RegexValidator

class TransferForm(forms.Form):
    account = forms.CharField(
        max_length=20,
        validators=[RegexValidator(r"^\d{20}\Z", "Hisob raqam 20 ta raqamdan iborat")])
    amount = forms.DecimalField(min_value=1, max_value=50_000_000, decimal_places=2)
    password = forms.CharField(widget=forms.PasswordInput, help_text="Tasdiqlash uchun parol")
`),
          B.code('python', 'core/views.py', String.raw`
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from .forms import TransferForm

@login_required
@require_http_methods(["GET", "POST"])     # boshqa metodlar 405
@csrf_protect                              # middleware'ga qo'shimcha kafolat
def transfer(request):
    form = TransferForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        if not request.user.check_password(form.cleaned_data["password"]):
            form.add_error("password", "Parol noto'g'ri")
        else:
            make_transfer(request.user, form.cleaned_data)
            return redirect("transfer_done")          # PRG
    return render(request, "core/transfer.html", {"form": form})

@ensure_csrf_cookie            # SPA uchun: csrftoken cookie'sini albatta o'rnatadi
def spa_index(request):
    return render(request, "spa.html")

def csrf_failure(request, reason=""):
    return render(request, "403_csrf.html", {"reason": reason}, status=403)
`),
          B.code('html', 'core/templates/core/transfer.html', `<form method="post">
  {% csrf_token %}
  {{ form.as_p }}
  <button type="submit">O'tkazish</button>
</form>

<script>
  // AJAX: Django hujjatlaridagi tavsiya etilgan usul
  function getCookie(name) {
    const v = document.cookie.split("; ").find(r => r.startsWith(name + "="));
    return v ? decodeURIComponent(v.split("=")[1]) : null;
  }
  fetch("/api/sevimli/", {
    method: "POST",
    headers: {"X-CSRFToken": getCookie("csrftoken")},
    mode: "same-origin",
  });
</script>`),
          B.note(`<b>Ko'p uchraydigan xato</b>"403 CSRF verification failed" xatosini yo'qotish uchun <code>@csrf_exempt</code> qo'yish yoki middleware'ni o'chirish — saytni butunlay ochib qo'yadi. To'g'ri yechim: tokenni formaga/sarlavhaga qo'shish yoki <code>CSRF_TRUSTED_ORIGINS</code> ni sozlash.`, 'bad')
        ].join('')
      },

      /* ---------------- 4.3 ---------------- */
      {
        id: 'l4-3', title: `FastAPI va REST API'larda CSRF`, dur: 13,
        html: [
          B.p(`API uchun CSRF kerakmi — bu <b>autentifikatsiya usuliga</b> bog'liq. Agar token <code>Authorization: Bearer …</code> sarlavhasida yuborilsa, brauzer uni avtomatik qo'shmaydi va CSRF imkonsiz. Agar API cookie (masalan, HttpOnly JWT cookie) bilan ishlasa — u oddiy sayt kabi CSRF'ga zaif.`),
          B.flow([
            { t: 'start', text: `API autentifikatsiyasi qanday?` },
            { t: 'dec', text: `Brauzer uni avtomatik yuboradimi?`, no: `Bearer header → CSRF yo'q`, nok: 'good' },
            { t: 'proc', text: `Cookie / Basic auth → CSRF xavfi bor` },
            { t: 'proc', text: `SameSite + JSON-only + Double Submit token` },
            { t: 'end', text: `Himoyalangan API` }
          ], `<b>20-rasm.</b> API'ga CSRF himoyasi kerakligini aniqlash.`),
          B.note(`<b>Bearer token va localStorage</b>Bearer token CSRF'ni yo'qotadi, lekin uni <code>localStorage</code> da saqlash XSS'da o'g'irlanishiga olib keladi. HttpOnly cookie esa XSS'dan yaxshiroq himoyalanadi, ammo CSRF himoyasini talab qiladi. Har bir yondashuvning narxi bor — ko'pincha "HttpOnly cookie + CSRF token" tanlanadi.`, 'warn'),
          B.algo(`FastAPI uchun Double Submit middleware`, [
            `Login'da ikki cookie bering: <code>session</code> (HttpOnly) va <code>csrf</code> (JS o'qiy oladi, imzolangan).`,
            `Middleware xavfsiz bo'lmagan metodlarda <code>X-CSRF-Token</code> sarlavhasini o'qiydi.`,
            `Sarlavha va cookie'ni doimiy vaqtda solishtiradi, imzoni sessiyaga nisbatan tekshiradi.`,
            `Mos kelmasa — 403 JSON javob qaytaradi.`
          ]),
          B.code('bash', 'terminal', `pip install fastapi uvicorn itsdangerous`),
          B.code('python', 'main.py', String.raw`
import hmac
import secrets
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

app = FastAPI()
SECRET = secrets.token_hex(32)            # amalda: os.environ["CSRF_SECRET"]
signer = URLSafeTimedSerializer(SECRET, salt="csrf")
SAFE = {"GET", "HEAD", "OPTIONS"}

@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    if request.method not in SAFE and not request.url.path.startswith("/webhook"):
        cookie = request.cookies.get("csrf", "")
        header = request.headers.get("x-csrf-token", "")
        sid = request.cookies.get("session", "")
        ok = bool(cookie) and hmac.compare_digest(cookie, header)
        if ok:
            try:
                data = signer.loads(header, max_age=3600)   # imzo + muddat
                ok = hmac.compare_digest(data.get("sid", ""), sid)
            except (BadSignature, SignatureExpired):
                ok = False
        if not ok:
            return JSONResponse({"detail": "CSRF tekshiruvidan o'tmadi"}, status_code=403)
    return await call_next(request)

@app.post("/auth/login")
async def login(response: Response):
    sid = secrets.token_urlsafe(32)
    # ... foydalanuvchini tekshirish, sid ni saqlash ...
    response.set_cookie("session", sid, httponly=True, secure=True, samesite="lax")
    response.set_cookie("csrf", signer.dumps({"sid": sid, "n": secrets.token_hex(8)}),
                        httponly=False, secure=True, samesite="strict")
    return {"ok": True}

@app.post("/api/orders")
async def create_order(request: Request):
    if request.headers.get("content-type", "").split(";")[0] != "application/json":
        raise HTTPException(415, "Faqat JSON")
    body = await request.json()
    return {"created": body}
`),
          B.h(`Qaysi usul qachon?`, '⚖️'),
          B.table([`Arxitektura`, `Tavsiya`], [
            [`Server-render (Jinja, Django templates)`, `Synchronizer token (framework'ning o'zidagi)`],
            [`SPA + o'z backend (cookie sessiya)`, `SameSite=Lax/Strict + X-CSRF-Token (double submit yoki sync)`],
            [`Mobil ilova / server-server`, `Bearer token — CSRF talab qilinmaydi`],
            [`Uchinchi tomon webhook'lari`, `CSRF exempt + HMAC imzo + IP whitelist`]
          ])
        ].join('')
      },

      /* ---------------- 4.4 ---------------- */
      {
        id: 'l4-4', title: `CSRF himoyasini testlash (pytest)`, dur: 13,
        html: [
          B.p(`Himoya yozilgani — ishlayotgani degani emas. Har bir xavfli endpoint uchun avtomatik testlar regressiyaning (kimdir bexosdan <code>@csrf_exempt</code> qo'shishining) oldini oladi.`),
          B.fig('0 0 760 230', `
            <text class="tb" x="20" y="30">Test matritsasi</text>
            ${['Token yo\'q', 'Noto\'g\'ri token', 'Boshqa sessiya', 'Muddati o\'tgan', 'Begona Origin', 'To\'g\'ri token'].map((t, i) => {
              const x = 20 + i * 123, good = i === 5;
              return `<rect class="${good ? 'box-good' : 'box-bad'}" x="${x}" y="50" width="113" height="56" rx="8"/><text class="t" x="${x + 56}" y="76" text-anchor="middle" style="font-size:12px">${t}</text><text class="tb" x="${x + 56}" y="96" text-anchor="middle" style="fill:var(--d-${good ? 'good' : 'bad'})">${good ? '200/303' : '400/403'}</text>`;
            }).join('')}
            <rect class="box-acc" x="20" y="130" width="720" height="80" rx="8"/>
            <text class="t" x="40" y="156">Har bir xavfli endpoint × har bir holat = parametrlashtirilgan test</text>
            <text class="tc" x="40" y="180">@pytest.mark.parametrize("path", UNSAFE_ENDPOINTS)</text>
            <text class="tm" x="40" y="200">Yangi endpoint qo'shilsa — ro'yxatga avtomatik kiradi (url_map orqali)</text>
          `, `<b>21-rasm.</b> CSRF test matritsasi: faqat to'g'ri token bilan so'rov muvaffaqiyatli bo'lishi kerak.`),
          B.algo(`CSRF test rejasi`, [
            `Ilovadagi barcha POST/PUT/PATCH/DELETE marshrutlarini avtomatik yig'ing.`,
            `Har biriga tokensiz so'rov yuboring → 400/403 kutiladi.`,
            `Tasodifiy (noto'g'ri) token bilan → 400/403.`,
            `Boshqa foydalanuvchi sessiyasidan olingan token bilan → 400/403.`,
            `Begona <code>Origin</code> bilan to'g'ri token → 403 (Origin tekshiruvi bo'lsa).`,
            `To'g'ri token va Origin bilan → muvaffaqiyat.`,
            `CI'da har push'da ishga tushiring.`
          ]),
          B.code('python', 'tests/conftest.py', String.raw`
import re
import pytest
from app import app as flask_app

@pytest.fixture
def app():
    flask_app.config.update(TESTING=True, WTF_CSRF_ENABLED=True)  # ❗ testda ham yoqiq
    yield flask_app

@pytest.fixture
def client(app):
    return app.test_client()

def extract_token(html: str) -> str:
    m = re.search(r'name="csrf_token"[^>]*value="([^"]+)"', html)
    assert m, "Sahifada CSRF token topilmadi"
    return m.group(1)
`),
          B.code('python', 'tests/test_csrf.py', String.raw`
import pytest
from app import app as flask_app
from .conftest import extract_token

UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}
EXEMPT = {"/webhook/payme"}

def unsafe_routes():
    for rule in flask_app.url_map.iter_rules():
        if rule.methods & UNSAFE and "<" not in rule.rule and rule.rule not in EXEMPT:
            yield rule.rule

@pytest.mark.parametrize("path", list(unsafe_routes()))
def test_no_token_rejected(client, path):
    r = client.post(path, data={"x": "1"})
    assert r.status_code in (400, 403), f"{path} tokensiz qabul qildi!"

@pytest.mark.parametrize("path", list(unsafe_routes()))
def test_forged_token_rejected(client, path):
    r = client.post(path, data={"csrf_token": "A" * 40})
    assert r.status_code in (400, 403)

def test_token_from_other_session_rejected(app):
    alice, eve = app.test_client(), app.test_client()
    eve_token = extract_token(eve.get("/aloqa").get_data(as_text=True))
    alice.get("/aloqa")
    r = alice.post("/aloqa", data={"csrf_token": eve_token, "name": "A",
                                   "email": "a@b.uz", "message": "x" * 20})
    assert r.status_code == 400

def test_valid_token_accepted(client):
    token = extract_token(client.get("/aloqa").get_data(as_text=True))
    r = client.post("/aloqa", data={"csrf_token": token, "name": "Ali",
                                    "email": "a@b.uz", "message": "x" * 20})
    assert r.status_code == 303
`),
          B.code('bash', 'terminal', `pytest -q tests/test_csrf.py
# ........                                    [100%]
# 8 passed in 0.42s`),
          B.note(`<b>Testda CSRF'ni o'chirmang</b>Ko'p qo'llanmalarda <code>WTF_CSRF_ENABLED = False</code> tavsiya qilinadi — bu testlarni osonlashtiradi, lekin CSRF himoyasi umuman tekshirilmaydi. Hech bo'lmaganda alohida CSRF test to'plamida uni yoqiq qoldiring.`, 'warn')
        ].join('')
      },

      /* ---------------- Quiz 4 ---------------- */
      {
        id: 'q4', title: `4-bo'lim testi`, dur: 5, type: 'quiz',
        questions: [
          { q: `Flask'da butun ilova uchun CSRF himoyasini qaysi kod yoqadi?`, o: [`app.csrf = True`, `CSRFProtect(app)`, `@csrf.exempt`, `session.csrf()`], a: 1, e: `flask_wtf.csrf.CSRFProtect global before_request tekshiruvini qo'shadi.` },
          { q: `Django shablonida formaga token qo'shish uchun nima yoziladi?`, o: [`{{ csrf }}`, `{% csrf_token %}`, `{% token %}`, `<csrf/>`], a: 1, e: `{% csrf_token %} yashirin csrfmiddlewaretoken maydonini chiqaradi.` },
          { q: `Django AJAX so'rovlarida token qaysi sarlavhada yuboriladi?`, o: [`X-CSRFToken`, `Authorization`, `X-Requested-With`, `Cookie`], a: 0, e: `CSRF_HEADER_NAME standart qiymati HTTP_X_CSRFTOKEN.` },
          { q: `API faqat <code>Authorization: Bearer</code> sarlavhasi bilan ishlasa...`, o: [`CSRF xavfi juda yuqori`, `Brauzer tokenni avtomatik qo'shmagani uchun CSRF amalda imkonsiz`, `SameSite=None kerak`, `CSRF_TRUSTED_ORIGINS shart`], a: 1, e: `CSRF avtomatik yuboriladigan hisob ma'lumotlariga tayanadi.` },
          { q: `Django'dagi token niqoblash (masking) nimadan himoya qiladi?`, o: [`SQL injection`, `BREACH (siqishga asoslangan) hujum`, `Clickjacking`, `Brute-force`], a: 1, e: `Har sahifada token boshqacha ko'rinadi, siqish orqali uni tiklab bo'lmaydi.` }
        ]
      }
    ]
  });
})();

/* ---------------- 5-BO'LIM. Yakuniy ---------------- */
(function () {
  const { B, COURSE } = window.CSRF;

  COURSE.sections.push({
    id: 's5',
    title: `Yakuniy loyiha va imtihon`,
    lessons: [
      {
        id: 'l5-1', title: `Xulosa: CSRF himoyasi bo'yicha qo'llanma (cheat sheet)`, dur: 10,
        html: [
          B.p(`Tabriklaymiz, kursning asosiy qismini tugatdingiz! Quyida barcha bilimlarni bitta sahifada jamladik — uni loyihalaringizda nazorat ro'yxati sifatida ishlating.`),
          B.fig('0 0 760 260', `
            ${[
              [110, 40, 'CSRF token', 'sync / signed double submit'],
              [650, 40, 'SameSite cookie', 'Lax / Strict + Secure'],
              [110, 220, 'Origin / Fetch Metadata', 'begona manbani rad etish'],
              [650, 220, 'XSS himoyasi', 'escaping + CSP + HttpOnly'],
              [380, 30, 'Xavfsiz metodlar', 'GET holatni o\'zgartirmaydi'],
              [380, 236, 'Qayta tasdiqlash', 'parol / OTP muhim amallarda']
            ].map(([x, y, t, s]) => `<line class="ln-d" x1="380" y1="130" x2="${x}" y2="${y}"/><rect class="box-good" x="${x - 95}" y="${y - 22}" width="190" height="44" rx="8"/><text class="tb" x="${x}" y="${y - 3}" text-anchor="middle" style="font-size:13px">${t}</text><text class="tm" x="${x}" y="${y + 13}" text-anchor="middle">${s}</text>`).join('')}
            <rect class="box-acc" x="280" y="100" width="200" height="60" rx="30"/>
            <text class="tb" x="380" y="127" text-anchor="middle">Xavfsiz forma</text>
            <text class="tm" x="380" y="145" text-anchor="middle">CSRF'ga chidamli</text>
          `, `<b>22-rasm.</b> CSRF himoyasining oltita ustuni.`),
          B.h(`Nazorat ro'yxati`, '✅'),
          B.table([`Qatlam`, `Nima qilish kerak`, `Python'da`], [
            [`HTTP metodlar`, `GET/HEAD holatni o'zgartirmasin`, `<code>@app.post</code>, <code>require_http_methods</code>`],
            [`CSRF token`, `Barcha xavfli so'rovlarda`, `<code>CSRFProtect</code>, <code>{% csrf_token %}</code>, <code>secrets.token_urlsafe</code>`],
            [`Solishtirish`, `Doimiy vaqtda`, `<code>hmac.compare_digest</code>`],
            [`Cookie`, `<code>Secure; HttpOnly; SameSite=Lax</code>, <code>__Host-</code>`, `<code>SESSION_COOKIE_*</code>`],
            [`Manba`, `Origin / Sec-Fetch-Site`, `<code>CSRF_TRUSTED_ORIGINS</code>, middleware`],
            [`API`, `JSON-only + custom header; CORS aniq ro'yxat`, `<code>request.mimetype</code>, <code>X-CSRF-Token</code>`],
            [`Forma`, `Server validatsiya, PRG, idempotency`, `WTForms, Django Forms, <code>re.fullmatch</code>`],
            [`XSS`, `Avto-escape, sanitizer, CSP`, `<code>markupsafe</code>, <code>nh3</code>`],
            [`Clickjacking`, `<code>frame-ancestors 'none'</code>`, `<code>XFrameOptionsMiddleware</code>`],
            [`Test`, `Har bir endpoint uchun CSRF testi`, `pytest + <code>url_map</code>`]
          ]),
          B.algo(`Yangi endpoint qo'shishda tekshiruv`, [
            `Bu endpoint holatni o'zgartiradimi? Ha bo'lsa — faqat POST/PUT/PATCH/DELETE.`,
            `Global CSRF himoyasi uni qamrab oladimi? <code>exempt</code> yo'qligini tekshiring.`,
            `Forma/AJAX tokenni yuboradimi?`,
            `Kiritiladigan har bir maydon uchun server validatsiyasi bormi?`,
            `Muhim amal bo'lsa — qayta tasdiqlash qo'shilganmi?`,
            `CSRF testi yozildimi va CI'da o'tdimi?`
          ]),
          B.h(`Mini-loyiha: o'zingiz bajaring`, '🛠️'),
          B.ol([
            `1.1-darsdagi himoyasiz Flask ilovasini oling.`,
            `Flask-WTF bilan <code>CSRFProtect</code> qo'shing va barcha formalarni <code>FlaskForm</code> ga o'tkazing.`,
            `Sessiya cookie'sini <code>__Host-session; Secure; HttpOnly; SameSite=Lax</code> qilib sozlang.`,
            `Origin tekshiruvchi middleware (2.4-dars) qo'shing.`,
            `Parolni o'zgartirish formasiga joriy parol so'rovini qo'shing.`,
            `4.4-darsdagi test to'plamini ishga tushirib, hammasi yashil bo'lishiga erishing.`,
            `1.3-darsdagi hujumchi serveri bilan hujumni qayta urinib ko'ring — u endi 400/403 qaytarishi kerak.`
          ]),
          B.code('python', 'yakuniy_shablon.py', String.raw`
"""Yakuniy loyiha uchun boshlang'ich shablon — barcha himoyalar bir joyda."""
import os
from flask import Flask
from flask_wtf.csrf import CSRFProtect

def create_app() -> Flask:
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=os.environ["SECRET_KEY"],
        SESSION_COOKIE_NAME="__Host-session",
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        WTF_CSRF_TIME_LIMIT=3600,
        WTF_CSRF_SSL_STRICT=True,
        MAX_CONTENT_LENGTH=1 * 1024 * 1024,     # 1 MB — katta so'rovlarga qarshi
    )
    CSRFProtect(app)

    @app.after_request
    def headers(resp):
        resp.headers["Content-Security-Policy"] = (
            "default-src 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'")
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return resp

    from .views import bp           # marshrutlar alohida modulda
    app.register_blueprint(bp)
    return app
`)
        ].join('')
      },
      {
        id: 'q5', title: `Yakuniy imtihon va sertifikat`, dur: 15, type: 'quiz', final: true,
        questions: [
          { q: `CSRF qisqartmasining to'liq nomi?`, o: [`Cross-Site Resource Filter`, `Cross-Site Request Forgery`, `Client-Side Request Forwarding`, `Cookie Session Replay Fault`], a: 1, e: `Cross-Site Request Forgery — saytlararo so'rovni soxtalashtirish.` },
          { q: `Quyidagi qaysi kombinatsiya eng kuchli himoyani beradi?`, o: [`Faqat SameSite=Lax`, `Faqat Referer tekshiruvi`, `CSRF token + SameSite + Origin tekshiruvi + XSS himoyasi`, `Faqat HTTPS`], a: 2, e: `Defense in depth: bir nechta mustaqil qatlam.` },
          { q: `Python'da qaysi modul CSRF token uchun mos tasodifiylik beradi?`, o: [`random`, `secrets`, `time`, `hashlib`], a: 1, e: `secrets — kriptografik xavfsiz psevdotasodifiy generator (CSPRNG).` },
          { q: `HMAC bilan imzolangan double-submit tokenning afzalligi?`, o: [`Token qisqaroq bo'ladi`, `Hujumchi o'z tokenini cookie'ga yozsa ham imzoni soxtalashtira olmaydi`, `Server tezroq ishlaydi`, `HTTPS kerak emas`], a: 1, e: `Imzo maxfiy kalit va sessiyaga bog'liq.` },
          { q: `<code>SameSite=None</code> qaysi atribut bilan birga bo'lishi shart?`, o: [`HttpOnly`, `Secure`, `Path=/`, `Max-Age`], a: 1, e: `Brauzerlar Secure'siz SameSite=None cookie'ni rad etadi.` },
          { q: `Login formasiga CSRF token kerakmi?`, o: [`Yo'q, foydalanuvchi hali kirmagan`, `Ha, Login CSRF'ning oldini olish uchun`, `Faqat admin panelda`, `Faqat mobil ilovada`], a: 1, e: `Aks holda qurbon hujumchi akkauntiga kiritib qo'yilishi mumkin.` },
          { q: `JSON API'ni <code>text/plain</code> forma orqali CSRF'dan himoya qilish uchun nima qilish kerak?`, o: [`Content-Type: application/json ni qat'iy talab qilish`, `GET'ga o'tkazish`, `Javobni shifrlash`, `CORS'ni * qilish`], a: 0, e: `application/json cross-origin uchun preflight talab qiladi.` },
          { q: `Origin tekshiruvida qaysi solishtirish to'g'ri?`, o: [`origin.startswith("https://bank.uz")`, `"bank.uz" in origin`, `origin_of(origin) in TRUSTED_ORIGINS (to'liq tenglik)`, `origin.endswith("bank.uz")`], a: 2, e: `Prefiks/qism-satr tekshiruvlari bank.uz.evil.com yoki evilbank.uz ni o'tkazib yuboradi.` },
          { q: `Django'da frontend boshqa subdomen (https://app.misol.uz) dan POST yuborsa nima qilinadi?`, o: [`@csrf_exempt qo'yiladi`, `CSRF_TRUSTED_ORIGINS ga qo'shiladi`, `Middleware o'chiriladi`, `SameSite=None qilinadi`], a: 1, e: `Sxema bilan to'liq origin ko'rsatiladi.` },
          { q: `Pul o'tkazish formasida joriy parolni so'rash CSRF'ning qaysi shartini buzadi?`, o: [`Muhim harakat mavjudligi`, `Cookie autentifikatsiyasi`, `Barcha parametrlarni oldindan bilish mumkinligi`, `Hech qaysisini`], a: 2, e: `Hujumchi parolni bilmaydi, demak so'rovni to'liq tuza olmaydi.` }
        ]
      }
    ]
  });
})();
