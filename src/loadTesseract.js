var s = document.createElement('script');
s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
s.onload = () => console.log('✅ Tesseract.js v5 loaded successfully!');
s.onerror = () => console.error('❌ Failed to load Tesseract.js');
document.head.appendChild(s);
