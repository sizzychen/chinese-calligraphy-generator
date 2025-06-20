const express = require('express');
const router = express.Router();
const CanvasGenerator = require('../utils/canvas-generator');
const PDFGenerator = require('../utils/pdf-generator');

// Initialize generators
const canvasGenerator = new CanvasGenerator();
const pdfGenerator = new PDFGenerator();

// Generate copybook endpoint
router.post('/generate', async (req, res) => {
    try {
        const { text, font, charsPerRow, rowCount } = req.body;
        
        // Validate input parameters
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text content is required' });
        }
        
        const validatedFont = font || 'serif';
        const validatedCharsPerRow = parseInt(charsPerRow) || 10;
        const validatedRowCount = parseInt(rowCount) || 10;
        
        // Generate the copybook using canvas generator
        const result = await canvasGenerator.generateCopybook(
            text.trim(),
            validatedFont,
            validatedCharsPerRow,
            validatedRowCount
        );
        
        res.json({
            success: true,
            data: {
                text: text.trim(),
                font: validatedFont,
                charsPerRow: validatedCharsPerRow,
                rowCount: validatedRowCount,
                totalChars: result.charactersDrawn,
                layout: result.layout
            }
        });
        
    } catch (error) {
        console.error('Error generating copybook:', error);
        res.status(500).json({ error: `Failed to generate copybook: ${error.message}` });
    }
});

// Export as image endpoint
router.post('/export/image', async (req, res) => {
    try {
        const { text, font, charsPerRow, rowCount, format } = req.body;
        
        // Validate input parameters
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text content is required' });
        }
        
        const validatedFormat = format === 'jpeg' ? 'jpeg' : 'png';
        const validatedFont = font || 'serif';
        const validatedCharsPerRow = parseInt(charsPerRow) || 10;
        const validatedRowCount = parseInt(rowCount) || 10;
        
        // Generate the canvas
        const result = await canvasGenerator.generateCopybook(
            text.trim(),
            validatedFont,
            validatedCharsPerRow,
            validatedRowCount
        );
        
        // Set appropriate content type
        const contentType = validatedFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="copybook.${validatedFormat}"`);
        
        // Stream the image data directly to the response
        const stream = result.canvas.createPNGStream({
            compressionLevel: 6,
            filters: result.canvas.PNG_FILTER_NONE,
            palette: false
        });
        
        stream.pipe(res);
        
    } catch (error) {
        console.error('Error exporting image:', error);
        res.status(500).json({ error: `Failed to export image: ${error.message}` });
    }
});

// Export as PDF endpoint
router.post('/export/pdf', async (req, res) => {
    try {
        const { text, font, charsPerRow, rowCount, practiceMode } = req.body;
        
        // Validate input parameters
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text content is required' });
        }
        
        const validatedFont = font || 'serif';
        const validatedCharsPerRow = parseInt(charsPerRow) || 10;
        const validatedRowCount = parseInt(rowCount) || 10;
        const usePracticeMode = practiceMode === true;
        
        // Set PDF content type and headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="copybook.pdf"');
        
        // Generate the PDF
        const pdfResult = await pdfGenerator.generatePDF(text.trim(), {
            fontType: validatedFont,
            charsPerRow: validatedCharsPerRow,
            rowCount: validatedRowCount,
            practiceMode: usePracticeMode,
            title: '汉字字帖'
        });
        
        // Stream PDF directly to client
        pdfResult.pdf.pipe(res);
        pdfResult.pdf.end();
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({ error: `Failed to export PDF: ${error.message}` });
    }
});

module.exports = router;