import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { extractTextFromImages } from './geminiApi';

// Set the worker source for PDF.js — use locally bundled worker, not CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extract text from a PDF file (text-based)
 */
async function extractPdfTextDirect(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}

/**
 * Render PDF pages to base64 PNG images for OCR
 */
async function renderPdfPagesToImages(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images = [];

  const maxPages = Math.min(pdf.numPages, 15); // Max 15 pages for OCR to avoid API limits

  for (let i = 1; i <= maxPages; i++) {
    if (onProgress) onProgress(`🖼️ Rendering page ${i}/${maxPages}...`);

    const page = await pdf.getPage(i);
    const scale = 1.5; // Optimized scale to reduce image payload size
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert to base64 (strip the data:image/png;base64, prefix)
    const dataUrl = canvas.toDataURL('image/png', 0.85);
    const base64 = dataUrl.split(',')[1];
    images.push(base64);

    // Clean up
    canvas.width = 0;
    canvas.height = 0;
  }

  if (pdf.numPages > 15 && onProgress) {
    onProgress(`⚠️ Only first 15 pages processed for OCR due to API limits.`);
    // Wait a brief moment so user can read the warning
    await new Promise(r => setTimeout(r, 2000));
  }

  return images;
}

/**
 * Extract text from a PDF — tries text extraction first, falls back to OCR
 */
export async function extractPdfText(file, onProgress) {
  // First try direct text extraction
  const directText = await extractPdfTextDirect(file);

  // If sufficient text found, use it
  if (directText && directText.trim().length >= 100) {
    return directText;
  }

  // Not enough text — this is likely a scanned/image-based PDF
  if (onProgress) onProgress(`📸 Image-based PDF detected — starting AI OCR...`);

  // Render pages to images
  const images = await renderPdfPagesToImages(file, onProgress);

  if (images.length === 0) {
    throw new Error('PDF mein koi pages nahi mile.');
  }

  // Use Gemini Vision for OCR
  const ocrText = await extractTextFromImages(images, onProgress);

  if (!ocrText || ocrText.trim().length < 50) {
    throw new Error('OCR se kafi text extract nahi ho saka. Better quality document try karen.');
  }

  return ocrText;
}

/**
 * Extract text from a DOCX file
 */
export async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

/**
 * Extract text from a TXT file
 */
export async function extractTxtText(file) {
  return await file.text();
}

/**
 * Extract text from image files (JPG, PNG) using Gemini Vision OCR
 */
export async function extractImageText(file, onProgress) {
  if (onProgress) onProgress(`🔍 Image OCR: "${file.name}"...`);

  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const ocrText = await extractTextFromImages([base64], onProgress);

  if (!ocrText || ocrText.trim().length < 10) {
    throw new Error('Image se text extract nahi ho saka.');
  }

  return ocrText;
}

/**
 * Extract text from any supported file based on extension
 */
export async function extractText(file, onProgress) {
  const ext = file.name.split('.').pop().toLowerCase();

  switch (ext) {
    case 'pdf':
      return await extractPdfText(file, onProgress);
    case 'docx':
      return await extractDocxText(file);
    case 'txt':
      return await extractTxtText(file);
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return await extractImageText(file, onProgress);
    default:
      throw new Error(`Unsupported file format: .${ext}`);
  }
}
