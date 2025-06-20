/**
 * PDF Generator for Chinese Copybook
 * Uses PDFKit library to convert Canvas content to PDF format with A4 paper size and high-resolution output
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const CanvasGenerator = require('./canvas-generator');

class PDFGenerator {
    constructor() {
        this.canvasGenerator = new CanvasGenerator();
        
        // A4 paper dimensions in points (72 DPI)
        this.A4_WIDTH_POINTS = 595.28;
        this.A4_HEIGHT_POINTS = 841.89;
        
        // PDF settings
        this.margins = {
            top: 40,
            bottom: 40,
            left: 40,
            right: 40
        };
        
        // High-resolution settings
        this.imageScale = 2; // 2x scale for high resolution
        this.imageQuality = 0.95;
    }
    
    /**
     * Create PDF document with A4 size
     */
    createPDFDocument(options = {}) {
        return new PDFDocument({
            size: 'A4',
            margins: this.margins,
            info: {
                Title: options.title || '汉字字帖',
                Author: options.author || '汉字字帖生成器',
                Subject: options.subject || '中文练字帖',
                Keywords: options.keywords || '汉字,练字,字帖,米字格',
                Creator: '汉字字帖生成器',
                Producer: 'PDFKit'
            },
            ...options
        });
    }
    
    /**
     * Calculate image dimensions for PDF
     */
    calculateImageDimensions(canvasWidth, canvasHeight) {
        const availableWidth = this.A4_WIDTH_POINTS - this.margins.left - this.margins.right;
        const availableHeight = this.A4_HEIGHT_POINTS - this.margins.top - this.margins.bottom;
        
        // Calculate scale to fit within available space
        const scaleX = availableWidth / canvasWidth;
        const scaleY = availableHeight / canvasHeight;
        const scale = Math.min(scaleX, scaleY);
        
        return {
            width: canvasWidth * scale,
            height: canvasHeight * scale,
            scale
        };
    }
    
    /**
     * Generate PDF from canvas
     */
    async generatePDFFromCanvas(canvas, options = {}) {
        const doc = this.createPDFDocument(options);
        
        // Convert canvas to buffer
        const imageBuffer = canvas.toBuffer('image/png', {
            compressionLevel: 6,
            filters: canvas.PNG_FILTER_NONE
        });
        
        // Calculate image dimensions
        const imageDimensions = this.calculateImageDimensions(canvas.width, canvas.height);
        
        // Center the image on the page
        const x = this.margins.left + (this.A4_WIDTH_POINTS - this.margins.left - this.margins.right - imageDimensions.width) / 2;
        const y = this.margins.top + (this.A4_HEIGHT_POINTS - this.margins.top - this.margins.bottom - imageDimensions.height) / 2;
        
        // Add image to PDF
        doc.image(imageBuffer, x, y, {
            width: imageDimensions.width,
            height: imageDimensions.height
        });
        
        return doc;
    }
    
    /**
     * Generate PDF from text content
     */
    async generatePDF(text, options = {}) {
        const {
            fontType = 'serif',
            charsPerRow = 10,
            rowCount = 15,
            practiceMode = false,
            guideOpacity = 0.2,
            title = '汉字字帖',
            multiPage = false,
            pageBreakAfter = null
        } = options;
        
        try {
            // Validate text
            const cleanText = this.canvasGenerator.validateText(text);
            
            if (multiPage && pageBreakAfter) {
                return this.generateMultiPagePDF(cleanText, options);
            }
            
            // Generate canvas
            const canvasResult = practiceMode 
                ? await this.canvasGenerator.generatePracticeCopybook(cleanText, fontType, charsPerRow, rowCount, guideOpacity)
                : await this.canvasGenerator.generateCopybook(cleanText, fontType, charsPerRow, rowCount);
            
            // Generate PDF from canvas
            const pdfDoc = await this.generatePDFFromCanvas(canvasResult.canvas, {
                title,
                subject: `${title} - ${canvasResult.charactersDrawn}个汉字`
            });
            
            return {
                pdf: pdfDoc,
                layout: canvasResult.layout,
                charactersDrawn: canvasResult.charactersDrawn,
                totalCharacters: canvasResult.totalCharacters,
                fontFamily: canvasResult.fontFamily
            };
            
        } catch (error) {
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }
    
    /**
     * Generate multi-page PDF
     */
    async generateMultiPagePDF(text, options = {}) {
        const {
            fontType = 'serif',
            charsPerRow = 10,
            rowCount = 15,
            practiceMode = false,
            guideOpacity = 0.2,
            title = '汉字字帖',
            pageBreakAfter = 150 // Characters per page
        } = options;
        
        const doc = this.createPDFDocument({
            title,
            subject: `${title} - 多页字帖`
        });
        
        // Split text into pages
        const characters = text.replace(/\s+/g, '').split('').filter(char => char.trim());
        const totalChars = characters.length;
        const totalPages = Math.ceil(totalChars / pageBreakAfter);
        
        let processedChars = 0;
        
        for (let page = 0; page < totalPages; page++) {
            const startIndex = page * pageBreakAfter;
            const endIndex = Math.min(startIndex + pageBreakAfter, totalChars);
            const pageText = characters.slice(startIndex, endIndex).join('');
            
            if (pageText.length === 0) break;
            
            // Calculate rows needed for this page
            const charsInPage = pageText.length;
            const pagesNeeded = Math.ceil(charsInPage / (charsPerRow * rowCount));
            const actualRowCount = Math.min(rowCount, Math.ceil(charsInPage / charsPerRow));
            
            // Generate canvas for this page
            const canvasResult = practiceMode 
                ? await this.canvasGenerator.generatePracticeCopybook(pageText, fontType, charsPerRow, actualRowCount, guideOpacity)
                : await this.canvasGenerator.generateCopybook(pageText, fontType, charsPerRow, actualRowCount);
            
            // Add new page if not the first page
            if (page > 0) {
                doc.addPage();
            }
            
            // Convert canvas to buffer
            const imageBuffer = canvasResult.canvas.toBuffer('image/png', {
                compressionLevel: 6,
                filters: canvasResult.canvas.PNG_FILTER_NONE
            });
            
            // Calculate image dimensions
            const imageDimensions = this.calculateImageDimensions(canvasResult.canvas.width, canvasResult.canvas.height);
            
            // Center the image on the page
            const x = this.margins.left + (this.A4_WIDTH_POINTS - this.margins.left - this.margins.right - imageDimensions.width) / 2;
            const y = this.margins.top + (this.A4_HEIGHT_POINTS - this.margins.top - this.margins.bottom - imageDimensions.height) / 2;
            
            // Add image to PDF
            doc.image(imageBuffer, x, y, {
                width: imageDimensions.width,
                height: imageDimensions.height
            });
            
            // Add page number
            doc.fontSize(10)
               .fillColor('#666666')
               .text(`第 ${page + 1} 页 / 共 ${totalPages} 页`, 
                     this.margins.left, 
                     this.A4_HEIGHT_POINTS - this.margins.bottom + 20, 
                     { align: 'center', width: this.A4_WIDTH_POINTS - this.margins.left - this.margins.right });
            
            processedChars += canvasResult.charactersDrawn;
        }
        
        return {
            pdf: doc,
            totalPages,
            charactersDrawn: processedChars,
            totalCharacters: totalChars
        };
    }
    
    /**
     * Generate practice sheets (multiple copies of the same content)
     */
    async generatePracticeSheets(text, copies = 3, options = {}) {
        const {
            fontType = 'serif',
            charsPerRow = 10,
            rowCount = 15,
            title = '汉字练习册',
            includeAnswer = true
        } = options;
        
        const doc = this.createPDFDocument({
            title,
            subject: `${title} - ${copies}份练习`
        });
        
        // Generate answer sheet first if requested
        if (includeAnswer) {
            const answerResult = await this.canvasGenerator.generateCopybook(text, fontType, charsPerRow, rowCount);
            const answerBuffer = answerResult.canvas.toBuffer('image/png');
            const answerDimensions = this.calculateImageDimensions(answerResult.canvas.width, answerResult.canvas.height);
            
            const x = this.margins.left + (this.A4_WIDTH_POINTS - this.margins.left - this.margins.right - answerDimensions.width) / 2;
            const y = this.margins.top + (this.A4_HEIGHT_POINTS - this.margins.top - this.margins.bottom - answerDimensions.height) / 2;
            
            doc.image(answerBuffer, x, y, {
                width: answerDimensions.width,
                height: answerDimensions.height
            });
            
            // Add title
            doc.fontSize(16)
               .fillColor('#000000')
               .text('参考答案', this.margins.left, this.margins.top - 20, { align: 'center', width: this.A4_WIDTH_POINTS - this.margins.left - this.margins.right });
        }
        
        // Generate practice sheets
        for (let copy = 0; copy < copies; copy++) {
            if (includeAnswer || copy > 0) {
                doc.addPage();
            }
            
            const practiceResult = await this.canvasGenerator.generatePracticeCopybook(text, fontType, charsPerRow, rowCount, 0.2);
            const practiceBuffer = practiceResult.canvas.toBuffer('image/png');
            const practiceDimensions = this.calculateImageDimensions(practiceResult.canvas.width, practiceResult.canvas.height);
            
            const x = this.margins.left + (this.A4_WIDTH_POINTS - this.margins.left - this.margins.right - practiceDimensions.width) / 2;
            const y = this.margins.top + (this.A4_HEIGHT_POINTS - this.margins.top - this.margins.bottom - practiceDimensions.height) / 2;
            
            doc.image(practiceBuffer, x, y, {
                width: practiceDimensions.width,
                height: practiceDimensions.height
            });
            
            // Add title
            doc.fontSize(14)
               .fillColor('#000000')
               .text(`练习 ${copy + 1}`, this.margins.left, this.margins.top - 20, { align: 'center', width: this.A4_WIDTH_POINTS - this.margins.left - this.margins.right });
        }
        
        return {
            pdf: doc,
            copies: includeAnswer ? copies + 1 : copies,
            includeAnswer
        };
    }
    
    /**
     * Save PDF to buffer
     */
    async savePDFToBuffer(pdfDoc) {
        return new Promise((resolve, reject) => {
            const buffers = [];
            
            pdfDoc.on('data', buffer => buffers.push(buffer));
            pdfDoc.on('end', () => resolve(Buffer.concat(buffers)));
            pdfDoc.on('error', reject);
            
            pdfDoc.end();
        });
    }
    
    /**
     * Save PDF to file
     */
    async savePDFToFile(pdfDoc, filePath) {
        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(filePath);
            
            pdfDoc.pipe(stream);
            
            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
            pdfDoc.on('error', reject);
            
            pdfDoc.end();
        });
    }
    
    /**
     * Generate and export PDF in one step
     */
    async generateAndExport(text, options = {}) {
        const {
            outputFormat = 'buffer', // 'buffer' or 'file'
            filePath = null,
            ...pdfOptions
        } = options;
        
        try {
            const result = await this.generatePDF(text, pdfOptions);
            
            if (outputFormat === 'file' && filePath) {
                const savedPath = await this.savePDFToFile(result.pdf, filePath);
                return {
                    ...result,
                    filePath: savedPath,
                    outputFormat: 'file'
                };
            } else {
                const buffer = await this.savePDFToBuffer(result.pdf);
                return {
                    ...result,
                    buffer,
                    outputFormat: 'buffer',
                    mimeType: 'application/pdf'
                };
            }
            
        } catch (error) {
            throw new Error(`Failed to generate and export PDF: ${error.message}`);
        }
    }
    
    /**
     * Get PDF generation options
     */
    getDefaultOptions() {
        return {
            fontType: 'serif',
            charsPerRow: 10,
            rowCount: 15,
            practiceMode: false,
            guideOpacity: 0.2,
            title: '汉字字帖',
            multiPage: false,
            pageBreakAfter: 150,
            outputFormat: 'buffer'
        };
    }
    
    /**
     * Validate PDF generation options
     */
    validateOptions(options = {}) {
        const validOptions = { ...this.getDefaultOptions(), ...options };
        
        // Validate numeric options
        validOptions.charsPerRow = Math.max(1, Math.min(20, parseInt(validOptions.charsPerRow) || 10));
        validOptions.rowCount = Math.max(1, Math.min(30, parseInt(validOptions.rowCount) || 15));
        validOptions.guideOpacity = Math.max(0.1, Math.min(1.0, parseFloat(validOptions.guideOpacity) || 0.2));
        validOptions.pageBreakAfter = Math.max(50, Math.min(500, parseInt(validOptions.pageBreakAfter) || 150));
        
        // Validate string options
        const validFonts = ['serif', 'sans-serif', 'cursive', 'fantasy'];
        if (!validFonts.includes(validOptions.fontType)) {
            validOptions.fontType = 'serif';
        }
        
        const validOutputFormats = ['buffer', 'file'];
        if (!validOutputFormats.includes(validOptions.outputFormat)) {
            validOptions.outputFormat = 'buffer';
        }
        
        return validOptions;
    }
    
    /**
     * Get PDF generator information
     */
    getInfo() {
        return {
            version: '1.0.0',
            supportedFormats: ['pdf'],
            supportedFonts: this.canvasGenerator.getAvailableFonts(),
            maxCharacters: 2000,
            paperSize: 'A4',
            dpi: 300,
            features: [
                'High-resolution output',
                'Multi-page support',
                'Practice mode with guide characters',
                'Multiple practice sheets',
                'Custom grid layouts'
            ]
        };
    }
}

module.exports = PDFGenerator;
