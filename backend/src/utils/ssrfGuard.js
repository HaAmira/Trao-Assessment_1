const urlModule = require('url');

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local and cloud metadata
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i
];

function isSafeUrl(urlString, allowLocal = false) {
  if (!urlString || typeof urlString !== 'string') return false;
  
  try {
    const parsed = new URL(urlString);
    
    // Check protocol
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname;

    if (allowLocal) {
      return true;
    }

    // Check if hostname matches any private or metadata patterns
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    return false;
  }
}

function sanitizeScrapedText(rawText, maxChars = 20000) {
  if (!rawText) return '';
  // Strip control characters and excessive whitespace
  let clean = rawText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();

  // Guard against prompt injection markers in untrusted web text
  clean = clean
    .replace(/ignore (all )?previous instructions/gi, '[filtered instruction]')
    .replace(/system prompt/gi, '[filtered prompt]')
    .replace(/you are now/gi, '[filtered persona]');

  if (clean.length > maxChars) {
    clean = clean.slice(0, maxChars) + '... [truncated]';
  }
  return clean;
}

module.exports = {
  isSafeUrl,
  sanitizeScrapedText
};

