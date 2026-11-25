'use client';
import {useEffect,useRef,type ReactNode,type PointerEvent} from 'react';
export default function LookbookStage({children}:{children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null),frame=useRef(0);
 useEffect(()=>()=>{if(frame.current)cancelAnimationFrame(frame.current);},[]);
 function reset(){if(frame.current)cancelAnimationFrame(frame.current);const node=ref.current;if(node){node.style.setProperty('--look-rx','0deg');node.style.setProperty('--look-ry','0deg');node.style.setProperty('--look-light-x','50%');node.style.setProperty('--look-light-y','35%');}}
 function tilt(event:PointerEvent<HTMLDivElement>){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){reset();return;}
  if(event.pointerType==='touch'&&!event.buttons)return;
  const node=ref.current;if(!node)return;const rect=node.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const x=Math.max(-1,Math.min(1,2*(event.clientX-rect.left)/rect.width-1)),y=Math.max(-1,Math.min(1,2*(event.clientY-rect.top)/rect.height-1));
  cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>{node.style.setProperty('--look-rx',(-y*4).toFixed(2)+'deg');node.style.setProperty('--look-ry',(x*5).toFixed(2)+'deg');node.style.setProperty('--look-light-x',(50+x*25)+'%');node.style.setProperty('--look-light-y',(40+y*20)+'%');});
 }
 return <div ref={ref} className="lookbook-stage" onPointerMove={tilt} onPointerLeave={reset} onPointerUp={reset} onPointerCancel={reset} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))reset();}}><div className="lookbook-stage-floor" aria-hidden="true"/><div className="lookbook-stage-depth">{children}<div className="lookbook-stage-light" aria-hidden="true"/></div></div>;
}
