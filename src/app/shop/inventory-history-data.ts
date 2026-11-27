import type {StockReason} from './inventory-data';
export type StockMovement = {
 id:string;product_id:string;product_name:string;variant_id:string;variant_label:string;sku:string;
 delta:number;reason:StockReason;note:string;created_at:string;order_id:string|null;
};
export const inventoryPageSize=50;
