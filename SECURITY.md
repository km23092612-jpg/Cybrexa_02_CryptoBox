# Security Policy — CryptoBox

## Reporting a Vulnerability

**Do NOT open a public GitHub Issue for security vulnerabilities.**

Email: `security@yourdomain.com`  
Subject: `[SECURITY] CryptoBox - Brief Description`

I'll respond within 48 hours.

## Security Design Decisions

### Privacy First
- **Zero server communication** — all password checks happen in the browser
- No passwords are logged, stored, or transmitted anywhere
- No analytics or tracking scripts included

### XSS Prevention
- All user input rendered via `textContent` — never `innerHTML`
- No `eval()` used anywhere in the codebase
- Generated passwords inserted via `textContent` only

### Cryptographically Secure Generation
- Password generator uses `crypto.getRandomValues()` — the Web Crypto API
- NOT `Math.random()` which is predictable
- This is the same standard used by password managers

### Breach Database
- Common password list is stored locally in the JS file
- No API calls made to external breach databases
- For full breach checks, users are directed to haveibeenpwned.com

## Netlify Security Headers (`_headers`)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; ...
```

## Responsible Disclosure
Follow responsible disclosure — give me time to patch before going public. 🛡️
