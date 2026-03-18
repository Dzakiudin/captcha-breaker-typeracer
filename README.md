# captcha-breaker-typeracer

Automated typing and captcha-solving script for [TypeRacer](https://play.typeracer.com/).  
This script runs directly in the **browser console** — no installation required.

> ⚠️ **Disclaimer:** Using this script violates TypeRacer's Terms of Service and may result in account termination. This project is for educational and experimental purposes only.


## Features

### 1. Auto-Type Race (`typeText.js`)

Extracts race text from the DOM and uses a keypress listener. Once focused, every key you press on your physical keyboard will automatically input the correct character.

**How to use:**
1. Open [play.typeracer.com](https://play.typeracer.com/) and join a race.
2. Open **Developer Console** (`F12` → Console tab).
3. Copy and paste the contents of `src/typeText.js` into the console and press Enter.
4. Click/focus the race input field.
5. Tap any keys on your keyboard repeatedly — each stroke will input the correct character.

> 💡 Your WPM depends on how fast you tap. To avoid the captcha, keep your speed at a reasonable level (under 100 WPM).


### 2. Auto-Solve Captcha (`typeCaptcha.js`)

If your speed exceeds 100 WPM, TypeRacer presents an image captcha. This script solves it automatically:

1. **Image Pre-processing**: Removes black noise/lines using HTML Canvas.
2. **OCR (Optical Character Recognition)**: Reads text using [Tesseract.js v5](https://github.com/naptha/tesseract.js) loaded via CDN.
3. **Post-processing**: Corrects common OCR misreads (e.g., `|` → `I`, `1` → `l`).
4. **Auto-inject**: Fills the captcha field with events compatible with the GWT framework.

**How to use:**
1. **Before the race starts**, paste `src/loadTesseract.js` into the console.  
   → Wait for: `✅ Tesseract.js v5 loaded successfully!`.
2. Paste `src/typeCaptcha.js` into the console.  
   → Wait for: `🎮 Now start your race!`.
3. Race as usual.
4. When the captcha appears, the script will **automatically detect** and process it.
5. Fixed the text is injected, **fix any obvious typos manually** before time runs out.


## Project Structure

```
src/
├── loadTesseract.js   # Tesseract.js v5 CDN loader
├── typeCaptcha.js      # Automated captcha solver (OCR)
└── typeText.js         # Auto-type race script (keypress listener)
```


## Technologies Used

- **Tesseract.js v5** — Pure JavaScript OCR library via [jsdelivr](https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js).
- **HTML Canvas** — For captcha image noise reduction.
- **MutationObserver** — For real-time captcha detection.
- **DOM Event Dispatching** — For GWT-compatible input events.