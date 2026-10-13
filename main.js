'use strict';

const { Plugin, PluginSettingTab, Setting, Notice, MarkdownView, Modal, setIcon, debounce, AbstractInputSuggest, TFolder } = require('obsidian');

/* ═══════════════ 全文分区目录（按出现顺序，便于导航）═══════════════

   文案                         t() 的三语文案表
   设置                         DEFAULT_SETTINGS / 净化 / 预设套用
   标题样式（预设）              快照 / 净化 / 判定两套是否相同
   编号序列                     阿拉伯 / 罗马 / 汉字 / 字母
   去除旧编号                    四条路径共用一份实现（判别器）
   规则解析与文本组装             parseRule / assembleTitle / buildStrippers
   链接子路径归一化               逐字复刻 Obsidian 官方（2026-09-26 对齐）
   逐字符最小差异                 确认窗的高亮分段
   编号规划                      planNumbering + planReset
   有效级别集合 & 样式索引         「缺失 / 不连续」那套（票 03）
   标题链接改写                   全库 [[笔记#标题]] / [文字](笔记.md#标题)
   插件                          main.js 的主类：自动编号 / 命令 / 前台判定
   设置面板                      HeadingGuardSettingTab（display() 里另有目录）
   两列对照确认窗                 DiffConfirmModal
   样式名输入框的建议列表          InputListSuggest
   文件夹选择器                   FolderPickerModal

   ⚠️ 行号会随编辑漂移，所以这里只列名字：按名字 grep 横幅注释即可。
   ═══════════════════════════════════════════════════════════════ */
/* ───────────────────────────── 文案 ───────────────────────────── */

const STRINGS = {
    'zh-CN': {
        langName: '简体中文',
        lang: '语言',
        auto: '开启自动编号',
        autoDesc: '当光标出现时，自动为当前笔记标题编号',
        seconds: '秒',
        resetInterval: '重置',
        resetIntervalTip: '关闭自动编号，并把检测间隔恢复为 10 秒',
        scope: '自动编号的作用范围',
        scopeDesc: '「全部笔记」= 每篇笔记都自动编号；「仅已启用的笔记」= 只有 frontmatter 里写了 `heading-guard: on` 的笔记才自动编号。手动执行的两个命令不受此项限制',
        scopeAll: '全部笔记',
        scopeOptIn: '仅已启用的笔记',
        exclude: '排除文件夹',
        excludeDesc: '一行一个文件夹路径(相对仓库根目录，例如"文件夹1/文件夹2")，这些文件夹里的笔记不受自动编号影响',
        excludeFromTemplates: '从内置「模板」插件读到的模板文件夹已填入（读不到就留空）',
        stripOld: '编号前尝试去除旧编号',
        stripOldDesc: '编号之前，尝试删除旧编号，支持的格式有限，必要时请手动删除后重新编号',
        missingLevel: '父级别缺失或级别不连续时编号方式',
        missingLevelDesc: '父级标题缺失或被注释%%skip%%跳过时，子标题如何编号（只要笔记中存在一个正常编号的父标题就不算缺失或跳过）',
        missingLevelStrict: '严格按照标题样式',
        missingLevelInherit: '继承父标题样式',
        previewHypoLine: '# (假设一级标题缺失或skip)',
        preview: '样式预览',
        none: '无',
        bracketAscii: '()-英文括号',
        bracketCjk: '（）-中文括号',
        withSpace: '尾缀后加空格',
        noSpace: '尾缀后不加空格',
        level: ['', '一级标题', '二级标题', '三级标题', '四级标题', '五级标题', '六级标题'],
        skip: '本级不编号',
        skipDesc: '该层级标题不编号，但保留该层级结构，子标题仍正常按规则编号',
        seqBrackets: '编号序列/前后括符',
        seqBracketsDesc: '本级编号怎么排：接着父级往下排（阶梯式），还是从 1 重新开始',
        numberInherit: '阶梯式编号',
        numberRestart: '重新编号',
        sep: '编号层级间隔符',
        sepDesc: '本级编号与父级编号之间的分隔符',
        lvSuffix: '编号尾缀',
        lvSuffixDesc: '本级编号与标题内容之间的字符（选「无」= 不加字符）；右边那个下拉决定要不要再跟一个空格',
        cmdNow: '立即编号当前笔记',
        cmdReset: '重置当前笔记标题编号',
        upToDate: '标题编号已是最新',
        noNumber: '没有可去除的标题编号',
        stale: '笔记刚刚改过，本次已跳过',
        done: (n) => n + '条标题已自动编号',
        linksUpdated: (c) => '更新' + c.files + '个文件中的' + c.links + '条链接',
        syncBlocked: 'Heading Guard:无法同步链接，标题已停止更改',
        resetDone: (n) => '已重置 ' + n + ' 个标题编号',
        reload: '命令名称将在重载插件后更新',
        restoreDefaults: '恢复默认设置',
        fmHelpIntro: '在笔记的 frontmatter 属性中可以指定不同笔记采用不同编号样式，包含以下三种写法：',
        helpFoldTitle: '跳过注释与frontmatter属性说明',
        noteHelpIntro: '在标题的下一行添加跳过注释，可以跳过当前标题不编号，示例如下：',
        noteSampleTitle: '一级标题',
        noteSkipLine: '表示当前标题不进行编号',
        noteSkipsLine: '表示当前标题及其下面所有的子标题都不编号',
        fmHelpOn: '表示当前笔记开启自动编号；',
        fmHelpPreset: '表示当前笔记采用已保存的样式方案A进行编号（⚠️ 它不开启自动编号，要开启请写 on|方案A）；',
        fmHelpBoth: '表示当前笔记开启自动编号且采用已保存的样式方案A进行编号。',
        restoreConfirm: '是否要恢复默认设置？',
        ok: '确定',
        cancel: '取消',
        preset: '保存标题样式',
        presetDesc: '保存自定义样式设置，之后可以一键切换',
        presetPlaceholder: '样式名称',
        presetListTip: '展开全部已保存的样式',
        presetEmpty: '还没有保存任何样式',
        presetSaveTip: '用上面输入的名称保存当前样式；同名会直接覆盖',
        presetDeleteTip: '删除选中的样式',
        presetNeedName: '请先输入样式名称',
        presetSaved: (n) => '已保存样式「' + n + '」',
        presetApplied: (n) => '已套用样式「' + n + '」',
        presetDeleted: (n) => '已删除样式「' + n + '」',
        presetMissing: (n) => '没有找到样式「' + n + '」',
        noticeUnknownPreset: (n) => 'heading-guard: 标题编号样式「' + n + '」未生效！请检查该样式名称是否正确或存在！',
        presetDeleteConfirm: (n) => '确定删除样式「' + n + '」吗？',
        presetNew: '新建样式',
        presetDupName: '当前样式方案名称已存在！',
        presetUnchanged: '设置未发生变化，无需保存',
        presetOverwriteConfirm: (n) => '「' + n + '」样式设置已更改，是否覆盖保存？',
        presetUpdated: (n) => '已更新样式「' + n + '」',
        presetDupSettings: (n) => '当前样式方案已存在于「' + n + '」中！',
        diffOld: '原文',
        diffNew: '修改后',
        diffSummary: '标题汇总：',
        diffSummaryNone: '无',
        diffSkip: 'Skip',
        diffConfirm: '确认',
        staleOnConfirm: '笔记在确认期间被改过，本次未执行，请重新执行命令',
        pickFolderTitle: '选择文件夹路径',
        pickFolderLabel: '文件夹路径',
        pickFolderPlaceholder: '输入或选择仓库里的文件夹',
        pickFolderNeedValue: '请先选择或输入一个文件夹',
        excludeAdd: '添加文件夹到排除列表',
        excludeAdded: (n) => '已添加「' + n + '」',
        excludeAlready: (n) => '「' + n + '」已经在排除列表里',
    },
    'zh-TW': {
        langName: '繁體中文',
        lang: '語言',
        auto: '開啟自動編號',
        autoDesc: '當游標出現時，自動為目前筆記標題編號',
        seconds: '秒',
        resetInterval: '重設',
        resetIntervalTip: '關閉自動編號，並把偵測間隔恢復為 10 秒',
        scope: '自動編號的作用範圍',
        scopeDesc: '「全部筆記」= 每篇筆記都自動編號；「僅已啟用的筆記」= 只有 frontmatter 裡寫了 `heading-guard: on` 的筆記才自動編號。手動執行的兩個命令不受此項限制',
        scopeAll: '全部筆記',
        scopeOptIn: '僅已啟用的筆記',
        exclude: '排除資料夾',
        excludeDesc: '一行一個資料夾路徑(相對於倉庫根目錄，例如"資料夾1/資料夾2")，這些資料夾裡的筆記不受自動編號影響',
        excludeFromTemplates: '從內建「範本」外掛讀到的範本資料夾已填入（讀不到就留空）',
        stripOld: '編號前嘗試去除舊編號',
        stripOldDesc: '編號之前，嘗試刪除舊編號，支援的格式有限，必要時請手動刪除後重新編號',
        missingLevel: '父層級缺失或層級不連續時編號方式',
        missingLevelDesc: '父級標題缺失或被註解%%skip%%跳過時，子標題如何編號（只要筆記中存在一個正常編號的父標題就不算缺失或跳過）',
        missingLevelStrict: '嚴格依照標題樣式',
        missingLevelInherit: '繼承父標題樣式',
        previewHypoLine: '# (假設一級標題缺失或skip)',
        preview: '樣式預覽',
        none: '無',
        bracketAscii: '()-英文括號',
        bracketCjk: '（）-中文括號',
        withSpace: '尾綴後加空格',
        noSpace: '尾綴後不加空格',
        level: ['', '一級標題', '二級標題', '三級標題', '四級標題', '五級標題', '六級標題'],
        skip: '本級不編號',
        skipDesc: '該層級標題不編號，但保留該層級結構，子標題仍正常按規則編號',
        seqBrackets: '編號序列/前後括符',
        seqBracketsDesc: '本級編號怎麼排：接著父級往下排（階梯式），還是從 1 重新開始',
        numberInherit: '階梯式編號',
        numberRestart: '重新編號',
        sep: '編號層級間隔符',
        sepDesc: '本級編號與父級編號之間的分隔符',
        lvSuffix: '編號尾綴',
        lvSuffixDesc: '本級編號與標題內容之間的字符（選「無」= 不加字符）；右邊那個下拉決定要不要再跟一個空格',
        cmdNow: '立即為目前筆記編號',
        cmdReset: '重設目前筆記標題編號',
        upToDate: '標題編號已是最新',
        noNumber: '沒有可去除的標題編號',
        stale: '筆記剛剛改過，本次已跳過',
        done: (n) => n + '條標題已自動編號',
        linksUpdated: (c) => '更新' + c.files + '個檔案中的' + c.links + '條連結',
        syncBlocked: 'Heading Guard:無法同步連結，標題已停止更改',
        resetDone: (n) => '已重設 ' + n + ' 個標題編號',
        reload: '命令名稱將在重新載入外掛後更新',
        restoreDefaults: '恢復預設設定',
        fmHelpIntro: '在筆記的 frontmatter 屬性中可以指定不同筆記採用不同編號樣式，包含以下三種寫法：',
        helpFoldTitle: '跳過註解與 frontmatter 屬性說明',
        noteHelpIntro: '在標題的下一行加入跳過註解，可以跳過目前標題不編號，示例如下：',
        noteSampleTitle: '一級標題',
        noteSkipLine: '表示目前標題不進行編號',
        noteSkipsLine: '表示目前標題及其下面所有子標題都不編號',
        fmHelpOn: '表示目前筆記開啟自動編號；',
        fmHelpPreset: '表示目前筆記採用已儲存的樣式方案A進行編號（⚠️ 它不開啟自動編號，要開啟請寫 on|方案A）；',
        fmHelpBoth: '表示目前筆記開啟自動編號且採用已儲存的樣式方案A進行編號。',
        restoreConfirm: '是否要恢復預設設定？',
        ok: '確定',
        cancel: '取消',
        preset: '儲存標題樣式',
        presetDesc: '儲存自訂樣式設定，之後可以一鍵切換',
        presetPlaceholder: '樣式名稱',
        presetListTip: '展開全部已儲存的樣式',
        presetEmpty: '還沒有儲存任何樣式',
        presetSaveTip: '以上面輸入的名稱儲存目前樣式；同名會直接覆蓋',
        presetDeleteTip: '刪除選取的樣式',
        presetNeedName: '請先輸入樣式名稱',
        presetSaved: (n) => '已儲存樣式「' + n + '」',
        presetApplied: (n) => '已套用樣式「' + n + '」',
        presetDeleted: (n) => '已刪除樣式「' + n + '」',
        presetMissing: (n) => '找不到樣式「' + n + '」',
        noticeUnknownPreset: (n) => 'heading-guard: 標題編號樣式「' + n + '」未生效！請檢查該樣式名稱是否正確或存在！',
        presetDeleteConfirm: (n) => '確定要刪除樣式「' + n + '」嗎？',
        presetNew: '新建樣式',
        presetDupName: '目前樣式方案名稱已存在！',
        presetUnchanged: '設定未發生變化，無需儲存',
        presetOverwriteConfirm: (n) => '「' + n + '」樣式設定已變更，是否覆蓋儲存？',
        presetUpdated: (n) => '已更新樣式「' + n + '」',
        presetDupSettings: (n) => '目前樣式方案已存在於「' + n + '」中！',
        diffOld: '原文',
        diffNew: '修改後',
        diffSummary: '標題彙總：',
        diffSummaryNone: '無',
        diffSkip: 'Skip',
        diffConfirm: '確認',
        staleOnConfirm: '筆記在確認期間被改過，本次未執行，請重新執行命令',
        pickFolderTitle: '選擇資料夾路徑',
        pickFolderLabel: '資料夾路徑',
        pickFolderPlaceholder: '輸入或選擇倉庫裡的資料夾',
        pickFolderNeedValue: '請先選擇或輸入一個資料夾',
        excludeAdd: '新增資料夾到排除清單',
        excludeAdded: (n) => '已新增「' + n + '」',
        excludeAlready: (n) => '「' + n + '」已經在排除清單裡',
    },
    'en': {
        langName: 'English',
        lang: 'Language',
        auto: 'Enable auto numbering',
        autoDesc: 'Number the current note\u2019s headings automatically when the cursor appears',
        seconds: 's',
        resetInterval: 'Reset',
        resetIntervalTip: 'Turn auto numbering off and restore the interval to 10 s',
        scope: 'Where auto numbering applies',
        scopeDesc: 'All notes = every note is numbered automatically. Only opted-in notes = only notes with `heading-guard: on` in their frontmatter are numbered automatically. The two manual commands ignore this setting.',
        scopeAll: 'All notes',
        scopeOptIn: 'Only opted-in notes',
        exclude: 'Excluded folders',
        excludeDesc: 'One folder path per line (relative to the vault root, e.g. "folder1/folder2"). Notes inside them are not affected by auto numbering.',
        excludeFromTemplates: 'Prefilled from the core Templates plugin folder (left empty if unavailable)',
        stripOld: 'Try to strip the old number before numbering',
        stripOldDesc: 'Before numbering, try to remove the old number. Only a few formats are supported; if needed, remove it by hand and number again.',
        missingLevel: 'Numbering when parent levels are missing',
        missingLevelDesc: 'How sub-headings are numbered when a parent heading is missing or skipped by a %%skip%% marker (if the note still has a properly numbered parent heading, it does not count as missing or skipped)',
        missingLevelStrict: 'Follow the heading style',
        missingLevelInherit: 'Inherit the parent heading style',
        previewHypoLine: '# (suppose the level-1 heading is missing or skipped)',
        preview: 'Style preview',
        none: 'None',
        bracketAscii: '() ascii parentheses',
        bracketCjk: '（） CJK parentheses',
        withSpace: 'Add a space after the suffix',
        noSpace: 'No space after the suffix',
        level: ['', 'Level 1 headings', 'Level 2 headings', 'Level 3 headings', 'Level 4 headings', 'Level 5 headings', 'Level 6 headings'],
        skip: "Don't number this level",
        skipDesc: 'This level is not numbered, but the level structure stays \u2014 its sub-headings still follow the numbering rules',
        seqBrackets: 'Number sequence / brackets',
        seqBracketsDesc: 'How this level\u2019s number is arranged: continue the parent number (staircase), or restart this level from 1',
        numberInherit: 'Staircase numbering',
        numberRestart: 'Restart numbering',
        sep: 'Level separator',
        sepDesc: 'Separator between this level\u2019s number and its parent\u2019s',
        lvSuffix: 'Heading suffix',
        lvSuffixDesc: 'The character between this level\u2019s number and the heading text (None = no character); the dropdown on the right controls whether a space follows it',
        cmdNow: 'Number the current note now',
        cmdReset: 'Reset heading numbers in the current note',
        upToDate: 'Heading numbers are already up to date',
        noNumber: 'No heading number to remove',
        stale: 'The note just changed, this pass was skipped',
        done: (n) => 'Numbered ' + n + ' heading(s)',
        linksUpdated: (c) => 'Updated ' + c.links + ' link(s) in ' + c.files + ' file(s)',
        syncBlocked: 'Heading Guard: cannot sync links, headings were left unchanged',
        resetDone: (n) => 'Reset ' + n + ' heading number(s)',
        reload: 'The command name updates after reloading the plugin',
        restoreDefaults: 'Restore defaults',
        fmHelpIntro: 'A note\u2019s frontmatter can give that note its own numbering style. Three forms:',
        helpFoldTitle: 'Skip comments & frontmatter',
        noteHelpIntro: 'Add a skip comment on the line right below a heading to leave that heading unnumbered. Example:',
        noteSampleTitle: 'Heading',
        noteSkipLine: 'leaves this heading unnumbered',
        noteSkipsLine: 'leaves this heading and every sub-heading below it unnumbered',
        fmHelpOn: 'auto numbering is on for this note;',
        fmHelpPreset: 'this note uses the saved style 方案A (⚠️ this does not turn auto numbering on — write on|方案A for that);',
        fmHelpBoth: 'auto numbering is on for this note AND it uses the saved style 方案A.',
        restoreConfirm: 'Restore default settings?',
        ok: 'OK',
        cancel: 'Cancel',
        preset: 'Saved heading styles',
        presetDesc: 'Save your custom style settings, then switch between them in one click',
        presetPlaceholder: 'Style name',
        presetListTip: 'Show all saved styles',
        presetEmpty: 'No saved styles yet',
        presetSaveTip: 'Save the current settings under the name above; an existing name is overwritten',
        presetDeleteTip: 'Delete the selected style',
        presetNeedName: 'Enter a style name first',
        presetSaved: (n) => 'Saved style \u201C' + n + '\u201D',
        presetApplied: (n) => 'Applied style \u201C' + n + '\u201D',
        presetDeleted: (n) => 'Deleted style \u201C' + n + '\u201D',
        presetMissing: (n) => 'No style named \u201C' + n + '\u201D',
        noticeUnknownPreset: (n) => 'heading-guard: heading style "' + n + '" did not take effect! Check that this style name is correct or exists.',
        presetDeleteConfirm: (n) => 'Delete the style \u201C' + n + '\u201D?',
        presetNew: 'New style',
        presetDupName: 'A style preset with this name already exists!',
        presetUnchanged: 'Nothing changed — no need to save',
        presetOverwriteConfirm: (n) => 'The settings of \u201C' + n + '\u201D have changed. Overwrite it?',
        presetUpdated: (n) => 'Updated style \u201C' + n + '\u201D',
        presetDupSettings: (n) => 'This style already exists as \u201C' + n + '\u201D!',
        diffOld: 'Before',
        diffNew: 'After',
        diffSummary: 'Headings: ',        diffSummaryNone: 'none',
        diffSkip: 'Skip',
        diffConfirm: 'Confirm',
        staleOnConfirm: 'The note changed while you were confirming, so nothing was written. Run the command again',
        pickFolderTitle: 'Choose a folder path',
        pickFolderLabel: 'Folder path',
        pickFolderPlaceholder: 'Type or pick a folder in the vault',
        pickFolderNeedValue: 'Pick or type a folder first',
        excludeAdd: 'Add a folder to the excluded list',
        excludeAdded: (n) => 'Added \u201C' + n + '\u201D',
        excludeAlready: (n) => '\u201C' + n + '\u201D is already excluded',
    },
};

// Obsidian 没把「界面语言」放进插件 API，只能从外面读。三个来源按可靠性排：
//   ① localStorage 的 'language' —— 用户在设置里**显式选过**才有值
//   ② <html lang="…">      —— 反映**生效**的界面语言，没显式选过也有（实测本机 = 'zh'）
//   ③ moment.locale()      —— 同一事实的另一个来源，兜底
// ⚠️ **绝不能用 navigator.language** —— 那是操作系统/浏览器的语言，与 Obsidian 的设置无关
//    （用户完全可能系统中文、Obsidian 英文）。
const ZH_TW_TAGS = ['zh-tw', 'zh-hant', 'zh-hk', 'zh-mo'];
function mapObsidianLanguage(tag) {
    const t = String(tag == null ? '' : tag).trim().toLowerCase().replace(/_/g, '-');
    if (!t) return null;
    if (t.indexOf('zh') !== 0) return 'en';          // 非中文 → 插件只有英文可选
    return ZH_TW_TAGS.some((p) => t.indexOf(p) === 0) ? 'zh-TW' : 'zh-CN';
}
function detectObsidianLanguage() {
    const sources = [
        () => window.localStorage.getItem('language'),
        () => document.documentElement.lang,
        () => (typeof moment !== 'undefined' && moment.locale ? moment.locale() : null),
    ];
    for (const read of sources) {
        try {
            const hit = mapObsidianLanguage(read());
            if (hit) return hit;
        } catch (err) {
            // 读不到就试下一个来源（非浏览器环境 / 权限异常都落在这里）
        }
    }
    return null;   // 全读不到 → 由调用方回落到 DEFAULT_SETTINGS（zh-CN）
}

function lookup(language, key, arg) {
    const dict = STRINGS[language] || STRINGS['zh-CN'];
    const value = dict[key];
    return typeof value === 'function' ? value(arg) : value;
}

/* ───────────────────────────── 设置 ───────────────────────────── */

const DEFAULT_SCAN_INTERVAL = 10;
const MIN_SCAN_INTERVAL = 5;
const MAX_SCAN_INTERVAL = 60;
const NOTE_ENTER_DELAY_MS = 2000;  // 切到某篇笔记后多久开始编号
const EDIT_DEBOUNCE_MS = 1000;     // 标题元数据变化后多久开始编号
// 两个跳过标记（用户 2026-10-09 定）：
//   %%skip%%  = 只跳过当前标题
//   %%skips%% = 连子标题一起跳过
// ⚠️ 两者**不会互相误判**：`'%%skips%%'.indexOf('%%skip%%') === -1`（第 7 个字符就分岔）——
//    但仍然各判各的，别靠「先匹配短的还是长的」这种顺序去凑。
const SKIP_MARKER = '%%skip%%';
const SKIP_TREE_MARKER = '%%skips%%';

// 作用范围（用户 2026-09-25）：
//   all   = 所有笔记都自动编号（原本的行为，默认）
//   optIn = 只有 frontmatter 里写了 `heading-guard: on` 的笔记才自动编号
// 手动执行的两个命令**不走**这个判定（用户明确要求：命令是用户亲自点的，就该生效）。
const SCOPE_CHOICES = ['all', 'optIn'];

// 「父级别缺失或级别不连续时编号方式」的两个取值（用户 2026-10-09 定）：
//   strict  = 严格按标题级别补全，段数永远等于标题级别（默认）
//   inherit = 继承父标题样式，缺失的层级让更深的级别整体上移一套样式
const MISSING_LEVEL_CHOICES = ['strict', 'inherit'];
const SCOPE_KEY = 'heading-guard';

// 尾缀 / 间隔符 / 括符的候选都锁死，值用 'none' 表示「无」。
// 候选表只影响「UI 里能选什么」；存量设置里认不出的值由 loadSettings 的 pick() 回落。
// ⚠️ 这一层与「判别器认不认得出来」是两回事：判别器用的是 `NUMBER_SEGMENTS`（穷举段表）
//    与 `NUMBER_TAILS`（尾缀表）—— 从**候选表**里删一个符号只影响下拉框，不影响剥离能力。
//    要收窄剥离范围，改的是判别器那两张表，不是这里。
const SUFFIX_CHOICES = ['none', '、', '.', '-', '_', ')', '>', '」'];
const SEPARATOR_CHOICES = ['none', '.', '-', '_', ':', '~'];
const BRACKET_CHOICES = ['none', '()', '（）', '<>', '「」', '【】'];

const SAMPLE_TITLES = ['一级标题', '二级标题', '三级标题', '四级标题', '五级标题', '六级标题'];

function defaultLevel(level) {
    return {
        skip: false,
        sequence: 'arabic',
        brackets: 'none',
        separator: level === 1 ? 'none' : '.',
        // 尾巴 = 字符（「无」则不加）+ 可选空格；「无 + 不加空格」= 不加尾巴。2026-10-11 删了「开关」
        suffix: { char: 'none', space: true },
        // 'inherit'（默认，= 原来行为：编号接在父级后面） / 'restart'（本级从 1 开始，不带父级前缀）
        numbering: 'inherit',
    };
}

const DEFAULT_SETTINGS = {
    language: 'zh-CN',
    autoNumber: false,
    scanInterval: DEFAULT_SCAN_INTERVAL,
    stripOldNumbers: true,         // 编号前先尝试剥掉旧编号（用户 2026-09-28 要求：默认开启）
    // 父级缺失 / 级别不连续时怎么编号（用户 2026-10-09 新增）。见 MISSING_LEVEL_CHOICES。
    // ⚠️ 默认 strict 会**改变**「有跳级或缺层」的笔记的编号（缺父号时按级别补全），这是用户明确要的。
    missingLevelMode: 'strict',
    scope: 'all',                  // 自动编号的作用范围，见 SCOPE_CHOICES
    excludeFolders: [],            // 不自动编号的文件夹（相对仓库根），按路径前缀匹配
    levels: {
        1: defaultLevel(1), 2: defaultLevel(2), 3: defaultLevel(3),
        4: defaultLevel(4), 5: defaultLevel(5), 6: defaultLevel(6),
    },
    // 用户自己存的「标题样式」：[{ name, levels: {1..6}, missingLevelMode? }]。
    // ⚠️ 这是**用户数据**、不是设置项 —— restoreDefaults() 不重置它（否则点一下「恢复默认设置」全没了）。
    stylePresets: [],
};

/* ───────────────────── 标题样式（预设） ───────────────────── */

// 「候选表里认不出的值 → 回落默认」。loadSettings 与样式净化共用同一条口径。
const pick = (list, value, fallback) => (list.indexOf(value) >= 0 ? value : fallback);

// 把「某一级设置」净化成合法值。存盘内容一律不可信（用户手改过 / 旧版本残留 / 样式里带脏数据）。
// 原先这段逻辑内联在 loadSettings 里；抽出来是为了让「读设置」与「读样式」不会各写一遍而跑偏。
function sanitizeLevel(level, saved) {
    const base = defaultLevel(level);
    const raw = saved || {};
    base.skip = !!raw.skip;
    base.sequence = SEQUENCE_IDS.indexOf(raw.sequence) >= 0 ? raw.sequence : base.sequence;
    base.brackets = pick(BRACKET_CHOICES, raw.brackets, base.brackets);
    base.separator = pick(SEPARATOR_CHOICES, raw.separator, base.separator);
    base.numbering = raw.numbering === 'restart' ? 'restart' : 'inherit';
    // 2026-10-11 迁移：老的「编号尾缀开关」已删 ——
    //   老数据 `enabled: false` → 落成「无字符」，**空格照旧读它原本那个值** —— 这样尾巴与今天逐字节相同 ✓；
    //   `enabled: true` 或没有这个字段 → 原样读字符与空格。**幂等**：迁过之后没有该字段，不再受影响。
    const old = raw.suffix || {};
    base.suffix = raw.suffix && old.enabled === false
        ? { char: 'none', space: old.space !== false }
        : {
            char: pick(SUFFIX_CHOICES, old.char, base.suffix.char),
            space: old.space !== false,
        };
    return base;
}


// 「新建样式」= **全默认**的一套样式（票 06）。用 defaultLevel 拼，保证与 DEFAULT_SETTINGS 同源。
// 票 08（2026-10-11）：设置页里到底哪个元素在滚，随 Obsidian 版本/布局而变 ——
// 从给定节点往上找第一个「内容高于可视区」的祖先；找不到就退回它自己。
// ⚠️ 纯 DOM 探测，离线桩里没有 scrollHeight/clientHeight → 直接退回自己（不抛错、不影响测试）。
function scrollHostOf(el) {
    let node = el;
    while (node && node.parentElement) {
        if (node.scrollHeight > node.clientHeight && node.clientHeight > 0) return node;
        node = node.parentElement;
    }
    return el;
}

function defaultStylePreset() {
    const levels = {};
    for (let level = 1; level <= 6; level++) levels[level] = defaultLevel(level);
    return {
        levels: levels,
        missingLevelMode: DEFAULT_SETTINGS.missingLevelMode,
    };
}

// 两套样式是不是「同一套」（票 06）。级与尾缀必须逐字段相同；
// ⚠️ `missingLevelMode` 是**可选**字段：老方案里没有它 → 当**通配**（它不钉那项设置，不该算不同）。
function sameStylePreset(a, b) {
    if (!a || !b) return false;
    if (JSON.stringify(a.levels) !== JSON.stringify(b.levels)) return false;
    if (a.missingLevelMode && b.missingLevelMode && a.missingLevelMode !== b.missingLevelMode) return false;
    return true;
}

// 一套样式里存的就是这两样：各级标题设置 + 「父级别缺失或级别不连续时编号方式」。
// ⚠️ 2026-10-11 删了「全局编号尾缀」——老样式里那份会被**忽略**（不报错，见票 05 的老方案原则）。
// 其余设置（语言 / 自动编号 / 排除文件夹 …）属于「这个用户怎么用」，不跟着样式走。
function snapshotStylePreset(settings) {
    const levels = {};
    for (let level = 1; level <= 6; level++) {
        levels[level] = JSON.parse(JSON.stringify(settings.levels[level]));
    }
    return {
        levels: levels,
        // 票 05（2026-10-11）：用户要求「保存标题样式」时把这个选项一起存下来。
        missingLevelMode: settings.missingLevelMode === 'inherit' ? 'inherit' : 'strict',
    };
}

// 把样式套回 settings。
// ⚠️ **就地改写**各级对象，绝不整个换引用 —— 设置面板里的闭包（own）
//    捕获的就是这些对象本身，换引用会让它们继续指向旧值。
function applyStylePresetToSettings(settings, preset) {
    for (let level = 1; level <= 6; level++) {
        const clean = sanitizeLevel(level, (preset.levels && preset.levels[level]) || {});
        const own = settings.levels[level];
        own.skip = clean.skip;
        own.sequence = clean.sequence;
        own.brackets = clean.brackets;
        own.separator = clean.separator;
        own.numbering = clean.numbering;
        own.suffix.char = clean.suffix.char;
        own.suffix.space = clean.suffix.space;
    }
    // 票 05：顺带把「父级别缺失或级别不连续时编号方式」也套回去。
    // ⚠️ **老方案**（这个字段还不存在时存的）里没有它 → **保持设置现状不动** ——
    //    加载一个老方案不该把用户当下的选择悄悄改成 strict ✗（重新保存一次就会带上它）。
    if (preset.missingLevelMode === 'inherit' || preset.missingLevelMode === 'strict') {
        settings.missingLevelMode = preset.missingLevelMode;
    }
}

// 从磁盘读回的样式表：只收「名字是合法非空字符串」的项；重名以后者为准（顺序保持首次出现的位置）。
function sanitizeStylePresets(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    const at = new Map();
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        if (name === '') continue;
        const levels = {};
        for (let level = 1; level <= 6; level++) {
            levels[level] = sanitizeLevel(level, (item.levels && item.levels[level]) || {});
        }
        const preset = { name: name, levels: levels };
        // 票 05：只认合法值；老方案里没有 → 就保持「没有」，由 applyStylePresetToSettings 决定不动它
        if (item.missingLevelMode === 'inherit' || item.missingLevelMode === 'strict') {
            preset.missingLevelMode = item.missingLevelMode;
        }
        if (at.has(name)) out[at.get(name)] = preset;
        else { at.set(name, out.length); out.push(preset); }
    }
    return out;
}

/* ─────────────────────────── 编号序列 ─────────────────────────── */

// alphabet 只在「剥离已有编号」时用：它给出该序列可能出现的字符，拼成字符类。
const SEQUENCES = [
    { id: 'arabic', alphabet: '0-9' },
    { id: 'roman', alphabet: 'IVXLCDM' },
    { id: 'han', alphabet: '一二三四五六七八九十百千万亿零' },
    { id: 'hanUpper', alphabet: '零壹贰叁肆伍陆柒捌玖拾佰仟万亿' },
    { id: 'lower', alphabet: 'a-z' },
    { id: 'upper', alphabet: 'A-Z' },
];
const SEQUENCE_IDS = SEQUENCES.map((item) => item.id);
// 选项文案是记号本身，不随语言变
const SEQUENCE_SAMPLES = {
    arabic: '1, 2, 3, 4…',
    roman: 'I, II, III, IV…',
    han: '一, 二, 三, 四…',
    hanUpper: '壹, 贰, 叁, 肆…',
    lower: 'a, b, c, d…',
    upper: 'A, B, C, D…',
};

const ROMAN_TABLE = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(n) {
    let out = '';
    let rest = n;
    for (const entry of ROMAN_TABLE) {
        while (rest >= entry[0]) {
            out += entry[1];
            rest -= entry[0];
        }
    }
    return out;
}

const HAN_SETS = {
    han: { digits: '零一二三四五六七八九', units: ['', '十', '百', '千'], big: ['', '万', '亿'] },
    hanUpper: { digits: '零壹贰叁肆伍陆柒捌玖', units: ['', '拾', '佰', '仟'], big: ['', '万', '亿'] },
};
const HAN_POWERS = [1000, 100, 10, 1];

// 1..9999 一节内的汉字写法
function toHanSection(n, set) {
    let out = '';
    for (let i = 0; i < 4; i++) {
        const power = HAN_POWERS[i];
        const digit = Math.floor(n / power) % 10;
        if (digit === 0) {
            // 中间缺位要补「零」，但连续缺位只补一次
            if (out !== '' && n % power !== 0 && !out.endsWith(set.digits.charAt(0))) out += set.digits.charAt(0);
        } else {
            out += set.digits.charAt(digit) + set.units[3 - i];
        }
    }
    return out;
}

function toHan(n, set) {
    if (n <= 0 || n > 99999999) return String(n);
    const groups = [];
    let rest = n;
    while (rest > 0) {
        groups.push(rest % 10000);
        rest = Math.floor(rest / 10000);
    }
    let out = '';
    let needZero = false;
    for (let i = groups.length - 1; i >= 0; i--) {
        const group = groups[i];
        if (group === 0) {
            if (out !== '') needZero = true;
            continue;
        }
        if (out !== '' && (needZero || group < 1000)) out += set.digits.charAt(0);
        needZero = false;
        out += toHanSection(group, set) + set.big[i];
    }
    // 「一十」简写成「十」，与大写「壹拾」简写成「拾」保持同一套规则
    return out.startsWith(set.digits.charAt(1) + set.units[1]) ? out.slice(1) : out;
}

function renderIndex(sequence, n) {
    if (sequence === 'roman') return toRoman(n);
    if (sequence === 'han') return toHan(n, HAN_SETS.han);
    if (sequence === 'hanUpper') return toHan(n, HAN_SETS.hanUpper);
    if (sequence === 'lower') return String.fromCharCode(97 + ((n - 1) % 26));
    if (sequence === 'upper') return String.fromCharCode(65 + ((n - 1) % 26));
    return String(n);
}

/* ──────────────── 去除旧编号（四条路径共用一份实现） ──────────────── */

/* 2026-09-28：**整条换成「按插件生成规则」的判别器**（用户拍板）。
 *
 * 旧实现是从三仓库 4916 条标题里**统计**出来的启发式：分段器贪心 + 规则链 R0~R6
 * + 一堆从语料 p95/p99 取的阈值（`MAX_FIRST_NUMBER=69` / `MAX_CONTINUATION_NUMBER=20`
 * / `BIG_NUMBER=100` / `MAX_DIGIT_RUN=6` …），还依赖 `total`（本篇标题总数）。
 * 臃肿，而且每个数都答不出「为什么偏偏是这个值」。
 *
 * 新实现只问一个问题：**这段前缀是不是插件自己会生成的编号？**
 *
 *   段   := 阿拉伯(1..99) | 规范罗马(1..99) | 汉字(1..99) | 大写汉字(1..99) | 单小写字母 | 单大写字母
 *   编号 := [开括符] 段 (分隔符 段)* [闭括符] [尾缀] 空白?
 *           括符   () （） <> 「」 【】
 *           分隔符 . - _ : ~
 *           尾缀   、 . - _ ) > 」 ） 】 』
 *
 * 「穷举」分两层：
 *   · **段级真的穷举** —— `NUMBER_SEGMENTS` 由 `renderIndex` **正向生成**（约 450 条），判定即查表。
 *     规范性因此自动成立：`IV` 在表里、`IIII` 不在；`一百零一` 在表里、`一百一` 不在。
 *   · **编号级用文法匹配** —— 6 段深度的组合是指数级，枚举不现实；回溯匹配等价地覆盖它。
 *
 * ⚠️ 必须用**回溯**而不是贪心：贪心会把**尾缀当分隔符** —— `1_一级标题` 会被拆成
 *    「段 `1` + 分隔符 `_` + 段 `一`」，剩下 `级标题` 解释不了就整条放弃。回溯枚举所有切法、
 *    取**最长的合法编号**，于是能选出正确的那种。
 *
 * ⚠️ 三个「不可分」的已知边界（都按「宁可不删」放弃，用户 2026-09-28 确认）：
 *    · `1标题`（尾缀选「无」+ 不加空格）—— 与「正文以短数字开头」同形；
 *    · `C-标题`（字母编号 + `-` 缀 + 不加空格）—— 与连字符词 `T-恤` 同形；
 *    · `120、第六十节`（序号 > 99）—— 用户定的硬线就是 99。
 */

const MAX_SEQ = 99;                 // 用户 2026-09-28 定：序号不可能超过 99，超过就不是编号
const NUMBER_SEGMENTS = new Map();  // 段 → 序列 id（穷举词表）
for (const id of SEQUENCE_IDS) {
    for (let n = 1; n <= MAX_SEQ; n++) {
        const seg = renderIndex(id, n);
        if (seg && !NUMBER_SEGMENTS.has(seg)) NUMBER_SEGMENTS.set(seg, id);
    }
}
for (let i = 0; i < 26; i++) {
    NUMBER_SEGMENTS.set(String.fromCharCode(97 + i), 'lower');
    NUMBER_SEGMENTS.set(String.fromCharCode(65 + i), 'upper');
}
let MAX_SEG_LEN = 0;
for (const seg of NUMBER_SEGMENTS.keys()) if (seg.length > MAX_SEG_LEN) MAX_SEG_LEN = seg.length;

const NUMBER_SEPS = ['.', '-', '_', ':', '~'];
const NUMBER_BRACKETS = [['(', ')'], ['（', '）'], ['<', '>'], ['「', '」'], ['【', '】']];
// 尾缀：插件候选是 `、 . - _ ) > 」`；后三个（全角括号的右半边）是用户 2026-09-28 要求补的
// —— 原话「单边括号插件可以产生，别忘了尾缀可以做到」。
const NUMBER_TAILS = ['、', '.', '-', '_', ')', '>', '」', '）', '】', '』'];
const NUMBER_MAX_DEPTH = 6;         // 最多六级标题
const RE_WS = /[\s\u00A0\u3000]/;
const RE_WS_HEAD = /^[\s\u00A0\u3000]+/;   // ⚠️ 必须带 `+`：`1     图形化环境` 要一次吃掉全部前导空白
// 尺寸形态 —— 用户 2026-09-28：「疑似编号后面带单位的都不算编号部分，不删除」。
// ⚠️ 必须允许**数字在前**：剥掉编号之后剩下的常常是 `4米特技风筝`（来自 `1-1.4米特技风筝`），
//    只匹配「以单位开头」会整类漏掉。比旧表多了单字母 `m` / `km` / `dm`：`1.4m` 也是尺寸。
//   ⚠️ 拉丁单位必须带 `(?![A-Za-z])` 边界（2026-09-28 加）：否则 `m` 会命中 `maven` / `mybatis` /
//   `model` 这类英文词的开头 —— 守卫 C 是在**剥掉编号之后的正文**上匹配的，一个裸 `m` 会
//   把「内容以 m 开头的标题」整类误判成尺寸而放弃剥离（CCB-PC 实测 4 条）。
//   `1.4m` 仍被拦住：`m` 后面是行尾／空白，不满足「紧跟字母」。
const RE_UNIT_HEAD = /^(\d+(\.\d+)?\s*)?(米|厘米|毫米|公分|寸|尺|吋|km|dm|cm|mm|kg|千克|克|吨|m)(?![A-Za-z])/;

// 判定标题**开头**是不是编号；返回 { core, content } 或 null（null = 不是编号，调用方保持原文）。
function decideNumber(text) {
    if (!text) return null;
    // 守卫 G（用户 2026-09-28 拍板）：标题里出现 `/` 或 `\` → **一律不动**。
    //   这类标题多半是路径 / 命令 / 表达式（`1、`./`和`sh`的区别`），宁可漏认也不冒误删风险。
    //   代价（已如实记账）：`2、银行卡密码修改/重置(5144)` / `3-2、提取</Voucher>并解析` 这类
    //   「编号本身没问题、只是正文含斜杠」的标题也不再剥 —— CCB-PC 全仓共 2 条。
    if (/[\\/]/.test(text)) return null;
    const s = text.replace(RE_WS_HEAD, '');

    let best = null;
    // 一个「切分」走到了尽头：尝试收尾（闭括符 / 尾缀 / 边界），合法就记下来比长度。
    const finish = (pos, fc, pure) => {
        let p = pos;
        const hadBracket = !!(fc && s[p] === fc);
        if (fc) { if (s[p] !== fc) return; p++; }
        let hadTail = false, tailCh = '';
        if (NUMBER_TAILS.includes(s[p])) { tailCh = s[p]; p++; hadTail = true; }
        const rest = s.slice(p);
        if (rest === '') return;
        const space = RE_WS_HEAD.test(rest);
        // 守卫 A2：尾缀是连字符且后面紧跟字母 → 连字符词（`e-mail` / `1-Nuitka`）
        if (tailCh && /[-\u2013\u2014]/.test(tailCh) && /[A-Za-z]/.test(rest[0] || '')) return;
        // 守卫 B：编号后面必须「紧跟空白」/「本身带尾缀」/「有闭括符」。
        //   闭括符也算分隔 —— 用户 2026-09-28：「括号成双成对出现，属于强信号」→ `(1)业务简介` 认。
        //   ⚠️ **例外（2026-09-28 补回）** —— 重写判别器时漏掉了旧实现的一条：
        //   旧文档原文「**多段阿拉伯（含 `.`）后可紧跟中文正文**（`1.1定义合法标识符规则`）；
        //   单段不开口子（`5总结` 仍是正文）」。漏掉的后果**不是漏认、而是剥半截**：
        //   `1.4参考资料` 会因为 `1.4` 不满足守卫 B 而退取更短的 `1.`（= 阿拉伯 1 + `.` 尾缀）当编号，
        //   剥成 `4参考资料` —— 静默改坏标题，比不剥更糟（用户 2026-09-28 在 CCB-PC 实测报出）。
        //   判据：`pure` = 到目前为止**全是阿拉伯段、且只用 `.` / `-` 分段**。
        //   ⚠️ 必须同时要求后面紧跟**中文**：否则 `12:30出发`（时间）/ `3~78位` / `1-a-b标题`
        //   （含字母段）都会被误剥 —— 这三条是既有断言的护栏，放宽口径会当场转红。
        const cjkHead = /^[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(rest);
        if (!space && !hadTail && !hadBracket && !(pure && cjkHead)) return;
        // 守卫 C：编号后面紧跟单位 → 尺寸（`1-1.4米特技风筝` / `2.4m` / `1.4 米`）
        if (RE_UNIT_HEAD.test(rest.replace(RE_WS_HEAD, ''))) return;
        if (!best || p > best.end) best = { end: p };
    };
    // 从 pos 起继续吃「分隔符 + 段」。
    const walk = (pos, depth, fc, pure) => {
        if (depth >= 1) finish(pos, fc, pure);
        if (depth >= NUMBER_MAX_DEPTH) return;          // 守卫 D
        if (!NUMBER_SEPS.includes(s[pos])) return;
        const p = pos + 1;
        const sep = s[pos];
        for (let len = Math.min(MAX_SEG_LEN, s.length - p); len >= 1; len--) {
            const seg = s.slice(p, p + len);
            if (NUMBER_SEGMENTS.has(seg)) {
                const nextPure = (depth === 1 || pure) && (sep === '.' || sep === '-') && /^\d+$/.test(seg);
                walk(p + len, depth + 1, fc, nextPure);
            }
        }
    };
    // 逐个尝试「开括符 / 无括符」，再尝试首段的各种长度（贪心从长到短，回溯兜底）
    for (const pair of [['', '']].concat(NUMBER_BRACKETS)) {
        const fo = pair[0], fc = pair[1];
        if (fo && s[0] !== fo) continue;
        const start = fo ? 1 : 0;
        for (let len = Math.min(MAX_SEG_LEN, s.length - start); len >= 1; len--) {
            if (NUMBER_SEGMENTS.has(s.slice(start, start + len))) walk(start + len, 1, fc, false);
        }
    }
    if (!best) return null;
    const core = s.slice(0, best.end);
    // 守卫 F（2026-09-28 加）：编号核是「纯数字 + `.`」、且剩下部分是**纯小写拉丁 token** →
    //   更像文件名 / 扩展名（`4.jsp` / `5.js` = 「第 4 项 jsp / 第 5 项 js」），
    //   不是「阿拉伯编号 + `.` 尾缀」→ 放弃（宁可不删）。
    //   限定「纯小写拉丁 token」是为了不误伤 `3.springboot配置` 这类（含中文 → 照旧能剥）。
    if (/^\d+\.$/.test(core) && /^[a-z][a-z0-9]*$/.test(s.slice(best.end))) return null;
    // 守卫 B2：**编号核以「单个字母 + 连字符」开头** → 连字符词（`T-恤` / `a-b`）。
    //   ⚠️ 必须**锚定在编号核开头**（`^`），不能在核里到处扫 —— 2026-09-28 真机踩到：
    //   用户文档的三级编号 `肆.V-a 判断是否跳过编号`（一级汉字 / 二级罗马 / 三级小写、间隔符 `-`）
    //   核里含 `.V-a`，旧写法 `(?:^|[^A-Za-z])[A-Za-z]…` 把 `.` 也当「非字母」而误判 → 重置不掉。
    //   锚定开头后：`.V-a` 前面有编号前缀 → 判为编号；`a-b` 整个核以字母开头 → 仍是连字符词。
    //   作用域 = **编号核 + 紧邻的下一个字符**，不是整行 —— 否则 `(4)结果：A-A∩B` 这种
    //   「正文里有 `A-A`」的标题会被整行否掉（实测踩过）。
    //   代价：**「核以单个字母开头 + 连字符」这一族全部放弃** —— `a-b` / `T-恤`（连字符词）
    //   与 `C-标题`（字母编号 + `-` 尾缀）/ `I-V` / `V-a`（字母编号 + `-` 间隔符）同形，
    //   纯形态上不可分，按「宁可不删」一并放弃。
    if (/^[A-Za-z][-\u2013\u2014](?![ \t\u00A0\u3000]|$)/.test(core + (s[best.end] || ''))) return null;
    const content = s.slice(best.end).replace(RE_WS_HEAD, '');
    if (content === '') return null;
    // 守卫 E（2026-09-28 移植时补）：**内容以代码 / 列表符号开头** → 更像代码行而不是标题。
    //   拦 `a > b 的比较` / `1 -> 2 转换` / `i > 0 循环` 这类。旧实现靠 R6 达到同一目的
    //   （它的分段器会把 `>` 吃进编号核再整条否决）；新实现不贪婪吃符号，所以在**内容侧**补这一道。
    //   代价：`1 - 说明` 这种「编号 + 破折号开头的内容」也会被放弃（按「宁可不删」接受）。
    if (/^[-|+*`<>{}\[\]]/.test(content)) return null;
    return { core: core, content: content };
}

// 剥掉标题开头的旧编号；认不出就返回 null（调用方保持原文不动）。
// ⚠️ `total` 是旧接口的**遗留参数**（旧实现用它做「数字 ≥100 且 > 本篇标题总数」的守卫）。
//    新实现按「序号 ≤ 99」一刀切，不再需要它 —— 保留参数只为不动那四处调用点，别再往里加逻辑。
function stripOldNumber(text) {
    const hit = decideNumber(text);
    return hit === null ? null : hit.content;
}
/* ─────────────────────── 规则解析与文本组装 ─────────────────────── */

// 归一化：去首尾空白 + Unicode NFC。标题与链接子路径两边都用它，比对才一致。
function normHeading(text) {
    return text == null ? '' : String(text).trim().normalize('NFC');
}

// 陈旧闸门专用归一化：`normHeading` + **折叠内部连续空白**。
// 为什么必须折叠：Obsidian 建 metadataCache 时会把标题内部的连续空白折成单个空格
//（2026-10-08 真机实测：磁盘上 `### 23、Commander  命令`（字符码 32,32）在缓存里存成
// `23、Commander 命令`（32）），而编辑器 `getLine()` 拿到的是原文。两边只差空白**不是**
//「缓存落后」—— 不折叠就会把整篇笔记永久判成 stale（用户实测报的 bug：整轮放弃 + 弹提示）。
// ⚠️ 只用于**比对**：写入一律以 `fresh.text`（编辑器原文）为基准，否则会把用户的连续空白压掉。
// ⚠️ 不能并进 `normHeading`：那个还服务 canvas renameSubpath（见它上方注释）。
function normForGate(text) {
    return text == null ? '' : String(text).replace(/\s+/g, ' ').trim().normalize('NFC');
}

/* ───── 链接子路径归一化：**逐字复刻官方**（2026-09-26 对齐） ─────
 * 出处：官方 `obsidian.asar` 里 `hI.prototype.getChanges`（「重命名标题」模态框）：
 *     var AT=/[!"#$%&()*+,.:;<=>?@^`{|}~\/\[\]\\\r\n]/g,
 *         PT=/([:#|^\\\r\n]|%%|\[\[|]])/g;
 *     function LT(e){return e.replace(AT," ").replace(/\s+/g," ").trim()}
 *     function IT(e){return e.replace(PT," ").replace(/\s+/g," ").trim()}
 *     ... r=LT(this.oldHeading).toLowerCase(), o=IT(e)
 *     ... c && LT(c.substring(1)).toLowerCase()===r && getFirstLinkpathDest(...)===file
 * 即官方比对「旧标题 ↔ 链接子路径」时两边都过 **LT** 再 toLowerCase 精确相等；
 * 写回时用 **IT**(新标题)。
 *
 * ⚠️ 与 `normHeading` 分开、**不能合并**：`normHeading` 是「陈旧保护」共用的
 *    （编辑器行 vs 缓存标题），它一旦也把标点抹成空格，`## 1.2 甲` 与 `## 1-2 甲`
 *    会被当同一行，插件就会按缓存拼写去改写用户标题。这一条只用于**链接比对**。
 * ⚠️ 实测（2026-09-26，两仓库 589 文件 / 4485 标题 / 2141 条引用 / 75 条带子路径）
 *    本规则与旧的 `normHeading+toLowerCase` **行为完全等价**（各匹配 47 条，
 *    单向差异 0/0）—— 这是**与官方对齐**，不是修 bug，不产生新的匹配能力。 */
const LINK_NORM_AT = /[!"#$%&()*+,.:;<=>?@^`{|}~\/\[\]\\\r\n]/g;
const LINK_NORM_PT = /([:#|^\\\r\n]|%%|\[\[|]])/g;

function linkNormAt(text) {
    return String(text == null ? '' : text).replace(LINK_NORM_AT, ' ').replace(/\s+/g, ' ').trim();
}

function linkNormPt(text) {
    return String(text == null ? '' : text).replace(LINK_NORM_PT, ' ').replace(/\s+/g, ' ').trim();
}

// 官方 LT：比对「旧标题 / 链接子路径」用。大小写不敏感由调用处补 toLowerCase。
function linkKeyOld(text) {
    return linkNormAt(text).toLowerCase();
}

// 排除文件夹的统一写法：反斜杠转正斜杠、去首尾空白与首尾 `/`、去掉结尾的 `/`。
// 一律以 `/` 结尾存着，判定时直接 startsWith —— 这样 `notes` 不会误伤 `notes2`。
function normalizeFolder(text) {
    const clean = String(text == null ? '' : text)
        .trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    return clean === '' ? '' : clean + '/';
}

// 读内置「模板」插件的模板文件夹。拿不到一律返回 ''（**不抛错、不重试**）——
// app.internalPlugins 是私有接口，跨版本随时可能改形状，这里只当「有就用」的锦上添花。
function templateFolderPreset(app) {
    try {
        const internal = app && app.internalPlugins;
        if (!internal || typeof internal.getPluginById !== 'function') return '';
        const core = internal.getPluginById('templates');
        const options = core && core.instance && core.instance.options;
        const folder = options && options.folder;
        return typeof folder === 'string' ? folder.trim() : '';
    } catch (err) {
        return '';
    }
}

// 把某一级的设置折算成拼装用的四个片段。tail 就是「编号与标题之间那段」：
// 2026-10-11 起只由该级自己那两项决定 —— 字符（「无」则不加）+ 要不要跟一个空格。
function parseRule(settings, level) {
    const own = settings.levels[level];
    const char = own.suffix.char !== 'none' ? own.suffix.char : '';
    const space = own.suffix.space;
    const pair = own.brackets === 'none' ? '' : own.brackets;
    return {
        front: pair.slice(0, 1),
        back: pair.slice(1),
        tail: char + (space ? ' ' : ''),
        separator: level === 1 || own.separator === 'none' ? '' : own.separator,
    };
}

// 按**样式索引**（1~6 = 第几套样式）逐段拼出编号链，返回 1~6 各自的**裸编号**
//（不含括符与尾缀 —— 那两个由 assembleTitle 在本级拼上）。
//   · 第 k 段用**样式 k** 的序列 / 间隔符 / 尾缀（`numbering` 决定要不要接上一段）
//   · `counters[k]` = 第 k 段自己的计数器（下标 0 不用）
// ⚠️ 这是**唯一**一处「按样式拼编号」的实现：样式预览与真编号都必须走它，
//    否则「预览里看到什么」与「实际编出什么」会分叉（预览正是用户判断规则的唯一依据）。
function buildNumberChain(settings, counters) {
    const numbers = ['', '', '', '', '', '', ''];
    for (let k = 1; k <= 6; k++) {
        const rule = parseRule(settings, k);
        // 「重新编号」不接上一段的前缀，本段从 1 开始（默认是「阶梯式编号」）
        const restart = settings.levels[k].numbering === 'restart';
        numbers[k] = joinNumber(numbers[k - 1], restart, rule.separator)
            + renderIndex(settings.levels[k].sequence, counters[k]);
    }
    return numbers;
}

// 预览：把固定的六行样例按当前规则跑一遍（不去旧编号、不校验 —— 样例是定死的）。
function previewLines(settings) {
    const numbers = buildNumberChain(settings, [0, 1, 1, 1, 1, 1, 1]);   // 预览：每一段都取序列首值
    const S = STRINGS[settings.language] || STRINGS['zh-CN'];
    const lines = [];
    // 「继承」模式：样例整体演示**父级缺失**的样子（用户 2026-10-09 指定）——
    //   一级缺失 → 二级改用样式 1、三级用样式 2 …… 依次递进。
    // ⚠️ 与真编号**同源**：第 level 级用「样式 (level-1)」的 rule 与 buildNumberChain 的同一段，
    //    所以预览里看到的编号，就是真编号在缺父号时补出来的那个值。
    if (settings.missingLevelMode === 'inherit') {
        for (let level = 2; level <= 6; level++) {
            const style = level - 1;
            const rule = parseRule(settings, style);
            const title = SAMPLE_TITLES[level - 1];
            const body = settings.levels[style].skip
                ? title
                : assembleTitle(rule, numbers[style], title);   // 与真编号共用同一处拼装
            lines.push('#'.repeat(level) + ' ' + body);
        }
        return lines;
    }
    for (let level = 1; level <= 6; level++) {
        const rule = parseRule(settings, level);
        const title = SAMPLE_TITLES[level - 1];
        const body = settings.levels[level].skip
            ? title
            : assembleTitle(rule, numbers[level], title);   // 与真编号共用同一处拼装
        lines.push('#'.repeat(level) + ' ' + body);
    }
    return lines;
}

/* ───────────────── 逐字符最小差异（确认窗口的高亮） ───────────────── */

// 最长公共前缀 + 最长公共后缀（两段互不重叠），中间那段就是「变了的部分」。
// ⚠️ 用户 2026-10-01 明确定的是**只标真正不同的字符** —— 所以这里**没有**任何
//    「把数字后面的分隔符也并进变化窗」的扩展逻辑：`1、一级标题` → `一、一级标题`
//    只标 `1` / `一`，中间的 `、` 两边都不上色。
// 返回 { left, right, changed }，每侧是最多三段（不变 / 变 / 不变），空段不出现。
function diffSegments(oldText, newText) {
    const a = String(oldText == null ? '' : oldText);
    const b = String(newText == null ? '' : newText);
    let head = 0;
    const maxHead = Math.min(a.length, b.length);
    while (head < maxHead && a.charAt(head) === b.charAt(head)) head++;
    let tail = 0;
    const maxTail = Math.min(a.length - head, b.length - head);
    while (tail < maxTail && a.charAt(a.length - 1 - tail) === b.charAt(b.length - 1 - tail)) tail++;
    const side = (text) => {
        const out = [];
        const mid = text.slice(head, text.length - tail);
        if (head > 0) out.push({ text: text.slice(0, head), changed: false });
        if (mid !== '') out.push({ text: mid, changed: true });
        if (tail > 0) out.push({ text: text.slice(text.length - tail), changed: false });
        return out;
    };
    return { left: side(a), right: side(b), changed: a !== b };
}

// 把「这一篇的**所有**标题」变成确认窗里的预览行 {line, level, old, next}。
// 计划里没有这条标题时（重置时本来就干净的、带 %%skip%% 被整条跳过的）＝ 原样不动，
// 左右两列显示同样的文字 —— 用户要的是「包括当前笔记的所有标题」，不是只列会变的那些。
// 任一标题的新鲜读取失败（缓存落后于编辑器）→ 返回 null，沿用与 planNumbering/planReset 同一条陈旧闸门。
function previewRows(headings, getLine, plan) {
    const nextByLine = new Map();
    for (const item of plan || []) nextByLine.set(item.line, item.next);
    // 每行还要知道「这一行是不是被跳过的」：确认窗据此显示 `Skip` 标签、顶部汇总据此排除（票 10）。
    // 判据与真编号**同源** —— 直接问 markSkippedHeadings，别再写一份。
    const skipped = markSkippedHeadings(headings, getLine);
    if (skipped === null) return null;
    const rows = [];
    for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const fresh = readFreshHeading(heading, getLine);
        if (!fresh) return null;
        rows.push({
            line: fresh.line,
            level: heading.level,
            skipped: skipped[i],
            old: fresh.text,
            next: nextByLine.has(fresh.line) ? nextByLine.get(fresh.line) : fresh.text,
        });
    }
    return rows;
}

function escapeRe(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 每一级编译一条「剥离已有编号」的正则。编号部分接受所有已启用序列的字符，
// 层级间隔符也接受所有已配置的候选 —— 因为剥离时既不知道父级链的深度，
// 也不知道那一级当初用的是哪种序列（`3.2-1:3`、`II.1` 这种混用必须能整体吃掉）。
function buildStrippers(settings) {
    const separators = new Set();
    const sequences = new Set();
    for (let level = 1; level <= 6; level++) {
        sequences.add(settings.levels[level].sequence);
        if (level > 1) {
            const sep = settings.levels[level].separator;
            if (sep && sep !== 'none') separators.add(sep);
        }
    }
    const alt = [...separators].sort((a, b) => b.length - a.length).map(escapeRe).join('|');
    const alphabet = SEQUENCES.filter((item) => sequences.has(item.id))
        .map((item) => item.alphabet).join('') || '0-9';
    const charset = '[' + alphabet + ']';
    // 备选必须整组括起来，首段的 `+` 也不能漏（两条都是实测踩过的坑）
    const number = alt ? charset + '+(?:(?:' + alt + ')' + charset + '+)*' : charset + '+';

    const strippers = [null];
    for (let level = 1; level <= 6; level++) {
        const rule = parseRule(settings, level);
        strippers[level] = new RegExp(
            '^' + escapeRe(rule.front) + number + escapeRe(rule.back) + escapeRe(rule.tail)
        );
    }
    return strippers;
}

function stripNumbering(text, strippers, level) {
    const match = strippers[level].exec(text);
    return match ? text.slice(match[0].length) : text;
}

// 「本级编号要不要接在父级后面」只有这一处实现。
// ⚠️ 以前 planNumbering（真编号）与 previewLines（设置面板的样式预览）各写一份 —— 加「重新编号」
//    那次必须改两遍，漏一处「样式预览」就会骗用户（预览正是给他确认规则用的）。
function joinNumber(parent, restart, separator) {
    return parent && !restart ? parent + separator : '';
}

function assembleTitle(rule, number, title) {
    return rule.front + number + rule.back + rule.tail + title;
}

const HEADING_LINE_RE = /^(#{1,6}) (.*)$/;

function readHeadingLine(line) {
    const match = HEADING_LINE_RE.exec(line);
    return match ? { level: match[1].length, text: match[2] } : null;
}

// 读一行并确认它就是缓存里那个标题。不一致说明 metadataCache 落后于编辑器
// （用户正在输入），此时照缓存的行号去写编辑器会写错行，调用方必须整体放弃本轮。
function readFreshHeading(heading, getLine) {
    const line = heading.position.start.line;
    const text = getLine(line);
    const read = text === null ? null : readHeadingLine(text);
    if (!read || read.level !== heading.level || normForGate(read.text) !== normForGate(heading.heading)) {
        return null;
    }
    return { line, text: read.text };
}

// 标题签名：等级 + 顺序（由数组顺序体现）+ 内容 + **下一行有没有 %%skip%%**。
// 标记在标题的下一行、不属于标题文字，早期版本漏了它，于是「加上标记再删掉」签名不变，
// 门禁直接 return，标题再也编不上号（用户实测报的 bug）。凡是 planNumbering 会读的东西都必须进签名。
function headingSignature(headings, getLine, frontValue) {
    // ⚠️ 票 01（2026-10-11）：frontmatter 的 `heading-guard` 值也影响编号结果（它可能指定一套方案）
    //    ⇒ 必须进签名：否则「只改属性、标题一个字不动」时签名不变，门禁当成没事发生，不重新编号。
    let out = (frontValue === undefined || frontValue === null || frontValue === '')
        ? '' : '\u0004' + String(frontValue);
    for (const heading of headings) {
        const next = getLine ? getLine(heading.position.start.line + 1) : null;
        out += heading.level + '\u0001' + heading.heading
            + (next === null ? '' : next.includes(SKIP_TREE_MARKER) ? '\u0003skiptree'
                : next.includes(SKIP_MARKER) ? '\u0003skip' : '')
            + '\u0002';
    }
    return out;
}

/* ─────────────────────────── 编号规划 ─────────────────────────── */

// 返回每一行的编号方案；返回 null 表示缓存与编辑器不同步，本轮不应写任何东西。
/* ─────────── 有效级别集合 & 样式索引（用户 2026-10-09 定，见 .scratch/style-shift-mode/spec.md） ─────────── */

// 先扫一遍，标出哪些标题「被跳过」：下一行有 `%%skip%%`（只它自己）或 `%%skips%%`（连子树）。
// ⚠️ 判据必须与 planNumbering 主循环里那段**完全一致**（同一条 skipFrom 走法）——
//    这里只是为了**先知道全篇哪些级别真的存在**，主循环仍按原样走自己的。
// 返回 null = 陈旧闸门拦下（调用方直接放弃本轮）。
function markSkippedHeadings(headings, getLine) {
    const skipped = [];
    let skipFrom = 0;
    for (const heading of headings) {
        const level = heading.level;
        const fresh = readFreshHeading(heading, getLine);
        if (!fresh) return null;
        const following = getLine(fresh.line + 1);
        const marked = following !== null && following.includes(SKIP_MARKER);
        const tree = following !== null && following.includes(SKIP_TREE_MARKER);
        if (skipFrom && level <= skipFrom) skipFrom = 0;
        if (tree && !skipFrom) skipFrom = level;
        skipped.push(!!(marked || tree || skipFrom));
    }
    return skipped;
}

// 「有效级别集合」= 出现过、且**至少有一个标题没被跳过**的级别（升序）。
// ⚠️ 「本级不编号」开关**不算缺失** —— 它仍占号、仍作父级（需求文档 §3.2.1 保留；用户 2026-10-09
//    收回了「本级不编号就当它不存在」的说法）。所以开关打开的级别**仍在**集合里。
function effectiveLevels(headings, settings, getLine) {
    const skipped = markSkippedHeadings(headings, getLine);
    if (skipped === null) return null;
    const set = new Set();
    headings.forEach((heading, i) => { if (!skipped[i]) set.add(heading.level); });
    return [...set].sort((a, b) => a - b);
}

// 标题级别 → **样式索引**（用第几套样式）：
//   严格（默认）= 级别本身（段数恒等于级别）；继承 = 该级在有效集合里排第几（从 1 起）。
function styleIndexOf(settings, effective, level) {
    if (settings.missingLevelMode !== 'inherit') return level;
    const i = effective.indexOf(level);
    return i < 0 ? level : i + 1;   // 走不到（本级标题没被跳过 → 本级必在集合里），留着当兜底
}

// 样式索引 → 该样式位对应哪个级别（计数器是按级别存的，所以要反查）。
function levelOfStyle(settings, effective, k) {
    return settings.missingLevelMode !== 'inherit' ? k : effective[k - 1];
}

function planNumbering(headings, settings, getLine) {
    const rules = [null];
    for (let level = 1; level <= 6; level++) rules[level] = parseRule(settings, level);
    const strippers = buildStrippers(settings);

    // 有效级别集合（先扫全篇）。「继承」模式下，缺失的层级会让更深的级别**上移一套样式**；
    // 「严格」模式下它不影响样式索引（恒等于级别），但仍用于「缺失层补全」的一致性。
    const effective = effectiveLevels(headings, settings, getLine);
    if (effective === null) return null;

    const counters = [0, 0, 0, 0, 0, 0, 0];
    const plan = [];

    // 子树的跳过由 `%%skips%%` 自己决定（票 09 起不再有设置开关）
    let skipFrom = 0;   // >0 = 正处在一棵 %%skips%% 的子树里，值是那棵子树的根等级

    for (const heading of headings) {
        const level = heading.level;
        const fresh = readFreshHeading(heading, getLine);
        if (!fresh) return null;

        const following = getLine(fresh.line + 1);
        const marked = following !== null && following.includes(SKIP_MARKER);
        const tree = following !== null && following.includes(SKIP_TREE_MARKER);

        // 走出子树的判据：出现等级 <= 子树根的标题（兄弟或更上层）
        if (skipFrom && level <= skipFrom) skipFrom = 0;
        // `%%skips%%` 的那一行也把它的子树标成跳过（已经在子树里就不重复标）
        if (tree && !skipFrom) skipFrom = level;

        if (marked || tree || skipFrom) {
            // 「要不要顺手删掉旧编号」跟随「编号前尝试去除旧编号」（票 09，用户选方案 A）：
            //   开 = 把这一档覆盖到的所有行（带标记的那行 + `%%skips%%` 的子树）的旧编号删掉；
            //   关 = 一个字都不动（`%%skip%%` 当「别碰这一行」的逃生口时就是这个状态）。
            if (settings.stripOldNumbers) {
                const cleaned = stripOldNumber(fresh.text);
                const next = cleaned === null ? fresh.text : cleaned;
                if (next !== fresh.text) {
                    plan.push({ level, line: fresh.line, old: fresh.text, next, changed: true });
                }
            }
            continue; // 当它不存在（不占号、不作父级）
        }

        counters[level]++;
        for (let k = level + 1; k <= 6; k++) counters[k] = 0;

        // 本级用**样式索引**对应的那一套样式（strict = 级别本身；inherit = 有效集合里的序号）。
        const style = styleIndexOf(settings, effective, level);
        const rule = rules[style];
        // 按**样式位**取计数器：第 k 段用「样式 k」的序列，计数器取该样式位对应级别的计数器；
        // 该级缺失（或还没出现过）时取 1 —— 也就是**「样式预览」里那一级的编号部分**。
        // ⚠️ 不能传 0：renderIndex(seq, 0) 会产出 `0`（阿拉伯）甚至 `` ` ``（小写字母），把编号拼坏。
        const byStyle = [0, 0, 0, 0, 0, 0, 0];
        for (let k = 1; k <= 6; k++) {
            const lv = levelOfStyle(settings, effective, k);
            byStyle[k] = lv && counters[lv] > 0 ? counters[lv] : 1;
        }
        const number = buildNumberChain(settings, byStyle)[style] || '';

        // ⚠️ 「本级不编号」开关与括符/尾缀一样，是**样式**的属性，不是标题级别的属性 ——
        //    样式平移时它一起平移。用户给的黄金示例 1 正是这样：六级平移去用样式 5，
        //    而「不写编号」挂在样式 6 上，所以六级在这一档里**照样写出 `a.`**。
        if (settings.levels[style].skip) {
            // 本级不编号时，这一级还可能要「尝试删除旧编号」（用户 2026-09-24 新增）：
            // 只把编号部分删掉、重命名，不写任何新编号。用的还是同一个 stripOldNumber。
            // 同样跟随「编号前尝试去除旧编号」（票 09）
            if (settings.stripOldNumbers) {
                const cleaned = stripOldNumber(fresh.text);
                const next = cleaned === null ? fresh.text : cleaned;
                if (next !== fresh.text) {
                    plan.push({ level, line: fresh.line, old: fresh.text, next, changed: true });
                }
            }
            continue; // 号已经占上了
        }

        // 剥离用**样式位**的正则：当前模式下本插件写出去的就是那一套格式（括符 / 尾缀都由样式定）。
        let title = stripNumbering(fresh.text, strippers, style);
        // 「编号前尝试去除旧编号」：剥掉当前编号后，标题文字里可能还压着更早的旧编号残留
        // （`II 1、 设置界面` 剥掉 `II ` 之后只剩 `1、 设置界面`）。
        // 这一步必须**无条件**做 —— 挂在「拼装结果与原文字不同」上会漏掉这种情况：
        // 残留恰好让拼装结果等于原文，于是永远卡在那儿。
        if (settings.stripOldNumbers) {
            const cleaned = stripOldNumber(title);
            if (cleaned !== null) title = cleaned;
        }
        const next = assembleTitle(rule, number, title);
        plan.push({ level, line: fresh.line, old: fresh.text, next, changed: next !== fresh.text });
    }
    return plan;
}

// 重置用的方案：只保留真的能去掉编号的那些行。
function planReset(headings, settings, getLine) {
    const plan = [];
    // 跳过的行**不参与「重置」**；但「要不要顺手删掉旧编号」跟随 `stripOldNumbers`
    // —— 与编号命令的跳过分支**同一条规则**（`docs/SETTINGS.md` 里早就写明：
    //   「被跳过的行要不要顺手清掉旧编号，跟随『编号前尝试去除旧编号』那个开关」）。
    // ⚠️ 票 11 曾把这里改成「跳过的行一律 continue」——**方向反了** ✗：
    //    结果「重置」放过它们、「编号」却删它们，两个命令行为不一致（用户 2026-10-10 截图报的）。
    const skipped = markSkippedHeadings(headings, getLine);
    if (skipped === null) return null;
    for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const fresh = readFreshHeading(heading, getLine);
        if (!fresh) return null;
        // 开关**关**着 → 跳过的行一个字符都不动；开关**开**着 → 落到下面照常剥号
        if (skipped[i] && !settings.stripOldNumbers) continue;

        const next = stripOldNumber(fresh.text);
        if (next === null || next === fresh.text) continue;
        plan.push({ level: heading.level, line: fresh.line, old: fresh.text, next });
    }
    return plan;
}

/* ───────────────────────── 标题链接改写 ───────────────────────── */

// 与 Obsidian 内部 eE 等价：只转义空格、反斜杠与控制字符，其余原样保留。
function escapeUrl(text) {
    return text.replace(/[\\\x00\x08\x0B\x0C\x0E-\x1F ]/g, (c) => encodeURIComponent(c));
}

const WIKI_LINK_RE = /^(!?\[\[)([\s\S]*?)(\|([\s\S]*))?(\]\])$/;
const MD_LINK_RE = /^(!?\[)([^\]]*)(\]\()([^)]*)(\))$/;

// 把 `original` 这条链接原文里的子路径换成 newSubpath；认不出来的形态返回 null（宁可不动）。
function buildChange(original, target, newSubpath) {
    const bar = target.indexOf('#');
    const newTarget = bar < 0 ? target : target.slice(0, bar + 1) + newSubpath;

    const wiki = WIKI_LINK_RE.exec(original);
    if (wiki) {
        const display = wiki[4];
        if (display === undefined) return wiki[1] + newTarget + wiki[5];
        // 原文用 \| 作分隔符时要原样保留，否则会把转义改坏
        return wiki[1] + newTarget + (original.includes('\\|') ? '\\|' : '|') + display + wiki[5];
    }

    const md = MD_LINK_RE.exec(original);
    if (md) {
        const url = md[4];
        const wrapped = url.startsWith('<') && url.endsWith('>');
        const bare = wrapped ? url.slice(1, -1) : url;
        const bareBar = bare.indexOf('#');
        const newBare = bareBar < 0 ? bare : bare.slice(0, bareBar + 1) + newSubpath;
        return md[1] + md[2] + md[3] + (wrapped ? '<' + newBare + '>' : escapeUrl(newBare)) + md[5];
    }
    return null;
}

// updateInternalLinks 内部按 keys()[i] / keys().length 遍历，要求 keys() 返回数组。
// 直接传原生 Map 会「一个都不处理且不报错」（实测踩过），这里包一层最小适配。
function keyArray(map) {
    return { keys: () => [...map.keys()], get: (path) => map.get(path) };
}

/* ───────────────────────────── 插件 ───────────────────────────── */

class HeadingGuard extends Plugin {
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new HeadingGuardSettingTab(this.app, this));

        // 两个命令的启用条件与触发方式完全一样，收成一个工厂。
        const onEditableMarkdown = (run) => (checking, editor, ctx) => {
            if (!ctx.file || ctx.file.extension !== 'md') return false;
            if (!checking) run(ctx.file, editor);
            return true;
        };
        this.addCommand({
            id: 'number-now',
            name: this.t('cmdNow'),
            editorCheckCallback: onEditableMarkdown((file, editor) => this.runOnce(file, editor, true)),
        });
        this.addCommand({
            id: 'reset-numbers',
            name: this.t('cmdReset'),
            editorCheckCallback: onEditableMarkdown((file, editor) => this.runReset(file, editor, true)),
        });

        // 「同步不可用」这条提示在自动编号下只弹一次，恢复后再出问题才重新弹
        this.syncBlockedNotified = false;

        // ── 三层触发，按「只有上层覆盖不到时才需要下层」来排 ──
        // ① 切到某篇笔记 / 光标落进编辑器 → 等 2 秒跑一次
        // 换活动叶子 = 换了次停留 → 「已提示过」作废（票 04）。定时复查**不会**触发这个事件，
        // 所以「同一段停留里只提示一次」依然成立。
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            this._markVisit(null);
            this.scheduleNoteEnter();
        }));
        // ② 文档内容 / 标题元数据一变 → 防抖后跑一次。两个事件共用一个计时器，不会跑两遍。
        //    editor-change 是必须的：`%%skip%%` 只改标题「下一行」的文字，缓存的元数据一模一样，
        //    metadataCache 的 'changed' 根本不触发 —— 只听它就漏掉「加/删标记」这类编辑（实测踩过）。
        this.registerEvent(this.app.workspace.on('editor-change', () => this.scheduleEdit()));
        this.registerEvent(this.app.metadataCache.on('changed', (file) => this.scheduleEdit(file)));
        // ③ 轮询兜底：事件漏掉时（外部改动、缓存异常）也能收敛
        this.register(() => {
            if (this.timerId) window.clearInterval(this.timerId);
            if (this.enterTimer) window.clearTimeout(this.enterTimer);
            if (this.editTimer) window.clearTimeout(this.editTimer);
        });
        this.startTimer();
    }

    t(key, arg) {
        return lookup(this.settings.language, key, arg);
    }

    async loadSettings() {
        const raw = (await this.loadData()) || {};
        // 老设置里没有 excludeFolders 这个键 = 首次启用「排除文件夹」功能（升级上来的也算）。
        // 面板首次打开时据此预填一次模板文件夹，之后永不再动（用户删掉的就是删掉了）。
        this.excludePrefillPending = !Array.isArray(raw.excludeFolders);
        // 「某一级设置」的净化只有一份实现（模块级 sanitizeLevel），读设置与读样式预设共用同一口径。
        const levels = {};
        for (let level = 1; level <= 6; level++) {
            levels[level] = sanitizeLevel(level, (raw.levels && raw.levels[level]) || {});
        }
        this.settings = {
            // 设置里没有 language（首装，或从没有这个字段的旧版升上来）→ 按 Obsidian 的界面语言定一次初值。
            // 用户自己选过就永远听他的，不再被覆盖。这里**不落盘**：没动过设置就一直跟着 Obsidian 走。
            language: STRINGS[raw.language] ? raw.language : (detectObsidianLanguage() || DEFAULT_SETTINGS.language),
            autoNumber: !!raw.autoNumber,
            scanInterval: Math.min(MAX_SCAN_INTERVAL, Math.max(MIN_SCAN_INTERVAL,
                Number.isFinite(raw.scanInterval) ? Math.round(raw.scanInterval) : DEFAULT_SCAN_INTERVAL)),
            // 未存过这个字段（首次安装 / 老版本升级）→ 回落到默认值；存过就以存盘值为准。
            // ⚠️ 不能写成 `!!raw.stripOldNumbers`：undefined 会直接变成 false，把默认值吃掉。
            stripOldNumbers: typeof raw.stripOldNumbers === 'boolean'
                ? raw.stripOldNumbers : DEFAULT_SETTINGS.stripOldNumbers,
            // 存盘内容不可信：认不出的值一律回落 strict
            missingLevelMode: pick(MISSING_LEVEL_CHOICES, raw.missingLevelMode, 'strict'),
            scope: pick(SCOPE_CHOICES, raw.scope, 'all'),
            // 只收字符串、去掉空行 —— 存盘内容不可信（用户手改过 / 旧版本残留），必须净一次
            excludeFolders: Array.isArray(raw.excludeFolders)
                ? raw.excludeFolders
                    .filter((item) => typeof item === 'string')
                    .map((item) => normalizeFolder(item))
                    .filter((item) => item !== '')
                : [],
            levels,
            stylePresets: sanitizeStylePresets(raw.stylePresets),
        };
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // 这篇笔记该不该被自动编号。判定顺序（用户 2026-09-25 定的优先级，别改顺序）：
    //   ① frontmatter 显式 false / 'off' → 不编号（最高优先级，压过一切）
    //   ② frontmatter 显式 true / 'on'   → 编号（无视排除文件夹）
    //   ③ 落在排除文件夹里                → 不编号
    //   ④ 其余按 scope：all 编号、optIn 不编号
    // 只影响自动编号；两个手动命令不调用它。
    isAutoNumberEnabled(file) {
        if (!file) return false;
        const parts = this._frontParts(file);
        if (parts.flag === 'off') return false;
        // 票 17：`on|` 还在编辑中 → 不自动编号（别急着按全局样式编 ✗）
        if (parts.incomplete) return false;
        // 票 18（用户 2026-10-11 明确）：**只有 `on`（含 `on|方案名`）才算「开启自动编号」**。
        //   ⚠️ 光写方案名（`heading-guard: 方案A`）**只是指定样式**，不代表开启 —— 之前按「也启用」
        //   实现是我从票 04 那句话里推错的 ✗（用户实测：optIn 范围下 `heading-guard: test` 被编号了）。
        //   样式本身仍然生效：手动命令照它走；自动那条得先有 `on` 才会跑。
        if (parts.flag === 'on') return true;
        const path = file.path.replace(/\\/g, '/');
        for (const folder of this.settings.excludeFolders) {
            if (path.startsWith(folder)) return false;
        }
        return this.settings.scope === 'all';
    }

    // 读 frontmatter 里的 heading-guard 值，归一成 true / false / 'on' / 'off' / 方案名 / undefined。
    // 用 getFileCache 的 frontmatter（编辑器里刚改的那一下可能还没进缓存，那就当作没写 —— 保守）。
    _frontmatterValue(file) {
        const cache = this.app.metadataCache.getFileCache(file);
        const raw = cache && cache.frontmatter ? cache.frontmatter[SCOPE_KEY] : undefined;
        if (raw === true || raw === false) return raw;
        if (typeof raw === 'string') {
            const text = raw.trim();
            const lower = text.toLowerCase();
            if (lower === 'on' || lower === 'true' || lower === 'yes') return 'on';
            if (lower === 'off' || lower === 'false' || lower === 'no') return 'off';
            // 票 01（2026-10-11）：**其余字符串当作样式方案名原样返回**（以前一律吞成 undefined ✗）。
            // 名字对不对由 _noteSettings 判：对 → 用它那套样式；不对 → 报错 + 什么都不做。
            if (text !== '') return text;
        }
        return undefined;
    }

    // 票 04（2026-10-11）：把值按 `|` **拆段**再各自解读 —— 用户澄清「`|` 是分隔符」：
    //   `on|HYC` = 开关 on + 样式名 HYC（**不是**一个叫「on|HYC」的方案名 ✗）
    //   段内首尾空格忽略；**某一段是空的 = 还在编辑中**（整条按「编辑中」处理，见票 17）；`off` 段压过一切。
    //   多个非开关段时取**第一个**。返回 { flag: '' | 'on' | 'off', name }。
    _frontParts(file) {
        const raw = this._frontmatterValue(file);
        if (raw === true) return { flag: 'on', name: '', incomplete: false };
        if (raw === false) return { flag: 'off', name: '', incomplete: false };
        if (typeof raw !== 'string') return { flag: '', name: '', incomplete: false };
        // ⚠️ 2026-10-11（用户实测报的）：`on|` 这种**有分隔符、但某一段是空的**写法 = 还在编辑中 ——
        //   它既不是 `on`（不该按全局样式编号 ✗）、也不是方案名，更不该报错：**什么都不做** ✓。
        //   只有**单个词** `on` 才是「开启 + 用全局那套样式」。
        const rawParts = raw.split('|');
        if (rawParts.some((s) => s.trim() === '')) return { flag: '', name: '', incomplete: true };
        const parts = rawParts.map((s) => s.trim());
        let flag = '';
        let name = '';
        for (const part of parts) {
            const lower = part.toLowerCase();
            if (lower === 'off' || lower === 'false' || lower === 'no') return { flag: 'off', name: '', incomplete: false };
            if (lower === 'on' || lower === 'true' || lower === 'yes') { flag = 'on'; continue; }
            if (name === '') name = part;   // 第一个「不是开关」的段 = 样式方案名
        }
        return { flag: flag, name: name, incomplete: false };
    }

    // 票 04（2026-10-11）：标记「当前停在哪个笔记」。切叶子 = 换了一次停留 →
    //   「已提示过」作废（用户要求：切走再回来算首次；同一段停留内才只提示一次）。
    //   传 null 表示「离开了」—— active-leaf-change 事件里就这么调。
    _markVisit(file) {
        const path = file && file.path ? file.path : '';
        if (this._visitPath !== path) { this._visitPath = path; this._warnedName = ''; }
    }

    // 票 02（2026-10-11）：这篇笔记该用哪套设置。返回 { settings, missing }：
    //   · frontmatter 写了**已存的方案名** → settings = 套了那个方案的**副本**（绝不改全局）
    //   · 没写 / on / off → settings = 全局那份（原对象，不复制，避免无意义开销）
    //   · 名字对不上 → missing = 那个名字（调用方据此提示 + 什么都不做）
    _noteSettings(file) {
        const parts = this._frontParts(file);
        if (parts.incomplete) return { settings: this.settings, missing: '', incomplete: true };
        if (parts.name === '') return { settings: this.settings, missing: '', incomplete: false };
        const preset = this.findStylePreset(parts.name);
        if (!preset) return { settings: this.settings, missing: parts.name, incomplete: false };
        return { settings: this._settingsWithPreset(preset), missing: '', incomplete: false };
    }

    // 把一套方案套到**副本**上 —— 绝不就地改全局。
    // ⚠️ 副本必须够深：applyStylePresetToSettings 是**就地改写** levels[k] 与 levels[k].suffix 的
    //    （那是给设置面板的闭包用的，见它自己的注释），浅拷贝会把用户的全局设置改坏 ✗。
    _settingsWithPreset(preset) {
        const levels = {};
        for (let lv = 1; lv <= 6; lv++) {
            const own = this.settings.levels[lv];
            levels[lv] = Object.assign({}, own, { suffix: Object.assign({}, own.suffix) });
        }
        const copy = Object.assign({}, this.settings, {
            levels: levels,
        });
        applyStylePresetToSettings(copy, preset);
        return copy;
    }

    _headingsOf(file) {
        const cache = this.app.metadataCache.getFileCache(file);
        return cache && cache.headings ? cache.headings : [];
    }

    _lineReader(editor) {
        return (n) => (n >= 0 && n < editor.lineCount() ? editor.getLine(n) : null);
    }

    _activeMarkdown() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        return view && view.file ? view : null;
    }

    startTimer() {
        this.stopTimer();
        this.timerId = window.setInterval(() => this.checkActiveNote(false), this.settings.scanInterval * 1000);
    }

    stopTimer() {
        if (this.timerId) {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    // 切笔记 / 光标进来的 2 秒延迟
    scheduleNoteEnter() {
        if (!this.settings.autoNumber) return;
        if (this.enterTimer) window.clearTimeout(this.enterTimer);
        this.enterTimer = window.setTimeout(() => {
            this.enterTimer = null;
            this.checkActiveNote(true); // 刚换过笔记，上次的签名不算数
        }, NOTE_ENTER_DELAY_MS);
    }

    // 当前笔记的内容 / 元数据变了 → 防抖。file 省略时按「当前活动笔记」算。
    scheduleEdit(file) {
        if (!this.settings.autoNumber) return;
        const view = this._activeMarkdown();
        if (!view || (file && view.file !== file)) return;
        if (this.editTimer) window.clearTimeout(this.editTimer);
        this.editTimer = window.setTimeout(() => {
            this.editTimer = null;
            this.checkActiveNote(false);
        }, EDIT_DEBOUNCE_MS);
    }

    // 光标是不是正停在某个标题行上。用户在这里打字时，插件不该动手。
    // 探不到光标就当作「不在标题行」—— 宁可照旧编号，也不要因为取不到光标就整轮不干活。
    _cursorOnHeading(editor, file) {
        if (!editor) return false;
        const cursor = editor.getCursor();
        if (!cursor) return false;
        const line = editor.getLine(cursor.line);
        if (line === null || !readHeadingLine(line)) return false;
        return this._headingsOf(file).some((h) => h.position.start.line === cursor.line);
    }

    // force = 刚切到这篇笔记 → 不看签名，直接跑。
    // 否则先比标题签名（等级 + 顺序 + 内容），一模一样就什么都不做。
    checkActiveNote(force) {
        if (!this.settings.autoNumber) return;
        // 确认窗开着时不要自动编号：它会改标题行，让窗口里那几行的行号与「原文」全部失效。
        if (this.pendingConfirm) return;
        const view = this._activeMarkdown();
        if (!view) return;
        // 作用范围：不在范围内的笔记，自动编号一律不动（用户 2026-09-25）。
        // 放在最前面 —— 连签名都不必算。手动命令不走这里。
        if (!this.isAutoNumberEnabled(view.file)) return;
        // 光标停在标题行上 → 这一轮什么都别做，等光标离开。
        // 必须放在 lastSignature 记账**之前**：否则「光标在标题行」这一轮把签名记成「已处理」，
        // 光标离开后签名没变、直接 return，那个标题就永远编不上号。
        // force 不受影响（刚切进笔记时光标恰好停在标题行很常见，那时必须先编一次）。
        if (!force && this._cursorOnHeading(view.editor, view.file)) return;
        const signature = view.file.path + '\u0000'
            + headingSignature(this._headingsOf(view.file), this._lineReader(view.editor),
                this._frontmatterValue(view.file));
        // 上一轮因为缓存落后整轮放弃了 → 这一次不看签名，补跑一遍
        if (!force && signature === this.lastSignature && !this.retryPending) return;
        this.retryPending = false;
        this.lastSignature = signature;
        this.runOnce(view.file, view.editor, false);
    }

    // 一次事务提交所有行：用户按一次 Ctrl+Z 就能整体撤销。
    // 只替换 `#… ` 之后的部分，保留用户原本的井号前缀。
    //
    // ⚠️ `extra` 是「同一文件里指向这些标题的链接」的改动，**必须并进这同一个 transaction**
    //    （2026-09-26 用户实测报告修）：如果先写标题、再单独调 `updateInternalLinks`，
    //    那条路走的是 `vault.process`（读**磁盘**文本、用**缓存**里的 offset 改），
    //    而此刻编辑器 buffer 已经是新的、比磁盘新 —— 写完立刻被 buffer 的下一次落盘覆盖，
    //    **肉眼可见的静默失效**（返回值还说改了 1 条）。并进同一事务才跟标题一起落盘。
    _write(editor, items, extra) {
        const changes = items.map((item) => ({
            from: { line: item.line, ch: item.level + 1 },
            to: { line: item.line, ch: item.level + 1 + item.old.length },
            text: item.next,
        }));
        if (extra) {
            for (const e of extra) {
                changes.push({
                    from: { line: e.line, ch: e.ch },
                    to: { line: e.endLine, ch: e.endCh },
                    text: e.text,
                });
            }
        }
        editor.transaction({ changes });
    }

    // 找出**本文件里**指向这些标题的链接改动，返回可并入 `editor.transaction` 的最小描述。
    // 为什么只做本文件：别的文件的 buffer 是干净的，`updateInternalLinks` 在那条路上好使
    //（真机实测：跨文件链接同步成功、自链接失败）。切不可把其它文件也塞进这里的 transaction
    // —— 那需要同时打开并操作别的 leaf，越权且易错。
    // ⚠️ 调用时机：必须在 `_write` **之前**采集 —— 此时编辑器 offset 与缓存一致；
    //    标题一改，链接的 offset 就整体位移了。
    collectSelfLinkEdits(file, renames, sourcePath) {
        const edits = [];
        const byOld = new Map();
        for (const rename of renames) byOld.set(linkKeyOld(rename.from), rename.to);
        const mc = this.app.metadataCache;
        mc.iterateAllRefs((refSource, ref) => {
            if (refSource !== sourcePath) return;
            const bar = ref.link.indexOf('#');
            if (bar < 0) return;
            const sub = ref.link.slice(bar + 1);
            if (!sub || sub.charAt(0) === '^') return; // 块引用不动
            const next = byOld.get(linkKeyOld(sub));
            if (!next) return;
            if (mc.getFirstLinkpathDest(ref.link.slice(0, bar), refSource) !== file) return;
            const change = buildChange(ref.original, ref.link, next);
            if (change === null) return;
            const pos = ref.position;
            if (!pos || !pos.start || !pos.end) return; // 没有位置信息就没法并入事务，宁可不动
            edits.push({
                line: pos.start.line,
                ch: pos.start.col,
                endLine: pos.end.line,
                endCh: pos.end.col,
                text: change,
            });
        });
        return edits;
    }

    // manual = 由命令触发（需要给用户可见反馈）；自动触发时静默。
    async runOnce(file, editor, manual) {
        try {
            this._markVisit(file);   // 票 04：切进来 / 切回来都算新的一次停留
            const getLine = this._lineReader(editor);
            const headings = this._headingsOf(file);
            // 票 02（2026-10-11）：这篇笔记可能用 frontmatter 指定的样式方案。
            const note = this._noteSettings(file);
            // 票 17：`heading-guard: on|` 这类**还没写完**的写法 → 什么都不做。
            //   自动与手动**都静默返回**：这不是错误（用户就在半截输入状态），弹提示只会吵。
            if (note.incomplete) return;
            if (note.missing) {
                // 名字写错（或那个方案已被删）：**什么都不做** + 提示。
                //   手动：每次都弹（人就在键盘前，必须让他看见）；
                //   自动：同一段停留内只弹一次（同一个文件 + 同一个错名字），
                //         免得每轮编辑都刷一条 —— 切走再回来会重新弹（票 04，用户要求）。
                if (manual) { new Notice(this.t('noticeUnknownPreset', note.missing)); return; }
                if (this._warnedName !== note.missing) {
                    this._warnedName = note.missing;
                    new Notice(this.t('noticeUnknownPreset', note.missing));
                }
                return;
            }
            const plan = planNumbering(headings, note.settings, getLine);
            if (plan === null) {
                // 缓存落后 → 这一轮什么都不写，但必须记下「还欠一次」：
                // 签名已经记账了，不安排补跑的话，这一轮编辑就永远等不到处理
                this.retryPending = true;
                if (manual) new Notice(this.t('stale'));
                return;
            }
            this.retryPending = false;
            const todo = plan.filter((item) => item.changed);
            if (todo.length === 0) {
                if (manual) new Notice(this.t('upToDate'));
                return;
            }
            // 预检闸门：链接同步不可用就**一行业都不改**（用户 2026-09-24 定）
            if (!this.readyToRename(manual)) return;
            await this._confirmOrApply({ file, editor, manual, mode: 'number', items: todo, headings, getLine, plan });
        } catch (err) {
            // 唯一一道兜底：链接同步走的是 Obsidian 内部接口，跨版本可能抛错；
            // 定时器里放任异常会每次都刷一条错误。
            console.error('[heading-guard] 编号失败：', err);
        }
    }

    async runReset(file, editor, manual) {
        try {
            const getLine = this._lineReader(editor);
            const headings = this._headingsOf(file);
            const plan = planReset(headings, this.settings, getLine);
            if (plan === null) {
                if (manual) new Notice(this.t('stale'));
                return;
            }
            if (plan.length === 0) {
                if (manual) new Notice(this.t('noNumber'));
                return;
            }
            // 走的是同一条改标题的链路 → 同一个闸门（用户 2026-09-24 要求一并处理）
            if (!this.readyToRename(manual)) return;
            await this._confirmOrApply({ file, editor, manual, mode: 'reset', items: plan, headings, getLine, plan });
        } catch (err) {
            console.error('[heading-guard] 重置编号失败：', err);
        }
    }

    /* ── 执行前的确认窗（用户 2026-10-01 要求）── */

    // 手动命令**一律**先弹两列对照窗（用户 2026-10-09 定：那个开关已删掉，不再可关）；
    // 自动编号直接写、不弹窗（否则每次定时触发都会弹）。
    async _confirmOrApply(ctx) {
        const { file, editor, manual, mode, items, headings, getLine, plan } = ctx;
        if (!manual) {
            return this._applyItems(file, editor, items, manual, mode);
        }
        const rows = previewRows(headings, getLine, plan);
        if (rows === null) { new Notice(this.t('stale')); return; }
        this.pendingConfirm = true;
        const modal = new DiffConfirmModal(this.app, {
            title: this.t(mode === 'number' ? 'cmdNow' : 'cmdReset'),
            rows,
            labels: {
                old: this.t('diffOld'), next: this.t('diffNew'),
                cancel: this.t('cancel'), confirm: this.t('diffConfirm'),
                summary: this.t('diffSummary'), summaryNone: this.t('diffSummaryNone'),
                skip: this.t('diffSkip'),
            },
            onConfirm: (finalRows) => this._applyEdited(file, editor, finalRows, mode),
            onClose: () => { this.pendingConfirm = false; },
        });
        modal.open();
    }

    // 确认之后：以「窗口里那几行当下的文字」为准重算改动，再走与直接执行**同一条**写回链路。
    // ⚠️ 右列是可编辑的 —— 所以这里写进去的可能是用户手改过的标题文字，不只是编号。
    async _applyEdited(file, editor, rows, mode) {
        try {
            const items = rows
                .map((r) => ({ line: r.line, level: r.level, old: r.old, next: r.text, changed: r.text !== r.old }))
                .filter((r) => r.changed);
            if (items.length === 0) {
                new Notice(this.t(mode === 'number' ? 'upToDate' : 'noNumber'));
                return;
            }
            // 陈旧保护：确认期间文档被改过（自动编号、别的插件、外部同步）→ 一行都不写。
            // 宁可让用户重来一次，也不能按过期行号写进错误的位置。
            const getLine = this._lineReader(editor);
            for (const item of items) {
                const now = readHeadingLine(getLine(item.line) || '');
                if (!now || now.text !== item.old) {
                    new Notice(this.t('staleOnConfirm'));
                    return;
                }
            }
            await this._applyItems(file, editor, items, true, mode);
        } catch (err) {
            console.error('[heading-guard] 确认后写入失败：', err);
        }
    }

    // 「直接执行」与「确认后执行」共用的尾段：本文件链接改动并入同一个事务，再同步别文件。
    async _applyItems(file, editor, items, manual, mode) {
        const renames = items.map((item) => ({ from: item.old, to: item.next }));
        // ⚠️ 顺序不能换：本文件链接的 offset 必须在标题改动**之前**采集（见 collectSelfLinkEdits）
        const selfEdits = this.collectSelfLinkEdits(file, renames, file.path);
        this._write(editor, items, selfEdits);
        const synced = await this.syncHeadingLinks(file, renames, file.path);
        synced.links += selfEdits.length;
        // 自链接改动落在**本文件**里：`syncHeadingLinks` 只统计了别的文件，
        // 本文件没被算进去就 +1（算进去过就不重复加）。
        if (selfEdits.length > 0 && !synced.countedSelf) synced.files += 1;
        if (manual) {
            new Notice(this.t(mode === 'number' ? 'done' : 'resetDone', items.length));
            if (synced.links > 0) new Notice(this.t('linksUpdated', synced));
        }
    }

    /* ── 标题样式（预设）：存的是「各级标题设置 + 父级别缺失或级别不连续时编号方式」，不含语言 / 排除文件夹等 ── */

    // 票 06：「新建样式」是**虚拟方案** —— 列表里永远第一位，但**不写盘**（不进 stylePresets）。
    // 三语名字都算它：换语言之后旧名字也不会突然变成一个「真的方案」。
    newStyleNames() {
        const out = [this.t('presetNew')];
        for (const lang of Object.keys(STRINGS)) {
            const name = STRINGS[lang].presetNew;
            if (name && out.indexOf(name) < 0) out.push(name);
        }
        return out;
    }

    // 当前语言下的虚拟方案名（面板上那个加号就用它）
    newStyleName() { return this.t('presetNew'); }

    isNewStyleName(name) {
        const key = String(name == null ? '' : name).trim();
        return key !== '' && this.newStyleNames().indexOf(key) >= 0;
    }

    stylePresetNames() {
        // 第一位永远是固定的「新建样式」（用户 2026-10-11 要求）
        return [this.t('presetNew')].concat(this.settings.stylePresets.map((item) => item.name));
    }

    findStylePreset(name) {
        const key = String(name == null ? '' : name).trim();
        return this.settings.stylePresets.find((item) => item.name === key) || null;
    }

    // 返回 true = 覆盖了同名样式；false = 新建了一条
    // 票 06（2026-10-11）：返回码取代原来的 boolean ——
    //   'saved' / 'nameTaken'（重名，含保留的「新建样式」）/ 'duplicate:<已存在的名字>'（设置完全相同）
    // ⚠️ **不再同名覆盖**：用户明确要求不许重名 ⇒ 要改一个已存方案就**先删再存**。
    // 票 07（2026-10-11）**又改了结局**（用户要求）——返回码：
    //   'saved'                存好了（新建，或 force 覆盖）
    //   'nameTaken'            名字是保留的虚拟名（「新建样式」）
    //   'unchanged'            同名 + 设置一模一样 → 调用方提示「无需保存」
    //   'confirm:<名字>'       同名 + 设置变了 → 调用方弹「是否覆盖保存？」
    //   'duplicate:<已有名字>' 异名但设置完全相同 → 调用方提示「已存在于…」
    // `force = true` 才真的覆盖（面板点「确定」时才传）。
    saveStylePreset(name, force) {
        const key = String(name == null ? '' : name).trim();
        if (key === '' || this.isNewStyleName(key)) return 'nameTaken';
        const preset = snapshotStylePreset(this.settings);
        preset.name = key;
        const existing = this.findStylePreset(key);
        if (existing) {
            if (sameStylePreset(existing, preset)) return 'unchanged';
            if (!force) return 'confirm:' + key;
            const at = this.settings.stylePresets.findIndex((item) => item.name === key);
            this.settings.stylePresets[at] = preset;
            this.saveSettings();
            return 'saved';
        }
        const twin = this.settings.stylePresets.find((item) => sameStylePreset(item, preset));
        if (twin) return 'duplicate:' + twin.name;
        this.settings.stylePresets.push(preset);
        this.saveSettings();
        return 'saved';
    }

    // 返回 false = 没有这个样式（调用方据此提示，不静默）
    applyStylePreset(name) {
        const key = String(name == null ? '' : name).trim();
        // 票 06：「新建样式」= 回默认 + **解锁**（等同于点那个加号）
        if (this.isNewStyleName(key)) {
            applyStylePresetToSettings(this.settings, defaultStylePreset());
            this.presetLocked = false;
            this.saveSettings();
            this.checkActiveNote(true);
            return true;
        }
        const preset = this.findStylePreset(key);
        if (!preset) return false;
        applyStylePresetToSettings(this.settings, preset);
        this.presetLocked = true;   // 票 06：选中了已存方案 → 样式区锁定（面板据此置灰）
        this.saveSettings();
        // 规则变了，当前笔记的编号也得跟着变 —— 否则要等「切笔记」才生效（签名里没有设置项）
        this.checkActiveNote(true);
        return true;
    }

    deleteStylePreset(name) {
        const key = String(name == null ? '' : name).trim();
        if (this.isNewStyleName(key)) return false;   // 票 06：「新建样式」不许删（防用户删掉默认方案）
        const at = this.settings.stylePresets.findIndex((item) => item.name === key);
        if (at < 0) return false;
        this.settings.stylePresets.splice(at, 1);
        this.saveSettings();
        return true;
    }

    // 链接同步要用的两个内部接口是不是都在。纯判定，没有副作用。
    canSyncLinks() {
        const mc = this.app.metadataCache;
        return typeof mc.iterateAllRefs === 'function' && typeof mc.updateInternalLinks === 'function';
    }

    // 改标题前的预检闸门。返回 false = 已停手（必要时弹过提示），调用方立刻 return。
    // 接口不在就**整轮不改** —— 宁可标题停在原地，也不留下指向旧标题名的链接（用户 2026-09-24 定）。
    // ⚠️ 挡不住「接口在、跑完却一条都没处理」那种**静默失效**：它与「一切正常」的可观测量完全一样
    //    （都是「什么都没变」），检测不了。用户已知情接受 —— 所以这里只做能力预检，不做写后回读。
    readyToRename(manual) {
        if (this.canSyncLinks()) {
            this.syncBlockedNotified = false; // 恢复正常 → 下次真出问题还会提示
            return true;
        }
        // 手动命令每次都提示；自动编号只在「状态翻转」时提示一次，否则定时器每轮都弹、刷屏
        if (manual || !this.syncBlockedNotified) {
            this.syncBlockedNotified = true;
            new Notice(this.t('syncBlocked'));
        }
        return false;
    }

    // 复现 Obsidian 官方「重命名小标题」的副作用（官方命令只弹模态框，无法批量调用）。
    //
    // ⚠️ **本文件的链接不在这里处理**（2026-09-26 修）—— 见 `collectSelfLinkEdits` 与 `_write`：
    //    本文件此刻 buffer 比磁盘新，`updateInternalLinks`（走 `vault.process`）写下去会被
    //    buffer 的下一次落盘**覆盖掉**，表现为「返回改了 N 条、实际一条没改」的静默失效。
    //    所以 `skipPath` 传本文件的 path，这里只处理**别的文件**里指向它的链接
    //    —— 那些文件 buffer 干净，这条路好使（真机实测通过）。
    async syncHeadingLinks(file, renames, skipPath) {
        const mc = this.app.metadataCache;
        // 返回实际改写了几条链接、涉及几个文件 —— 用来弹「更新M个文件中的N条链接」。
        // 正常路径走不到这个提前 return（readyToRename 已经拦过），留着是双保险。
        const synced = { links: 0, files: 0 };
        if (!this.canSyncLinks()) return synced;

        // 官方比对标题时两边都 toLowerCase（大小写不敏感），这里对齐它。
        // ⚠️ 归一化用的是 `linkKeyOld`（**逐字复刻官方的 LT**）而不是 `normHeading`：
        //    官方 `hI.getChanges` 里 `LT(oldHeading).toLowerCase()` 与
        //    `LT(链接子路径).toLowerCase()` 精确相等才算命中 —— 两边口径必须一致。
        // ⚠️ 不能改 `normHeading` 本身：那是「陈旧保护」共用的（理由见它的注释）。
        const byOld = new Map();
        for (const rename of renames) byOld.set(linkKeyOld(rename.from), rename.to);

        const byPath = new Map();
        mc.iterateAllRefs((sourcePath, ref) => {
            if (skipPath && sourcePath === skipPath) return; // 本文件 → 已并入编辑器事务
            const bar = ref.link.indexOf('#');
            if (bar < 0) return;
            const sub = ref.link.slice(bar + 1);
            if (!sub || sub.charAt(0) === '^') return; // 块引用不动
            const next = byOld.get(linkKeyOld(sub));
            if (!next) return;
            // 同名标题可能存在于别的笔记里，必须确认链接确实指向本文件
            if (mc.getFirstLinkpathDest(ref.link.slice(0, bar), sourcePath) !== file) return;
            const change = buildChange(ref.original, ref.link, next);
            if (change === null) return;
            const list = byPath.get(sourcePath);
            const entry = { sourcePath, reference: ref, change };
            if (list) list.push(entry);
            else byPath.set(sourcePath, [entry]);
        });
        if (byPath.size > 0) {
            synced.files = byPath.size;
            for (const list of byPath.values()) synced.links += list.length;
            await mc.updateInternalLinks(keyArray(byPath));
        }

        // Canvas 嵌入卡片：走官方自己的 renameSubpath，它自己会弹它自己的提示，所以**不计入**上面的数字
        const canvas = mc.linkUpdaters && mc.linkUpdaters.canvas;
        if (canvas && typeof canvas.renameSubpath === 'function') {
            for (const rename of renames) {
                await canvas.renameSubpath(file, normHeading(rename.from).toLowerCase(), normHeading(rename.to));
            }
        }
        return synced;
    }
}

/* ────────────────────────── 设置面板 ────────────────────────── */

const CAN_SET_HEADING = typeof Setting.prototype.setHeading === 'function';

function settingHeading(containerEl, text, level) {
    if (CAN_SET_HEADING) {
        new Setting(containerEl).setName(text).setHeading();
        return;
    }
    containerEl.createEl(level === 2 ? 'h4' : 'h3', { text });
}

const BRACKET_LABELS = { '()': 'bracketAscii', '（）': 'bracketCjk' };

// 加一个「候选锁死」的下拉框，显示文案由 labelFor(value) 决定
function pickDropdown(dd, choices, labelFor, current, onChange) {
    for (const value of choices) dd.addOption(value, labelFor(value));
    dd.setValue(current).onChange(onChange);
}

// 「恢复默认设置」按钮上的图标（Lucide 名）。Obsidian 内置整套 Lucide，
// `rotate-ccw` 就是常见的「重置 ↺」。
const RESET_ICON = 'rotate-ccw';
// 「保存标题样式」栏的三个图标：保存 / 重新套用 / 删除。
// 中间那个刻意不用 rotate-ccw —— 那是「恢复默认设置」的图标，混用会看不出谁是谁。
const PRESET_SAVE_ICON = 'save';
// 票 06（2026-10-11）：原来的「套用」按钮换成了「新建样式」—— 套用改从方案列表里选。
const PRESET_NEW_ICON = 'plus';
const PRESET_DELETE_ICON = 'trash-2';
// 「展开全部已保存样式」按钮。用 chevrons-up-down —— 与 Obsidian 自带输入建议框里的展开记号同款。
const PRESET_LIST_ICON = 'chevrons-up-down';

// 恢复默认设置的确认框。**确定在左、取消在右** —— 与 Obsidian 自带「主按钮在右」的惯例相反，
// 这是用户指定的顺序，别按惯例改回去。
class ConfirmResetModal extends Modal {
    constructor(app, text, labels, opts) {
        super(app);
        this.text = text;
        this.labels = labels;
        this.answer = null;      // 'ok' | 'cancel'，离线测试拿它断言
        this.onChoose = null;
        // 票 07（2026-10-11）：覆盖保存那个框要求「取消在左、确定在右」——与这里默认的相反。
        this.reverse = !!(opts && opts.reverse);
    }

    onOpen() {
        this.contentEl.createEl('p', { text: this.text, cls: 'heading-guard-confirm-text' });
        // 按钮行：默认 DOM 顺序是「确定、取消」，配合 CSS 的 flex-end → 确定在左、取消在右；
        // `reverse` = true 时换成「取消、确定」→ 取消在左、确定在右。
        const row = this.contentEl.createEl('div', { cls: 'heading-guard-confirm-buttons' });
        const okBtn = { text: this.labels.ok, cls: 'mod-cta', answer: 'ok' };
        const cancelBtn = { text: this.labels.cancel, cls: '', answer: 'cancel' };
        for (const item of (this.reverse ? [cancelBtn, okBtn] : [okBtn, cancelBtn])) {
            row.createEl('button', { text: item.text, cls: item.cls })
                .addEventListener('click', () => this.choose(item.answer));
        }
    }

    choose(answer) {
        this.answer = answer;
        this.close();
        if (this.onChoose) this.onChoose(answer);
    }

    onClose() {
        this.contentEl.empty();
    }
}

/* ─────────── 手动命令前的两列对照确认窗（用户 2026-10-01 要求）─────────── */

// 差异段画成 <span>：变了的加高亮类，没变的不加。整段重画（失焦重算要用）。
// `label`（可选）= 行首那个级别标签（`H1`…`H6` / `Skip`，见票 10）。
// ⚠️ 标签必须由**本函数**来画：左列每次重算都是 `empty()` 整片重画，标签若挂在函数外面，
//    用户一改右列（失焦重画）标签就没了 —— 这是票 10 最关键的防回归点。
function paintDiffSegments(el, segments, changedCls, label) {
    el.empty();
    if (label) el.createEl('span', { cls: label.cls, text: label.text });
    for (const seg of segments) {
        if (seg.text === '') continue;
        if (seg.changed) el.createEl('span', { cls: changedCls, text: seg.text });
        else el.createEl('span', { text: seg.text });
    }
}

// 标题只有一行：换行 / 制表符一律折成空格（粘贴多行文本时用得上）。
function flattenCellText(raw) {
    return String(raw == null ? '' : raw).replace(/[\r\n\t]+/g, ' ');
}

class DiffConfirmModal extends Modal {
    constructor(app, opts) {
        super(app);
        this.opts = opts;
        this.answer = null;      // 'confirm' | 'cancel'，离线测试拿它断言
    }

    onOpen() {
        const { title, rows, labels } = this.opts;
        this.modalEl.addClass('heading-guard-diff-modal');
        this.titleEl.setText(title);

        // 顶部第一行：各级标题各几个（用户 2026-10-09 要求）。
        // ⚠️ 跳过的不算；「本级不编号」开关打开的那一级**照算**（它只是不写编号，标题还在）；只列非 0 的级。
        const counts = [0, 0, 0, 0, 0, 0, 0];
        for (const r of rows) { if (!r.skipped) counts[r.level]++; }
        const parts = [];
        for (let lv = 1; lv <= 6; lv++) { if (counts[lv] > 0) parts.push('H' + lv + '*' + counts[lv]); }
        this.contentEl.createEl('div', {
            cls: 'heading-guard-diff-summary',
            text: labels.summary + (parts.length ? parts.join(', ') : labels.summaryNone),
        });

        const head = this.contentEl.createEl('div', { cls: 'heading-guard-diff-head' });
        head.createEl('div', { cls: 'heading-guard-diff-col', text: labels.old });
        head.createEl('div', { cls: 'heading-guard-diff-col', text: labels.next });

        // ⚠️ 两列**共用同一个滚动容器** → 滚动天然同步，也不可能错行，不需要任何同步代码。
        //    （用户要求「两列共用同一个滚动条并支持同步滚动」，一个滚动容器就是最直白的实现。）
        const scroller = this.contentEl.createEl('div', { cls: 'heading-guard-diff-scroll' });
        for (const row of rows) {
            row.text = row.next;
            const line = scroller.createEl('div', { cls: 'heading-guard-diff-row' });
            // 行首级别标签：被跳过的显示 `Skip`，其余 `H<级别>`（用户 2026-10-09 要求）
            const levelLabel = {
                text: row.skipped ? labels.skip : 'H' + row.level,
                cls: 'heading-guard-diff-level' + (row.skipped ? ' is-skip' : ''),
            };

            // 左列：纯文本、只读（不是输入框，点进去也改不了），但可以选中复制。
            const left = line.createEl('div', { cls: 'heading-guard-diff-cell heading-guard-diff-old' });
            paintDiffSegments(left, diffSegments(row.old, row.next).left, 'heading-guard-diff-del', levelLabel);

            // 右列：可编辑文本框。内容与高亮都自己画，才能只给「新增的那几个字」上底色。
            const right = line.createEl('div', {
                cls: 'heading-guard-diff-cell heading-guard-diff-new',
                attr: { contenteditable: 'true', spellcheck: 'false' },
            });
            paintDiffSegments(right, diffSegments(row.old, row.next).right, 'heading-guard-diff-ins');
            row.el = right;

            // 只粘纯文本；回车吞掉 —— 标题本来就只有一行
            right.addEventListener('paste', (ev) => {
                ev.preventDefault();
                const cb = ev.clipboardData;
                const text = cb && cb.getData ? flattenCellText(cb.getData('text/plain')) : '';
                if (!text) return;
                const doc = right.ownerDocument;
                if (doc && typeof doc.execCommand === 'function') doc.execCommand('insertText', false, text);
            });
            right.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') ev.preventDefault();
            });
            // 失焦重算（用户要求）：拿**左列原文**和「这行现在被我改成什么样」重新比对。
            // ⚠️ **两列必须一起重画** —— 只重画右列会让左列留着上一次的红底，跟右列对不上：
            //    用户 2026-10-01 实测报的就是这个（在右列删掉「编号」，左列的「编号」没变红）。
            //    右列整条删空时，左列整条标红。
            right.addEventListener('blur', () => {
                const text = flattenCellText(right.textContent);
                row.text = text;
                const diff = diffSegments(row.old, text);
                paintDiffSegments(left, diff.left, 'heading-guard-diff-del', levelLabel);   // ⚠️ 标签要一起重画
                paintDiffSegments(right, diff.right, 'heading-guard-diff-ins');
            });
        }

        // 底部：左「取消」/ 右「确认」（按用户草图；与插件另一个确认框的顺序相反，
        // 那个是「确定在左、取消在右」，也是用户当时指定的，两个都别改回去）。
        const bar = this.contentEl.createEl('div', { cls: 'heading-guard-diff-buttons' });
        bar.createEl('button', { text: labels.cancel })
            .addEventListener('click', () => this.finish(false));
        bar.createEl('button', { text: labels.confirm, cls: 'mod-cta' })
            .addEventListener('click', () => this.finish(true));
    }

    finish(confirm) {
        this.answer = confirm ? 'confirm' : 'cancel';
        const rows = this.opts.rows || [];
        // 以**当下**的 DOM 为准 —— 用户可能没让某一行失焦就直接点了确认
        for (const row of rows) if (row.el) row.text = flattenCellText(row.el.textContent);
        this.close();
        // 先关窗再写：改标题的过程中窗口不该还挂在屏幕上
        if (confirm && this.opts.onConfirm) this.opts.onConfirm(rows);
    }

    onClose() {
        this.contentEl.empty();
        if (this.opts.onClose) this.opts.onClose();
    }
}

/* ─────────────────── 样式名输入框的建议列表 ─────────────────── */

// AbstractInputSuggest 是 1.5.x 才进公开 API 的组件；老版本拿不到 → 退化成纯输入框
//（仍可手输名称，保存 / 加载 / 删除三个按钮照常工作）。所以这里**不能**直接 extends 它。
const HAS_INPUT_SUGGEST = typeof AbstractInputSuggest === 'function';
// 建议列表最多显示多少条（与 mpv-linker 一致）。⚠️ 只在**过滤之后**生效。
const SUGGEST_LIMIT = 50;
const SUGGEST_BASE = HAS_INPUT_SUGGEST ? AbstractInputSuggest : function () {};

// 输入框下方的候选 = 调用方给的那串字符串（已保存的样式名 / 仓库里的文件夹路径）；
// 手输时按大小写不敏感的子串过滤，空串则全列 —— 与 mpv-linker「截图保存目录位置」同一套口径。
class InputListSuggest extends SUGGEST_BASE {
    constructor(app, inputEl, getItems, onPick) {
        super(app, inputEl);
        this.getItems = getItems;
        this.onPick = onPick;
    }

    getSuggestions(query) {
        const needle = String(query == null ? '' : query).trim().toLowerCase();
        const items = this.getItems() || [];
        const hit = needle === '' ? items.slice()
            : items.filter((name) => name.toLowerCase().indexOf(needle) >= 0);
        // ⚠️ 截断必须发生在**过滤之后**。候选表可能很长（用户仓库 83 个文件夹），
        //    先截再筛会让排在 50 名以后的文件夹**永远搜不到** ——
        //    2026-10-02 用户实测：`Z-附件` 在第 75 位，查 `附件` / `Z-` 都是 0 条。
        //    mpv-linker 的「截图保存目录位置」也是「先过滤再截断」，这里与它对齐。
        return hit.slice(0, SUGGEST_LIMIT);
    }

    renderSuggestion(name, el) {
        el.setText(name);
    }

    // 官方自带的文件建议框也是这个写法：先把值写回输入框、再 close()，最后才回调。
    selectSuggestion(name) {
        this.setValue(name);
        this.close();
        if (this.onPick) this.onPick(name);
    }
}

/* ───────── 从仓库里挑一个文件夹（用户 2026-10-02 要求）───────── */

// 候选 = 仓库里**所有**文件夹的路径（排序，不截断）。根 '/' 不算可选文件夹。
// ⚠️ 这里刻意**不截断** —— 截断由建议组件在「按查询过滤之后」做；先截再筛会让排后面的文件夹搜不到。
function vaultFolderPaths(app) {
    return app.vault.getAllLoadedFiles()
        .filter((f) => f instanceof TFolder && f.path !== '/')
        .map((f) => f.path)
        .sort();
}

// 「选择文件夹路径」窗：一个输入框（可手打、可下拉选）+ 底部取消 / 确定。
// 选中候选只**回填输入框**，不直接生效 —— 要点「确定」才写回去，与用户要求一致。
class FolderPickerModal extends Modal {
    constructor(app, opts) {
        super(app);
        this.opts = opts;      // { title, label, placeholder, labels: {cancel, ok}, onConfirm(path) }
        this.answer = null;    // 'confirm' | 'cancel'，离线测试拿它断言
    }

    onOpen() {
        const { title, label, placeholder, labels } = this.opts;
        this.modalEl.addClass('heading-guard-folder-modal');
        this.titleEl.setText(title);

        new Setting(this.contentEl)
            .setName(label)
            .addText((tc) => {
                this.input = tc;
                tc.setPlaceholder(placeholder);
                // 拿不到官方建议组件的老版本上就是纯输入框 —— 手打路径照样能用
                if (HAS_INPUT_SUGGEST) {
                    this.suggest = new InputListSuggest(this.app, tc.inputEl,
                        () => vaultFolderPaths(this.app), (path) => tc.setValue(path));
                }
            });

        // 用 Obsidian 自己的按钮容器（原生外观：取消左、确定右）
        const bar = this.contentEl.createEl('div', { cls: 'modal-button-container' });
        bar.createEl('button', { text: labels.cancel })
            .addEventListener('click', () => this.finish(false));
        bar.createEl('button', { text: labels.ok, cls: 'mod-cta' })
            .addEventListener('click', () => this.finish(true));
    }

    finish(confirm) {
        this.answer = confirm ? 'confirm' : 'cancel';
        const value = this.input ? String(this.input.getValue() || '') : '';
        this.close();
        if (confirm && this.opts.onConfirm) this.opts.onConfirm(value);
    }

    onClose() {
        this.contentEl.empty();
        if (this.opts.onClose) this.opts.onClose();
    }
}

class HeadingGuardSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const plugin = this.plugin;
        const t = (key, arg) => plugin.t(key, arg);
        const settings = plugin.settings;
        const { containerEl } = this;
        // 票 08（2026-10-11）：重绘会把滚动位置弹回顶部（用户报的体验问题）。
        //   在开头记下、结尾还原 —— 放在 display() 里是**单点修复**：套用 / 删除 / 换语言 / 加文件夹
        //   这些走重绘的路径全都受益。
        const scrollHost = scrollHostOf(containerEl);
        const scrollTop = scrollHost ? scrollHost.scrollTop : 0;

        // display() 的目录（按顺序装配；只给两个最大区块起了名，短的就地读更快）：
        //   通用设置 → 说明段 → 样式预览 + 保存标题样式 → 缺失级别 → 各级标题分组 → 收尾

        containerEl.empty();
        containerEl.addClass('heading-guard-settings');

        // 预览框要跟着设置走，所以「改设置」统一走这个入口
        let previewEl = null;
        const renderPreview = () => {
            if (!previewEl) return;
            // 票 21（用户 2026-10-13）：选「继承父标题样式」时，预览改成**左右两栏对照** ——
            //   两栏用**同一套设置**、只差这一个模式，所以「差别」一眼可见（用户嫌单栏不直观）；
            //   选「严格按照标题样式」时仍是原来的单栏文本，渲染结果与改版前逐字节相同。
            const inherit = settings.missingLevelMode === 'inherit';
            previewEl.empty();
            if (!inherit) {
                if (previewEl.removeClass) previewEl.removeClass('heading-guard-preview-split');
                previewEl.setText(previewLines(settings).join('\n'));
                return;
            }
            previewEl.addClass('heading-guard-preview-split');
            const withMode = (mode) => Object.assign({}, settings, { missingLevelMode: mode });
            // ⚠️ 对照的**场景固定是「一级标题缺失」** ⇒ 两栏都只演示**二级~六级**（右栏的继承本来就只出 5 行）。
            //   严格那一支是按 1~6 级生成的，这里要**跳过它的第一行** —— 否则左栏会多出一条 `# …一级标题` ✗
            //   （用户 2026-10-13 对着参考图抓到过）。⚠️ 严格**单栏**那条路不受影响，仍演示完整的一~六级。
            const cols = [
                [t('missingLevelStrict'), previewLines(withMode('strict')).slice(1)],
                [t('missingLevelInherit'), previewLines(settings)],
            ];
            for (const [title, lines] of cols) {
                const col = previewEl.createEl('div', { cls: 'heading-guard-preview-col' });
                col.createEl('div', { text: title, cls: 'heading-guard-preview-col-title' });
                col.createEl('pre', { text: [t('previewHypoLine')].concat(lines).join('\n') });
            }
        };
        const save = async () => {
            await plugin.saveSettings();
            renderPreview();
            // 规则变了，当前笔记的编号也得跟着变 —— 否则要等「切笔记」才生效（签名里没有设置项）
            plugin.checkActiveNote(true);
        };
        const noneLabel = t('none');
        const symbolLabel = (value) => (value === 'none' ? noneLabel : value);
        const bracketLabel = (value) => (value === 'none'
            ? noneLabel
            : (BRACKET_LABELS[value] ? t(BRACKET_LABELS[value]) : value));

        // 「开启自动编号」的开关与「检测间隔」滑块要联动（关掉自动编号 → 滑块置灰），先登记引用：
        // 这样控件构造顺序与回调触发时机都不会影响结果。
        let autoToggle = null;
        let intervalSlider = null;

        new Setting(containerEl)
            .setName(t('lang'))
            .addDropdown((dd) => dd
                .addOption('zh-CN', STRINGS['zh-CN'].langName)
                .addOption('zh-TW', STRINGS['zh-TW'].langName)
                .addOption('en', STRINGS['en'].langName)
                .setValue(settings.language)
                .onChange(async (value) => {
                    settings.language = value;
                    await plugin.saveSettings();
                    this.display();
                    new Notice(plugin.t('reload'));
                }));

        let intervalLabel = null;
        const setIntervalLabel = (seconds) => {
            if (intervalLabel) intervalLabel.setText(String(seconds) + ' ' + t('seconds'));
        };
        // 间隔滑块的专用保存：拖一格就存盘 + 触发一次编号，会边拖边写盘、还会打断输入。
        // 这里等用户停手 500ms 再存一次，且**不调 checkActiveNote**（只改了周期，标题没变）。
        // 尾参不传 —— 传 true 会先立刻跑一次，等于没防抖。
        const saveInterval = debounce(async () => {
            await plugin.saveSettings();
            if (settings.autoNumber) plugin.startTimer();   // 按新周期重开时钟
        }, 500);
        const autoRow = new Setting(containerEl)
            .setName(t('auto'))
            .setDesc(t('autoDesc'))
            .addToggle((tg) => {
                autoToggle = tg;
                tg.setValue(settings.autoNumber).onChange(async (value) => {
                    settings.autoNumber = value;
                    await save();
                    if (value) {
                        plugin.startTimer();
                        plugin.checkActiveNote(true); // 打开就立刻编一次，不用等下个周期
                    } else {
                        plugin.stopTimer();
                    }
                    if (intervalSlider) intervalSlider.setDisabled(!value);
                });
            })
            .addSlider((sl) => {
                intervalSlider = sl;
                sl.setLimits(MIN_SCAN_INTERVAL, MAX_SCAN_INTERVAL, 1)
                    .setValue(settings.scanInterval)
                    .setDynamicTooltip()
                    .setDisabled(!settings.autoNumber)
                    .onChange((value) => {
                        settings.scanInterval = value;
                        setIntervalLabel(value);   // 数字立刻跟着走，看着不卡
                        saveInterval();             // 真正落盘交给防抖
                    });
            });
        intervalLabel = autoRow.controlEl.createEl('span', {
            cls: 'heading-guard-interval-value',
            text: String(settings.scanInterval) + ' ' + t('seconds'),
        });
        autoRow.addButton((btn) => btn
            .setButtonText(t('resetInterval'))
            .setTooltip(t('resetIntervalTip'))
            .onClick(async () => {
                settings.autoNumber = false;
                settings.scanInterval = DEFAULT_SCAN_INTERVAL;
                await save();
                plugin.stopTimer();
                if (autoToggle) autoToggle.setValue(false);
                if (intervalSlider) intervalSlider.setValue(DEFAULT_SCAN_INTERVAL).setDisabled(true);
                setIntervalLabel(DEFAULT_SCAN_INTERVAL);
            }));

        new Setting(containerEl)
            .setName(t('stripOld'))
            .setDesc(t('stripOldDesc'))
            .addToggle((tg) => tg.setValue(settings.stripOldNumbers).onChange(async (value) => {
                settings.stripOldNumbers = value;
                await save();
            }));

        new Setting(containerEl)
            .setName(t('scope'))
            .setDesc(t('scopeDesc'))
            .addDropdown((dd) => {
                dd.addOption('all', t('scopeAll')).addOption('optIn', t('scopeOptIn'))
                    .setValue(settings.scope)
                    .onChange(async (value) => {
                        settings.scope = value;
                        await save();
                    });
            });

        // 排除文件夹：一个多行文本框。不逐行拆控件 —— 行数不定，用户习惯直接粘一坨路径。
        // 首次启用时（loadSettings 里判的）试着把内置「模板」插件的模板文件夹预填进去，
        // 读不到就留空、不报错 —— 走的是私有接口，跨版本可能失效（用户已知情接受）。
        if (plugin.excludePrefillPending) {
            plugin.excludePrefillPending = false;
            const preset = templateFolderPreset(plugin.app);
            if (preset) {
                settings.excludeFolders = [normalizeFolder(preset)];
                plugin.saveSettings();      // display() 不是 async，走 fire-and-forget
                new Notice(t('excludeFromTemplates'));
            }
        }
        const excludeRow = new Setting(containerEl)
            .setName(t('exclude'))
            .setDesc(t('excludeDesc'))
            .addTextArea((ta) => {
                ta.setValue(settings.excludeFolders.map((f) => f.replace(/\/$/, '')).join('\n'));
                ta.inputEl.rows = 4;
                // 与间隔滑块同一套路：边打字边存盘会频繁写盘，等停手再存。
                const saveExclude = debounce(async () => {
                    settings.excludeFolders = ta.getValue()
                        .split('\n')
                        .map((line) => normalizeFolder(line))
                        .filter((line) => line !== '');
                    await plugin.saveSettings();
                }, 500);
                ta.onChange(() => saveExclude());
            })
            // 「+」：从仓库里挑一个文件夹追加进排除列表（用户 2026-10-02 要求）
            .addExtraButton((b) => b
                .setIcon('plus')
                .setTooltip(t('excludeAdd'))
                .onClick(() => this.pickFolderToExclude()));
        // 「多行文本框 + 加号」必须**并排同一行**：面板默认 flex-wrap: wrap，真机量到加号会被挤到
        // 下一行（t 差 90px）。与「本级不编号」同一套路，靠这个类改回 nowrap。
        excludeRow.settingEl.addClass('heading-guard-inline-row');

        // 票 14（用户 2026-10-11 要求）：两段说明从「恢复默认设置」下方搬到这里 ——
        //   「排除文件夹」**下面**、「样式预览」**上面**。
        this.renderFooterHelp(containerEl);

        settingHeading(containerEl, t('preview'), 2);
        // 票 21：这里从 <pre> 换成**容器**（严格模式下里面仍是原来那一坨文本，观感不变）；
        //   「继承」模式会往里面放左右两栏（见 renderPreview）。
        previewEl = containerEl.createEl('div', { cls: 'heading-guard-preview' });

        // 「样式预览」下方：保存 / 加载 / 删除标题样式（用户 2026-09-29 要求）
        const presetInput = this.renderPresetRow(containerEl);   // 票 06：要拿它设 disabled

        // 2026-10-11：删掉「全局编号尾缀」之后，各级尾缀行不再有可用性联动（「无 + 不加空格」= 不加尾巴）。
        // ── 区块：「父级别缺失或级别不连续时编号方式」──
        // ponytail: 只搬进来起个名，**没有**重缩进（90 行重排的 diff 噪音不值得，逻辑一行未动）。
        const renderGlobalAndMissing = () => {

        // 「父级别缺失或级别不连续时编号方式」（用户 2026-10-09 新增；
        // 2026-10-11 起放在「保存标题样式」下面 —— 它也算样式的一部分，见票 05）。
        //   strict  = 段数永远等于标题级别（缺的层级用「样式预览」里那一级的编号补上）
        //   inherit = 缺失的层级让更深的级别整体上移一套样式
        new Setting(containerEl)
            .setName(t('missingLevel'))
            .setDesc(t('missingLevelDesc'))
            .addDropdown((dd) => dd
                .addOption('strict', t('missingLevelStrict'))
                .addOption('inherit', t('missingLevelInherit'))
                .setValue(settings.missingLevelMode)
                .onChange(async (value) => {
                    settings.missingLevelMode = value;
                    await save();
                }));

        };

        // ── 区块：各级标题（六个可折叠分组：本级不编号 / 序列 / 编号方式 / 括符 / 间隔符 / 尾缀）──
        const renderLevelGroups = () => {
        for (let level = 1; level <= 6; level++) {
            const own = settings.levels[level];
            // 每个等级一个原生 <details>：默认折叠（用户要求），点标题展开
            const group = containerEl.createEl('details', { cls: 'heading-guard-level' });
            group.createEl('summary', { text: t('level')[level] });

            const skipRow = new Setting(group)
                .setName(t('skip'))
                .setDesc(t('skipDesc'))
                .addToggle((tg) => tg.setValue(own.skip).onChange(async (value) => {
                    own.skip = value;
                    await save();
                }));
            // 开关与下拉框必须**并排在同一行**（用户 2026-09-28 要求）。
            // 面板的 .setting-item-control 默认 flex-wrap: wrap，窄面板下这两个控件
            // 会被挤成两行；靠这个类在 styles.css 里改回 nowrap
            //（见 .heading-guard-inline-row 那条规则）。
            skipRow.settingEl.addClass('heading-guard-inline-row');

            // 「编号序列」与「前后缀括符」并成一栏（用户 2026-10-11）：序列在前、括符在后，两个下拉并排、
            // 描述留空。⚠️ 二~六级那个「继承 / 重新编号」下拉**照旧挂在这一栏的最后**（它本来就住在序列那行）。
            const seqRow = new Setting(group)
                .setName(t('seqBrackets'))
                .setDesc(t('seqBracketsDesc'))
                .addDropdown((dd) => {
                    for (const id of SEQUENCE_IDS) dd.addOption(id, SEQUENCE_SAMPLES[id]);
                    dd.setValue(own.sequence).onChange(async (value) => {
                        own.sequence = value;
                        await save();
                    });
                })
                .addDropdown((dd) => pickDropdown(dd, BRACKET_CHOICES, bracketLabel, own.brackets, async (value) => {
                    own.brackets = value;
                    await save();
                }));
            seqRow.settingEl.addClass('heading-guard-inline-row');   // 三个下拉并排一行（用户 2026-10-11）
            // 一级标题没有父级，「阶梯式编号 / 重新编号」无从谈起 → 只有二~六级挂这个下拉框。
            // ⚠️ 2026-10-11 试过把它**推到第二排**，三种做法都在真机上翻车：
            //    ① styles.css 的类 + flex-basis → 真机不换行；
            //    ② 另开一个 Setting → 用户否掉（要「在一栏里」）；
            //    ③ 内联 min-width:100% → 换行是换了，但把左边的名字/描述**挤成竖排** ✗。
            //    ⇒ 用户拍板：**就放一行**，把下拉框做正常。别再加「让它换行」的样式。
            if (level > 1) {
                seqRow.addDropdown((dd) => {
                    dd.addOption('inherit', t('numberInherit')).addOption('restart', t('numberRestart'))
                        .setValue(own.numbering).onChange(async (value) => {
                            own.numbering = value;
                            await save();
                        });
                });
            }

            // 一级标题没有父级编号，「层级间隔符」无从谈起 → 整行都不渲染（用户 2026-09-26 要求）
            if (level > 1) {
                new Setting(group)
                    .setName(t('sep'))
                    .setDesc(t('sepDesc'))
                    .addDropdown((dd) => pickDropdown(dd, SEPARATOR_CHOICES, symbolLabel, own.separator, async (value) => {
                        own.separator = value;
                        await save();
                    }));
            }

            // 「编号尾缀」：两个下拉并排（字符 + 要不要空格）。
            // 2026-10-11 删掉了那个开关 ——「无 + 不加空格」本来就等于不加尾巴，少一个开关。
            const suffixRow = new Setting(group)
                .setName(t('lvSuffix'))
                .setDesc(t('lvSuffixDesc'))
                .addDropdown((dd) => {
                    pickDropdown(dd, SUFFIX_CHOICES, symbolLabel, own.suffix.char, async (value) => {
                        own.suffix.char = value;
                        await save();
                    });
                })
                .addDropdown((dd) => {
                    dd.addOption('space', t('withSpace')).addOption('none', t('noSpace'))
                        .setValue(own.suffix.space ? 'space' : 'none')
                        .onChange(async (value) => {
                            own.suffix.space = value === 'space';
                            await save();
                        });
                });
            // 两个下拉必须并排同一行（用户 2026-10-11 要求；沿用现成的 nowrap 类）
            suffixRow.settingEl.addClass('heading-guard-inline-row');
        }

        };

        // 按目录依次装配（顺序与原代码完全一致）
        renderGlobalAndMissing();
        renderLevelGroups();

        // 票 07（2026-10-11）：套用已存方案后**只锁输入框**，下面样式区保持可编辑 ——
        //   用户要的正确路径就是「套用一个方案 → 改几项 → 点保存 → 弹『是否覆盖保存』」。
        if (presetInput) presetInput.setDisabled(!!plugin.presetLocked);
        renderPreview();
        this.renderRestoreRow(containerEl); // 最后一行：恢复默认设置
        // 票 08：重绘完把滚动位置放回去（内容变矮时浏览器会自己夹住，不用管）
        if (scrollHost) scrollHost.scrollTop = scrollTop;
    }

    // 「排除文件夹」右侧 + 的处理器：选中的路径**追加**到列表末尾（每行一条），
    // 空值不接受；已经在列表里的直接提示、不重复添加。
    pickFolderToExclude() {
        const plugin = this.plugin;
        const t = (key, arg) => plugin.t(key, arg);
        const modal = new FolderPickerModal(this.app, {
            title: t('pickFolderTitle'),
            label: t('pickFolderLabel'),
            placeholder: t('pickFolderPlaceholder'),
            labels: { cancel: t('cancel'), ok: t('ok') },
            onConfirm: (value) => {
                const path = normalizeFolder(value);
                if (path === '') { new Notice(t('pickFolderNeedValue')); return; }
                const shown = path.replace(/\/$/, '');   // 列表里显示的是不带尾斜杠的写法
                if (plugin.settings.excludeFolders.indexOf(path) >= 0) {
                    new Notice(t('excludeAlready', shown));
                    return;
                }
                plugin.settings.excludeFolders.push(path);
                plugin.saveSettings();
                this.display();      // 重绘 → 输入框立刻多出这一行
                new Notice(t('excludeAdded', shown));
            },
        });
        modal.open();
    }

    // 「保存标题样式」栏：一个可手输、可下拉的名称框 + 保存 / 加载 / 删除三个图标按钮。
    // 下拉里选中某一项 = 立刻把该样式套下去（用户 2026-09-29 要求）。
    renderPresetRow(containerEl) {
        const plugin = this.plugin;
        const t = (key, arg) => plugin.t(key, arg);
        let nameInput = null;
        let presetSuggest = null;   // 拿不到官方建议组件的老版本上一直是 null

        const readName = () => (nameInput ? String(nameInput.getValue() || '').trim() : '');
        const applyName = (name) => {
            const value = String(name == null ? '' : name).trim();
            if (value === '') { new Notice(t('presetNeedName')); return; }
            // 票 06：「新建样式」= 回默认 + **清空输入框** + 解锁（静默，不弹「已套用」）
            if (plugin.isNewStyleName(value)) {
                plugin.applyStylePreset(value);
                plugin.presetNameDraft = '';
                this.display();
                return;
            }
            if (!plugin.applyStylePreset(value)) { new Notice(t('presetMissing', value)); return; }
            // 重绘之后输入框要还留着这个名字 —— 否则接着想「再套用一次 / 删掉它」得把名字重打一遍
            plugin.presetNameDraft = value;
            this.display();     // 套用后整体重绘：各级设置都要跟着变
            new Notice(t('presetApplied', value));
        };
        // 删除要过确认框；删成功后把输入框清掉 —— 那个名字已经不存在了，留在框里只会误导下一手操作
        const deleteName = () => {
            const value = readName();
            if (value === '') { new Notice(t('presetNeedName')); return; }
            if (plugin.isNewStyleName(value)) return;   // 票 06：「新建样式」删不动，点了一点反应都没有
            if (plugin.stylePresetNames().indexOf(value) < 0) { new Notice(t('presetMissing', value)); return; }
            const modal = new ConfirmResetModal(this.app, t('presetDeleteConfirm', value),
                { ok: t('ok'), cancel: t('cancel') });
            modal.onChoose = (answer) => {
                if (answer !== 'ok') return;
                plugin.deleteStylePreset(value);
                plugin.presetNameDraft = '';
                if (nameInput) nameInput.setValue('');
                // 用户 2026-10-11：删完**输入框要恢复可编辑**。
                //   那个样式已经不在了，不该再停在「已选中某方案」的锁定态（票 07 的 presetLocked 就是为它加的）。
                plugin.presetLocked = false;
                this.display();   // 重绘 → 输入框按新的锁定态渲染（= 可编辑）
                new Notice(t('presetDeleted', value));
            };
            modal.open();
        };

        const row = new Setting(containerEl)
            .setName(t('preset'))
            .setDesc(t('presetDesc'))
            .addText((tc) => {
                nameInput = tc;
                tc.setPlaceholder(t('presetPlaceholder'));
                // 上一次用过的名字留着（套用会重绘面板，不该被清空）；跟着输入实时记下来
                if (plugin.presetNameDraft) tc.setValue(plugin.presetNameDraft);
                tc.onChange((v) => { plugin.presetNameDraft = v; });
                // 手输的同时也能选：输入框挂一个「已保存样式」的建议列表。
                // 拿不到官方组件的老版本上就是纯输入框，不影响三个按钮。
                if (HAS_INPUT_SUGGEST) {
                    presetSuggest = new InputListSuggest(plugin.app, tc.inputEl,
                        () => plugin.stylePresetNames(), applyName);
                }
            })
            // 展开「全部已保存样式」（用户 2026-09-29 要求）：
            // 官方建议组件一打字就进匹配态，只看得到匹配项，想看全量只能先把输入框清空。
            // 这个按钮直接列出全部，**既不看输入框里现在是什么字、也不改它**，纯粹是「把列表摊开」。
            .addExtraButton((b) => b
                .setIcon(PRESET_LIST_ICON)
                .setTooltip(t('presetListTip'))
                .setDisabled(!HAS_INPUT_SUGGEST)   // 老版本没有建议组件 → 这个按钮没意义，置灰
                .onClick(() => {
                    if (!presetSuggest || typeof presetSuggest.showSuggestions !== 'function') return;
                    const names = plugin.stylePresetNames();
                    if (names.length === 0) { new Notice(t('presetEmpty')); return; }
                    presetSuggest.showSuggestions(names);
                }))
            .addExtraButton((b) => b
                .setIcon(PRESET_SAVE_ICON)
                .setTooltip(t('presetSaveTip'))
                .onClick(() => this.savePresetFromRow(readName())))
            // 票 06：原来的「套用」按钮换成**加号（新建样式）** —— 套用改从方案列表里选。
            .addExtraButton((b) => b
                .setIcon(PRESET_NEW_ICON)
                .setTooltip(t('presetNew'))
                .onClick(() => applyName(t('presetNew'))))
            .addExtraButton((b) => b
                .setIcon(PRESET_DELETE_ICON)
                .setTooltip(t('presetDeleteTip'))
                .onClick(() => deleteName()));
        // 输入框 + 三个图标按钮必须**并排在同一行**（与各级「本级不编号」同一套路）
        row.settingEl.addClass('heading-guard-inline-row');
        row.settingEl.addClass('heading-guard-preset-row');
        return nameInput;   // 票 06：交给 display()，用于「已选中方案 → 输入框不可编辑」
    }

    savePresetFromRow(name) {
        const plugin = this.plugin;
        const t = (key, arg) => plugin.t(key, arg);
        const value = String(name == null ? '' : name).trim();
        if (value === '') { new Notice(t('presetNeedName')); return; }
        const result = plugin.saveStylePreset(value);
        if (result === 'nameTaken') { new Notice(t('presetDupName')); return; }
        if (result === 'unchanged') { new Notice(t('presetUnchanged')); return; }
        if (result.indexOf('duplicate:') === 0) {
            new Notice(t('presetDupSettings', result.slice('duplicate:'.length)));
            return;
        }
        if (result.indexOf('confirm:') === 0) {
            const target = result.slice('confirm:'.length);
            // 票 07：同名且设置变了 → 问一句。⚠️ 按钮要「取消在左、确定在右」（用户要求）
            const modal = new ConfirmResetModal(this.app, t('presetOverwriteConfirm', target),
                { ok: t('ok'), cancel: t('cancel') }, { reverse: true });
            modal.onChoose = (answer) => {
                if (answer !== 'ok') return;
                plugin.saveStylePreset(target, true);   // force = 真的覆盖
                this.display();
                new Notice(t('presetUpdated', target));
            };
            modal.open();
            return;
        }
        new Notice(t('presetSaved', value));
    }

    // 最后一行、靠右的「恢复默认设置」按钮（带重置图标）。
    renderRestoreRow(containerEl) {
        const t = (key) => this.plugin.t(key);
        const row = new Setting(containerEl);
        row.settingEl.addClass('heading-guard-restore-row');
        row.addButton((b) => {
            b.onClick(() => this.confirmRestoreDefaults());
            // 内容自己拼（图标 + 文字）：ButtonComponent 的 setIcon / setButtonText 谁覆盖谁
            // 取决于组件内部实现，靠不住。这样渲染结果是个定值：
            // <button><svg class="svg-icon lucide-rotate-ccw"/><span>恢复默认设置</span></button>
            b.buttonEl.empty();
            setIcon(b.buttonEl, RESET_ICON);
            b.buttonEl.createEl('span', { text: t('restoreDefaults') });
        });
    }

    // 「恢复默认设置」下方那段说明（用户 2026-10-11 要求）：① frontmatter 三种写法；② 跳过注释两种。
    // ⚠️ 它**不是 Setting** —— 用户明确要求「不带任何设置项背景和方框，仅作为说明文字展示」，
    //    所以这里直接建 div，不走 new Setting（否则会套上 .setting-item 那层卡片背景 ✗）。
    renderFooterHelp(containerEl) {
        const t = (key) => this.plugin.t(key);
        // 用户 2026-10-11：两段说明**收进一个可折叠行**（原生 <details>，与各级标题分组同一套路）。
        // ⚠️ 默认**收起** —— 只创建 details、不加 open 属性（原生行为就是收起）。
        const fold = containerEl.createEl('details', { cls: 'heading-guard-help-fold' });
        fold.createEl('summary', { text: t('helpFoldTitle') });
        const box = fold.createEl('div', { cls: 'heading-guard-fm-help' });

        // ① frontmatter：三行「写法 → 含义」（写法用等宽显示）
        box.createEl('div', { text: t('fmHelpIntro'), cls: 'heading-guard-fm-help-intro' });
        const fmLines = [
            ['heading-guard: on', t('fmHelpOn')],
            ['heading-guard: 方案A', t('fmHelpPreset')],
            ['heading-guard: on|方案A', t('fmHelpBoth')],
        ];
        for (const [code, text] of fmLines) {
            const line = box.createEl('div', { cls: 'heading-guard-fm-help-line' });
            line.createEl('code', { text: code });
            line.createEl('span', { text: text });
        }

        // ② 跳过注释（票 13）：一句说明 + 一个两行示例 + 两条含义
        box.createEl('div', { text: t('noteHelpIntro'), cls: 'heading-guard-fm-help-intro' });
        const sample = box.createEl('pre', { cls: 'heading-guard-fm-help-sample' });
        sample.createEl('code', { text: '# ' + t('noteSampleTitle') + '\n%%skip%%' });
        const noteLines = [
            ['%%skip%%', t('noteSkipLine')],
            ['%%skips%%', t('noteSkipsLine')],
        ];
        for (const [code, text] of noteLines) {
            const line = box.createEl('div', { cls: 'heading-guard-fm-help-line' });
            line.createEl('code', { text: code });
            line.createEl('span', { text: text });
        }
    }

    // 旧名保留成一层薄壳（万一别处还引用；也免得以后有人按旧名找不到）
    renderFrontmatterHelp(containerEl) { this.renderFooterHelp(containerEl); }

    // 弹确认框；只有点了「确定」才真恢复。
    confirmRestoreDefaults() {
        const t = (key) => this.plugin.t(key);
        const modal = new ConfirmResetModal(this.app, t('restoreConfirm'),
            { ok: t('ok'), cancel: t('cancel') });
        modal.onChoose = (answer) => {
            if (answer === 'ok') this.restoreDefaults();
        };
        modal.open();
    }

    async restoreDefaults() {
        const plugin = this.plugin;
        // 语言**不参与重置**（理由见 DEVELOPMENT 承重项 §16）：它是「这个用户的界面偏好」，
        // 重置时若突然换语言，面板会在你点完的一瞬间整个变成另一种语言。其余全部回默认值。
        const keepLanguage = plugin.settings.language;
        // 已保存的标题样式是**用户一条条攒出来的数据**，同样不参与重置 ——
        // 否则点一下「恢复默认设置」把样式全清了，那是数据丢失，不叫恢复默认。
        const keepPresets = plugin.settings.stylePresets;
        plugin.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        plugin.settings.language = keepLanguage;
        plugin.settings.stylePresets = keepPresets;
        await plugin.saveSettings();
        plugin.stopTimer();            // 默认 autoNumber=false，兜底时钟要关掉
        plugin.retryPending = false;
        plugin.syncBlockedNotified = false;
        plugin.lastSignature = null;   // 签名作废，下次触发重跑一遍
        this.display();                // 面板整体重绘成默认值
    }
}

module.exports = HeadingGuard;
module.exports.__internals = {
    DEFAULT_SETTINGS,
    STRINGS,
    NOTE_ENTER_DELAY_MS,
    EDIT_DEBOUNCE_MS,
    SUFFIX_CHOICES,
    SEPARATOR_CHOICES,
    BRACKET_CHOICES,
    SAMPLE_TITLES,
    lookup,
    detectObsidianLanguage,
    mapObsidianLanguage,
    normHeading,
    normForGate,
    linkNormAt,
    linkNormPt,
    linkKeyOld,
    parseRule,
    previewLines,
    buildNumberChain,
    diffSegments,
    previewRows,
    DiffConfirmModal,
    buildStrippers,
    stripNumbering,
    assembleTitle,
    readHeadingLine,
    readFreshHeading,
    markSkippedHeadings,
    effectiveLevels,
    styleIndexOf,
    headingSignature,
    planNumbering,
    planReset,
    stripOldNumber,
    decideNumber,
    normalizeFolder,
    vaultFolderPaths,
    FolderPickerModal,
    InputListSuggest,
    SUGGEST_LIMIT,
    templateFolderPreset,
    pick,
    sanitizeLevel,
    sanitizeStylePresets,
    snapshotStylePreset,
    applyStylePresetToSettings,
    renderIndex,
    toRoman,
    toHan,
    buildChange,
    escapeUrl,
    keyArray,
};
