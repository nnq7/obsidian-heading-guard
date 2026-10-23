'use strict';




const { Plugin: ObsidianPlugin, PluginSettingTab, Setting, Notice, MarkdownView, Modal, setIcon, debounce, AbstractInputSuggest, TFolder, normalizePath } = require('obsidian');
























const STRINGS = {
    'zh-CN': {
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
        restoreDefaults: '恢复默认设置',
        help: '使用帮助',
        restoreConfirm: '是否要恢复默认设置？',
        ok: '确定',
        cancel: '取消',
        preset: '保存标题样式',
        presetDesc: '保存自定义样式设置，之后可以一键切换',
        presetPlaceholder: '样式名称',
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
        restoreDefaults: '恢復預設設定',
        help: '使用說明',
        restoreConfirm: '是否要恢復預設設定？',
        ok: '確定',
        cancel: '取消',
        preset: '儲存標題樣式',
        presetDesc: '儲存自訂樣式設定，之後可以一鍵切換',
        presetPlaceholder: '樣式名稱',
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
        restoreDefaults: 'Restore defaults',
        help: 'Help',
        restoreConfirm: 'Restore default settings?',
        ok: 'OK',
        cancel: 'Cancel',
        preset: 'Saved heading styles',
        presetDesc: 'Save your custom style settings, then switch between them in one click',
        presetPlaceholder: 'Style name',
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









const ZH_TW_TAGS = ['zh-tw', 'zh-hant', 'zh-hk', 'zh-mo'];
function mapObsidianLanguage(tag) {
    const t = String(tag == null ? '' : tag).trim().toLowerCase().replace(/_/g, '-');
    if (!t) return null;
    if (t.indexOf('zh') !== 0) return 'en';          
    return ZH_TW_TAGS.some((p) => t.indexOf(p) === 0) ? 'zh-TW' : 'zh-CN';
}
function detectObsidianLanguage() {
    const sources = [
        () => (typeof moment !== 'undefined' && moment.locale ? moment.locale() : null),
        () => document.documentElement.lang,
    ];
    for (const read of sources) {
        try {
            const hit = mapObsidianLanguage(read());
            if (hit) return hit;
        } catch {
            
        }
    }
    return null;   
}

function lookup(language, key, arg) {
    const dict = STRINGS[language] || STRINGS['zh-CN'];
    
    
    
    let value = dict[key];
    if (value === undefined) value = STRINGS.en[key];
    if (value === undefined) value = key;
    return typeof value === 'function' ? value(arg) : value;
}



const DEFAULT_SCAN_INTERVAL = 10;
const MIN_SCAN_INTERVAL = 5;
const MAX_SCAN_INTERVAL = 60;
const NOTE_ENTER_DELAY_MS = 2000;  
const EDIT_DEBOUNCE_MS = 1000;     





const SKIP_MARKER = '%%skip%%';
const SKIP_TREE_MARKER = '%%skips%%';





const SCOPE_CHOICES = ['all', 'optIn'];




const MISSING_LEVEL_CHOICES = ['strict', 'inherit'];
const SCOPE_KEY = 'heading-guard';






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
        
        suffix: { char: 'none', space: true },
        
        numbering: 'inherit',
    };
}


const DEFAULT_LANGUAGE = 'zh-CN';

const DEFAULT_SETTINGS = {
    autoNumber: false,
    scanInterval: DEFAULT_SCAN_INTERVAL,
    stripOldNumbers: true,         
    
    
    missingLevelMode: 'strict',
    scope: 'all',                  
    excludeFolders: [],            
    levels: {
        1: defaultLevel(1), 2: defaultLevel(2), 3: defaultLevel(3),
        4: defaultLevel(4), 5: defaultLevel(5), 6: defaultLevel(6),
    },
    
    
    
    
    stylePresets: [],
};




const pick = (list, value, fallback) => (list.indexOf(value) >= 0 ? value : fallback);



function sanitizeLevel(level, saved) {
    const base = defaultLevel(level);
    const raw = saved || {};
    base.skip = !!raw.skip;
    base.sequence = SEQUENCE_IDS.indexOf(raw.sequence) >= 0 ? raw.sequence : base.sequence;
    base.brackets = pick(BRACKET_CHOICES, raw.brackets, base.brackets);
    base.separator = pick(SEPARATOR_CHOICES, raw.separator, base.separator);
    base.numbering = raw.numbering === 'restart' ? 'restart' : 'inherit';
    
    
    
    const old = raw.suffix || {};
    base.suffix = raw.suffix && old.enabled === false
        ? { char: 'none', space: old.space !== false }
        : {
            char: pick(SUFFIX_CHOICES, old.char, base.suffix.char),
            space: old.space !== false,
        };
    return base;
}






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




const DEFAULT_PRESET_NAME = 'Default';


function builtinDefaultPreset() {
    const preset = defaultStylePreset();
    preset.name = DEFAULT_PRESET_NAME;
    return preset;
}




function withBuiltinDefaultPreset(list) {
    if (list.some((item) => item.name === DEFAULT_PRESET_NAME)) return list;
    const out = list.slice();
    out.push(builtinDefaultPreset());
    return out;
}



function sameStylePreset(a, b) {
    if (!a || !b) return false;
    if (JSON.stringify(a.levels) !== JSON.stringify(b.levels)) return false;
    if (a.missingLevelMode && b.missingLevelMode && a.missingLevelMode !== b.missingLevelMode) return false;
    return true;
}




function snapshotStylePreset(settings) {
    const levels = {};
    for (let level = 1; level <= 6; level++) {
        levels[level] = JSON.parse(JSON.stringify(settings.levels[level]));
    }
    return {
        levels: levels,
        
        missingLevelMode: settings.missingLevelMode === 'inherit' ? 'inherit' : 'strict',
    };
}




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
    
    
    
    if (preset.missingLevelMode === 'inherit' || preset.missingLevelMode === 'strict') {
        settings.missingLevelMode = preset.missingLevelMode;
    }
}


function sanitizeStylePresets(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    const at = new Map();
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        let name = typeof item.name === 'string' ? item.name.trim() : '';
        if (name === '') continue;
        
        
        
        if (item.id === 'default') name = DEFAULT_PRESET_NAME;
        const levels = {};
        for (let level = 1; level <= 6; level++) {
            levels[level] = sanitizeLevel(level, (item.levels && item.levels[level]) || {});
        }
        const preset = { name: name, levels: levels };
        
        if (item.missingLevelMode === 'inherit' || item.missingLevelMode === 'strict') {
            preset.missingLevelMode = item.missingLevelMode;
        }
        if (at.has(name)) out[at.get(name)] = preset;
        else { at.set(name, out.length); out.push(preset); }
    }
    return out;
}




const SEQUENCES = [
    { id: 'arabic', alphabet: '0-9' },
    
    
    { id: 'romanLower', alphabet: 'ivxlcdm' },
    { id: 'roman', alphabet: 'IVXLCDM' },
    { id: 'han', alphabet: '一二三四五六七八九十百千万亿零' },
    { id: 'hanUpper', alphabet: '零壹贰叁肆伍陆柒捌玖拾佰仟万亿' },
    { id: 'lower', alphabet: 'a-z' },
    { id: 'upper', alphabet: 'A-Z' },
];
const SEQUENCE_IDS = SEQUENCES.map((item) => item.id);

const SEQUENCE_SAMPLES = {
    arabic: '1, 2, 3, 4…',
    romanLower: 'i, ii, iii, iv…',
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


function toHanSection(n, set) {
    let out = '';
    for (let i = 0; i < 4; i++) {
        const power = HAN_POWERS[i];
        const digit = Math.floor(n / power) % 10;
        if (digit === 0) {
            
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
    
    return out.startsWith(set.digits.charAt(1) + set.units[1]) ? out.slice(1) : out;
}

function renderIndex(sequence, n) {
    
    if (sequence === 'romanLower') return toRoman(n).toLowerCase();
    if (sequence === 'roman') return toRoman(n);
    if (sequence === 'han') return toHan(n, HAN_SETS.han);
    if (sequence === 'hanUpper') return toHan(n, HAN_SETS.hanUpper);
    if (sequence === 'lower') return String.fromCharCode(97 + ((n - 1) % 26));
    if (sequence === 'upper') return String.fromCharCode(65 + ((n - 1) % 26));
    return String(n);
}

































const MAX_SEQ = 99;                 


const NUMBER_SEGMENTS = new Set();
let MAX_SEG_LEN = 0;
for (const id of SEQUENCE_IDS) {
    for (let n = 1; n <= MAX_SEQ; n++) {
        const seg = renderIndex(id, n);
        if (!seg) continue;
        NUMBER_SEGMENTS.add(seg);
        if (seg.length > MAX_SEG_LEN) MAX_SEG_LEN = seg.length;
    }
}

const NUMBER_SEPS = ['.', '-', '_', ':', '~'];
const NUMBER_BRACKETS = [['(', ')'], ['（', '）'], ['<', '>'], ['「', '」'], ['【', '】']];


const NUMBER_TAILS = ['、', '.', '-', '_', ')', '>', '」', '）', '】', '』'];
const NUMBER_MAX_DEPTH = 6;         


const NUMBER_OPEN_CLOSE = [['', '']].concat(NUMBER_BRACKETS);
const RE_CJK_HEAD = /^[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;
const RE_ALL_DIGITS = /^\d+$/;
const RE_NUMBER_CORE = /^\d+\.$/;
const RE_CORE_LETTER_DASH = /^[A-Za-z][-\u2013\u2014](?![ \t\u00A0\u3000]|$)/;
const RE_LOWER_TOKEN = /^[a-z][a-z0-9]*$/;
const RE_LEADING_SYMBOL = /^[-|+*`<>{}[\]]/;
const RE_WS_HEAD = /^[\s\u00A0\u3000]+/;   







const RE_UNIT_HEAD = /^(\d+(\.\d+)?\s*)?(米|厘米|毫米|公分|寸|尺|吋|km|dm|cm|mm|kg|千克|克|吨|m)(?![A-Za-z])/;


function decideNumber(text) {
    if (!text) return null;
    
    
    
    
    if (/[\\/]/.test(text)) return null;
    const s = text.replace(RE_WS_HEAD, '');

    let best = null;
    
    const finish = (pos, fc, pure) => {
        let p = pos;
        const hadBracket = !!(fc && s[p] === fc);
        if (fc) { if (s[p] !== fc) return; p++; }
        let hadTail = false, tailCh = '';
        if (NUMBER_TAILS.includes(s[p])) { tailCh = s[p]; p++; hadTail = true; }
        const rest = s.slice(p);
        if (rest === '') return;
        const space = RE_WS_HEAD.test(rest);
        
        if (tailCh && /[-\u2013\u2014]/.test(tailCh) && /[A-Za-z]/.test(rest[0] || '')) return;
        
        
        
        
        
        
        
        
        
        
        const cjkHead = RE_CJK_HEAD.test(rest);
        if (!space && !hadTail && !hadBracket && !(pure && cjkHead)) return;
        
        if (RE_UNIT_HEAD.test(rest.replace(RE_WS_HEAD, ''))) return;
        if (!best || p > best.end) best = { end: p };
    };
    
    const walk = (pos, depth, fc, pure) => {
        if (depth >= 1) finish(pos, fc, pure);
        if (depth >= NUMBER_MAX_DEPTH) return;          
        if (!NUMBER_SEPS.includes(s[pos])) return;
        const p = pos + 1;
        const sep = s[pos];
        for (let len = Math.min(MAX_SEG_LEN, s.length - p); len >= 1; len--) {
            const seg = s.slice(p, p + len);
            if (NUMBER_SEGMENTS.has(seg)) {
                const nextPure = (depth === 1 || pure) && (sep === '.' || sep === '-') && RE_ALL_DIGITS.test(seg);
                walk(p + len, depth + 1, fc, nextPure);
            }
        }
    };
    
    for (const pair of NUMBER_OPEN_CLOSE) {
        const fo = pair[0], fc = pair[1];
        if (fo && s[0] !== fo) continue;
        const start = fo ? 1 : 0;
        for (let len = Math.min(MAX_SEG_LEN, s.length - start); len >= 1; len--) {
            if (NUMBER_SEGMENTS.has(s.slice(start, start + len))) walk(start + len, 1, fc, false);
        }
    }
    if (!best) return null;
    const core = s.slice(0, best.end);
    
    
    
    
    if (RE_NUMBER_CORE.test(core) && RE_LOWER_TOKEN.test(s.slice(best.end))) return null;
    
    
    
    
    
    
    
    
    
    
    if (RE_CORE_LETTER_DASH.test(core + (s[best.end] || ''))) return null;
    const content = s.slice(best.end).replace(RE_WS_HEAD, '');
    if (content === '') return null;
    
    
    
    
    if (RE_LEADING_SYMBOL.test(content)) return null;
    return { core: core, content: content };
}



function stripOldNumber(text) {
    const hit = decideNumber(text);
    return hit === null ? null : hit.content;
}



function normHeading(text) {
    return text == null ? '' : String(text).trim().normalize('NFC');
}








function normForGate(text) {
    return text == null ? '' : String(text).replace(/\s+/g, ' ').trim().normalize('NFC');
}


















const LINK_NORM_AT = /[!"#$%&()*+,.:;<=>?@^`{|}~/[\]\\\r\n]/g;
const LINK_NORM_PT = /([:#|^\\\r\n]|%%|\[\[|]])/g;

function linkNormAt(text) {
    return String(text == null ? '' : text).replace(LINK_NORM_AT, ' ').replace(/\s+/g, ' ').trim();
}

function linkNormPt(text) {
    return String(text == null ? '' : text).replace(LINK_NORM_PT, ' ').replace(/\s+/g, ' ').trim();
}


function linkKeyOld(text) {
    return linkNormAt(text).toLowerCase();
}



function normalizeFolder(text) {
    const clean = normalizePath(String(text == null ? '' : text).trim());
    return clean === '' ? '' : clean + '/';
}



function templateFolderPreset(app) {
    try {
        const internal = app && app.internalPlugins;
        if (!internal || typeof internal.getPluginById !== 'function') return '';
        const core = internal.getPluginById('templates');
        const options = core && core.instance && core.instance.options;
        const folder = options && options.folder;
        return typeof folder === 'string' ? folder.trim() : '';
    } catch {
        return '';
    }
}



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







function buildNumberChain(settings, counters) {
    const numbers = ['', '', '', '', '', '', ''];
    for (let k = 1; k <= 6; k++) {
        const rule = parseRule(settings, k);
        
        const restart = settings.levels[k].numbering === 'restart';
        numbers[k] = joinNumber(numbers[k - 1], restart, rule.separator)
            + renderIndex(settings.levels[k].sequence, counters[k]);
    }
    return numbers;
}





function previewLines(settings, sampleTitles) {
    const titles = sampleTitles && sampleTitles.length ? sampleTitles : SAMPLE_TITLES;
    const numbers = buildNumberChain(settings, [0, 1, 1, 1, 1, 1, 1]);   
    const lines = [];
    
    
    
    
    if (settings.missingLevelMode === 'inherit') {
        for (let level = 2; level <= 6; level++) {
            const style = level - 1;
            const rule = parseRule(settings, style);
            const title = titles[level - 1];
            const body = settings.levels[style].skip
                ? title
                : assembleTitle(rule, numbers[style], title);   
            lines.push('#'.repeat(level) + ' ' + body);
        }
        return lines;
    }
    for (let level = 1; level <= 6; level++) {
        const rule = parseRule(settings, level);
        const title = titles[level - 1];
        const body = settings.levels[level].skip
            ? title
            : assembleTitle(rule, numbers[level], title);   
        lines.push('#'.repeat(level) + ' ' + body);
    }
    return lines;
}















function diffSegments(oldText, newText) {
    const a = String(oldText == null ? '' : oldText);
    const b = String(newText == null ? '' : newText);
    let tail = 0;
    const maxTail = Math.min(a.length, b.length);
    while (tail < maxTail && a.charAt(a.length - 1 - tail) === b.charAt(b.length - 1 - tail)) tail++;
    let head = 0;
    const maxHead = Math.min(a.length - tail, b.length - tail);
    while (head < maxHead && a.charAt(head) === b.charAt(head)) head++;
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





function previewRows(headings, getLine, plan) {
    const nextByLine = new Map();
    for (const item of plan || []) nextByLine.set(item.line, item.next);
    
    
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



function readFreshHeading(heading, getLine) {
    const line = heading.position.start.line;
    const text = getLine(line);
    const read = text === null ? null : readHeadingLine(text);
    if (!read || read.level !== heading.level || normForGate(read.text) !== normForGate(heading.heading)) {
        return null;
    }
    return { line, text: read.text };
}




function headingSignature(headings, getLine, frontValue) {
    
    
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




function effectiveLevels(headings, settings, getLine) {
    const skipped = markSkippedHeadings(headings, getLine);
    if (skipped === null) return null;
    const set = new Set();
    headings.forEach((heading, i) => { if (!skipped[i]) set.add(heading.level); });
    return [...set].sort((a, b) => a - b);
}



function styleIndexOf(settings, effective, level) {
    if (settings.missingLevelMode !== 'inherit') return level;
    const i = effective.indexOf(level);
    return i < 0 ? level : i + 1;   
}


function levelOfStyle(settings, effective, k) {
    return settings.missingLevelMode !== 'inherit' ? k : effective[k - 1];
}

function planNumbering(headings, settings, getLine) {
    const rules = [null];
    for (let level = 1; level <= 6; level++) rules[level] = parseRule(settings, level);
    const strippers = buildStrippers(settings);

    
    
    const effective = effectiveLevels(headings, settings, getLine);
    if (effective === null) return null;

    const counters = [0, 0, 0, 0, 0, 0, 0];
    const plan = [];

    
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

        if (marked || tree || skipFrom) {
            
            
            
            if (settings.stripOldNumbers) {
                const cleaned = stripOldNumber(fresh.text);
                const next = cleaned === null ? fresh.text : cleaned;
                if (next !== fresh.text) {
                    plan.push({ level, line: fresh.line, old: fresh.text, next, changed: true });
                }
            }
            continue; 
        }

        counters[level]++;
        for (let k = level + 1; k <= 6; k++) counters[k] = 0;

        
        const style = styleIndexOf(settings, effective, level);
        const rule = rules[style];
        
        
        
        const byStyle = [0, 0, 0, 0, 0, 0, 0];
        for (let k = 1; k <= 6; k++) {
            const lv = levelOfStyle(settings, effective, k);
            byStyle[k] = lv && counters[lv] > 0 ? counters[lv] : 1;
        }
        const number = buildNumberChain(settings, byStyle)[style] || '';

        
        
        
        if (settings.levels[style].skip) {
            
            
            
            if (settings.stripOldNumbers) {
                const cleaned = stripOldNumber(fresh.text);
                const next = cleaned === null ? fresh.text : cleaned;
                if (next !== fresh.text) {
                    plan.push({ level, line: fresh.line, old: fresh.text, next, changed: true });
                }
            }
            continue; 
        }

        
        let title = stripNumbering(fresh.text, strippers, style);
        
        
        
        
        if (settings.stripOldNumbers) {
            const cleaned = stripOldNumber(title);
            if (cleaned !== null) title = cleaned;
        }
        const next = assembleTitle(rule, number, title);
        plan.push({ level, line: fresh.line, old: fresh.text, next, changed: next !== fresh.text });
    }
    return plan;
}


function planReset(headings, settings, getLine) {
    const plan = [];
    
    
    
    
    
    const skipped = markSkippedHeadings(headings, getLine);
    if (skipped === null) return null;
    for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const fresh = readFreshHeading(heading, getLine);
        if (!fresh) return null;
        
        if (skipped[i] && !settings.stripOldNumbers) continue;

        const next = stripOldNumber(fresh.text);
        if (next === null || next === fresh.text) continue;
        plan.push({ level: heading.level, line: fresh.line, old: fresh.text, next });
    }
    return plan;
}




function escapeUrl(text) {
    
    return text.replace(/[\\\x00\x08\x0B\x0C\x0E-\x1F ]/g, (c) => encodeURIComponent(c));
}

const WIKI_LINK_RE = /^(!?\[\[)([\s\S]*?)(\|([\s\S]*))?(\]\])$/;
const MD_LINK_RE = /^(!?\[)([^\]]*)(\]\()([^)]*)(\))$/;


function buildChange(original, target, newSubpath) {
    const bar = target.indexOf('#');
    const newTarget = bar < 0 ? target : target.slice(0, bar + 1) + newSubpath;

    const wiki = WIKI_LINK_RE.exec(original);
    if (wiki) {
        const display = wiki[4];
        if (display === undefined) return wiki[1] + newTarget + wiki[5];
        
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



function keyArray(map) {
    return { keys: () => [...map.keys()], get: (path) => map.get(path) };
}



class HeadingGuard extends ObsidianPlugin {
    constructor(app, manifest) {
        super(app, manifest);
        
        
        this.language = detectObsidianLanguage() || DEFAULT_LANGUAGE;
    }

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new HeadingGuardSettingTab(this.app, this));

        
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

        
        this.syncBlockedNotified = false;

        
        
        
        
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            this._markVisit(null);
            this.scheduleNoteEnter();
        }));
        
        
        
        this.registerEvent(this.app.workspace.on('editor-change', () => this.scheduleEdit()));
        this.registerEvent(this.app.metadataCache.on('changed', (file) => this.scheduleEdit(file)));
        
        this.register(() => {
            if (this.timerId) window.clearInterval(this.timerId);
            if (this.enterTimer) window.clearTimeout(this.enterTimer);
            if (this.editTimer) window.clearTimeout(this.editTimer);
        });
        this.startTimer();
    }

    t(key, arg) {
        return lookup(this.language, key, arg);
    }

    async loadSettings() {
        const raw = (await this.loadData()) || {};
        
        
        this.excludePrefillPending = !Array.isArray(raw.excludeFolders);
        
        const levels = {};
        for (let level = 1; level <= 6; level++) {
            levels[level] = sanitizeLevel(level, (raw.levels && raw.levels[level]) || {});
        }
        
        
        this.language = detectObsidianLanguage() || DEFAULT_LANGUAGE;
        
        
        
        const savedPresets = sanitizeStylePresets(raw.stylePresets);
        const presetsWithDefault = withBuiltinDefaultPreset(savedPresets);
        
        
        
        const rawPresets = Array.isArray(raw.stylePresets) ? raw.stylePresets : [];
        const needsPresetWrite = presetsWithDefault.length !== rawPresets.length
            || rawPresets.some((item) => item && item.id !== undefined);
        this.settings = {
            autoNumber: !!raw.autoNumber,
            scanInterval: Math.min(MAX_SCAN_INTERVAL, Math.max(MIN_SCAN_INTERVAL,
                Number.isFinite(raw.scanInterval) ? Math.round(raw.scanInterval) : DEFAULT_SCAN_INTERVAL)),
            
            
            stripOldNumbers: typeof raw.stripOldNumbers === 'boolean'
                ? raw.stripOldNumbers : DEFAULT_SETTINGS.stripOldNumbers,
            
            missingLevelMode: pick(MISSING_LEVEL_CHOICES, raw.missingLevelMode, 'strict'),
            scope: pick(SCOPE_CHOICES, raw.scope, 'all'),
            
            excludeFolders: Array.isArray(raw.excludeFolders)
                ? raw.excludeFolders
                    .filter((item) => typeof item === 'string')
                    .map((item) => normalizeFolder(item))
                    .filter((item) => item !== '')
                : [],
            levels,
            stylePresets: presetsWithDefault,
        };
        if (needsPresetWrite) await this.saveSettings();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    
    
    
    
    
    
    
    isAutoNumberEnabled(file) {
        if (!file) return false;
        const parts = this._frontParts(file);
        
        if (parts.incomplete) return false;
        
        
        
        
        if (parts.flag === 'on') return true;
        const path = file.path.replace(/\\/g, '/');
        for (const folder of this.settings.excludeFolders) {
            if (path.startsWith(folder)) return false;
        }
        return this.settings.scope === 'all';
    }

    
    
    
    
    
    _frontmatterValue(file) {
        const cache = this.app.metadataCache.getFileCache(file);
        const raw = cache && cache.frontmatter ? cache.frontmatter[SCOPE_KEY] : undefined;
        if (typeof raw !== 'string') return undefined;   
        const text = raw.trim();
        if (text === '') return undefined;
        return text.toLowerCase() === 'on' ? 'on' : text;
    }

    
    
    
    
    
    
    
    _frontParts(file) {
        const raw = this._frontmatterValue(file);
        if (typeof raw !== 'string' || raw === '') return { flag: '', name: '', incomplete: false };
        if (raw === 'on') return { flag: 'on', name: '', incomplete: false };
        const bar = raw.indexOf('|');
        if (bar >= 0) {
            if (raw.slice(0, bar).trim().toLowerCase() === 'on') {
                const rest = raw.slice(bar + 1).trim();
                if (rest === '') return { flag: '', name: '', incomplete: true };
                return { flag: 'on', name: rest, incomplete: false };
            }
            return { flag: '', name: raw, incomplete: false };   
        }
        return { flag: '', name: raw, incomplete: false };
    }

    
    
    
    _markVisit(file) {
        const path = file && file.path ? file.path : '';
        if (this._visitPath !== path) { this._visitPath = path; this._warnedName = ''; }
    }

    
    
    
    
    _noteSettings(file) {
        const parts = this._frontParts(file);
        if (parts.incomplete) return { settings: this.settings, missing: '', incomplete: true };
        if (parts.name === '') return { settings: this.settings, missing: '', incomplete: false };
        const preset = this.findStylePreset(parts.name);
        if (!preset) return { settings: this.settings, missing: parts.name, incomplete: false };
        return { settings: this._settingsWithPreset(preset), missing: '', incomplete: false };
    }

    
    
    
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

    
    scheduleNoteEnter() {
        if (!this.settings.autoNumber) return;
        if (this.enterTimer) window.clearTimeout(this.enterTimer);
        this.enterTimer = window.setTimeout(() => {
            this.enterTimer = null;
            this.checkActiveNote(true); 
        }, NOTE_ENTER_DELAY_MS);
    }

    
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

    
    
    _cursorOnHeading(editor, file) {
        if (!editor) return false;
        const cursor = editor.getCursor();
        if (!cursor) return false;
        const line = editor.getLine(cursor.line);
        if (line === null || !readHeadingLine(line)) return false;
        return this._headingsOf(file).some((h) => h.position.start.line === cursor.line);
    }

    
    
    checkActiveNote(force) {
        if (!this.settings.autoNumber) return;
        
        if (this.pendingConfirm) return;
        const view = this._activeMarkdown();
        if (!view) return;
        
        
        if (!this.isAutoNumberEnabled(view.file)) return;
        
        
        
        
        if (!force && this._cursorOnHeading(view.editor, view.file)) return;
        const signature = view.file.path + '\u0000'
            + headingSignature(this._headingsOf(view.file), this._lineReader(view.editor),
                this._frontmatterValue(view.file));
        
        if (!force && signature === this.lastSignature && !this.retryPending) return;
        this.retryPending = false;
        this.lastSignature = signature;
        this.runOnce(view.file, view.editor, false);
    }

    
    
    
    
    
    
    
    
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
            if (!sub || sub.charAt(0) === '^') return; 
            const next = byOld.get(linkKeyOld(sub));
            if (!next) return;
            if (mc.getFirstLinkpathDest(ref.link.slice(0, bar), refSource) !== file) return;
            const change = buildChange(ref.original, ref.link, next);
            if (change === null) return;
            const pos = ref.position;
            if (!pos || !pos.start || !pos.end) return; 
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

    
    async runOnce(file, editor, manual) {
        try {
            this._markVisit(file);   
            const getLine = this._lineReader(editor);
            const headings = this._headingsOf(file);
            
            const note = this._noteSettings(file);
            
            
            if (note.incomplete) return;
            if (note.missing) {
                
                
                
                
                if (manual) { new Notice(this.t('noticeUnknownPreset', note.missing)); return; }
                if (this._warnedName !== note.missing) {
                    this._warnedName = note.missing;
                    new Notice(this.t('noticeUnknownPreset', note.missing));
                }
                return;
            }
            const plan = planNumbering(headings, note.settings, getLine);
            if (plan === null) {
                
                
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
            
            if (!this.readyToRename(manual)) return;
            await this._confirmOrApply({ file, editor, manual, mode: 'number', items: todo, headings, getLine, plan });
        } catch (err) {
            
            
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
            
            if (!this.readyToRename(manual)) return;
            await this._confirmOrApply({ file, editor, manual, mode: 'reset', items: plan, headings, getLine, plan });
        } catch (err) {
            console.error('[heading-guard] 重置编号失败：', err);
        }
    }

    

    
    
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

    
    
    async _applyEdited(file, editor, rows, mode) {
        try {
            const items = rows
                .map((r) => ({ line: r.line, level: r.level, old: r.old, next: r.text, changed: r.text !== r.old }))
                .filter((r) => r.changed);
            if (items.length === 0) {
                new Notice(this.t(mode === 'number' ? 'upToDate' : 'noNumber'));
                return;
            }
            
            
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

    
    async _applyItems(file, editor, items, manual, mode) {
        const renames = items.map((item) => ({ from: item.old, to: item.next }));
        
        const selfEdits = this.collectSelfLinkEdits(file, renames, file.path);
        this._write(editor, items, selfEdits);
        const synced = await this.syncHeadingLinks(file, renames, file.path);
        synced.links += selfEdits.length;
        
        
        if (selfEdits.length > 0 && !synced.countedSelf) synced.files += 1;
        if (manual) {
            new Notice(this.t(mode === 'number' ? 'done' : 'resetDone', items.length));
            if (synced.links > 0) new Notice(this.t('linksUpdated', synced));
        }
    }

    

    
    
    
    
    
    
    
    isDefaultStylePreset(preset) {
        return !!preset && preset.name === DEFAULT_PRESET_NAME;
    }

    
    findStylePreset(name) {
        const key = String(name == null ? '' : name).trim();
        if (key === '') return null;
        return this.settings.stylePresets.find((item) => item.name === key) || null;
    }

    
    
    
    
    
    
    
    
    
    
    
    saveStylePreset(name, force) {
        const key = String(name == null ? '' : name).trim();
        if (key === '') return 'nameTaken';
        const preset = snapshotStylePreset(this.settings);
        preset.name = key;
        const existing = this.findStylePreset(key);
        if (existing) {
            
            
            if (this.isDefaultStylePreset(existing)) return 'nameTaken';
            if (sameStylePreset(existing, preset)) return 'unchanged';
            if (!force) return 'confirm:' + key;
            const at = this.settings.stylePresets.indexOf(existing);
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

    
    applyStylePreset(name) {
        const key = String(name == null ? '' : name).trim();
        
        
        const preset = this.findStylePreset(key);
        if (!preset) return false;
        applyStylePresetToSettings(this.settings, preset);
        this.presetLocked = true;   
        this.saveSettings();
        
        this.checkActiveNote(true);
        return true;
    }

    
    
    
    startNewStyle() {
        applyStylePresetToSettings(this.settings, defaultStylePreset());
        this.presetLocked = false;
        this.presetNameDraft = '';
        this.saveSettings();
        this.checkActiveNote(true);
    }

    deleteStylePreset(name) {
        const key = String(name == null ? '' : name).trim();
        const preset = this.findStylePreset(key);
        if (!preset) return false;
        
        
        if (this.isDefaultStylePreset(preset)) return false;
        this.settings.stylePresets.splice(this.settings.stylePresets.indexOf(preset), 1);
        this.saveSettings();
        return true;
    }

    
    canSyncLinks() {
        const mc = this.app.metadataCache;
        return typeof mc.iterateAllRefs === 'function' && typeof mc.updateInternalLinks === 'function';
    }

    
    
    
    
    readyToRename(manual) {
        if (this.canSyncLinks()) {
            this.syncBlockedNotified = false; 
            return true;
        }
        
        if (manual || !this.syncBlockedNotified) {
            this.syncBlockedNotified = true;
            new Notice(this.t('syncBlocked'));
        }
        return false;
    }

    
    
    
    
    
    
    
    async syncHeadingLinks(file, renames, skipPath) {
        const mc = this.app.metadataCache;
        
        
        const synced = { links: 0, files: 0 };
        if (!this.canSyncLinks()) return synced;

        
        
        
        
        
        const byOld = new Map();
        for (const rename of renames) byOld.set(linkKeyOld(rename.from), rename.to);

        const byPath = new Map();
        mc.iterateAllRefs((sourcePath, ref) => {
            if (skipPath && sourcePath === skipPath) return; 
            const bar = ref.link.indexOf('#');
            if (bar < 0) return;
            const sub = ref.link.slice(bar + 1);
            if (!sub || sub.charAt(0) === '^') return; 
            const next = byOld.get(linkKeyOld(sub));
            if (!next) return;
            
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

        
        const canvas = mc.linkUpdaters && mc.linkUpdaters.canvas;
        if (canvas && typeof canvas.renameSubpath === 'function') {
            for (const rename of renames) {
                await canvas.renameSubpath(file, normHeading(rename.from).toLowerCase(), normHeading(rename.to));
            }
        }
        return synced;
    }
}



const CAN_SET_HEADING = typeof Setting.prototype.setHeading === 'function';

function settingHeading(containerEl, text, level) {
    if (CAN_SET_HEADING) {
        new Setting(containerEl).setName(text).setHeading();
        return;
    }
    containerEl.createEl(level === 2 ? 'h4' : 'h3', { text });
}

const BRACKET_LABELS = { '()': 'bracketAscii', '（）': 'bracketCjk' };


function pickDropdown(dd, choices, labelFor, current, onChange) {
    for (const value of choices) dd.addOption(value, labelFor(value));
    dd.setValue(current).onChange(onChange);
}



const RESET_ICON = 'rotate-ccw';

const HELP_ICON = 'help-circle';
const REPO_URL = 'https://github.com/nnq7/obsidian-heading-guard';


function openExternal(url) {
    try {
        if (typeof window !== 'undefined' && typeof window.open === 'function') window.open(url, '_blank', 'noopener');
    } catch {
        
    }
}


const PRESET_SAVE_ICON = 'save';

const PRESET_NEW_ICON = 'plus';
const PRESET_DELETE_ICON = 'trash-2';



class ConfirmResetModal extends Modal {
    constructor(app, text, labels, opts) {
        super(app);
        this.text = text;
        this.labels = labels;
        this.answer = null;      
        this.onChoose = null;
        
        this.reverse = !!(opts && opts.reverse);
    }

    onOpen() {
        this.contentEl.createEl('p', { text: this.text, cls: 'heading-guard-confirm-text' });
        
        
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







function paintDiffSegments(el, segments, changedCls, label) {
    el.empty();
    if (label) el.createEl('span', { cls: label.cls, text: label.text });
    for (const seg of segments) {
        if (seg.text === '') continue;
        if (seg.changed) el.createEl('span', { cls: changedCls, text: seg.text });
        else el.createEl('span', { text: seg.text });
    }
}


function flattenCellText(raw) {
    return String(raw == null ? '' : raw).replace(/[\r\n\t]+/g, ' ');
}

class DiffConfirmModal extends Modal {
    constructor(app, opts) {
        super(app);
        this.opts = opts;
        this.answer = null;      
    }

    onOpen() {
        const { title, rows, labels } = this.opts;
        this.modalEl.addClass('heading-guard-diff-modal');
        this.titleEl.setText(title);

        
        
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

        
        
        const scroller = this.contentEl.createEl('div', { cls: 'heading-guard-diff-scroll' });
        for (const row of rows) {
            row.text = row.next;
            const line = scroller.createEl('div', { cls: 'heading-guard-diff-row' });
            
            const levelLabel = {
                text: row.skipped ? labels.skip : 'H' + row.level,
                cls: 'heading-guard-diff-level' + (row.skipped ? ' is-skip' : ''),
            };

            
            const left = line.createEl('div', { cls: 'heading-guard-diff-cell heading-guard-diff-old' });
            paintDiffSegments(left, diffSegments(row.old, row.next).left, 'heading-guard-diff-del', levelLabel);

            
            const right = line.createEl('div', {
                cls: 'heading-guard-diff-cell heading-guard-diff-new',
                attr: { contenteditable: 'true', spellcheck: 'false' },
            });
            paintDiffSegments(right, diffSegments(row.old, row.next).right, 'heading-guard-diff-ins');
            row.el = right;

            
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
            
            
            
            
            right.addEventListener('blur', () => {
                const text = flattenCellText(right.textContent);
                row.text = text;
                const diff = diffSegments(row.old, text);
                paintDiffSegments(left, diff.left, 'heading-guard-diff-del', levelLabel);   
                paintDiffSegments(right, diff.right, 'heading-guard-diff-ins');
            });
        }

        
        
        const bar = this.contentEl.createEl('div', { cls: 'heading-guard-diff-buttons' });
        bar.createEl('button', { text: labels.cancel })
            .addEventListener('click', () => this.finish(false));
        bar.createEl('button', { text: labels.confirm, cls: 'mod-cta' })
            .addEventListener('click', () => this.finish(true));
    }

    finish(confirm) {
        this.answer = confirm ? 'confirm' : 'cancel';
        const rows = this.opts.rows || [];
        
        for (const row of rows) if (row.el) row.text = flattenCellText(row.el.textContent);
        this.close();
        
        if (confirm && this.opts.onConfirm) this.opts.onConfirm(rows);
    }

    onClose() {
        this.contentEl.empty();
        if (this.opts.onClose) this.opts.onClose();
    }
}





const HAS_INPUT_SUGGEST = typeof AbstractInputSuggest === 'function';

const SUGGEST_LIMIT = 50;
const SUGGEST_BASE = HAS_INPUT_SUGGEST ? AbstractInputSuggest : function () {};



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
        
        
        
        
        return hit.slice(0, SUGGEST_LIMIT);
    }

    renderSuggestion(name, el) {
        el.setText(name);
    }

    
    selectSuggestion(name) {
        this.setValue(name);
        this.close();
        if (this.onPick) this.onPick(name);
    }
}





function vaultFolderPaths(app) {
    return app.vault.getAllLoadedFiles()
        .filter((f) => f instanceof TFolder && f.path !== '/')
        .map((f) => f.path)
        .sort();
}



class FolderPickerModal extends Modal {
    constructor(app, opts) {
        super(app);
        this.opts = opts;      
        this.answer = null;    
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
                
                if (HAS_INPUT_SUGGEST) {
                    this.suggest = new InputListSuggest(this.app, tc.inputEl,
                        () => vaultFolderPaths(this.app), (path) => tc.setValue(path));
                }
            });

        
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
        
        
        
        const scrollHost = scrollHostOf(containerEl);
        const scrollTop = scrollHost ? scrollHost.scrollTop : 0;

        
        

        containerEl.empty();
        containerEl.addClass('heading-guard-settings');

        
        let previewEl = null;
        const renderPreview = () => {
            if (!previewEl) return;
            
            
            
            
            const sampleTitles = t('level').slice(1);
            const inherit = settings.missingLevelMode === 'inherit';
            previewEl.empty();
            if (!inherit) {
                if (previewEl.removeClass) previewEl.removeClass('heading-guard-preview-split');
                previewEl.setText(previewLines(settings, sampleTitles).join('\n'));
                return;
            }
            previewEl.addClass('heading-guard-preview-split');
            const withMode = (mode) => Object.assign({}, settings, { missingLevelMode: mode });
            
            
            
            const cols = [
                [t('missingLevelStrict'), previewLines(withMode('strict'), sampleTitles).slice(1)],
                [t('missingLevelInherit'), previewLines(settings, sampleTitles)],
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
            
            plugin.checkActiveNote(true);
        };
        const noneLabel = t('none');
        const symbolLabel = (value) => (value === 'none' ? noneLabel : value);
        const bracketLabel = (value) => (value === 'none'
            ? noneLabel
            : (BRACKET_LABELS[value] ? t(BRACKET_LABELS[value]) : value));

        
        
        let autoToggle = null;
        let intervalSlider = null;

        let intervalLabel = null;
        const setIntervalLabel = (seconds) => {
            if (intervalLabel) intervalLabel.setText(String(seconds) + ' ' + t('seconds'));
        };
        
        
        
        const saveInterval = debounce(async () => {
            await plugin.saveSettings();
            if (settings.autoNumber) plugin.startTimer();   
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
                        plugin.checkActiveNote(true); 
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
                        setIntervalLabel(value);   
                        saveInterval();             
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

        
        
        
        if (plugin.excludePrefillPending) {
            plugin.excludePrefillPending = false;
            const preset = templateFolderPreset(plugin.app);
            if (preset) {
                settings.excludeFolders = [normalizeFolder(preset)];
                plugin.saveSettings();      
                new Notice(t('excludeFromTemplates'));
            }
        }
        const excludeRow = new Setting(containerEl)
            .setName(t('exclude'))
            .setDesc(t('excludeDesc'))
            .addTextArea((ta) => {
                ta.setValue(settings.excludeFolders.map((f) => f.replace(/\/$/, '')).join('\n'));
                ta.inputEl.rows = 4;
                
                const saveExclude = debounce(async () => {
                    settings.excludeFolders = ta.getValue()
                        .split('\n')
                        .map((line) => normalizeFolder(line))
                        .filter((line) => line !== '');
                    await plugin.saveSettings();
                }, 500);
                ta.onChange(() => saveExclude());
            })
            
            .addExtraButton((b) => b
                .setIcon('plus')
                .setTooltip(t('excludeAdd'))
                .onClick(() => this.pickFolderToExclude()));
        
        
        excludeRow.settingEl.addClass('heading-guard-inline-row');

        settingHeading(containerEl, t('preview'), 2);
        
        
        previewEl = containerEl.createEl('div', { cls: 'heading-guard-preview' });

        
        const presetInput = this.renderPresetRow(containerEl);   

        
        
        
        const renderGlobalAndMissing = () => {

        
        
        
        
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

        
        const renderLevelGroups = () => {
        for (let level = 1; level <= 6; level++) {
            const own = settings.levels[level];
            
            const group = containerEl.createEl('details', { cls: 'heading-guard-level' });
            group.createEl('summary', { text: t('level')[level] });

            const skipRow = new Setting(group)
                .setName(t('skip'))
                .setDesc(t('skipDesc'))
                .addToggle((tg) => tg.setValue(own.skip).onChange(async (value) => {
                    own.skip = value;
                    await save();
                }));
            
            
            
            
            skipRow.settingEl.addClass('heading-guard-inline-row');

            
            
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
            seqRow.settingEl.addClass('heading-guard-inline-row');   
            
            
            
            
            
            
            if (level > 1) {
                seqRow.addDropdown((dd) => {
                    dd.addOption('inherit', t('numberInherit')).addOption('restart', t('numberRestart'))
                        .setValue(own.numbering).onChange(async (value) => {
                            own.numbering = value;
                            await save();
                        });
                });
            }

            
            if (level > 1) {
                new Setting(group)
                    .setName(t('sep'))
                    .setDesc(t('sepDesc'))
                    .addDropdown((dd) => pickDropdown(dd, SEPARATOR_CHOICES, symbolLabel, own.separator, async (value) => {
                        own.separator = value;
                        await save();
                    }));
            }

            
            
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
            
            suffixRow.settingEl.addClass('heading-guard-inline-row');
        }

        };

        
        renderGlobalAndMissing();
        renderLevelGroups();

        
        
        if (presetInput) presetInput.setDisabled(!!plugin.presetLocked);
        renderPreview();
        this.renderRestoreRow(containerEl); 
        
        if (scrollHost) scrollHost.scrollTop = scrollTop;
    }

    
    
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
                const shown = path.replace(/\/$/, '');   
                if (plugin.settings.excludeFolders.indexOf(path) >= 0) {
                    new Notice(t('excludeAlready', shown));
                    return;
                }
                plugin.settings.excludeFolders.push(path);
                plugin.saveSettings();
                this.display();      
                new Notice(t('excludeAdded', shown));
            },
        });
        modal.open();
    }

    
    
    renderPresetRow(containerEl) {
        const plugin = this.plugin;
        const t = (key, arg) => plugin.t(key, arg);
        let nameInput = null;

        const readName = () => (nameInput ? String(nameInput.getValue() || '').trim() : '');
        const applyName = (name) => {
            const value = String(name == null ? '' : name).trim();
            if (value === '') { new Notice(t('presetNeedName')); return; }
            
            if (!plugin.applyStylePreset(value)) { new Notice(t('presetMissing', value)); return; }
            
            plugin.presetNameDraft = value;
            this.display();     
            new Notice(t('presetApplied', value));
        };
        
        const deleteName = () => {
            const value = readName();
            if (value === '') { new Notice(t('presetNeedName')); return; }
            const target = plugin.findStylePreset(value);
            if (!target) { new Notice(t('presetMissing', value)); return; }
            
            if (plugin.isDefaultStylePreset(target)) return;
            const modal = new ConfirmResetModal(this.app, t('presetDeleteConfirm', value),
                { ok: t('ok'), cancel: t('cancel') });
            modal.onChoose = (answer) => {
                if (answer !== 'ok') return;
                plugin.deleteStylePreset(value);
                plugin.presetNameDraft = '';
                if (nameInput) nameInput.setValue('');
                
                
                plugin.presetLocked = false;
                this.display();   
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
                
                if (plugin.presetNameDraft) tc.setValue(plugin.presetNameDraft);
                tc.onChange((v) => { plugin.presetNameDraft = v; });
            })
            
            
            .addExtraButton((b) => b
                .setIcon(PRESET_SAVE_ICON)
                .setTooltip(t('presetSaveTip'))
                .onClick(() => this.savePresetFromRow(readName())))
            
            .addExtraButton((b) => b
                .setIcon(PRESET_NEW_ICON)
                .setTooltip(t('presetNew'))
                
            .onClick(() => { plugin.startNewStyle(); this.display(); }))
            .addExtraButton((b) => b
                .setIcon(PRESET_DELETE_ICON)
                .setTooltip(t('presetDeleteTip'))
                .onClick(() => deleteName()));
        
        row.settingEl.addClass('heading-guard-inline-row');
        row.settingEl.addClass('heading-guard-preset-row');
        
        
        this.renderPresetChips(row.settingEl, applyName);
        return nameInput;   
    }

    
    
    
    
    
    renderPresetChips(hostEl, applyName) {
        const plugin = this.plugin;
        
        const box = hostEl.createEl('div', { cls: 'heading-guard-preset-chips' });
        for (const preset of plugin.settings.stylePresets) {
            box.createEl('button', { text: preset.name, cls: 'heading-guard-preset-chip' })
                .addEventListener('click', () => applyName(preset.name));
        }
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
            
            const modal = new ConfirmResetModal(this.app, t('presetOverwriteConfirm', target),
                { ok: t('ok'), cancel: t('cancel') }, { reverse: true });
            modal.onChoose = (answer) => {
                if (answer !== 'ok') return;
                plugin.saveStylePreset(target, true);   
                this.display();
                new Notice(t('presetUpdated', target));
            };
            modal.open();
            return;
        }
        
        
        this.display();
        new Notice(t('presetSaved', value));
    }

    
    renderRestoreRow(containerEl) {
        const t = (key) => this.plugin.t(key);
        const row = new Setting(containerEl);
        row.settingEl.addClass('heading-guard-restore-row');
        
        row.addButton((b) => {
            b.onClick(() => openExternal(REPO_URL));
            b.buttonEl.empty();
            setIcon(b.buttonEl, HELP_ICON);
            b.buttonEl.createEl('span', { text: t('help') });
        });
        row.addButton((b) => {
            b.onClick(() => this.confirmRestoreDefaults());
            
            
            
            b.buttonEl.empty();
            setIcon(b.buttonEl, RESET_ICON);
            b.buttonEl.createEl('span', { text: t('restoreDefaults') });
        });
    }

    
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
        
        
        const keepPresets = plugin.settings.stylePresets;
        plugin.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        plugin.settings.stylePresets = keepPresets;
        await plugin.saveSettings();
        plugin.stopTimer();            
        plugin.retryPending = false;
        plugin.syncBlockedNotified = false;
        plugin.lastSignature = null;   
        this.display();                
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
