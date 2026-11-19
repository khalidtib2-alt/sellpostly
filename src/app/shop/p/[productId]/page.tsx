import LocalProduct from '../../local-product';
export const metadata={title:'Product | SellPostly',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{productId:string}>}){return <><style>{'body > header, body > footer {display:none;}'}</style><LocalProduct productId={(await params).productId}/></>;}
