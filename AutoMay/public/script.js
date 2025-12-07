const ytStatusEl = document.getElementById('ytStatus');
const ytDotEl = document.getElementById('ytDot');
const aiStatusEl = document.getElementById('aiStatus');
const aiDotEl = document.getElementById('aiDot');
const connectBtn = document.getElementById('connectYouTubeBtn');
const generateBtn = document.getElementById('generateBtn');
const generateBtnTop = document.getElementById('generateBtnTop');
const generateForm = document.getElementById('generateForm');
const logEl = document.getElementById('log');

function log(msg) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `[${time}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(el, dotEl, text, ok = null) {
  el.querySelector('span:nth-child(2)').textContent = text;
  dotEl.classList.remove('ok', 'bad');
  if (ok === true) dotEl.classList.add('ok');
  if (ok === false) dotEl.classList.add('bad');
}

async function refreshStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    setStatus(
      ytStatusEl,
      ytDotEl,
      data.youtubeConnected ? 'YouTube: connected' : 'YouTube: not connected',
      data.youtubeConnected
    );

    setStatus(
      aiStatusEl,
      aiDotEl,
      data.openaiConfigured ? 'OpenAI: configured' : 'OpenAI: missing key',
      data.openaiConfigured
    );

    connectBtn.disabled = data.youtubeConnected;
  } catch (e) {
    setStatus(ytStatusEl, ytDotEl, 'YouTube: status error', false);
    setStatus(aiStatusEl, aiDotEl, 'OpenAI: status error', false);
    log('Failed to load status: ' + e.message);
  }
}

connectBtn.addEventListener('click', () => {
  log('Opening YouTube auth window...');
  window.open('/auth/youtube', '_blank', 'width=600,height=700');

  // check status for ~30s after clicking
  let count = 0;
  const interval = setInterval(() => {
    refreshStatus();
    count++;
    if (count > 15) clearInterval(interval);
  }, 2000);
});

async function handleGenerate() {
  const prompt = document.getElementById('prompt').value.trim();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!prompt) {
    alert('Please enter a prompt.');
    return;
  }

  generateBtn.disabled = true;
  generateBtnTop.disabled = true;
  generateBtn.textContent = 'Working...';
  generateBtnTop.textContent = 'Working...';
  log('Starting Sora generation and YouTube upload...');

  try {
    const res = await fetch('/api/generate-and-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, title, description })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Unknown error');
    }

    log('Done! YouTube URL: ' + data.youtubeUrl);
    logEl.innerHTML += `\n<a href="${data.youtubeUrl}" target="_blank">▶ Open your uploaded video</a>\n`;
  } catch (err) {
    log('Error: ' + err.message);
    alert('Error: ' + err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtnTop.disabled = false;
    generateBtn.textContent = '⚡ Generate & Upload';
    generateBtnTop.textContent = '⚡ Generate & Upload';
  }
}

generateForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleGenerate();
});

generateBtnTop.addEventListener('click', () => {
  handleGenerate();
});

// first status check
refreshStatus();
