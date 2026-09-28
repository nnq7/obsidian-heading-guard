'use strict';

const { Plugin, PluginSettingTab, Setting, Notice, MarkdownView, Modal, setIcon, debounce } = require('obsidian');

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
        scopeOptIn: '仅已启用的笔记（frontmatter 写 heading-guard: on）',
        exclude: '排除文件夹',
        excludeDesc: '一行一个文件夹路径（相对仓库根目录），这些文件夹里的笔记不自动编号。按路径前缀匹配：写 `notes` 不会影响 `notes2`。手动执行的两个命令不受此项限制',
        excludeFromTemplates: '从内置「模板」插件读到的模板文件夹已填入（读不到就留空）',
        stripOld: '编号前尝试去除旧编号',
        stripOldDesc: '编号之前，尝试删除旧编号，支持的格式有限，必要时请手动删除后重新编号',
        inheritSkip: '子标题是否继承父标题的跳过注释',
        inheritSkipDesc: '打开后，带 %%skip%% 的标题，它的子标题也一起跳过（不编号）；后面的下拉框决定要不要删掉这些旧编号',
        rules: '编号规则',
        preview: '样式预览',
        global: '全局编号尾缀',
        globalDesc: '为标题编号末尾添加尾缀符号，例如`1.2、`，顿号就是尾缀；选「无」表示不用全局尾缀，此时一至六级标题各自的尾缀设置说了算',
        none: '无',
        bracketAscii: '()-英文括号',
        bracketCjk: '（）-中文括号',
        withSpace: '尾缀后加空格',
        noSpace: '尾缀后不加空格',
        level: ['', '一级标题', '二级标题', '三级标题', '四级标题', '五级标题', '六级标题'],
        skip: '跳过编号',
        skipKeep: '不删除旧编号',
        skipStrip: '尝试删除旧编号',
        skipDesc: '该层级标题不编号，但子标题仍正常按规则编号',
        seq: '编号序列',
        seqDesc: '本级序号本身的写法；后面的下拉框决定要不要接在父级编号后面',
        numberInherit: '继承父标题编号',
        numberRestart: '重新编号',
        brackets: '前后缀括符',
        bracketsDesc: '包在编号外面的括号',
        sep: '编号层级间隔符',
        sepDesc: '本级编号与父级编号之间的分隔符',
        lvSuffix: '编号尾缀',
        lvSuffixDesc: '本级编号与标题内容之间的字符；仅在全局尾缀选「无」时生效',
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
        restoreConfirm: '是否要恢复默认设置？',
        ok: '确定',
        cancel: '取消',
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
        scopeOptIn: '僅已啟用的筆記（frontmatter 寫 heading-guard: on）',
        exclude: '排除資料夾',
        excludeDesc: '一行一個資料夾路徑（相對於倉庫根目錄），這些資料夾裡的筆記不自動編號。按路徑前綴匹配：寫 `notes` 不會影響 `notes2`。手動執行的兩個命令不受此項限制',
        excludeFromTemplates: '從內建「範本」外掛讀到的範本資料夾已填入（讀不到就留空）',
        stripOld: '編號前嘗試去除舊編號',
        stripOldDesc: '編號之前，嘗試刪除舊編號，支援的格式有限，必要時請手動刪除後重新編號',
        inheritSkip: '子標題是否繼承父標題的跳過註解',
        inheritSkipDesc: '開啟後，帶 %%skip%% 的標題，它的子標題也一起跳過（不編號）；後面的下拉框決定要不要刪掉這些舊編號',
        rules: '編號規則',
        preview: '樣式預覽',
        global: '全域編號尾綴',
        globalDesc: '為標題編號末尾添加尾綴符號，例如`1.2、`，頓號就是尾綴；選「無」表示不用全域尾綴，此時一至六級標題各自的尾綴設定說了算',
        none: '無',
        bracketAscii: '()-英文括號',
        bracketCjk: '（）-中文括號',
        withSpace: '尾綴後加空格',
        noSpace: '尾綴後不加空格',
        level: ['', '一級標題', '二級標題', '三級標題', '四級標題', '五級標題', '六級標題'],
        skip: '跳過編號',
        skipKeep: '不刪除舊編號',
        skipStrip: '嘗試刪除舊編號',
        skipDesc: '該層級標題不編號，但子標題仍正常按規則編號',
        seq: '編號序列',
        seqDesc: '本級序號本身的寫法；後面的下拉框決定要不要接在父級編號後面',
        numberInherit: '繼承父標題編號',
        numberRestart: '重新編號',
        brackets: '前後綴括符',
        bracketsDesc: '包在編號外面的括號',
        sep: '編號層級間隔符',
        sepDesc: '本級編號與父級編號之間的分隔符',
        lvSuffix: '編號尾綴',
        lvSuffixDesc: '本級編號與標題內容之間的字符；僅在全域尾綴選「無」時生效',
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
        restoreConfirm: '是否要恢復預設設定？',
        ok: '確定',
        cancel: '取消',
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
        scopeOptIn: 'Only opted-in notes (frontmatter `heading-guard: on`)',
        exclude: 'Excluded folders',
        excludeDesc: 'One folder path per line, relative to the vault root. Notes inside them are not numbered automatically. Matched by path prefix: `notes` does not affect `notes2`. The two manual commands ignore this setting.',
        excludeFromTemplates: 'Prefilled from the core Templates plugin folder (left empty if unavailable)',
        stripOld: 'Try to strip the old number before numbering',
        stripOldDesc: 'Before numbering, try to remove the old number. Only a few formats are supported; if needed, remove it by hand and number again.',
        inheritSkip: 'Do sub-headings inherit the parent heading\u2019s skip marker',
        inheritSkipDesc: 'When on, the sub-headings of a %%skip%% heading are skipped too (not numbered); the dropdown decides whether their old numbers are removed',
        rules: 'Numbering rules',
        preview: 'Style preview',
        global: 'Global heading suffix',
        globalDesc: 'Adds a suffix character to the end of the heading number, e.g. `1.2、` — the 、 itself is the suffix. Pick None to turn the global suffix off, leaving each level\u2019s own suffix in charge',
        none: 'None',
        bracketAscii: '() ascii parentheses',
        bracketCjk: '（） CJK parentheses',
        withSpace: 'Add a space after the suffix',
        noSpace: 'No space after the suffix',
        level: ['', 'Level 1 headings', 'Level 2 headings', 'Level 3 headings', 'Level 4 headings', 'Level 5 headings', 'Level 6 headings'],
        skip: 'Skip numbering',
        skipKeep: 'Keep the old number',
        skipStrip: 'Try to remove the old number',
        skipDesc: 'This level is not numbered, but its sub-headings still follow the numbering rules',
        seq: 'Number sequence',
        seqDesc: 'How this level\u2019s own number is written; the second dropdown decides whether it continues the parent number',
        numberInherit: 'Continue parent numbering',
        numberRestart: 'Restart numbering',
        brackets: 'Prefix and suffix brackets',
        bracketsDesc: 'Brackets wrapped around the number',
        sep: 'Level separator',
        sepDesc: 'Separator between this level\u2019s number and its parent\u2019s',
        lvSuffix: 'Heading suffix',
        lvSuffixDesc: 'The character between this level\u2019s number and the heading text; used only while the global suffix is set to None',
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
        restoreConfirm: 'Restore default settings?',
        ok: 'OK',
        cancel: 'Cancel',
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
const SKIP_MARKER = '%%skip%%';

// 作用范围（用户 2026-09-25）：
//   all   = 所有笔记都自动编号（原本的行为，默认）
//   optIn = 只有 frontmatter 里写了 `heading-guard: on` 的笔记才自动编号
// 手动执行的两个命令**不走**这个判定（用户明确要求：命令是用户亲自点的，就该生效）。
const SCOPE_CHOICES = ['all', 'optIn'];
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
        skipStrip: 'keep',   // 跳过编号时：「keep」不动 / 「strip」把旧编号删掉
        sequence: 'arabic',
        brackets: 'none',
        separator: level === 1 ? 'none' : '.',
        suffix: { enabled: false, char: 'none', space: true },
        // 'inherit'（默认，= 原来行为：编号接在父级后面） / 'restart'（本级从 1 开始，不带父级前缀）
        numbering: 'inherit',
    };
}

const DEFAULT_SETTINGS = {
    language: 'zh-CN',
    autoNumber: false,
    scanInterval: DEFAULT_SCAN_INTERVAL,
    stripOldNumbers: true,         // 编号前先尝试剥掉旧编号（用户 2026-09-28 要求：默认开启）
    inheritSkip: false,            // %%skip%% 的子树是否一起跳过（默认关闭）
    inheritSkipStrip: 'keep',      // 继承跳过的那几行：keep 不动 / strip 删掉旧编号
    scope: 'all',                  // 自动编号的作用范围，见 SCOPE_CHOICES
    excludeFolders: [],            // 不自动编号的文件夹（相对仓库根），按路径前缀匹配
    globalSuffix: { char: 'none', space: true },   // 没有 enabled：选「无」就等于关掉（见 parseRule）
    levels: {
        1: defaultLevel(1), 2: defaultLevel(2), 3: defaultLevel(3),
        4: defaultLevel(4), 5: defaultLevel(5), 6: defaultLevel(6),
    },
};

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

// 严格识别罗马数字：只收规范写法（IV 对、IIII 与 VX 错）。
// 反算一致才算数 —— 靠这一条把 `XML` / `MAX` / `CIVIL` 这类英文缩写挡在外面：
// 「字符都在 MVCDIXL 里」是不够的（`XM` 也全在集合里，但 XML 不是罗马数字）。
function parseRoman(text) {
    if (!/^[IVXLCDM]+$/.test(text)) return null;
    const value = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < text.length; i++) {
        const cur = value[text[i]];
        const next = value[text[i + 1]];
        total += next && cur < next ? -cur : cur;
    }
    if (total <= 0 || total > 3999) return null;
    return toRoman(total) === text ? total : null;
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
function stripOldNumber(text, total) {   // eslint-disable-line no-unused-vars
    const hit = decideNumber(text);
    return hit === null ? null : hit.content;
}
/* ─────────────────────── 规则解析与文本组装 ─────────────────────── */

// 归一化：去首尾空白 + Unicode NFC。标题与链接子路径两边都用它，比对才一致。
function normHeading(text) {
    return text == null ? '' : String(text).trim().normalize('NFC');
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

// 把某一级的设置折算成拼装用的四个片段。tail 就是「分隔符」：
// 关闭尾缀时它是一个空格，开启时是尾缀字符（可再跟一个空格）。
function parseRule(settings, level) {
    const own = settings.levels[level];
    const global = settings.globalSuffix;
    let char = '';
    let space = true;
    // 全局尾缀生不生效，只看它选没选「无」——没有单独的开关（用户 2026-09-24 定：
    // 开关与下拉里的「无」本来就是同一件事，只留一个）。
    if (global.char !== 'none') {
        char = global.char;
        space = global.space;
    } else if (own.suffix.enabled) {
        if (own.suffix.char !== 'none') char = own.suffix.char;
        space = own.suffix.space;
    }
    const pair = own.brackets === 'none' ? '' : own.brackets;
    return {
        front: pair.slice(0, 1),
        back: pair.slice(1),
        tail: char + (space ? ' ' : ''),
        separator: level === 1 || own.separator === 'none' ? '' : own.separator,
    };
}

// 预览：把固定的六行样例按当前规则跑一遍（不去旧编号、不校验 —— 样例是定死的）。
function previewLines(settings) {
    const rules = [null];
    const numbers = ['', '', '', '', '', '', ''];
    for (let level = 1; level <= 6; level++) {
        const rule = parseRule(settings, level);
        rules[level] = rule;
        const parent = level === 1 ? '' : numbers[level - 1];
        // 「重新编号」不接父级前缀，本级从 1 开始（默认是继承）
        const restart = settings.levels[level].numbering === 'restart';
        numbers[level] = (parent && !restart ? parent + rule.separator : '')
            + renderIndex(settings.levels[level].sequence, 1);
    }
    const lines = [];
    for (let level = 1; level <= 6; level++) {
        const rule = rules[level];
        const title = SAMPLE_TITLES[level - 1];
        const body = settings.levels[level].skip
            ? title
            : rule.front + numbers[level] + rule.back + rule.tail + title;
        lines.push('#'.repeat(level) + ' ' + body);
    }
    return lines;
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
    if (!read || read.level !== heading.level || normHeading(read.text) !== normHeading(heading.heading)) {
        return null;
    }
    return { line, text: read.text };
}

// 标题签名：等级 + 顺序（由数组顺序体现）+ 内容 + **下一行有没有 %%skip%%**。
// 标记在标题的下一行、不属于标题文字，早期版本漏了它，于是「加上标记再删掉」签名不变，
// 门禁直接 return，标题再也编不上号（用户实测报的 bug）。凡是 planNumbering 会读的东西都必须进签名。
function headingSignature(headings, getLine) {
    let out = '';
    for (const heading of headings) {
        const next = getLine ? getLine(heading.position.start.line + 1) : null;
        out += heading.level + '\u0001' + heading.heading
            + (next !== null && next.includes(SKIP_MARKER) ? '\u0003skip' : '')
            + '\u0002';
    }
    return out;
}

/* ─────────────────────────── 编号规划 ─────────────────────────── */

// 返回每一行的编号方案；返回 null 表示缓存与编辑器不同步，本轮不应写任何东西。
function planNumbering(headings, settings, getLine) {
    const rules = [null];
    for (let level = 1; level <= 6; level++) rules[level] = parseRule(settings, level);
    const strippers = buildStrippers(settings);
    // 第 1 项守卫要拿它当上限（本次规划覆盖到的标题数）。
    const totalHeadings = headings.length;

    const counters = [0, 0, 0, 0, 0, 0, 0];
    const numbers = ['', '', '', '', '', '', ''];
    const plan = [];

    // 「%%skip%% 的子树一起跳过」（2026-09-24 新增，默认关闭）
    const inherit = !!settings.inheritSkip;
    const inheritStrip = settings.inheritSkipStrip === 'strip';
    let skipFrom = 0;   // >0 = 正处在一棵被标记的子树里，值是那棵子树的根等级

    for (const heading of headings) {
        const level = heading.level;
        const fresh = readFreshHeading(heading, getLine);
        if (!fresh) return null;

        const following = getLine(fresh.line + 1);
        const marked = following !== null && following.includes(SKIP_MARKER);

        // 走出子树的判据：出现等级 <= 子树根的标题（兄弟或更上层）
        if (skipFrom && level <= skipFrom) skipFrom = 0;
        // 开关打开时，带标记的这一行也把它的子树标成跳过（已经是子树里就不重复标）
        if (marked && inherit && !skipFrom) skipFrom = level;

        if (marked || skipFrom) {
            // 「尝试删除旧编号」管的是**这一档覆盖到的所有行**（用户 2026-09-24 实测后确认）：
            //   · 带 %%skip%% 的那一行本身 —— 打开继承开关时也一起删。这一条**修正了需求文档
            //     §3.5.1「即使它自身已有编号，也不去改变或删除」**，只在选了「尝试删除旧编号」时成立；
            //     选默认的「不删除旧编号」时，那一行仍然完全不动。
            //   · 继承跳过的那些行。
            // inherit 关着时一律不删（此时下拉框在 UI 上是禁用的，存量值不许漏出来）。
            const inScope = marked ? inherit : skipFrom > 0;
            if (inScope && inheritStrip) {
                const cleaned = stripOldNumber(heading.heading, totalHeadings);
                const next = cleaned === null ? heading.heading : cleaned;
                if (next !== fresh.text) {
                    plan.push({ level, line: fresh.line, old: fresh.text, next, changed: true });
                }
            }
            continue; // 当它不存在（不占号、不作父级）
        }

        counters[level]++;
        for (let k = level + 1; k <= 6; k++) {
            counters[k] = 0;
            numbers[k] = '';
        }
        let parent = '';
        for (let k = level - 1; k >= 1; k--) {
            if (numbers[k]) { parent = numbers[k]; break; }
        }
        const rule = rules[level];
        // 「重新编号」= 本级从 1 开始、不带父级前缀（用户 2026-09-24 新增，默认「继承父标题编号」）。
        // 只影响这一级自己：比它深的级别仍拿 numbers[本级] 当父级，照常往下拼。
        const restart = settings.levels[level].numbering === 'restart';
        numbers[level] = (parent && !restart ? parent + rule.separator : '')
            + renderIndex(settings.levels[level].sequence, counters[level]);

        if (settings.levels[level].skip) {
            // 跳过编号时，这一级还可能要「尝试删除旧编号」（用户 2026-09-24 新增）：
            // 只把编号部分删掉、重命名，不写任何新编号。用的还是同一个 stripOldNumber。
            if (settings.levels[level].skipStrip === 'strip') {
                const cleaned = stripOldNumber(heading.heading, totalHeadings);
                const next = cleaned === null ? heading.heading : cleaned;
                if (next !== fresh.text) {
                    plan.push({ level, line: fresh.line, old: fresh.text, next, changed: true });
                }
            }
            continue; // 号已经占上了
        }

        let title = stripNumbering(heading.heading, strippers, level);
        // 「编号前尝试去除旧编号」：剥掉当前编号后，标题文字里可能还压着更早的旧编号残留
        // （`II 1、 设置界面` 剥掉 `II ` 之后只剩 `1、 设置界面`）。
        // 这一步必须**无条件**做 —— 挂在「拼装结果与原文字不同」上会漏掉这种情况：
        // 残留恰好让拼装结果等于原文，于是永远卡在那儿。
        if (settings.stripOldNumbers) {
            const cleaned = stripOldNumber(title, totalHeadings);
            if (cleaned !== null) title = cleaned;
        }
        const next = assembleTitle(rule, numbers[level], title);
        plan.push({ level, line: fresh.line, old: fresh.text, next, changed: next !== fresh.text });
    }
    return plan;
}

// 重置用的方案：只保留真的能去掉编号的那些行。
function planReset(headings, getLine) {
    const plan = [];
    const totalHeadings = headings.length;   // 第 1 项守卫的上限，同 planNumbering
    for (const heading of headings) {
        const fresh = readFreshHeading(heading, getLine);
        if (!fresh) return null;

        const following = getLine(fresh.line + 1);
        if (following !== null && following.includes(SKIP_MARKER)) continue; // 标记为不动的标题同样不重置

        const next = stripOldNumber(heading.heading, totalHeadings);
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
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.scheduleNoteEnter()));
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
        const pick = (list, value, fallback) => (list.indexOf(value) >= 0 ? value : fallback);
        const levels = {};
        for (let level = 1; level <= 6; level++) {
            const base = defaultLevel(level);
            const saved = (raw.levels && raw.levels[level]) || {};
            base.skip = !!saved.skip;
            base.skipStrip = saved.skipStrip === 'strip' ? 'strip' : 'keep';
            base.sequence = SEQUENCE_IDS.indexOf(saved.sequence) >= 0 ? saved.sequence : base.sequence;
            base.brackets = pick(BRACKET_CHOICES, saved.brackets, base.brackets);
            base.separator = pick(SEPARATOR_CHOICES, saved.separator, base.separator);
            base.numbering = saved.numbering === 'restart' ? 'restart' : 'inherit';
            // 设置里压根没有这个字段（首次安装 / 老版本升级）时保留默认值
            base.suffix = saved.suffix
                ? {
                    enabled: !!saved.suffix.enabled,
                    char: pick(SUFFIX_CHOICES, saved.suffix.char, base.suffix.char),
                    space: saved.suffix.space !== false,
                }
                : base.suffix;
            levels[level] = base;
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
            inheritSkip: !!raw.inheritSkip,
            inheritSkipStrip: raw.inheritSkipStrip === 'strip' ? 'strip' : 'keep',
            scope: pick(SCOPE_CHOICES, raw.scope, 'all'),
            // 只收字符串、去掉空行 —— 存盘内容不可信（用户手改过 / 旧版本残留），必须净一次
            excludeFolders: Array.isArray(raw.excludeFolders)
                ? raw.excludeFolders
                    .filter((item) => typeof item === 'string')
                    .map((item) => normalizeFolder(item))
                    .filter((item) => item !== '')
                : [],
            globalSuffix: raw.globalSuffix
                ? {
                    char: pick(SUFFIX_CHOICES, raw.globalSuffix.char, 'none'),
                    space: raw.globalSuffix.space !== false,
                }
                : Object.assign({}, DEFAULT_SETTINGS.globalSuffix),
            levels,
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
        const front = this._frontmatterValue(file);
        if (front === false || front === 'off') return false;
        if (front === true || front === 'on') return true;
        const path = file.path.replace(/\\/g, '/');
        for (const folder of this.settings.excludeFolders) {
            if (path.startsWith(folder)) return false;
        }
        return this.settings.scope === 'all';
    }

    // 读 frontmatter 里的 heading-guard 值，归一成 true / false / 'on' / 'off' / undefined。
    // 用 getFileCache 的 frontmatter（编辑器里刚改的那一下可能还没进缓存，那就当作没写 —— 保守）。
    _frontmatterValue(file) {
        const cache = this.app.metadataCache.getFileCache(file);
        const raw = cache && cache.frontmatter ? cache.frontmatter[SCOPE_KEY] : undefined;
        if (raw === true || raw === false) return raw;
        if (typeof raw === 'string') {
            const text = raw.trim().toLowerCase();
            if (text === 'on' || text === 'true' || text === 'yes') return 'on';
            if (text === 'off' || text === 'false' || text === 'no') return 'off';
        }
        return undefined;
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
        if (!editor || typeof editor.getCursor !== 'function') return false;
        const cursor = editor.getCursor();
        if (!cursor || typeof cursor.line !== 'number') return false;
        const line = editor.getLine(cursor.line);
        if (line === null || !readHeadingLine(line)) return false;
        return this._headingsOf(file).some((h) => h.position.start.line === cursor.line);
    }

    // force = 刚切到这篇笔记 → 不看签名，直接跑。
    // 否则先比标题签名（等级 + 顺序 + 内容），一模一样就什么都不做。
    checkActiveNote(force) {
        if (!this.settings.autoNumber) return;
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
            + headingSignature(this._headingsOf(view.file), this._lineReader(view.editor));
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
            const plan = planNumbering(this._headingsOf(file), this.settings, this._lineReader(editor));
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
            const renames = todo.map((item) => ({ from: item.old, to: item.next }));
            // ⚠️ 顺序不能换：本文件链接的 offset 必须在标题改动**之前**采集（见 collectSelfLinkEdits）
            const selfEdits = this.collectSelfLinkEdits(file, renames, file.path);
            this._write(editor, todo, selfEdits);
            const synced = await this.syncHeadingLinks(file, renames, file.path);
            synced.links += selfEdits.length;
            // 自链接改动落在**本文件**里：`syncHeadingLinks` 只统计了别的文件，
            // 本文件没被算进去就 +1（算进去过就不重复加）。
            if (selfEdits.length > 0 && !synced.countedSelf) synced.files += 1;
            if (manual) {
                new Notice(this.t('done', todo.length));
                if (synced.links > 0) new Notice(this.t('linksUpdated', synced));
            }
        } catch (err) {
            // 唯一一道兜底：链接同步走的是 Obsidian 内部接口，跨版本可能抛错；
            // 定时器里放任异常会每次都刷一条错误。
            console.error('[heading-guard] 编号失败：', err);
        }
    }

    async runReset(file, editor, manual) {
        try {
            const plan = planReset(this._headingsOf(file), this._lineReader(editor));
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
            const renames = plan.map((item) => ({ from: item.old, to: item.next }));
            // 标题文字变了，指向它的链接同样要跟着走。本文件那几条并进同一个事务（理由见 _write）
            const selfEdits = this.collectSelfLinkEdits(file, renames, file.path);
            this._write(editor, plan, selfEdits);
            const synced = await this.syncHeadingLinks(file, renames, file.path);
            synced.links += selfEdits.length;
            if (selfEdits.length > 0 && !synced.countedSelf) synced.files += 1;
            if (manual) {
                new Notice(this.t('resetDone', plan.length));
                if (synced.links > 0) new Notice(this.t('linksUpdated', synced));
            }
        } catch (err) {
            console.error('[heading-guard] 重置编号失败：', err);
        }
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

// 恢复默认设置的确认框。**确定在左、取消在右** —— 与 Obsidian 自带「主按钮在右」的惯例相反，
// 这是用户指定的顺序，别按惯例改回去。
class ConfirmResetModal extends Modal {
    constructor(app, text, labels) {
        super(app);
        this.text = text;
        this.labels = labels;
        this.answer = null;      // 'ok' | 'cancel'，离线测试拿它断言
        this.onChoose = null;
    }

    onOpen() {
        this.contentEl.createEl('p', { text: this.text, cls: 'heading-guard-confirm-text' });
        // 按钮行：DOM 顺序就是「确定、取消」，配合 CSS 的 flex-end → 确定在左、取消在右
        const row = this.contentEl.createEl('div', { cls: 'heading-guard-confirm-buttons' });
        row.createEl('button', { text: this.labels.ok, cls: 'mod-cta' })
            .addEventListener('click', () => this.choose('ok'));
        row.createEl('button', { text: this.labels.cancel })
            .addEventListener('click', () => this.choose('cancel'));
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
        containerEl.empty();
        containerEl.addClass('heading-guard-settings');

        // 预览框要跟着设置走，所以「改设置」统一走这个入口
        let previewEl = null;
        const renderPreview = () => {
            if (previewEl) previewEl.setText(previewLines(settings).join('\n'));
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

        // 受「全局尾缀」影响的分级尾缀控件。用数组登记而不是直接引用：
        // 这样控件构造顺序与回调触发时机都不会影响结果。
        const levelSuffixRows = [];
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
        new Setting(containerEl)
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
            });

        settingHeading(containerEl, t('rules'));

        // 「子标题是否继承父标题的跳过注释」属「编号规则」栏 → 放在本栏标题**下面**（用户 2026-09-28 要求）。
        // 原先它渲染在标题之前，看起来像属于上面那一组设置。
        let inheritMode = null;
        const inheritRow = new Setting(containerEl)
            .setName(t('inheritSkip'))
            .setDesc(t('inheritSkipDesc'))
            .addToggle((tg) => tg.setValue(settings.inheritSkip).onChange(async (value) => {
                settings.inheritSkip = value;
                await save();
                if (inheritMode) inheritMode.setDisabled(!value); // 关掉 → 下拉框不可用
            }))
            .addDropdown((dd) => {
                inheritMode = dd;
                dd.addOption('keep', t('skipKeep')).addOption('strip', t('skipStrip'))
                    .setValue(settings.inheritSkipStrip).setDisabled(!settings.inheritSkip)
                    .onChange(async (value) => {
                        settings.inheritSkipStrip = value;
                        await save();
                    });
            });
        // 开关与下拉框必须**并排在同一行**（用户 2026-09-28 要求，与各级「跳过编号」一致）。
        inheritRow.settingEl.addClass('heading-guard-inline-row');

        const global = settings.globalSuffix;
        let globalSpace = null;
        // 全局尾缀生不生效，只看它选没选「无」——没有单独的开关（用户 2026-09-24 定）。
        const globalSuffixActive = () => settings.globalSuffix.char !== 'none';
        // 「谁可编辑」只在这一个函数里算，避免「初始渲染」与「改完选项」两套判断跑偏。
        const refreshSuffixRows = () => {
            const active = globalSuffixActive();
            if (globalSpace) globalSpace.setDisabled(!active); // 全局选「无」→ 这个空格选项没有意义
            for (const row of levelSuffixRows) {
                // 全局生效 → 分级尾缀整行禁用；否则看该级自己的开关
                const editable = !active && settings.levels[row.level].suffix.enabled;
                row.toggle.setDisabled(active);
                row.char.setDisabled(!editable);
                row.space.setDisabled(!editable);
            }
        };
        new Setting(containerEl)
            .setName(t('global'))
            .setDesc(t('globalDesc'))
            .addDropdown((dd) => {
                pickDropdown(dd, SUFFIX_CHOICES, symbolLabel, global.char, async (value) => {
                    global.char = value;
                    await save();
                    refreshSuffixRows(); // 全局换挡 → 分级尾缀的可用性跟着变
                });
            })
            .addDropdown((dd) => {
                globalSpace = dd;
                dd.addOption('space', t('withSpace')).addOption('none', t('noSpace'))
                    .setValue(global.space ? 'space' : 'none')
                    .onChange(async (value) => {
                        global.space = value === 'space';
                        await save();
                    });
            });

        settingHeading(containerEl, t('preview'), 2);
        previewEl = containerEl.createEl('pre', { cls: 'heading-guard-preview' });

        for (let level = 1; level <= 6; level++) {
            const own = settings.levels[level];
            // 每个等级一个原生 <details>：默认折叠（用户要求），点标题展开
            const group = containerEl.createEl('details', { cls: 'heading-guard-level' });
            group.createEl('summary', { text: t('level')[level] });

            let skipMode = null;
            const skipRow = new Setting(group)
                .setName(t('skip'))
                .setDesc(t('skipDesc'))
                .addToggle((tg) => tg.setValue(own.skip).onChange(async (value) => {
                    own.skip = value;
                    await save();
                    if (skipMode) skipMode.setDisabled(!value); // 关掉跳过 → 下拉不可用
                }))
                .addDropdown((dd) => {
                    skipMode = dd;
                    dd.addOption('keep', t('skipKeep')).addOption('strip', t('skipStrip'))
                        .setValue(own.skipStrip).setDisabled(!own.skip)
                        .onChange(async (value) => {
                            own.skipStrip = value;
                            await save();
                        });
                });
            // 开关与下拉框必须**并排在同一行**（用户 2026-09-28 要求）。
            // 面板的 .setting-item-control 默认 flex-wrap: wrap，窄面板下这两个控件
            // 会被挤成两行；靠这个类在 styles.css 里改回 nowrap
            //（见 .heading-guard-inline-row 那条规则）。
            skipRow.settingEl.addClass('heading-guard-inline-row');

            const seqRow = new Setting(group)
                .setName(t('seq'))
                .setDesc(t('seqDesc'))
                .addDropdown((dd) => {
                    for (const id of SEQUENCE_IDS) dd.addOption(id, SEQUENCE_SAMPLES[id]);
                    dd.setValue(own.sequence).onChange(async (value) => {
                        own.sequence = value;
                        await save();
                    });
                });
            // 一级标题没有父级，「继承 / 重新编号」无从谈起 → 只有二~六级挂这个下拉框
            if (level > 1) {
                seqRow.addDropdown((dd) => {
                    dd.addOption('inherit', t('numberInherit')).addOption('restart', t('numberRestart'))
                        .setValue(own.numbering).onChange(async (value) => {
                            own.numbering = value;
                            await save();
                        });
                });
            }

            new Setting(group)
                .setName(t('brackets'))
                .setDesc(t('bracketsDesc'))
                .addDropdown((dd) => pickDropdown(dd, BRACKET_CHOICES, bracketLabel, own.brackets, async (value) => {
                    own.brackets = value;
                    await save();
                }));

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

            const row = { level: level };
            new Setting(group)
                .setName(t('lvSuffix'))
                .setDesc(t('lvSuffixDesc'))
                .addToggle((tg) => {
                    row.toggle = tg;
                    tg.setValue(own.suffix.enabled)
                        .onChange(async (value) => {
                            own.suffix.enabled = value;
                            await save();
                            // 本级尾缀关掉 → 字符与空格两个下拉都不可编辑（用户要求）
                            refreshSuffixRows();
                        });
                })
                .addDropdown((dd) => {
                    row.char = dd;
                    pickDropdown(dd, SUFFIX_CHOICES, symbolLabel, own.suffix.char, async (value) => {
                        own.suffix.char = value;
                        await save();
                    });
                })
                .addDropdown((dd) => {
                    row.space = dd;
                    dd.addOption('space', t('withSpace')).addOption('none', t('noSpace'))
                        .setValue(own.suffix.space ? 'space' : 'none')
                        .onChange(async (value) => {
                            own.suffix.space = value === 'space';
                            await save();
                        });
                    levelSuffixRows.push(row);
                });
        }

        refreshSuffixRows(); // 初始可用性统一在这里落地，不用在构造时逐个 setDisabled
        renderPreview();
        this.renderRestoreRow(containerEl); // 最后一行：恢复默认设置
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
            if (typeof setIcon === 'function') setIcon(b.buttonEl, RESET_ICON);
            b.buttonEl.createEl('span', { text: t('restoreDefaults') });
        });
    }

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
        plugin.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        plugin.settings.language = keepLanguage;
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
    STRINGS,
    DEFAULT_SETTINGS,
    DEFAULT_SCAN_INTERVAL,
    MIN_SCAN_INTERVAL,
    MAX_SCAN_INTERVAL,
    NOTE_ENTER_DELAY_MS,
    EDIT_DEBOUNCE_MS,
    SKIP_MARKER,
    SUFFIX_CHOICES,
    SEPARATOR_CHOICES,
    BRACKET_CHOICES,
    SAMPLE_TITLES,
    SEQUENCES,
    SEQUENCE_IDS,
    SEQUENCE_SAMPLES,
    lookup,
    detectObsidianLanguage,
    mapObsidianLanguage,
    normHeading,
    linkNormAt,
    linkNormPt,
    linkKeyOld,
    parseRule,
    previewLines,
    buildStrippers,
    stripNumbering,
    assembleTitle,
    readHeadingLine,
    readFreshHeading,
    headingSignature,
    planNumbering,
    planReset,
    stripOldNumber,
    decideNumber,
    normalizeFolder,
    templateFolderPreset,
    SCOPE_CHOICES,
    renderIndex,
    toRoman,
    toHan,
    HAN_SETS,
    buildChange,
    escapeUrl,
    keyArray,
};
