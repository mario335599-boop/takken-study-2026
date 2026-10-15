'use strict';

function predictionExplanationCard() {
  return `<section class="card"><span class="pill">番外編 ｜ 問1〜45・解説あり</span><h2>番外編・令和8年度予想模試</h2><p>第1回 本番実戦予想模試のやさしい解説版。問題・4つの選択肢・正解・各肢の理由・覚え方を掲載しています。</p>${btn('解答・解説を読む', 'predictionguide:1', 'class="primary"')}<p class="small muted">模試を解く場合は「模試」タブから。ここでは正解も表示します。</p></section>`;
}
function predictionGuideBody(number) {
  const g = PREDICTION_MOCK.guides[number - 1];
  return `<h3>問${number}｜${pastInline(g.t)}</h3><p>${pastInline(g.q)}</p><p class="pill">正解：${g.a}番</p><ol class="past-easy-options">${g.o.map((option, i) => `<li><p>${pastInline(option)}</p><p class="${i + 1 === g.a ? 'good' : ''}">${pastInline(g.e[i])}</p></li>`).join('')}</ol><div class="info"><strong>ここだけ覚える</strong><p>${pastInline(g.m)}</p></div>${number === 12 ? `<div class="alert">${esc(PREDICTION_MOCK.correctionNote)}</div><p class="source"><a href="https://laws.e-gov.go.jp/law/337AC0000000069?occasion_date=20260401" target="_blank" rel="noopener noreferrer">区分所有法39条（2026年4月1日施行）</a></p>` : ''}`;
}
function predictionExplanationPage() {
  const number = Number(route.question) || 1;
  return `<div class="pagehead"><div class="eyebrow">EXTRA / 2026 PREDICTION</div><h1>番外編・令和8年度予想模試</h1><p>宅建士試験・合格対策予想模試 やさしい解説版</p></div><p>第1回予想模試の問1〜45すべてについて、難しい法律用語の意味、選択肢4つの正誤と理由、試験直前に覚えたいポイントを掲載しています。</p><p class="small muted">共有元の問題・選択肢・正解・各肢解説・覚え方をそのまま収録。この欄では正解も表示します。</p><div class="row actions">${btn('年度・番外編一覧へ', 'nav:past-exams')}${btn('模試一覧へ', 'nav:mocks')}</div><section class="card"><h2>45問の解説を読む</h2><div class="past-qnav">${PREDICTION_MOCK.guides.map((g, i) => btn(i + 1, 'predictionguide:' + (i + 1), `aria-label="問${i + 1}" aria-current="${i + 1 === number ? 'step' : 'false'}"`)).join('')}</div></section><article class="card prediction-guide">${predictionGuideBody(number)}<div class="row between actions">${btn('← 前の問題', 'predictionguide:' + (number - 1), number === 1 ? 'disabled' : '')}<span>問${number} / 45</span>${btn('次の問題 →', 'predictionguide:' + (number + 1), number === 45 ? 'disabled' : '')}</div></article><details><summary>分野別・復習の目安</summary><div class="inside"><div class="tablewrap"><table><thead><tr><th>分野</th><th>問題番号</th><th>特に覚えたいこと</th></tr></thead><tbody>${PREDICTION_MOCK.studyGroups.map(group => `<tr><td>${esc(group.name)}</td><td>${group.start + 1}〜${group.end}</td><td>${esc(group.tip)}</td></tr>`).join('')}</tbody></table></div></div></details><p class="source">出典：<a href="${esc(PREDICTION_MOCK.answerSourceUrl)}" target="_blank" rel="noopener noreferrer">共有されたやさしい解説版</a> ／ <a href="https://laws.e-gov.go.jp/law/337AC0000000069?occasion_date=20260401" target="_blank" rel="noopener noreferrer">改正区分所有法</a> ／ <a href="https://www.mlit.go.jp/totikensangyo/const/1_6_bt_000268.html" target="_blank" rel="noopener noreferrer">国土交通省の宅建業法改正情報</a> ／ <a href="https://laws.e-gov.go.jp/law/327AC1000000176" target="_blank" rel="noopener noreferrer">宅建業法</a></p>`;
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const [action, value] = button.dataset.action.split(':');
  if (action !== 'predictionguide') return;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > PREDICTION_MOCK.guides.length) return;
  go('past-exams', {prediction: true, question: number});
  document.getElementById('app').focus({preventScroll: true});
});
