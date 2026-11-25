const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
const entries={
'Browse All Categories in Our Main Store':{fr:'Parcourir toutes les catégories de notre boutique principale',ar:'تصفّح جميع الفئات في متجرنا الرئيسي'},
'Show link to my main store':{fr:'Afficher le lien vers ma boutique principale',ar:'إظهار رابط متجري الرئيسي'},
'Visitors can browse all categories in your matching primary store.':{fr:'Les visiteurs peuvent parcourir toutes les catégories de votre boutique principale du même type.',ar:'يمكن للزوار تصفّح جميع الفئات في متجرك الأساسي من النوع نفسه.'},
'The link appears after your matching primary store is published.':{fr:'Le lien apparaît une fois votre boutique principale du même type publiée.',ar:'يظهر الرابط بعد نشر متجرك الأساسي من النوع نفسه.'},
'Save Store Settings':{fr:'Enregistrer les réglages de la boutique',ar:'حفظ إعدادات المتجر'},
'Store settings saved.':{fr:'Réglages de la boutique enregistrés.',ar:'تم حفظ إعدادات المتجر.'},
'Could not save store settings. Try again.':{fr:'Impossible d’enregistrer les réglages. Réessayez.',ar:'تعذر حفظ إعدادات المتجر. حاول مجددًا.'}
};edit('src/app/translations.ts',s=>s.replace('export const translations = {','export const translations = {\n'+Object.entries(entries).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)+',').join('\n')));
edit('src/app/site-shell.tsx',s=>s.replace('import Link from "next/link";', 'import Link from "next/link";\nimport {usePathname} from "next/navigation";\nfunction currentLink(path:string,href:string){const route=href.split("#")[0];return path===route||(route!=="/"&&path.startsWith(route+"/"))?"page" as const:undefined;}')
.replace('  const { language, setLanguage, t } = useLanguage();','  const { language, setLanguage, t } = useLanguage();\n  const pathname=usePathname();')
.replace('  const { t } = useLanguage();\n  return <footer', '  const { t } = useLanguage();const pathname=usePathname();\n  return <footer')
.replace(/<Link href="([^"]+)"/g,(_,href)=>'<Link aria-current={currentLink(pathname,'+JSON.stringify(href)+')} href='+JSON.stringify(href))
.replace('<Link key={href} href={href}>','<Link key={href} aria-current={currentLink(pathname,href)} href={href}>'));
