/* ============================================================
   Deep & Honey — Love Rulebook  (js/app.js)
   Compact rewrite: same behaviour, smaller surface.
   All functions are published on `window` so the inline
   onclick/onload attributes in index.html always resolve.
   ============================================================ */

// ==================== Password protection ====================
const CORRECT_PASSWORD = 'Deepnectar@1612@';
const HINT_TEXT = 'Hint: "Our pet name + @ + the Date & Month we met + @" 💕';
let attempts = 0;

function unlockPage() {
  document.getElementById('passwordOverlay').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  sessionStorage.setItem('deepNectarAccess', 'true');
  const input = document.getElementById('passwordInput');
  if (input) setTimeout(() => { input.value = ''; }, 100); // wipe from field & autofill cache
  initFloatingEmojis();
  warmBrandCache();
  createNectarSwarm();
  refreshSoulmateImage();
}

function checkPassword() {
  const input = document.getElementById('passwordInput');
  const error = document.getElementById('passwordError');
  if (input.value === CORRECT_PASSWORD) { unlockPage(); return; }
  attempts++;
  error.style.display = 'block';
  error.textContent = attempts >= 3 ? '❌ Wrong password ' + attempts + ' times! ' + HINT_TEXT : '❌ Wrong password! Try again.';
  input.value = '';
  input.focus();
  const overlay = document.getElementById('passwordOverlay');
  overlay.style.animation = 'shake 0.5s ease';
  setTimeout(() => { overlay.style.animation = ''; }, 500);
}

// ==================== Email format toggle ====================
function toggleEmailFormat() {
  const format = document.querySelector('input[name="emailFormat"]:checked').value;
  const preview = document.getElementById('htmlEmailPreview');
  const plainLabel = document.getElementById('plainFormatLabel');
  const htmlLabel = document.getElementById('htmlFormatLabel');
  if (format === 'html') {
    preview.classList.add('show');
    plainLabel.classList.remove('active-format');
    htmlLabel.classList.add('active-format');
    generateHtmlEmail('deep');
  } else {
    preview.classList.remove('show');
    htmlLabel.classList.remove('active-format');
    plainLabel.classList.add('active-format');
  }
}

// ==================== Brand images (logo + signatures) ====================
// Generated e-mails are copied out of the page, so relative asset URLs would
// break in mail clients. Images are inlined as base64 data URIs (cached).
const BRAND_IMAGE_CACHE = {};
const BRAND_ASSETS = ['assets/logo-stamp.png', 'assets/deep-signature.png', 'assets/honey-signature.png'];

function brandMime(p) { return /\.png$/i.test(p) ? 'image/png' : 'image/jpeg'; }

function encodeBytes(relPath, buf) {
  try {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    BRAND_IMAGE_CACHE[relPath] = `data:${brandMime(relPath)};base64,${btoa(binary)}`;
  } catch (e) { /* keep whatever we already have */ }
}

// Byte-safe while every code point is < 0x100; otherwise skip this source.
function encodeText(relPath, text) {
  try {
    if (!text) return;
    let binary = '';
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) > 255) return;
      binary += text[i];
    }
    BRAND_IMAGE_CACHE[relPath] = `data:${brandMime(relPath)};base64,${btoa(binary)}`;
  } catch (e) { /* ignore */ }
}

function fetchBrandAsset(relPath) {
  try {
    if (typeof fetch === 'function') {
      fetch(relPath).then(r => r.ok ? r.arrayBuffer() : null)
        .then(b => { if (b) encodeBytes(relPath, b); }).catch(() => {});
    }
  } catch (e) { /* ignore */ }
  // Sync XHR fallback for file:// pages where fetch is blocked by CORS.
  try {
    if (window.location.protocol === 'file:') {
      const sx = new XMLHttpRequest();
      sx.open('GET', relPath, false);
      sx.send();
      if (sx.status === 200 || sx.status === 0) encodeText(relPath, sx.responseText);
    }
  } catch (e) { /* ignore */ }
}

function warmBrandCache() { BRAND_ASSETS.forEach(fetchBrandAsset); }

function brandDataUri(relPath) {
  if (!BRAND_IMAGE_CACHE[relPath]) fetchBrandAsset(relPath);
  return BRAND_IMAGE_CACHE[relPath] || relPath;
}

function partnerSignatureUri(partnerName) {
  return brandDataUri(partnerName.indexOf('Honey') !== -1 ? 'assets/honey-signature.png' : 'assets/deep-signature.png');
}

// ==================== Generated complaint e-mail ====================
// PRIVACY: NO mail IDs anywhere — none stored, asked or prefilled. The user
// types the recipient directly inside their own email app after pasting.
const DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const TIME_OPTS = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
const DEEP_BRANDING = '\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░\n░░░░░░░░▒▓█►─═  𝔻𝕖𝕖𝕡ℕ𝕖𝕔𝕥𝕒𝕣  ═─◄█▓▒░░░░░░░░\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░\n\n🐝 "A love so deep, it turns into honey." 🐝\n\nOur eternal soulmate code that binds us forever';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateHtmlEmail(partner) {
  const selected = getSelectedResponses();
  const details = buildRuleDetails(selected);
  const personalMsg = document.getElementById('personalMessage').value.trim();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', DATE_OPTS);
  const timeStr = now.toLocaleTimeString('en-US', TIME_OPTS);

  const isDeep = partner !== 'honey';
  const partnerName = isDeep ? 'Deep 🐼' : 'Honey 🍯🐻';
  // SENDER = the OTHER partner (the one filing this complaint). Their sign
  // appears in the email — complaint about Honey shows Deep's signature,
  // complaint about Deep shows Honey's signature.
  const senderName = isDeep ? 'Honey 🍯🐻' : 'Deep 🐼';
  const subjectLine = `💌 Romantic Complaint About ${partnerName} - ${dateStr}`;
  document.getElementById('htmlSubjectDisplay').textContent = subjectLine;
  const subjectInput = document.getElementById('htmlSubjectInput');
  if (subjectInput) subjectInput.value = subjectLine; // kept so the copy button grabs it too

  const logoUri = brandDataUri('assets/logo-stamp.png');
  const signUri = partnerSignatureUri(senderName);
  // The "love stamp" (our official seal) in the sign-off area is deliberately
  // SMALL — a compact 56px round seal next to the signature, not a big badge.
  const LOVE_STAMP_SIZE = 56;

  // One elegant card per selected rule, each carrying its automatic
  // sub-selection: What Is The Issue / What We Have To Do / How To Fix It.
  const rulesHtml = details.length
    ? `<tr><td style="padding:28px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#fff8fa;border:1px solid #ffd6e0;border-radius:14px;">
          <tr><td style="padding:22px 24px 6px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#c2185b;font-weight:bold;">📜 Selected Rule Concerns &amp; Discussion Points</div>
            <div style="font-family:Arial,sans-serif;font-size:13px;color:#a06a75;margin-top:6px;line-height:1.6;">Each concern below automatically includes what the issue is, what we have to do, and how we fix it — with love.</div>
          </td></tr>
          <tr><td style="padding:10px 24px 24px;">
            ${details.map(d => d.meta ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #ffe0e8;border-left:5px solid #ff6699;border-radius:12px;margin:0 0 14px;">
              <tr><td style="padding:16px 18px;">
                <div style="font-family:Georgia,serif;font-size:16px;color:#d81b60;font-weight:bold;">💔 Rule ${escapeHtml(String(d.num))} — ${escapeHtml(d.meta.title)}</div>
                <div style="font-family:Arial,sans-serif;font-size:12px;color:#b07a85;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(d.meta.section)}</div>
                <div style="font-family:Arial,sans-serif;font-size:14px;color:#5a3d3d;line-height:1.7;margin-top:10px;">${escapeHtml(d.text)}</div>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;margin-top:12px;">
                  <tr>
                    <td style="padding:10px 12px;background:#fff0f4;border-radius:8px;font-family:Arial,sans-serif;font-size:13px;color:#5a3d3d;line-height:1.6;width:33%;vertical-align:top;"><strong style="color:#c2185b;">🔍 What Is The Issue:</strong><br>${escapeHtml(d.meta.issue)}</td>
                    <td style="width:8px;"></td>
                    <td style="padding:10px 12px;background:#fdf3e7;border-radius:8px;font-family:Arial,sans-serif;font-size:13px;color:#5a3d3d;line-height:1.6;width:33%;vertical-align:top;"><strong style="color:#b26a00;">🤝 What We Have To Do:</strong><br>${escapeHtml(d.meta.todo)}</td>
                    <td style="width:8px;"></td>
                    <td style="padding:10px 12px;background:#eefaf1;border-radius:8px;font-family:Arial,sans-serif;font-size:13px;color:#5a3d3d;line-height:1.6;width:33%;vertical-align:top;"><strong style="color:#1e7d43;">💖 How We Fix It:</strong><br>${escapeHtml(d.meta.fix)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>` : `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #ffe0e8;border-left:5px solid #ff6699;border-radius:12px;margin:0 0 14px;">
              <tr><td style="padding:14px 18px;font-family:Arial,sans-serif;font-size:14px;color:#5a3d3d;line-height:1.7;">${escapeHtml(d.text)}</td></tr>
            </table>`).join('')}
          </td></tr>
        </table>
      </td></tr>`
    : '';

  const personalHtml = personalMsg
    ? `<tr><td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#fff0f5;border:1px solid #ffd6e0;border-left:5px solid #ff3366;border-radius:12px;">
          <tr><td style="padding:20px 22px;">
            <div style="font-family:Georgia,serif;font-size:18px;color:#c2185b;font-weight:bold;">💖 Personal Message &amp; Deep Feelings</div>
            <div style="font-family:Georgia,serif;font-size:15px;color:#5a3d3d;line-height:1.9;margin-top:10px;white-space:pre-wrap;">${escapeHtml(personalMsg)}</div>
          </td></tr>
        </table>
      </td></tr>`
    : '';

  // Romantic + professional, mail-client-safe (tables + inline styles only).
  const htmlEmail = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${subjectLine}</title>
<!--[if mso]><style>body{font-family:Georgia,serif;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fbeef2;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbeef2;">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #f3cdd8;box-shadow:0 8px 30px rgba(194,24,91,0.10);">

      <!-- Header -->
      <tr><td style="background-color:#d81b60;background-image:linear-gradient(135deg,#ff6699 0%,#d81b60 60%,#ad1457 100%);padding:34px 32px;text-align:center;">
        <img src="${logoUri}" alt="DeepNectar Logo" width="84" height="84" style="display:block;margin:0 auto 14px;border-radius:50%;background:#ffffff;padding:5px;border:2px solid #ffc1d4;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#ffffff;font-weight:bold;line-height:1.3;">💌 Romantic Complaint About ${partnerName}</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffd9e4;margin-top:10px;letter-spacing:1px;">📅 ${dateStr} &nbsp;•&nbsp; ⏰ ${timeStr}</div>
        <div style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#ffe4ee;margin-top:8px;">"A love so deep, it turns into honey." 🐝</div>
      </td></tr>

      <!-- Intro -->
      <tr><td style="padding:30px 32px 6px;">
        <div style="font-family:Georgia,serif;font-size:18px;color:#c2185b;font-weight:bold;">💖 Our Complete Love &amp; Trust Rulebook Discussion</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8b5a5a;line-height:1.8;margin-top:8px;">My love, this gentle complaint is filed not to blame, but to understand — to strengthen our bond and honor every promise in our relationship contract. ❤️</div>
      </td></tr>
      ${rulesHtml}
      ${personalHtml}

      <!-- Closing note / sign-off area -->
      <tr><td style="padding:26px 32px 0;">
        <div style="font-family:Georgia,serif;font-size:15px;color:#5a3d3d;line-height:1.9;">I'm bringing this up because our relationship means everything to me 💕 — let's talk about it with love, understanding, and patience. Our bond is worth protecting and strengthening every day. 🤝✨</div>
        <div style="font-family:Georgia,serif;font-size:15px;color:#c2185b;margin-top:14px;">With all my love and hope for our future,</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px;">
          <tr>
            <td valign="middle" style="padding:0 12px 0 0;">
              <img src="${signUri}" alt="${senderName} signature" width="170" style="display:block;max-width:170px;height:auto;">
            </td>
            <td valign="middle" align="center" style="padding:0;">
              <!-- small love stamp (official seal) -->
              <img src="${logoUri}" alt="Official DeepNectar love stamp" width="${LOVE_STAMP_SIZE}" height="${LOVE_STAMP_SIZE}" style="display:block;width:${LOVE_STAMP_SIZE}px;height:${LOVE_STAMP_SIZE}px;border-radius:50%;background:#ffffff;padding:3px;border:2px solid #ffc1d4;">
              <div style="font-family:Arial,sans-serif;font-size:8px;color:#cc0044;letter-spacing:.5px;margin-top:3px;text-transform:uppercase;">Love Stamp</div>
            </td>
          </tr>
        </table>
        <div style="font-family:Arial,sans-serif;font-size:13px;color:#8b5a5a;margin-top:6px;">— ${senderName} (filed about ${partnerName})</div>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:26px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="border-top:2px solid #ffc1d4;"></td>
          <td style="font-family:Arial,sans-serif;font-size:16px;color:#ff6699;padding:0 12px;">💞</td>
          <td style="border-top:2px solid #ffc1d4;"></td>
        </tr></table>
      </td></tr>

      <!-- Soulmate code -->
      <tr><td style="padding:0 32px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background-color:#fce4ec;border:1px dashed #f06292;border-radius:14px;">
          <tr><td align="center" style="padding:22px 20px;">
            <div style="font-family:Georgia,serif;font-size:16px;color:#c2185b;font-weight:bold;">🔐 Our Eternal Soulmate Code ♾️</div>
            <div style="font-family:Georgia,serif;font-size:26px;color:#d81b60;font-weight:bold;letter-spacing:4px;margin-top:8px;">DeepNectar</div>
            <div style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#8b5a5a;margin-top:8px;">"A love so deep, it turns into honey." 🐼❤️🐻🍯</div>
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background-color:#ad1457;padding:26px 32px;text-align:center;">
        <img src="${logoUri}" alt="DeepNectar Logo" width="54" height="54" style="display:block;margin:0 auto 10px;border-radius:50%;background:#ffffff;padding:4px;">
        <div style="font-family:Georgia,serif;font-size:17px;color:#ffffff;font-weight:bold;">💖 Forever Yours, Always Us 💖</div>
        <div style="font-family:Arial,sans-serif;font-size:12px;color:#f8bbd0;margin-top:8px;line-height:1.7;">This code represents our eternal connection — no matter what we discuss or work through,<br>we are DeepNectar forever. 🐼❤️🐻</div>
      </td></tr>

    </table>
    <div style="font-family:Arial,sans-serif;font-size:11px;color:#b07a85;margin-top:16px;">💌 Crafted with love • DeepNectar Love Contract</div>
  </td></tr>
</table>
</body>
</html>`;

  document.getElementById('htmlEmailContent').value = htmlEmail;
}

function copyHtmlEmail() {
  const subjectInput = document.getElementById('htmlSubjectInput');
  const subject = (subjectInput && subjectInput.value) ? subjectInput.value : '';
  // The clipboard gets BOTH: a SUBJECT line to paste manually, then the HTML code.
  const payload = `SUBJECT: ${subject}\n\n${document.getElementById('htmlEmailContent').value}`;

  const done = () => {
    const btn = document.getElementById('copyHtmlBtn');
    btn.textContent = '✅ Subject + HTML Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 Copy Subject + HTML'; btn.classList.remove('copied'); }, 3000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload).then(done).catch(() => fallbackCopy());
  } else {
    fallbackCopy();
  }

  function fallbackCopy() {
    const textarea = document.getElementById('htmlEmailContent');
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    try { document.execCommand('copy'); } catch (e) { /* clipboard unavailable */ }
    done();
  }
}

// ==================== Device-aware floating emojis ====================
function getDeviceType() {
  const ua = navigator.userAgent, w = window.innerWidth;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    if (/iPad|Android(?!.*Mobile)|Tablet|Silk/i.test(ua) || (w >= 768 && w <= 1024)) return 'tablet';
    return 'mobile';
  }
  if (w <= 768) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}
function isMobileDevice() { const d = getDeviceType(); return d === 'mobile' || d === 'tablet'; }

function getDevicePerformanceProfile() {
  const deviceType = getDeviceType();
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSlowConnection = !!(conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g'));
  // PHONE SPEED BOOST: far fewer, GPU-cheap hearts on phones/tablets so
  // scrolling stays smooth. Infinite animations are also disabled in CSS on
  // touch devices (see "PHONE SPEED BOOST" in css/style.css).
  const emojiCount = deviceType === 'desktop' ? 45 : deviceType === 'tablet' ? 16 : isSlowConnection ? 8 : 10;
  return {
    deviceType, isSlowConnection, emojiCount,
    minSize: deviceType === 'desktop' ? 12 : 10,
    maxSize: deviceType === 'desktop' ? 24 : deviceType === 'tablet' ? 22 : 18,
    movementRange: deviceType === 'desktop' ? 300 : deviceType === 'tablet' ? 220 : 150,
    usePatterns: deviceType !== 'mobile',
    speedCycleInterval: deviceType === 'desktop' ? 12000 : deviceType === 'tablet' ? 16000 : 20000
  };
}

const SPEED_CLASSES = ['floating-emoji-slow', 'floating-emoji-medium-slow', 'floating-emoji-normal', 'floating-emoji-medium-fast', 'floating-emoji-fast', 'floating-emoji-super-fast', 'floating-emoji-floating', 'floating-emoji-dance'];
const PATTERN_CLASSES = ['floating-emoji-zigzag', 'floating-emoji-smooth', 'floating-emoji-bounce'];
const ALL_EMOJI_CLASSES = SPEED_CLASSES.concat(PATTERN_CLASSES);
const EMOJI_COLLECTION = ['❤️','💕','💖','💗','💓','💞','💘','💝','💟','❤️‍🔥','💑','👫','💏','💋','💌','✨','🌟','💫','⭐','🌠','🥰','😍','😘','😊','🌹','🌸','🌷','🌻','🌙','☀️','🐼','🐻','🐝','🍯','🦋','🕊️','🎀','💎','🍰','🧁','💍','👑','🎶','💭','🫂','🤗'];
const COLOR_PALETTE = ['#ff3366','#ff6699','#ff99cc','#ff6b6b','#ffa07a','#ffb6c1','#ff69b4','#ff1493','#ff4d4d','#ff8c69','#ffb347'];
let currentSpeedIndex = 2, speedCycleInterval = null;

function changeAllSpeeds(cls) {
  document.querySelectorAll('.floating-emoji').forEach(el => {
    el.classList.remove(...ALL_EMOJI_CLASSES);
    el.classList.add(cls);
  });
}
function cycleSpeed() {
  currentSpeedIndex = (currentSpeedIndex + 1) % SPEED_CLASSES.length;
  changeAllSpeeds(SPEED_CLASSES[currentSpeedIndex]);
}
function startSpeedCycling(p) {
  if (speedCycleInterval) clearInterval(speedCycleInterval);
  // PHONE SPEED BOOST: no cycling timer at all on touch-sized screens.
  if (getDeviceType() === 'desktop') {
    speedCycleInterval = setInterval(() => { if (!document.hidden) cycleSpeed(); }, p ? p.speedCycleInterval : 12000);
  }
}

function createFloatingEmojis() {
  const bg = document.getElementById('ultraRomanticBg');
  if (!bg) return null;
  const p = getDevicePerformanceProfile();
  bg.innerHTML = '';
  // PHONE SPEED BOOST: phones get a small, cheap batch of hearts (no glow
  // shadows, no will-change — see the CSS "PHONE SPEED BOOST" block), while
  // tablets/desktops keep the full romantic layer.
  const frag = document.createDocumentFragment();
  for (let i = 0; i < p.emojiCount; i++) {
    const el = document.createElement('div');
    el.className = 'floating-emoji floating-emoji-normal';
    if (p.usePatterns && Math.random() > 0.7) el.classList.add(PATTERN_CLASSES[Math.floor(Math.random() * PATTERN_CLASSES.length)]);
    el.textContent = EMOJI_COLLECTION[Math.floor(Math.random() * EMOJI_COLLECTION.length)];
    el.style.setProperty('--startX', Math.random() * 120 - 10 + 'vw');
    el.style.setProperty('--startY', Math.random() * 120 - 10 + 'vh');
    for (let j = 1; j <= 5; j++) {
      el.style.setProperty(`--moveX${j}`, Math.random() * p.movementRange * 2 - p.movementRange + 'px');
      el.style.setProperty(`--moveY${j}`, Math.random() * p.movementRange * 2 - p.movementRange + 'px');
    }
    el.style.fontSize = (Math.random() * (p.maxSize - p.minSize) + p.minSize) + 'px';
    el.style.animationDelay = Math.random() * 10 + 's';
    el.style.color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    // Glow text-shadows re-rasterize every frame — very costly on phones.
    if (p.deviceType === 'desktop') {
      el.style.textShadow = `0 0 ${Math.random() * 12 + 5}px currentColor`;
    }
    frag.appendChild(el);
  }
  bg.appendChild(frag);
  startSpeedCycling(p);
  return p;
}
function initFloatingEmojis() { window.__lastDeviceProfile = createFloatingEmojis(); }

// ==================== Nectar swarm ====================
function createNectarSwarm() {
  const swarm = document.getElementById('nectarSwarm');
  if (!swarm) return;
  const p = getDevicePerformanceProfile();
  swarm.innerHTML = '';
  const count = p.deviceType === 'desktop' ? 8 : p.deviceType === 'tablet' ? 7 : 6;
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.className = 'nectar-bee';
    span.style.fontSize = p.deviceType === 'mobile' ? '16px' : '20px';
    span.style.left = Math.random() * 90 + 5 + '%';
    span.style.animation = `swarmFloat ${Math.random() * 6 + 10}s linear infinite`;
    span.style.animationDelay = Math.random() * 12 + 's';
    span.style.opacity = Math.random() * 0.5 + 0.4;
    span.textContent = ['🐝', '🍯', '💧'][Math.floor(Math.random() * 3)];
    swarm.appendChild(span);
  }
}

// ==================== Complaints ====================
// Each rule carries its own sub-selection details: what the issue is,
// what should happen instead (what we have to do), and how to fix it.
// When a rule is selected in the complaint system, these details are
// automatically included in the plain-text AND HTML complaint emails.
const RULE_META = {
  1:  { title: 'Honesty Concern', section: 'Foundation Rules (1-12)', issue: 'Something feels like it isn\'t being shared openly between us.', todo: 'Share the truth gently and completely — trust is our foundation, so nothing stays hidden from each other.', fix: 'An open, judgment-free heart-to-heart where everything comes out with love.' },
  2:  { title: 'Loyalty Reassurance', section: 'Foundation Rules (1-12)', issue: 'I need reassurance about our commitment and loyalty to each other.', todo: 'Reaffirm our exclusive bond verbally and through actions — our bond is sacred and must be protected completely.', fix: 'A loving commitment reconfirmation and extra reassurance moments.' },
  3:  { title: 'Transparency Talk', section: 'Foundation Rules (1-12)', issue: 'Something feels hidden or not fully disclosed.', todo: 'Keep our "no secrets — big or small" promise alive; disclose what\'s being held back.', fix: 'Clear the air calmly, with full transparency and zero judgement.' },
  4:  { title: 'Support Needed', section: 'Foundation Rules (1-12)', issue: 'I feel alone during a difficult time and need more emotional support.', todo: 'Stand by each other in every moment — good or bad — with presence, listening and encouragement.', fix: 'Quality comfort time: a listen, a hug, and "I\'m here for you" in words and actions.' },
  5:  { title: 'Communication Issue', section: 'Foundation Rules (1-12)', issue: 'We haven\'t been sharing things before/after like we promised.', todo: 'Resume our promise of sharing — tell each other about important things before they happen and after.', fix: 'Rebuild the daily sharing habit so communication keeps our love strong.' },
  6:  { title: 'Feeling Ignored', section: 'Foundation Rules (1-12)', issue: 'I feel ignored or not prioritized recently.', todo: 'Honor our "presence over distance" promise — give attention, reply, and spend real time together.', fix: 'A dedicated reconnect session: undivided attention, no phones, just us.' },
  7:  { title: 'Valuation Issue', section: 'Foundation Rules (1-12)', issue: 'I don\'t feel valued equally like friends are.', todo: 'Give our relationship the same (or more) time, respect and fun we give to friends.', fix: 'Equal-value gestures: include each other in plans, prioritize us first.' },
  8:  { title: 'Priority Concern', section: 'Foundation Rules (1-12)', issue: 'Our relationship isn\'t getting the priority it deserves.', todo: 'Keep our special place in each other\'s lives — family first, then us, with us never last.', fix: 'A priority reset: schedule "us time" that cannot be displaced.' },
  9:  { title: 'Apology Problem', section: 'Foundation Rules (1-12)', issue: 'An apology didn\'t come with the promised effort.', todo: 'Back every sorry with real proof — photos and actions, not just words.', fix: 'A sincere apology plus visible corrective action (actions speak louder).' },
  10: { title: 'Daily Connection', section: 'Foundation Rules (1-12)', issue: 'We missed our daily selfie connection.', todo: 'Exchange our daily selfies — those smiles brighten the day and keep us connected across any distance.', fix: 'Restart the daily selfie ritual, no skipping.' },
  11: { title: 'Sanctuary Issue', section: 'Foundation Rules (1-12)', issue: 'We argued in front of others / didn\'t protect our private sanctuary.', todo: 'Keep disagreements private — pause them in public and save them for a calm moment alone.', fix: 'A private, calm resolution session and a renewed sanctuary promise.' },
  12: { title: 'Reset Problem', section: 'Foundation Rules (1-12)', issue: 'We went to sleep angry or distant without resolving our issue.', todo: 'Never end a day with anger — hug it out and reset with love before bedtime.', fix: 'Same-day resolution + bedtime reset hug, always.' },
  13: { title: 'Good Morning/Goodnight', section: 'Daily Love Habits (13-15)', issue: 'Our sweet Good Morning or Goodnight message was missed.', todo: 'Send the greeting no matter how busy — it says "you were on my mind first and last."', fix: 'Make the daily greeting non-negotiable, even one voice note counts.' },
  14: { title: '6-Second Kiss', section: 'Daily Love Habits (13-15)', issue: 'We skipped our 6-second kiss / a hello-goodbye went without a real kiss.', todo: 'Give the full 6-second kiss at hello and goodbye — a big kiss stops a small fight before it starts.', fix: 'Restart the kiss ritual today, twice (hello + goodbye).' },
  15: { title: 'Daily Compliment', section: 'Daily Love Habits (13-15)', issue: 'I didn\'t receive my daily genuine compliment.', todo: 'One specific, heartfelt compliment every day keeps our love glowing.', fix: 'Deliver today\'s compliment + pay the penalty: sing a love song to each other!' },
  16: { title: 'Respect / Contempt', section: 'Quarantine & Respect (16-18)', issue: 'Name-calling, mocking, eye-rolls or contempt happened during our argument.', todo: 'Complain about the problem, never attack the person — talk respectfully.', fix: 'A respectful redo of the conversation: no insults, only feelings and facts.' },
  17: { title: 'Breakup Threat', section: 'Quarantine & Respect (16-18)', issue: 'The word "breakup" was used as a threat or weapon during an argument.', todo: 'Keep our relationship a safe zone — that word NEVER wins a fight.', fix: 'Mutual re-promise: arguments stay about issues, never about ending us.' },
  18: { title: 'Cooling Rule', section: 'Quarantine & Respect (16-18)', issue: 'A time-out was taken but we didn\'t return, or silent treatment replaced the 24-hour cooling rule.', todo: 'Always come back within the cooling window and finish the conversation with love.', fix: 'Schedule the promised return-talk now and resolve it fully.' },
  19: { title: 'United Front', section: 'Us vs. The World (19-23)', issue: 'We argued, mocked, or corrected each other in front of family or friends.', todo: 'To the world we are ONE team — disagreements stay private, protect each other\'s image.', fix: 'Public unity pledge + handle any leftover disagreement privately.' },
  20: { title: 'Screen Distraction', section: 'Us vs. The World (19-23)', issue: 'Phones won over our together-time — scrolling while the other was talking.', todo: 'Choose presence over screens — when we\'s together, the phone waits. Screens never beat dreams!', fix: 'Phone-free together-time blocks (both devices away, eyes on each other).' },
  21: { title: 'Date Night', section: 'Us vs. The World (19-23)', issue: 'We skipped our weekly date night.', todo: 'One dedicated evening a week — dinner, movie, drive, or cozy home-date — just Deep and Honey.', fix: 'Book the next date night right now, with a plan both love.' },
  22: { title: 'Celebrating Wins', section: 'Us vs. The World (19-23)', issue: 'One of us achieved something and it wasn\'t celebrated loudly enough.', todo: 'His win is her win, her win is his win — proud words, a hug, and something sweet required!', fix: 'Throw the overdue celebration: proud words + hug + treat.' },
  23: { title: 'Growth Check-In', section: 'Us vs. The World (19-23)', issue: 'We missed our monthly check-in about goals, support, and happiness.', todo: 'Hold the monthly check-in: "Is there anything you need from me to feel happier or more supported?"', fix: 'Schedule the check-in this week and grow together 🌱.' },
  all:{ title: 'Complete Review — ALL 23 Rules', section: 'Full Love Contract', issue: 'I want to discuss our commitment to ALL 23 relationship rules together.', todo: 'A full heart-to-heart covering Foundation Rules (1-12), Daily Love Habits (13-15), Quarantine & Respect (16-18), and Us vs. The World (19-23).', fix: 'One complete, loving review of every rule so our whole contract gets equal attention.' }
};

function getRuleMeta(r) {
  const m = RULE_META[r.option] || null;
  if (m) return m;
  // Fallback: derive number from the value text ("✅ Rule 7 - ...")
  const mm = r.value.match(/Rule (\d+)/i);
  return (mm && RULE_META[mm[1]]) ? RULE_META[mm[1]] : null;
}

function getSelectedResponses() {
  const checked = document.querySelectorAll('.response-checkbox:checked');
  if (Array.from(checked).some(cb => cb.getAttribute('data-option') === 'all')) {
    return ALL_RULES.map((rule, idx) => ({ option: idx + 1, value: rule }));
  }
  return Array.from(checked).map(cb => ({ option: cb.getAttribute('data-option'), value: cb.value }));
}

// Build the per-rule sub-selection block (Issue / What We Have To Do / How To Fix)
// once, so both the plain-text email and the HTML email use identical details.
function buildRuleDetails(selected) {
  return selected.map(r => {
    const m = getRuleMeta(r);
    if (!m) return { num: r.option, text: r.value, meta: null };
    return { num: r.option, text: r.value, meta: m };
  });
}

// ==================== On-page sub-complaint panel ====================
// When a rule checkbox is ticked in the complaint list, its matching
// sub-complaint card (What Is The Issue / What We Have To Do / How To Fix)
// appears right below that option instantly — no need to open the email
// preview to see what will be sent. Unticking hides it again.
function renderSubComplaintPanel() {
  document.querySelectorAll('.response-option').forEach(opt => {
    const cb = opt.querySelector('input[type="checkbox"]');
    if (!cb) return;
    let panel = opt.querySelector('.sub-complaint-panel');
    if (!cb.checked) { if (panel) panel.remove(); return; }
    const option = cb.getAttribute('data-option');
    // "ALL rules" row shows a summary instead of one rule's details
    const meta = option === 'all' ? RULE_META.all : getRuleMeta({ option, value: cb.value });
    if (!meta) return;
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'sub-complaint-panel';
      // Never intercept taps — clicking the card still toggles its checkbox
      panel.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
      opt.appendChild(panel);
    }
    const rows =
      `<div class="sub-item sub-issue"><strong>🔍 What Is The Issue:</strong> ${escapeHtml(meta.issue)}</div>` +
      `<div class="sub-item sub-todo"><strong>🤝 What We Have To Do:</strong> ${escapeHtml(meta.todo)}</div>` +
      `<div class="sub-item sub-fix"><strong>💖 How We Fix It:</strong> ${escapeHtml(meta.fix)}</div>`;
    panel.innerHTML =
      `<div class="sub-panel-title">📋 Sub-Complaint Details — ${escapeHtml(meta.title)} <span class="sub-panel-section">(${escapeHtml(meta.section)})</span></div>` +
      rows;
  });
  // Live count helper under the options list
  const counter = document.getElementById('subComplaintCounter');
  if (counter) {
    const n = document.querySelectorAll('.response-checkbox:checked').length;
    if (n > 0) {
      counter.classList.add('show');
      counter.innerHTML = `💘 <strong>${n}</strong> sub-complaint${n > 1 ? 's' : ''} ready — each card above shows the Issue, What To Do &amp; How To Fix that will be included in your email!`;
    } else {
      counter.classList.remove('show');
      counter.innerHTML = '';
    }
  }
}

const ALL_RULES = [
  "✅ Rule 1 - Honesty Issue: I feel there might be something not being shared openly between us. Let's talk about maintaining complete honesty in our relationship. Trust is our foundation!",
  "✅ Rule 2 - Loyalty Check: I need reassurance about our commitment and loyalty to each other. Our bond is sacred and I want to make sure we're both protecting it completely.",
  "✅ Rule 3 - Transparency Issue: I feel like something might be hidden or not fully disclosed. Remember our promise of no secrets - big or small. Let's clear the air!",
  "✅ Rule 4 - Support Concern: I need more emotional support during a difficult time. Remember we stand by each other in every moment - good or bad.",
  "✅ Rule 5 - Communication Gap: We haven't been sharing things before or after like we promised. Our communication needs improvement to keep our love strong.",
  "✅ Rule 6 - Attention Concern: I feel ignored or not prioritized recently. Remember our promise of presence over distance. Let's reconnect!",
  "✅ Rule 7 - Value Concern: I don't feel valued equally like friends are. We deserve the same time, respect and fun we give to others - if not more!",
  "✅ Rule 8 - Priority Check: I feel our relationship isn't getting the priority it deserves. Family first, then us - but we need our special place in each other's lives.",
  "✅ Rule 9 - Apology Issue: An apology didn't come with the promised effort. Remember - photos, not just words! Actions speak louder in our love.",
  "✅ Rule 10 - Daily Connection: We missed our daily selfie connection. Those smiles brighten my day and keep us connected across any distance.",
  "✅ Rule 11 - Sanctuary Rule Broken: We argued in front of others or didn't maintain our private sanctuary. Remember our promise - disagreements are private, our relationship is sacred. We should have paused and saved it for a calm moment alone.",
  "✅ Rule 12 - Reset Rule Broken: We went to sleep angry or distant without resolving our issue. Remember our promise - no day ends with anger between us. We need to hug it out and reset with love before bedtime.",
  "✅ Rule 13 - Good Morning/Goodnight Issue: We missed our sweet Good Morning or Goodnight message. No matter how busy we are, those words tell me I was on your mind first and last. Let's never skip them!",
  "✅ Rule 14 - Kiss Issue: We skipped our 6-second kiss today, or a hello/goodbye went without a real kiss. Remember - a big kiss stops a small fight before it starts!",
  "✅ Rule 15 - Compliment Issue: I didn't receive my daily genuine compliment. One specific, heartfelt compliment a day keeps our love glowing. Penalty: sing a love song to each other!",
  "✅ Rule 16 - Respect Issue: Name-calling, mocking, eye-rolls or contempt happened during our argument. We complain about the problem, never attack the person. Let's talk respectfully.",
  "✅ Rule 17 - Breakup Word Issue: The word 'breakup' was used as a threat or weapon during an argument. Our relationship is always the safe zone - that word is NEVER allowed to win a fight.",
  "✅ Rule 18 - Cooling Rule Issue: A time-out was taken but we didn't come back to finish the conversation, or silent treatment was used instead of the 24-hour cooling rule. We always return and resolve with love.",
  "✅ Rule 19 - United Front Issue: We argued, mocked, or corrected each other in front of family or friends. To the world we are ONE team - disagreements stay private. Let's protect each other's image.",
  "✅ Rule 20 - Screen Time Issue: Phones won over our together-time - scrolling while the other was talking or sharing their day. Presence is the sweetest gift. Screens never beat dreams!",
  "✅ Rule 21 - Date Night Issue: We skipped our weekly date night. One dedicated evening a week - dinner, movie, drive, or cozy home-date - just Deep and Honey. Let's plan one soon!",
  "✅ Rule 22 - Celebration Issue: One of us achieved something and it wasn't celebrated loudly enough. His win is her win, her win is his win - proud words, a hug, and something sweet required!",
  "✅ Rule 23 - Growth Check-In: We missed our monthly check-in about goals, support, and happiness. Is there anything you need from me to feel happier or more supported? Let's grow together."
];

// NO MAIL IDs ANYWHERE — nothing is asked, stored or prefilled.
// The user pastes the email (or opens the blank mail app) and types the
// recipient's address directly inside their own email app.
// Opening the email app EMPTY (no recipient) so the user can paste the
// copied Subject + HTML and type the mail ID themselves.
function openMailAppEmpty() {
  if (isMobileDevice()) {
    // Blank mailto: opens the phone's default mail composer with empty To:.
    window.location.href = 'mailto:';
  } else {
    // Gmail compose window with no "to" pre-filled.
    window.open('https://mail.google.com/mail/?view=cm&fs=1', '_blank', 'noopener,noreferrer,width=800,height=600');
  }
}

function sendComplaint(target) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', DATE_OPTS);
  const timeStr = now.toLocaleTimeString('en-US', TIME_OPTS);
  const selected = getSelectedResponses();
  const personalMsg = document.getElementById('personalMessage').value.trim();
  const format = document.querySelector('input[name="emailFormat"]:checked').value;
  // target = who the complaint is ABOUT. The SENDER is the other partner,
  // so the signature/greeting always shows the sender's own sign.
  const partner = target === 'deep' ? 'Deep 🐼' : 'Honey 🍯🐻';
  const sender = target === 'deep' ? 'Honey 🍯🐻' : 'Deep 🐼';
  const subject = `💌 Romantic Complaint About ${partner} - ${dateStr}`;

  if (format === 'html') {
    // Generate + show the romantic HTML right here in the page (works on
    // phones too — no popup blocking). Auto-copy SUBJECT + HTML so one tap
    // gets everything needed to paste into the email app.
    generateHtmlEmail(target);
    copyHtmlEmail();
    const previewBox = document.getElementById('htmlEmailPreview');
    if (previewBox) previewBox.classList.add('show');
    openMailAppEmpty();
    setTimeout(() => {
      if (typeof alert === 'function') {
        alert(`✅ Subject + HTML email about ${partner} generated & copied!\n\n✉️ Now:\n1️⃣ Paste (Ctrl+V / long-press → Paste) into your email app's body/HTML editor\n2️⃣ Type the recipient's mail ID yourself — none is stored in this app\n3️⃣ Paste the first line as the Subject`);
      }
    }, 400);
    return;
  }

  // Plain text: copy the full email (SUBJECT + body) and open a BLANK mail
  // composer — no mail ID included anywhere.
  const greeting = target === 'deep'
    ? 'With all my love and hope for our future,\nFrom your Honey 🍯 Bee 🐝'
    : 'With all my love and hope for our future,\nFrom your Deep 🐼';
  const sep = '\n\n═══════════════════════════════════════════════\n\n';
  let body = `💌💌💌 ROMANTIC LOVE CONTRACT COMPLAINT & DISCUSSION 💌💌💌\n\n📅 Date: ${dateStr}\n⏰ Time: ${timeStr}\n💝 Regarding: Our Complete Love & Trust Rulebook (23 Rules!)\n❤️ Status: Romantic Discussion Needed${sep}`;
  if (selected.length) {
    body += `📜 SELECTED RULE CONCERNS FROM OUR LOVE CONTRACT:\n\n`;
    buildRuleDetails(selected).forEach((d, i) => {
      body += `${i + 1}) ${d.text}\n`;
      if (d.meta) {
        body += `\n   🔍 WHAT IS THE ISSUE:\n   ${d.meta.issue}\n\n   🤝 WHAT WE HAVE TO DO:\n   ${d.meta.todo}\n\n   💖 HOW WE FIX IT:\n   ${d.meta.fix}\n`;
      }
      body += '\n';
    });
    body += sep;
  }
  if (personalMsg) body += `💖 PERSONAL MESSAGE & DEEP FEELINGS:\n\n${personalMsg}\n\n${sep}`;
  body += `I'm bringing this up because our relationship means everything to me 💕\nI believe in our rules and our promise to each other 🤝\n\nLet's talk about this with love, understanding, and patience 💭\nOur bond is worth protecting and strengthening every day 💪❤️\n\n${greeting}${DEEP_BRANDING}\n\n${sep}💖 OUR ETERNAL SOULMATE CODE: DeepNectar 💖\n\n"A love so deep, it turns into honey."\n\nThis code represents our eternal connection - a love so deep, it becomes the sweetest honey.\nNo matter what we discuss or work through, remember we are DeepNectar forever. 🐼❤️🐻\n\n💌❤️💌❤️💌❤️💌❤️💌`;

  // Copy SUBJECT + full plain-text body to clipboard, then open a BLANK
  // mail composer — NO mail ID is ever included or stored. The user types
  // the recipient directly in their email app and pastes this content.
  const payload = `SUBJECT: ${subject}\n\n${body}`;
  const textarea = document.getElementById('htmlEmailContent');
  const donePlain = () => { openMailAppEmpty(); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload).then(donePlain).catch(() => {
      if (textarea) {
        textarea.value = payload; textarea.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      }
      donePlain();
    });
  } else {
    if (textarea) {
      textarea.value = payload; textarea.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    }
    donePlain();
  }
  setTimeout(() => {
    if (typeof alert === 'function') alert(`✅ Complaint email from ${sender} about ${partner} copied to clipboard!\n\n✉️ Paste it into your email app, type the recipient's mail ID yourself.\n\nYour message includes ${selected.length} rule concern(s) with Issue / What To Do / How To Fix details!`);
  }, 400);
}
function sendComplaintForDeep() { sendComplaint('deep'); }
function sendComplaintForHoney() { sendComplaint('honey'); }

// ==================== Image helpers ====================
function imageLoaded() {
  const img = document.getElementById('soulmateImage');
  const ph = document.getElementById('imagePlaceholder');
  if (img && img.complete && img.naturalHeight) { img.style.display = 'block'; if (ph) ph.style.display = 'none'; }
}
function imageFailed() {
  const img = document.getElementById('soulmateImage');
  const ph = document.getElementById('imagePlaceholder');
  if (img) img.style.display = 'none';
  if (ph) ph.style.display = 'flex';
}
// The soulmate photo lives inside the hidden main content, so its onload can
// fire before the page is revealed on some mobile browsers. Re-check after
// unlocking so the big photo always shows (and never gets stuck as placeholder).
function refreshSoulmateImage() {
  const img = document.getElementById('soulmateImage');
  if (!img) return;
  if (img.complete) { img.naturalHeight ? imageLoaded() : imageFailed(); }
}

// ==================== Startup wiring ====================
document.addEventListener('DOMContentLoaded', function () {
  // Password screen: show/hide toggle + Enter key + restore session
  const toggleBtn = document.getElementById('togglePasswordBtn');
  const passwordInput = document.getElementById('passwordInput');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', function () {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      toggleBtn.textContent = passwordInput.type === 'password' ? '👁️' : '🙈';
    });
    passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });
    setTimeout(() => passwordInput.focus(), 500);
  }
  if (sessionStorage.getItem('deepNectarAccess') === 'true') {
    if (passwordInput) passwordInput.value = ''; // never keep a remembered password
    unlockPage();
  }

  // Lazy-load every non-hero image for faster first paint
  const eager = ['#soulmateImage', '.password-logo'];
  document.querySelectorAll('img').forEach(img => {
    if (eager.some(sel => img.matches(sel))) return;
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  });

  // Tapping anywhere on a complaint row toggles its checkbox (browsers do this
  // natively only when the input wraps or uses `for`; we bind click + guard via
  // lastToggleTime to stay compatible with automated clicks).
  document.querySelectorAll('.response-option').forEach(option => {
    option.addEventListener('click', function (e) {
      const cb = this.querySelector('input[type="checkbox"]');
      if (e.target === cb && Math.abs((cb._lastToggleTime || 0) - Date.now()) < 500) return;
      if (e.target !== cb) {
        // Inside a <label>, browsers ALSO forward the tap to the checkbox.
        // If we flip `checked` ourselves here, the two flips cancel out and
        // nothing gets selected — so in real browsers we let the native
        // toggle happen (the change event below renders the sub-complaint
        // panel). Only flip manually when native forwarding is absent
        // (jsdom / synthetic clicks).
        const nativeForwards = typeof window !== 'undefined' && typeof window.MouseEvent === 'function';
        if (!nativeForwards) {
          cb.checked = !cb.checked;
          cb._lastToggleTime = Date.now();
        }
      }
      syncAllRulesExclusivity(cb);
      renderSubComplaintPanel();
    });
  });
  function syncAllRulesExclusivity(cb) {
    if (!cb.classList.contains('response-checkbox')) return;
    if (cb.getAttribute('data-option') === 'all' && cb.checked) {
      document.querySelectorAll('.response-checkbox:not([data-option="all"])').forEach(c => { c.checked = false; });
    } else if (cb.checked) {
      const all = document.querySelector('.response-checkbox[data-option="all"]');
      if (all) all.checked = false;
    }
  }
  document.addEventListener('change', function (e) {
    const cb = e.target;
    if (!cb.classList || !cb.classList.contains('response-checkbox')) return;
    if (cb.getAttribute('data-option') === 'all' && cb.checked) {
      document.querySelectorAll('.response-checkbox:not([data-option="all"])').forEach(c => { c.checked = false; });
    } else if (cb.checked) {
      const all = document.querySelector('.response-checkbox[data-option="all"]');
      if (all) all.checked = false;
    }
    renderSubComplaintPanel();
  });
  // Initial paint of the sub-complaint helper area (empty until a rule is ticked)
  renderSubComplaintPanel();
});

// Re-spawn hearts only when the device profile actually changes
window.addEventListener('resize', function () {
  clearTimeout(window.rst);
  window.rst = setTimeout(function () {
    const np = getDevicePerformanceProfile();
    const op = window.__lastDeviceProfile || {};
    if (np.deviceType !== op.deviceType || np.emojiCount !== op.emojiCount) {
      window.__lastDeviceProfile = np;
      createFloatingEmojis();
    }
  }, 250);
});
window.addEventListener('orientationchange', () => setTimeout(() => window.dispatchEvent(new Event('resize')), 100));

// ==================== Expose functions used by inline handlers ====================
Object.assign(window, {
  checkPassword, toggleEmailFormat, generateHtmlEmail, copyHtmlEmail,
  sendComplaint, sendComplaintForDeep, sendComplaintForHoney,
  imageLoaded, imageFailed, createNectarSwarm, initFloatingEmojis,
  renderSubComplaintPanel
});
