'use strict';

const { Plugin, PluginSettingTab, Setting, Notice, MarkdownView, Modal, setIcon } = require('obsidian');

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
        stripOld: '编号前尝试去除旧编号',
        stripOldDesc: '编号之前，尝试删除旧编号，支持的格式有限，必要时请手动删除后重新编号',
        inheritSkip: '子标题是否继承父标题的跳过注释',
        inheritSkipDesc: '打开后，带 %%skip%% 的标题，它的子标题也一起跳过（不编号、不占号）；后面的下拉框决定这一整块（含带 %%skip%% 的那一行）要不要顺手删掉旧编号',
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
        skipDesc: '该等级标题不编号，但下面的子标题仍按规则编号；后面的下拉框决定跳过时要不要把旧编号删掉',
        seq: '编号序列',
        seqDesc: '本级序号本身的写法；后面的下拉框决定要不要接在父级编号后面',
        numberInherit: '继承父标题编号',
        numberRestart: '重新编号',
        brackets: '前后缀括符',
        bracketsDesc: '包在编号外面的括号',
        sep: '编号层级间隔符',
        sepDesc: '本级编号与父级编号之间的分隔符；一级标题不生效',
        lvSuffix: '编号尾缀',
        lvSuffixDesc: '本级的分隔符；仅在全局尾缀选「无」时生效',
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
        stripOld: '編號前嘗試去除舊編號',
        stripOldDesc: '編號之前，嘗試刪除舊編號，支援的格式有限，必要時請手動刪除後重新編號',
        inheritSkip: '子標題是否繼承父標題的跳過註解',
        inheritSkipDesc: '開啟後，帶 %%skip%% 的標題，它的子標題也一起跳過（不編號、不佔號）；後面的下拉框決定這一整塊（含帶 %%skip%% 的那一行）要不要順手刪掉舊編號',
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
        skipDesc: '該等級標題不編號，但下面的子標題仍按規則編號；後面的下拉框決定跳過時要不要把舊編號刪掉',
        seq: '編號序列',
        seqDesc: '本級序號本身的寫法；後面的下拉框決定要不要接在父級編號後面',
        numberInherit: '繼承父標題編號',
        numberRestart: '重新編號',
        brackets: '前後綴括符',
        bracketsDesc: '包在編號外面的括號',
        sep: '編號層級間隔符',
        sepDesc: '本級編號與父級編號之間的分隔符；一級標題不生效',
        lvSuffix: '編號尾綴',
        lvSuffixDesc: '本級的分隔符；僅在全域尾綴選「無」時生效',
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
        stripOld: 'Try to strip the old number before numbering',
        stripOldDesc: 'Before numbering, try to remove the old number. Only a few formats are supported; if needed, remove it by hand and number again.',
        inheritSkip: 'Do sub-headings inherit the parent heading\u2019s skip marker',
        inheritSkipDesc: 'When on, a %%skip%% heading skips its sub-headings too (not numbered, take no index); the dropdown decides whether that whole block \u2014 including the marked heading itself \u2014 also gets its old numbers removed',
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
        skipDesc: 'This level is not numbered, but its sub-headings are still numbered; the dropdown decides whether the old number is removed',
        seq: 'Number sequence',
        seqDesc: 'How this level\u2019s own number is written; the second dropdown decides whether it continues the parent number',
        numberInherit: 'Continue parent numbering',
        numberRestart: 'Restart numbering',
        brackets: 'Prefix and suffix brackets',
        bracketsDesc: 'Brackets wrapped around the number',
        sep: 'Level separator',
        sepDesc: 'Separator between this level\u2019s number and its parent\u2019s; not used for level 1',
        lvSuffix: 'Heading suffix',
        lvSuffixDesc: 'The separator for this level; used only while the global suffix is set to None',
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

// 尾缀 / 间隔符 / 括符的候选都锁死，值用 'none' 表示「无」。
const SUFFIX_CHOICES = ['none', '、', '.', '·', '-', '_', ':', ')', '>', '」', '』', ';', '~', '】'];
const SEPARATOR_CHOICES = ['none', '.', '-', '·', '_', ':', '~', '<', '>'];
const BRACKET_CHOICES = ['none', '()', '（）', '<>', '《》', '「」', '『』', '【】'];

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
    stripOldNumbers: false,
    inheritSkip: false,            // %%skip%% 的子树是否一起跳过（默认关闭）
    inheritSkipStrip: 'keep',      // 继承跳过的那几行：keep 不动 / strip 删掉旧编号
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

/* ──────────────── 去除旧编号（两条路径各有一套规则） ──────────────── */

// 「编号前尝试去除旧编号」与「重置标题编号」共用**同一个**算法（用户 2026-09-24 重新给定的规格）：
//   ① 从前往后优先匹配**第一个空格**（紧贴行尾的空格不算），取空格及其之前的内容；
//   ② 没有可用空格时，从后往前找 `、-)_>」』;~】` 里的任一个，取该符号及其之前的内容；
//   ③ 校验切下来的部分：含「20 个中文数字之外的中文」或「连续两个英文字母」就不删。
// **只切一刀，不迭代。** 迭代一度加过，被真实语料证伪（`2.6 78.6位` → `6位`）——
// `3.1.1.1 (1) ` 与 `8 ` 结构同形，迭代永远分不清「这里是编号」还是「这里是正文」。
// 符号表里**故意没有 `.`**：`3、78.21线` 要从 `、` 切开、不能从 `78.` 切开（规格里的例子 5）。
// 白名单里的中文数字共 20 个（一…九、壹…玖、十、拾），其余中文一律视为「这是标题文字」。
const CN_NUMERALS = /[一二三四五六七八九壹贰叁肆伍陆柒捌玖十拾]/g;
const CUT_SYMBOLS = '、-)_>」』;~】';
const TWO_LATIN = /[A-Za-z]{2}/;
const CJK = /[\u4e00-\u9fff]/;

// 返回 null = 不动；返回字符串 = 去掉旧编号后的标题文字。
function stripOldNumber(text) {
    let end = text.length;
    while (end > 0 && text.charAt(end - 1) === ' ') end--;
    if (end === 0) return null;

    let cut = text.indexOf(' ');
    if (cut >= 0 && cut < end) {
        // 连续空格整段吃掉（2026-09-24 追加）：`1     标题` → `标题`，不留前导空格
        while (text.charAt(cut + 1) === ' ') cut++;
    } else {
        cut = -1;
        for (let i = end - 1; i >= 0; i--) {
            if (CUT_SYMBOLS.indexOf(text.charAt(i)) >= 0) { cut = i; break; }
        }
    }
    if (cut < 0) return null;

    const numberPart = text.slice(0, cut + 1);
    const rest = text.slice(cut + 1);
    if (rest.replace(/\s/g, '') === '') return null;                       // 规格外的一道保险：别把标题清空
    if (CJK.test(numberPart.replace(CN_NUMERALS, ''))) return null;        // 含非数字中文 → 不动
    if (TWO_LATIN.test(numberPart)) return null;                           // 含连续两个英文字母 → 不动
    return rest;
}

/* ─────────────────────── 规则解析与文本组装 ─────────────────────── */

// 归一化：去首尾空白 + Unicode NFC。标题与链接子路径两边都用它，比对才一致。
function normHeading(text) {
    return text == null ? '' : String(text).trim().normalize('NFC');
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
                const cleaned = stripOldNumber(heading.heading);
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
                const cleaned = stripOldNumber(heading.heading);
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
            const cleaned = stripOldNumber(title);
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
    for (const heading of headings) {
        const fresh = readFreshHeading(heading, getLine);
        if (!fresh) return null;

        const following = getLine(fresh.line + 1);
        if (following !== null && following.includes(SKIP_MARKER)) continue; // 标记为不动的标题同样不重置

        const next = stripOldNumber(heading.heading);
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
            stripOldNumbers: !!raw.stripOldNumbers,
            inheritSkip: !!raw.inheritSkip,
            inheritSkipStrip: raw.inheritSkipStrip === 'strip' ? 'strip' : 'keep',
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

    // force = 刚切到这篇笔记 → 不看签名，直接跑。
    // 否则先比标题签名（等级 + 顺序 + 内容），一模一样就什么都不做。
    checkActiveNote(force) {
        if (!this.settings.autoNumber) return;
        const view = this._activeMarkdown();
        if (!view) return;
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
    _write(editor, items) {
        editor.transaction({
            changes: items.map((item) => ({
                from: { line: item.line, ch: item.level + 1 },
                to: { line: item.line, ch: item.level + 1 + item.old.length },
                text: item.next,
            })),
        });
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
            this._write(editor, todo);
            const synced = await this.syncHeadingLinks(file, todo.map((item) => ({ from: item.old, to: item.next })));
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
            this._write(editor, plan);
            // 标题文字变了，指向它的链接同样要跟着走
            const synced = await this.syncHeadingLinks(file, plan.map((item) => ({ from: item.old, to: item.next })));
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
    async syncHeadingLinks(file, renames) {
        const mc = this.app.metadataCache;
        // 返回实际改写了几条链接、涉及几个文件 —— 用来弹「更新M个文件中的N条链接」。
        // 正常路径走不到这个提前 return（readyToRename 已经拦过），留着是双保险。
        const synced = { links: 0, files: 0 };
        if (!this.canSyncLinks()) return synced;

        // 官方比对标题时两边都 toLowerCase（大小写不敏感），这里对齐它。
        // ⚠️ 只在这一处 lowercase —— **不能改 normHeading 本身**：那是「陈旧保护」共用的，
        // 一旦它也不敏感，编辑器里的 `## ABC` 与缓存里的 `abc` 会被当成同步，
        // 插件就会按缓存的拼写把标题文本改掉（静默改大小写）。
        const byOld = new Map();
        for (const rename of renames) byOld.set(normHeading(rename.from).toLowerCase(), rename.to);

        const byPath = new Map();
        mc.iterateAllRefs((sourcePath, ref) => {
            const bar = ref.link.indexOf('#');
            if (bar < 0) return;
            const sub = ref.link.slice(bar + 1);
            if (!sub || sub.charAt(0) === '^') return; // 块引用不动
            const next = byOld.get(normHeading(sub).toLowerCase());
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
                    .onChange(async (value) => {
                        settings.scanInterval = value;
                        setIntervalLabel(value);
                        await save();
                        plugin.startTimer(); // 改了间隔就按新周期重开时钟
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

        let inheritMode = null;
        new Setting(containerEl)
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

        settingHeading(containerEl, t('rules'));

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
            group.createEl('summary', { cls: 'heading-guard-level-summary', text: t('level')[level] });

            let skipMode = null;
            new Setting(group)
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

            new Setting(group)
                .setName(t('sep'))
                .setDesc(t('sepDesc'))
                .addDropdown((dd) => {
                    pickDropdown(dd, SEPARATOR_CHOICES, symbolLabel, own.separator, async (value) => {
                        own.separator = value;
                        await save();
                    });
                    dd.setDisabled(level === 1); // 一级标题没有父级，这一项不生效
                });

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
    CUT_SYMBOLS,
    renderIndex,
    toRoman,
    toHan,
    HAN_SETS,
    buildChange,
    escapeUrl,
    keyArray,
};
