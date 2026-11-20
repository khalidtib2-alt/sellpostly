import {loadPublicStore} from '../../../../lib/public-storefront';
import {storefrontPreviewImage} from '../../../shop/storefront-preview-image';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const alt='SellPostly storefront';
export const size={width:1200,height:630};
export const contentType='image/png';
export default async function Image({params}:{params:Promise<{slug:string;storeType:string}>}){const {slug,storeType}=await params;return storefrontPreviewImage(storeType==='affiliate'||storeType==='personal'?await loadPublicStore(slug,storeType):null);}
