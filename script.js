/**
 * CryptoBox · script.js
 * Password strength checker · Entropy calculator · Generator · Breach DB
 * Security: no eval(), no innerHTML on user input, all textContent
 */

/* ── 100 MOST COMMON BREACHED PASSWORDS ─────── */
const COMMON_PASSWORDS = new Set([
  '123456','password','123456789','12345678','12345','1234567','1234567890',
  'qwerty','abc123','million2','000000','1234','iloveyou','aaron431','password1',
  'qqww1122','123','omgpop','123321','654321','qwerty123','admin','letmein',
  'monkey','1q2w3e4r','master','dragon','111111','baseball','iloveyou1',
  'trustno1','sunshine','princess','welcome','shadow','superman','michael',
  'football','charlie','donald','password2','qwerty1','pass','zxcvbnm',
  'asdfghjkl','1q2w3e','passw0rd','starwars','hello','robert','daniel',
  'george','jordan','harley','ranger','dakota','2000','jessica','cheese',
  '1111','555555','lovely','batman','samsung','computer','hunter','maverick',
  'thomas','andrew','michelle','love','matrix','test','winner','forever',
  'angel','buster','joshua','jessica1','pepper','cookies','william','tigger',
  'apple','wizard','666666','smokey','121212','hottie','freedom','merlin',
  'diamond','snoopy','ginger','heather','tiffany','777777','flower','success',
  '123qwe','nicole','purple','scooter'
]);

/* ── TIPS by weakness ────────────────────────── */
const TIPS = [
  { check: p => p.length < 8,    tip: "Add more characters — aim for at least 12." },
  { check: p => !/[A-Z]/.test(p),tip: "Add an uppercase letter to increase complexity." },
  { check: p => !/[0-9]/.test(p),tip: "Mix in a number for extra strength." },
  { check: p => !/[^A-Za-z0-9]/.test(p), tip: "Add a symbol like ! @ # $ to make it much harder to crack." },
  { check: p => /(.)\1{2,}/.test(p), tip: "Avoid repeating characters like 'aaa' or '111'." },
  { check: p => /^[a-z]+$/.test(p), tip: "Don't use only lowercase letters — mix it up." },
];

/* ── NAV ─────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav__links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  hamburger?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  });

  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
})();

/* ── HERO COUNTER ─────────────────────────────── */
let testCount = parseInt(sessionStorage.getItem('cryptobox_count') || '0');
function updateCounter() {
  const el = document.getElementById('heroCounter');
  if (el) el.textContent = `password${testCount !== 1 ? 's' : ''} tested this session`;
  const numEl = el?.previousElementSibling;
  // update stat num
  const statNums = document.querySelectorAll('.stat__num');
  if (statNums[2]) statNums[2].textContent = testCount;
}
updateCounter();

/* ── ENTROPY CALCULATION ─────────────────────── */
function calcEntropy(password) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;
  if (pool === 0) return 0;
  return Math.floor(password.length * Math.log2(pool));
}

function crackTimeLabel(entropy) {
  // Assume 10 billion guesses/sec (fast modern GPU)
  const combinations = Math.pow(2, entropy);
  const seconds = combinations / 1e10;
  if (seconds < 1)       return '< 1 second';
  if (seconds < 60)      return `${Math.round(seconds)} seconds`;
  if (seconds < 3600)    return `${Math.round(seconds/60)} minutes`;
  if (seconds < 86400)   return `${Math.round(seconds/3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds/86400)} days`;
  if (seconds < 3.15e9)  return `${Math.round(seconds/31536000)} years`;
  if (seconds < 3.15e12) return `${(seconds/3.15e9).toFixed(1)} thousand years`;
  return 'millions of years';
}

/* ── STRENGTH SCORE ──────────────────────────── */
function getStrength(password) {
  if (!password) return { score: 0, label: '—', color: 'transparent', width: '0%' };

  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score += 2;

  // Penalize common patterns
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score = Math.min(score, 1);
  if (/(.)\1{2,}/.test(password)) score = Math.max(0, score - 1);

  const levels = [
    { score: 0, label: '—',          color: 'transparent',                           width: '0%'   },
    { score: 1, label: 'Very Weak',  color: '#EF4444',                               width: '15%'  },
    { score: 2, label: 'Weak',       color: '#F97316',                               width: '30%'  },
    { score: 3, label: 'Fair',       color: '#FBBF24',                               width: '50%'  },
    { score: 4, label: 'Good',       color: '#34D399',                               width: '68%'  },
    { score: 5, label: 'Strong',     color: '#10B981',                               width: '82%'  },
    { score: 6, label: 'Very Strong',color: 'linear-gradient(90deg,#A78BFA,#7C3AED)',width: '100%' },
  ];

  const idx = Math.min(Math.max(Math.floor(score / 1.2), 0), 6);
  return { score, ...levels[idx] };
}

/* ── CHECKER ─────────────────────────────────── */
(function initChecker() {
  const input      = document.getElementById('passwordInput');
  const meterFill  = document.getElementById('meterFill');
  const meterLabel = document.getElementById('meterLabel');
  const entropyVal = document.getElementById('entropyVal');
  const crackTime  = document.getElementById('crackTime');
  const scoreVal   = document.getElementById('scoreVal');
  const tipBox     = document.getElementById('tipBox');
  const tipText    = document.getElementById('tipText');
  const toggleVis  = document.getElementById('toggleVis');

  const criteria = {
    'c-length': p => p.length >= 8,
    'c-upper':  p => /[A-Z]/.test(p),
    'c-lower':  p => /[a-z]/.test(p),
    'c-number': p => /[0-9]/.test(p),
    'c-symbol': p => /[^A-Za-z0-9]/.test(p),
    'c-long':   p => p.length >= 12,
  };

  toggleVis?.addEventListener('click', () => {
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    toggleVis.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
  });

  input?.addEventListener('input', () => {
    const p = input.value;

    // Update criteria
    Object.entries(criteria).forEach(([id, check]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const pass = p && check(p);
      el.classList.toggle('pass', pass);
      el.classList.toggle('fail', !pass);
      el.querySelector('.criteria__icon').textContent = pass ? '✓' : '○';
    });

    // Strength
    const { label, color, width } = getStrength(p);
    meterFill.style.width = p ? width : '0%';
    meterFill.style.background = color;
    meterLabel.textContent = label;
    meterLabel.style.color = typeof color === 'string' && color.startsWith('linear') ? '#A78BFA' : color;

    // Entropy
    const entropy = calcEntropy(p);
    entropyVal.textContent = p ? `${entropy} bits` : '—';
    crackTime.textContent  = p ? crackTimeLabel(entropy) : '—';
    scoreVal.textContent   = p ? `${getStrength(p).score}/8` : '—';

    // Tip
    if (p) {
      const matched = TIPS.find(t => t.check(p));
      if (matched) {
        tipText.textContent = matched.tip;  // textContent = XSS safe
        tipBox.removeAttribute('hidden');
      } else {
        tipBox.setAttribute('hidden', '');
      }
    } else {
      tipBox.setAttribute('hidden', '');
    }

    // Counter
    if (p.length > 0) {
      testCount++;
      sessionStorage.setItem('cryptobox_count', String(testCount));
      updateCounter();
    }
  });
})();

/* ── GENERATOR ───────────────────────────────── */
(function initGenerator() {
  const slider      = document.getElementById('lengthSlider');
  const lengthVal   = document.getElementById('lengthVal');
  const genOutput   = document.getElementById('genOutput');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn     = document.getElementById('copyBtn');
  const copyToast   = document.getElementById('copyToast');

  const CHARS = {
    upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower:   'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
  };

  slider?.addEventListener('input', () => {
    lengthVal.textContent = slider.value;
  });

  function generatePassword() {
    const len        = parseInt(slider.value);
    const useUpper   = document.getElementById('incUpper').checked;
    const useLower   = document.getElementById('incLower').checked;
    const useNumbers = document.getElementById('incNumbers').checked;
    const useSymbols = document.getElementById('incSymbols').checked;

    let pool = '';
    let guaranteed = [];

    if (useUpper)   { pool += CHARS.upper;   guaranteed.push(CHARS.upper[Math.floor(Math.random() * CHARS.upper.length)]); }
    if (useLower)   { pool += CHARS.lower;   guaranteed.push(CHARS.lower[Math.floor(Math.random() * CHARS.lower.length)]); }
    if (useNumbers) { pool += CHARS.numbers; guaranteed.push(CHARS.numbers[Math.floor(Math.random() * CHARS.numbers.length)]); }
    if (useSymbols) { pool += CHARS.symbols; guaranteed.push(CHARS.symbols[Math.floor(Math.random() * CHARS.symbols.length)]); }

    if (!pool) {
      genOutput.textContent = 'Select at least one character type.';
      return;
    }

    // Use crypto.getRandomValues for security
    const array = new Uint32Array(len);
    crypto.getRandomValues(array);
    let password = Array.from(array, n => pool[n % pool.length]);

    // Inject guaranteed chars at random positions
    guaranteed.forEach((ch, i) => {
      password[i] = ch;
    });

    // Shuffle
    for (let i = password.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [password[i], password[j]] = [password[j], password[i]];
    }

    genOutput.textContent = password.join('');  // textContent = XSS safe
  }

  generateBtn?.addEventListener('click', generatePassword);

  // Generate one on load
  generatePassword();

  // Copy
  function copyToClipboard() {
    const pwd = genOutput.textContent;
    if (!pwd || pwd.includes('Select')) return;
    navigator.clipboard.writeText(pwd).then(() => {
      copyToast.classList.add('show');
      setTimeout(() => copyToast.classList.remove('show'), 2000);
    });
  }

  copyBtn?.addEventListener('click', copyToClipboard);
})();

/* ── BREACH CHECK ────────────────────────────── */
(function initBreach() {
  const input      = document.getElementById('breachInput');
  const btn        = document.getElementById('breachBtn');
  const result     = document.getElementById('breachResult');
  const icon       = document.getElementById('breachIcon');
  const title      = document.getElementById('breachTitle');
  const desc       = document.getElementById('breachDesc');

  btn?.addEventListener('click', () => {
    const pwd = input.value.trim();
    if (!pwd) {
      input.focus();
      return;
    }

    const isBreached = COMMON_PASSWORDS.has(pwd.toLowerCase());
    result.removeAttribute('hidden');

    if (isBreached) {
      result.className = 'breach__result danger';
      icon.textContent = '🚨';
      title.textContent = 'WARN — Password found in breach database!';
      desc.textContent = 'This password appears in a list of 100 most commonly used passwords. Attackers will try this immediately. Change it now.';
    } else {
      result.className = 'breach__result safe';
      icon.textContent = '✅';
      title.textContent = 'SAFE — Not found in common password list.';
      desc.textContent = 'Good news — this password is not in our common breach list. Remember to also check haveibeenpwned.com for full breach database checks.';
    }
  });

  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });
})();

/* ── SCROLL REVEAL ───────────────────────────── */
(function initReveal() {
  const targets = '.checker__card, .gen__card, .breach__card, .tip-card, .section__title, .section__eyebrow, .section__desc, .hero__content, .hero__stats .stat';
  document.querySelectorAll(targets).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 5) * 0.07}s`;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();
