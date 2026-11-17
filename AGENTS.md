# 项目说明（给 AI 助手 / Codex 的交接文档）

## 这是什么

单文件的英语单词/词组跟读练习工具（复刻"单词精灵"并增强）。**纯前端、无后端**，用浏览器 Web Speech API（`speechSynthesis`）朗读，数据存在 `localStorage`。目标用户：手机（安卓 Chrome / iPhone Safari）。

## 部署状态

- 已上线：https://xujinhuan-999.github.io/word-reader/
- 仓库：https://github.com/xujinhuan-999/word-reader
- GitHub Pages 部署自 `main` 分支根目录；**任何 push 到 main 会自动重新部署**（约 1–2 分钟生效）。

## 本地预览 / 运行

无需构建。直接双击打开 `index.html` 即可（浏览器打开文件）。依赖两个 CDN：

- SheetJS：`https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js`（Excel 解析）
- SortableJS：`https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js`（拖拽排序）

离线时 Excel 上传和拖拽不可用，但粘贴导入 / 手动添加 / 跟读 / ↑↓ 排序仍可用。

## 文件结构

- `index.html` —— 全部应用（HTML + CSS + JS 全部内联，**保持单文件**）
- `test/prepareForTTS.test.mjs` —— 预处理函数单元测试（**与 index.html 内嵌实现镜像，必须同步**）
- `test/import.test.mjs` —— 导入逻辑校验（读取 `test/acceptance-dump.json`）
- `test/acceptance-dump.json` —— 验收词表（14 单元 / 614 词）的 JSON 导出，供导入测试用
- `词库模板.xlsx` —— 三列模板：`单词/词组 | 中文意思（选填） | 音标（选填）`
- `sample.txt` —— 粘贴导入示例
- `README.md` —— 面向用户的说明

## 核心架构（都在 index.html 的 `<script>` 里，按函数名找）

数据模型与存储：

```
units = [{ id, name, words: [{ id, en, zh, phonetic }] }]
settings = { readLang:'en'|'zh'|'both', mode:'seq'|'random', times, intervalMs,
             hideEn, hideZh, hidePhonetic, followUp, followUpDelay, enVoiceURI, zhVoiceURI }
localStorage key: wr_units_v1 / wr_settings_v1
```

关键函数：

| 函数 | 作用 |
|------|------|
| `prepareForTTS(en)` | 朗读前英文预处理：`sb.`→somebody、`sth.`→something、斜杠 `/`→` or `、括号去字符、`etc./e.g./i.e.` 展开、`sb.'s`→somebody's |
| `prepareForTTSZh(zh)` | 中文预处理：去结尾词性标注（`（n.）`等）、斜杠→`或`、省略号→停顿 |
| `wordSegments(w)` | 按 readLang 生成朗读段（英文段 lang=en、中文段 lang=zh-CN） |
| `speakText / speakSegments / primeTTS` | TTS 引擎，含移动端兼容处理 |
| `runLoop(queue, startIdx, token)` | 顺序/随机领读循环，用 `ctl.token` 实现取消/暂停 |
| `detectCols / normalizeRows` | Excel 导入：自动识别三列表头，每个 Sheet = 一个单元 |
| `renderUnits / renderUnitSelect / renderWordList / renderPracticeList` | 渲染 |
| `moveWord` | ↑↓ 排序；拖拽用 SortableJS（`initSortable`） |
| `startPractice / pausePractice / resumePractice / stopPractice` | 领读控制 |

## 已踩过的坑（重要，别改坏）

1. **移动端浏览器**：安卓必须在 **Chrome**、iPhone 必须在 **Safari** 打开。微信内置、UC/QQ 浏览器、安卓自带浏览器**不支持 `speechSynthesis`**（会静默 + 点击不响应）。
2. **iOS 语音静默**：`SpeechSynthesisUtterance` 若不被全局引用会被 GC 导致不出声 —— 已用全局 `curUtterance` 保持引用；另用 `unlockAudio()`（空 AudioContext）解锁音频会话。
3. **移动端点击**：iOS 对非 `<button>` 元素的 `click` 事件可能不触发 —— 所以列表每行放了真正的 `<button class="pw-play">`（以及词库里的 🔊 按钮）。
4. **不要强制指定 voice**：默认用 `lang` + 系统默认语音；若强制指定了某个 voice，安卓上可能选中"没下载语音数据"的声音而静默。`fillVoiceSelects` 里**不要**再自动给 `settings.enVoiceURI` 赋默认值。
5. **随机模式暂停→继续**：沿用 `ctl.queue`，不要重建（否则顺序会乱）。
6. **单测与内嵌实现同步**：`test/prepareForTTS.test.mjs` 里的 `prepareForTTS/prepareForTTSZh` 是 index.html 内嵌实现的**镜像拷贝**，改任意一处必须同步另一处。
7. **语音状态显示**：`refreshVoices()` 里若 `getVoices().length===0` 会显示"⚠ 未检测到语音"。

## 测试

```bash
node test/prepareForTTS.test.mjs   # 预处理单元测试
node test/import.test.mjs          # 导入校验（需 test/acceptance-dump.json）
```

## 待办（backlog）

- 离线 PWA：Service Worker + manifest，把 SheetJS/Sortable 本地化，可安装、断网可用、断网也能传 Excel
- 导出词库（导出为 Excel / 文本）
- 听写模式（只听音、隐藏文字）
- 错词 / 收藏复习模式
- 录音跟读对比（录自己读、回放对比）

## 部署方式

- 推荐：`git add . && git commit && git push`，Pages 自动重建（1–2 分钟生效）。
- 备选：用 GitHub Contents API `PUT /repos/{owner}/{repo}/contents/{path}` 直接覆盖 `index.html`（需要 token、repo 权限）。
