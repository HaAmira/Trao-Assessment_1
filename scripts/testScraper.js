const axios = require('axios');
const cheerio = require('cheerio');

async function scrapePages() {
  const urls = [
    'https://mantra.care/india/',
    'https://mantra.care/about-us/',
    'https://mantra.care/career/'
  ];

  for (const url of urls) {
    try {
      console.log('\n=======================================');
      console.log('Fetching:', url);
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      const $ = cheerio.load(res.data);
      $('script, style, noscript, nav, footer, header, .nav, .footer, .header, #header, #footer').remove();
      
      const title = $('title').text().trim();
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      const text = $('body').text().replace(/\s+/g, ' ').trim();

      console.log('Title:', title);
      console.log('Meta Desc:', metaDesc);
      console.log('Text length:', text.length);
      console.log('Sample text:', text.slice(0, 300));
    } catch (err) {
      console.error('Error fetching', url, err.message);
    }
  }
}

scrapePages();
