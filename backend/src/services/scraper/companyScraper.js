const axios = require('axios');
const cheerio = require('cheerio');
const { isSafeUrl, sanitizeScrapedText } = require('../../utils/ssrfGuard');

class CompanyScraper {
  constructor() {
    this.timeout = 8000;
    this.maxPages = 4;
  }

  /**
   * Scrapes company website: home page and top-ranked discovered subpages.
   * @param {string} companyUrl 
   * @param {string} companyName 
   * @param {boolean} allowLocal 
   * @returns {Promise<Object>}
   */
  async scrapeCompany(companyUrl, companyName = '', allowLocal = false) {
    const result = {
      company: companyName,
      company_url: companyUrl,
      pages_used: [],
      raw_texts: [],
      scraped_pages: [], // detailed info per scraped page
      discovered_links: [], // all ranked links
      brief: {
        summary: '',
        what_they_do: '',
        sources: []
      },
      hiring_info: '',
      errors: []
    };

    if (!companyUrl || typeof companyUrl !== 'string' || companyUrl.trim().length === 0) {
      result.brief.summary = companyName 
        ? `${companyName} information based on job description.`
        : 'Company information based on job description.';
      result.brief.what_they_do = 'Refer to the role requirements and responsibilities.';
      return result;
    }

    // SSRF Guard
    if (!isSafeUrl(companyUrl, allowLocal)) {
      result.errors.push(`URL '${companyUrl}' was rejected by SSRF security policy.`);
      result.brief.summary = `Company website could not be accessed securely (${companyUrl}).`;
      result.brief.what_they_do = 'Research relied on job description details.';
      return result;
    }

    try {
      // 1. Fetch main page
      const mainPageData = await this.fetchPage(companyUrl);
      if (mainPageData) {
        result.pages_used.push(companyUrl);
        result.raw_texts.push(mainPageData.text);
        result.scraped_pages.push({
          url: companyUrl,
          title: mainPageData.title,
          category: 'home',
          char_count: mainPageData.text.length
        });

        if (!result.company && mainPageData.title) {
          result.company = this.cleanCompanyTitle(mainPageData.title);
        }

        // 2. Discover and rank related links dynamically
        const rankedLinks = this.discoverAndRankLinks(companyUrl, mainPageData.html);
        result.discovered_links = rankedLinks;

        // Select the top-ranked pages from diverse categories (careers, about, etc.)
        const selectedUrls = this.selectTopPages(rankedLinks, this.maxPages - 1);

        for (const target of selectedUrls) {
          if (!result.pages_used.includes(target.url)) {
            const subPageData = await this.fetchPage(target.url);
            if (subPageData) {
              result.pages_used.push(target.url);
              result.raw_texts.push(subPageData.text);
              result.scraped_pages.push({
                url: target.url,
                title: subPageData.title,
                category: target.category,
                char_count: subPageData.text.length
              });

              // Check if page contains explicit hiring/careers details
              if (target.category === 'careers' && subPageData.text.length > 100) {
                result.hiring_info = subPageData.text.slice(0, 3000);
              }
            }
          }
        }
      } else {
        result.errors.push(`Could not fetch content from main URL: ${companyUrl}`);
      }
    } catch (err) {
      result.errors.push(`Error crawling company website: ${err.message}`);
    }

    // Fallback if pages couldn't be loaded or were empty
    if (result.pages_used.length === 0) {
      result.brief.summary = `Company site ${companyUrl} was unreachable, returned an error, or had restricted access.`;
      result.brief.what_they_do = 'No publicly accessible company pages found during crawl.';
      result.brief.sources = [companyUrl];
    } else {
      result.brief.sources = [...result.pages_used];
    }

    return result;
  }

  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        maxContentLength: 5 * 1024 * 1024, // 5MB limit
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        validateStatus: (status) => status >= 200 && status < 400
      });

      const html = response.data;
      if (typeof html !== 'string' || html.trim().length === 0) return null;

      const $ = cheerio.load(html);

      // Extract metadata before stripping elements
      const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
      const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

      // Strip boilerplate noise, scripts, navigation, footers, sidebars, cookie banners
      $('script, style, noscript, nav, footer, header, .nav, .navbar, .footer, .header, #header, #footer, .cookie-banner, .modal, .sidebar, .menu, svg, iframe, canvas').remove();

      // Extract semantic text: prioritize headings, main, article, and paragraphs
      let bodyText = '';
      const mainEl = $('main, article, [role="main"], #content, .content');
      if (mainEl.length > 0) {
        bodyText = mainEl.text();
      } else {
        bodyText = $('body').text();
      }

      const combinedText = `${title}\n${metaDescription}\n${bodyText}`;
      const cleaned = sanitizeScrapedText(combinedText, 12000);

      // Ensure extracted text is meaningful and not just whitespace
      if (cleaned.length < 30 && !metaDescription) {
        return null;
      }

      return {
        title,
        metaDescription,
        html,
        text: cleaned
      };
    } catch (err) {
      // 404s, timeouts, DNS failures handled gracefully
      return null;
    }
  }

  /**
   * Discovers and ranks relevant internal links dynamically
   */
  discoverAndRankLinks(baseUrl, html) {
    try {
      const $ = cheerio.load(html);
      const candidates = new Map();
      const base = new URL(baseUrl);

      // Scoring criteria
      const categories = [
        {
          name: 'careers',
          keywords: ['career', 'careers', 'jobs', 'job openings', 'job-openings', 'join us', 'join-us', 'work with us', 'work-with-us', 'hiring', 'open positions', 'open-positions', 'vacancies'],
          baseWeight: 100
        },
        {
          name: 'about',
          keywords: ['about us', 'about-us', 'about', 'company', 'who we are', 'who-we-are', 'our story', 'our-story', 'mission', 'overview'],
          baseWeight: 80
        },
        {
          name: 'culture_process',
          keywords: ['interview', 'hiring process', 'hiring-process', 'how we hire', 'how-we-hire', 'culture', 'values', 'life at', 'life-at'],
          baseWeight: 90
        },
        {
          name: 'team',
          keywords: ['team', 'leadership', 'people'],
          baseWeight: 60
        }
      ];

      $('a[href]').each((_, el) => {
        const rawHref = $(el).attr('href');
        if (!rawHref) return;

        // Skip anchors, javascript, mailto, tel
        const trimmed = rawHref.trim();
        if (trimmed.startsWith('#') || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
          return;
        }

        try {
          // Supports relative links naturally via new URL(href, baseUrl)
          const resolved = new URL(trimmed, baseUrl);
          
          // Only crawl same domain/origin
          if (resolved.hostname === base.hostname) {
            // Normalize: strip query, hash, and trailing slash (except root)
            let cleanUrl = `${resolved.origin}${resolved.pathname}`.replace(/\/+$/, '') || resolved.origin;
            // Retain path if baseUrl had a path
            if (cleanUrl === baseUrl.replace(/\/+$/, '')) {
              return; // Skip link pointing to the exact same page
            }

            const anchorText = $(el).text().replace(/\s+/g, ' ').trim().toLowerCase();
            const pathLower = resolved.pathname.toLowerCase();
            const combinedString = `${pathLower} ${anchorText}`;

            let highestScore = 0;
            let matchedCategory = 'general';

            for (const cat of categories) {
              let pathScore = 0;
              let anchorScore = 0;

              for (const kw of cat.keywords) {
                // Match in URL path
                if (pathLower.includes(kw)) {
                  const s = cat.baseWeight + (pathLower.includes(`/${kw}`) || pathLower.includes(`${kw}/`) ? 20 : 0);
                  if (s > pathScore) pathScore = s;
                }
                // Match in anchor text
                if (anchorText.includes(kw)) {
                  const s = cat.baseWeight + (anchorText === kw || anchorText === `${kw} us` ? 30 : 0);
                  if (s > anchorScore) anchorScore = s;
                }
              }

              const totalCatScore = pathScore + anchorScore;
              if (totalCatScore > highestScore) {
                highestScore = totalCatScore;
                matchedCategory = cat.name;
              }
            }

            if (highestScore > 0) {
              if (!candidates.has(cleanUrl) || candidates.get(cleanUrl).score < highestScore) {
                candidates.set(cleanUrl, {
                  url: cleanUrl,
                  text: $(el).text().replace(/\s+/g, ' ').trim().slice(0, 50),
                  score: highestScore,
                  category: matchedCategory
                });
              }
            }
          }
        } catch (e) {
          // Invalid URL syntax ignored safely
        }
      });

      // Sort descending by score
      const sorted = Array.from(candidates.values()).sort((a, b) => b.score - a.score);
      return sorted;
    } catch (err) {
      return [];
    }
  }

  /**
   * Selects up to maxCount pages prioritizing diversity across categories (careers, about, culture)
   */
  selectTopPages(rankedLinks, maxCount = 3) {
    const selected = [];
    const usedCategories = new Set();

    // First pass: pick highest scoring page from each distinct category
    for (const item of rankedLinks) {
      if (!usedCategories.has(item.category) && selected.length < maxCount) {
        selected.push(item);
        usedCategories.add(item.category);
      }
    }

    // Second pass: fill remaining slots with highest scores regardless of category
    if (selected.length < maxCount) {
      for (const item of rankedLinks) {
        if (!selected.some(s => s.url === item.url) && selected.length < maxCount) {
          selected.push(item);
        }
      }
    }

    return selected;
  }

  cleanCompanyTitle(rawTitle) {
    if (!rawTitle) return '';
    // Strip common suffixes: " - About Us", " | Careers", " #1 Employee Wellness..."
    const parts = rawTitle.split(/[-|–•:]/);
    if (parts.length > 1) {
      // Pick first non-empty segment that doesn't start with '#' or generic tagline
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed && !trimmed.startsWith('#') && !/official|homepage|welcome/i.test(trimmed)) {
          return trimmed;
        }
      }
    }
    return rawTitle.slice(0, 40).trim();
  }
}

module.exports = new CompanyScraper();
