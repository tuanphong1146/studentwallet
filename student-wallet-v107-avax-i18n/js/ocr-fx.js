const FX_RATES={VND:1,USD:25450,RUB:265,EUR:27600,CHF:28900,GBP:32300,JPY:168,KRW:18.5,CNY:3520,SGD:18900,AUD:16600,CAD:18200,THB:740,MYR:5750,IDR:1.6,PHP:440,TWD:790,HKD:3270,INR:302,NZD:15100,SEK:2380,NOK:2320,DKK:3700,PLN:6380,CZK:1090,AED:6930,SAR:6780,BRL:4450,MXN:1260,TRY:740};
let fxLiveUpdatedAt='';
let fxSyncPromise=null;
try{
  const cachedFx=JSON.parse(localStorage.getItem('sw_live_fx_cache')||'null');
  if(cachedFx&&cachedFx.rates&&typeof cachedFx.rates==='object'){
    Object.keys(cachedFx.rates).forEach(k=>{
      const v=Number(cachedFx.rates[k]);
      if(Number.isFinite(v)&&v>0)FX_RATES[normCur(k)]=v;
    });
    if(cachedFx.updatedAt)fxLiveUpdatedAt=String(cachedFx.updatedAt);
  }
}catch(e){}

function getFxRate(fromCur,toCur){
  const f=normCur(fromCur),t=normCur(toCur||appCur);
  if(f===t)return 1;
  const rf=FX_RATES[f]||25000,rt=FX_RATES[t]||1;
  const raw=rf/rt;
  return raw>=100?Math.round(raw):round2(raw);
}

async function syncLiveFxRates(force=false){
  if(fxSyncPromise&&!force)return fxSyncPromise;
  const now=Date.now();
  try{
    const cachedFx=JSON.parse(localStorage.getItem('sw_live_fx_cache')||'null');
    if(!force&&cachedFx&&cachedFx.ts&&(now-Number(cachedFx.ts))<6*3600*1000&&cachedFx.rates){
      return true;
    }
  }catch(e){}

  fxSyncPromise=(async()=>{
    const applyRatesMap=(vndPerCurMap,stamp)=>{
      let count=0;
      Object.keys(vndPerCurMap||{}).forEach(code=>{
        const c=normCur(code);
        const v=Number(vndPerCurMap[code]);
        if(/^[A-Z]{3}$/.test(c)&&Number.isFinite(v)&&v>0){
          FX_RATES[c]=c==='VND'?1:v;
          count++;
        }
      });
      if(count>2){
        FX_RATES.VND=1;
        fxLiveUpdatedAt=stamp||new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
        try{
          localStorage.setItem('sw_live_fx_cache',JSON.stringify({ts:Date.now(),updatedAt:fxLiveUpdatedAt,rates:FX_RATES}));
        }catch(e){}
        if(typeof draft!=='undefined'&&draft&&draft.fxMode==='convert'&&!draft.customFxRate){
          const cur=normCur(draft.currency),tgt=normCur(appCur);
          if(cur!==tgt){
            draft.fxRate=getFxRate(cur,tgt);
            const conv=v=>tgt==='VND'?Math.round(v*draft.fxRate):round2(v*draft.fxRate);
            draft.a=conv(draft.origTotal||0);
            if(typeof ed!=='undefined'&&ed&&Array.isArray(draft.origItems)){
              ed.items=draft.origItems.map(it=>{const val=conv(it.a);return{n:it.n,c:it.c,a:val>0?val:0.01}});
            }
            if(typeof form==='function'&&$('#fm'))form();
          }
        }
        if(typeof grpDraft!=='undefined'&&grpDraft&&grpDraft.fxMode==='convert'&&!grpDraft.customFxRate){
          const cur=normCur(grpDraft.currency),tgt=normCur(appCur);
          if(cur!==tgt){
            grpDraft.fxRate=getFxRate(cur,tgt);
            const conv=v=>tgt==='VND'?Math.round(v*grpDraft.fxRate):round2(v*grpDraft.fxRate);
            grpDraft.a=conv(grpDraft.origTotal||0);
            if(typeof grpEdItems!=='undefined'&&Array.isArray(grpDraft.origItems)){
              grpEdItems=grpDraft.origItems.map(it=>{const val=conv(it.a);return{n:it.n,c:it.c,a:val>0?val:0.01,uid:it.uid||uid}});
            }
            if(typeof grpScanForm==='function'&&$('#gfm'))grpScanForm();
          }
        }
        return true;
      }
      return false;
    };

    try{
      const r1=await fetch('https://open.er-api.com/v6/latest/VND',{cache:'no-store'});
      if(r1.ok){
        const j1=await r1.json();
        if(j1&&j1.result==='success'&&j1.rates&&Number(j1.rates.USD)>0){
          const map={VND:1};
          Object.keys(j1.rates).forEach(k=>{
            const perVnd=Number(j1.rates[k]);
            if(perVnd>0)map[k]=1/perVnd;
          });
          if(applyRatesMap(map,j1.time_last_update_utc?new Date(j1.time_last_update_utc).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}):''))return true;
        }
      }
    }catch(e){}

    try{
      const r2=await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/vnd.json',{cache:'no-store'});
      if(r2.ok){
        const j2=await r2.json();
        const vndMap=j2&&(j2.vnd||j2);
        if(vndMap&&typeof vndMap==='object'){
          const map={VND:1};
          Object.keys(vndMap).forEach(k=>{
            const perVnd=Number(vndMap[k]);
            if(perVnd>0)map[k.toUpperCase()]=1/perVnd;
          });
          if(applyRatesMap(map,j2.date||''))return true;
        }
      }
    }catch(e){}

    return false;
  })().finally(()=>{fxSyncPromise=null;});

  return fxSyncPromise;
}
const FX_SYM={VND:'đ',USD:'$',RUB:'₽',EUR:'€',CHF:'CHF ',GBP:'£',JPY:'¥',KRW:'₩',CNY:'¥',SGD:'S$',AUD:'A$',CAD:'C$',THB:'฿',MYR:'RM ',IDR:'Rp ',PHP:'₱',TWD:'NT$',HKD:'HK$',INR:'₹',NZD:'NZ$',SEK:'kr ',NOK:'kr ',DKK:'kr ',PLN:'zł',CZK:'Kč',AED:'AED ',SAR:'SAR ',BRL:'R$',MXN:'MX$',TRY:'₺'};
function normCur(c){
  const u=String(c||'').trim().toUpperCase();
  if(!u||u==='Đ'||u==='₫'||u==='VNĐ'||u==='VND')return 'VND';
  if(u==='$'||u==='US$'||u==='USD')return 'USD';
  if(u==='₽'||u==='РУБ'||u==='РУБ.'||u==='RUB'||u==='RUR')return 'RUB';
  if(u==='€'||u==='EUR')return 'EUR';
  if(u==='CHF'||u==='FR.'||u==='FR'||u==='SFR')return 'CHF';
  if(u==='£'||u==='GBP')return 'GBP';
  if(u==='¥'||u==='JPY')return 'JPY';
  if(u==='₩'||u==='KRW')return 'KRW';
  if(u==='CNY'||u==='RMB')return 'CNY';
  if(/^[A-Z]{3}$/.test(u))return u;
  return 'VND';
}
function parseRawAmt(v,cur){
  if(typeof v==='number')return Number.isFinite(v)&&v>0?v:0;
  let s=String(v||'').trim().replace(/[^0-9.,]/g,'');
  if(!s)return 0;
  if(cur==='VND')return +s.replace(/[.,]/g,'')||0;
  const lastDot=s.lastIndexOf('.'),lastCom=s.lastIndexOf(',');
  if(lastDot>=0&&lastCom>=0){
    if(lastDot>lastCom)s=s.replace(/,/g,'');
    else s=s.replace(/\./g,'').replace(',','.');
  }else if(lastCom>=0){
    const after=s.length-lastCom-1;
    s=(after===1||after===2)?s.replace(',','.'):s.replace(/,/g,'');
  }else if(lastDot>=0){
    const after=s.length-lastDot-1;
    if(after===3&&s.split('.').length>1)s=s.replace(/\./g,'');
  }
  const n=parseFloat(s);
  return Number.isFinite(n)&&n>0?n:0;
}
function fmtOrigAmt(a,cur){
  const c=normCur(cur);
  if(c==='VND')return Math.round(a).toLocaleString(lang==='en'?'en-US':'vi-VN')+(lang==='en'?' VND':' đ');
  const v=Number(a||0);
  const numStr=v.toLocaleString('en-US',{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2});
  return `${FX_SYM[c]||''}${numStr} ${c}`;
}
function extractReceiptDate(text){
  const t=String(text||'');
  // 1) YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  let m=t.match(/\b(20\d{2})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/);
  if(m){
    const cand=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    if(validDate(cand))return cand;
  }
  // 2) DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY, MM/DD/YYYY, DD.MM.YY
  for(const x of t.matchAll(/(?<!\d)(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(?!\d)/g)){
    let a=+x[1],b=+x[2],y=x[3].length===2?2000+ +x[3]:+x[3];
    if(y<2000||y>2100)continue;
    let d=a,mo=b;
    if(a<=12&&b>12){mo=a;d=b;} // MM/DD/YYYY
    if(mo>=1&&mo<=12&&d>=1&&d<=31){
      const cand=`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if(validDate(cand))return cand;
    }
  }
  // 3) English or Russian month names: e.g. "20 Nov 2026", "Nov 20, 2026", "20 ноября 2026"
  const monMap={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,'янв':1,'фев':2,'мар':3,'апр':4,'май':5,'мая':5,'июн':6,'июл':7,'авг':8,'сен':9,'окт':10,'ноя':11,'дек':12};
  const m1=t.match(/\b(\d{1,2})\s+([A-Za-zА-Яа-яёЁ]{3,10})[.,]?\s+(20\d{2})\b/i);
  if(m1){
    const key=m1[2].slice(0,3).toLowerCase(),mo=monMap[key];
    if(mo){const cand=`${m1[3]}-${String(mo).padStart(2,'0')}-${m1[1].padStart(2,'0')}`;if(validDate(cand))return cand;}
  }
  const m2=t.match(/\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(20\d{2})\b/i);
  if(m2){
    const mo=monMap[m2[1].slice(0,3).toLowerCase()];
    if(mo){const cand=`${m2[3]}-${String(mo).padStart(2,'0')}-${m2[2].padStart(2,'0')}`;if(validDate(cand))return cand;}
  }
  return '';
}
function detectReceiptCurrency(text){
  const t=String(text||'');
  if(/\bCHF\b|\bSFr\.?\b/i.test(t))return 'CHF';
  if(/₽|\bруб\.?\b|\bRUB\b/i.test(t))return 'RUB';
  if(/\$|\bUSD\b|US\$/i.test(t))return 'USD';
  if(/€|\bEUR\b/i.test(t))return 'EUR';
  if(/£|\bGBP\b/i.test(t))return 'GBP';
  if(/₩|\bKRW\b/i.test(t))return 'KRW';
  if(/\bSGD\b|\bAUD\b|\bCAD\b|\bTHB\b|\bJPY\b|\bCNY\b/i.test(t)){
    const m=t.match(/\b(SGD|AUD|CAD|THB|JPY|CNY)\b/i);
    if(m)return m[1].toUpperCase();
  }
  return 'VND';
}
function parseReceipt(text){
 const L=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const shop=(L.find(l=>/[A-Za-zÀ-ỹА-Яа-яЁё]{3,}/.test(l)&&!/hóa đơn|phiếu|receipt|invoice|чек|итого|total|purchased services|description|amount|price|qty|quantity|item|số lượng|đơn giá|thành tiền|^\d/i.test(l))||'').replace(/[^A-Za-zÀ-ỹА-Яа-яЁё0-9 .&'-]/g,'').trim().slice(0,60);
 const foundDate=extractReceiptDate(text);
 const date=foundDate||today(),dateFound=!!foundDate;
 const currency=detectReceiptCurrency(text);
 const isForeign=currency!=='VND';
 const nums=l=>{
   const raw=l.match(/\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g)||[];
   return raw.map(x=>parseRawAmt(x,currency)).filter(n=>isForeign?(n>0&&n<=1e7):(n>=1000&&n<=1e9));
 };
 const totRe=/tổng|total|thành tiền|cộng|итого|всего|сумма|amount due|grand total/i;
 const tl=L.filter(l=>totRe.test(l)).flatMap(nums);let total=tl.length?Math.max(...tl):0;
 const cat=guess(shop,'Khác'),items=[];
 const skipRe=/^(?:итого|всего|сумма|безналичными|получено|сдач|ндс|ккт|фн|фд|фп|инн|офд|смена|чек|дата|время|кассир|адрес|место расчетов|сайт фнс|торговый объект|добро пожаловать|приход|товар|полный расчет|mwst|inkl|total|subtotal|tax|vat|change|cash|card|date|time|receipt|invoice|hóa đơn|phiếu|tiền mặt|thẻ|thuế|giảm giá)/i;
 for(let i=0;i<L.length;i++){
  const l=L[i];
  if(KEYR.test(l)||totRe.test(l)||skipRe.test(l))continue;
  const m=l.match(/^(.*?[A-Za-zÀ-ỹА-Яа-яЁё]{2,}.*?)[\s:=.]+(?:\d+(?:[.,]\d+)?\s*(?:шт|x|×|\*)?\s*)?(?:CHF|Fr\.?|[$₽€£¥₩]|RUB|EUR|USD)?\s*[=:]?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:CHF|Fr\.?|đ|d|vnd|₫|usd|\$|rub|₽|руб\.?|eur|€)?$/i);
  if(m){
   const a=parseRawAmt(m[2],currency),n=m[1].replace(/^(?:\d+\s*(?:x|×|\*)\s*|[\d\s.\-*•]+)+/i,'').replace(/\s+\d+\s*(?:шт|pcs|x)$/i,'').trim();
   const minOk=isForeign?a>0:a>=1000;
   if(minOk&&(!total||a<=total*1.01)&&n.length>=2&&n!==shop){items.push({n:n.slice(0,60),a,c:guess(n,cat)});continue;}
  }
  if(/[A-Za-zÀ-ỹА-Яа-яЁё]{2,}/.test(l) && !/\d+[.,]\d{2}/.test(l) && i+1<L.length){
   const nxt=L[i+1];
   const eqMatch=nxt.match(/=\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
   const numMatch=eqMatch || nxt.match(/(?:CHF|Fr\.?|[$₽€£¥₩]|RUB|EUR|USD)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:CHF|Fr\.?|đ|d|vnd|₫|usd|\$|rub|₽|руб\.?|eur|€)?$/i);
   if(numMatch){
    const a=parseRawAmt(numMatch[1],currency),n=l.replace(/\s+\d+\s*(?:шт|pcs|x)$/i,'').replace(/^[\d\s.\-*•]+/,'').trim();
    const minOk=isForeign?a>0:a>=1000;
    if(minOk&&(!total||a<=total*1.01)&&n.length>=2&&n!==shop){items.push({n:n.slice(0,60),a,c:guess(n,cat)});i++;}
   }
  }
 }
 const itemsSum=round2(items.reduce((x,p)=>x+p.a,0));
 const itemsMismatch=!!(total&&items.length&&Math.abs(itemsSum-total)>Math.max(1,total*0.02));
 return{shop,cat,date,dateFound,currency,total,items,itemsSum,itemsMismatch,ocrUncertain:!text.trim()||!total||!items.length||itemsMismatch,empty:!text.trim()}}

async function prep(file,maxDim=1600){
  const b=await createImageBitmap(file),k=Math.min(1,maxDim/Math.max(b.width,b.height)),c=document.createElement('canvas');
  c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(b,0,0,c.width,c.height);
  return c;
}

const SCAN_CK='sw_scan_cache_v3';
let scanAiError='';
async function imgHash(b64){try{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b64));return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return ''}}
function scanCacheGet(h){if(!h)return null;try{const c=JSON.parse(localStorage.getItem(SCAN_CK)||'{}');return c[h]&&c[h].r||null}catch(e){return null}}
function scanCachePut(h,r){if(!h)return;try{const c=JSON.parse(localStorage.getItem(SCAN_CK)||'{}');c[h]={t:Date.now(),r};const k=Object.keys(c).sort((a,b)=>c[b].t-c[a].t);k.slice(20).forEach(x=>delete c[x]);localStorage.setItem(SCAN_CK,JSON.stringify(c))}catch(e){}}
async function scanWithGemini(canvas,force){
  scanAiError='';if(!sb){scanAiError='Chưa kết nối dịch vụ';return null}
  try{
    const base64=canvas.toDataURL('image/jpeg',0.9).split(',')[1];
    const hash=await imgHash(base64);
    if(!force){const hit=scanCacheGet(hash);if(hit)return Object.assign({},hit,{cached:true,hash})}
    const catList=cats.map(c=>c.n);
    const payload={imageBase64:base64,mimeType:'image/jpeg',categories:catList,today:today(),temperature:0,keepOriginalLanguage:true};
    const res=await sb.functions.invoke('scan-receipt',{body:payload});
    const{data,error}=res;
    if(error||!data||data.error){scanAiError=(data&&data.error)||error?.message||'Dịch vụ AI chưa phản hồi';console.warn('Receipt AI error:',error||data);return null;}
    const currency=normCur(data.currency);
    const validCat=c=>catList.includes(c)?c:guess(c,'Khác');
    const shop=String(data.shop||'').trim().slice(0,60);
    const cat=validCat(data.cat||guess(shop,'Khác'));
    let items=(Array.isArray(data.items)?data.items:[])
      .map(it=>({
        n:String(it.n||it.name||it.item||'').trim().replace(/^[•\-*]+\s*/,'').slice(0,60),
        a:parseRawAmt(it.a??it.amount??it.price??it.total,currency),
        c:validCat(it.c||it.category||cat)
      }))
      .filter(it=>it.n&&it.a>0);
    const total=parseRawAmt(data.total,currency);
    const rawD=String(data.date||'').trim();
    const normD=validDate(rawD)?rawD:extractReceiptDate(rawD);
    const date=normD||today();
    if(!shop&&!total&&!items.length){scanAiError='AI không đọc được nội dung hóa đơn';return null;}
    if(total>MAXV_GRP||items.some(x=>x.a>MAXV_GRP)){scanAiError='Số tiền AI trả về vượt giới hạn hợp lệ';return null;}
    let itemsMismatch=false, itemsSum=0;
    if(total&&items.length){
      itemsSum=round2(items.reduce((n,x)=>n+x.a,0));
      if(Math.abs(itemsSum-total)>Math.max(1, total*0.02)){
        // Không tự ý nhân tỷ lệ làm sai lệch giá trị từng món; giữ nguyên số tiền đọc được và gắn cờ đối soát để người dùng kiểm tra
        itemsMismatch=true;
      }
    }
    const uncertainFields=Array.isArray(data.uncertainFields)?data.uncertainFields.map(x=>String(x)):[];
    const confidence=['high','medium','low'].includes(String(data.confidence||'').toLowerCase())?String(data.confidence).toLowerCase():'low';
    const ocrUncertain=confidence!=='high'||uncertainFields.length>0||!total||!items.length;
    const out={shop,cat,date,dateFound:!!normD,currency,total,items,itemsMismatch,itemsSum,confidence,uncertainFields,ocrUncertain,ai:true};
    scanCachePut(hash,out);
    return Object.assign({},out,{hash});
  }catch(e){
    scanAiError=e?.message||'Không kết nối được dịch vụ AI';console.warn('Receipt AI error:',e);
    return null;
  }
}

function applyScanCurrency(mode, customRate){
  if(!draft)return;
  const cur=normCur(draft.currency);
  const tgt=normCur(appCur);
  if(cur===tgt){
    draft.fxMode='keep';
    draft.a=round2(draft.origTotal||0);
    ed.items=(draft.origItems||[]).map(it=>({n:it.n,c:it.c,a:round2(it.a)||0.01}));
    return form();
  }
  if(mode)draft.fxMode=mode;
  if(customRate!==undefined){
    const r=num(customRate,10000000);
    if(r>0){draft.fxRate=r;draft.customFxRate=true;}
  }
  const rate=draft.fxRate||getFxRate(cur,tgt);
  const conv=v=>draft.fxMode==='convert'?(tgt==='VND'?Math.round(v*rate):round2(v*rate)):round2(v);
  draft.a=conv(draft.origTotal||0);
  ed.items=(draft.origItems||[]).map(it=>{const val=conv(it.a);return{n:it.n,c:it.c,a:val>0?val:0.01}});
  form();
}

let lastScanFile=null;
async function doScan(file,force){if(!file)return;lastScanFile=file;
 const r=new FileReader();r.onload=()=>{$('#pv').innerHTML=`<img src="${r.result}" alt="Hóa đơn đã tải">`};r.readAsDataURL(file);
 const pg=$('#pg');$('#fm').innerHTML='<span class="mu">Đang phân tích hóa đơn…</span>';
 try{
  const canvas=await prep(file,1800);
  pg.innerHTML='<div class="mu">Đang quét hóa đơn bằng AI…</div><div class="bar"><i style="width:45%"></i></div>';
  const aiRes=await scanWithGemini(canvas,force);
  if(aiRes){
    const cur=normCur(aiRes.currency);
    pg.innerHTML='<div class="ok">✓ AI đã đọc xong hóa đơn! Kiểm tra lại thông tin bên phải.</div>'+(aiRes.cached?'<div class="mu" style="font-size:13px;margin-top:4px">Đây là kết quả đã lưu của đúng ảnh này, nên luôn giống lần quét trước. <a href="#" style="color:var(--bl)" onclick="doScan(lastScanFile,true);return false">Quét lại ảnh này</a></div>':'');
    const tgt=normCur(appCur);
    draft={s:aiRes.shop,c:aiRes.cat,d:aiRes.date,aiDate:aiRes.dateFound?aiRes.date:'',dateFound:aiRes.dateFound,currency:cur,targetCur:tgt,origTotal:aiRes.total,origItems:aiRes.items.map(x=>({...x})),itemsMismatch:!!aiRes.itemsMismatch,itemsSum:aiRes.itemsSum||0,ocrUncertain:!!aiRes.ocrUncertain,uncertainFields:aiRes.uncertainFields||[],confidence:aiRes.confidence||'low',fxMode:cur===tgt?'keep':'convert',fxRate:getFxRate(cur,tgt),a:0,ocr:{s:aiRes.shop,a:aiRes.total,d:aiRes.dateFound?aiRes.date:''}};
    if(cur===tgt){ed.items=aiRes.items.map(x=>({...x,a:round2(x.a)}));draft.a=round2(aiRes.total);form();}
    else applyScanCurrency('convert');
    return;
  }
 }catch(e){console.warn(e)}

 if(!window.Tesseract){pg.innerHTML='<div class="err">Không tải được bộ nhận dạng chữ. Kiểm tra mạng rồi tải lại trang.</div>';return}
 let w;
 try{pg.innerHTML='<div class="mu">Đang đọc chữ bằng OCR dự phòng (lần đầu có thể mất vài phút)…</div><div class="bar"><i style="width:15%"></i></div>';
  w=await Tesseract.createWorker('vie+eng+rus',1,{logger:m=>{if(m.status==='recognizing text'){const p=Math.round(m.progress*100);pg.innerHTML=`<div class="mu">Đang nhận dạng chữ… ${p}%</div><div class="bar"><i style="width:${p}%"></i></div>`}}});
  const{data}=await w.recognize(await prep(file,2000));const o=parseReceipt(data.text||'');
  const cur=normCur(o.currency);
  pg.innerHTML=o.empty?'<div class="err">Không đọc được hóa đơn. Thử ảnh khác hoặc nhập tay.</div>':'<div class="err">⚠️ AI chưa đọc được hóa đơn ('+esc(scanAiError||'không rõ nguyên nhân')+'). Kết quả dưới đây dùng OCR dự phòng và có thể sai; kiểm tra kỹ từng trường trước khi lưu.</div>';
  const tgt=normCur(appCur);
  draft={s:o.shop,c:o.cat,d:o.date,aiDate:o.dateFound?o.date:'',dateFound:o.dateFound,currency:cur,targetCur:tgt,origTotal:o.total,origItems:o.items.map(x=>({...x})),itemsMismatch:!!o.itemsMismatch,itemsSum:o.itemsSum||0,ocrUncertain:!!o.ocrUncertain,uncertainFields:o.ocrUncertain?['local_ocr_needs_manual_review']:[],confidence:'low',fxMode:cur===tgt?'keep':'convert',fxRate:getFxRate(cur,tgt),a:0,ocr:{s:o.shop,a:o.total,d:o.dateFound?o.date:''}};
  if(cur===tgt){ed.items=o.items.map(x=>({...x,a:round2(x.a)}));draft.a=round2(o.total);form();}
  else applyScanCurrency('convert');
 }catch(x){console.error(x);pg.innerHTML='<div class="err">Không đọc được hóa đơn. Thử ảnh khác hoặc nhập tay.</div>';ed.items=[];draft={s:'',c:guess('','Khác'),d:today(),dateFound:false,currency:'VND',a:0,ocr:null};form()}
 finally{if(w)w.terminate()}}
function form(){
  const cur=normCur(draft&&draft.currency);
  const tgt=normCur(appCur);
  if(draft&&draft.targetCur!==tgt){
    draft.targetCur=tgt;
    draft.fxRate=getFxRate(cur,tgt);
    if(cur===tgt){draft.fxMode='keep';draft.a=round2(draft.origTotal||0);ed.items=(draft.origItems||[]).map(it=>({n:it.n,c:it.c,a:round2(it.a)||0.01}));}
    else if(draft.fxMode==='convert'){const rate=draft.fxRate;const conv=v=>tgt==='VND'?Math.round(v*rate):round2(v*rate);draft.a=conv(draft.origTotal||0);ed.items=(draft.origItems||[]).map(it=>{const val=conv(it.a);return{n:it.n,c:it.c,a:val>0?val:0.01}});}
  }
  const isFx=cur!==tgt;
  const fxBox=isFx?`<div class="card" style="padding:10px 12px;margin:8px 0;background:var(--bg);border:1px solid var(--bl)">
    <div style="font-weight:600;font-size:13.5px;margin-bottom:6px">💱 Phát hiện ngoại tệ: <b>${cur}</b> (${fmtOrigAmt(draft.origTotal||0,cur)})</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <button type="button" class="btn ${draft.fxMode!=='keep'?'':'o'}" style="padding:6px 10px;font-size:13px" onclick="applyScanCurrency('convert')">🔄 Quy đổi sang ${curUnit(tgt)}</button>
      <button type="button" class="btn ${draft.fxMode==='keep'?'':'o'}" style="padding:6px 10px;font-size:13px" onclick="applyScanCurrency('keep')">📌 Giữ nguyên số tiền gốc (${cur})</button>
    </div>
    ${draft.fxMode!=='keep'?`<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><span class="mu" style="font-size:12.5px">Tỷ giá 1 ${cur} =</span><input class="money" style="max-width:140px;padding:5px 8px" value="${fmtN(draft.fxRate||getFxRate(cur,tgt))}" onchange="applyScanCurrency('convert',this.value)"><span class="mu" style="font-size:12.5px">${curUnit(tgt)}</span><button type="button" class="btn o" style="padding:3px 8px;font-size:11.5px" onclick="delete draft.customFxRate;syncLiveFxRates(true).then(ok=>{if(typeof flash==='function')flash(ok?(lang==='en'?'✅ Exchange rates updated!':'✅ Đã cập nhật tỷ giá mới nhất!'):(lang==='en'?'⚠️ Could not fetch live rates, using cached rate':'⚠️ Không lấy được tỷ giá trực tuyến, đang dùng tỷ giá lưu tạm'));applyScanCurrency('convert')})">${lang==='en'?'🔄 Update rate':'🔄 Cập nhật tỷ giá'}</button>${fxLiveUpdatedAt?`<span class="mu" style="font-size:11.5px">· ${lang==='en'?'Rate updated:':'Tỷ giá:'} ${esc(fxLiveUpdatedAt)}</span>`:''}</div>`:`<div class="mu" style="font-size:12.5px">Giữ nguyên giá trị số gốc từ hóa đơn (${fmtOrigAmt(draft.origTotal||0,cur)} → ${fmtN(draft.origTotal||0)}).</div>`}
  </div>`:'';
  const aiLocked=!!(draft.dateFound&&!draft.manualDateEdit);
  const dateNote=aiLocked
    ?`<span class="ok" style="font-size:12px;margin-left:6px">✓ AI tự động nhận diện từ hóa đơn (khóa sửa ngày quá khứ)</span> <a href="#" style="font-size:12px;margin-left:6px;color:var(--bl)" onclick="unlockScanDate();return false">Tự sửa ngày</a>`
    :(draft.dateFound
      ?`<span class="mu" style="font-size:12px;margin-left:6px">(Đang tự sửa: chỉ chọn từ hôm qua trong năm ${CY})</span> <a href="#" style="font-size:12px;margin-left:6px;color:var(--bl)" onclick="restoreAiScanDate();return false">Khôi phục ngày AI (${draft.aiDate})</a>`
      :`<span class="mu" style="font-size:12px;margin-left:6px">(Không thấy ngày trên ảnh, chỉ chọn từ hôm qua trong năm ${CY})</span>`);
  const dateInput=aiLocked
    ?`<input id="d" type="date" value="${draft.d}" min="${aiMinDate()}" max="${maxDate()}" readonly style="opacity:.85;cursor:not-allowed">`
    :`<input id="d" type="date" value="${draft.d}" min="${minDate()}" max="${maxDate()}">`;
  $('#fm').innerHTML=`${draft&&draft.itemsMismatch?`<div class="card" style="padding:10px 12px;margin-bottom:8px;background:rgba(245,158,11,.12);border:1.5px solid var(--am)"><div style="font-weight:700;font-size:13.5px;color:var(--am)">⚠️ Cảnh báo đối soát OCR: Tổng các món lệch so với tổng hóa đơn</div><div style="font-size:12.5px;margin-top:4px;line-height:1.45">Tổng các món đọc được là <b>${fmtOrigAmt(draft.itemsSum||0,cur)}</b>, trong khi tổng hóa đơn gốc là <b>${fmtOrigAmt(draft.origTotal||0,cur)}</b> (lệch >2%). Hệ thống giữ nguyên số gốc và không tự điều chỉnh. Vui lòng kiểm tra lại từng món, thuế, giảm giá hoặc phí ship trước khi lưu.</div><label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12.5px;font-weight:600;cursor:pointer"><input type="checkbox" id="ocrMismatchAck" ${draft.mismatchAck?'checked':''} onchange="if(draft){draft.mismatchAck=this.checked;draft.uncertaintyAck=this.checked}"> Tôi đã kiểm tra và xác nhận số liệu hóa đơn này</label></div>`:''}<div class="${ed.items.length?'ok':'err'}" style="margin-bottom:6px">${ed.items.length?`Đã nhận diện ${ed.items.length} món, danh mục được gợi ý cho từng món. Bạn có thể sửa hoặc bấm + Chi tiết để thêm món.`:'Chưa tách được món nào từ ảnh. Kiểm tra tổng tiền và bấm + Chi tiết để thêm món.'}</div>${fxBox}<label>Cửa hàng</label><input id="s" value="${esc(draft.s)}"><label>Tổng tiền (${curUnit(draft&&draft.fxMode==='keep'?cur:tgt)})</label><input id="a" class="money" inputmode="decimal"><label>Danh mục chính (dùng khi không chia món)</label><select id="c">${catOpts(draft.c)}</select><label>Ngày ${dateNote}</label>${dateInput}${edHTML()}<div id="m" style="margin:8px 0"></div><button class="btn" onclick="saveScan()">Lưu hóa đơn</button>`;sync();if(draft&&draft.ocrUncertain&&!draft.itemsMismatch){const warn=document.createElement('div');warn.className='card';warn.style.cssText='padding:10px 12px;margin-bottom:8px;background:rgba(245,158,11,.12);border:1.5px solid var(--am)';warn.innerHTML='<b style="color:var(--am)">⚠️ OCR chưa chắc chắn — cần kiểm tra trước khi lưu</b><div style="font-size:12.5px;margin-top:4px">Các trường cần chú ý: '+esc((draft.uncertainFields||[]).join(', ')||'tổng hoặc dòng hàng chưa đọc rõ')+'. Hệ thống không tự đoán giá; hãy đối chiếu ảnh gốc, sửa từng dòng nếu cần và xác nhận bên dưới.</div><label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12.5px;font-weight:600;cursor:pointer"><input type="checkbox" id="ocrMismatchAck" '+(draft.uncertaintyAck?'checked':'')+' onchange="if(draft)draft.uncertaintyAck=this.checked"> Tôi đã kiểm tra ảnh gốc và xác nhận dữ liệu</label>';$('#fm').prepend(warn)}if(!ed.items.length)$('#a').value=draft.a?fmtN(draft.a):''}
function unlockScanDate(){if(!draft)return;draft.manualDateEdit=true;if(draft.d<minDate())draft.d=today();form();}
function restoreAiScanDate(){if(!draft||!draft.aiDate)return;draft.manualDateEdit=false;draft.d=draft.aiDate;form();}
function saveScan(){if(draft&&((draft.itemsMismatch&&!draft.mismatchAck)||(draft.ocrUncertain&&!draft.uncertaintyAck))){flash('⚠️ Vui lòng đối chiếu ảnh gốc, sửa các trường cần thiết và xác nhận trước khi lưu!');const cb=$('#ocrMismatchAck');if(cb)cb.focus();return;}const isAiDate=!!(draft&&draft.dateFound&&!draft.manualDateEdit&&$('#d')&&$('#d').value===draft.aiDate);if(commit(isAiDate)){scanned++;saveProf();draft=null;location.hash='#history'}}
