const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const voices = await page.evaluate(async () => {
    return new Promise(resolve => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        resolve(voices.map(v => v.name));
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices().map(v => v.name));
        };
      }
    });
  });
  console.log(voices);
  await browser.close();
})();
