const fs=require('fs');let p='src/app/shop/shop-builder.tsx',s=fs.readFileSync(p,'utf8');s=s.replace("import PaymentSettingsEditor", "import {savePaymentSettings} from '../../lib/save-payment-settings';\nimport PaymentSettingsEditor");s=s.replace("const [draftUrl,setDraftUrl]", "const [paymentMessage,setPaymentMessage]=useState<Message|''>('');\n  const [draftUrl,setDraftUrl]");s=s.replace("  async function shareMode(",`  async function savePayments(){
    if(publishing)return;setPublishing(true);setPaymentMessage('');
    const snapshot=shopRef.current;
    try{const result=await savePaymentSettings(snapshot,localStorage);setPublishedSlug(result.slug);
      if(shopRef.current===snapshot){setShop(result.shop);setPaymentMessage(result.localSaved?'Payment settings saved.':'Payment settings saved online. Local storage is full.');}
      else setPaymentMessage('Payment settings saved. New edits remain unsaved.');
    }catch{setPaymentMessage('Could not save payment settings. Check your license and connection.');}finally{setPublishing(false);}
  }
  async function shareMode(`);s=s.replace("onClick={()=>shareMode('personal')}>{t('Save Payment Settings')}</button>", "onClick={()=>void savePayments()}>{t(publishing?'Saving.':'Save Payment Settings')}</button><p role=\"status\" aria-live=\"polite\" className=\"mt-3 text-sm font-semibold text-emerald-800\">{paymentMessage&&t(paymentMessage)}</p>");fs.writeFileSync(p,s);
