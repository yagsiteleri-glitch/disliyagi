import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/yastn/OneDrive/Masaüstü/disliyagi';
const domainUrls = JSON.parse(fs.readFileSync('C:/Users/yastn/OneDrive/Masaüstü/domain_urls.json', 'utf-8'));
const urls = domainUrls.disliyagi || [];

console.log(`Processing ${urls.length} disliyagi URLs...`);

function slugify(text) {
  const trMap = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o'
  };
  return text
    .split('')
    .map(c => trMap[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err.message);
    return null;
  }
}

async function downloadImage(imgUrl, destPath) {
  try {
    const res = await fetch(imgUrl);
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    return true;
  } catch (err) {
    console.error(`Image download error for ${imgUrl}:`, err.message);
    return false;
  }
}

function extractMetadata(url, html) {
  let title = '';
  let imgUrl = '';

  if (html) {
    const titleMatch = html.match(/<h1[^>]*product-name[^>]*>([\s\S]*?)<\/h1>/i) ||
                       html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                       html.match(/<title>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    }

    const imgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                     html.match(/<img[^>]+id=["']product-image[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                     html.match(/<img[^>]+class=["'][^"']*main-img[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                     html.match(/src=["'](https:\/\/[^"']+\.(?:jpg|png|jpeg|webp))["']/i);
    if (imgMatch) {
      imgUrl = imgMatch[1];
    }
  }

  if (!title) {
    const parts = url.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || 'disli-yagi';
    title = lastPart.replace(/-/g, ' ').toUpperCase();
  }

  // Brand detection
  const upper = title.toUpperCase();
  let brand = 'Mobil';
  let brandSlug = 'mobil';
  if (upper.includes('SHELL') || url.includes('shell')) { brand = 'Shell'; brandSlug = 'shell'; }
  else if (upper.includes('CASTROL') || url.includes('castrol')) { brand = 'Castrol'; brandSlug = 'castrol'; }
  else if (upper.includes('PETROL OFISI') || upper.includes('PETROL OFİSİ') || url.includes('petrol-ofisi')) { brand = 'Petrol Ofisi'; brandSlug = 'petrol-ofisi'; }
  else if (upper.includes('ARTOIL') || url.includes('artoil')) { brand = 'Artoil'; brandSlug = 'artoil'; }

  // Viscosity
  let viscosity = 'ISO VG 220';
  const viscMatch = upper.match(/ISO\s*VG\s*(\d+)/i) || 
                    upper.match(/\b(68|100|150|220|320|460|680|1000)\b/) ||
                    upper.match(/\b(75W-90|80W-90|85W-140|75W-80)\b/i);
  if (viscMatch) {
    viscosity = viscMatch[1].includes('W') ? viscMatch[1] : `ISO VG ${viscMatch[1]}`;
  } else if (upper.includes('ATF')) {
    viscosity = 'Otomatik Şanzıman Sıvısı (ATF)';
  }

  // Packaging
  let pack = '20 L';
  const packMatch = title.match(/(\d+(?:[.,]\d+)?\s*(?:L|Lt|Litre|Kg|Varil|Koli|Teneke))/i);
  if (packMatch) {
    pack = packMatch[1].toUpperCase();
  }

  const slug = slugify(title);
  const fileName = `${slug}.jpg`;

  // Unique high quality SEO description
  const uniqueDesc = `${title}, kapalı endüstriyel redüktörler, düz, helisel, konik ve ağır yük altında çalışan planet dişli kutuları ile şanzıman sistemleri için üstün aşırı basınç (EP) koruması ve mikropitting direnci sunan yüksek performanslı dişli yağıdır. ${brand} ileri madeni yağ teknolojisiyle geliştirilen bu ürün, yüksek tork ve şok darbe yükleri altında kesintisiz yağ filmi oluşturarak diş aşınmalarını, yorulma çukurlaşmalarını (pitting) ve kırılmaları önler. Oksidasyon ve ısıl kararlılığı mükemmeldir; sarı metal (bronz) alaşımları ve sızdırmazlık contalarıyla tam uyum gösterir. Ekipman ömrünü maksimuma çıkarır ve enerji verimliliği sağlar.`;

  const shortDesc = `${brand} üstün formülü ile endüstriyel redüktör ve şanzıman sistemlerinde aşırı yük, mikropitting ve aşınmaya karşı üstün koruma sağlayan ${viscosity} dişli yağı.`;

  return {
    id: slug,
    name: title,
    title,
    brand,
    brandName: brand,
    brandSlug,
    viscosity,
    pack,
    packageType: pack,
    packageSize: pack,
    imgUrl,
    image: `/images/products/${fileName}`,
    fileName,
    shortDesc,
    shortDescription: shortDesc,
    description: uniqueDesc,
    specs: [
      { label: 'Viskozite', value: viscosity },
      { label: 'Kullanım Alanı', value: 'Sanayi Redüktörleri & Şanzıman' },
      { label: 'Ambalaj', value: pack },
      { label: 'Marka', value: brand }
    ],
    originalUrl: url
  };
}

async function main() {
  const productsDir = path.join(projectRoot, 'public/images/products');
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
  }

  const rawProducts = [];
  const seenIds = new Set();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Fetching: ${url}`);
    const html = await fetchHtml(url);
    const meta = extractMetadata(url, html);

    if (seenIds.has(meta.id)) {
      console.log(`  Skipping duplicate id: ${meta.id}`);
      continue;
    }
    seenIds.add(meta.id);

    const destPath = path.join(productsDir, meta.fileName);
    if (meta.imgUrl) {
      if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
        console.log(`  Downloading image: ${meta.imgUrl} -> ${meta.fileName}`);
        await downloadImage(meta.imgUrl, destPath);
      }
    }

    rawProducts.push({
      id: meta.id,
      name: meta.name,
      title: meta.title,
      brand: meta.brand,
      brandName: meta.brandName,
      brandSlug: meta.brandSlug,
      viscosity: meta.viscosity,
      pack: meta.pack,
      packageType: meta.packageType,
      packageSize: meta.packageSize,
      image: meta.image,
      shortDesc: meta.shortDesc,
      shortDescription: meta.shortDescription,
      description: meta.description,
      specs: meta.specs,
      usage: 'Sanayi Redüktörleri & Ağır Şanzıman Dişli Sistemleri',
      msdsUrl: '#',
      tdsUrl: '#'
    });
  }

  // Write products.json
  fs.writeFileSync(path.join(projectRoot, 'src/data/products.json'), JSON.stringify(rawProducts, null, 2), 'utf-8');
  console.log(`Saved ${rawProducts.length} unique products to products.json`);

  // Update siteConfig.json
  const siteConfig = {
    siteName: "Dişli Yağı",
    domain: "https://disliyagi.com",
    siteUrl: "https://disliyagi.com",
    siteDescription: "Sanayi tipi redüktörler, planet dişliler ve ağır hizmet şanzımanlar için yüksek kaliteli dişli yağları. Mobil, Shell, Castrol, Petrol Ofisi ve Artoil dişli yağı satış merkezi.",
    metaDescription: "Sanayi tipi redüktörler, planet dişliler ve ağır hizmet şanzımanlar için yüksek kaliteli dişli yağları. Mobil, Shell, Castrol, Petrol Ofisi ve Artoil dişli yağı satış merkezi.",
    contactPhone: "0506 940 12 10",
    contactEmail: "bilgi@disliyagi.com",
    address: "İkitelli OSB, İsdök Sanayi Sitesi, Başakşehir / İstanbul",
    whatsappNumber: "905069401210",
    footerBacklinkText: "Şanzıman ve Dişli Yağları Yağmarket'te",
    footerBacklinkUrl: "https://www.yagmarket.com/sanziman-disli-yaglari",
    footerDevLink: "https://essabilisim.com/",
    categoryName: "Dişli Yağları",
    themeColor: "#1e3a8a"
  };
  fs.writeFileSync(path.join(projectRoot, 'src/data/siteConfig.json'), JSON.stringify(siteConfig, null, 2), 'utf-8');

  // Unique blog posts for disli
  const blogPosts = [
    {
      slug: "sanayi-reduktorlerinde-sentetik-ve-mineral-disli-yagi-secimi",
      title: "Sanayi Redüktörlerinde Sentetik ve Mineral Dişli Yağı Seçimi",
      date: "2026-03-10",
      excerpt: "Ağır sanayi redüktörlerinde mineral yağlar ile PAO / PAG sentetik dişli yağlarının performans ve enerji verimliliği karşılaştırması.",
      content: [
        "<p>Ağır sanayi tesislerinde konveyörler, kırıcılar, haddehaneler ve vinç redüktörleri sürekli yüksek tork altında çalışır. Bu redüktörlerde doğru dişli yağı seçimi, hem diş profil aşınmalarını önler hem de motorun çektiği elektrik akımını düşürerek enerji tasarrufu sağlar.</p>",
        "<h2>Mineral vs Sentetik (PAO)</h2>",
        "<p>Mobilgear 600 XP ve Shell Omala S2 GX gibi kaliteli mineral yağlar standart endüstriyel gereksinimleri karşılarken, aşırı sıcaklık ve sürekli ağır yük altında Shell Omala S4 WE veya Mobil Glygoyle serisi sentetik yağlar 5 kata kadar daha uzun yağ ömrü sunar.</p>"
      ]
    },
    {
      slug: "reduktorlerde-mikropitting-nedir-ve-nasil-onlenir",
      title: "Redüktörlerde Mikropitting Nedir ve Nasıl Önlenir?",
      date: "2026-02-27",
      excerpt: "Dişli temas yüzeylerinde oluşan mikroskobik yorulma çatlakları ve Flender standartlarına uygun dişli yağı kullanmanın önemi.",
      content: [
        "<p>Mikropitting, sertleştirilmiş dişli yanağında mikron düzeyinde meydana gelen yüzey yorulması hasarıdır. Zamanla diş kırılmalarına yol açabilen bu aşınma tipi, özellikle rüzgar türbinleri ve ağır redüktörlerde kritik bir risktir.</p>",
        "<h2>Özel EP Katkı Teknolojisi</h2>",
        "<p>Gelişmiş aşırı basınç (EP) katkılarına sahip dişli yağları, metal-metale teması engelleyen elastohidrodinamik koruyucu bir bariyer oluşturarak mikropitting oluşumunu engeller.</p>"
      ]
    },
    {
      slug: "sonsuz-vida-reduktorlerde-pag-poliglikol-yaglarin-ustunlugu",
      title: "Sonsuz Vida Redüktörlerde PAG (Poliglikol) Yağların Üstünlüğü",
      date: "2026-02-14",
      excerpt: "Sonsuz vida ve çark sistemlerinde yüksek sürtünme ısısını düşüren ve bronz alaşımları koruyan PAG dişli yağlarının avantajları.",
      content: [
        "<p>Sonsuz vida redüktörler yapısı gereği yüksek kayma sürtünmesine maruz kalır. Bu durum standart mineral yağların çabuk ısınmasına ve viskozite kaybına yol açar.</p>",
        "<h2>Düşük Sürtünme Katsayısı</h2>",
        "<p>Polialkilen glikol (PAG) bazlı sentetik dişli yağları, benzersiz düşük sürtünme katsayıları sayesinde çalışma sıcaklığını 10-15°C düşürür ve mekanik verimliliği %15'e kadar artırır.</p>"
      ]
    }
  ];
  fs.writeFileSync(path.join(projectRoot, 'src/data/blogPosts.json'), JSON.stringify(blogPosts, null, 2), 'utf-8');

  // Update robots.txt & sitemap.xml & astro.config.mjs
  const astroConfig = `import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://disliyagi.com',
  integrations: [sitemap()],
});
`;
  fs.writeFileSync(path.join(projectRoot, 'astro.config.mjs'), astroConfig, 'utf-8');

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://disliyagi.com/sitemap-index.xml
`;
  fs.writeFileSync(path.join(projectRoot, 'public/robots.txt'), robotsTxt, 'utf-8');

  // Update Layout.astro for header logo, links and meta
  let layoutContent = fs.readFileSync(path.join(projectRoot, 'src/layouts/Layout.astro'), 'utf-8');
  layoutContent = layoutContent
    .replace(/hidrolikyag\.com/g, 'disliyagi.com')
    .replace(/hidrolik yağı/gi, 'dişli yağı')
    .replace(/hidrolik yağ/gi, 'dişli yağı')
    .replace(/Hidrolik Yağ/g, 'Dişli Yağı')
    .replace(/https:\/\/www\.yagmarket\.com\/hidrolik-sistem-yaglari/g, 'https://www.yagmarket.com/sanziman-disli-yaglari');
  fs.writeFileSync(path.join(projectRoot, 'src/layouts/Layout.astro'), layoutContent, 'utf-8');

  // Update index.astro
  let indexContent = fs.readFileSync(path.join(projectRoot, 'src/pages/index.astro'), 'utf-8');
  indexContent = indexContent
    .replace(/hidrolikyag\.com/g, 'disliyagi.com')
    .replace(/hidrolik yağı/gi, 'dişli yağı')
    .replace(/hidrolik yağ/gi, 'dişli yağı')
    .replace(/Hidrolik Yağ/g, 'Dişli Yağı')
    .replace(/Hidrolik Sistem/g, 'Sanayi Redüktör & Şanzıman');
  fs.writeFileSync(path.join(projectRoot, 'src/pages/index.astro'), indexContent, 'utf-8');

  // Update teklif-al.astro
  let teklifContent = fs.readFileSync(path.join(projectRoot, 'src/pages/teklif-al.astro'), 'utf-8');
  teklifContent = teklifContent
    .replace(/hidrolikyag\.com/g, 'disliyagi.com')
    .replace(/hidrolik yağı/gi, 'dişli yağı')
    .replace(/hidrolik yağ/gi, 'dişli yağı')
    .replace(/Hidrolik Yağ/g, 'Dişli Yağı');
  fs.writeFileSync(path.join(projectRoot, 'src/pages/teklif-al.astro'), teklifContent, 'utf-8');

  // Update [id].astro for specs safety and branding
  let idContent = fs.readFileSync(path.join(projectRoot, 'src/pages/urun/[id].astro'), 'utf-8');
  idContent = idContent
    .replace(/hidrolikyag\.com/g, 'disliyagi.com')
    .replace(/hidrolik yağı/gi, 'dişli yağı')
    .replace(/hidrolik yağ/gi, 'dişli yağı')
    .replace(/Hidrolik Yağ/g, 'Dişli Yağı')
    .replace(/Hidrolik Sistemler/g, 'Sanayi Redüktörleri & Şanzıman')
    .replace(/Endüstriyel Yağlar > Hidrolik Yağı/g, 'Endüstriyel Yağlar > Dişli Yağı');

  if (!idContent.includes('{product.specs && product.specs.length > 0 && (')) {
    idContent = idContent.replace(
      /<h3>Teknik Veri & Viskozite Değerleri<\/h3>[\s\S]*?<\/table>/,
      `{product.specs && product.specs.length > 0 && (
          <h3>Teknik Veri & Viskozite Değerleri</h3>
          <table class="orig-specs-table">
            <tbody>
              {product.specs.map(s => (
                <tr>
                  <td><strong>{s.label}</strong></td>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}`
    );
  }
  fs.writeFileSync(path.join(projectRoot, 'src/pages/urun/[id].astro'), idContent, 'utf-8');

  console.log('disliyagi.com setup completely done!');
}

main().catch(console.error);
