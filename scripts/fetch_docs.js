import fs from 'fs';

const products = JSON.parse(fs.readFileSync('./src/data/products.json', 'utf8'));

async function fetchDocs(id) {
  try {
    const res = await fetch(`https://hidrolikyagi.net/${id}/`);
    if (!res.ok) return { id, error: res.status };
    const html = await res.text();
    
    // Look for pdf links
    const msdsMatch = html.match(/href=["']([^"']*msds[^"']*\.pdf)["']/i);
    const tdsMatch = html.match(/href=["']([^"']*tds[^"']*\.pdf)["']/i);
    
    // Also look for any pdf link in elementor buttons or general links
    const allPdfs = Array.from(html.matchAll(/href=["']([^"']*\.pdf)["']/gi)).map(m => m[1]);

    return {
      id,
      msds: msdsMatch ? msdsMatch[1] : null,
      tds: tdsMatch ? tdsMatch[1] : null,
      allPdfs
    };
  } catch(e) {
    return { id, error: e.message };
  }
}

async function run() {
  console.log(`Starting fetch for ${products.length} products...`);
  let foundMsds = 0;
  let foundTds = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const data = await fetchDocs(p.id);
    if (data.msds) {
      p.msdsUrl = data.msds;
      foundMsds++;
    }
    if (data.tds) {
      p.tdsUrl = data.tds;
      foundTds++;
    }
    console.log(`[${i+1}/${products.length}] ${p.id}: MSDS=${p.msdsUrl !== '#' ? 'YES' : 'NO'}, TDS=${p.tdsUrl !== '#' ? 'YES' : 'NO'}`);
  }

  console.log(`Done! Found ${foundMsds} MSDS, ${foundTds} TDS.`);
  fs.writeFileSync('./src/data/products.json', JSON.stringify(products, null, 2), 'utf8');
  console.log('Saved updated products.json!');
}

run();
