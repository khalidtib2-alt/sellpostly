'use client';
import {useEffect,useState,memo,type CSSProperties} from 'react';
import {photoGarmentPlacement,titleColor,type OutfitPiece} from '../../lib/mannequin-data';
import {garmentCutout,type GarmentCutout} from '../../lib/garment-cutout';
import {zoneLabels,outfitZones,type OutfitZone} from '../../lib/daily-look';
import {editorialImage,editorialView,editorialViews} from './lookbook-data';
import {useLanguage} from '../language-context';
function LookbookMannequin({outfit,gender,active,onSelect,angle=0,dropZone,onDropProduct}:{outfit:OutfitPiece[];gender:'women'|'men';active:string;onSelect:(id:string)=>void;angle?:number;dropZone?:OutfitZone;onDropProduct?:(zone:OutfitZone,id:string)=>void}){
 const {t}=useLanguage(),view=editorialView(angle),[textures,setTextures]=useState<Record<string,GarmentCutout>>({});
 const identity=JSON.stringify(outfit.map(piece=>[piece.product.id,piece.product.image,piece.product.name]));
 useEffect(()=>{let current=true;setTextures({});void Promise.all(outfit.map(async piece=>[piece.product.id,await garmentCutout(piece.product.image,piece.product.name)] as const)).then(results=>{if(current)setTextures(Object.fromEntries(results));});return()=>{current=false;};},[identity]);
 const delta=((angle-view.angle+540)%360)-180;
 return <div className="lookbook-real-model" data-gender={gender} data-view={view.key} style={{'--photo-yaw':Math.max(-9,Math.min(9,delta*.22))+'deg'} as CSSProperties}>
  {editorialViews.map(item=><img key={item.key} src={editorialImage(gender,item.key)} alt={t('Editorial fashion inspiration')} aria-hidden={view.key!==item.key} className={'lookbook-real-photo '+(view.key===item.key?'is-visible':'')} loading={item.key==='front'?'eager':'lazy'} draggable={false}/>)}
  {outfitZones.map(zone=>{const piece=outfit.find(item=>item.zone===zone),box=photoGarmentPlacement(zone,view.key),texture=piece?textures[piece.product.id]:undefined;return <button key={zone} type="button" className="lookbook-photo-garment" data-product-id={piece?.product.id} data-drop-zone={zone} data-active={!!piece&&active===piece.product.id} data-drop-active={dropZone===zone} data-zone={zone} aria-label={t(zoneLabels[zone])+(piece?': '+piece.product.name:'')} aria-pressed={!!piece&&active===piece.product.id} onClick={()=>piece&&onSelect(piece.product.id)} onDragOver={event=>{if(dropZone===zone){event.preventDefault();event.dataTransfer.dropEffect='copy';}}} onDrop={event=>{event.preventDefault();const id=event.dataTransfer.getData('application/x-sellpostly-product')||event.dataTransfer.getData('text/plain');if(id)onDropProduct?.(zone,id);}} style={{left:box.x+'%',top:box.y+'%',width:box.w+'%',height:box.h+'%'}}>
   {piece&&<span className="lookbook-fabric-overlay" style={{backgroundColor:texture?.color||(piece?titleColor(piece.product.name):'#64748b')}}/>}
   {texture?.src&&view.key!=='back'&&view.key!=='side'&&<img className="lookbook-garment-cutout" src={texture.src} alt="" draggable={false}/>}
   <span className="lookbook-garment-hint">{t(zoneLabels[zone])}</span>
  </button>;})}
  <span className="lookbook-photo-rim" aria-hidden="true"/>
 </div>;
}
export default memo(LookbookMannequin);
