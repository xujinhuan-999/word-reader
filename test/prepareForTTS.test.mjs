// 单元测试：prepareForTTS / prepareForTTSZh
// 与 index.html 内嵌的同一份实现保持一致（逻辑镜像，改动时需同步）。
// 运行：node test/prepareForTTS.test.mjs

export function prepareForTTS(text) {
  if (text == null) return '';
  let s = String(text).trim();
  if (!s) return '';

  // 1) 所有格：sb's / sb.'s -> somebody's
  s = s.replace(/\bsb\.?'s\b/gi, "somebody's");
  // 2) 某人/某物缩写：sb./sb -> somebody；sth./sth -> something
  s = s.replace(/\bsb\b\.?/gi, 'somebody');
  s = s.replace(/\bsth\b\.?/gi, 'something');
  // 3) 常见拉丁缩写
  s = s.replace(/\betc\./gi, 'etcetera');
  s = s.replace(/\be\.g\./gi, 'for example');
  s = s.replace(/\bi\.e\./gi, 'that is');
  // 4) 斜杠 -> or
  s = s.replace(/\s*\/\s*/g, ' or ');
  // 5) 括号去掉字符、保留内容
  s = s.replace(/[()]/g, ' ');
  // 6) 省略号 -> 停顿
  s = s.replace(/\.{2,}/g, ', ');
  // 7) 清理多余空白
  s = s.replace(/[ \t]+/g, ' ').trim();
  return s;
}

export function prepareForTTSZh(text) {
  if (text == null) return '';
  let s = String(text).trim();
  if (!s) return '';
  // 去掉结尾的词性标注（n.）/（v. phr.）/（n./v.）/（expr.）/（adj.）等
  s = s.replace(/[（(][a-zA-Z./\s]{1,10}[)）]\s*$/g, '');
  // 去掉剩余括号字符、保留内容
  s = s.replace(/[（）()]/g, '');
  // 省略号 -> 停顿
  s = s.replace(/\.{3,}|…/g, '，');
  // 斜杠 -> 或
  s = s.replace(/\s*\/\s*/g, '或');
  // 清理空白
  s = s.replace(/\s+/g, '');
  return s;
}

// ---------- 断言工具 ----------
let passed = 0;
let failed = 0;
function eq(actual, expected, label) {
  if (actual === expected) {
    passed++;
    console.log(`  ✔ ${label}`);
  } else {
    failed++;
    console.error(`  ✘ ${label}\n     期望: ${JSON.stringify(expected)}\n     实际: ${JSON.stringify(actual)}`);
  }
}

console.log('prepareForTTS（英文）');
eq(prepareForTTS('give sb. a call / ring'), 'give somebody a call or ring', 'sb. + 斜杠');
eq(prepareForTTS('serve sth'), 'serve something', 'sth（无点）');
eq(prepareForTTS('give sb. a ride'), 'give somebody a ride', 'sb.（带点）');
eq(prepareForTTS('give sb a ride'), 'give somebody a ride', 'sb（无点）');
eq(prepareForTTS('call SB'), 'call somebody', 'SB（大写）');
eq(prepareForTTS('middle / high school'), 'middle or high school', '斜杠带空格');
eq(prepareForTTS('fare / fee'), 'fare or fee', '斜杠带空格 2');
eq(prepareForTTS('fully booked / full up / full'), 'fully booked or full up or full', '多个并列斜杠');
eq(prepareForTTS('open ticket / one way ticket'), 'open ticket or one way ticket', '斜杠短语');
eq(prepareForTTS('n./v.'), 'n. or v.', '无空格斜杠');
eq(prepareForTTS('call (up)'), 'call up', '括号去字符保留内容');
eq(prepareForTTS('sb\'s book'), "somebody's book", "sb's 所有格");
eq(prepareForTTS('sb.\'s book'), "somebody's book", "sb.'s 所有格");
eq(prepareForTTS('someone else'), 'someone else', '已全写 someone 不动');
eq(prepareForTTS('something new'), 'something new', '已全写 something 不动');
eq(prepareForTTS('etc.'), 'etcetera', 'etc. 展开');

console.log('prepareForTTSZh（中文）');
eq(prepareForTTSZh('给某人打电话（v. phr.）'), '给某人打电话', '去掉词性标注');
eq(prepareForTTSZh('把...端上桌（v. phr.）'), '把，端上桌', '省略号转停顿');
eq(prepareForTTSZh('健康中心/卫生院（n. phr.）'), '健康中心或卫生院', '斜杠转或');
eq(prepareForTTSZh('旅行（n./v.）'), '旅行', '词性含斜杠');
eq(prepareForTTSZh('（长途）旅行（n.）'), '长途旅行', '保留非词性括号内容');
eq(prepareForTTSZh('公立学校（n. phr.）'), '公立学校', 'n. phr.');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed === 0 ? 0 : 1);
