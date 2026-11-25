const fs=require('fs'),sharp=require('sharp');
const names=fs.readdirSync('public/studio-covers').filter(n=>n.endsWith('.svg'));
(async()=>{const images=await Promise.all(names.map(async(name,i)=>({input:await sharp(fs.readFileSync('public/studio-covers/'+name)).resize(240,180).png().toBuffer(),left:i%5*240,top:Math.floor(i/5)*180})));await sharp({create:{width:1200,height:360,channels:3,background:'#fff'}}).composite(images).resize(900,270).png().toFile('editorial-covers-check.png');console.log('All 10 SVG covers rendered successfully.');})();
