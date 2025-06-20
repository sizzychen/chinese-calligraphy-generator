/**
 * Font Configuration for Chinese Copybook Generator
 * Defines available font lists, font file path mappings, and display names
 */

const path = require('path');

// Font configuration object
const fontConfig = {
    // Available font types
    fontTypes: {
        'serif': {
            displayName: '宋体 (Serif)',
            description: '传统宋体，笔画清晰，适合正式练字',
            category: 'serif',
            weight: 'normal',
            fallbacks: ['SimSun', '宋体', 'serif']
        },
        'sans-serif': {
            displayName: '黑体 (Sans-serif)',
            description: '现代黑体，笔画简洁，适合日常练习',
            category: 'sans-serif',
            weight: 'normal',
            fallbacks: ['Microsoft YaHei', '微软雅黑', 'PingFang SC', 'sans-serif']
        },
        'cursive': {
            displayName: '楷体 (Cursive)',
            description: '楷书风格，笔画流畅，适合书法练习',
            category: 'cursive',
            weight: 'normal',
            fallbacks: ['KaiTi', '楷体', 'cursive']
        },
        'fantasy': {
            displayName: '装饰体 (Fantasy)',
            description: '装饰字体，风格独特，适合创意练习',
            category: 'fantasy',
            weight: 'normal',
            fallbacks: ['华文新魏', 'fantasy']
        }
    },

    // Google Fonts mapping
    googleFonts: {
        'serif': [
            'Noto Serif SC',
            'Source Han Serif SC'
        ],
        'sans-serif': [
            'Noto Sans SC',
            'Source Han Sans SC'
        ],
        'cursive': [
            'ZCOOL KuaiLe',
            'Ma Shan Zheng'
        ],
        'fantasy': [
            'ZCOOL XiaoWei',
            'Liu Jian Mao Cao'
        ]
    },

    // System fonts mapping
    systemFonts: {
        'serif': [
            'SimSun',
            '宋体',
            'Times New Roman'
        ],
        'sans-serif': [
            'Microsoft YaHei',
            '微软雅黑',
            'PingFang SC',
            'Helvetica Neue',
            'Arial'
        ],
        'cursive': [
            'KaiTi',
            '楷体',
            'Brush Script MT'
        ],
        'fantasy': [
            '华文新魏',
            'Papyrus',
            'Impact'
        ]
    },

    // Font file paths (for server-side rendering)
    fontFiles: {
        'serif': {
            regular: path.join(__dirname, '..', 'public', 'fonts', 'NotoSerifSC-Regular.ttf'),
            bold: path.join(__dirname, '..', 'public', 'fonts', 'NotoSerifSC-Bold.ttf')
        },
        'sans-serif': {
            regular: path.join(__dirname, '..', 'public', 'fonts', 'NotoSansSC-Regular.ttf'),
            bold: path.join(__dirname, '..', 'public', 'fonts', 'NotoSansSC-Bold.ttf')
        },
        'cursive': {
            regular: path.join(__dirname, '..', 'public', 'fonts', 'ZCOOLKuaiLe-Regular.ttf')
        },
        'fantasy': {
            regular: path.join(__dirname, '..', 'public', 'fonts', 'ZCOOLXiaoWei-Regular.ttf')
        }
    },

    // CSS font stacks
    cssFontStacks: {
        'serif': '"Noto Serif SC", "Source Han Serif SC", "SimSun", "宋体", serif',
        'sans-serif': '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", "微软雅黑", sans-serif',
        'cursive': '"ZCOOL KuaiLe", "Ma Shan Zheng", "KaiTi", "楷体", cursive',
        'fantasy': '"ZCOOL XiaoWei", "Liu Jian Mao Cao", "华文新魏", fantasy'
    },

    // Font loading priorities (for optimization)
    loadingPriority: {
        'serif': 1,
        'sans-serif': 2,
        'cursive': 3,
        'fantasy': 4
    },

    // Font sizes for different contexts
    fontSizes: {
        grid: {
            small: 0.6,   // 60% of cell size
            medium: 0.75, // 75% of cell size
            large: 0.85   // 85% of cell size
        },
        ui: {
            small: '12px',
            medium: '14px',
            large: '16px'
        }
    },

    // Default settings
    defaults: {
        fontType: 'serif',
        fontSize: 'medium',
        weight: 'normal',
        lineHeight: 1.0
    }
};

/**
 * Get font display name by type
 */
function getFontDisplayName(fontType) {
    const font = fontConfig.fontTypes[fontType];
    return font ? font.displayName : fontType;
}

/**
 * Get font CSS stack by type
 */
function getFontCSSStack(fontType) {
    return fontConfig.cssFontStacks[fontType] || fontConfig.cssFontStacks.serif;
}

/**
 * Get font file path by type and weight
 */
function getFontFilePath(fontType, weight = 'regular') {
    const fontFiles = fontConfig.fontFiles[fontType];
    if (!fontFiles) return null;
    
    return fontFiles[weight] || fontFiles.regular || null;
}

/**
 * Get all available font types
 */
function getAvailableFontTypes() {
    return Object.keys(fontConfig.fontTypes);
}

/**
 * Get font configuration for frontend
 */
function getFrontendFontConfig() {
    return {
        fontTypes: Object.keys(fontConfig.fontTypes).map(key => ({
            value: key,
            displayName: fontConfig.fontTypes[key].displayName,
            description: fontConfig.fontTypes[key].description
        })),
        cssFontStacks: fontConfig.cssFontStacks,
        defaults: fontConfig.defaults
    };
}

/**
 * Get font configuration for backend
 */
function getBackendFontConfig() {
    return {
        fontFiles: fontConfig.fontFiles,
        systemFonts: fontConfig.systemFonts,
        googleFonts: fontConfig.googleFonts,
        defaults: fontConfig.defaults
    };
}

/**
 * Validate font type
 */
function isValidFontType(fontType) {
    return fontType && fontConfig.fontTypes.hasOwnProperty(fontType);
}

/**
 * Get fallback fonts for a type
 */
function getFallbackFonts(fontType) {
    const font = fontConfig.fontTypes[fontType];
    return font ? font.fallbacks : [];
}

/**
 * Get Google Fonts for a type
 */
function getGoogleFonts(fontType) {
    return fontConfig.googleFonts[fontType] || [];
}

/**
 * Get system fonts for a type
 */
function getSystemFonts(fontType) {
    return fontConfig.systemFonts[fontType] || [];
}

/**
 * Build complete font family string
 */
function buildFontFamily(fontType) {
    const googleFonts = getGoogleFonts(fontType);
    const systemFonts = getSystemFonts(fontType);
    const fallbacks = getFallbackFonts(fontType);
    
    const allFonts = [
        ...googleFonts.map(font => `"${font}"`),
        ...systemFonts.map(font => font.includes(' ') ? `"${font}"` : font),
        ...fallbacks
    ];
    
    return allFonts.join(', ');
}

module.exports = {
    // Configuration object
    fontConfig,
    
    // Utility functions
    getFontDisplayName,
    getFontCSSStack,
    getFontFilePath,
    getAvailableFontTypes,
    getFrontendFontConfig,
    getBackendFontConfig,
    isValidFontType,
    getFallbackFonts,
    getGoogleFonts,
    getSystemFonts,
    buildFontFamily
};
