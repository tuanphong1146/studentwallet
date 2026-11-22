function trFall(c){
 if(!VIC.test(c)&&!/\bđ\b|\(đ\)/.test(c))return c;
 if(trCache.has(c))return trCache.get(c);
 if(!PHR){const ph=Object.assign({},D,EXD),ks=Object.keys(ph).filter(k=>VIC.test(k)&&k.length>=2).sort((a,b)=>b.length-a.length);
  PHR={map:ph,re:new RegExp('(^|[^\\p{L}])('+ks.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}])','gu')}}
 let r=c.replace(/Tháng (\d{1,2})\b/g,(m,a)=>MN[a-1]||m).replace(/\bT(\d{1,2})\b/g,(m,a)=>MN[a-1]?MN[a-1].slice(0,3):m);
 for(let i=0;i<4;i++){const nr=r.replace(PHR.re,(m,pre,k)=>pre+PHR.map[k]);if(nr===r)break;r=nr}
 r=r.replace(/\(đ\)/g,'(VND)').replace(/(\d)\s*đ(?=$|[^\p{L}])/gu,'$1 VND');
 if(trCache.size>2000)trCache.clear();trCache.set(c,r);return r}
function tr(s){const m=s.match(/^(\s*)([\s\S]*?)(\s*)$/),c=m[2];if(!c)return s;if(c==='đ')return m[1]+'VND'+m[3];if(c==='≈ 0 đ')return m[1]+'≈ 0 VND'+m[3];if(D[c]!==undefined)return m[1]+D[c]+m[3];if(EXD[c]!==undefined)return m[1]+EXD[c]+m[3];for(const [r,f] of P){const x=c.match(r);if(x)return m[1]+f(...x)+m[3]}const y=trFall(c);return y!==c?m[1]+y+m[3]:s}
const T=s=>lang==='en'?tr(s):s;
/* alert/confirm của bank-vault.js là hộp thoại hệ thống (không nằm trong DOM) nên phải dịch tại đây */
(()=>{const a=window.alert.bind(window),c=window.confirm.bind(window);window.alert=m=>a(T(String(m)));window.confirm=m=>c(T(String(m)))})();
const LOC=()=>lang==='en'?'en-GB':'vi-VN';
const AT=['placeholder','aria-label','alt','title'];
function xl(root){if(lang!=='en'||!root)return;if(root.nodeType===1&&root.closest&&root.closest('[data-no-xl]'))return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement&&n.parentElement.closest('[data-no-xl]'))continue;const v=tr(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}
 root.querySelectorAll('[placeholder],[aria-label],[alt],[title]').forEach(e=>AT.forEach(a=>{const o=e.getAttribute(a);if(o){const v=tr(o);if(v!==o)e.setAttribute(a,v)}}))}
new MutationObserver(ms=>ms.forEach(m=>xl(m.type==='characterData'?m.target.parentElement:m.target))).observe(document.body,{childList:true,subtree:true,characterData:true});
let theme='auto';try{const st=localStorage.getItem('sw-theme');if(st==='light'||st==='dark')theme=st}catch(e){}
function applyTheme(t){theme=t;if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme')}
function setTheme(t){applyTheme(t);try{localStorage.setItem('sw-theme',t)}catch(e){}mark()}
applyTheme(theme);
const DEV_SUPPORT_EMAIL='thiendulatao2005@gmail.com';
const DEV_FEEDBACK_FORM='https://docs.google.com/forms/d/e/1FAIpQLSckgOTKyf9mEQDpPtznk08XTiev93OBEDqxGl6JHTH__ePK1Q/viewform?usp=dialog';
function getBugContext(){
  const route=(typeof cur==='function'?cur():'')||location.hash||'login';
  const userInfo=(typeof accEmail!=='undefined'&&accEmail)?accEmail:(typeof uid!=='undefined'&&uid?uid:'Chưa đăng nhập');
  const ua=navigator.userAgent||'';
  const shortUa=ua.includes('Edg/')?'Edge':ua.includes('CocCoc')?'Cốc Cốc':ua.includes('Chrome/')?'Chrome':ua.includes('Safari/')?'Safari':ua.includes('Firefox/')?'Firefox':'Browser';
  return {
    version:'v102 (sw-v102)',
    route,
    lang:typeof lang!=='undefined'?lang:'vi',
    user:userInfo,
    browser:shortUa+' · '+innerWidth+'x'+innerHeight,
    url:location.origin+location.pathname,
    time:new Date().toLocaleString('vi-VN')
  };
}
function closeBugReport(){const m=$('#bugModal');if(m)m.remove()}
function openBugReport(){
  if($('#bugModal')){$('#bugDesc')?.focus();return}
  try{menu(false)}catch(e){} try{bellMenu(false)}catch(e){} try{mbClose()}catch(e){}
  const ctx=getBugContext();
  const d=document.createElement('div');d.id='bugModal';
  d.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="bugT">
    <div class="ah"><b id="bugT">🐞 Báo lỗi / Góp ý</b><button type="button" class="ax" aria-label="Đóng" onclick="closeBugReport()">✕</button></div>
    <div class="mu" style="font-size:13px;margin-bottom:8px">Gửi nhanh qua biểu mẫu Google Form trực tuyến hoặc mở Gmail soạn sẵn thông tin kỹ thuật.</div>
    <label for="bugType">Loại phản hồi</label>
    <select id="bugType">
      <option value="Lỗi chức năng / Nút bấm">Lỗi chức năng / Nút bấm</option>
      <option value="Lỗi quét hóa đơn AI / OCR">Lỗi quét hóa đơn AI / OCR</option>
      <option value="Lỗi đăng nhập / Quên mật khẩu">Lỗi đăng nhập / Quên mật khẩu</option>
      <option value="Lỗi nhóm & Quỹ Avalanche">Lỗi nhóm & Quỹ Avalanche</option>
      <option value="Lỗi giao diện / Ngôn ngữ">Lỗi giao diện / Ngôn ngữ</option>
      <option value="Góp ý tính năng mới">Góp ý tính năng mới</option>
    </select>
    <label for="bugDesc">Mô tả chi tiết</label>
    <textarea id="bugDesc" placeholder="Bạn đang thao tác ở mục nào và gặp hiện tượng gì?"></textarea>
    <div class="ctx"><b>Thông tin đính kèm tự động:</b><br/>Phiên bản: ${esc(ctx.version)} · Trang: ${esc(ctx.route)} · Ngôn ngữ: ${esc(ctx.lang)}<br/>Tài khoản: ${esc(ctx.user)} · ${esc(ctx.browser)}</div>
    <div id="bugMsg" class="err" style="margin:6px 0"></div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
      <a class="btn" style="width:100%;text-align:center;text-decoration:none;display:block" href="${DEV_FEEDBACK_FORM}" target="_blank" rel="noopener noreferrer" onclick="onFormLinkClick()">📝 Mở Google Form góp ý (tự sao chép chi tiết)</a>
      <div style="display:flex;gap:8px">
        <button type="button" class="btn o" style="flex:1" onclick="sendBugGmail()">✉️ Gửi qua Gmail</button>
        <button type="button" class="btn o" onclick="copyBugInfo()">📋 Sao chép</button>
      </div>
    </div>
  </div>`;
  d.onclick=e=>{if(e.target===d)closeBugReport()};
  document.body.appendChild(d);
  if(typeof xl==='function')xl(d);
  $('#bugDesc')?.focus();
}
function buildBugText(){
  const tp=$('#bugType')?.value||'Báo lỗi';
  const desc=($('#bugDesc')?.value||'').trim();
  const ctx=getBugContext();
  const subj=`[Student Wallet] ${tp} (${ctx.route})`;
  const body=[
    `Loại phản hồi: ${tp}`,
    `Mô tả chi tiết:`,
    desc||'(Chưa nhập mô tả)',
    ``,
    `--- Thông tin hệ thống ---`,
    `Phiên bản: ${ctx.version}`,
    `Trang hiện tại: ${ctx.route}`,
    `Ngôn ngữ: ${ctx.lang}`,
    `Tài khoản: ${ctx.user}`,
    `Trình duyệt / Màn hình: ${ctx.browser}`,
    `Đường dẫn: ${ctx.url}`,
    `Thời gian: ${ctx.time}`
  ].join('\n');
  return {subj,body,desc};
}
function onFormLinkClick(){
  const {subj,body,desc}=buildBugText();
  const msg=$('#bugMsg');
  if(desc && navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(`${subj}\n\n${body}`).catch(()=>{});
  }
  if(msg){
    msg.className='ok';
    msg.textContent=desc
      ?(typeof T==='function'?T('Đã mở Google Form và tự động sao chép chi tiết lỗi để bạn dán vào biểu mẫu.'):'Đã mở Google Form và tự động sao chép chi tiết lỗi để bạn dán vào biểu mẫu.')
      :(typeof T==='function'?T('Đã mở Google Form góp ý trong tab mới.'):'Đã mở Google Form góp ý trong tab mới.');
  }
}
function sendBugGmail(){
  const {subj,body,desc}=buildBugText();
  const msg=$('#bugMsg');
  if(!desc){if(msg){msg.className='err';msg.textContent=typeof T==='function'?T('Vui lòng nhập mô tả ngắn trước khi gửi.'):'Vui lòng nhập mô tả ngắn trước khi gửi.'}return}
  if(msg)msg.textContent='';
  const gmailUrl=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(DEV_SUPPORT_EMAIL)}&su=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  const w=window.open(gmailUrl,'_blank','noopener,noreferrer');
  if(!w){
    window.location.href=`mailto:${encodeURIComponent(DEV_SUPPORT_EMAIL)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  }
  if(typeof toast==='function')toast('Đang mở Gmail với nội dung báo lỗi soạn sẵn...');
}
async function copyBugInfo(){
  const {subj,body}=buildBugText();
  const full=`Gửi tới: ${DEV_SUPPORT_EMAIL}\nGoogle Form: ${DEV_FEEDBACK_FORM}\nTiêu đề: ${subj}\n\n${body}`;
  const msg=$('#bugMsg');
  try{
    await navigator.clipboard.writeText(full);
    if(msg){msg.className='ok';msg.textContent=typeof T==='function'?T('Đã sao chép nội dung báo lỗi. Bạn có thể dán vào Google Form hoặc Email.'):'Đã sao chép nội dung báo lỗi. Bạn có thể dán vào Google Form hoặc Email.'}
  }catch(e){
    if(msg){msg.className='err';msg.textContent=typeof T==='function'?T('Không tự sao chép được. Hãy bôi đen và copy thủ công.'):'Không tự sao chép được. Hãy bôi đen và copy thủ công.'}
  }
}

window.openBugReport=openBugReport;
window.closeBugReport=closeBugReport;
window.onFormLinkClick=onFormLinkClick;
window.sendBugGmail=sendBugGmail;
window.copyBugInfo=copyBugInfo;


const BUD_ANCHOR_KEY=()=>'sw_bud_anchor_'+(uid||'guest');
function getBudAnchor(){
  try{
    const raw=localStorage.getItem(BUD_ANCHOR_KEY());
    return raw?JSON.parse(raw):{};
  }catch(e){return {};}
}
function setBudAnchor(map){
  try{localStorage.setItem(BUD_ANCHOR_KEY(),JSON.stringify(map||{}));}catch(e){}
}
function fxFactor(fromCur,toCur){
  const f=normCur(fromCur),t=normCur(toCur);
  if(f===t)return 1;
  const rf=FX_RATES[f]||25000,rt=FX_RATES[t]||1;
  return rf/rt;
}
function convertAmountForCur(val,fromCur,toCur){
  const v=Number(val||0);
  if(!Number.isFinite(v)||v===0)return 0;
  const f=normCur(fromCur),t=normCur(toCur);
  if(f===t)return round2(v);
  const conv=v*fxFactor(f,t);
  return t==='VND'?Math.round(conv):round2(conv);
}
function convertBudgetAmounts(oldCur,newCur){
  const oc=normCur(oldCur),nc=normCur(newCur);
  if(oc===nc)return;
  const anchor=getBudAnchor();
  cats.forEach(c=>{
    const curVal=Number(c.b||0);
    if(anchor[c.n]===undefined && curVal>0){
      anchor[c.n]={};
      anchor[c.n][oc]=curVal;
    }
    if(anchor[c.n] && typeof anchor[c.n][nc]==='number'){
      c.b=round2(anchor[c.n][nc]);
    }else{
      const nextB=convertAmountForCur(curVal,oc,nc);
      c.b=nextB;
      if(!anchor[c.n])anchor[c.n]={};
      anchor[c.n][nc]=nextB;
    }
  });
  setBudAnchor(anchor);
  if(sb&&uid){
    const budRows=cats.map(c=>({user_id:uid,category:c.n,amount:round2(c.b||0)}));
    if(budRows.length)dbx(()=>sb.from('budgets').upsert(budRows,{onConflict:'user_id,category'}));
  }
  if(Array.isArray(grpBuds)&&grpBuds.length){
    grpBuds.forEach(gb=>{
      const key='grp_'+gb.n;
      const gVal=Number(gb.b||0);
      if(anchor[key]===undefined && gVal>0){
        anchor[key]={};
        anchor[key][oc]=gVal;
      }
      if(anchor[key] && typeof anchor[key][nc]==='number'){
        gb.b=round2(anchor[key][nc]);
      }else{
        const nextGb=convertAmountForCur(gVal,oc,nc);
        gb.b=nextGb;
        if(!anchor[key])anchor[key]={};
        anchor[key][nc]=nextGb;
      }
    });
    setBudAnchor(anchor);
    if(typeof activeGroupId!=='undefined'&&activeGroupId&&typeof saveLocalGrpBud==='function'){
      saveLocalGrpBud(activeGroupId,grpBuds,grpThr);
    }
  }
}

function repairCorruptedBudgets(){
  // Khôi phục ngân sách nếu bị chia lẻ do lỗi chuyển đổi tiền tệ ở bản v66 (VD: 157.17 đ, 117.88 đ...)
  if(normCur(appCur)!=='VND')return;
  const DEF_VND={'Ăn uống':4000000,'Mua sắm':3000000,'Di chuyển':2000000,'Giải trí':1500000,'Học tập':1500000,'Khác':1000000};
  let fixedPersonal=false;
  if(Array.isArray(cats)){
    cats.forEach(c=>{
      const v=Number(c.b||0);
      if(v>0 && v<1000 && DEF_VND[c.n]){
        c.b=DEF_VND[c.n];
        fixedPersonal=true;
      }
    });
  }
  if(fixedPersonal && sb && uid){
    const rows=cats.map(c=>({user_id:uid,category:c.n,amount:round2(c.b||0)}));
    dbx(()=>sb.from('budgets').upsert(rows,{onConflict:'user_id,category'}));
  }
  // Xóa anchor bị lưu nhầm giá trị chia lẻ
  try{
    const anc=getBudAnchor();
    let changed=false;
    Object.keys(anc).forEach(k=>{
      if(anc[k] && typeof anc[k].VND==='number' && anc[k].VND>0 && anc[k].VND<1000){
        delete anc[k].VND;
        changed=true;
      }
    });
    if(changed)setBudAnchor(anc);
  }catch(e){}
  // Khôi phục ngân sách nhóm trong localStorage & group đang mở nếu bị chia lẻ (< 1000 đ)
  try{
    const fixList=(list)=>{
      let ch=false;
      (list||[]).forEach(gb=>{
        const v=Number(gb.b||0);
        if(v>0 && v<1000 && DEF_VND[gb.n]){
          gb.b=DEF_VND[gb.n];
          ch=true;
        }
      });
      return ch;
    };
    if(Array.isArray(grpBuds) && fixList(grpBuds) && activeGroupId && typeof saveLocalGrpBud==='function'){
      saveLocalGrpBud(activeGroupId,grpBuds,grpThr);
    }
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k && k.startsWith('sw_grp_bud_')){
        const obj=JSON.parse(localStorage.getItem(k)||'null');
        if(obj && Array.isArray(obj.list) && fixList(obj.list)){
          localStorage.setItem(k,JSON.stringify(obj));
        }
      }
    }
  }catch(e){}
}

async function setAppCurrency(c){
  syncLiveFxRates();
  const prevCur=normCur(appCur);
  const nc=normCur(c);
  if(prevCur!==nc){
    convertBudgetAmounts(prevCur,nc);
  }
  appCur=nc;
  try{localStorage.setItem('sw-cur',nc);if(uid)localStorage.setItem('sw-cur-'+uid,nc);}catch(e){}
  if(sb&&uid){
    try{
      const r=await sb.from('profiles').update({currency:nc}).eq('user_id',uid);
      if(r&&r.error){
        await sb.auth.updateUser({data:{currency:nc}}).catch(()=>{});
      }else{
        sb.auth.updateUser({data:{currency:nc}}).catch(()=>{});
      }
    }catch(e){
      await sb.auth.updateUser({data:{currency:nc}}).catch(()=>{});
    }
  }
  render();xl(document.body);mark();
}
function mark(){
mbInst();document.querySelectorAll('.lo[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l===lang));document.querySelectorAll('.lo[data-th]').forEach(b=>b.classList.toggle('on',b.dataset.th===theme))}
function menu(f){const m=$('#lm'),o=f===false?false:m.hidden;if(o)bellMenu(false);m.hidden=!o;$('#gear').setAttribute('aria-expanded',o);mark();if(o)fillSet()}
function fillSet(){[['ob','budget'],['oo','over'],['ow','weekly']].forEach(([a,b])=>{$('#'+a).checked=!!opts[b]})}
function fillNp(){$('#np').innerHTML='<div class="mu lh">Thông báo</div>'+(nts.length?nts.slice(0,8).map(n=>`<div class="nt"><span class="dot" style="background:var(${n.c})"></span><div><div>${esc(n.t)}</div><div class="mu" style="font-size:13px">${n.d}</div></div></div>`).join(''):'<div class="mu" style="padding:8px 10px">Chưa có thông báo nào.</div>')}
function bellMenu(f){const m=$('#np'),o=f===false?false:m.hidden;if(o)menu(false);m.hidden=!o;$('#bell').setAttribute('aria-expanded',o);if(o){fillNp();if(unread){unread=0;nav();dbx(()=>sb&&sb.from('notifications').update({read:true}).eq('read',false))}}}
function ask(msg,yes,label){const d=document.createElement('div');d.id='ask';d.innerHTML=`<div role="dialog" aria-modal="true"><p>${esc(T(msg))}</p><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn o" id="ak0">Hủy</button><button class="btn" style="background:var(--rd)" id="ak1">${esc(T(label||'Xác nhận'))}</button></div></div>`;document.body.appendChild(d);const c=()=>d.remove();$('#ak0').onclick=c;$('#ak1').onclick=()=>{c();yes()};d.onclick=e=>{if(e.target===d)c()};$('#ak1').focus()}
function setLang(l){lang=l;try{localStorage.setItem('sw-lang',l)}catch(e){}document.documentElement.lang=l;$('#root').innerHTML='';$('#lm').innerHTML=LM0;$('#gear').setAttribute('aria-label','Cài đặt');$('#bell').setAttribute('aria-label','Thông báo');$('#usr').setAttribute('aria-label','Tài khoản');$('#usr').setAttribute('title','Tài khoản');render();xl(document.body);mark();fillSet();menu(false)}
addEventListener('click',e=>{if(!e.target.closest('#gear,#lm,#bell,#np')){menu(false);bellMenu(false)}});addEventListener('keydown',e=>{if(e.key==='Escape'){menu(false);bellMenu(false);const a=$('#ask');if(a)a.remove();accClose();closeBugReport()}});
document.documentElement.lang=lang;

/* ===== TỐI ƯU ĐIỆN THOẠI ===== */
const ICO={
 home:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>',
 hist:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 pie:'<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/></svg>',
 more:'<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
 cam:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 pen:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
 rep:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10l4 4v14H5z"/><path d="M9 13h6M9 17h6M9 9h3"/></svg>',
 grp:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c3 0 4.5 2 4.5 5"/></svg>'};
$('#mbar img').src=LOGO;
function mbNav(){const on=auth&&!rec,b=$('#mnav'),h=$('#mbar');b.hidden=h.hidden=!on;$('#msh').hidden=true;if(!on)return;const k=cur();
 const t=(id,ic,lb)=>`<a href="#${id}"${k===id?' class="on" aria-current="page"':''}>${ic}<span>${lb}</span></a>`;
 b.innerHTML=t('dashboard',ICO.home,'Tổng quan')+t('history',ICO.hist,'Lịch sử')+`<button class="fab${k==='scan'||k==='expenses'?' on':''}" aria-label="Thêm khoản chi" onclick="mbAdd()"><span>${ICO.plus}</span></button>`+t('budget',ICO.pie,'Ngân sách')+`<button${k==='report'||k==='groups'?' class="on"':''} onclick="mbMore()">${ICO.more}<span>Mục khác</span></button>`}
function mbSheet(title,items){menu(false);bellMenu(false);const m=$('#msh');m.innerHTML=`<div class="row" style="align-items:center;margin-bottom:6px"><div class="mu lh" style="margin:0">${title}</div><button type="button" onclick="mbClose()" aria-label="Đóng" style="background:var(--bg);border:1px solid var(--bd);color:var(--mu);border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer">✕ Đóng</button></div>`+items.map(([ic,lb,go])=>`<button class="lo" onclick="${go}"><span style="display:flex;gap:12px;align-items:center">${ic}<span>${lb}</span></span></button>`).join('');m.hidden=false}
function mbClose(){$('#msh').hidden=true}
function mbGo(h){mbClose();location.hash=h}
function mbAdd(){mbSheet('Thêm khoản chi',[[ICO.cam,'Quét hóa đơn',"mbGo('#scan')"],[ICO.pen,'Thêm thủ công',"mbGo('#expenses')"]])}
function mbMore(){const it=[[ICO.rep,'Báo cáo',"mbGo('#report')"],[ICO.grp,'Nhóm & Chia sẻ',"mbGo('#groups')"],['🐞','Báo lỗi / Góp ý',"mbClose();openBugReport()"]];if(!$('#inst').hidden)it.push(['📲','Cài ứng dụng lên màn hình chính',"mbClose();mbInstall()"]);mbSheet('Mục khác',it)}
let mbDip=null;const mbStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const mbIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function mbInst(){const b=$('#inst');if(b)b.hidden=mbStandalone()||!(mbDip||mbIOS)}
function mbInstall(){menu(false);if(mbDip){mbDip.prompt();mbDip.userChoice.finally(()=>{mbDip=null;mbInst()})}else ask(T('Trên iPhone: mở bằng Safari, bấm nút Chia sẻ rồi chọn "Thêm vào Màn hình chính".'),()=>{},T('Đã hiểu'))}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();mbDip=e;mbInst()});
addEventListener('appinstalled',()=>{mbDip=null;mbInst()});
function mbCloseAll(){
  mbClose();
  if(typeof menu==='function')menu(false);
  if(typeof bellMenu==='function')bellMenu(false);
}
const mbSync=()=>{
  const open=innerWidth<=860&&!($('#lm').hidden&&$('#np').hidden&&$('#msh').hidden);
  document.body.classList.toggle('sheet',open);
  const bk=$('#mbk');
  if(bk)bk.hidden=!open;
};
['#lm','#np','#msh'].forEach(q=>new MutationObserver(mbSync).observe($(q),{attributes:true,attributeFilter:['hidden']}));
addEventListener('resize',mbSync);
addEventListener('pointerdown',e=>{
  if(e.target && e.target.id==='mbk'){e.preventDefault();mbCloseAll();return;}
  if(!e.target.closest('#msh,#mnav'))mbClose();
  if(!e.target.closest('#lm,#gear') && typeof menu==='function')menu(false);
  if(!e.target.closest('#np,#bell') && typeof bellMenu==='function')bellMenu(false);
},true);
addEventListener('click',e=>{
  if(e.target && e.target.id==='mbk'){mbCloseAll();return;}
  if(!e.target.closest('#msh,#mnav'))mbClose();
  if(!e.target.closest('#lm,#gear') && typeof menu==='function')menu(false);
  if(!e.target.closest('#np,#bell') && typeof bellMenu==='function')bellMenu(false);
});
addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    mbClose();
    if(typeof menu==='function')menu(false);
    if(typeof bellMenu==='function')bellMenu(false);
  }
});
const mbField='input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button]),select,textarea';let mbT;
addEventListener('focusin',e=>{if(innerWidth<=860&&e.target.matches&&e.target.matches(mbField)){clearTimeout(mbT);document.body.classList.add('kb')}});
addEventListener('focusout',()=>{clearTimeout(mbT);mbT=setTimeout(()=>{if(!(document.activeElement&&document.activeElement.matches&&document.activeElement.matches(mbField)))document.body.classList.remove('kb')},80)});
mbInst();
