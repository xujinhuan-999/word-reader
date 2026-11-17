// 导入逻辑校验：用验收表（acceptance-dump.json）验证 detectCols / normalizeRows
// 与 index.html 内嵌实现保持一致（逻辑镜像，改动时需同步）。
// 运行：node test/import.test.mjs
import fs from 'node:fs';

const dump = JSON.parse(fs.readFileSync(new URL('./acceptance-dump.json', import.meta.url), 'utf8'));

// —— 与 index.html 完全一致的导入函数 ——
function cleanCell(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function detectCols(header){
  const h=(header||[]).map(c=>String(c==null?'':c).replace(/\s+/g,'').toLowerCase());
  let en=-1,zh=-1,ph=-1;
  h.forEach((c,i)=>{
    if(en<0 && /单词|词组|^word$|english|英文/.test(c))en=i;
    else if(zh<0 && /中文|意思|释义|^meaning$/.test(c))zh=i;
    else if(ph<0 && /音标|phonetic/.test(c))ph=i;
  });
  if(en<0)en=0; if(zh<0)zh=1; if(ph<0)ph=2;
  return {en,zh,ph};
}
function normalizeRows(rows,col){
  const words=[],seen=new Set();
  for(const r of (rows||[]).slice(1)){
    if(!r)continue;
    const en=cleanCell(r[col.en]), zh=cleanCell(r[col.zh]), ph=cleanCell(r[col.ph]);
    if(!en&&!zh)continue;
    const key=(en+'||'+zh).toLowerCase();
    if(seen.has(key))continue; seen.add(key);
    words.push({en,zh,phonetic:ph});
  }
  return words;
}

// —— 断言 ——
let failed=0;
function assert(cond,msg){ if(cond)console.log('  ✔',msg); else {failed++;console.error('  ✘',msg);} }

console.log('导入校验（验收表）');
assert(dump.length===14, `单元数 = 14（实际 ${dump.length}）`);

const units=[];
for(const sheet of dump){
  const col=detectCols(sheet.rows[0]);
  const words=normalizeRows(sheet.rows,col);
  units.push({name:sheet.name,col,words});
  assert(col.en===0 && col.zh===1 && col.ph===2, `${sheet.name}: 列识别 en=${col.en} zh=${col.zh} ph=${col.ph}`);
  assert(words.length>0, `${sheet.name}: 有单词（${words.length}）`);
  assert(words.every(w=>w.en!==''), `${sheet.name}: 每条都有英文`);
}

const total=units.reduce((a,u)=>a+u.words.length,0);
console.log('单元数:', units.length, '| 单词总数:', total);
assert(total===614, `单词总数 = 614（实际 ${total}）`);

// 关键"带某人/某物"条目必须存在
const all=units.flatMap(u=>u.words.map(w=>({unit:u.name,...w})));
const key1=all.find(w=>w.en==='give sb. a call / ring');
const key2=all.find(w=>w.en==='serve sth');
const key3=all.find(w=>w.en==='give sb. a ride');
assert(!!key1, '存在 give sb. a call / ring');
assert(!!key2, '存在 serve sth');
assert(!!key3, '存在 give sb. a ride');

// 单元名列表（与验收表 Sheet 名一致）
const expectNames=['校园与教育','电话与沟通','餐饮与食物','交通出行','旅游与天气','机场与航空','医疗健康','酒店住宿','租房与居住','求职与职场','购物消费','银行、邮局与邮件','人物描述','文娱艺术'];
const got=units.map(u=>u.name);
assert(JSON.stringify(got)===JSON.stringify(expectNames), '单元名与 Sheet 名一致');

console.log(`\n结果：${failed===0?'全部通过':'有 '+failed+' 项失败'}`);
process.exit(failed===0?0:1);
