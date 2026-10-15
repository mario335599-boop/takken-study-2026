'use strict';

function validatePredictionRecords(raw) {
  if (raw === undefined) return {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('予想模試の保存記録が不正です');
  const result = {};
  for (const [id, record] of Object.entries(raw)) {
    if (id !== PREDICTION_MOCK.id || !record || !Number.isInteger(record.pos) || record.pos < 1 || record.pos > PREDICTION_MOCK.questions.length || !Number.isFinite(record.updatedAt) || record.updatedAt < 0 || !record.answers || typeof record.answers !== 'object' || Array.isArray(record.answers)) throw Error('予想模試の途中記録が不正です');
    const answers = {};
    for (const [number, cell] of Object.entries(record.answers)) {
      if (!PREDICTION_MOCK.questions.some(q => String(q.number) === number) || !cell || !(cell.choice === null || Number.isInteger(cell.choice) && cell.choice >= 1 && cell.choice <= 4) || !Number.isFinite(cell.updatedAt) || cell.updatedAt < 0) throw Error('予想模試の回答が不正です');
      answers[number] = {choice: cell.choice, updatedAt: cell.updatedAt};
    }
    result[id] = {pos: record.pos, answers, updatedAt: record.updatedAt};
  }
  return result;
}
function predictionRecord() {
  return S.pendingMocks[PREDICTION_MOCK.id] || {pos: 1, answers: {}, updatedAt: 0};
}
function predictionAnswered(record) {
  return PREDICTION_MOCK.questions.filter(q => record.answers[q.number]?.choice != null).length;
}
function pendingMockCard() {
  const record = predictionRecord(), answered = predictionAnswered(record);
  return `<section class="card"><div class="eyebrow">2026 PREDICTION</div><h2>${esc(PREDICTION_MOCK.title)}</h2><p>共有されたオリジナル予想模試・全45問。5問免除対応、目安110分。</p><div class="info"><strong>回答保存・答え合わせは後日</strong><br>選んだ回答は自動保存します。今は採点せず、時間切れによる自動提出もありません。</div><p>回答済み ${answered} / 45問${answered === 45 ? ' ・ 全問保存済み・答え合わせ待ち' : ''}</p>${btn(answered || record.updatedAt ? '続きから開く' : '予想模試を開く', 'predictionopen', 'class="primary"')}<p class="source"><a href="${esc(PREDICTION_MOCK.sourceUrl)}" target="_blank" rel="noopener noreferrer">共有元の問題を見る</a></p></section>`;
}
function pendingMockPage() {
  const record = predictionRecord(), q = PREDICTION_MOCK.questions[record.pos - 1], answered = predictionAnswered(record), selected = record.answers[q.number]?.choice;
  return `<div class="pagehead"><div class="eyebrow">2026 PREDICTION / ANSWERS SAVED</div><h1>${esc(PREDICTION_MOCK.title)}</h1><p class="muted">全45問・目安110分（5問免除対応）</p></div><div class="info"><strong>答え合わせは後日</strong><br>回答を選ぶたびに保存します。自由に変更・再開できます。今は正解・解説・点数を表示しません。</div><div class="row between actions"><span aria-live="polite">回答済み ${answered} / 45問${answered === 45 ? ' ・ 全問保存済み・答え合わせ待ち' : ''}</span>${btn('保存して模試一覧へ', 'predictionleave')}</div><div class="split"><section class="card" aria-labelledby="prediction-title"><span class="pill">${esc(q.group)}</span><h2 id="prediction-title">問${q.number}｜${esc(q.title)}</h2><p>${pastInline(q.prompt)}</p><div role="group" aria-label="問${q.number}の回答">${q.options.map((option, i) => `<button class="option${selected === i + 1 ? ' selected' : ''}" data-action="predictionanswer:${i + 1}" aria-pressed="${selected === i + 1}"><span class="badge">${i + 1}</span><span>${pastInline(option)}</span></button>`).join('')}</div><p class="small" aria-live="polite">${selected == null ? 'この問題は未回答です。' : `選択した回答：${selected}番（保存対象）`}</p><div class="row actions">${btn('← 前の問題', 'predictionpos:' + (q.number - 1), q.number === 1 ? 'disabled' : '')}${btn('次の問題 →', 'predictionpos:' + (q.number + 1), q.number === 45 ? 'disabled' : '')}${btn('この回答を消す', 'predictionclear', selected == null ? 'disabled' : '')}</div></section><aside class="card sticky"><h3>問題一覧</h3><p class="small muted">緑：回答済み／枠：表示中</p><div class="qnav">${PREDICTION_MOCK.questions.map(item => btn(item.number, 'predictionpos:' + item.number, `class="${record.answers[item.number]?.choice != null ? 'answered' : ''} ${item.number === q.number ? 'current' : ''}" aria-label="問${item.number}${record.answers[item.number]?.choice != null ? ' 回答済み' : ' 未回答'}" aria-current="${item.number === q.number ? 'step' : 'false'}"`)).join('')}</div><details><summary>選択した回答の一覧</summary><div class="inside"><ol>${PREDICTION_MOCK.questions.map(item => `<li>問${item.number}：${record.answers[item.number]?.choice == null ? '未回答' : record.answers[item.number].choice + '番'}</li>`).join('')}</ol></div></details></aside></div><p class="small muted">端末への保存状況は画面上部で確認できます。ログイン時は既存の自動同期、記録・設定のJSONバックアップにも含まれます。</p><p class="source"><a href="${esc(PREDICTION_MOCK.sourceUrl)}" target="_blank" rel="noopener noreferrer">共有元の問題を見る</a>（共有元には正解・解説も含まれます）</p>`;
}
function savePrediction(update) {
  const record = predictionRecord();
  update(record);
  record.updatedAt = Date.now();
  S.pendingMocks[PREDICTION_MOCK.id] = record;
  save();
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const [action, value] = button.dataset.action.split(':');
  if (!action.startsWith('prediction')) return;
  if (action === 'predictionopen') { go('mocks', {pending: true}); return; }
  if (route.view !== 'mocks' || !route.pending) return;
  if (action === 'predictionleave') { save(); go('mocks'); return; }
  if (action === 'predictionanswer') {
    const choice = Number(value);
    if (!Number.isInteger(choice) || choice < 1 || choice > 4) return;
    savePrediction(record => { record.answers[record.pos] = {choice, updatedAt: Date.now()}; });
    render();
    document.querySelector(`[data-action="predictionanswer:${choice}"]`)?.focus({preventScroll: true});
  } else if (action === 'predictionclear') {
    // Keep a deletion marker so clearing also survives a merge with another device.
    savePrediction(record => { record.answers[record.pos] = {choice: null, updatedAt: Date.now()}; });
    render();
  } else if (action === 'predictionpos') {
    const pos = Number(value);
    if (!Number.isInteger(pos) || pos < 1 || pos > PREDICTION_MOCK.questions.length) return;
    savePrediction(record => { record.pos = pos; });
    render();
    document.getElementById('app').focus({preventScroll: true});
    window.scrollTo(0, 0);
  }
});
