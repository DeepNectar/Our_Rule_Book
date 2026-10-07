// Temporary verification harness mirroring smoke.test.js steps (jsdom v29-safe)
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), path = require('path');

(async () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => { if (!/Could not load/.test(e.message)) errors.push(e.message); });
  vc.on('error', (...a) => errors.push(a.join(' ')));
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/index.html', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window, d = w.document;
  // inject app.js manually (external resource loading is flaky in jsdom v29)
  if (!w.checkPassword) {
    const s = d.createElement('script');
    s.textContent = fs.readFileSync('js/app.js', 'utf8');
    d.body.appendChild(s);
  }
  await new Promise(r => setTimeout(r, 300));

  let fails = 0;
  const check = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + name); if (!cond) fails++; };

  d.getElementById('passwordInput').value = 'Deepnectar@1612@';
  d.querySelector('.password-btn').click();
  await new Promise(r => setTimeout(r, 300));
  check('password overlay hidden after unlock', d.getElementById('passwordOverlay').style.display === 'none');
  check('main content visible after unlock', d.getElementById('mainContent').style.display === 'block');
  check('floating emojis spawned (>0)', d.querySelectorAll('.floating-emoji').length > 0);
  check('nectar bees use .nectar-bee class', d.querySelectorAll('.nectar-bee').length >= 6);
  check('no BDSM section in DOM', d.getElementById('bdsmSection') === null);
  check('no toggle button in DOM', d.querySelector('.toggle-section-btn') === null);

  const signImgs = Array.from(d.querySelectorAll('img')).filter(i => /signature/.test(i.getAttribute('src') || ''));
  check('exactly 2 signature imgs on page', signImgs.length === 2);
  check('both signature imgs are on Sign: lines', signImgs.every(i => i.classList.contains('sign-inline-img') && i.closest('.signature-box')));
  check('deep sign uses correct asset', signImgs.some(i => i.getAttribute('src') === 'assets/deep-signature.png'));
  check('honey sign asset present', signImgs.some(i => i.getAttribute('src') === 'assets/honey-signature.png'));

  const soul = d.getElementById('soulmateImage');
  check('soulmate logo uses assets/soulmate-logo.png', soul && soul.getAttribute('src') === 'assets/soulmate-logo.png');
  const missingAssets = Array.from(d.querySelectorAll('img')).map(i => i.getAttribute('src') || '')
    .filter(s => s.startsWith('assets/') && !fs.existsSync(path.join(__dirname, s)));
  check('no img references a missing asset file', missingAssets.length === 0);

  const htmlRadio = d.querySelector('input[name="emailFormat"][value="html"]');
  htmlRadio.checked = true;
  htmlRadio.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const cb = d.querySelector('.response-checkbox[data-option="1"]');
  const opt1 = cb.closest('.response-option');
  opt1.click();
  check('option click checks checkbox', cb.checked === true);
  d.getElementById('personalMessage').value = 'I love you';
  w.alert = () => {};
  w.open = () => null;
  d.querySelector('.complaint-btn-deep').click();
  const subDeep = d.getElementById('htmlSubjectDisplay').textContent;
  check('subject About Deep when filing about Deep', /About Deep/.test(subDeep));
  d.querySelector('.complaint-btn-honey').click();
  const subHoney = d.getElementById('htmlSubjectDisplay').textContent;
  check('subject About Honey when filing about Honey', /About Honey/.test(subHoney));

  const content = d.getElementById('htmlEmailContent').value;
  check('email contains doctype+html', content.startsWith('<!DOCTYPE html>') && content.includes('</html>'));
  check('logo inlined as data URI', content.includes('src="data:image/png;base64,'));

  // "all" option mutual exclusivity
  const allCb = d.querySelector('.response-checkbox[data-option="all"]');
  allCb.closest('.response-option').click();
  check('"all" clears other options', allCb.checked === true && cb.checked === false);
  cb.closest('.response-option').click();
  check('selecting one clears "all"', cb.checked === true && allCb.checked === false);

  // image fallback helpers
  w.imageFailed();
  check('imageFailed shows placeholder', d.getElementById('imagePlaceholder').style.display === 'flex');

  check('no runtime JS errors', errors.length === 0);
  if (errors.length) console.log(errors.slice(0, 5));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
