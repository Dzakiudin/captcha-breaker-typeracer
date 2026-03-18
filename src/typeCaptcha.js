/*
  This script assists in completing the captcha which appears after >100WPM.
  
  USAGE:
  1. BEFORE starting a race, paste loadTesseract.js and wait for "✅ Loaded"
  2. BEFORE starting a race, paste this script. It will wait automatically.
  3. Then start your race. After the race, the captcha will be auto-processed.
  4. Fix any typos manually before time runs out.
*/

/**
 * Extract the background colour of a pixel at a given index
 */
replaceColour = (i, imgWidth) => {
  const percent = ((i/4) % imgWidth) / imgWidth;
  return {
      r: 192 + (205 - 192) * percent,
      g: 193 + (233 - 193) * percent,
      b: 195 + (247 - 195) * percent
  }
}

/**
 * Post-processing of the text
 */
processText = (text) => {
  let result = text;
  result = result.split('\n').join(' ');
  
  const replacements = [
    ['1', 'l'], ['(', 'l'], [')', 'l'], ['[', 'I'],
    ['@', 'a'], ['¥', 'y'], ['\\', 'i'], ['|', 'I'],
  ];
  for (const [from, to] of replacements) {
    while (result.indexOf(from) !== -1) result = result.replace(from, to);
  }
  result = result.replace(/\.(?=\S)/g, '. ');
  result = result.replace(/,(?=\S)/g, ', ');
  while (result.indexOf('  ') !== -1) result = result.replace('  ', ' ');
  return result.trim();
}

/**
 * Gets the DataURL of the pre-processed captcha image
 */
getImageDataURL = (img) => {
  const canv = document.createElement('canvas');
  img.parentElement.appendChild(canv);
  canv.style.display = 'block';
  canv.style.marginTop = '5px';
  canv.width = img.width;
  canv.height = img.height;
  const ctx = canv.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);

  // Replace black markings with background colour
  const changedPixels = [];
  for (let i = 0; i < imgData.data.length; i += 4) {
    if (imgData.data[i] <= 50 && imgData.data[i+1] <= 50 && imgData.data[i+2] <= 50) {
      const c = replaceColour(i, img.width);
      imgData.data[i]   = c.r;
      imgData.data[i+1] = c.b;
      imgData.data[i+2] = c.g;
      changedPixels.push(i);
    }
  }

  // Replace nearby pixels
  const offsets = [img.width*4, -img.width*4, 4, -4];
  changedPixels.forEach(i => {
    offsets.forEach(offset => {
      try {
        const c = replaceColour(i, img.width);
        imgData.data[i + offset]     = c.r;
        imgData.data[i+1 + offset]   = c.g;
        imgData.data[i+2 + offset]   = c.b;
      } catch {}
    });
  });

  ctx.putImageData(imgData, 0, 0);
  return canv.toDataURL();
}

/**
 * Wait for an element to appear in the DOM
 */
waitForElement = (selector, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    // Check if already exists
    const el = document.querySelector(selector);
    if (el) { resolve(el); return; }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

/**
 * Wait for an image to fully load
 */
waitForImageLoad = (img) => {
  return new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) { resolve(); return; }
    img.onload = () => resolve();
    // Fallback timeout
    setTimeout(resolve, 3000);
  });
}

// ========================================
// MAIN - Setup and wait for captcha
// ========================================
(async () => {
  if (typeof Tesseract === 'undefined') {
    console.error('❌ Tesseract.js not loaded! Paste loadTesseract.js first.');
    return;
  }

  console.log('⏳ Creating Tesseract worker (this runs in background)...');
  const worker = await Tesseract.createWorker('eng');
  console.log('✅ Tesseract worker ready!');
  console.log('');
  console.log('🎮 Now start your race! This script will automatically detect and solve the captcha.');
  console.log('   It will keep watching for the captcha image...');
  console.log('');

  // Continuously watch for captcha image
  const pollForCaptcha = () => {
    return new Promise((resolve) => {
      const check = () => {
        // Try multiple possible selectors for the captcha image
        const img = document.querySelector('.challengeImg') 
                 || document.querySelector('img[class*="challenge"]')
                 || document.querySelector('.typingChallengeDialog img');
        
        if (img && img.complete && img.naturalWidth > 0) {
          resolve(img);
        } else {
          setTimeout(check, 500); // Check every 500ms
        }
      };
      check();
    });
  };

  console.log('👀 Watching for captcha...');
  const captchaImg = await pollForCaptcha();
  console.log('✅ Captcha image detected! Processing immediately...');

  // Process immediately - no delay!
  const dataURL = getImageDataURL(captchaImg);
  
  console.log('⏳ Running OCR (this takes a few seconds)...');
  const { data: { text: rawText } } = await worker.recognize(dataURL);
  console.log('📝 Raw OCR:', rawText);

  const text = processText(rawText);
  console.log('📝 Processed:', text);

  // Find textarea - try multiple selectors
  const textarea = document.querySelector('.challengeTextArea') 
                || document.querySelector('textarea[class*="challenge"]')
                || document.querySelector('.typingChallengeDialog textarea');
  
  if (textarea) {
    // Set the value
    textarea.focus();
    textarea.value = text;
    
    // Fire all possible events to trigger GWT
    ['input', 'change', 'keydown', 'keyup', 'keypress'].forEach(eventType => {
      textarea.dispatchEvent(new Event(eventType, { bubbles: true }));
    });

    // Also try using native input setter (bypasses framework wrappers)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(textarea, text);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('✅ Text injected! Fix typos manually, then submit.');
  } else {
    console.error('❌ Textarea not found. Copy this text manually:');
    console.log(text);
  }

  await worker.terminate();
  console.log('🏁 Done!');
})();
