/**
 * Server-side Canvas Generator for Chinese Copybook
 * Uses node-canvas library for server-side rice grid drawing, Chinese character rendering, and PNG/JPEG image generation
 */

const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

class CanvasGenerator {
    constructor() {
        // A4 paper dimensions in pixels (at 300 DPI)
        this.A4_WIDTH_MM = 210;
        this.A4_HEIGHT_MM = 297;
        this.DPI = 300;
        this.A4_WIDTH_PX = Math.floor((this.A4_WIDTH_MM / 25.4) * this.DPI);
        this.A4_HEIGHT_PX = Math.floor((this.A4_HEIGHT_MM / 25.4) * this.DPI);

        // Grid settings
        this.cellSize = 50; // Reduced from 60 to better fit 15x5 grid on A4
        this.padding = 40;
        this.gridLineWidth = 2;
        this.riceGridLineWidth = 1;

        // Font settings
        this.defaultFontSize = 0.9;
        this.loadedFonts = new Map();

        this.initializeFonts();
    }

    /**
     * Initialize and register available fonts
     */
    initializeFonts() {
        const fontMappings = {
            'serif': {
                name: 'Noto Serif CJK SC Light', // Use Light version for guide
                fallback: 'serif'
            },
            'sans-serif': {
                name: 'Noto Sans CJK SC Light', // Use Light version
                fallback: 'sans-serif'
            },
            'cursive': {
                name: 'ZCOOL KuaiLe',
                fallback: 'cursive'
            },
            'fantasy': {
                name: 'ZCOOL XiaoWei',
                fallback: 'fantasy'
            }
        };

        // Try to register fonts if available
        Object.keys(fontMappings).forEach(key => {
            const fontPath = path.join(__dirname, '..', 'public', 'fonts', `${key}.ttf`);
            try {
                if (fs.existsSync(fontPath)) {
                    registerFont(fontPath, { family: fontMappings[key].name });
                    this.loadedFonts.set(key, fontMappings[key].name);
                } else {
                    this.loadedFonts.set(key, fontMappings[key].fallback);
                }
            } catch (error) {
                console.warn(`Failed to load font ${key}:`, error.message);
                this.loadedFonts.set(key, fontMappings[key].fallback);
            }
        });
    }

    /**
     * Get font family name for rendering
     */
    getFontFamily(fontType) {
        return this.loadedFonts.get(fontType) || 'serif';
    }

    /**
     * Calculate optimal grid layout for A4 paper
     */
    calculateA4Layout(charsPerRow, rowCount) {
        const contentWidth = this.A4_WIDTH_PX - (2 * this.padding);
        const contentHeight = this.A4_HEIGHT_PX - (2 * this.padding);

        // Calculate cell size based on available space
        const cellWidth = Math.floor(contentWidth / charsPerRow);
        const cellHeight = Math.floor(contentHeight / rowCount);

        // Use the smaller dimension to maintain square cells
        const optimalCellSize = Math.min(cellWidth, cellHeight);

        // Recalculate total canvas dimensions based on optimal cell size
        const totalWidth = charsPerRow * optimalCellSize + (2 * this.padding);
        const totalHeight = rowCount * optimalCellSize + (2 * this.padding);


        return {
            cellSize: optimalCellSize,
            totalWidth,
            totalHeight,
            charsPerRow,
            rowCount
        };
    }

    /**
     * Create canvas with specified dimensions
     */
    createCanvas(width, height) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Set high-quality rendering
        ctx.antialias = 'default';
        ctx.quality = 'best';

        return { canvas, ctx };
    }

    /**
     * Fill canvas with white background
     */
    fillBackground(ctx, width, height) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * Draw rice grid (米字格) for a single cell
     */
    drawRiceGrid(ctx, x, y, size) {
        const halfSize = size / 2;

        // Draw main cell border (green for traditional copybook style)
        ctx.strokeStyle = '#2d7a2d';
        ctx.lineWidth = this.gridLineWidth;
        ctx.strokeRect(x, y, size, size);

        // Draw rice grid lines (light green)
        ctx.strokeStyle = '#dceadc';
        ctx.lineWidth = this.riceGridLineWidth;
        ctx.beginPath();

        // Set dashed line style
        ctx.setLineDash([2, 2]);

        // Horizontal center line
        ctx.moveTo(x, y + halfSize);
        ctx.lineTo(x + size, y + halfSize);

        // Vertical center line
        ctx.moveTo(x + halfSize, y);
        ctx.lineTo(x + halfSize, y + size);

        // Diagonal lines
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y + size);
        ctx.moveTo(x + size, y);
        ctx.lineTo(x, y + size);

        ctx.stroke();

        // Reset line dash
        ctx.setLineDash([]);
    }

    /**
     * Draw complete grid layout
     */
    drawGrid(ctx, layout) {
        const { charsPerRow, rowCount, cellSize } = layout;
        const startX = this.padding;
        const startY = this.padding;

        // Draw all cells
        for (let row = 0; row < rowCount; row++) {
            for (let col = 0; col < charsPerRow; col++) {
                const x = startX + col * cellSize;
                const y = startY + row * cellSize;
                this.drawRiceGrid(ctx, x, y, cellSize);
            }
        }
    }

    /**
     * Calculate optimal font size for cell
     */
    calculateFontSize(cellSize) {
        return Math.floor(cellSize * this.defaultFontSize);
    }

    /**
     * Draw Chinese character in a cell with proper positioning
     */
    drawCharacterInCell(ctx, char, x, y, cellSize, fontFamily) {
        const fontSize = this.calculateFontSize(cellSize);

        // Set font properties
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = '#AAAAAA'; // Changed from #333333 to lighter gray for lighter appearance
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate center position
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;

        // Draw character
        ctx.fillText(char, centerX, centerY);
    }

    /**
     * Generate copybook with text content
     */
    async generateCopybook(text, fontType = 'serif', charsPerRow = 15, rowCount = 5, options = {}) {
        // Validate parameters
        charsPerRow = Math.max(1, Math.min(20, parseInt(charsPerRow) || 15));
        rowCount = Math.max(1, Math.min(30, parseInt(rowCount) || 5));

        // Calculate layout
        const layout = this.calculateA4Layout(charsPerRow, rowCount);

        // Create canvas
        const { canvas, ctx } = this.createCanvas(layout.totalWidth, layout.totalHeight);

        // Fill background
        this.fillBackground(ctx, layout.totalWidth, layout.totalHeight);

        // Draw grid
        this.drawGrid(ctx, layout);

        // Process text - remove excessive whitespace and split into characters
        const characters = text.replace(/\s+/g, '').split('').filter(char => char.trim());

        // Get font family
        const fontFamily = this.getFontFamily(fontType);

        const startX = this.padding;
        const startY = this.padding;
        let charIndex = 0;

        // Draw characters in grid
        for (let row = 0; row < rowCount && charIndex < characters.length; row++) {
            for (let col = 0; col < charsPerRow && charIndex < characters.length; col++) {
                const char = characters[charIndex];
                const x = startX + col * layout.cellSize;
                const y = startY + row * layout.cellSize;

                // Apply opacity for practice mode
                if (options.practiceMode) {
                    const originalAlpha = ctx.globalAlpha;
                    ctx.globalAlpha = options.guideOpacity || 0.3;
                    this.drawCharacterInCell(ctx, char, x, y, layout.cellSize, fontFamily);
                    ctx.globalAlpha = originalAlpha;
                } else {
                    this.drawCharacterInCell(ctx, char, x, y, layout.cellSize, fontFamily);
                }

                charIndex++;
            }
        }

        return {
            canvas,
            layout,
            charactersDrawn: charIndex,
            totalCharacters: characters.length,
            fontFamily
        };
    }

    /**
     * Generate practice copybook with light guide characters
     */
    async generatePracticeCopybook(text, fontType = 'serif', charsPerRow = 15, rowCount = 5, guideOpacity = 0.3) {
        return this.generateCopybook(text, fontType, charsPerRow, rowCount, {
            practiceMode: true,
            guideOpacity
        });
    }

    /**
     * Export canvas as PNG buffer
     */
    exportToPNG(canvas, quality = 1.0) {
        return canvas.toBuffer('image/png', {
            compressionLevel: Math.floor((1 - quality) * 9),
            filters: canvas.PNG_FILTER_NONE
        });
    }

    /**
     * Export canvas as JPEG buffer
     */
    exportToJPEG(canvas, quality = 0.9) {
        return canvas.toBuffer('image/jpeg', {
            quality: Math.max(0.1, Math.min(1.0, quality)),
            progressive: false,
            chromaSubsampling: true
        });
    }

    /**
     * Save canvas to file
     */
    async saveToFile(canvas, filePath, format = 'png', quality = 0.9) {
        let buffer;

        if (format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg') {
            buffer = this.exportToJPEG(canvas, quality);
        } else {
            buffer = this.exportToPNG(canvas, quality);
        }

        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, buffer, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(filePath);
                }
            });
        });
    }

    /**
     * Generate and export copybook in one step
     */
    async generateAndExport(text, options = {}) {
        const {
            fontType = 'serif',
            charsPerRow = 15,
            rowCount = 5,
            format = 'png',
            quality = 0.9,
            practiceMode = false,
            guideOpacity = 0.3
        } = options;

        try {
            // Generate copybook
            const result = practiceMode
                ? await this.generatePracticeCopybook(text, fontType, charsPerRow, rowCount, guideOpacity)
                : await this.generateCopybook(text, fontType, charsPerRow, rowCount);

            // Export to buffer
            let buffer;
            if (format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg') {
                buffer = this.exportToJPEG(result.canvas, quality);
            } else {
                buffer = this.exportToPNG(result.canvas, quality);
            }

            return {
                buffer,
                mimeType: format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg'
                    ? 'image/jpeg'
                    : 'image/png',
                layout: result.layout,
                charactersDrawn: result.charactersDrawn,
                totalCharacters: result.totalCharacters,
                fontFamily: result.fontFamily
            };

        } catch (error) {
            throw new Error(`Failed to generate copybook: ${error.message}`);
        }
    }

    /**
     * Get canvas information
     */
    getCanvasInfo(canvas) {
        return {
            width: canvas.width,
            height: canvas.height,
            type: 'node-canvas'
        };
    }

    /**
     * Validate text input
     */
    validateText(text) {
        if (!text || typeof text !== 'string') {
            throw new Error('Text content is required and must be a string');
        }

        const cleanText = text.trim();
        if (cleanText.length === 0) {
            throw new Error('Text content cannot be empty');
        }

        if (cleanText.length > 2000) {
            throw new Error('Text content is too long (maximum 2000 characters)');
        }

        return cleanText;
    }

    /**
     * Get available fonts
     */
    getAvailableFonts() {
        return Array.from(this.loadedFonts.keys());
    }

    /**
     * Get font information
     */
    getFontInfo() {
        const fontInfo = {};
        this.loadedFonts.forEach((family, key) => {
            fontInfo[key] = {
                family,
                loaded: family !== 'serif' && family !== 'sans-serif' && family !== 'cursive' && family !== 'fantasy' && family !== 'Noto Serif CJK SC Light' && family !== 'Noto Sans CJK SC Light'
            };
        });
        return fontInfo;
    }
}

module.exports = CanvasGenerator;
