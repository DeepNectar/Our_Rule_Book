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
const EMAIL_RECIPIENTS = ['deep2811p@zohomail.com', 'deep2810m@icloud.com', 'deep2811p@gmail.com', 'hp8289986@gmail.com'].join(',');
const DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const TIME_OPTS = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
const DEEP_BRANDING = '\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░\n░░░░░░░░▒▓█►─═  𝔻𝕖𝕖𝕡ℕ𝕖𝕔𝕥𝕒𝕣  ═─◄█▓▒░░░░░░░░\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░\n\n🐝 "A love so deep, it turns into honey." 🐝\n\nOur eternal soulmate code that binds us forever';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateHtmlEmail(partner) {
  const selected = getSelectedResponses();
  const personalMsg = document.getElementById('personalMessage').value.trim();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', DATE_OPTS);
  const timeStr = now.toLocaleTimeString('en-US', TIME_OPTS);

  const isDeep = partner !== 'honey';
  const partnerName = isDeep ? 'Deep 🐼' : 'Honey 🍯🐻';
  const subjectLine = `💌 Romantic Complaint About ${partnerName} - ${dateStr}`;
  document.getElementById('htmlSubjectDisplay').textContent = subjectLine;

  const logoUri = brandDataUri('assets/logo-stamp.png');
  const signUri = partnerSignatureUri(partnerName);

  const rulesHtml = selected.length
    ? '<div style="background:#fff5f7;padding:16px;border-radius:12px;margin:16px 0;border-left:5px solid #ff3366;">' +
      '<h3 style="color:#ff3366;margin-top:0;">📜 Selected Rule Concerns:</h3>' +
      selected.map(r => `<p style="margin:8px 0;padding:6px 10px;background:#fff;border-radius:8px;border:1px solid #ffe0e5;">${escapeHtml(r.value)}</p>`).join('') +
      '</div>'
    : '';

  const personalHtml = personalMsg
    ? `<div style="background:#fff0f5;padding:16px;border-radius:12px;margin:16px 0;border-left:5px solid #ff6699;">
       <h3 style="color:#ff3366;margin-top:0;">💖 Personal Message:</h3>
       <p style="font-size:16px;line-height:1.8;color:#5a3d3d;">${escapeHtml(personalMsg)}</p></div>`
    : '';

  const htmlEmail = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subjectLine}</title>
<style type="text/css">
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 700px; margin: 0 auto; padding: 24px 16px; color: #5a3d3d; background: #fff5f7; line-height: 1.8; }
  .email-header, .footer { text-align: center; padding: 24px 16px; background: linear-gradient(135deg, #ffb6c1, #ff6699); border-radius: 18px; color: white; }
  .email-header h1 { font-size: 26px; margin: 0; }
  .email-header p { font-size: 15px; margin: 8px 0 0; opacity: .9; }
  .divider { border: none; height: 3px; background: linear-gradient(to right, transparent, #ff3366, transparent); margin: 24px 0; }
  .card { background: #fff; padding: 20px; border-radius: 14px; box-shadow: 0 4px 15px rgba(0,0,0,.05); }
  .soft { text-align: center; padding: 16px; background: #fff5f7; border-radius: 12px; }
  .code { font-size: 22px; font-weight: bold; color: #fff; }
  .meaning { font-size: 14px; opacity: .9; font-style: italic; margin: 8px 0 0; }
  img.logo { display: block; margin: 0 auto 10px; border-radius: 50%; background: #fff; padding: 4px; }
</style>
</head>
<body>
<div class="email-header">
  <img class="logo" src="${logoUri}" alt="DeepNectar Logo" width="80" height="80">
  <h1>💌 Romantic Complaint About ${partnerName}</h1>
  <p>📅 ${dateStr} at ${timeStr}</p>
</div>
<div class="card">
  <p style="font-size:18px;color:#ff3366;font-weight:bold;">💖 Our Complete Love & Trust Rulebook Discussion</p>
  <p style="font-size:15px;color:#8b5a5a;">This romantic complaint is being filed to strengthen our bond and address concerns in our relationship contract.</p>
  ${rulesHtml}
  ${personalHtml}
  <hr class="divider">
  <div class="soft">
    <p style="font-size:16px;color:#ff3366;font-weight:bold;">💕 Our Eternal Soulmate Code</p>
    <p style="font-size:24px;color:#ff0066;font-weight:bold;letter-spacing:3px;">DeepNectar</p>
    <p style="font-size:14px;color:#8b5a5a;font-style:italic;">"A love so deep, it turns into honey."</p>
  </div>
  <hr class="divider">
  <div class="soft">
    <p style="font-size:15px;color:#ff3366;font-weight:bold;margin:0 0 8px;">✍️ Signed with love,</p>
    <img src="${signUri}" alt="${partnerName} signature" width="200" style="display:inline-block;max-width:200px;height:auto;">
    <p style="font-size:13px;color:#8b5a5a;margin:6px 0 0;">${partnerName}</p>
  </div>
</div>
<div class="footer">
  <img class="logo" src="${logoUri}" alt="DeepNectar Logo" width="60" height="60">
  <p style="font-size:16px;margin:0;">💖 Forever Yours, Always Us 💖</p>
  <div class="code">DeepNectar</div>
  <div class="meaning">"A love so deep, it turns into honey."</div>
</div>
</body>
</html>`;

  document.getElementById('htmlEmailContent').value = htmlEmail;
}

function copyHtmlEmail() {
  const textarea = document.getElementById('htmlEmailContent');
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  try { document.execCommand('copy'); } catch (e) { /* clipboard unavailable */ }
  const btn = document.getElementById('copyHtmlBtn');
  btn.textContent = '✅ Copied!';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = '📋 Copy HTML'; btn.classList.remove('copied'); }, 3000);
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

function getSelectedResponses() {
  const checked = document.querySelectorAll('.response-checkbox:checked');
  if (Array.from(checked).some(cb => cb.getAttribute('data-option') === 'all')) {
    return ALL_RULES.map((rule, idx) => ({ option: idx + 1, value: rule }));
  }
  return Array.from(checked).map(cb => ({ option: cb.getAttribute('data-option'), value: cb.value }));
}

function sendComplaint(target) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', DATE_OPTS);
  const timeStr = now.toLocaleTimeString('en-US', TIME_OPTS);
  const selected = getSelectedResponses();
  const personalMsg = document.getElementById('personalMessage').value.trim();
  const format = document.querySelector('input[name="emailFormat"]:checked').value;
  const partner = target === 'deep' ? 'Deep 🐼' : 'Honey 🍯🐻';
  const subject = `💌 Romantic Complaint About ${partner} - ${dateStr}`;

  if (format === 'html') {
    generateHtmlEmail(target);
    const htmlContent = document.getElementById('htmlEmailContent').value;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      const writeDoc = () => {
        try { win.document.open(); win.document.write(htmlContent); win.document.close(); } catch (e) { /* preview box still holds the code */ }
      };
      if (win.document.readyState === 'complete') writeDoc();
      else win.addEventListener('load', writeDoc);
    } else if (typeof alert === 'function') {
      alert('Please allow popups to view the HTML email preview.');
    }
    return;
  }

  const greeting = target === 'deep' ? 'With all my love and hope for our future,\nFrom your Honey 🍯 Bee 🐝' : 'With all my love and hope for our future,';
  const sep = '\n\n═══════════════════════════════════════════════\n\n';
  let body = `💌💌💌 ROMANTIC LOVE CONTRACT COMPLAINT & DISCUSSION 💌💌💌\n\n📅 Date: ${dateStr}\n⏰ Time: ${timeStr}\n💝 Regarding: Our Complete Love & Trust Rulebook (23 Rules!)\n❤️ Status: Romantic Discussion Needed\n${sep}`;
  if (selected.length) body += `📜 SELECTED RULE CONCERNS FROM OUR LOVE CONTRACT:\n\n${selected.map(r => r.value + '\n\n').join('')}${sep}`;
  if (personalMsg) body += `💖 PERSONAL MESSAGE & DEEP FEELINGS:\n\n${personalMsg}\n\n${sep}`;
  body += `I'm bringing this up because our relationship means everything to me 💕\nI believe in our rules and our promise to each other 🤝\n\nLet's talk about this with love, understanding, and patience 💭\nOur bond is worth protecting and strengthening every day 💪❤️\n\n${greeting}${DEEP_BRANDING}\n\n${sep}💖 OUR ETERNAL SOULMATE CODE: DeepNectar 💖\n\n"A love so deep, it turns into honey."\n\nThis code represents our eternal connection - a love so deep, it becomes the sweetest honey.\nNo matter what we discuss or work through, remember we are DeepNectar forever. 🐼❤️🐻\n\n💌❤️💌❤️💌❤️💌❤️💌`;

  if (isMobileDevice()) {
    window.location.href = `mailto:${EMAIL_RECIPIENTS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  } else {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL_RECIPIENTS)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&ui=2&tf=1`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer,width=800,height=600');
  }
  setTimeout(() => {
    if (typeof alert === 'function') alert(`📧 Opening email with romantic complaint about ${partner}!\n\nYour message includes ${selected.length} rule concerns!`);
  }, 300);
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
        cb.checked = !cb.checked;
        cb._lastToggleTime = Date.now();
      }
      syncAllRulesExclusivity(cb);
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
  });
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
  imageLoaded, imageFailed, createNectarSwarm, initFloatingEmojis
});
