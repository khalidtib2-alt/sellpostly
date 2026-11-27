// This module contains no runtime dependency import: model/WASM downloads start on click.
export const runtimeUrl='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js';
export const backgroundModel='onnx-community/BiRefNet_lite-ONNX';
export function backdropColor(value:string,mime:string){return /^#[0-9a-f]{6}$/i.test(value)?value:mime==='image/jpeg'?'#FFFFFF':null;}
export function comparisonPercent(clientX:number,left:number,width:number){return width>0?Math.max(0,Math.min(100,(clientX-left)/width*100)):50;}
export function removeBackground(input:Blob,progress:(percent:number|null)=>void,signal:AbortSignal):Promise<Blob>{
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(new DOMException('Aborted','AbortError'));return;}
  const code=`self.onmessage=async({data})=>{try{
   const nativeImport=new Function('url','return import(url)');
   const {AutoModel,AutoProcessor,RawImage,env}=await nativeImport(${JSON.stringify(runtimeUrl)});
   env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
   const files=new Map();
   const progress_callback=p=>{if(p.status==='progress'&&p.total>0){files.set(p.file,{loaded:p.loaded,total:p.total});const sums=[...files.values()].reduce((a,b)=>({loaded:a.loaded+b.loaded,total:a.total+b.total}),{loaded:0,total:0});self.postMessage({progress:Math.min(99,Math.round(sums.loaded/sums.total*100))});}else if(p.status==='ready')self.postMessage({progress:null});};
   const model=await AutoModel.from_pretrained(${JSON.stringify(backgroundModel)},{dtype:'fp32',device:'wasm',progress_callback});
   try{const processor=await AutoProcessor.from_pretrained(${JSON.stringify(backgroundModel)});
    const url=URL.createObjectURL(data);let image;try{image=await RawImage.fromURL(url);}finally{URL.revokeObjectURL(url);}
    const {pixel_values}=await processor(image);const {output_image}=await model({input_image:pixel_values});
    const mask=await RawImage.fromTensor(output_image[0].sigmoid().mul(255).to('uint8')).resize(image.width,image.height);
    image.putAlpha(mask);self.postMessage({blob:await image.toBlob()});
   }finally{await model.dispose();}
  }catch(error){self.postMessage({error:true});}};`;
  let worker:Worker|undefined;const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  const cleanup=()=>{worker?.terminate();URL.revokeObjectURL(url);signal.removeEventListener('abort',abort);clearTimeout(timeout);};
  const abort=()=>{cleanup();reject(new DOMException('Aborted','AbortError'));};
  const timeout=setTimeout(()=>{cleanup();reject(new Error('Background removal failed. Check your connection or try a smaller local photo.'));},300000);
  signal.addEventListener('abort',abort,{once:true});
  try{worker=new Worker(url,{type:'module'});worker.onmessage=({data})=>{if(data.blob){cleanup();resolve(data.blob);}else if(data.error){cleanup();reject(new Error('Background removal failed. Check your connection or try a smaller local photo.'));}else progress(data.progress);};worker.onerror=()=>{cleanup();reject(new Error('Background removal failed. Check your connection or try a smaller local photo.'));};worker.postMessage(input);}catch{cleanup();reject(new Error('Background removal failed. Check your connection or try a smaller local photo.'));}
 });
}
