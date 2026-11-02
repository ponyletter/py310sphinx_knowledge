# Configuration file for the Sphinx documentation builder.
import os
import sys
import re

# -- Project information -----------------------------------------------------
project = '创作学院课程资料库'
copyright = '2026, 创作学院'
author = '创作学院'
release = '1.0.0'

# -- General configuration ---------------------------------------------------
extensions = [
    'myst_parser',
    'sphinx_rtd_theme',
    'sphinx_design',
    'sphinx_copybutton',
    'sphinx_togglebutton',
    'sphinxcontrib.mermaid',
]

# MyST Markdown 配置
myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "dollarmath",
    "fieldlist",
    "html_admonition",
    "html_image",
    "replacements",
    "smartquotes",
    "strikethrough",
    "substitution",
    "tasklist",
]
myst_fence_as_directive = ["mermaid"]

source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']
language = 'zh_CN'
html_search_language = 'zh'

# -- Chinese Search Engine Enhancement ---------------------------------------
try:
    import jieba
    from sphinx.search import languages
    from sphinx.search.zh import SearchChinese

    js_chinese_splitter = """
var splitQuery = function(query) {
  if (!query) return [];
  var result = [];
  var latin = query.match(/[a-zA-Z0-9_\\-\\.]+/g) || [];
  for (var i = 0; i < latin.length; i++) {
    if (latin[i].length > 1) result.push(latin[i].toLowerCase());
  }
  var cjk = query.match(/[\\u4e00-\\u9fa5]+/g) || [];
  for (var j = 0; j < cjk.length; j++) {
    var seq = cjk[j];
    result.push(seq);
    for (var k = 0; k < seq.length - 1; k++) {
      result.push(seq.substr(k, 2));
    }
  }
  return result;
};
"""

    class EnhancedSearchChinese(SearchChinese):
        js_splitter_code = js_chinese_splitter

        def init(self, options: dict[str, str]) -> None:
            super().init(options)
            domain_words = [
                '软路由', '硬路由', '搬瓦工', '微信小程序', '小程序', '容器虚拟化', '虚拟化',
                '国内分流', '海外分流', '住宅代理', '机房代理', '端口转发', '流量守卫', '云服务器',
                '链式代理', '分流规则', '域名嗅探', '双栈', '后量子', '量子安全', '大模型',
                '中转链路', '直连链路', '内网穿透', '高可用', '透明代理', '回程路由', '流媒体解锁',
                '双重代理', '动态路由', '多网卡', '网桥', 'PassWall', 'ImmortalWrt', 'OpenWrt',
                '3X-UI', 'Mihomo', 'Clash Verge', 'Streisand', 'Shadowrocket', 'Sing-box',
                'V2Ray', 'Xray', 'Trojan', 'Hysteria', 'VLESS', 'VMess', 'Reality', 'WireGuard',
                'Tailscale', 'BGP', 'LXC', 'LXD', 'KVM', 'Proxmox', 'PVE', 'Docker', 'SOP'
            ]
            for w in domain_words:
                jieba.add_word(w)

        def split(self, input: str) -> list[str]:
            words = list(jieba.cut_for_search(input))
            latin = [t.strip().lower() for t in self.latin1_letters.findall(input)]
            self.latin_terms.update(latin)
            
            cjk_chunks = re.findall(r'[\u4e00-\u9fa5]+', input)
            bigrams = []
            for chunk in cjk_chunks:
                if len(chunk) >= 2:
                    for i in range(len(chunk) - 1):
                        bigrams.append(chunk[i:i+2])

            return words + latin + bigrams

    languages['zh'] = EnhancedSearchChinese
except Exception as e:
    print(f"Warning: Failed to load EnhancedSearchChinese: {e}", file=sys.stderr)

# -- Options for HTML output -------------------------------------------------
html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_js_files = [
    'js/chinese_search.js',
]

html_theme_options = {
    'navigation_depth': 4,
    'collapse_navigation': False,
    'sticky_navigation': True,
    'includehidden': True,
    'titles_only': False,
    'prev_next_buttons_location': 'both',
}
