const FoliaStageRelease = Object.freeze({
  repository: "m1570908333/spotify-folia",
  version: "1.0.1",
  get latestReleaseApi() {
    return `https://api.github.com/repos/${this.repository}/releases/latest`;
  },
  get installCommand() {
    return `irm https://raw.githubusercontent.com/${this.repository}/main/scripts/install.ps1 | iex`;
  },
  compareVersions(left, right) {
    const parse = (value) => String(value || "").replace(/^v/, "").split(/[+-]/, 1)[0].split(".").map((part) => Number(part));
    const a = parse(left);
    const b = parse(right);
    for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
      const delta = (a[index] || 0) - (b[index] || 0);
      if (delta) return Math.sign(delta);
    }
    return 0;
  },
});

const FoliaStageLocale = (() => {
  const exact = {
      "正在寻找歌词": "Looking for lyrics",
      "按本地、Spotify、LRCLIB、网易云的顺序匹配": "Searching local files, Spotify, LRCLIB, and NetEase Cloud Music",
      "播放一首歌曲": "Play a song",
      "歌词舞台会在音乐开始后自动出现": "The lyric stage appears when playback starts",
      "这首歌暂时没有匹配到歌词": "No matching lyrics were found for this track",
      "可以导入 LRC、YRC、QRC 或 TTML 文件": "Import an LRC, YRC, QRC, or TTML file",
      "导入歌词": "Import lyrics",
      "重新匹配": "Search again",
      "重新匹配歌词": "Search for lyrics again",
      "调整歌词分词": "Edit lyric segmentation",
      "歌词分词调整": "Lyric Segmentation",
      "在需要断开的词之间输入 /，每行必须能完整拼回原歌词": "Separate segments with /. Each line must reconstruct the original lyrics exactly.",
      "关闭": "Close",
      "已调整": "Edited",
      "默认": "Default",
      "无法还原原句": "Does not match the original line",
      "保存后立即应用到当前歌曲": "Changes apply to the current track when saved",
      "导出 JSON": "Export JSON",
      "导出 slash-text": "Export slash-delimited text",
      "导入分词": "Import segmentation",
      "全部恢复默认": "Reset all",
      "保存分词": "Save segmentation",
      "全屏": "Fullscreen",
      "设置": "Settings",
      "舞台模式": "Stage mode",
      "英文舞台": "English Stage",
      "JIZURA": "JIZURA",
      "流动": "Flow",
      "海报": "Poster",
      "群唱": "Cappella",
      "环歌": "Claddagh",
      "莫奈": "Monet",
      "钟摆": "Pendolo",
      "立景": "Diorama",
      "诗笺": "Sonnet",
      "凝彩": "Tempera",
      "绘光": "Lumiere",
      "字幕内容": "Subtitle content",
      "翻译": "Translation",
      "罗马音": "Romanization",
      "翻译+罗马音": "Translation + Romanization",
      "不显示": "Off",
      "主题与字体": "Theme & Typography",
      "主文字": "Primary text",
      "副文字": "Secondary text",
      "舞台底色": "Stage background",
      "固定强调色": "Custom accent color",
      "自动跟随封面": "Match album art",
      "字体名称": "Font family",
      "导入字体": "Import font",
      "无衬线": "Sans serif",
      "衬线": "Serif",
      "等宽": "Monospace",
      "动画强度": "Animation intensity",
      "平静": "Subtle",
      "标准": "Normal",
      "强烈": "Intense",
      "强调色留空时跟随 Spotify 封面配色；导入字体仅保存在本机。": "Leave the accent color blank to match Spotify album art. Imported fonts stay on this device.",
      "歌词来源": "Lyric sources",
      "网易云": "NetEase Cloud Music",
      "替换本地歌词": "Replace local lyrics",
      "导入本地歌词": "Import local lyrics",
      "移除本地歌词": "Remove local lyrics",
      "设置备份": "Settings backup",
      "导出": "Export",
      "导入": "Import",
      "恢复初始设置": "Restore defaults",
      "字形": "Font style",
      "字重": "Font weight",
      "未导入图片": "No image imported",
      "模糊": "Blur",
      "遮罩": "Overlay",
      "饱和度": "Saturation",
      "去色": "Desaturation",
      "主题洗色": "Theme wash",
      "洗色来源": "Wash source",
      "主题色": "Theme color",
      "洗色颜色": "Wash color",
      "半幅偏移": "Split-pane offset",
      "漂移幅度": "Drift amount",
      "画面漂移": "Camera drift",
      "绘画光痕": "Painterly streaks",
      "纸面效果": "Paper effect",
      "抖动": "Dithering",
      "网点": "Halftone dots",
      "压纹": "Fluted glass",
      "纸纹": "Paper texture",
      "抖动矩阵": "Dithering matrix",
      "纹理尺寸": "Texture size",
      "颜色层级": "Color levels",
      "保留原色": "Keep original colors",
      "反相": "Invert",
      "压纹尺寸": "Fluted glass size",
      "压纹扭曲": "Fluted glass distortion",
      "压纹模糊": "Fluted glass blur",
      "纸纹对比": "Paper texture contrast",
      "纸纹粗糙": "Paper texture roughness",
      "纸纹纤维": "Paper texture fibers",
      "网点尺寸": "Halftone size",
      "网点半径": "Halftone radius",
      "网点对比": "Halftone contrast",
      "网点保留原色": "Keep original halftone colors",
      "网点反相": "Invert halftone",
      "镜头扩散": "Lens spread",
      "镜头膨胀": "Lens bulge",
      "纸张遮罩": "Paper overlay",
      "显示层": "Display layer",
      "流体": "Fluid",
      "混合": "Combined",
      "颜色来源": "Color source",
      "舞台主题": "Stage theme",
      "仅播放时动态": "Animate only during playback",
      "增强节拍响应": "Enhanced beat response",
      "网格扭曲": "Mesh distortion",
      "抖动透明度": "Dithering opacity",
      "流体速度": "Fluid speed",
      "抖动速度": "Dithering speed",
      "抖动音频响应": "Dithering audio response",
      "抖动尺寸": "Dithering size",
      "流体旋涡": "Fluid swirl",
      "流体遮罩": "Fluid overlay",
      "纯黑空场": "Black stage",
      "图片池": "Image pool",
      "添加图片": "Add images",
      "导出图片池": "Export image pool",
      "导入图片池": "Import image pool",
      "清空": "Clear",
      "导入模式": "Import mode",
      "追加到当前池": "Append to current pool",
      "替换当前池": "Replace current pool",
      "图片层级": "Image layer",
      "出现频率": "Appearance frequency",
      "缩放": "Scale",
      "透明度": "Opacity",
      "删除图片": "Remove image",
      "自定义头像": "Custom avatar",
      "Monet 自定义肖像": "Custom Monet portrait",
      "导入肖像": "Import portrait",
      "字号": "Font size",
      "时间偏移": "Time offset",
      "旧版词间布局": "Legacy word layout",
      "内置": "Built in",
      "显示引导线": "Show guides",
      "CJK 语义分组": "CJK semantic grouping",
      "焦点放大": "Focus scale",
      "环形半径": "Ring radius",
      "椭圆倾角": "Ellipse tilt",
      "字距偏移": "Letter spacing offset",
      "方形": "Square",
      "竖幅": "Portrait",
      "肖像拖拽柄": "Portrait drag handle",
      "弧形半径": "Arc radius",
      "弧形角度": "Arc angle",
      "中心横移": "Center horizontal offset",
      "中心纵移": "Center vertical offset",
      "擒纵弹性": "Escapement spring",
      "当前行比例": "Current-line scale",
      "镜头速度": "Camera speed",
      "点云密度": "Point-cloud density",
      "点云尺度": "Point-cloud scale",
      "点云辉光": "Point-cloud glow",
      "跟唱辉光": "Sing-along glow",
      "灵魂漂移": "Soul drift",
      "渐变跟唱": "Gradient sing-along",
      "背景环周长": "Background ring perimeter",
      "背景环径向": "Background ring radial spread",
      "背景粒子": "Background particles",
      "点云光晕": "Point-cloud bloom",
      "普通辉光跟唱": "Standard glow sing-along",
      "灵魂出窍跟唱": "Out-of-body sing-along",
      "当前字漂移": "Active glyph drift",
      "几何丝带": "Geometric ribbons",
      "几何团块": "Geometric clusters",
      "几何飘带": "Geometric streamers",
      "几何圆环": "Geometric rings",
      "整行镜头": "Whole-line cut",
      "色块": "Color blocks",
      "边角线框": "Corner frames",
      "文字动态反色": "Dynamic text inversion",
      "后处理": "Post-processing",
      "仅显示文字": "Text only",
      "引导线": "Guides",
      "固定几何": "Fixed geometry",
      "巨大装饰文字": "Oversized decorative text",
      "线稿": "Line art",
      "前景散景": "Foreground bokeh",
      "轨迹线": "Motion trails",
      "无缝段落转场": "Seamless stanza transitions",
      "主题图标": "Theme icon",
      "内存": "Memory",
      "工程嵌套过深": "Project nesting is too deep",
      "工程含无效数值": "Project contains an invalid number",
      "工程含不安全字段": "Project contains an unsafe field",
      "背景切换": "Background switching",
      "切点（秒）": "Cut point (seconds)",
      "镜头参数快照": "Cut parameter snapshot",
      "原版文字整列": "Native text stacking",
      "扩展效果": "Extended effects",
      "原版抽帧": "Native frame stepping",
      "隐藏镜头编号": "Hide cut numbers",
      "隐藏舞台时间": "Hide stage time",
      "在线字体": "Online fonts",
      "画面、配色与字体": "Visuals, colors & fonts",
      "合成背景": "Composite background",
      "中央留白": "Keep center clear",
      "留白方向": "Clear-space direction",
      "自定义底色与文字": "Custom background and text colors",
      "随机编排时锁定此类别": "Lock this category when randomizing",
      "使用全部": "Use all",
      "参数随机锁": "Parameter random locks",
      "时间轴与效果预览": "Timeline & effect preview",
      "重新编排": "Rearrange",
      "随机主题配置": "Randomize theme settings",
      "只支持镜头参数字段": "Only cut parameter fields are supported",
      "切点（秒）": "Cut point (seconds)",
      "JIZURA 时间轴当前歌词": "JIZURA timeline lyric",
      "JIZURA 预览效果类别": "JIZURA preview category",
      "JIZURA 预览效果": "JIZURA preview effect",
      "JIZURA 镜头参数 JSON": "JIZURA cut parameters JSON",
      "请选择 20 MB 以内的字体文件": "Choose a font file under 20 MB",
      "当前编码器未写入音轨，可另导出 WAV": "The current encoder omitted audio. Export a WAV separately.",
      "JIZURA 导出进度": "JIZURA export progress",
      "字体保存取消": "Font save cancelled",
      "音频响应": "Audio response",
      "原版工程导出失败": "Native project export failed",
      "工程超过 8 MB，请移除嵌入媒体后重试": "Project exceeds 8 MB. Remove embedded media and try again.",
      "导入期间歌曲已切换，请重新导入": "The track changed during import. Import again.",
      "不是 Folia Stage 设置文件": "Not a Folia Stage settings file",
      "恢复自动切点": "Restore automatic cut timing",
      "跟随主题": "Follow theme",
      "歌词语言": "Lyric language",
      "动感效果": "Kinetic effects",
      "闪光效果": "Flash effects",
      "自定义强调色": "Custom accent color",
      "候选效果池与随机锁": "Effect pools and random locks",
      "逐行与逐镜头编排": "Line and cut arrangement",
      "scheme 必须是 0 到 255 的整数": "Scheme must be an integer from 0 to 255",
      "morph 必须包含有效 dur 时长": "Morph must include a valid duration",
      "原版": "Native",
      "背景": "Background",
      "主题": "Theme",
      "效果": "Effect",
      "动画": "Animation",
      "装饰": "Decorations",
      "镜头": "Cut",
      "排版": "Layout",
      "入场": "Entrance",
      "持续运动": "Hold",
      "退场": "Exit",
      "转场": "Transition",
      "画面特效": "Visual effects",
      "材质": "Texture",
      "色差": "Chromatic aberration",
      "故障强度": "Glitch intensity",
      "运动幅度": "Motion amount",
      "装饰密度": "Decoration density",
      "全部": "All",
      "无": "None",
      "纯色": "Solid color",
      "完整": "Full",
      "轻量": "Subtle",
      "省电": "Power saving",
      "单色": "Monochrome",
      "双色": "Duotone",
      "渐变": "Gradient",
      "上下分区": "Top / bottom split",
      "左右分区": "Left / right split",
      "绿幕合成": "Green-screen composite",
      "黑底合成": "Black composite",
      "日语": "Japanese",
      "简体中文": "Simplified Chinese",
      "繁体中文": "Traditional Chinese",
      "韩语": "Korean",
      "封面强度": "Album-art intensity",
      "渲染器": "Renderer",
      "歌词": "Lyrics",
      "字体已导入": "Font imported",
      "自动跟随封面": "Match album art",
      "背景类型": "Background type",
      "自定义背景图片": "Custom background image",
      "导入字体": "Import font",
      "无衬线": "Sans serif",
      "衬线": "Serif",
      "等宽": "Monospace",
      "平静": "Subtle",
      "强烈": "Intense",
      "未导入图片": "No image imported",
      "封面流体底色": "Album-art fluid background",
      "几何图形": "Geometric shapes",
      "暗角": "Vignette",
      "歌词来源": "Lyric source",
      "替换本地歌词": "Replace local lyrics",
      "导入本地歌词": "Import local lyrics",
      "移除本地歌词": "Remove local lyrics",
      "设置备份": "Settings backup",
      "导出": "Export",
      "导入": "Import",
      "恢复初始设置": "Restore defaults",
      "运行状态": "Diagnostics",
      "未导入图片": "No image imported",
      "歌词后方": "Behind lyrics",
      "歌词前方": "In front of lyrics",
      "上传文件": "Choose file",
      "未选择文件": "No file chosen",
      "未导入图片": "No image imported",
      "设置": "Settings",
      "归零": "Reset",
      "更换字体": "Change font",
      "英文 PV 舞台": "English PV stage",
      "镜头运动": "Camera motion",
      "光束强度": "Beam intensity",
      "粒子密度": "Particle density",
      "残影强度": "Ghost intensity",
      "镜头切换": "Camera switching",
      "歌词散开": "Lyric spread",
      "显示前后词": "Show surrounding words",
      "显示舞台信息": "Show stage information",
      "显示整句": "Show full line",
      "词语旋转": "Word rotation",
      "中心渐变": "Center gradient",
      "表盘封面": "Watch-face cover",
      "歌词辉光": "Lyric glow",
      "字形运动": "Glyph motion",
      "光强": "Light intensity",
      "烟雾浓度": "Fog density",
      "暗场": "Dark field",
      "浮尘": "Floating dust",
      "图形辉光": "Graphic bloom",
      "文字辉光": "Text bloom",
      "崩解": "Disintegration",
      "背景歌词": "Background lyrics",
      "主题色占比": "Theme color mix",
      "未点亮透明度": "Unlit opacity",
      "邻近窗口": "Neighboring windows",
      "烟雾层数": "Fog layers",
      "歌词后方": "Behind lyrics",
      "歌词前方": "In front of lyrics",
      "封面强度 75%": "Album-art intensity 75%",
      "渲染器 dom": "Renderer dom",
      "歌词 0 行 / 0 词": "Lyrics 0 lines / 0 words",
      "原版 Classic 调节": "Classic settings",
      "原版 Cappella 调节": "Cappella settings",
      "原版 Partita 调节": "Partita settings",
      "原版 Claddagh / 环歌": "Claddagh settings",
      "原版 Monet / 莫奈": "Monet settings",
      "原版 Pendolo / 钟摆": "Pendolo settings",
      "原版 Diorama / 立景 3D": "Diorama 3D settings",
      "原版 Tempera / 凝彩": "Tempera settings",
      "原版 Sonnet / 商籁": "Sonnet settings",
      "原版 Lumiere / 绘光": "Lumiere settings",
      "字形运动": "Glyph motion",
      "落定延展": "Settle stretch",
      "呼吸浮动": "Breathing motion",
      "词间距": "Word spacing",
      "最小错位": "Minimum stagger",
      "最大错位": "Maximum stagger",
      "显示动态轴线": "Show dynamic axis",
      "舞台字号": "Stage font size",
      "肖像横移": "Portrait offset",
      "音频图形": "Audio visualization",
      "条形": "Bars",
      "波形": "Waveform",
      "肖像形状": "Portrait shape",
      "肖像来源": "Portrait source",
      "齿轮装饰": "Gear decorations",
      "几何模式": "Geometry mode",
      "场景点云": "Scene point cloud",
      "点隧道": "Point tunnel",
      "几何点云": "Geometric point cloud",
      "镜头强度": "Camera intensity",
      "落定延展": "Settle stretch",
      "纹理分辨率": "Texture resolution",
      "纹理压缩": "Texture compression",
      "胶片颗粒": "Film grain",
      "对比度": "Contrast",
      "暗角": "Vignette",
      "镜头畸变": "Lens distortion",
      "RGB 偏移": "RGB shift",
      "排版运动": "Typography motion",
      "MG 密度": "Motion-graphics density",
      "外框": "Outer frame",
      "画框": "Frame",
      "半色调": "Halftone",
      "镜头色散": "Lens dispersion",
      "本曲 JIZURA 工程": "JIZURA project for this track",
      "有未保存修改": "Unsaved changes",
      "已保存": "Saved",
      "未保存": "Not saved",
      "保存本曲": "Save for this track",
      "撤销": "Undo",
      "重做": "Redo",
      "导出工程": "Export project",
      "导出原版 JSON": "Export native JSON",
      "导入工程": "Import project",
      "清除本曲": "Clear this track",
      "隐藏轨迹线": "Hide motion trails",
      "画质": "Render quality",
      "平衡": "Balanced",
      "运行状态": "Diagnostics",
      "恢复 Folia Stage 初始设置？歌词、缓存和已导入资源不会被删除。": "Restore Folia Stage defaults? Lyrics, cache, and imported assets will be kept.",
      "内存数据不可用": "Memory usage unavailable",
      "音频分析可用": "Audio analysis available",
      "歌曲说明": "Track description",
      "重新加载": "Reload",
      "背景类型": "Background type",
      "自定义背景图片": "Custom background image",
      "删除": "Remove",
      "封面流体底色": "Album-art fluid background",
      "几何图形": "Geometric shapes",
      "暗角": "Vignette",
      "背景来源": "Background source",
      "封面": "Album art",
      "自定义": "Custom",
      "画面布局": "Layout",
      "全幅": "Full frame",
      "半幅": "Split frame",
      "正在检查": "Checking…",
      "本地音频与离线导出": "Local Audio & Export",
      "本地音频": "Local audio",
      "恢复本曲音频": "Restore track audio",
      "移除本曲音频": "Remove track audio",
      "导出格式": "Export format",
      "PNG 序列": "PNG sequence",
      "透明 PNG 序列": "Transparent PNG sequence",
      "分层 PNG 序列": "Layered PNG sequence",
      "本地音频 WAV": "Local audio WAV",
      "分辨率": "Resolution",
      "帧率": "Frame rate",
      "画幅": "Aspect ratio",
      "画质": "Quality",
      "开始（秒）": "Start (seconds)",
      "结束（秒，0 为末尾）": "End (seconds, 0 = end)",
      "包含本地音轨": "Include local audio",
      "直接写入 MP4 文件": "Write directly to MP4 file",
      "取消": "Cancel",
      "效果动画预览": "Effect Preview",
      "效果类别": "Effect category",
      "搜索效果": "Search effects",
      "效果": "Effect",
      "应用此效果": "Apply effect",
      "恢复此类自动选择": "Restore automatic selection",
      "原版效果选择": "JIZURA Effect Selection",
      "自动": "Automatic",
      "镜头密度": "Cut density",
      "音乐响应": "Audio response",
      "运动幅度": "Motion amount",
      "装饰密度": "Decoration density",
      "字体已保存到本机": "Font saved on this device",
      "锁定本行画面": "Lock this line",
      "重排本行": "Regenerate this line",
      "重置本行": "Reset this line",
      "手动分词（用 / 分隔）": "Manual segmentation (use /)",
      "重音词（用 , 分隔）": "Emphasized words (use commas)",
      "强调句": "Emphasize line",
      "原版 JIZURA v1 工程": "Native JIZURA v1 project",
      "整行单镜头": "Single cut for the whole line",
      "原版 Classic 调节": "Classic settings",
      "显示字幕": "Show subtitles",
      "弱化非当前行": "Dim inactive lines",
      "只显示歌词": "Lyrics only",
      "Nothing playing": "Nothing playing",
      "标准": "Standard",
      "纸感": "Paper",
      "潜像": "Latent",
      "网页": "Web",
      "星空": "Starfield",
      "播放一首歌曲": "Play a song",
      "选择文件": "Choose file",
      "颜色模式": "Color mode",
      "设置": "Settings",
      "应用": "Apply",
      "保存": "Save",
      "歌曲": "Track",
      "行": "lines",
      "词": "words",
      "字幕": "Subtitle",
      "字幕字号": "Subtitle size",
      "字幕底板": "Subtitle backdrop",
      "模糊即将出现的字幕": "Blur upcoming subtitles",
      "封面流体底色": "Album-art fluid background",
      "几何图形": "Geometric shapes",
      "暗角": "Vignette",
      "自定义背景图片": "Custom background image",
      "像素化": "Pixelation",
      "背景来源": "Background source",
      "画面布局": "Frame layout",
      "肖像形状": "Portrait shape",
      "关键词着色": "Highlight keywords",
      "显示表情回复": "Show emoji responses",
      "Emoji 来源": "Emoji source",
      "头像来源": "Avatar source",
      "气泡动画": "Bubble animation",
      "候选池": "Effect pool",
      "分词备份格式无效": "Invalid segmentation backup file",
      "分词文件格式无效": "Invalid segmentation file",
      "不是 Folia Stage 分词文件": "Not a Folia Stage segmentation file",
      "分词文件不属于当前歌曲": "Segmentation file is for a different track",
      "没有找到可匹配的歌词行": "No matching lyric lines found",
      "分词文件为空": "Segmentation file is empty",
      "没有找到可匹配的 slash-text 歌词行": "No matching slash-delimited lyric lines found",
      "当前没有歌曲": "No track is currently playing",
      "音频存储已取消": "Audio storage was cancelled",
      "请选择 80 MB 以内的音频文件": "Choose an audio file under 80 MB",
      "音频时长须在 30 分钟以内": "Audio must be 30 minutes or shorter",
      "没有可导出的同步歌词": "There are no synchronized lyrics to export",
      "导出结束时间须晚于开始时间": "Export end time must be after its start time",
      "已取消": "Cancelled",
      "WAV 导出需要先导入本地音频": "Import local audio before exporting WAV",
      "PNG 序列一次最多导出 3600 张，请缩小时间范围": "PNG sequences are limited to 3,600 frames. Shorten the export range.",
      "不支持的导出格式": "Unsupported export format",
      "本地音频已分析并保存": "Local audio analyzed and saved",
      "音频已分析，但本机存储失败，重启后需重新导入": "Audio analyzed, but local storage failed. Reimport it after restarting.",
      "导出完成": "Export complete",
      "本曲音频已恢复": "Track audio restored",
      "本曲没有保存的音频": "No audio is saved for this track",
      "已移除本曲音频": "Track audio removed",
      "首拍（秒）": "First beat (seconds)",
      "导出": "Export",
      "直接写入 MP4 文件": "Write MP4 directly to file",
      "当前播放时间不可用": "Current playback time is unavailable",
      "打点时间须位于相邻歌词之间": "The timestamp must fall between adjacent lyric lines",
      "记录当前进度": "Set to current position",
      "记录并下一行": "Set position and select next line",
      "跳转本行": "Seek to this line",
      "恢复源时间轴": "Restore original timing",
      "当前歌词": "Current lyric",
      "等待同步歌词": "Waiting for synchronized lyrics",
      "应用参数并锁定": "Apply parameters and lock",
      "高级 JSON": "Advanced JSON",
      "参数必须是对象": "Parameters must be an object",
      "动画时长必须在本镜头时长以内": "Animation duration must fit within this cut",
      "装饰参数无效": "Invalid decoration settings",
      "恢复自动装饰": "Restore automatic decorations",
      "整行单镜头": "Single cut for the whole line",
      "重排本行": "Regenerate this line",
      "重置本行": "Reset this line",
      "锁定本行画面": "Lock this line's composition",
      "手动分词（用 / 分隔）": "Manual segmentation (separate with /)",
      "重音词（用 , 分隔）": "Emphasized words (separate with commas)",
      "强调句": "Emphasize this line",
      "装饰": "Decorations",
      "镜头数": "Cut count",
      "原版效果选择": "JIZURA effect selection",
      "导入原版工程 JSON": "Import native project JSON",
      "导入工程": "Import project",
      "导出工程": "Export project",
      "保存本曲": "Save for this track",
      "清除本曲": "Clear this track",
      "撤销": "Undo",
      "重做": "Redo",
      "恢复此类自动选择": "Restore automatic selection for this category",
      "颜色模式": "Color mode",
      "主题": "Theme",
      "和风": "Japanese",
      "惊悚": "Horror",
      "流行": "Pop",
      "抒情": "Ballad",
      "动感编排": "Kinetic",
      "文字 PV": "Lyric PV",
      "排版": "Layout",
      "入场": "Entrance",
      "持续运动": "Hold",
      "退场": "Exit",
      "文字处理": "Typography effects",
      "背景": "Background",
      "镜头": "Camera",
      "画面特效": "Visual effects",
      "转场": "Transitions",
      "音频已分析，但本机存储失败，重启后需重新导入": "Audio analyzed but could not be saved. Reimport it after restarting.",
      "文件中没有可用歌词": "No usable lyrics were found in the file",
      "这首歌暂时没有匹配到歌词": "No matching lyrics were found for this track",
      "本曲 JIZURA 工程": "JIZURA project for this track",
      "有未保存修改": "Unsaved changes",
      "已保存": "Saved",
      "未保存": "Not saved",
      "歌词来源": "Lyric source",
      "替换本地歌词": "Replace local lyrics",
      "导入本地歌词": "Import local lyrics",
      "调整歌词分词": "Edit lyric segmentation",
      "恢复初始设置": "Restore defaults",
    };
  return Object.freeze({
  en(value) {
    if (typeof value !== "string" || !/[\u4e00-\u9fff]/.test(value)) return value;
    if (Object.hasOwn(exact, value)) return exact[value];
    const dynamic = value
      .replace(/歌词\s*(\d+)\s*行\s*\/\s*(\d+)\s*词/g, "Lyrics $1 lines / $2 words")
      .replace(/已导入\s*(\d+)\s*行分词/g, "Imported $1 lines of segmentation")
      .replace(/分词导入失败：/g, "Segmentation import failed: ")
      .replace(/已替换\s*(\d+)\s*张 Tempera 图片/g, "Replaced $1 Tempera images")
      .replace(/已追加\s*(\d+)\s*张 Tempera 图片/g, "Added $1 Tempera images")
      .replace(/Cappella 资源导入失败：/g, "Cappella asset import failed: ")
      .replace(/Monet 资源导入失败：/g, "Monet asset import failed: ")
      .replace(/JIZURA 字体尚未导入：/g, "JIZURA fonts are not imported: ")
      .replace(/效果预览失败：/g, "Effect preview failed: ")
      .replace(/字体已保存到本机/g, "Font saved on this device")
      .replace(/字体导入失败：/g, "Font import failed: ")
      .replace(/已导入字体：/g, "Imported font: ")
      .replace(/本曲 JIZURA 工程已保存/g, "JIZURA project saved for this track")
      .replace(/原版工程导出失败：/g, "Native project export failed: ")
      .replace(/工程导出失败：/g, "Project export failed: ")
      .replace(/JIZURA 已导入：歌词匹配\s*(\d+)\/(\d+)\s*行，未匹配的逐行设置已跳过/g, "JIZURA imported: matched $1/$2 lyric lines; unmatched line settings were skipped")
      .replace(/JIZURA 工程已导入到当前歌曲/g, "JIZURA project imported for the current track")
      .replace(/工程导入失败：/g, "Project import failed: ")
      .replace(/已清除本曲 JIZURA 工程及逐行设置/g, "Cleared the JIZURA project and line settings for this track")
      .replace(/已为《([^》]+)》导入歌词/g, 'Imported lyrics for "$1"')
      .replace(/歌词导入失败：/g, "Lyric import failed: ")
      .replace(/Folia Stage 设置已导入/g, "Folia Stage settings imported")
      .replace(/设置导入失败：/g, "Settings import failed: ")
      .replace(/舞台设置已恢复初始值/g, "Stage settings restored to defaults")
      .replace(/第\s*(\d+)\s*行\s*·/g, "Line $1 ·")
      .replace(/字体保存取消/g, "Font save cancelled")
      .replace(/不是有效的 JIZURA v1 工程/g, "Invalid JIZURA v1 project")
      .replace(/等待同步歌词/g, "Waiting for synchronized lyrics");
    if (dynamic !== value) return dynamic;
    const fragments = Object.entries(exact)
      .filter(([source]) => source.length > 1)
      .sort((left, right) => right[0].length - left[0].length);
    let translated = value;
    for (const [source, target] of fragments) translated = translated.split(source).join(target);
    return translated
      .replace(/第\s*(\d+)\s*行开始时间/g, "Line $1 start time")
      .replace(/([A-Za-z0-9_]+) 必须是参数对象/g, "$1 must be a parameter object")
      .replace(/字重\s*(\d+)/g, "Font weight $1")
      .replace(/封面强度\s*(\d+)%/g, "Album-art intensity $1%")
      .replace(/渲染器\s*([\w-]+)/g, "Renderer $1")
      .replace(/歌词\s*(\d+)\s*行\s*\/\s*(\d+)\s*词/g, "Lyrics $1 lines / $2 words")
      .replace(/歌词\s*(\d+)\s*行\s*\/\s*(\d+)\s*个单词/g, "Lyrics $1 lines / $2 words")
      .replace(/更换字体（([^）]+)）/g, "Change font ($1)")
      .replace(/(\d+)\s*行需要修正/g, "$1 lines need correction")
      .replace(/(?:歌词)?匹配\s*(\d+)\/(\d+)\s*行/g, "matched $1/$2 lines")
      .replace(/内存\s*(\d+)\s*MB/g, "Memory $1 MB")
      .replace(/镜头强度\s*([\d.]+)x/g, "Camera intensity $1x")
      .replace(/字形运动\s*([\d.]+)x/g, "Glyph motion $1x")
      .replace(/落定延展\s*(\d+)%/g, "Settle stretch $1%")
      .replace(/舞台字号\s*([\d.]+)x/g, "Stage font size $1x")
      .replace(/肖像横移\s*(-?[\d.]+)px/g, "Portrait offset $1px")
      .replace(/纹理分辨率\s*([\d.]+)x/g, "Texture resolution $1x")
      .replace(/呼吸浮动\s*([\d.]+)x/g, "Breathing motion $1x")
      .replace(/词间距\s*([\d.]+)x/g, "Word spacing $1x")
      .replace(/最小错位\s*(\d+)px/g, "Minimum stagger $1px")
      .replace(/最大错位\s*(\d+)px/g, "Maximum stagger $1px")
      .replace(/胶片颗粒\s*(\d+)%/g, "Film grain $1%")
      .replace(/本曲 JIZURA 工程 ·/g, "JIZURA project ·")
      .replace(/第\s*(\d+)\s*行/g, "Line $1")
      .replace(/镜头\s*(\d+)/g, "Cut $1")
      .replace(/(\d+)\s*秒/g, "$1 s")
      .replace(/检查时间/g, "Checked at")
      .replace(/上游仓库/g, "Upstream repository")
      .replace(/迁移基线/g, "Migration baseline")
      .replace(/最新发布/g, "Latest release")
      .replace(/待审查适配/g, "Adaptation review required")
      .replace(/检查失败/g, "Check failed")
      .replace(/源码与迁移基线一致/g, "Source matches migration baseline")
      .replace(/上游源码有变更/g, "Upstream source changed")
      .replace(/尚未检查/g, "Not checked yet")
      .replace(/全部/g, "All")
      .replace(/无/g, "None")
      .replace(/纯色/g, "Solid color")
      .replace(/完整/g, "Full")
      .replace(/轻量/g, "Subtle")
      .replace(/省电/g, "Power saving")
      .replace(/单色/g, "Monochrome")
      .replace(/双色/g, "Duotone")
      .replace(/渐变/g, "Gradient")
      .replace(/上下分区/g, "Top / bottom split")
      .replace(/左右分区/g, "Left / right split")
      .replace(/绿幕合成/g, "Green-screen composite")
      .replace(/黑底合成/g, "Black composite")
      .replace(/自定义强调色/g, "Custom accent color")
      .replace(/跟随主题/g, "Follow theme")
      .replace(/歌词语言/g, "Lyric language")
      .replace(/简体中文/g, "Simplified Chinese")
      .replace(/繁体中文/g, "Traditional Chinese")
      .replace(/日语/g, "Japanese")
      .replace(/韩语/g, "Korean")
      .replace(/原版/g, "Native")
      .replace(/逐行与逐镜头编排/g, "Line and cut arrangement")
      .replace(/随机主题配置/g, "Random theme configuration")
      .replace(/候选效果池与随机锁/g, "Effect pools and random locks")
      .replace(/恢复自动切点/g, "Restore automatic cut timing")
      .replace(/恢复自动装饰/g, "Restore automatic decorations")
      .replace(/自定义/g, "Custom")
      .replace(/自动/g, "Automatic")
      .replace(/配色与字体/g, "Colors and fonts")
      .replace(/配色/g, "Colors")
      .replace(/字体/g, "Font")
      .replace(/主题/g, "Theme")
      .replace(/效果/g, "Effect")
      .replace(/镜头/g, "Cut")
      .replace(/动画/g, "Animation")
      .replace(/音乐响应/g, "Audio response")
      .replace(/装饰/g, "Decorations")
      .replace(/背景/g, "Background")
      .replace(/文字/g, "Text")
      .replace(/排版/g, "Layout")
      .replace(/入场/g, "Entrance")
      .replace(/持续运动/g, "Hold")
      .replace(/退场/g, "Exit")
      .replace(/转场/g, "Transition")
      .replace(/画面特效/g, "Visual effects")
      .replace(/材质/g, "Texture")
      .replace(/色差/g, "Chromatic aberration")
      .replace(/故障强度/g, "Glitch intensity")
      .replace(/运动幅度/g, "Motion amount")
      .replace(/装饰密度/g, "Decoration density")
      .replace(/高级/g, "Advanced")
      .replace(/情绪/g, "Mood")
      .replace(/扩展效果/g, "Extended effects")
      .replace(/连贯编排/g, "Continuous arrangement")
      .replace(/闪光效果/g, "Flash effects")
      .replace(/动感效果/g, "Kinetic effects")
      .replace(/和风效果/g, "Japanese effects")
      .replace(/惊悚效果/g, "Horror effects");
  },
  element(React, type, props, ...children) {
    const localize = (value) => Array.isArray(value)
      ? value.map(localize)
      : typeof value === "string" ? this.en(value) : value;
    const nextProps = props ? { ...props } : props;
    if (nextProps) {
      for (const key of ["title", "aria-label", "placeholder", "alt"]) {
        if (typeof nextProps[key] === "string") nextProps[key] = this.en(nextProps[key]);
      }
    }
    return React.createElement(type, nextProps, ...children.map(localize));
  },
  });
})();
