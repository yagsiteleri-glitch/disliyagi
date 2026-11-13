import fs from 'fs';
const content = fs.readFileSync('./src/data/products.json', 'utf8');
const urls = content.match(/https?:\/\/[^\s"'<>]+/g) || [];
console.log('Unique URLs in products.json:', Array.from(new Set(urls)));
