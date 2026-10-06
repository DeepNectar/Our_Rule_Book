// Runtime smoke test for index.html + js/app.js (jsdom, local file serving)
const { JSDOM, VirtualConsole, ResourceLoader } = require('jsdom');
const fs = require('fs'), path = require('path'), http = require('http');

const server = http.createServer((req,res)=>{
  const p = path.join(__dirname, req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p)) { res.statusCode=404; return res.end('nf'); }
  res.end(fs.readFileSync(p));
});

server.listen(0, async () => {
  const base = 'http://localhost:'+server.address().port+'/';
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => { if(!/Could not load/.test(e.message)) errors.push(e.message); });
  vc.on('error', (...a)=>errors.push(a.join(' ')));
  const dom = await JSDOM.fromURL(base, { runScripts:'dangerously', resources:'usable', pretendToBeVisual:true, virtualConsole:vc });
  const w = dom.window, d = w.document;
  await new Promise(r=>setTimeout(r,800));

  let fails = 0;
  const check = (name, cond) => { console.log((cond?'PASS':'FAIL')+' - '+name); if(!cond) fails++; };

  // 1. unlock via button click
  d.getElementById('passwordInput').value='Deepnectar@1612@';
  d.querySelector('.password-btn').click();
  await new Promise(r=>setTimeout(r,300));
  check('password overlay hidden after unlock', d.getElementById('passwordOverlay').style.display==='none');
  check('main content visible after unlock', d.getElementById('mainContent').style.display==='block');

  // 2. floating emojis + nectar bees spawned
  check('floating emojis spawned (>0)', d.querySelectorAll('.floating-emoji').length>0);
  check('nectar bees use .nectar-bee class', d.querySelectorAll('.nectar-bee').length>=6);

  // 3. no BDSM markup survived the cleanup
  check('no BDSM section in DOM', d.getElementById('bdsmSection') === null);
  check('no toggle button in DOM', d.querySelector('.toggle-section-btn') === null);

  // 3b. signature images appear ONLY inside the signature section's "Sign:" lines
  const signImgs = Array.from(d.querySelectorAll('img')).filter(i => /signature/.test(i.getAttribute('src') || ''));
  check('exactly 2 signature imgs on page', signImgs.length === 2);
  check('both signature imgs are on Sign: lines', signImgs.every(i => i.classList.contains('sign-inline-img') && i.closest('.signature-box')));
  check('deep sign uses correct asset', signImgs.some(i => i.getAttribute('src') === 'assets/deep-signature.png'));
  check('honey sign asset present', signImgs.some(i => i.getAttribute('src') === 'assets/honey-signature.png'));

  // 4. complaint subjects per partner (HTML preview)
  // switch to HTML email format first (radio drives sendComplaint branch)
  const htmlRadio = d.querySelector('input[name="emailFormat"][value="html"]');
  htmlRadio.checked = true;
  htmlRadio.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); // inline onchange fires on click
  const opt1 = d.querySelector('.response-option:has(input[data-option="1"]') || null;
  const cb = d.querySelector('.response-checkbox[data-option="1"]');
  if (opt1) opt1.click(); else { cb.checked=true; }
  cb.dispatchEvent(new w.Event('change',{bubbles:true}));
  d.getElementById('personalMessage').value='I love you';
  w.alert = () => {};              // suppress dialogs in jsdom
  w.open = () => null;             // simulate blocked popup -> alert path
  d.querySelector('.complaint-btn-deep').click();
  const subDeep = d.getElementById('htmlSubjectDisplay').textContent;
  check('subject About Deep when filing about Deep', /About Deep/.test(subDeep));
  d.querySelector('.complaint-btn-honey').click();
  const subHoney = d.getElementById('htmlSubjectDisplay').textContent;
  check('subject About Honey when filing about Honey', /About Honey/.test(subHoney));

  // 5. generated email HTML is a full document with inlined logo data URI
  const content = d.getElementById('htmlEmailContent').value;
  check('email contains doctype+html', content.startsWith('<!DOCTYPE html>') && content.includes('</html>'));
  check('logo inlined as data URI', content.includes('src="data:image/png;base64,'));

  // 6. no uncaught JS errors
  check('no runtime JS errors', errors.length===0);
  if (errors.length) console.log(errors);

  server.close();
  process.exit(fails?1:0);
});
