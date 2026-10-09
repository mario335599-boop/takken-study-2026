'use strict';
(function () {
  if (document.getElementById('exam-2025-entry')) return;
  const a = document.createElement('a');
  a.id = 'exam-2025-entry';
  a.href = './2025-exam.html';
  a.textContent = '📄 2025年の本試験過去問（公式PDF・自動採点） →';
  a.setAttribute('aria-label','2025年 宅建本試験 過去問と自動採点を開く');
  a.style.cssText = 'display:block;box-sizing:border-box;max-width:1100px;margin:12px auto;padding:12px 16px;border:2px solid #bed5ec;border-radius:12px;background:#eaf3ff;color:#184373;font:700 15px/1.5 system-ui,sans-serif;text-align:center;text-decoration:none;box-shadow:0 2px 7px #0001';
  const place = document.querySelector('body > header, body > .header, body > main, body > #app');
  if (place && place.parentNode) place.insertAdjacentElement('afterend',a);
  else document.body.prepend(a);
})();