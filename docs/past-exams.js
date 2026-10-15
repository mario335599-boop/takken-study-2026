'use strict';

// Render the retained Markdown subset without accepting HTML from source content.
function pastInline(value) {
  const format = text => readable(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const valueText = String(value), links = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
  let result = '', end = 0;
  for (const match of valueText.matchAll(links)) {
    result += format(valueText.slice(end, match.index));
    result += `<a href="${esc(match[2])}" target="_blank" rel="noopener noreferrer">${format(match[1])}</a>`;
    end = match.index + match[0].length;
  }
  return result + format(valueText.slice(end));
}
function pastMarkdown(value) {
  const lines = String(value).split('\n'), output = [];
  const isTable = line => /^\s*\|.*\|\s*$/.test(line || '');
  const cells = line => line.trim().slice(1, -1).split('|').map(cell => cell.trim());
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (/^-{3,}$/.test(line)) { output.push('<hr>'); i++; continue; }
    if (/^#{1,6} /.test(line)) {
      output.push(`<h3>${pastInline(line.replace(/^#{1,6} /, ''))}</h3>`); i++; continue;
    }
    if (isTable(line) && /^\s*\|[\s:|\-]+\|\s*$/.test(lines[i + 1] || '')) {
      const headers = cells(line); i += 2;
      const rows = [];
      while (i < lines.length && isTable(lines[i])) rows.push(cells(lines[i++]));
      output.push('<div class="tablewrap"><table><thead><tr>' + headers.map(h => `<th scope="col">${pastInline(h)}</th>`).join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(c => `<td>${pastInline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>'); continue;
    }
    const listMatch = line.match(/^(\d+)\. (.*)$/);
    if (listMatch) {
      const items = []; const start = listMatch[1];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^\d+\. /, ''));
      output.push(`<ol class="past-easy-options" start="${start}">` + items.map(item => `<li>${pastInline(item)}</li>`).join('') + '</ol>'); continue;
    }
    if (/^- /.test(line)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i].trim())) items.push(lines[i++].trim().slice(2));
      output.push('<ul>' + items.map(item => `<li>${pastInline(item)}</li>`).join('') + '</ul>'); continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6} |\||\d+\. |- )/.test(lines[i].trim())) paragraph.push(lines[i++].trim());
    output.push(`<p>${pastInline(paragraph.join(' '))}</p>`);
  }
  return output.join('');
}
function pastSourceLinks(sources) {
  return sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`).join(' ／ ');
}
function pastExamPage() {
  const heading = '<div class="pagehead"><div class="eyebrow">PAST EXAMS</div><h1>宅建過去問・やさしい解説版</h1><p class="muted">問題・4つの選択肢・正解・各肢の解説を、答えを見ながら一問ずつ。</p></div>';
  if (typeof PAST_EXAMS === 'undefined') return heading + '<div class="alert">教材の読み込みに失敗しました。通信を確認してページを開き直してください。</div>';
  const year = PAST_EXAMS.years.find(item => item.year === Number(route.year));
  const notice = '<div class="info"><strong>令和6年度・令和5年度、各45問の解説を掲載。</strong><br>共有された会話の本文を取得し、問題・各肢をRETIO公式問題と照合しました。正解番号は90問すべて公式表と一致しています。訂正・補足は各問に明示しています。<br><span class="small">正解番号は出題当時の法令に基づきます。2026年4月1日基準の主な改正注意を別に掲載し、出題年の条件と区別しています。全肢を2026年の設定へ置き換えて採点する教材ではありません。</span></div>';
  const sourceIndex = '<p class="source">公式出典：一般財団法人 不動産適正取引推進機構（RETIO） <a href="https://www.retio.or.jp/exam/past_ques_ans/other/" target="_blank" rel="noopener noreferrer">試験問題と正解番号表</a></p>';
  if (!year) {
    const correctionList = PAST_EXAMS.years.flatMap(item => item.questions.filter(q => q.corrections.length).map(q => `<li>${btn(`${item.label}・問${q.number}`, `pastquestion:${item.year}:${q.number}`)} ${esc(q.corrections.join(' '))}</li>`)).join('');
    return heading + notice + '<div class="grid two">' + PAST_EXAMS.years.map(item =>
      `<section class="card"><span class="pill">問1〜${item.questions.length} ｜ 解説あり</span><h2>${esc(item.label)} <span class="muted">（${item.year}）</span></h2><p>やさしい言い換え・難語の意味・全肢解説・覚え方</p>${btn('問1から読む', 'pastyear:' + item.year, 'class="primary"')}<p class="source"><a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">公式問題・正解PDFを開く</a></p></section>`
    ).join('') + '</div><details><summary>2026年4月1日基準の主な改正注意</summary><div class="inside">' + PAST_EXAMS.years[0].amendmentNotes.map(note => `<p>${pastInline(note.text)}</p><p class="source">${pastSourceLinks([note.source])}</p>`).join('') + '</div></details><details><summary>元の会話からの訂正・補足（8問）</summary><div class="inside"><ul class="past-corrections">' + correctionList + '</ul></div></details>' + sourceIndex;
  }
  const question = year.questions.find(item => item.number === Number(route.question)) || year.questions[0];
  const text = value => String(value).split('\n\n').map(p => `<p>${pastInline(p)}</p>`).join('');
  const navigation = '<div class="row between actions">' +
    btn('← 前の問題', `pastquestion:${year.year}:${question.number - 1}`, question.number === 1 ? 'disabled' : '') +
    `<span class="muted">問${question.number} / ${year.questions.length}</span>` +
    btn('次の問題 →', `pastquestion:${year.year}:${question.number + 1}`, question.number === year.questions.length ? 'disabled' : '') + '</div>';
  const corrections = question.corrections.length ? '<section class="alert"><h3>訂正・補足</h3>' + question.corrections.map(c => text(c)).join('') + '</section>' : '';
  return heading + '<div class="row actions">' + btn('年度一覧に戻る', 'nav:past-exams') + PAST_EXAMS.years.map(item =>
    btn(item.label, 'pastyear:' + item.year, `aria-pressed="${item.year === year.year}"${item.year === year.year ? ' class="primary"' : ''}`)
  ).join('') + '</div>' +
    `<section class="card"><h2>${esc(year.label)}（${year.year}）</h2><p class="small muted">問題・正解番号の照合日：${esc(year.answerVerifiedOn)} ｜ 出題法令：${esc(year.examLawDate)}</p><div class="past-qnav" role="group" aria-label="問題番号を選ぶ">${year.questions.map(q => btn(String(q.number), `pastquestion:${year.year}:${q.number}`, `aria-label="問${q.number}" aria-current="${q.number === question.number ? 'step' : 'false'}"`)).join('')}</div></section>` +
    `<article class="card past-question" aria-labelledby="past-question-title"><div class="row between"><h2 id="past-question-title">問${question.number}｜${esc(question.title)}</h2><span class="pill">公式正解 ${question.officialAnswer}番</span></div>` + corrections +
    `<div class="past-easy-content">${pastMarkdown(question.easyMarkdown)}</div><section class="info"><strong>法改正注意（2026年4月1日基準）</strong>${text(question.lawNote)}<p class="source">${pastSourceLinks(question.lawSources)}</p></section>` +
    `<details><summary>公式問題文・4つの選択肢を確認する</summary><div class="inside"><p class="small muted">言い換えで省略された条件や判決文は、こちらでも確認できます。数字・選択肢の正誤は出題当時のままです。</p><div class="past-prompt">${text(question.officialPrompt)}</div><ol class="past-easy-options">${question.officialOptions.map(option => `<li>${text(option)}</li>`).join('')}</ol><strong>公式正解：${question.officialAnswer}番</strong></div></details>` +
    `<p class="source"><a href="${esc(year.sourceUrl)}#page=${question.sourcePage}" target="_blank" rel="noopener noreferrer">公式PDFの該当ページ（${question.sourcePage}ページ）</a> ／ <a href="${esc(year.sourceUrl)}#page=${year.answerPage}" target="_blank" rel="noopener noreferrer">公式正解番号表</a></p>${navigation}</article>` + sourceIndex;
}
