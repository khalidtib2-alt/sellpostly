const fs=require('fs'),p='src/app/promo-image-studio.tsx';let s=fs.readFileSync(p,'utf8');s=s.replace('import { useEffect',"import {overlayBadgeLayout} from './promo-badge-layout';\nimport { useEffect");s=s.replace(/\n/g,'\n');s=s.replace('context.measureText(line+" "+word).width>920','context.measureText(line+" "+word).width>(textPosition==="badge"?452:920)');s=s.replace('      if(textPosition==="badge"){\n        context.fillStyle=colors[0];context.globalAlpha=0.94;\n        context.fillRect(40,y-10,1000,groupHeight+20);context.globalAlpha=1;\n      }',`      const badge=overlayBadgeLayout(height,groupHeight,!!title.trim(),language==='ar');
      if(textPosition==='badge'&&!badge){
        context.direction='ltr';context.fillStyle=colors[1];context.font='22px system-ui';context.textBaseline='alphabetic';context.fillText(t('Created with SellPostly.com'),540,height-20);
        setReady(true);if(image){try{element!.toBlob(blob=>{if(!cancelled)onImage(blob);},'image/png');}catch{setFailed(true);onImage(null);}}return;
      }
      context.save();
      if(textPosition==='badge'&&badge){
        context.fillStyle=colors[0];context.globalAlpha=.94;context.beginPath();context.roundRect(badge.x,badge.y,badge.width,badge.height,24);context.fill();context.globalAlpha=1;
        context.translate(badge.x+badge.padding,badge.y+badge.padding);context.scale((badge.width-badge.padding*2)/1000,1);context.translate(-40,0);y=0;
      }`);
// Normalize line endings to support this renderer in both CRLF and LF checkouts.
if(s.includes('context.fillRect(40,y-10,1000,groupHeight+20)'))throw Error('Badge replacement failed');
s=s.replace('      context.textBaseline="alphabetic";','      context.restore();\n      context.textBaseline="alphabetic";');fs.writeFileSync(p,s);
