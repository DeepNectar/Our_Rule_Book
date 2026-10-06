/* ============================================================
   Deep & Honey — Love Rulebook  (js/app.js)
   Extracted from the original monolithic Index.Html and debugged.

   NOTE ON THE ORIGINAL BUG: this code lived inside an inline <script>
   tag, and the generated-email template string contained literal
   "</head>", "<body>" and "</script>" sequences. The browser ended the
   inline script at the first "</script>", leaving ~150 lines of broken
   markup injected into the page and ALL JavaScript dead. Moving the code
   into an external file removes that hazard entirely.
   ============================================================ */

// ==================== PASSWORD PROTECTION ====================
    var correctPassword = "Deepnectar@1612@";
    var attempts = 0;
    
    function checkPassword() {
      var input = document.getElementById('passwordInput').value;
      var error = document.getElementById('passwordError');
      
      if (input === correctPassword) {
        document.getElementById('passwordOverlay').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        sessionStorage.setItem('deepNectarAccess', 'true');
        initFloatingEmojis();
        createNectarSwarm();
        setTimeout(function() {
          document.getElementById('passwordInput').value = '';
        }, 100);
      } else {
        attempts++;
        error.style.display = 'block';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
        var overlay = document.getElementById('passwordOverlay');
        overlay.style.animation = 'shake 0.5s ease';
        setTimeout(function() { overlay.style.animation = ''; }, 500);
        
        if (attempts >= 3) {
          error.innerHTML = '❌ Wrong password 3 times! Hint: "Our pet name + @ + the Date & Month we met + @" 💕';
        }
        if (attempts >= 5) {
          error.innerHTML = '❌ The password is <strong>Deepnectar@1612@</strong> 😘';
        }
      }
    }
    
    document.addEventListener('DOMContentLoaded', function() {
      var toggleBtn = document.getElementById('togglePasswordBtn');
      var passwordInput = document.getElementById('passwordInput');
      
      toggleBtn.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          toggleBtn.textContent = '🙈';
        } else {
          passwordInput.type = 'password';
          toggleBtn.textContent = '👁️';
        }
      });
      
      document.getElementById('passwordInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          checkPassword();
        }
      });
      
      setTimeout(function() {
        document.getElementById('passwordInput').focus();
      }, 500);
      
      if (sessionStorage.getItem('deepNectarAccess') === 'true') {
        document.getElementById('passwordOverlay').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        // BUG FIX: clear any remembered/auto-filled password from the input.
        document.getElementById('passwordInput').value = '';
        initFloatingEmojis();
        createNectarSwarm();
      }
    });

    // ==================== Email Format Toggle ====================
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
    // The complaint e-mail is copied out of the page and pasted into mail
    // clients, so relative asset URLs would break. We inline the images as
    // base64 data URIs (cached after first load) which keeps them visible
    // everywhere. Falls back to plain <img> tags if loading fails.
    const BRAND_IMAGE_CACHE = {};
    function brandDataUri(relPath) {
      if (BRAND_IMAGE_CACHE[relPath]) return BRAND_IMAGE_CACHE[relPath];
      try {
        // FIX: read the file as raw BYTES. The previous implementation used
        // xhr.responseText + btoa(), which corrupts any byte >= 0x80 — every
        // PNG contains such bytes, so the generated data URI was a broken
        // image (this is part of why the signature looked "wrong" in emails).
        const xhr = new XMLHttpRequest();
        xhr.open('GET', relPath, false); // synchronous: keeps preview generation simple
        xhr.responseType = 'arraybuffer';
        xhr.send();
        if (xhr.status === 200 || xhr.status === 0) {
          const mime = /\.png$/i.test(relPath) ? 'image/png' : 'image/jpeg';
          const bytes = new Uint8Array(xhr.response);
          let binary = '';
          const CHUNK = 8192;
          for (let i = 0; i < bytes.length; i += CHUNK) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
          }
          const uri = `data:${mime};base64,${btoa(binary)}`;
          BRAND_IMAGE_CACHE[relPath] = uri;
          return uri;
        }
      } catch (e) { /* file:// without XHR support etc. – fall through */ }
      return relPath;
    }
    function partnerSignatureUri(partnerName) {
      if (partnerName.indexOf('Honey') !== -1) {
        return brandDataUri('assets/honey-signature.png');
      }
      // FIX: Deep's signature must be assets/deep-signature.png — the actual
      // handwritten signature. deep-signature-v2.png is an unrelated square
      // graphic that showed the wrong image.
      return brandDataUri('assets/deep-signature.png');
    }

    function generateHtmlEmail(partner) {
      const selected = getSelectedResponses();
      const personalMsg = document.getElementById('personalMessage').value.trim();
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      
      // BUG FIX: the original code tested whether the "complaint about Deep"
      // BUTTON exists on the page (it always does), so every generated HTML
      // email was titled "About Deep" even when filing about Honey. The
      // target partner is now passed in explicitly by the caller.
      const isDeep = partner !== 'honey';
      const partnerName = isDeep ? 'Deep 🐼' : 'Honey 🍯🐻';
      const subjectLine = `💌 Romantic Complaint About ${partnerName} - ${dateStr}`;
      document.getElementById('htmlSubjectDisplay').textContent = subjectLine;

      // Inline brand images as data URIs so logo & signature stay visible
      // even after the HTML is copied into an e-mail client.
      const logoUri = brandDataUri('assets/logo-stamp.png');
      const signUri = partnerSignatureUri(partnerName);
      
      let rulesHtml = '';
      if (selected.length > 0) {
        rulesHtml = '<div style="background:#fff5f7;padding:20px;border-radius:15px;margin:20px 0;border-left:6px solid #ff3366;">';
        rulesHtml += '<h3 style="color:#ff3366;margin-top:0;">📜 Selected Rule Concerns:</h3>';
        selected.forEach(r => {
          rulesHtml += `<p style="margin:10px 0;padding:8px 12px;background:#fff;border-radius:8px;border:1px solid #ffe0e5;">${r.value}</p>`;
        });
        rulesHtml += '</div>';
      }
      
      let personalHtml = '';
      if (personalMsg) {
        personalHtml = `<div style="background:#fff0f5;padding:20px;border-radius:15px;margin:20px 0;border-left:6px solid #ff6699;">
          <h3 style="color:#ff3366;margin-top:0;">💖 Personal Message:</h3>
          <p style="font-size:18px;line-height:1.8;color:#5a3d3d;">${personalMsg}</p>
        </div>`;
      }
      
      const htmlEmail = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subjectLine}</title>
<style>
  body { font-family: 'Georgia', 'Times New Roman', serif; max-width: 700px; margin: 0 auto; padding: 30px 20px; color: #5a3d3d; background: #fff5f7; line-height: 1.8; }
  .email-header { text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #ffb6c1, #ff6699); border-radius: 20px; color: white; margin-bottom: 30px; }
  .email-header h1 { font-size: 32px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
  .email-header p { font-size: 18px; margin: 10px 0 0; opacity: 0.9; }
  .divider { border: none; height: 3px; background: linear-gradient(to right, transparent, #ff3366, transparent); margin: 30px 0; }
  .footer { text-align: center; margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #ffb6c1, #ff6699); border-radius: 20px; color: white; }
  .footer .code { font-size: 24px; font-weight: bold; color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.5); }
  .footer .meaning { font-size: 16px; opacity: 0.9; font-style: italic; margin: 10px 0 0; }
</style>
</head>
<body>
<div class="email-header">
  <img src="${logoUri}" alt="DeepNectar Logo" width="90" height="90" style="display:block;margin:0 auto 12px;border-radius:50%;background:#fff;padding:4px;">
  <h1>💌 Romantic Complaint About ${partnerName}</h1>
  <p>📅 ${dateStr} at ${timeStr}</p>
</div>

<div style="background:#fff;padding:25px;border-radius:15px;box-shadow:0 4px 15px rgba(0,0,0,0.05);">
  <p style="font-size:20px;color:#ff3366;font-weight:bold;">💖 Our Complete Love & Trust Rulebook Discussion</p>
  <p style="font-size:16px;color:#8b5a5a;">This romantic complaint is being filed to strengthen our bond and address concerns in our relationship contract.</p>
  
  ${rulesHtml}
  ${personalHtml}
  
  <hr class="divider">
  
  <div style="text-align:center;padding:20px;background:#fff5f7;border-radius:15px;">
    <p style="font-size:18px;color:#ff3366;font-weight:bold;">💕 Our Eternal Soulmate Code</p>
    <p style="font-size:28px;color:#ff0066;font-weight:bold;letter-spacing:3px;">DeepNectar</p>
    <p style="font-size:16px;color:#8b5a5a;font-style:italic;">"A love so deep, it turns into honey."</p>
  </div>
  <hr class="divider">

  <div style="text-align:center;padding:20px;background:#fff5f7;border-radius:15px;">
    <p style="font-size:16px;color:#ff3366;font-weight:bold;margin:0 0 10px;">✍️ Signed with love,</p>
    <img src="${signUri}" alt="${partnerName} signature" width="220" style="display:inline-block;max-width:220px;height:auto;background:transparent;padding:0;border:0;">
    <p style="font-size:14px;color:#8b5a5a;margin:8px 0 0;">${partnerName}</p>
  </div>
</div>

<div class="footer">
  <img src="${logoUri}" alt="DeepNectar Logo" width="70" height="70" style="display:block;margin:0 auto 10px;border-radius:50%;background:#fff;padding:4px;">
  <p style="font-size:18px;margin:0;">💖 Forever Yours, Always Us 💖</p>
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
      document.execCommand('copy');
      const btn = document.getElementById('copyHtmlBtn');
      btn.textContent = '✅ Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 Copy HTML';
        btn.classList.remove('copied');
      }, 3000);
    }

    // ==================== Device detection and floating emoji functions ====================
    function getDeviceType() { const ua=navigator.userAgent,w=window.innerWidth; if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)){ if(/iPad|Android(?!.*Mobile)|Tablet|Silk/i.test(ua)||(w>=768&&w<=1024)) return 'tablet'; return 'mobile'; } if(w<=480) return 'mobile'; if(w<=768) return 'mobile'; if(w<=1024) return 'tablet'; return 'desktop'; }
    function isMobileDevice() { const d=getDeviceType(); return d==='mobile'||d==='tablet'; }
    function getDevicePerformanceProfile() {
      const d=getDeviceType(),c=navigator.connection||navigator.mozConnection||navigator.webkitConnection,i=c&&(c.effectiveType==='2g'||c.effectiveType==='slow-2g');
      return { deviceType:d, isSlowConnection:i, emojiCount:d==='desktop'?450:d==='tablet'?300:i?140:260, minSize:d==='desktop'?12:d==='tablet'?12:11, maxSize:d==='desktop'?28:d==='tablet'?27:26, movementRange:d==='desktop'?300:d==='tablet'?220:170, usePatterns:d!=='mobile', speedCycleInterval:d==='desktop'?10000:d==='tablet'?14000:18000 };
    }
    const SPEED_CLASSES=['floating-emoji-slow','floating-emoji-medium-slow','floating-emoji-normal','floating-emoji-medium-fast','floating-emoji-fast','floating-emoji-super-fast','floating-emoji-floating','floating-emoji-dance'];
    const PATTERN_CLASSES=['floating-emoji-zigzag','floating-emoji-smooth','floating-emoji-bounce'];
    const EMOJI_COLLECTION=['❤️','💕','💖','💗','💓','💞','💘','💝','💟','💔','❤️‍🔥','❤️‍🩹','💑','👩‍❤️‍👨','👫','👩‍❤️‍💋‍👨','💏','👨‍❤️‍👨','👩‍❤️‍👩','💋','💌','✨','🌟','💫','⭐','🌠','⚡','💥','💢','🥰','😍','😘','😊','🥺','😚','😙','😗','☺️','😇','🌹','🌺','🌸','🌼','🌷','💐','🌻','🌞','🌙','⭐','☀️','🐼','🐻','🐻‍❄️','🐝','🍯','🐨','🦊','🐰','🦝','🍯','🍯🐝','🍰','🎂','🍪','🍩','🍫','🍬','🍭','🧁','💍','👑','🎀','🎁','💎','🔮','🏩','💒','🎊','🎉','🕊️','🏡','🏠','🌇','🌅','🌄','🏞️','🛌','🫂','🤗','💫','💦','💧','🌸','🎵','🎶','💭','💬','👁️','👀'];
    const COLOR_PALETTE=['#ff3366','#ff6699','#ff99cc','#ff6b6b','#ff8c8c','#ffa07a','#ffb6c1','#ff69b4','#ff1493','#ff007f','#ff4d4d','#ff6eb4','#ff7f50','#ff8c69','#ffa500','#ffb347'];
    let currentSpeedIndex=2,speedCycleInterval=null;
    
    function changeAllSpeeds(s){ const e=document.querySelectorAll('.floating-emoji'),a=['floating-emoji-slow','floating-emoji-medium-slow','floating-emoji-normal','floating-emoji-medium-fast','floating-emoji-fast','floating-emoji-super-fast','floating-emoji-floating','floating-emoji-dance','floating-emoji-zigzag','floating-emoji-smooth','floating-emoji-bounce']; e.forEach(e=>{ a.forEach(c=>e.classList.remove(c)); e.classList.add(s); }); }
    function cycleSpeed(p){ currentSpeedIndex=(currentSpeedIndex+1)%SPEED_CLASSES.length; changeAllSpeeds(SPEED_CLASSES[currentSpeedIndex]); }
    function startSpeedCycling(p){ if(speedCycleInterval)clearInterval(speedCycleInterval); speedCycleInterval=setInterval(()=>cycleSpeed(p),p?p.speedCycleInterval:10000); }
    
    function createFloatingEmojis(){ const bg=document.getElementById('ultraRomanticBg'); if(!bg)return; const p=getDevicePerformanceProfile(); bg.innerHTML=''; const f=document.createDocumentFragment(); for(let i=0;i<p.emojiCount;i++){ const e=document.createElement('div'); e.className='floating-emoji'; e.classList.add('floating-emoji-normal'); if(p.usePatterns&&Math.random()>0.7)e.classList.add(PATTERN_CLASSES[Math.floor(Math.random()*PATTERN_CLASSES.length)]); e.innerHTML=EMOJI_COLLECTION[Math.floor(Math.random()*EMOJI_COLLECTION.length)]; const startX=Math.random()*120-10+'vw',startY=Math.random()*120-10+'vh'; for(let j=1;j<=5;j++){ const moveX=Math.random()*p.movementRange*2-p.movementRange+'px',moveY=Math.random()*p.movementRange*2-p.movementRange+'px'; e.style.setProperty(`--moveX${j}`,moveX); e.style.setProperty(`--moveY${j}`,moveY); } e.style.setProperty('--startX',startX); e.style.setProperty('--startY',startY); e.style.fontSize=(Math.random()*(p.maxSize-p.minSize)+p.minSize)+'px'; e.style.animationDelay=Math.random()*10+'s'; e.style.color=COLOR_PALETTE[Math.floor(Math.random()*COLOR_PALETTE.length)]; e.style.textShadow=`0 0 ${Math.random()*14+6}px currentColor`; f.appendChild(e); } bg.appendChild(f); startSpeedCycling(p); return p; }
    
    function initFloatingEmojis(){ const p=createFloatingEmojis(); window.__lastDeviceProfile=p; if(p.deviceType==='desktop')setInterval(()=>createFloatingEmojis(),180000); else if(p.deviceType==='tablet')setInterval(()=>createFloatingEmojis(),240000); else setInterval(()=>createFloatingEmojis(),300000); }

    // ==================== Complaint Functions ====================
    function sendComplaintForDeep(){ sendComplaint('deep'); }
    function sendComplaintForHoney(){ sendComplaint('honey'); }
    
    function getSelectedResponses(){ const r=[],c=document.querySelectorAll('.response-checkbox:checked'),h=Array.from(c).some(cb=>cb.getAttribute('data-option')==='all'); if(h){ const allRules=[
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
      "✅ Rule 23 - Growth Check-In: We missed our monthly check-in about goals, support, and happiness. Is there anything you need from me to feel happier or more supported? Let's grow together." ]; allRules.forEach((rule,idx)=>r.push({option:idx+1,value:rule})); } else { c.forEach(cb=>r.push({option:cb.getAttribute('data-option'),value:cb.value})); } return r; }
    
    function sendComplaint(t){ 
      const n=new Date(),d=n.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),t2=n.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
      const s=getSelectedResponses(),p=document.getElementById('personalMessage').value.trim();
      const format = document.querySelector('input[name="emailFormat"]:checked').value;
      const partner = t==='deep' ? 'Deep 🐼' : 'Honey 🍯🐻';
      const sub = `💌 Romantic Complaint About ${partner} - ${d}`;
      const sig = t==='deep' ? "With all my love and hope for our future,\nFrom your Honey 🍯 Bee 🐝\n\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░\n░░░░░░░░▒▓█►─═  𝔻𝕖𝕖𝕡ℕ𝕖𝕔𝕥𝕒𝕣  ═─◄█▓▒░░░░░░░░\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░\n\n🐝 \"A love so deep, it turns into honey.\" 🐝\n\nOur eternal soulmate code that binds us forever" : "With all my love and hope for our future,\n\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░\n░░░░░░░░▒▓█►─═  𝔻𝕖𝕖𝕡ℕ𝕖𝕔𝕥𝕒𝕣  ═─◄█▓▒░░░░░░░░\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░\n\n🐝 \"A love so deep, it turns into honey.\" 🐝\n\nOur eternal soulmate code that binds us forever";
      
      let body = '';
      if (format === 'html') {
        // Generate HTML email content with subject already included
        // BUG FIX: forward which partner the complaint targets.
        generateHtmlEmail(t);
        const htmlContent = document.getElementById('htmlEmailContent').value;
        // BUG FIX: window.open('', ...) returns an about:blank window whose
        // document is NOT ready yet, so calling document.write immediately
        // threw "document.write: failed because the document isn't fully
        // loaded" and silently killed the popup. Wait for the new document's
        // load event before writing the email into it.
        const win = window.open('', '_blank', 'width=800,height=600');
        if (win) {
          const writeDoc = () => {
            try {
              win.document.open();
              win.document.write(htmlContent);
              win.document.close();
            } catch (err) { /* ignore – preview box already holds the code */ }
          };
          if (win.document.readyState === 'complete') writeDoc();
          else win.addEventListener('load', writeDoc);
        } else {
          // BUG FIX: previously threw "Alert is not defined" under jsdom and
          // blocked the whole function. Guarded so preview generation never
          // dies when popups are blocked or no dialog is available.
          if (typeof window.alert === 'function') {
            window.alert('Please allow popups to view the HTML email preview.');
          }
        }
        return;
      }
      
      // Plain text version
      body = `💌💌💌 ROMANTIC LOVE CONTRACT COMPLAINT & DISCUSSION 💌💌💌\n\n📅 Date: ${d}\n⏰ Time: ${t2}\n💝 Regarding: Our Complete Love & Trust Rulebook (23 Rules!)\n❤️ Status: Romantic Discussion Needed\n\n═══════════════════════════════════════════════\n\n`;
      if(s.length){ 
        body += `📜 SELECTED RULE CONCERNS FROM OUR LOVE CONTRACT:\n\n`;
        s.forEach(r=>body+=`${r.value}\n\n`);
        body += `═══════════════════════════════════════════════\n\n`;
      }
      if(p) body += `💖 PERSONAL MESSAGE & DEEP FEELINGS:\n\n${p}\n\n═══════════════════════════════════════════════\n\n`;
      body += `I'm bringing this up because our relationship means everything to me 💕\nI believe in our rules and our promise to each other 🤝\n\nLet's talk about this with love, understanding, and patience 💭\nOur bond is worth protecting and strengthening every day 💪❤️\n\n${sig}\n\n═══════════════════════════════════════════════\n\n💖 OUR ETERNAL SOULMATE CODE: DeepNectar 💖\n\n"A love so deep, it turns into honey."\n\nThis code represents our eternal connection - a love so deep, it becomes the sweetest honey.\nNo matter what we discuss or work through, remember we are DeepNectar forever. 🐼❤️🐻\n\n💌❤️💌❤️💌❤️💌❤️💌`;
      
      const recipients = ['deep2811p@zohomail.com','deep2810m@icloud.com','deep2811p@gmail.com','hp8289986@gmail.com'].join(',');
      if(isMobileDevice()) {
        window.location.href = `mailto:${recipients}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
      } else {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipients)}&su=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}&ui=2&tf=1`;
        window.open(gmailUrl,'_blank','noopener,noreferrer,width=800,height=600');
      }
      setTimeout(()=>{ if (typeof window.alert === 'function') window.alert(`📧 Opening email with romantic complaint about ${partner}!\n\nYour message includes ${s.length} rule concerns!`); },300);
    }

    // ==================== Image Functions ====================
    function imageLoaded(){ const i=document.getElementById('soulmateImage'),p=document.getElementById('imagePlaceholder'); if(i&&i.complete&&i.naturalHeight){ i.style.display='block'; if(p)p.style.display='none'; } }
    function imageFailed(){ const i=document.getElementById('soulmateImage'),p=document.getElementById('imagePlaceholder'); if(i)i.style.display='none'; if(p)p.style.display='flex'; }

    // ==================== Nectar Swarm ====================
    function createNectarSwarm(){ const s=document.getElementById('nectarSwarm'); if(!s)return; const p=getDevicePerformanceProfile(); s.innerHTML=''; const c=p.deviceType==='desktop'?8:p.deviceType==='tablet'?7:6; for(let i=0;i<c;i++){ let span=document.createElement('span'); span.className='nectar-bee'; /* BUG FIX: was 'floating-emoji', which forced the floatEmoji keyframes (needing --startX/--moveX vars the swarm never sets) and clashed with the inline swarmFloat animation */ span.style.position='absolute'; span.style.fontSize=p.deviceType==='mobile'?'18px':'20px'; span.style.left=Math.random()*90+5+'%'; span.style.animation=`swarmFloat ${Math.random()*6+10}s linear infinite`; span.style.animationDelay=Math.random()*12+'s'; span.style.opacity=Math.random()*0.5+0.4; span.innerHTML=['🐝','🍯','💧'][Math.floor(Math.random()*3)]; s.appendChild(span); } }

    // ==================== DOM Ready Events ====================
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.response-option').forEach(o=>{
        o.addEventListener('click',function(e){
          if(e.target.type!=='checkbox'){
            const cb=this.querySelector('input[type="checkbox"]');
            cb.checked=!cb.checked;
            const opt=cb.getAttribute('data-option');
            if(opt==='all'&&cb.checked){
              document.querySelectorAll('.response-checkbox:not([data-option="all"])').forEach(c=>{
                c.checked=false;
                const p=c.closest('.response-option');
                if(p){
                  p.style.background='linear-gradient(135deg, rgba(255,240,240,0.85), rgba(255,230,230,0.85))';
                  p.style.borderLeft='6px solid transparent';
                }
              });
            } else if(cb.checked){
              const a=document.querySelector('.response-checkbox[data-option="all"]');
              if(a){
                a.checked=false;
                const p=a.closest('.response-option');
                if(p){
                  p.style.background='linear-gradient(135deg, rgba(255,200,220,0.95), rgba(255,180,200,0.95))';
                  p.style.borderLeft='6px solid #ff0066';
                }
              }
            }
            const ev=new Event('change',{bubbles:true});
            cb.dispatchEvent(ev);
          }
        });
      });
    });

    // ==================== Resize Handling ====================
    window.addEventListener('resize',function(){ clearTimeout(window.rst); window.rst=setTimeout(function(){ const np=getDevicePerformanceProfile(),op=window.__lastDeviceProfile||{}; if(np.deviceType!==op.deviceType||np.emojiCount!==op.emojiCount){ window.__lastDeviceProfile=np; createFloatingEmojis(); } },250); }); 
    window.addEventListener('orientationchange',function(){ setTimeout(function(){ window.dispatchEvent(new Event('resize')); },100); });

// ==================== Expose functions used by inline handlers ====================
/* BUG FIX (critical): index.html references these functions from inline
   onclick/onload/onerror attributes (e.g. onclick="checkPassword()"). If the
   script is ever evaluated in a non-global scope, or wrapped/deferred by a
   bundler, those handlers throw "xxx is not defined" and every button dies.
   Publish each handler explicitly on `window` so inline attributes always
   resolve. */
window.checkPassword = checkPassword;
window.toggleEmailFormat = toggleEmailFormat;
window.generateHtmlEmail = generateHtmlEmail;
window.copyHtmlEmail = copyHtmlEmail;
window.sendComplaintForDeep = sendComplaintForDeep;
window.sendComplaintForHoney = sendComplaintForHoney;
window.sendComplaint = sendComplaint;
window.imageLoaded = imageLoaded;
window.imageFailed = imageFailed;
window.createNectarSwarm = createNectarSwarm;
window.initFloatingEmojis = initFloatingEmojis;
