'use client';
import {useRef,useState,useMemo,useCallback,type PointerEvent} from 'react';
import {editorialView,editorialViews,lookbookRotationStep} from './lookbook-data';
import {wearableOutfit,garmentZone,type OutfitZone} from '../../lib/daily-look';
import {turntableAngle,type OutfitPiece} from '../../lib/mannequin-data';
import {useLanguage} from '../language-context';
import LookbookMannequin from './lookbook-mannequin';
export default function LookbookStage({outfit,gender,active,onSelect,onAngleChange,dragProduct,onDropProduct}:{outfit:OutfitPiece[];gender:'women'|'men';active:string;onSelect:(id:string)=>void;onAngleChange?:(angle:number)=>void;dragProduct?:OutfitPiece['product'];onDropProduct?:(zone:OutfitZone,id:string)=>void}){
 const {t}=useLanguage(),[angle,setAngle]=useState(0),drag=useRef<{id:number;x:number;start:number;moved:boolean}|null>(null),suppress=useRef(false),current=useRef(0);
 const pieces=useMemo(()=>wearableOutfit(outfit),[outfit]);
 const select=useCallback((id:string)=>{if(!suppress.current)onSelect(id);},[onSelect]);
 function rotate(value:number){current.current=value;setAngle(value);onAngleChange?.(turntableAngle(value));}
 function start(e:PointerEvent<HTMLDivElement>){if(e.button!==0||drag.current)return;suppress.current=false;drag.current={id:e.pointerId,x:e.clientX,start:current.current,moved:false};}
 function move(e:PointerEvent<HTMLDivElement>){const d=drag.current;if(!d||d.id!==e.pointerId)return;const delta=e.clientX-d.x;if(Math.abs(delta)>5){d.moved=true;suppress.current=true;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}rotate(d.start+delta*.65);}}
 function stop(e:PointerEvent<HTMLDivElement>){if(drag.current?.id!==e.pointerId)return;try{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}catch{}drag.current=null;}
 const degrees=turntableAngle(angle),view=editorialView(degrees).label;
 return <section className="lookbook-turntable" aria-label={t('360° outfit turntable')}>
  <div className="lookbook-turntable-viewport" style={{'--turntable-angle':angle+'deg'} as React.CSSProperties} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={e=>{if(drag.current&&!e.currentTarget.hasPointerCapture?.(e.pointerId))drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}} onClickCapture={e=>{if(suppress.current){e.preventDefault();e.stopPropagation();suppress.current=false;}}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotate(current.current+(e.key==='ArrowRight'?lookbookRotationStep:-lookbookRotationStep));}else if(e.key==='Home'){e.preventDefault();rotate(0);}}} tabIndex={0} aria-label={t('Drag or swipe to rotate 360° • Tap any garment on the model to shop')}>
   <div className="lookbook-turntable-spotlight" aria-hidden="true"/><LookbookMannequin outfit={pieces} gender={gender} active={active} onSelect={select} angle={angle} dropZone={dragProduct?garmentZone(dragProduct):undefined} onDropProduct={onDropProduct}/><div className="lookbook-turntable-pedestal" aria-hidden="true"/>
  </div>
  <div className="lookbook-rotation-controls"><button type="button" onClick={()=>{suppress.current=false;rotate(current.current-lookbookRotationStep);}} aria-label={t('Rotate left')}>← {t('Rotate left')}</button><output aria-live="polite">{t(view)} · {Math.round(degrees)}°</output><button type="button" onClick={()=>{suppress.current=false;rotate(current.current+lookbookRotationStep);}} aria-label={t('Rotate right')}>{t('Rotate right')} →</button><button type="button" onClick={()=>{suppress.current=false;rotate(0);}}>{t('Reset')}</button></div>
  <div className="lookbook-angle-tabs" role="group" aria-label={t('Model angle')}>{editorialViews.map(item=><button type="button" key={item.key} aria-pressed={editorialView(angle).key===item.key} onClick={()=>rotate(item.angle)}>{t(item.label)}</button>)}</div>
  <p className="lookbook-avatar-note">{t('Generated model angles and garment overlays are illustrative, not a fit or back-detail guarantee.')}</p>
 </section>;
}
