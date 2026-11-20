/** Display only: accounting and payment payloads retain their exact precision. */
export function checkoutAmount(value:string){
 if(!/^\d+(?:\.\d{1,6})?$/.test(value))return value;
 const [whole,fraction='']=value.split('.');
 const micros=BigInt(whole)*BigInt(1000000)+BigInt(fraction.padEnd(6,'0'));
 const cents=(micros+BigInt(5000))/BigInt(10000);
 return (cents/BigInt(100)).toString()+'.'+(cents%BigInt(100)).toString().padStart(2,'0');
}
