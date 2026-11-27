import InvoiceView from '../../invoice-view';
export const metadata={title:'Invoice | SellPostly',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{orderId:string}>}){
 return <InvoiceView orderId={(await params).orderId}/>;
}
