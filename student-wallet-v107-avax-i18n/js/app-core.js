/* ===== TÀI KHOẢN: đổi họ tên, email, mật khẩu ===== */

function round2(n){const x=Number(n);return Number.isFinite(x)?Math.round(x*100)/100:0;}
let appCur='VND';try{const sc=localStorage.getItem('sw-cur');if(sc&&/^[A-Z]{3}$/.test(sc))appCur=sc}catch(e){}
let accEmail='',accTabK='name';
function accClose(){const d=$('#acc');if(d)d.remove()}
function accMsg(t,ok){const m=$('#accM');if(m){m.className=ok?'ok':'err';m.textContent=t}}
function accSetAvatar(src){
  if(typeof src==='string'){saveUserAvatarLocal(src,uid);}
  const effectiveSrc=(typeof src==='string'&&src)?src:(userAvatar||loadUserAvatarLocal(uid)||'');
  const el=document.querySelector('#acc .av');
  if(el)el.innerHTML=effectiveSrc?'<img alt="Ảnh đại diện" src="'+esc(effectiveSrc)+'">':esc((cleanName(userName)||accEmail||'?').trim().charAt(0).toUpperCase());
  const gEl=document.getElementById('greetAvatar');
  if(gEl)gEl.outerHTML=renderAvatarBadge(userName||'bạn',effectiveSrc,40,'border:2px solid rgba(255,255,255,0.35)',uid,'greetAvatar');
}
const COUNTRY_CUR=[
  {flag:'🇻🇳',vi:'Việt Nam',en:'Vietnam',code:'VND',name:'Đồng Việt Nam (đ)',kw:'viet nam vietnam vn vnd dong'},
  {flag:'🇺🇸',vi:'Hoa Kỳ (Mỹ)',en:'United States',code:'USD',name:'US Dollar ($)',kw:'my hoa ky usa united states us usd dollar'},
  {flag:'🇨🇭',vi:'Thụy Sĩ',en:'Switzerland',code:'CHF',name:'Swiss Franc (CHF)',kw:'thuy si switzerland swiss chf franc'},
  {flag:'🇪🇺',vi:'Liên minh Châu Âu (Đức, Pháp, Ý, Tây Ban Nha, Hà Lan...)',en:'European Union (DE, FR, IT, ES, NL...)',code:'EUR',name:'Euro (€)',kw:'chau au eu europe duc phap y tay ban nha ha lan bi ao phan lan bo dao nha hy lap eur euro'},
  {flag:'🇷🇺',vi:'Nga',en:'Russia',code:'RUB',name:'Russian Ruble (₽)',kw:'nga russia russian rub ruble'},
  {flag:'🇬🇧',vi:'Vương quốc Anh',en:'United Kingdom',code:'GBP',name:'British Pound (£)',kw:'anh vuong quoc anh uk united kingdom britain gbp pound'},
  {flag:'🇯🇵',vi:'Nhật Bản',en:'Japan',code:'JPY',name:'Japanese Yen (¥)',kw:'nhat ban japan japanese jpy yen'},
  {flag:'🇰🇷',vi:'Hàn Quốc',en:'South Korea',code:'KRW',name:'South Korean Won (₩)',kw:'han quoc korea south korea krw won'},
  {flag:'🇨🇳',vi:'Trung Quốc',en:'China',code:'CNY',name:'Chinese Yuan (¥)',kw:'trung quoc china chinese cny rmb yuan'},
  {flag:'🇸🇬',vi:'Singapore',en:'Singapore',code:'SGD',name:'Singapore Dollar (S$)',kw:'singapore sgd'},
  {flag:'🇦🇺',vi:'Úc',en:'Australia',code:'AUD',name:'Australian Dollar (A$)',kw:'uc australia australian aud'},
  {flag:'🇨🇦',vi:'Canada',en:'Canada',code:'CAD',name:'Canadian Dollar (C$)',kw:'canada canadian cad'},
  {flag:'🇹🇭',vi:'Thái Lan',en:'Thailand',code:'THB',name:'Thai Baht (฿)',kw:'thai lan thailand thb baht'},
  {flag:'🇲🇾',vi:'Malaysia',en:'Malaysia',code:'MYR',name:'Malaysian Ringgit (RM)',kw:'malaysia myr ringgit'},
  {flag:'🇮🇩',vi:'Indonesia',en:'Indonesia',code:'IDR',name:'Indonesian Rupiah (Rp)',kw:'indonesia idr rupiah'},
  {flag:'🇵🇭',vi:'Philippines',en:'Philippines',code:'PHP',name:'Philippine Peso (₱)',kw:'philippines php peso'},
  {flag:'🇹🇼',vi:'Đài Loan',en:'Taiwan',code:'TWD',name:'New Taiwan Dollar (NT$)',kw:'dai loan taiwan twd'},
  {flag:'🇭🇰',vi:'Hồng Kông',en:'Hong Kong',code:'HKD',name:'Hong Kong Dollar (HK$)',kw:'hong kong hkd'},
  {flag:'🇮🇳',vi:'Ấn Độ',en:'India',code:'INR',name:'Indian Rupee (₹)',kw:'an do india indian inr rupee'},
  {flag:'🇳🇿',vi:'New Zealand',en:'New Zealand',code:'NZD',name:'New Zealand Dollar (NZ$)',kw:'new zealand nzd'},
  {flag:'🇸🇪',vi:'Thụy Điển',en:'Sweden',code:'SEK',name:'Swedish Krona (kr)',kw:'thuy dien sweden sek krona'},
  {flag:'🇳🇴',vi:'Na Uy',en:'Norway',code:'NOK',name:'Norwegian Krone (kr)',kw:'na uy norway nok krone'},
  {flag:'🇩🇰',vi:'Đan Mạch',en:'Denmark',code:'DKK',name:'Danish Krone (kr)',kw:'dan mach denmark dkk krone'},
  {flag:'🇵🇱',vi:'Ba Lan',en:'Poland',code:'PLN',name:'Polish Złoty (zł)',kw:'ba lan poland pln zloty'},
  {flag:'🇨🇿',vi:'Cộng hòa Séc',en:'Czech Republic',code:'CZK',name:'Czech Koruna (Kč)',kw:'sec czech czk koruna'},
  {flag:'🇦🇪',vi:'UAE (Dubai)',en:'United Arab Emirates',code:'AED',name:'UAE Dirham (AED)',kw:'uae dubai aed dirham'},
  {flag:'🇸🇦',vi:'Ả Rập Xê Út',en:'Saudi Arabia',code:'SAR',name:'Saudi Riyal (SAR)',kw:'a rap xe ut saudi sar riyal'},
  {flag:'🇧🇷',vi:'Brazil',en:'Brazil',code:'BRL',name:'Brazilian Real (R$)',kw:'brazil brl real'},
  {flag:'🇲🇽',vi:'Mexico',en:'Mexico',code:'MXN',name:'Mexican Peso (MX$)',kw:'mexico mxn peso'},
  {flag:'🇹🇷',vi:'Thổ Nhĩ Kỳ',en:'Turkey',code:'TRY',name:'Turkish Lira (₺)',kw:'tho nhi ky turkey try lira'}
];
const normSearch=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
let accSelectedCur=appCur;
function renderAccCurList(q=''){
  const box=$('#accCurList');if(!box)return;
  const nq=normSearch(q).trim();
  const list=COUNTRY_CUR.filter(x=>{
    if(!nq)return true;
    const hay=normSearch(`${x.vi} ${x.en} ${x.code} ${x.name} ${x.kw}`);
    return nq.split(/\s+/).every(w=>hay.includes(w));
  });
  if(!list.length){
    box.innerHTML=`<div class="mu" style="padding:12px;text-align:center;font-size:13px">${lang==='en'?'No matching country or currency found.':'Không tìm thấy quốc gia hoặc đơn vị tiền tệ phù hợp.'}</div>`;
    return;
  }
  box.innerHTML=list.map(x=>{
    const on=x.code===accSelectedCur;
    const cname=lang==='en'?x.en:x.vi;
    return `<button type="button" onclick="pickAccCur('${x.code}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;border:0;border-bottom:1px solid var(--bd);background:${on?'rgba(79,127,232,.14)':'transparent'};color:var(--tx);cursor:pointer;text-align:left;font-size:13.5px">
      <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:7px"><span style="display:inline-block;padding:1px 6px;border-radius:5px;font-size:11px;font-weight:700;background:${on?'var(--bl)':'rgba(107,116,144,.16)'};color:${on?'#fff':'var(--tx)'};flex-shrink:0">${x.code}</span><b>${esc(cname)}</b> <span class="mu" style="font-size:12px">— ${esc(x.name)}</span></span>
      <span style="font-weight:700;color:${on?'var(--bl)':'var(--mu)'};flex-shrink:0">${on?'✓':''}</span>
    </button>`;
  }).join('');
}
function pickAccCur(code){
  accSelectedCur=normCur(code);
  renderAccCurList(($('#accCurSearch')||{}).value||'');
  const lbl=$('#accCurChosen');
  if(lbl){
    const item=COUNTRY_CUR.find(x=>x.code===accSelectedCur);
    lbl.innerHTML=item?`<b>${esc(lang==='en'?item.en:item.vi)}</b> (${item.code})`:`<b>${accSelectedCur}</b>`;
  }
}
async function accSaveCurrency(){
  const btn=$('#accGoCur');
  if(btn)btn.disabled=true;
  try{
    await setAppCurrency(accSelectedCur);
    if(uid){try{localStorage.setItem('sw_cur_onboarded_'+uid,'1')}catch(e){}}
    accMsg(lang==='en'?`Saved default currency: ${accSelectedCur}`:`Đã lưu đơn vị tiền tệ mặc định: ${accSelectedCur}`,true);
    setTimeout(()=>{if($('#acc')&&window._accOnboardingMode){window._accOnboardingMode=false;accClose()}},550);
  }catch(e){
    console.error('accSaveCurrency:',e);
    accMsg(lang==='en'?'Could not save currency. Please try again.':'Không lưu được đơn vị tiền tệ. Vui lòng thử lại.',false);
  }finally{
    if(btn)btn.disabled=false;
  }
}

function accTab(k){accTabK=k;document.querySelectorAll('#acc .at button').forEach(b=>{b.className='btn'+(b.dataset.t===k?'':' o')});document.querySelectorAll('#acc [data-p]').forEach(x=>x.hidden=x.dataset.p!==k);accMsg('',true)}
async function accLoadEmail(){
 /* getSession đọc từ bộ nhớ máy, không gọi mạng nên không bị treo; có giới hạn 3 giây cho chắc */
 try{const r=await Promise.race([sb.auth.getSession(),new Promise(res=>setTimeout(()=>res(null),3000))]);
  const u=r&&r.data&&r.data.session&&r.data.session.user;if(u&&u.email)accEmail=u.email}catch(e){console.warn(e)}
 document.querySelectorAll('#acc .accE').forEach(x=>x.textContent=accEmail)}
async function accOpen(initialTab, onboarding){
 try{
  if($('#acc')){if(initialTab)accTab(initialTab);document.querySelector('#acc input')?.focus();return}
  if(!sb){flash('Chưa kết nối dịch vụ tài khoản.');return}
  const sessionResult=await sb.auth.getSession(),session=sessionResult?.data?.session;
  if(!session){auth=false;render();flash('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.');return}
  uid=session.user.id;accEmail=session.user.email||accEmail;userName=nameFromUser(session.user)||userName;auth=true;
  window._accOnboardingMode=!!onboarding;
  accSelectedCur=appCur;
  try{menu(false)}catch(e){} try{bellMenu(false)}catch(e){} try{mbClose()}catch(e){}
  const nm=cleanName(userName)||accEmail.split('@')[0]||'?';
  const curItem=COUNTRY_CUR.find(x=>x.code===accSelectedCur);
  const curSummary=curItem?`<b>${esc(lang==='en'?curItem.en:curItem.vi)}</b> (${curItem.code})`:`<b>${accSelectedCur}</b>`;
  const d=document.createElement('div');d.id='acc';
  d.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="accT">
 <div class="ah"><b id="accT">${onboarding?'🌍 Thiết lập quốc gia & tiền tệ':'👤 Tài khoản của tôi'}</b><button class="ax" aria-label="Đóng" onclick="if(uid){try{localStorage.setItem('sw_cur_onboarded_'+uid,'1')}catch(e){}}accClose()">✕</button></div>
 ${onboarding?`<div class="ok" style="font-size:13px;margin-bottom:10px;padding:8px 10px;border-radius:8px;background:rgba(43,179,163,.12)">Chào mừng bạn! Hãy chọn quốc gia hoặc đơn vị tiền tệ chính của bạn (có thể đổi lại bất cứ lúc nào tại biểu tượng 👤 trên góc).</div>`:''}
 <div class="aw"><button type="button" class="av" aria-label="Chọn ảnh đại diện" title="Chọn ảnh đại diện" onclick="$('#accAvatarFile').click()">${esc(nm.trim().charAt(0).toUpperCase())}</button><input id="accAvatarFile" type="file" accept="image/jpeg,image/png,image/webp" hidden onchange="accSaveAvatar(this.files&&this.files[0])"><div style="min-width:0"><b data-no-xl="1" id="accN">${esc(nm)}</b><div class="mu accE" data-no-xl="1" style="font-size:13px">${esc(accEmail)}</div><button type="button" class="btn o" style="padding:3px 8px;font-size:12px" onclick="$('#accAvatarFile').click()">Đổi ảnh đại diện</button></div></div>
 <div class="at"><button class="btn" data-t="currency" onclick="accTab('currency')">Tiền tệ</button><button class="btn o" data-t="name" onclick="accTab('name')">Họ và tên</button><button class="btn o" data-t="email" onclick="accTab('email')">Email</button><button class="btn o" data-t="pw" onclick="accTab('pw')">Mật khẩu</button></div>
 <div data-p="currency">
   <div class="mu" style="font-size:13px;margin-top:6px">Đang chọn: <span id="accCurChosen">${curSummary}</span></div>
   <label for="accCurSearch">Tìm theo tên quốc gia hoặc mã tiền tệ</label>
   <input id="accCurSearch" type="search" placeholder="VD: Việt Nam, Switzerland, CHF, USD, Nhật..." oninput="renderAccCurList(this.value)" autocomplete="off">
   <div id="accCurList" style="max-height:210px;overflow-y:auto;border:1px solid var(--bd);border-radius:10px;margin-top:8px;background:var(--bg)"></div>
   <button class="btn w" id="accGoCur" onclick="accSaveCurrency()">Lưu đơn vị tiền tệ</button>
 </div>
 <div data-p="name" hidden><label for="accNm">Họ và tên mới</label><input id="accNm" value="${esc(cleanName(userName))}" maxlength="60" autocomplete="name" autocapitalize="words"><button class="btn w" id="accGo1" onclick="accSaveName()">Lưu tên</button></div>
 <div data-p="email" hidden><div class="mu" style="font-size:13px;margin-top:4px">Email hiện tại: <b class="accE" data-no-xl="1">${esc(accEmail)}</b></div><label for="accEm">Email mới</label><input id="accEm" type="email" inputmode="email" autocomplete="email" autocapitalize="none" autocorrect="off"><label for="accEp">Mật khẩu hiện tại</label><input id="accEp" type="password" autocomplete="current-password"><button class="btn w" id="accGo2" onclick="accSaveEmail()">Gửi liên kết xác nhận</button></div>
 <div data-p="pw" hidden><label for="accP0">Mật khẩu hiện tại</label><input id="accP0" type="password" autocomplete="current-password"><label for="accP1">Mật khẩu mới</label><input id="accP1" type="password" autocomplete="new-password"><label for="accP2">Nhập lại mật khẩu mới</label><input id="accP2" type="password" autocomplete="new-password"><button class="btn w" id="accGo3" onclick="accSavePw()">Đổi mật khẩu</button></div>
 <div id="accM" role="status"></div></div>`;
  document.body.appendChild(d);d.onclick=e=>{if(e.target===d){if(uid){try{localStorage.setItem('sw_cur_onboarded_'+uid,'1')}catch(e){}}accClose()}};
  renderAccCurList('');
  accTab(initialTab||accTabK||'currency');
  if(initialTab==='currency'||onboarding)setTimeout(()=>$('#accCurSearch')?.focus(),50);
  if(sb)accLoadEmail().then(async()=>{const n=$('#accN');if(n&&!cleanName(userName)){n.textContent=accEmail.split('@')[0]}try{const r=await sb.auth.getSession(),src=r.data.session.user.user_metadata.avatar_data||'';if(src)accSetAvatar(src)}catch(e){}});
 }catch(e){console.error('accOpen:',e);flash('Không mở được cửa sổ tài khoản: '+(e&&e.message||'Lỗi không xác định'))}
}
async function accVerifyPw(pw){
 if(!pw)throw {message:'need-pw'};
 if(!accEmail)await accLoadEmail();
 const{error}=await sb.auth.signInWithPassword({email:accEmail,password:pw});
 if(error)throw {message:'invalid login'};
}
const accErr=x=>{const m=(x&&x.message||'').toLowerCase();return m==='need-pw'?'Nhập mật khẩu hiện tại.':m.includes('invalid login')?'Mật khẩu hiện tại không đúng.':authMsg(x)};
async function accSaveName(){
 const v=cleanName($('#accNm').value).replace(/\s+/g,' ');if(v.length<2)return accMsg('Nhập họ và tên.');
 const b=$('#accGo1');b.disabled=true;
 try{
  const{error}=await sb.auth.updateUser({data:{full_name:v}});if(error)throw error;
  const r=await sb.from('user_profiles').update({full_name:v}).eq('id',uid).select('id').maybeSingle();if(r.error)throw r.error;
  if(!r.data)throw new Error('Không tìm thấy hồ sơ user_profiles để cập nhật.');
  const r2=await sb.from('profiles').update({full_name:v}).eq('user_id',uid);if(r2.error)console.warn('Không đồng bộ profiles:',r2.error);
  userName=v;const n=$('#accN');if(n)n.textContent=v;accSetAvatar('');
  try{if(typeof loadGroups==='function'){await loadGroups()}}catch(e){console.warn(e)}
  render();accMsg('Đã cập nhật họ và tên.',true);
 }catch(x){console.error(x);accMsg(accErr(x))}
 b.disabled=false}
async function accSaveAvatar(file){if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type))return accMsg('Chọn ảnh JPG, PNG hoặc WebP.');if(file.size>8*1024*1024)return accMsg('Ảnh tối đa 8 MB.');const b=document.querySelector('#accAvatarFile');try{accMsg('Đang xử lý ảnh…',true);const img=new Image(),url=URL.createObjectURL(file);await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url});const c=document.createElement('canvas'),scale=Math.min(1,256/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);const data=c.toDataURL('image/jpeg',.78);saveUserAvatarLocal(data,uid);if(sb){const{error}=await sb.auth.updateUser({data:{avatar_data:data}});if(error)throw error;}accSetAvatar(data);if(typeof render==='function')render();accMsg('Đã lưu ảnh đại diện.',true)}catch(e){console.error(e);accMsg(authMsg(e)||'Không lưu được ảnh đại diện.')}finally{if(b)b.value=''}}
async function accSaveEmail(){
 const v=$('#accEm').value.trim(),p=$('#accEp').value;
 if(!/^\S+@\S+\.\S+$/.test(v))return accMsg('Email chưa đúng định dạng.');
 if(v.toLowerCase()===accEmail.toLowerCase())return accMsg('Email mới phải khác email hiện tại.');
 const b=$('#accGo2');b.disabled=true;
 try{await accVerifyPw(p);const{error}=await sb.auth.updateUser({email:v},{emailRedirectTo:location.origin+location.pathname});if(error)throw error;
  $('#accEp').value='';accMsg('Đã gửi liên kết xác nhận tới email mới (và có thể cả email cũ). Hãy mở liên kết để hoàn tất đổi email.',true)
 }catch(x){console.error(x);accMsg(accErr(x))}
 b.disabled=false}
async function accSavePw(){
 const p0=$('#accP0').value,p1=$('#accP1').value,p2=$('#accP2').value;
 if(!p0)return accMsg('Nhập mật khẩu hiện tại.');
 if(p1.length<6)return accMsg('Mật khẩu mới cần ít nhất 6 ký tự.');
 if(p1!==p2)return accMsg('Hai mật khẩu không khớp.');
 if(p1===p0)return accMsg('Mật khẩu mới phải khác mật khẩu cũ.');
 const b=$('#accGo3');b.disabled=true;
 try{await accVerifyPw(p0);const{error}=await sb.auth.updateUser({password:p1});if(error)throw error;
  ['#accP0','#accP1','#accP2'].forEach(q=>$(q).value='');accMsg('Đã đổi mật khẩu.',true)
 }catch(x){console.error(x);accMsg(accErr(x))}
 b.disabled=false}
const LOGO="data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#1a2456"/><path d="M55.5 41 C54.5 39 55 37.5 56 36.2 L56.8 35.2 C56.1 34.4 56.3 33.4 57.5 32.8 L59.4 31.8 C60 27.5 64 24.5 69.2 25 C75.2 25.6 79.5 30.8 78.8 37.2 C78.2 42.2 74.5 45.8 69.5 47.4 C67.2 48.2 66.2 49.5 66.8 52.5 L59.2 47.2 C59 45.2 58 44.2 56.5 43 C55.6 42.3 55.6 41.5 55.5 41 Z" fill="#ffffff"/><circle cx="63.2" cy="32.6" r="1.4" fill="#1a2456"/><g transform="translate(46.5, 51) rotate(-51) translate(-46.5, -51)"><rect x="33" y="25" width="27" height="52" rx="4" fill="#ffffff"/><rect x="36.2" y="28.2" width="20.6" height="45.6" rx="2.2" fill="none" stroke="#1a2456" stroke-width="1.6" stroke-dasharray="3.2 2.4"/><circle cx="46.5" cy="34.5" r="2.6" fill="#1a2456"/></g></svg>`);
const $=s=>document.querySelector(s);
const LM0=$('#lm').innerHTML,MAXV=10000000000,MAXV_GRP=50000000000;

const curUnit=c=>{const u=normCur(c||appCur);return u==='VND'?(lang==='en'?'VND':'đ'):u};
function num(v,lim=MAXV){
  if(typeof v==='number')return Number.isFinite(v)?Math.min(lim,Math.max(0,round2(v))):0;
  let s=String(v??'').trim();
  if(!s)return 0;
  const hasComma=s.includes(','),hasDot=s.includes('.');
  if(hasComma&&hasDot){
    if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(/,/g,'');
  }else if(hasComma){
    const after=s.length-s.lastIndexOf(',')-1;
    s=(after>=1&&after<=2)?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  }else if(hasDot){
    const partsDot=s.split('.');
    const after=partsDot[partsDot.length-1].length;
    if(partsDot.length>2||(after===3&&partsDot[0].length>=1&&partsDot[0]!=='0'))s=s.replace(/\./g,'');
  }
  s=s.replace(/[^0-9.]/g,'');
  const n=parseFloat(s);
  return Number.isFinite(n)?Math.min(lim,Math.max(0,round2(n))):0;
}
function fmtN(n){
  const v=round2(n);
  if(!Number.isFinite(v))return '0';
  const hasDec=Math.abs(v%1)>1e-6;
  const fixed=hasDec?v.toFixed(2):String(Math.round(v));
  const [ip,dp]=fixed.split('.');
  const intFmt=ip.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  return hasDec?`${intFmt},${dp}`:intFmt;
}
function fmtInput(el){
  const lim=el.dataset&&el.dataset.grp?MAXV_GRP:MAXV;
  const raw=String(el.value||'');
  const pos=el.selectionStart||0;
  const before=raw.slice(0,pos).replace(/[^0-9,]/g,'').length;
  let clean=raw.replace(/[^0-9.,]/g,'');
  const lastCom=clean.lastIndexOf(','),lastDot=clean.lastIndexOf('.');
  let decSepIdx=-1;
  if(lastCom>=0&&(clean.length-lastCom-1)<=2)decSepIdx=lastCom;
  else if(lastDot>=0&&clean.split('.').length===2&&(clean.length-lastDot-1)<=2&&clean.length-lastDot-1>0)decSepIdx=lastDot;
  else if(lastDot>=0&&clean.endsWith('.')&&clean.split('.').length===2)decSepIdx=lastDot;
  let intPart='',decPart='',hasDec=false;
  if(decSepIdx>=0){
    hasDec=true;
    intPart=clean.slice(0,decSepIdx).replace(/\D/g,'');
    decPart=clean.slice(decSepIdx+1).replace(/\D/g,'').slice(0,2);
  }else{
    intPart=clean.replace(/\D/g,'');
  }
  intPart=intPart.replace(/^0+(?=\d)/,'')||'0';
  if(+intPart>lim){intPart=String(lim);decPart='';hasDec=false;}
  const intFmt=intPart.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  const out=hasDec?`${intFmt},${decPart}`:intFmt;
  el.value=out;
  let c=0,i=0;
  for(;i<out.length&&c<before;i++)if(/[0-9,]/.test(out[i]))c++;
  try{el.setSelectionRange(i,i)}catch(e){}
}
document.addEventListener('input',e=>{if(e.target.classList&&e.target.classList.contains('money'))fmtInput(e.target)});
const CFG=!!window.SUPABASE_URL&&!/YOUR-PROJECT/.test(window.SUPABASE_URL);
const sb=CFG&&window.supabase?window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{flowType:'pkce',detectSessionInUrl:true,autoRefreshToken:true,persistSession:true}}):null;
const noSb=()=>CFG?'Không thể tải thư viện đăng nhập. Kiểm tra mạng rồi tải lại trang.':'Chưa cấu hình Supabase. Mở config.js và điền URL và khóa.';
let fT;
function detectFlashKind(raw){
  const s=String(raw||'').trim();
  if(/^⏳|Đang\s+(kết nối|kiểm tra|tải|quét|xử lý)/i.test(s))return 'info';
  if(/^(✅|✓)|Đã\s+(lưu|tạo|tham gia|thêm|xóa|rời|cập nhật|cấp quyền|chuyển|xác nhận|sao chép|điền|đồng bộ|kết nối|niêm phong|gửi yêu cầu|góp quỹ)|thành công/i.test(s))return 'ok';
  if(/chỉ có quyền xem|hết lượt sửa|chuyển trạng thái:\s*Chưa chi|Cần giữ ít nhất|thiếu cột|vượt quá|không hợp lệ/i.test(s))return 'warn';
  if(/^(❌|⚠️)|Không\s+(lưu|kết nối|mở|thể|đọc|tìm)|Chưa\s+(kết nối|lưu|cấu hình)|Lỗi|thất bại|hết hạn/i.test(s))return 'err';
  return 'info';
}
function flash(t,kind){
  const f=$('#fl');if(!f)return;
  const k=kind||detectFlashKind(t);
  f.className=k;
  f.textContent=T(t);
  f.hidden=false;
  clearTimeout(fT);
  fT=setTimeout(()=>f.hidden=true,5000);
}
async function dbx(p){try{const q=typeof p==='function'?p():p;if(!q)return null;const r=await q;if(r&&r.error)throw r.error;return r&&r.data!==undefined?r.data:true}catch(e){console.error('Supabase error:',e);const msg=(e&&e.message)||'';flash('Không lưu được lên máy chủ'+(msg?': '+msg:'. Kiểm tra mạng và thử lại.'));return null}}
async function syncAllBudgets(){
  if(!sb||!uid)return;
  const rows=cats.map(c=>({user_id:uid,category:c.n,amount:c.b}));
  const r=await sb.from('budgets').upsert(rows,{onConflict:'user_id,category'});
  if(r.error){
    console.error(r.error);
    flash('Không lưu được lên máy chủ. Kiểm tra mạng và thử lại.');
  }
}
async function saveBudgetDb(category,amount){
  try{
    const anchor=getBudAnchor();
    anchor[category]={[normCur(appCur)]:round2(amount||0)};
    setBudAnchor(anchor);
  }catch(e){}
  if(!sb||!uid)return;
  try{
    const up=await sb.from('budgets').upsert({user_id:uid,category,amount},{onConflict:'user_id,category'});
    if(up.error)throw up.error;
  }catch(e){
    console.error(e);
    flash('Không lưu được lên máy chủ. Kiểm tra mạng và thử lại.');
  }
}
async function delBudgetDb(category){
  if(!sb||!uid)return;
  try{
    const d=await sb.from('budgets').delete().eq('user_id',uid).eq('category',category);
    if(d.error)throw d.error;
  }catch(e){
    console.error(e);
    flash('Không lưu được lên máy chủ. Kiểm tra mạng và thử lại.');
  }
}
function vndToCur(vndAmt, curCode){
  const c=normCur(curCode||appCur);
  const val=Number(vndAmt||0);
  if(!Number.isFinite(val)||val===0)return 0;
  return convertAmountForCur(val,'VND',c);
}
function fmtCur(n,curCode){
  const c=normCur(curCode||appCur);
  const v=round2(n);
  const hasDec=Math.abs(v%1)>1e-6;
  if(c==='VND'){
    const s=v.toLocaleString(lang==='en'?'en-US':'vi-VN',{minimumFractionDigits:hasDec?2:0,maximumFractionDigits:2});
    return lang==='en'?s+' VND':s+' đ';
  }
  const s=v.toLocaleString('en-US',{minimumFractionDigits:hasDec?2:0,maximumFractionDigits:2});
  return `${FX_SYM[c]||''}${s} ${c}`;
}
function fmtVnd(vndAmt,curCode){
  const c=normCur(curCode||appCur);
  return fmtCur(vndToCur(vndAmt,c),c);
}
function fmt(n,curCode){
  return fmtCur(n,curCode);
}
const cats=[{n:'Ăn uống',b:4000000,c:'#2479db',k:'winmart coop highlands cơm phở trà cafe kfc bách hóa lotte'},
{n:'Mua sắm',b:3000000,c:'#7924db',k:'shopee uniqlo lazada tiki'},
{n:'Di chuyển',b:2000000,c:'#24dbc3',k:'grab be xăng petrolimex taxi'},
{n:'Giải trí',b:1500000,c:'#db7924',k:'cgv netflix spotify game'},
{n:'Học tập',b:1500000,c:'#db2a24',k:'sách nhà sách photo học phí'},
{n:'Tiền nhà',b:3000000,c:'#8d6e63',k:'tiền nhà thuê trọ phòng trọ điện nước internet'},
{n:'Khác',b:1000000,c:'#78909c',k:''}];
ensureUniqueCategoryColors(cats);
const ex=[];
let scanned=0,thr=80,auth=false,uid=null,opts={budget:true,weekly:true,over:true},nts=[],unread=0,draft=null,userName="";
const LEGACY_NAME="Triệu Nguyên Tuấn Phong";
const cleanName=s=>{const v=String(s||"").trim();return(!v||v===LEGACY_NAME)?"":v};
const nameFromUser=u=>cleanName(u&&u.user_metadata&&(u.user_metadata.full_name||u.user_metadata.name))||((u&&u.email)||"").split("@")[0]||"";
let userAvatar="";
const getAvatarStorageKey=id=>'sw_avatar_'+(id||uid||'guest');
function loadUserAvatarLocal(id){
  try{const v=localStorage.getItem(getAvatarStorageKey(id))||'';if(v)userAvatar=v;return v;}catch(e){return '';}
}
function saveUserAvatarLocal(src,id){
  userAvatar=src||'';
  try{
    const k=getAvatarStorageKey(id);
    if(userAvatar)localStorage.setItem(k,userAvatar);
    else localStorage.removeItem(k);
  }catch(e){}
}
function renderAvatarBadge(name,src,size=32,extraStyle='',memberUid='',domId=''){
  const resolvedSrc=src||((memberUid&&memberUid===uid)?(userAvatar||loadUserAvatarLocal(uid)):(!memberUid?(userAvatar||loadUserAvatarLocal(uid)):''))||'';
  const label=(cleanName(name)||name||'?').trim().charAt(0).toUpperCase()||'?';
  const idAttr=domId?` id="${esc(domId)}"`:'';
  const base=`width:${size}px;height:${size}px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.max(11,Math.round(size*0.42))}px;flex-shrink:0;overflow:hidden;background:linear-gradient(135deg,#4f7fe8,#6c5ce7);color:#fff;${extraStyle}`;
  if(resolvedSrc){
    return `<span${idAttr} style="${base}"><img src="${esc(resolvedSrc)}" alt="${esc(name||'Avatar')}" style="width:100%;height:100%;object-fit:cover;display:block"></span>`;
  }
  return `<span${idAttr} style="${base}">${esc(label)}</span>`;
}
let userCode='',userWallet='',myGroups=[],activeGroupId=null,grpTab='overview',grpEx=[],grpBuds=[],grpThr=80,grpHf={q:'',c:''},grpOp=new Set(),grpBAdd=false,grpDraft=null,grpEdItems=[],grpEditId=null;
let busyLock={};
const genCode=(p)=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const arr=new Uint8Array(6);crypto.getRandomValues(arr);return p+'-'+Array.from(arr,x=>chars[x%chars.length]).join('');};
const copyTxt=(t)=>{navigator.clipboard?.writeText(t);flash('Đã sao chép mã: '+t)};
async function saveWallet(){
  if(window.savePersonalBankAccount) return window.savePersonalBankAccount();
}
const safeDb=async(fn)=>{try{if(sb)await fn()}catch(e){console.warn(e)}};
let hf={q:'',c:''},op=new Set(),ed={items:[],disc:0,discType:'amt'},ei=null,bAdd=false;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const parts=e=>{const its=e.items||[],r=e.a-its.reduce((s,p)=>s+p.a,0);return its.length?(r>0?[...its,{n:'Các khoản khác',c:e.c,a:r}]:its):[{n:e.s,c:e.c,a:e.a}]};
const NOW=new Date(),CM=NOW.getMonth()+1,CY=NOW.getFullYear();
const mAdd=k=>{const d=new Date(CY,CM-1+k,1),m=d.getMonth()+1,y=d.getFullYear();return{m,y,key:y+'-'+String(m).padStart(2,'0')}};
const fmtDate=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>fmtDate(new Date());
const aiMinDate=()=>'2000-01-01';
const minDate=()=>{const d=new Date();d.setDate(d.getDate()-1);const y=fmtDate(d),y0=CY+'-01-01';return y<y0?y0:y};
const maxDate=()=>CY+'-12-31';
const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||''))&&d>=aiMinDate()&&d<=maxDate();
const inM=(e,k)=>e.d.startsWith(k);
const spentIn=(n,k)=>ex.filter(e=>inM(e,k)).reduce((s,e)=>s+parts(e).filter(p=>p.c===n).reduce((x,p)=>x+p.a,0),0);
const monthTotal=k=>ex.filter(e=>inM(e,k)).reduce((s,e)=>s+e.a,0);
const spent=n=>spentIn(n,mAdd(0).key);
const DEFB=Object.fromEntries(cats.map(c=>[c.n,c.b])),META=Object.fromEntries(cats.map(c=>[c.n,{c:c.c,k:c.k}])),DORD=Object.keys(META);
const PAL=(()=>{
  /* Bảng màu theo phổ: mỗi cột 1 sắc (đỏ→cam→vàng→lục→lam→xanh→tím→hồng), 3 hàng đậm-nhạt, hàng cuối là màu trung tính */
  const hsl=(h,s,l)=>{s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')};
  const H=[2,28,48,130,172,212,268,330];
  return [].concat(
    [[72,50],[70,35],[78,72]].flatMap(([s,l])=>H.map(h=>hsl(h,s,l))),
    ['#6b7280','#9ca3af','#d1d5db','#8d6e63','#a1887f','#78909c','#90a4ae','#b0bec5']);
})(),hash=x=>[...String(x||'')].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7);
function pickFixedColor(name, excludeColors=new Set()){
  const normN=String(name||'').trim().toLowerCase();
  if(META[name]&&META[name].c&&!excludeColors.has(META[name].c.toLowerCase()))return META[name].c;
  const startIdx=hash(normN)%PAL.length;
  for(let step=0;step<PAL.length;step++){
    const col=PAL[(startIdx+step)%PAL.length];
    if(!excludeColors.has(col.toLowerCase()))return col;
  }
  return PAL[startIdx];
}
function ensureUniqueCategoryColors(list){
  const used=new Set();
  list.forEach(item=>{
    const curC=String(item.c||'').trim().toLowerCase();
    if(curC && !used.has(curC)){
      used.add(curC);
    }else{
      const chosen=pickFixedColor(item.n, used);
      item.c=chosen;
      used.add(chosen.toLowerCase());
    }
  });
}
const mkCat=(n,b)=>{
  const used=new Set((typeof cats!=='undefined'?cats:[]).map(x=>String(x.c||'').toLowerCase()).filter(Boolean));
  const c=pickFixedColor(n,used);
  return META[n]?{n,b,c,k:META[n].k}:{n,b,c,k:n.toLowerCase()};
};

/* ===== BẢNG MÀU NGÂN SÁCH (gọn, xếp theo sắc độ) ===== */
const BUDPAL=[...PAL];
const BUDCOL_KEY=()=>'sw_bud_colors_'+(uid||'guest');
function getBudColors(){try{return JSON.parse(localStorage.getItem(BUDCOL_KEY())||'{}')||{}}catch(e){return{}}}
function setBudColors(m){try{localStorage.setItem(BUDCOL_KEY(),JSON.stringify(m||{}))}catch(e){}}
function applyBudColors(list){
  const saved=getBudColors(),used=new Set();
  list.forEach(x=>{const c=String(saved[x.n]||'').toLowerCase();if(PAL.includes(c)&&!used.has(c)){x.c=c;x._s=1;used.add(c)}});
  list.forEach(x=>{if(x._s){delete x._s;return}const cu=String(x.c||'').toLowerCase();
    if(cu&&!used.has(cu))used.add(cu);else{const ch=pickFixedColor(x.n,used);x.c=ch;used.add(ch.toLowerCase())}});
}
let bNewCol='',budPick=-1;
const budUsedCols=(skip)=>new Set(cats.filter((x,k)=>k!==skip).map(x=>String(x.c||'').toLowerCase()));
function budNewCol(){const used=budUsedCols(-1),s=String(bNewCol||'').toLowerCase();if(s&&!used.has(s))return s;return BUDPAL.find(c=>!used.has(c))||pickFixedColor('x',used)}
function palHTML(sel,used,fn,id){
  const s=String(sel||'').toLowerCase();
  return `<div class="pal"${id?` id="${id}"`:''} role="group" aria-label="Chọn màu">`+BUDPAL.map(c=>{const on=c===s,u=!on&&used.has(c);
    return `<button type="button" class="pc${on?' on':''}${u?' used':''}" data-c="${c}" style="--c:${c}" aria-pressed="${on}" aria-label="${c}"${u?' disabled title="Màu đã dùng cho ngân sách khác"':` onclick="${fn}'${c}')"`}></button>`}).join('')+`</div>`;
}
function pickNewCol(col){bNewCol=col;document.querySelectorAll('#bpalNew .pc').forEach(b=>{const on=b.dataset.c===col;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});const p=$('#bnPrev');if(p)p.style.background=col}
function setBudCol(i,col){const c=cats[i];if(!c)return;col=String(col).toLowerCase();
  if(budUsedCols(i).has(col))return flash('Màu này đang được dùng cho ngân sách khác.');
  c.c=col;const m=getBudColors();m[c.n]=col;setBudColors(m);budPick=-1;render()}

/* ===== SẮP XẾP THỨ TỰ NGÂN SÁCH (kéo thả + lên đầu / xuống cuối) ===== */
const BUDICO={
 grip:'<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>',
 top:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14"/><path d="M12 20V8"/><path d="m6 13 6-6 6 6"/></svg>',
 bot:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20h14"/><path d="M12 4v12"/><path d="m6 11 6 6 6-6"/></svg>'};
const BUDORD_KEY=()=>'sw_bud_order_'+(uid||'guest');
function getBudOrder(){try{const a=JSON.parse(localStorage.getItem(BUDORD_KEY())||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function setBudOrder(a){try{localStorage.setItem(BUDORD_KEY(),JSON.stringify(a||[]))}catch(e){}}
function applyBudOrder(list){
  const o=getBudOrder();if(!o.length)return;
  const idx=n=>{const k=o.indexOf(n);return k<0?1e6:k};
  const sorted=list.map((x,i)=>[x,i]).sort((a,b)=>idx(a[0].n)-idx(b[0].n)||a[1]-b[1]).map(a=>a[0]);
  list.splice(0,list.length,...sorted);
}
function moveBud(from,to){
  if(from===to||from<0||to<0||from>=cats.length||to>=cats.length)return;
  const [c]=cats.splice(from,1);cats.splice(to,0,c);
  setBudOrder(cats.map(x=>x.n));budPick=-1;render();
}
function budDragStart(e,i){
  if(e.button!==undefined&&e.button!==0)return;
  const handle=e.currentTarget,list=handle.closest('[data-bl]');if(!list)return;
  const rows=[...list.querySelectorAll(':scope > .bri')],row=rows[i];if(!row)return;
  e.preventDefault();
  try{handle.setPointerCapture(e.pointerId)}catch(_){}
  const y0=e.clientY,sy0=scrollY,sc0=list.scrollTop,h=row.offsetHeight;
  const mid=rows.map(r=>{const b=r.getBoundingClientRect();return b.top+scrollY+list.scrollTop+b.height/2});
  let target=i,lastY=e.clientY,timer=null;
  row.classList.add('drag');document.body.style.userSelect='none';
  const upd=()=>{
    const dy=(lastY+scrollY+list.scrollTop)-(y0+sy0+sc0),c=mid[i]+dy;
    row.style.transform=`translateY(${dy}px)`;
    let t=0;mid.forEach((m,j)=>{if(j!==i&&m<c)t++});
    target=t;
    rows.forEach((r,j)=>{if(j===i)return;let sh=0;if(i<t&&j>i&&j<=t)sh=-h;else if(i>t&&j<i&&j>=t)sh=h;r.style.transform=sh?`translateY(${sh}px)`:''});
  };
  const move=ev=>{
    lastY=ev.clientY;upd();clearInterval(timer);timer=null;
    const lr=list.getBoundingClientRect(),inner=list.scrollHeight>list.clientHeight+2;
    const lo=inner?Math.max(lr.top,0):0,hi=inner?Math.min(lr.bottom,innerHeight):innerHeight;
    if(lastY<lo+50||lastY>hi-50)timer=setInterval(()=>{const up=lastY<lo+50;if(inner)list.scrollTop+=up?-12:12;else scrollBy(0,up?-14:14);upd()},16);
  };
  const end=ev=>{
    clearInterval(timer);
    handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);
    document.body.style.userSelect='';
    rows.forEach(r=>{r.style.transform='';r.classList.remove('drag')});
    if(ev.type!=='pointercancel'&&target!==i)moveBud(i,target);
  };
  handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
}
const catTags=e=>[...new Set(parts(e).map(p=>p.c))].map(tag).join(' ');
const total=()=>monthTotal(mAdd(0).key);
const WC=['#c3d0f3','#a2b6ea','#7f9be0','#5a7fd6','#2f5fd0'];
const fs=n=>n>=1e6?(Math.round(n/1e5)/10)+'tr':n>=1e3?Math.round(n/1e3)+'k':String(n);
const trend=()=>{const k=Array.from({length:12},(_,i)=>mAdd(i-11));return bars(k.map(x=>monthTotal(x.key)),k.map(x=>'T'+x.m))};
const bud=()=>cats.reduce((s,c)=>s+c.b,0);
const pct=c=>c.b>0?spent(c.n)/c.b*100:(spent(c.n)>0?101:0);
const cc=n=>(cats.find(c=>c.n===n)||{}).c||'#888';
const tag=n=>`<span class="tag" style="background:${cc(n)}">${esc(n)}</span>`;
const bars=(v,l)=>{const m=Math.max(...v,1),n=v.length,W=760,step=(W-40)/n,bw=Math.min(40,step*0.62);return `<svg viewBox="0 0 ${W} 215" width="100%" role="img" aria-label="Biểu đồ chi tiêu 12 tháng">${v.map((x,i)=>{const h=x/m*150,cx=20+i*step+step/2;return `<rect x="${cx-bw/2}" y="${175-h}" width="${bw}" height="${h}" rx="3" fill="var(--bl)" opacity="${i==n-1?1:.62}"/><text x="${cx}" y="196" text-anchor="middle" font-size="12" fill="var(--mu)">${l[i]}</text><text x="${cx}" y="${168-h}" text-anchor="middle" font-size="10.5" fill="var(--mu)">${x>0?(x/1e6).toFixed(1)+'tr':'0'}</text>`}).join('')}</svg>`};
const pb=c=>{const p=pct(c),k=p>100?'x':p>=thr?'w':'';return `<div class="row"><span>${c.n} <b>${Math.round(p)}%</b></span><span class="mu">${fmtVnd(spent(c.n))} / ${fmt(c.b)}</span></div><div class="bar"><i class="${k}" style="width:${Math.min(p,100)}%"></i></div>${p>100?'<div class="err" style="margin-top:-8px;margin-bottom:10px">Đã vượt ngân sách!</div>':''}`};
const catOpts=sel=>(sel&&!cats.some(c=>c.n===sel)?`<option value="${esc(sel)}" selected>${esc(sel)}</option>`:'')+cats.map(c=>`<option value="${esc(c.n)}" ${c.n===sel?'selected':''}>${esc(c.n)}</option>`).join('');
const trows=l=>l.map(e=>`<tr><td>${e.d.split('-').reverse().join('/')}</td><td>${e.s}</td><td>${catTags(e)}</td><td class="r">${fmtVnd(e.a)}</td></tr>`).join('');
const sorted=()=>ex.map((e,idx)=>({e,idx})).sort((a,b)=>b.e.d.localeCompare(a.e.d) || (b.e.ts||0)-(a.e.ts||0) || b.idx-a.idx).map(x=>x.e);
const fmtPct=p=>p>9999?'>9.999%':Math.round(p).toLocaleString('vi-VN')+'%';
function alertCheck(c){const catObj=cats.find(x=>x.n===c);if(!catObj)return;const p=pct(catObj);
 if(p>100&&opts.over)push(catObj.b>0?`${c} đã vượt ngân sách (${fmtPct(p)})`:`${c} đã vượt ngân sách (ngân sách 0 đ)`,'--rd');
 else if(p>=thr&&p<=100&&opts.budget)push(`${c} đã dùng ${fmtPct(p)} ngân sách`,'--am')}
function push(t,c){nts.unshift({t,d:new Date().toLocaleDateString(LOC()),c});unread++;nav();dbx(()=>sb&&sb.from('notifications').insert({message:t,color:c}))}

let dashChartMode = localStorage.getItem('sw_dash_chart_mode') || 'budget'; // 'budget' | 'share'
let dashChartSort = localStorage.getItem('sw_dash_chart_sort') || 'custom'; // 'custom' | 'spent_desc' | 'pct_desc' | 'spent_asc'
function setDashChartMode(m){
  dashChartMode = m;
  try{ localStorage.setItem('sw_dash_chart_mode', m); }catch(e){}
  render();
}
function setDashChartSort(s){
  dashChartSort = s;
  try{ localStorage.setItem('sw_dash_chart_sort', s); }catch(e){}
  render();
}
function sortChartData(list, sortKey){
  const arr = [...list];
  if(sortKey === 'spent_desc') return arr.sort((a,b) => (b.v||0) - (a.v||0));
  if(sortKey === 'spent_asc') return arr.sort((a,b) => (a.v||0) - (b.v||0));
  if(sortKey === 'pct_asc'){
    const pct = x => (x.b > 0) ? (x.v / x.b) : (x.v > 0 ? 1.01 : 0);
    return arr.sort((a,b) => pct(a) - pct(b));
  }
  if(sortKey === 'pct_desc'){
    const pct = x => (x.b > 0) ? (x.v / x.b) : (x.v > 0 ? 1.01 : 0);
    return arr.sort((a,b) => pct(b) - pct(a));
  }
  return arr;
}
function chartControlsHTML(showModeToggle=true){
  const isEn = lang === 'en';
  const modeBtns = showModeToggle ? `
    <div style="display:inline-flex;border:1px solid var(--bd);border-radius:8px;overflow:hidden;background:var(--bg)">
      <button type="button" class="${dashChartMode==='budget'?'btn':'btn o'}" style="border:0;border-radius:0;padding:5px 10px;font-size:12.5px" onclick="setDashChartMode('budget')">${isEn?'% Budget used':'% Ngân sách'}</button>
      <button type="button" class="${dashChartMode==='share'?'btn':'btn o'}" style="border:0;border-radius:0;padding:5px 10px;font-size:12.5px" onclick="setDashChartMode('share')">${isEn?'% Spending share':'% Tỷ trọng chi'}</button>
    </div>` : '';
  const sortSel = `
    <select aria-label="${isEn?'Sort categories':'Sắp xếp danh mục'}" onchange="setDashChartSort(this.value)" style="width:auto;min-width:195px;padding:6px 10px;font-size:13px;border-radius:10px;background:var(--in);color:var(--tx);border:1px solid var(--bd);margin:0">
      <option value="custom" ${dashChartSort==='custom'?'selected':''}>${isEn?'Custom (my order)':'Tùy chỉnh (thứ tự của tôi)'}</option>
      <option value="pct_desc" ${dashChartSort==='pct_desc'?'selected':''}>${isEn?'% Used (high → low)':'% Đã dùng (cao → thấp)'}</option>
      <option value="pct_asc" ${dashChartSort==='pct_asc'?'selected':''}>${isEn?'% Used (low → high)':'% Đã dùng (thấp → cao)'}</option>
      <option value="spent_desc" ${dashChartSort==='spent_desc'?'selected':''}>${isEn?'Spent (high → low)':'Đã chi (cao → thấp)'}</option>
      <option value="spent_asc" ${dashChartSort==='spent_asc'?'selected':''}>${isEn?'Spent (low → high)':'Đã chi (thấp → cao)'}</option>
    </select>`;
  return `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${modeBtns}${sortSel}</div>`;
}

function donutChart(customData, showBudget=false, sortKey='custom'){
  const baseData = customData || cats.map(c => ({ n: c.n, v: spent(c.n), b: c.b, c: c.c }));
  const data = sortChartData(baseData, sortKey);
  const totalSpent = data.reduce((s, d) => s + d.v, 0);
  const R = 75;
  const C = 2 * Math.PI * R;
  let offset = 0;

  const segs = data.filter(a => a.v > 0).map(a => {
    const ratio = totalSpent ? a.v / totalSpent : 0;
    const length = ratio * C;
    const seg = `<circle cx="110" cy="110" r="${R}" fill="none" stroke="${a.c||cc(a.n)}" stroke-width="32" stroke-dasharray="${length} ${C - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 110 110)"><title>${esc(a.n)}: ${fmtVnd(a.v)} (${Math.round(ratio*100)}%)</title></circle>`;
    offset += length;
    return seg;
  }).join('');

  const legend = data.map(a => {
    const ratio = totalSpent ? a.v / totalSpent : 0;
    const budPct = (showBudget && a.b > 0) ? Math.round(a.v / a.b * 100) : (showBudget && a.v > 0 ? 101 : 0);
    const over = showBudget && a.b > 0 && a.v > a.b;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bd);font-size:14px;gap:14px;">
      <span style="display:flex;align-items:center;gap:8px;min-width:115px;"><i class="swc" style="background:${a.c||cc(a.n)};width:13px;height:13px;border-radius:4px;display:inline-block;flex-shrink:0;"></i><span>${esc(a.n)}${over?' <b class="err">(Vượt!)</b>':''}</span></span>
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;flex:1;flex-wrap:wrap;">
        <span style="font-weight:600;text-align:right;">${fmtVnd(a.v)}${showBudget&&a.b!==undefined?` <span class="mu" style="font-weight:400">/ ${fmt(a.b)}</span>`:''}</span>
        <span class="mu" style="min-width:38px;text-align:right;">${showBudget&&a.b!==undefined?budPct+'%':Math.round(ratio*100)+'%'}</span>
      </div>
    </div>`;
  }).join('');

  return `<div style="display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap;padding:6px 0;">
    <svg viewBox="0 0 220 220" width="205" height="205" role="img" aria-label="Biểu đồ tròn chi tiêu theo danh mục" style="flex-shrink:0;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.12));">
      <circle cx="110" cy="110" r="${R}" fill="none" style="stroke:var(--bd)" stroke-width="32" opacity="0.4"/>
      ${segs}
      <text x="110" y="102" text-anchor="middle" font-size="13" fill="var(--mu)" font-weight="500">Tổng chi</text>
      <text x="110" y="124" text-anchor="middle" font-size="16" font-weight="700" fill="var(--tx)">${fs(totalSpent)}</text>
    </svg>
    <div class="lg-scroll" style="flex:1;min-width:260px;${data.length>5?'max-height:205px;overflow-y:auto;padding-right:8px;':''}">${legend}</div>
  </div>`;
}

function toast(t){const m=$('#m');if(m){m.className='ok';m.textContent=T(t)}}
function err(t){const m=$('#m');if(m){m.className='err';m.textContent=T(t)}}
function addEx(){if(commit())location.hash='#history'}
function guess(name,def='Ăn uống'){const s=name.toLowerCase(),X={'Mua sắm':'quần áo áo quần giày nồi chảo chén dĩa túi','Ăn uống':'rau thịt cá trứng gạo nước sữa bánh trái cây'};
 for(const c of cats)if(c.k.split(/\s+/).concat((X[c.n]||'').split(' ')).some(k=>k&&s.includes(k)))return c.n;return cats.some(c=>c.n===def)?def:(cats[0]||{n:def}).n}
function calcDiscAmt(sub, val, type){
  const s=Math.max(0,round2(sub||0));
  const v=Math.max(0,Number(val||0));
  if(!s||!v)return 0;
  if(type==='pct'){
    const pct=Math.min(100,v);
    return round2(s*pct/100);
  }
  return Math.min(s,round2(v));
}
function setDiscVal(v){
  const raw=String(v??'').trim().replace(/,/g,'.');
  const n=parseFloat(raw.replace(/[^0-9.]/g,''));
  ed.disc=Number.isFinite(n)&&n>0?Math.min(ed.discType==='pct'?100:MAXV,n):0;
  sync();
}
function setDiscType(t){
  ed.discType=(t==='pct')?'pct':'amt';
  if(ed.discType==='pct'&&ed.disc>100)ed.disc=100;
  sync();
}
const itRows=()=>ed.items.map((p,i)=>`<div class="ir"><input placeholder="Tên món (VD: Rau)" aria-label="Tên món" value="${esc(p.n)}" onchange="ed.items[${i}].n=this.value;ed.items[${i}].c=guess(this.value,ed.items[${i}].c);drawIt()"><input class="money" inputmode="decimal" aria-label="Số tiền" placeholder="Số tiền" value="${p.a?fmtN(p.a):''}" oninput="ed.items[${i}].a=num(this.value);sync()"><select aria-label="Danh mục" onchange="ed.items[${i}].c=this.value">${catOpts(p.c)}</select><button class="btn o" onclick="rmIt(${i})" aria-label="Xóa món">✕</button></div>`).join('');
const discHTML=()=>`<div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--bd)">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
    <span style="font-size:13px;font-weight:600">🏷️ Chiết khấu / Giảm giá</span>
    <div style="display:flex;gap:6px">
      <button type="button" class="btn ${(ed.discType||'amt')==='amt'?'':'o'}" style="padding:4px 10px;font-size:12px" onclick="setDiscType('amt')">Số tiền (${curUnit()})</button>
      <button type="button" class="btn ${ed.discType==='pct'?'':'o'}" style="padding:4px 10px;font-size:12px" onclick="setDiscType('pct')">Phần trăm (%)</button>
    </div>
  </div>
  <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
    <input id="edDiscIn" class="money" inputmode="decimal" placeholder="${ed.discType==='pct'?'VD: 10 (%)':'VD: 5'}" value="${ed.disc?fmtN(ed.disc):''}" oninput="setDiscVal(this.value)" style="max-width:150px;padding:6px 10px">
    <span id="edDiscSummary" class="mu" style="font-size:12.5px"></span>
  </div>
</div>`;
const edHTML=()=>`<label>Chi tiết từng món (tùy chọn)</label><div id="it" style="max-height:270px;overflow-y:auto;padding-right:6px;margin-bottom:8px">${itRows()}</div><button class="btn o" onclick="addIt()">+ Chi tiết</button>${discHTML()}`;
function drawIt(){
  const it=$('#it');if(it)it.innerHTML=itRows();
  const cnt=$('#itCnt');if(cnt)cnt.textContent=ed.items.length;
  const sp=$('#persSplit');if(sp)sp.classList.toggle('has-items',ed.items.length>0);
  const cd=$('#expCard');if(cd)cd.style.maxWidth=ed.items.length?'1080px':'560px';
  sync();
}
function addIt(){ed.items.push({n:'',a:0,c:($('#c')||{}).value||'Ăn uống'});drawIt()}
function rmIt(i){ed.items.splice(i,1);drawIt()}
function sync(){
  const a=$('#a');
  const sub=round2(ed.items.reduce((s,p)=>s+(p.a||0),0));
  const base=ed.items.length?sub:num(a&&a.value);
  const discAmt=calcDiscAmt(base,ed.disc||0,ed.discType||'amt');
  const finalAmt=round2(Math.max(0,base-discAmt));
  const sumEl=$('#edDiscSummary');
  if(sumEl){
    if(discAmt>0){
      const pctTxt=ed.discType==='pct'?` (${ed.disc}%)`:'';
      sumEl.innerHTML=`Giảm <b style="color:var(--gr)">-${fmtN(discAmt)}</b>${pctTxt} • Tạm tính: ${fmtN(base)} → Còn: <b>${fmtN(finalAmt)}</b>`;
    }else{
      sumEl.textContent='Không áp dụng chiết khấu';
    }
  }
  if(!a)return;
  if(ed.items.length){a.value=fmtN(finalAmt);a.readOnly=true}
  else{a.readOnly=false;if(discAmt>0&&base>0)a.dataset.netAfterDisc=String(finalAmt)}
}
function commit(allowAiPastDate){const s=$('#s').value.trim(),d=$('#d').value;const floor=allowAiPastDate?aiMinDate():minDate();if(!d)return err('Chọn ngày chi tiêu.');if(d<floor)return err('Không thể chọn ngày từ 2 ngày trước trở về trước (chỉ cho phép từ hôm qua trong năm '+CY+').');if(d>maxDate())return err('Chỉ được chọn ngày trong năm '+CY+'.');if(!s)return err('Nhập tên cửa hàng hoặc nội dung.');
 let a=num($('#a').value),c=$('#c').value,its=null;
 if(ed.items.length){
  if(ed.items.some(p=>!p.n.trim()||!(p.a>0)))return err('Mỗi món cần có tên và số tiền lớn hơn 0.');
  const rawSub=round2(ed.items.reduce((x,p)=>x+p.a,0));
  const discAmt=calcDiscAmt(rawSub,ed.disc||0,ed.discType||'amt');
  const ratio=rawSub>0?Math.max(0,(rawSub-discAmt)/rawSub):1;
  its=ed.items.map((p,idx)=>{
    const adj=discAmt>0?(idx===ed.items.length-1?round2(Math.max(0.01,(rawSub-discAmt)-ed.items.slice(0,-1).reduce((s,q,j)=>s+round2(q.a*ratio),0))):round2(p.a*ratio)):round2(p.a);
    return {...p,n:p.n.trim(),a:adj>0?adj:0.01};
  });
  a=round2(its.reduce((x,p)=>x+p.a,0));
  const m={};its.forEach(p=>m[p.c]=(m[p.c]||0)+p.a);c=Object.keys(m).sort((x,y)=>m[y]-m[x])[0];
 }else{
  const discAmt=calcDiscAmt(a,ed.disc||0,ed.discType||'amt');
  if(discAmt>0)a=round2(Math.max(0,a-discAmt));
 }
 if(!(a>0))return err('Nhập số tiền lớn hơn 0.');if(a>MAXV)return err('Số tiền tối đa là 10.000.000.000 đ.');
 const scanCur=(draft&&draft.fxMode==='keep')?normCur(draft.currency):normCur(appCur);const e={d,s,c,a,cur:scanCur,edits:0,ts:Date.now()};if(its)e.items=its;ex.unshift(e);op=new Set([0,...[...op].map(i=>i+1)]);if(inM(e,mAdd(0).key))new Set(parts(e).map(p=>p.c)).forEach(alertCheck);persist(e);return true}
function histList(){const l=sorted().filter(e=>(!hf.c||parts(e).some(p=>p.c===hf.c))&&(!hf.q||(e.s+' '+parts(e).map(p=>p.n).join(' ')).toLowerCase().includes(hf.q.toLowerCase())));
 const sum=l.reduce((s,e)=>s+(hf.c?parts(e).filter(p=>p.c===hf.c).reduce((x,p)=>x+p.a,0):e.a),0);
 return `<div class="row" style="margin-bottom:10px"><span class="mu">${l.length} hóa đơn</span><b>Tổng: ${fmtVnd(sum)}</b></div>`+(l.length?l.map(e=>{const i=ex.indexOf(e),o=op.has(i);
 return `<div class="card" style="padding:0;margin-bottom:10px"><button class="hh" onclick="tg(${i})" aria-expanded="${o}"><span>${o?'▾':'▸'}</span><span class="mu">${e.d.split('-').reverse().join('/')}</span><b>${esc(e.s)}</b><span>${catTags(e)}</span><span class="mu">${(e.items||[]).length?e.items.length+' món':'chưa chi tiết'}</span><b>${fmt(e.a,e.cur)}</b></button>${o?det(e,i):''}</div>`}).join(''):'<div class="mu">Không có hóa đơn nào khớp bộ lọc.</div>')}
function det(e,i){const its=e.items||[],rem=e.a-its.reduce((s,p)=>s+p.a,0),n=e.edits||0;
 const top=ei===i?`<div class="card" style="background:var(--bg);margin-bottom:12px"><label>Tên cửa hàng / nội dung</label><input id="es${i}" value="${esc(e.s)}"><label>Ngày</label><input id="ed${i}" type="date" value="${e.d}" min="${minDate()}" max="${maxDate()}"><label>Tổng tiền (${curUnit(e.cur)})</label><input id="ea${i}" class="money" inputmode="decimal" value="${fmtN(e.a)}"><label>Danh mục chính</label><select id="ec${i}">${catOpts(e.c)}</select>${its.length?`<label class="sw2" style="margin:10px 0 0"><input type="checkbox" id="esync${i}" checked> Áp dụng danh mục này cho tất cả ${its.length} món bên trong</label>`:''}<div class="mu" style="margin-top:8px">Bạn chỉ được sửa tối đa 3 lần cho mỗi hóa đơn.</div><div id="em${i}" class="err" style="margin:6px 0"></div><button class="btn" onclick="saveEd(${i})">Lưu thay đổi</button> <button class="btn o" onclick="ei=null;hist()">Hủy</button></div>`
 :`<div class="row" style="align-items:center;margin-bottom:10px"><span class="mu">Đã sửa ${n}/3 lần</span>${n<3?`<button class="btn o" onclick="ei=${i};hist()">Sửa (còn ${3-n} lần)</button>`:'<span class="mu">Hết lượt sửa (3/3)</span>'}</div>`;
 return `<div style="padding:0 18px 16px">${top}<div class="scroll"><table><tr><th>Tên món</th><th>Danh mục</th><th class="r">Số tiền</th><th></th></tr>${its.map((p,j)=>`<tr><td>${esc(p.n)}</td><td><select aria-label="Danh mục món" style="padding:4px 8px;width:auto" onchange="updDetCat(${i},${j},this.value)">${catOpts(p.c)}</select></td><td class="r">${fmtVnd(p.a)}</td><td><button class="btn o" style="padding:2px 10px" onclick="delDet(${i},${j})" aria-label="Xóa món">✕</button></td></tr>`).join('')}${rem>0?`<tr><td class="mu">Các khoản khác (chưa chi tiết)</td><td>${tag(e.c)}</td><td class="r">${fmtVnd(rem)}</td><td></td></tr>`:''}</table></div>
 <label>Thêm món vào hóa đơn này${rem>0?` (còn ${fmtVnd(rem)} chưa chi tiết)`:''}</label><div class="ir"><input id="dn${i}" aria-label="Tên món" placeholder="Tên món"><input id="da${i}" class="money" inputmode="decimal" aria-label="Số tiền" placeholder="Số tiền"><select id="dc${i}" aria-label="Danh mục">${catOpts(e.c)}</select><button class="btn" onclick="addDet(${i})">+ Chi tiết</button></div><div id="dm${i}" class="err"></div>
 ${n<3?`<button class="btn o" style="margin-top:8px" onclick="delEx(${i})">Xóa hóa đơn</button><span class="mu" style="margin-left:8px;font-size:13px">Xóa tính là 1 lần sửa</span>`:`<div class="mu" style="margin-top:8px">Đã hết lượt sửa nên không thể xóa hóa đơn này.</div>`}</div>`}
function updDetCat(i,j,newCat){const e=ex[i],it=e.items[j];if(!it||it.c===newCat)return;it.c=newCat;if(inM(e,mAdd(0).key))alertCheck(newCat);hist();(async()=>{await it._p;if(it.id)dbx(()=>sb&&sb.from('expense_items').update({category:newCat}).eq('id',it.id))})()}
function saveEd(i){const e=ex[i],m=$('#em'+i),s=$('#es'+i).value.trim(),d=$('#ed'+i).value,a=num($('#ea'+i).value),c=$('#ec'+i).value,syncItems=$('#esync'+i)&&$('#esync'+i).checked,sum=(e.items||[]).reduce((x,p)=>x+p.a,0);
 if(!s){if(m)m.textContent='Nhập tên cửa hàng hoặc nội dung.';return;}if(!d){if(m)m.textContent='Chọn ngày chi tiêu.';return;}if(d<minDate())return m.textContent='Không thể chọn ngày từ 2 ngày trước trở về trước (chỉ cho phép từ hôm qua trong năm '+CY+').';if(d>maxDate())return m.textContent='Chỉ được chọn ngày trong năm '+CY+'.';if(!(a>0)){if(m)m.textContent='Nhập số tiền lớn hơn 0.';return;}
 if(a<sum){if(m)m.textContent='Số tiền không được nhỏ hơn tổng các món đã chi tiết ('+fmtVnd(sum)+').';return;}
 if(s===e.s&&d===e.d&&a===e.a&&c===e.c&&!syncItems){ei=null;return hist()}
 if((e.edits||0)>=3)return m.textContent='Hóa đơn này đã hết lượt sửa.';
 const prev={s:e.s,d:e.d,a:e.a,c:e.c,edits:e.edits||0,items:(e.items||[]).map(it=>it.c)};
 e.s=s;e.d=d;e.a=a;e.c=c;e.edits=prev.edits+1;
 if(syncItems&&e.items&&e.items.length)e.items.forEach(it=>it.c=c);
 ei=null;if(inM(e,mAdd(0).key))alertCheck(c);hist();
 (async()=>{await e._p;if(e.id&&sb){
  let ok=await dbx(()=>sb.from('expenses').update({shop:s,spent_on:d,category:c,amount:a,edit_count:e.edits}).eq('id',e.id).select());
  if(!ok){
   ok=await dbx(()=>sb.from('expenses').update({shop:s,spent_on:d,category:c,amount:a}).eq('id',e.id).select());
  }
  if(!ok){
   e.s=prev.s;e.d=prev.d;e.a=prev.a;e.c=prev.c;e.edits=prev.edits;
   if(e.items)e.items.forEach((it,idx)=>{if(prev.items[idx])it.c=prev.items[idx]});
   if($('#hl'))hist();else render();
   return;
  }
  if(syncItems&&e.items&&e.items.length)await dbx(()=>sb.from('expense_items').update({category:c}).eq('expense_id',e.id));
 }})()}
function hist(){$('#hl').innerHTML=histList()}
function tg(i){op.has(i)?op.delete(i):op.add(i);hist()}
function addDet(i){const e=ex[i],rem=e.a-(e.items||[]).reduce((s,p)=>s+p.a,0),n=$('#dn'+i).value.trim(),a=num($('#da'+i).value);let c=$('#dc'+i).value;
 const m=$('#dm'+i);if(!n){if(m)m.textContent='Nhập tên món.';return;}if(!(a>0)){if(m)m.textContent='Nhập số tiền lớn hơn 0.';return;}if(a>rem){if(m)m.textContent=`Số tiền vượt phần còn lại của hóa đơn (${fmtVnd(rem)}).`;return;}
 if(c===e.c)c=guess(n,c);const it={n,c,a};(e.items=e.items||[]).push(it);if(inM(e,mAdd(0).key))alertCheck(c);hist();persistItem(e,it)}
function delDet(i,j){const it=ex[i].items.splice(j,1)[0];hist();(async()=>{await it._p;if(it.id)dbx(()=>sb&&sb.from('expense_items').delete().eq('id',it.id))})()}

function delEx(i){
  const e0 = ex[i];
  if (!e0 || (e0.edits || 0) >= 3) return;
  ask(T('Xóa hóa đơn này? Việc xóa tính là 1 lần sửa.'), () => {
    const k = ex.indexOf(e0);
    if (k < 0) return;
    const prevEdits = e0.edits || 0;
    e0.edits = prevEdits + 1;
    ex.splice(k, 1);
    op = new Set();
    ei = null;
    hist();
    (async () => {
      await e0._p;
      if (e0.id && sb) {
        const res = await dbx(()=>sb.from('expenses').delete().eq('id', e0.id).select());
        if (!res) {
          e0.edits = prevEdits;
          ex.splice(Math.min(k, ex.length), 0, e0);
          if ($('#hl')) hist(); else render();
        }
      }
    })();
  }, T('Xóa'));
}

const SAMP={'WinMart':[['Rau củ',85000,'Ăn uống'],['Thịt heo',120000,'Ăn uống'],['Nồi chảo',280000,'Mua sắm']],'Uniqlo':[['Áo thun',390000,'Mua sắm'],['Quần jeans',590000,'Mua sắm']],'Highlands Coffee':[['Cà phê',65000,'Ăn uống'],['Bánh ngọt',55000,'Ăn uống']],'Grab':[['Chuyến xe',48000,'Di chuyển']],'CGV Vincom':[['Vé xem phim',190000,'Giải trí'],['Bắp nước',85000,'Giải trí']]};
const norm=s=>(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const NUMR=/\d{1,3}(?:[.,]\d{3})+|\d{4,}/g,KEYR=/tổng|thành tiền|thanh toán|cộng|total|amount due|tiền mặt|khách đưa|trả lại|vat|thuế/i,TOTR=/tổng|thành tiền|thanh toán|total|amount due|cộng/i,toN=x=>+x.replace(/[.,]/g,'');
function nav(){mbNav();const bb=$('#bb');if(bb){bb.hidden=!unread;bb.textContent=unread}const el=$('#nv');if(el)el.innerHTML=NAV.map(([k,t])=>`<a href="#${k}" class="${cur()===k?'on':''}">${t}${k==='notifications'&&unread?`<span class="bd">${unread}</span>`:''}</a>`).join('')}
const cur=()=>(location.hash.slice(1)||'dashboard');
function loginView(){$('#root').innerHTML=`<div id="login"><div class="card"><div class="brand" style="color:var(--tx)"><img src="${LOGO}" alt="Logo">Student Wallet</div>
<div class="tabs"><button class="btn" id="t1" onclick="tab(0)">Đăng nhập</button><button class="btn o" id="t2" onclick="tab(1)">Đăng ký</button></div>
<div id="nm" hidden><label>Họ và tên</label><input id="n" placeholder="Nguyễn Văn A" autocomplete="name" autocapitalize="words" enterkeyhint="next"></div><label>Email sinh viên</label><input id="e" type="email" placeholder="ten@student.edu.vn" autocomplete="email" inputmode="email" autocapitalize="none" autocorrect="off" enterkeyhint="next"><div id="pw"><label>Mật khẩu</label><input id="p" type="password" autocomplete="current-password" enterkeyhint="go"></div>
<div id="m" class="err" style="margin:8px 0"></div><button class="btn" style="width:100%" id="go" onclick="login()">Đăng nhập</button>
<div id="otpBox" hidden></div>
<div style="text-align:center;margin-top:14px"><a href="#" id="fg" style="color:var(--bl)" onclick="tab(window.md===2?0:2);return false">Quên mật khẩu?</a></div>
<div style="text-align:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--bd)"><a href="#" style="color:var(--mu);font-size:12.5px" onclick="openBugReport();return false">🐞 Báo lỗi / Góp ý cho nhà phát triển</a></div></div></div>`;window.md=0;
 if(!sb)err(noSb());else if(/error_code=|error=access_denied/.test(location.hash+location.search)){tab(2);err('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy gửi lại liên kết mới.');try{history.replaceState(null,'',location.pathname)}catch(e){}}}
function tab(r){window.md=r;$('#nm').hidden=r!==1;$('#pw').hidden=r===2;$('#t1').className='btn'+(r===0?'':' o');$('#t2').className='btn'+(r===1?'':' o');$('#fg').textContent=r===2?'Quay lại đăng nhập':'Quên mật khẩu?';$('#go').textContent=['Đăng nhập','Tạo tài khoản','Gửi liên kết đặt lại mật khẩu'][r];$('#otpBox').hidden=true;$('#m').textContent=''}
function cancelReset(){try{localStorage.removeItem('sw_pw_recovery')}catch(e){}rec=false;history.replaceState(null,'',location.pathname);logout()}
function resetView(){$('#root').innerHTML=`<div id="login"><div class="card"><div class="brand" style="color:var(--tx)"><img src="${LOGO}" alt="Logo">Student Wallet</div><h2>Đặt mật khẩu mới</h2>
<div class="mu" style="font-size:13px;margin-bottom:8px">Nhập mật khẩu mới cho tài khoản của bạn.</div>
<label>Mật khẩu mới</label><input id="p1" type="password" autocomplete="new-password"><label>Nhập lại mật khẩu mới</label><input id="p2" type="password" autocomplete="new-password"><div id="m" class="err" style="margin:8px 0"></div><button class="btn" style="width:100%" id="go" onclick="setPw()">Đổi mật khẩu</button>
<div style="text-align:center;margin-top:14px"><a href="#" style="color:var(--bl)" onclick="cancelReset();return false">Hủy và quay lại đăng nhập</a></div></div></div>`}
async function setPw(){const a=$('#p1').value,b=$('#p2').value;if(a.length<6)return err('Mật khẩu cần ít nhất 6 ký tự.');if(a!==b)return err('Hai mật khẩu không khớp.');if(!sb)return err(noSb());const g=$('#go');g.disabled=true;
 try{const{data:before}=await sb.auth.getSession();if(!before.session)throw new Error('Liên kết đặt lại chưa được xác nhận hoặc đã hết hạn. Hãy mở liên kết trong email trên cùng trình duyệt đã yêu cầu.');const{error}=await sb.auth.updateUser({password:a});if(error)throw error;try{localStorage.removeItem('sw_pw_recovery')}catch(e){}await sb.auth.signOut();rec=false;auth=false;history.replaceState(null,'',location.pathname);err('Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.');render();$('#m').textContent='Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.'}
 catch(x){console.error(x);g.disabled=false;err(authMsg(x))}}
/* Địa chỉ quay lại sau khi bấm liên kết trong email. Phải nằm trong Supabase > Authentication > URL Configuration > Redirect URLs. */
const appUrl=()=>location.origin+location.pathname.replace(/index\.html$/,'')+'?reset=1';
const getRecFlag=()=>{try{return localStorage.getItem('sw_pw_recovery')==='1'}catch(e){return false}};
const setRecFlag=(v)=>{try{if(v)localStorage.setItem('sw_pw_recovery','1');else localStorage.removeItem('sw_pw_recovery')}catch(e){}};
const hasRecoveryMarker=()=>/type=recovery|reset=1/.test(location.hash+' '+location.search)||getRecFlag();
let rec=hasRecoveryMarker(),booted=false,otpFlow=false;
if(sb)sb.auth.onAuthStateChange((ev,session)=>{if((ev==='PASSWORD_RECOVERY'||(ev==='SIGNED_IN'&&hasRecoveryMarker()))&&!otpFlow){setRecFlag(true);rec=true;if(booted)render()}else if(ev==='SIGNED_OUT'){setRecFlag(false);rec=false}});
/* Cách dự phòng khi liên kết bị lỗi (trình quét email có thể mở liên kết trước người dùng và làm nó hết hạn): đặt lại bằng mã trong email */
async function resetByCode(){
 const e=$('#e').value.trim(),c=$('#otp').value.replace(/\D/g,''),a=$('#np1').value;
 if(!/^\S+@\S+\.\S+$/.test(e))return err('Email chưa đúng định dạng.');
 if(c.length<6)return err('Nhập mã xác nhận trong email.');
 if(a.length<6)return err('Mật khẩu cần ít nhất 6 ký tự.');
 const b=$('#go2');b.disabled=true;otpFlow=true;
 try{
  const v=await sb.auth.verifyOtp({email:e,token:c,type:'recovery'});if(v.error)throw v.error;
  const u=await sb.auth.updateUser({password:a});if(u.error)throw u.error;
  const{data:{session}}=await sb.auth.getSession();uid=session.user.id;userName=nameFromUser(session.user);await loadAll();rec=false;auth=true;location.hash='#dashboard';render();
 }catch(x){console.error(x);const m=(x&&x.message||'').toLowerCase();err(m.includes('expired')||m.includes('invalid')?'Mã không đúng hoặc đã hết hạn. Hãy gửi lại.':authMsg(x));b.disabled=false}
 finally{otpFlow=false}}
const authMsg=x=>{if(x&&x.message&&/[\u00C0-\u1EF9]/.test(x.message))return x.message;const m=(x&&x.message||'').toLowerCase();return m.includes('invalid login')?'Email hoặc mật khẩu không đúng.':m.includes('already')?'Email này đã được đăng ký.':m.includes('not confirmed')?'Email chưa được xác nhận. Kiểm tra hộp thư của bạn.':m.includes('different')?'Mật khẩu mới phải khác mật khẩu cũ.':m.includes('fetch')||m.includes('network')?'Không thể kết nối. Kiểm tra mạng và thử lại.':m.includes('rate')?'Thử quá nhiều lần. Hãy đợi một lúc rồi thử lại.':'Đã có lỗi xảy ra. Thử lại sau.'};
async function login(){const e=$('#e').value.trim(),md=window.md|0;if(!/^\S+@\S+\.\S+$/.test(e))return err('Email chưa đúng định dạng.');if(!sb)return err(noSb());const b=$('#go');
 if(md===2){b.disabled=true;try{setRecFlag(true);const{error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:appUrl()});if(error)throw error;toast('Đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra hộp thư (kể cả thư rác) và bấm vào liên kết trong email.')}catch(x){setRecFlag(false);console.error(x);err(authMsg(x))}b.disabled=false;return}
 setRecFlag(false);
 const p=$('#p').value;if(p.length<6)return err('Mật khẩu cần ít nhất 6 ký tự.');const nm=$('#n').value.trim();if(md===1&&!nm)return err('Nhập họ và tên.');
 b.disabled=true;
 try{if(md===1){const{data,error}=await sb.auth.signUp({email:e,password:p,options:{data:{full_name:nm}}});if(error)throw error;if(!data.session){try{if(data.user&&data.user.id)localStorage.setItem('sw_pending_cur_onboard_'+data.user.id,'1')}catch(e){}b.disabled=false;return toast('Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản rồi đăng nhập.')}}
  else{const{error}=await sb.auth.signInWithPassword({email:e,password:p});if(error)throw error}
  const{data:{session}}=await sb.auth.getSession();uid=session.user.id;userName=(md===1&&cleanName(nm))?cleanName(nm):nameFromUser(session.user);
  if(md===1){try{localStorage.setItem('sw_pending_cur_onboard_'+uid,'1')}catch(e){}}
  await loadAll();auth=true;location.hash='#dashboard';render();
  let needCurOnboard=false;
  try{needCurOnboard=localStorage.getItem('sw_pending_cur_onboard_'+uid)==='1'||(md===1&&localStorage.getItem('sw_cur_onboarded_'+uid)!=='1')}catch(e){}
  if(needCurOnboard){
    try{localStorage.removeItem('sw_pending_cur_onboard_'+uid)}catch(e){}
    setTimeout(()=>accOpen('currency',true),120);
  }
 }catch(x){console.error(x);b.disabled=false;err(authMsg(x))}}


async function loadAll(){
  const from=mAdd(-11).key+'-01';
  try {
    await ensureUserProfile();
    try{
      const {data:uData}=await sb.auth.getUser();
      const uAv=uData&&uData.user&&uData.user.user_metadata&&(uData.user.user_metadata.avatar_data||'');
      if(uAv) saveUserAvatarLocal(uAv, uid);
    }catch(e){}
    await loadGroups();
    const expQuery=sb.from('expenses').select('*, expense_items(*)').eq('user_id',uid).gte('spent_on',from).order('spent_on',{ascending:false}).order('created_at',{ascending:false});
    const[pr,bu,exs,nt]=await Promise.all([sb.from('profiles').select('*').maybeSingle(),sb.from('budgets').select('*'),expQuery,sb.from('notifications').select('*').order('created_at',{ascending:false}).limit(30)]);
    
    if(pr.error) console.warn('Lỗi profiles:', pr.error);
    if(bu.error) console.warn('Lỗi budgets:', bu.error);
    if(exs.error) console.warn('Lỗi expenses:', exs.error);
    if(nt.error) console.warn('Lỗi notifications:', nt.error);

    if(pr.data){
      thr=pr.data.alert_threshold || 80;
      opts=Object.assign({budget:true,weekly:true,over:true},pr.data.options);
      scanned=pr.data.scanned || 0;
      let dbCur=(pr.data.currency&&/^[A-Z]{3}$/.test(pr.data.currency))?pr.data.currency:'';
      if(!dbCur){
        try{
          const sr=await sb.auth.getSession();
          const mc=sr?.data?.session?.user?.user_metadata?.currency;
          if(mc&&/^[A-Z]{3}$/.test(mc))dbCur=mc;
        }catch(e){}
      }
      if(!dbCur){try{const lc=localStorage.getItem('sw-cur-'+uid);if(lc&&/^[A-Z]{3}$/.test(lc))dbCur=lc;}catch(e){}}
      if(dbCur){appCur=dbCur;try{localStorage.setItem('sw-cur',appCur);localStorage.setItem('sw-cur-'+uid,appCur)}catch(e){}}
      if(!cleanName(userName) && cleanName(pr.data.full_name)){
        userName=cleanName(pr.data.full_name);
      }
    } else {
      await safeDb(()=>sb.from('profiles').insert({user_id:uid,full_name:cleanName(userName)||null}));
    }
    
    if(bu.data && bu.data.length) {
      budSeeded=true;
      cats.splice(0,cats.length,...bu.data.map(b=>mkCat(b.category,+b.amount)).sort((x,y)=>(DORD.indexOf(x.n)+1||99)-(DORD.indexOf(y.n)+1||99)));
    } else {
      budSeeded=false;
    }
    applyBudColors(cats);
    applyBudOrder(cats);
    
    if(exs.data) {
      ex.splice(0,ex.length,...exs.data.map(r=>{
        const it=(r.expense_items||[]).map(i=>({id:i.id,n:i.name,c:i.category,a:+i.amount}));
        const e={id:r.id,uid:r.user_id,d:r.spent_on,s:r.shop,c:r.category,a:+r.amount,cur:normCur(r.currency||appCur),edits:r.edit_count||0,ts:r.created_at?new Date(r.created_at).getTime():0};
        if(it.length)e.items=it;
        return e;
      }));
    }
    if(activeGroupId) await loadGroupData(activeGroupId);
    
    if(nt.data) {
      const cleanNt=m=>String(m||'').replace(/\(\d+(?:\.\d+)?e\+\d+%\)/gi,'(>9.999%)');
      nts.splice(0,nts.length,...nt.data.map(n=>({t:cleanNt(n.message),d:new Date(n.created_at).toLocaleDateString(LOC()),c:n.color})));
      unread=nt.data.filter(n=>!n.read).length;
    }
  } catch(e) {
    console.error('Lỗi tải dữ liệu:', e);
  }
}

function persist(e){e._p=(async()=>{
  if(!sb)return;
  const payload={shop:e.s,spent_on:e.d,category:e.c,amount:e.a};
  if(uid)payload.user_id=uid;
  let res=await sb.from('expenses').insert({...payload,currency:e.cur||appCur}).select().single();
  if(res.error){
    console.warn('Insert with currency fallback:',res.error.message);
    res=await sb.from('expenses').insert(payload).select().single();
  }
  if(res.error||!res.data){
    console.error('Supabase error:',res.error);
    flash('Không lưu được lên máy chủ'+(res.error?.message?': '+res.error.message:'. Kiểm tra mạng và thử lại.'));
    return;
  }
  const r=res.data;e.id=r.id;
 if(e.items&&e.items.length){const rows=await dbx(()=>sb&&sb.from('expense_items').insert(e.items.map(p=>({expense_id:r.id,name:p.n,category:p.c,amount:p.a}))).select());if(rows)e.items.forEach((p,i)=>{p.id=rows[i].id})}})();(e.items||[]).forEach(p=>p._p=e._p)}
function persistItem(e,it){it._p=(async()=>{await e._p;if(!e.id)return;const r=await dbx(()=>sb&&sb.from('expense_items').insert({expense_id:e.id,name:it.n,category:it.c,amount:it.a}).select().single());if(r)it.id=r.id})()}
function saveProf(){dbx(()=>sb&&sb.from('profiles').update({alert_threshold:thr,options:opts,scanned}).eq('user_id',uid))}
function updBud(){const l=$('#bl'),t=$('#tb');if(l)l.innerHTML=donutChart(null, true, dashChartSort);if(t)t.textContent=fmt(bud())}
let budSeeded=false;
function addBud(){const n=$('#bn').value.trim(),v=num($('#bv').value),m=$('#bm');if(!n)return m.textContent='Nhập tên ngân sách.';if(cats.some(c=>c.n.toLowerCase()===n.toLowerCase()))return m.textContent='Ngân sách này đã tồn tại.';if(!(v>0))return m.textContent='Nhập số tiền lớn hơn 0.';
 const nc=mkCat(n,v);nc.c=budNewCol();cats.push(nc);{const mm=getBudColors();mm[n]=nc.c;setBudColors(mm)}ensureUniqueCategoryColors(cats);bAdd=false;bNewCol='';budPick=-1;render();if(!budSeeded){budSeeded=true;syncAllBudgets()}else{saveBudgetDb(n,v)}}
function delBud(i){if(cats.length<2)return flash('Cần giữ ít nhất một ngân sách.');const c=cats[i];ask(T('Xóa ngân sách này? Các khoản chi cũ vẫn được giữ.'),()=>{const k=cats.indexOf(c);if(k<0)return;cats.splice(k,1);render();if(!budSeeded){budSeeded=true;syncAllBudgets()}else{delBudgetDb(c.n)}},T('Xóa'))}
function setBud(i,v){cats[i].b=num(v);updBud();toast('Đã lưu ngân sách '+cats[i].n);if(!budSeeded){budSeeded=true;syncAllBudgets()}else{saveBudgetDb(cats[i].n,cats[i].b)}}
function setThr(v){thr=Math.min(100,Math.max(50,+v||80));toast('Đã lưu ngưỡng cảnh báo');saveProf()}
async function logout(){try{await sb.auth.signOut()}catch(e){}ex.length=0;nts.length=0;scanned=0;unread=0;uid=null;auth=false;userName="";userCode="";userWallet="";myGroups=[];activeGroupId=null;op=new Set();cats.splice(0,cats.length,...DORD.map(n=>mkCat(n,DEFB[n])));render()}

async function boot(){
  $('#root').innerHTML='<div style="padding:40px" class="mu">Đang tải…</div>';
  const urlHasRec=/type=recovery|reset=1|code=/.test(location.hash+' '+location.search);
  rec=hasRecoveryMarker();
  try {
    if(sb){
      const{data}=await sb.auth.getSession();
      if(data.session){
        uid=data.session.user.id; userName=nameFromUser(data.session.user);
        loadUserAvatarLocal(uid);
        const metaAv=data.session.user.user_metadata&&(data.session.user.user_metadata.avatar_data||'');
        if(metaAv) saveUserAvatarLocal(metaAv, uid);
        await loadAll();
        auth=true;
        const createdAt=data.session.user.created_at?new Date(data.session.user.created_at).getTime():0;
        const isBrandNew=createdAt&&(Date.now()-createdAt)<10*60*1000;
        let showOnboard=false;
        try{
          if(localStorage.getItem('sw_pending_cur_onboard_'+uid)==='1')showOnboard=true;
          else if(isBrandNew&&localStorage.getItem('sw_cur_onboarded_'+uid)!=='1')showOnboard=true;
        }catch(e){}
        if(showOnboard){
          try{localStorage.removeItem('sw_pending_cur_onboard_'+uid)}catch(e){}
          setTimeout(()=>accOpen('currency',true),180);
        }
      } else if(!urlHasRec){
        setRecFlag(false);
        rec=false;
      }
    }
  } catch(e) {
    console.error('Lỗi khởi động:', e);
    auth=false;
  }
  try{repairCorruptedBudgets()}catch(e){}
  render();
  booted=true;
}

let lastRoute='';
function render(forceTop=false){mbNav();$('#bell').hidden=!auth||rec;$('#usr').hidden=!auth||rec;$('#lmAuth').hidden=!auth||rec;if(rec)return resetView();if(!auth){return loginView()}
 const k=pages[cur()]?cur():'dashboard';if(k==='expenses'||k==='scan')ed={items:[],disc:0,discType:'amt'};if(k==='expenses')draft=null;
 if(!$('#nv')){$('#root').innerHTML=`<div id="app"><aside><div class="brand" onclick="location.hash='#dashboard'" role="link" tabindex="0" onkeydown="if(event.key==='Enter'){location.hash='#dashboard'}"><img src="${LOGO}" alt="Logo">Student Wallet</div><nav id="nv"></nav></aside><main id="mn"></main></div>`}
 const sx=window.scrollX,sy=window.scrollY;
 $('#mn').innerHTML=pages[k]();nav();
 if(forceTop || lastRoute!==k){scrollTo(0,0);lastRoute=k;}else{window.scrollTo(sx,sy);}}

let lang='vi';try{lang=localStorage.getItem('sw-lang')==='en'?'en':'vi'}catch(e){}
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const D={'Kéo để sắp xếp':'Drag to reorder','Lên đầu':'Move to top','Xuống cuối':'Move to bottom','Chọn màu':'Pick a color','Màu':'Color','Màu này đang được dùng cho ngân sách khác.':'This color is already used by another budget.','Màu đã dùng cho ngân sách khác':'Color already used by another budget','Đổi màu':'Change color','Lịch sử':'History','Mục khác':'More','Thêm thủ công':'Add manually','📷 Chụp ảnh':'📷 Take photo','🖼️ Chọn từ thư viện':'🖼️ Choose from library','📲 Cài ứng dụng lên màn hình chính':'📲 Install app on home screen','Đã hiểu':'Got it','Điều hướng chính':'Main navigation','Trên iPhone: mở bằng Safari, bấm nút Chia sẻ rồi chọn "Thêm vào Màn hình chính".':'On iPhone: open in Safari, tap the Share button, then choose "Add to Home Screen".',
'Quản lý nhóm chi tiêu chung (dữ liệu nhóm tách biệt hoàn toàn với chi tiêu cá nhân).':'Manage shared expense groups (group data is completely separate from personal expenses).',
'Mã riêng của bạn (Dùng để trưởng nhóm thêm bạn vào nhóm)':'Your personal code (used by group leaders to add you)',
'📋 Sao chép mã của tôi':'📋 Copy my code',
'NHÓM CHI TIÊU':'EXPENSE GROUP',
'• Trưởng nhóm:':'• Leader:',
'• Mã nhóm:':'• Group code:',
'Copy mã':'Copy code',
'👑 Trưởng nhóm (Toàn quyền)':'👑 Group Leader (Full access)',
'✏️ Thành viên (Được chỉnh sửa)':'✏️ Member (Can edit)',
'👁️ Thành viên (Chỉ được xem)':'👁️ Member (View only)',
'✕ Đóng bảng nhóm':'✕ Close group panel',
'📊 Tổng quan':'📊 Overview',
'📷 Quét hóa đơn':'📷 Scan receipt',
'➕ Thêm khoản chi':'➕ Add expense',
'🧾 Lịch sử chi tiêu':'🧾 Spending history',
'💰 Ngân sách':'💰 Budget',
'📈 Báo cáo':'📈 Report',
'⚙️ Cài đặt':'⚙️ Settings',
'🔐 Quỹ chung':'🔐 Shared Vault',
'KÉT SẮT RIÊNG CỦA NHÓM':'GROUP ISOLATED VAULT',
'💱 Tỷ giá quy đổi tham khảo:':'💱 Reference exchange rate:',
'(Tự động tính số tiền VNĐ tương đương)':'(Auto-calculates equivalent VND amount)',
'1. Số dư két sắt riêng của nhóm':'1. Group isolated vault balance',
'+ Góp vào quỹ':'+ Contribute to fund',
'2. Tạo yêu cầu rút quỹ & Khóa hóa đơn':'2. Request payout & seal receipt',
'Nhập tay tại đây hoặc bấm':'Enter manually here or click',
'ngay từ hóa đơn đã quét ở tab Lịch sử:':'directly from a scanned receipt in History:',
'Địa chỉ ví người nhận (0x... - để trống = ví của bạn)':'Recipient wallet address (0x... - blank = your wallet)',
'🔒 Gửi duyệt chi':'🔒 Submit for approval',
'↻ Làm mới':'↻ Refresh',
'🔐 Đã niêm phong quỹ':'🔐 Sealed on-chain',
'🔐 Niêm phong lên Quỹ chung':'🔐 Seal to Shared Vault',
'🔗 Kết nối ví của bạn':'🔗 Connect your wallet',
'🟢 Đã kết nối ví':'🟢 Wallet connected',
'➕ Tạo nhóm mới':'➕ Create new group',
'Tên nhóm chi tiêu':'Group name',
'VD: Phòng trọ 402, Nhóm đi Đà Lạt...':'e.g. Room 402, Da Lat Trip...',
'Tạo nhóm & Lấy mã ngẫu nhiên':'Create group & get random code',
'🔑 Tham gia nhóm bằng mã nhóm':'🔑 Join group with group code',
'Nhập mã nhóm (VD: GRP-8K9P2X)':'Enter group code (e.g. GRP-8K9P2X)',
'Nhập mã nhóm được chia sẻ...':'Enter shared group code...',
'Tham gia nhóm':'Join group',
'📋 Mở bảng chi tiêu nhóm':'📋 Open group expense panel',
'🗑️ Xóa nhóm':'🗑️ Delete group',
'Trưởng nhóm:':'Leader:',
'Danh sách nhóm đang trống. Bạn có thể tự tạo nhóm mới hoặc nhập mã nhóm ở trên để tham gia!':'Your group list is empty. Create a new group or enter a group code above to join!',
'Giới hạn ngân sách nhóm':'Group budget limit',
'Bình quân / thành viên':'Average / member',
'Giao dịch gần đây của nhóm':'Recent group transactions',
'Người chi':'Paid by',
'Cửa hàng / Nội dung':'Store / Description',
'Chưa có giao dịch riêng nào trong nhóm tháng này.':'No group transactions this month yet.',
'1. Tải ảnh hóa đơn nhóm':'1. Upload group receipt photo',
'Chọn, chụp hoặc kéo thả ảnh hóa đơn nhóm (JPG, PNG)':'Choose, snap, or drop a group receipt photo (JPG, PNG)',
'2. Kiểm tra & Lưu vào nhóm':'2. Review & save to group',
'Thêm khoản chi mới cho nhóm (Tách biệt hoàn toàn với ví cá nhân)':'Add new group expense (completely separate from personal wallet)',
'Ngày chi tiêu':'Expense date',
'VD: Tiền điện nước, Đi siêu thị chung...':'e.g. Electricity & water, Shared groceries...',
'💾 Lưu khoản chi nhóm':'💾 Save group expense',
'Thành viên đã mua':'Member who bought',
'Trạng thái thanh toán':'Payment status',
'✅ Đã chi':'✅ Paid',
'⏳ Chưa chi':'⏳ Unpaid',
'Trạng thái':'Status',
'Xóa khoản chi này khỏi nhóm? Việc xóa tính là 1 lần sửa.':'Delete this group expense? Deleting counts as 1 edit.',
'Hóa đơn nhóm này đã hết lượt sửa (3/3) nên không thể xóa.':'This group receipt has reached the max 3 edits and cannot be deleted.',
'Hóa đơn này đã hết lượt sửa (3/3).':'This receipt has reached the max 3 edits.',
'Tìm cửa hàng, món hoặc thành viên':'Search store, item, or member',
'VD: WinMart, Rau củ, Tuấn Phong...':'e.g. WinMart, Vegetables, Tuan Phong...',
'Lọc danh mục':'Filter category',
'Nhóm chưa có giao dịch nào khớp bộ lọc.':'No group transactions match the filters.',
'Chi tiết các món trong hóa đơn nhóm':'Itemized details in this group receipt',
'✏️ Sửa thông tin chung':'✏️ Edit general info',
'🗑️ Xóa hóa đơn':'🗑️ Delete receipt',
'Thêm ngân sách nhóm':'Add group budget',
'Xóa ngân sách nhóm':'Remove group budget',
'Tên danh mục ngân sách nhóm':'Group budget category name',
'VD: Quỹ liên hoan, Điện nước...':'e.g. Party fund, Utilities...',
'Ngưỡng cảnh báo ngân sách nhóm (%)':'Group budget alert threshold (%)',
'Tổng giới hạn ngân sách nhóm':'Total group budget limit',
'Đã vượt giới hạn ngân sách nhóm!':'Exceeded group budget limit!',
'Lũy kế 12 tháng':'12-month cumulative',
'Biểu đồ chi tiêu nhóm 12 tháng':'12-month group spending chart',
'Hạng':'Rank',
'Thành viên':'Member',
'GD':'Tx',
'Tổng đã chi':'Total spent',
'Tỷ trọng':'Share',
'Chưa có':'None',
'Chưa có giao dịch tháng này':'No transactions this month',
'Vai trò / Quyền hạn':'Role / Permission',
'Điều chỉnh quyền':'Manage access',
'Trưởng nhóm (Toàn quyền)':'Group Leader (Full access)',
'Được chỉnh sửa':'Can edit',
'Chỉ được xem (Mặc định)':'View only (Default)',
'Chỉ được xem':'View only',
'Cho phép chỉnh sửa':'Allow editing',
'Thêm thành viên mới bằng mã riêng (Mặc định khi thêm sẽ ở chế độ Chỉ được xem)':'Add new member by personal code (defaults to View only)',
'Nhập mã riêng người dùng...':'Enter user personal code...',
'+ Thêm vào nhóm':'+ Add to group',
'Chỉ trưởng nhóm mới có thể thêm thành viên và cấp quyền chỉnh sửa.':'Only the group leader can add members and grant edit permissions.',
'🔔 Tùy chọn nhận thông báo nhóm':'🔔 Group notification preferences',
'⚠️ Rời khỏi nhóm':'⚠️ Leave group',
'🚪 Rời nhóm':'🚪 Leave group',
'Xin chào,':'Welcome,',
'Ngày:':'Date:',
'Trạng thái:':'Status:',
'Đã đồng bộ':'Synced',
'Chúc bạn quản lý chi tiêu thông minh và đạt mục tiêu tài chính tháng này!':'Wishing you smart expense management and financial success this month!',
'Xác nhận':'Confirm','Xóa':'Delete','Xóa hóa đơn này? Việc xóa tính là 1 lần sửa.':'Delete this receipt? Deleting counts as 1 edit.','Xóa tính là 1 lần sửa':'Deleting counts as 1 edit','Đã hết lượt sửa nên không thể xóa hóa đơn này.':'No edits left, so this receipt cannot be deleted.','Số tiền tối đa là 10.000.000.000 đ.':'The maximum amount is 10.000.000.000 đ.','Chưa có thông báo nào.':'No notifications yet.','Vượt!':'Over!','Biểu đồ vuông chi tiêu 5 tháng':'Square chart of 5-month spending','Quên mật khẩu?':'Forgot password?','Quay lại đăng nhập':'Back to log in','Gửi liên kết đặt lại mật khẩu':'Send password reset link','Đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra email của bạn, kể cả thư rác.':'Reset link sent. Check your email, including spam.','Đặt mật khẩu mới':'Set a new password','Mật khẩu mới':'New password','Nhập lại mật khẩu mới':'Re-enter new password','Đổi mật khẩu':'Change password','Hai mật khẩu không khớp.':'The two passwords do not match.','Mật khẩu mới phải khác mật khẩu cũ.':'The new password must be different from the old one.','Liên kết đã hết hạn hoặc đã dùng. Hãy gửi lại liên kết mới.':'The link has expired or was already used. Request a new link.',
'Thêm ngân sách':'Add budget','Xóa ngân sách':'Remove budget','Tên ngân sách':'Budget name','Thêm':'Add','Hủy':'Cancel','VD: Sức khỏe':'e.g. Health','Số tiền (đ)':'Amount (đ)','Nhập tên ngân sách.':'Enter a budget name.','Ngân sách này đã tồn tại.':'This budget already exists.','Cần giữ ít nhất một ngân sách.':'Keep at least one budget.','Xóa ngân sách này? Các khoản chi cũ vẫn được giữ.':'Delete this budget? Past expenses are kept.',
'Lưu thay đổi':'Save changes','Hết lượt sửa (3/3)':'No edits left (3/3)','Hóa đơn này đã hết lượt sửa.':'This receipt has no edits left.','Bạn chỉ được sửa tối đa 3 lần cho mỗi hóa đơn.':'You can edit each receipt at most 3 times.','Danh mục món':'Item category','Không tải được bộ nhận dạng chữ. Kiểm tra mạng rồi tải lại trang.':'Could not load the text recognition engine. Check your network and reload.','Đang chuẩn bị bộ nhận dạng (lần đầu cần tải dữ liệu tiếng Việt, có thể mất vài phút)…':'Preparing the recognition engine (the first time it downloads Vietnamese data, which can take a few minutes)…','Không đọc được hóa đơn. Thử ảnh khác hoặc nhập tay.':'Could not read the receipt. Try another photo or enter it manually.','Chưa tách được món nào từ ảnh. Kiểm tra tổng tiền và bấm + Chi tiết để thêm món.':'No items were found in the photo. Check the total and press + Details to add items.','Phí, thuế và khác':'Fees, tax and other','Chưa có dữ liệu kiểm thử. Hãy quét một hóa đơn rồi lưu, kết quả so sánh sẽ hiện ở đây.':'No test data yet. Scan a receipt and save it, and the comparison will appear here.','So sánh kết quả đọc ảnh với thông tin bạn đã chỉnh sửa khi lưu hóa đơn.':'Compares what the app read from the photo with what you edited when saving.','Lúc quét':'Scanned','Cửa hàng (đọc → đã sửa)':'Store (read → edited)','Số tiền (đọc → đã sửa)':'Amount (read → edited)','Ngày (đọc → đã sửa)':'Date (read → edited)','Đang tải…':'Loading…','Chọn ngày chi tiêu.':'Choose the expense date.','Email hoặc mật khẩu không đúng.':'Wrong email or password.','Email này đã được đăng ký.':'This email is already registered.','Email chưa được xác nhận. Kiểm tra hộp thư của bạn.':'Email not confirmed yet. Check your inbox.','Không thể kết nối. Kiểm tra mạng và thử lại.':'Cannot connect. Check your network and try again.','Thử quá nhiều lần. Hãy đợi một lúc rồi thử lại.':'Too many attempts. Wait a moment and try again.','Đã có lỗi xảy ra. Thử lại sau.':'Something went wrong. Try again later.','Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản rồi đăng nhập.':'Signed up. Check your email to confirm your account, then log in.','Chưa cấu hình Supabase. Mở config.js và điền URL và khóa.':'Supabase is not configured. Open config.js and fill in the URL and key.','Không thể tải thư viện đăng nhập. Kiểm tra mạng rồi tải lại trang.':'Could not load the sign-in library. Check your network and reload.','Không lưu được lên máy chủ. Kiểm tra mạng và thử lại.':'Could not save to the server. Check your network and try again.','Cài đặt':'Settings','Giao diện':'Appearance','Tự động theo máy':'System default','Sáng (Light)':'Light','Tối (Dark)':'Dark','Ngôn ngữ':'Language','Định phí':'Fixed Cost','Biến phí':'Variable Cost','Đầu tư Học tập':'Study CAPEX','Tổng chi':'Total spend','giao dịch':'transactions','ngày':'days','Tổng quan':'Overview','Quét hóa đơn':'Scan receipt','Thêm khoản chi':'Add expense','Lịch sử chi tiêu':'Spending history','Ngân sách':'Budget','Báo cáo':'Report','Thông báo':'Notifications','Kiểm thử OCR':'OCR test','Đăng xuất':'Log out','Nhóm & Chia sẻ':'Groups & Share','Nhóm & Chia sẻ chi tiêu':'Groups & Shared Expenses',
'Đăng nhập':'Log in','Đăng ký':'Sign up','Họ và tên':'Full name','Email sinh viên':'Student email','Mật khẩu':'Password','Tạo tài khoản':'Create account','Nguyễn Văn A':'John Smith','ten@student.edu.vn':'name@student.edu',
'Email chưa đúng định dạng.':'Enter a valid email address.','Mật khẩu cần ít nhất 6 ký tự.':'Password must be at least 6 characters.','Nhập họ và tên.':'Enter your full name.',
'+ Quét hóa đơn':'+ Scan receipt','Tổng chi tiêu':'Total spent','Còn lại':'Remaining','Hóa đơn đã quét':'Receipts scanned','Chi tiêu theo tháng':'Spending by month','Theo dõi ngân sách':'Budget tracking','Giao dịch gần đây':'Recent transactions','Biểu đồ chi tiêu theo tháng':'Monthly spending chart',
'Ngày':'Date','Tên cửa hàng':'Store name','Danh mục':'Category','Số tiền':'Amount','Cửa hàng':'Store','Đã vượt ngân sách!':'Over budget!',
'Ăn uống':'Food & drink','Mua sắm':'Shopping','Di chuyển':'Transport','Giải trí':'Entertainment','Học tập':'Study','Tiền nhà':'Rent','Khác':'Other',
'Nhập thủ công. Hóa đơn có nhiều món thì bấm + Chi tiết để tách từng món.':'Enter it manually. For a receipt with several items, press + Details to split it up.','Tên cửa hàng / nội dung':'Store / description','VD: Siêu thị Co.opmart':'e.g. Co.opmart supermarket','Tổng tiền (đ)':'Total (đ)','Danh mục chính':'Main category','Lưu khoản chi':'Save expense',
'Chi tiết từng món (tùy chọn)':'Item details (optional)','+ Chi tiết':'+ Details','Tên món (VD: Rau)':'Item name (e.g. Vegetables)','Tên món':'Item name','Xóa món':'Remove item',
'Nhập tên cửa hàng hoặc nội dung.':'Enter a store name or description.','Mỗi món cần có tên và số tiền lớn hơn 0.':'Each item needs a name and an amount above 0.','Nhập số tiền lớn hơn 0.':'Enter an amount above 0.','Nhập tên món.':'Enter an item name.',
'Bấm vào từng hóa đơn để xem các món bên trong và thêm chi tiết.':'Press a receipt to see the items inside and add details.','Tìm cửa hàng hoặc món':'Search store or item','VD: nồi, rau, Grab':'e.g. pot, vegetables, Grab','Tất cả danh mục':'All categories','chưa chi tiết':'no details',
'Các khoản khác (chưa chi tiết)':'Other (not itemised)','Các khoản khác':'Other items','Xóa hóa đơn':'Delete receipt','Xóa hóa đơn này?':'Delete this receipt?','Không có hóa đơn nào khớp bộ lọc.':'No receipts match the filters.',
'Tải ảnh hóa đơn, AI đọc thông tin, tách từng món và gợi ý danh mục tự động. Bạn có thể sửa trước khi lưu.':'Upload a receipt photo. AI reads it, splits items, and suggests categories automatically. You can edit before saving.','1. Tải ảnh lên':'1. Upload photo','2. Kiểm tra và chỉnh sửa':'2. Review and edit','Chọn, chụp hoặc kéo thả ảnh hóa đơn (JPG, PNG)':'Choose, snap, or drop a receipt photo (JPG, PNG)',
'Thông tin trích xuất sẽ hiện ở đây sau khi quét.':'Extracted details will appear here after scanning.','Đang phân tích hóa đơn…':'Analyzing receipt…','Đang quét thông minh bằng AI Vision…':'Smart scanning with AI Vision…','✓ AI đã đọc xong hóa đơn! Kiểm tra lại thông tin bên phải.':'✓ AI finished reading the receipt! Check the details on the right.','Hóa đơn đã tải':'Uploaded receipt',
'Danh mục chính (dùng khi không chia món)':'Main category (used when not split into items)','Lưu hóa đơn':'Save receipt',
'Đặt ngân sách cho từng danh mục trong tháng 11, 2026.':'Set a budget for each category in November 2026.','Mức đã dùng':'Amount used','Đặt ngân sách tháng':'Set monthly budget','Cảnh báo khi đạt (%)':'Alert when reaching (%)','Tổng ngân sách':'Total budget','Đã lưu ngưỡng cảnh báo':'Alert threshold saved',
'Báo cáo tháng':'Monthly report','In / Lưu PDF':'Print / Save PDF','Chênh lệch':'Difference','Giao dịch':'Transactions','So sánh theo danh mục':'Comparison by category','Thay đổi':'Change','Tháng 11 so với tháng 10':'November vs October','Xu hướng 5 tháng':'5-month trend','Báo cáo tài chính 12 tháng':'12-Month Financial Report','🖨️ In báo cáo chuẩn A4 / Lưu PDF':'🖨️ Print A4 Report / Save PDF','Chỉ số phân tích tài chính (Business Analytics)':'Financial & Business Analytics','Báo cáo Variance & Cấu trúc chi phí theo danh mục':'Budget Variance & Cost Structure by Category','Xu hướng dòng tiền chi ra 12 tháng (LTM Cash Outflow)':'12-Month Cash Outflow Trend (LTM)',
'Cảnh báo ngân sách và nhắc nhở của bạn.':'Your budget alerts and reminders.','Gần đây':'Recent','Tùy chọn nhận thông báo':'Notification preferences','Khi gần chạm ngưỡng ngân sách':'When nearing the budget threshold','Khi vượt ngân sách':'When over budget','Tóm tắt chi tiêu mỗi tuần':'Weekly spending summary','Báo cáo tháng 10 đã sẵn sàng':'October report is ready',
'Trung bình':'Average','Mẫu':'Sample','Cửa hàng (thật → đọc)':'Store (actual → read)','Số tiền (thật → đọc)':'Amount (actual → read)','Kết quả':'Result','Cần sửa':'Needs fix','Đúng':'Correct','Hóa đơn chụp mờ':'Blurry receipt','Nhà sách':'Bookstore',
'Nhận xét: ảnh mờ và chữ không dấu là nguyên nhân sai nhiều nhất, nên cần bước chỉnh sửa thủ công trước khi lưu.':'Note: blurry photos and text without accents cause the most errors, so a manual edit step is needed before saving.',
'Quán cơm Hến':'Hen rice shop','Nhà sách Phương Nam':'Phuong Nam Bookstore','Rau củ':'Vegetables','Thịt heo':'Pork','Trứng, sữa':'Eggs & milk','Áo khoác':'Jacket','Quần jeans':'Jeans','Bộ nồi chảo':'Pots & pans','Nồi chảo':'Pots & pans','Áo thun':'T-shirt','Cà phê':'Coffee','Bánh ngọt':'Pastry','Chuyến xe':'Ride','Vé xem phim':'Movie ticket','Bắp nước':'Popcorn & drink'};
const P=[
 [/^🦊 Đã lưu ví Avalanche Fuji \((.+)\)!$/,(_,a)=>`🦊 Saved Avalanche Fuji wallet (${a})!`],
 [/^🦊 Đã kết nối ví Fuji Audit: (.+)$/,(_,a)=>`🦊 Connected Fuji Audit wallet: ${a}`],
 [/^✅ Đã cấp quyền ghi audit Fuji cho ví (.+)$/,(_,a)=>`✅ Granted Fuji audit recording permission to wallet ${a}`],
 [/^🔒 Đã thu hồi quyền ghi audit của ví (.+)$/,(_,a)=>`🔒 Revoked audit recording permission for wallet ${a}`],
 [/^Nhóm đã có admin khác trên Fuji: (.+)$/,(_,a)=>`Group already has another admin on Fuji: ${a}`],
 [/^✅ Ví này đã là admin Fuji của nhóm: (.+)$/,(_,a)=>`✅ This wallet is already the Fuji admin of the group: ${a}`],
 [/^✅ Đã khởi tạo Admin nhóm trên Fuji \((.+)\)$/,(_,a)=>`✅ Initialized Group Admin on Fuji (${a})`],
 [/^⏳ Transaction khởi tạo Admin đã gửi lên Fuji \((.+)\), đang chờ xác nhận\.$/,(_,a)=>`⏳ Admin initialization transaction sent to Fuji (${a}), awaiting confirmation.`],
 [/^✅ Admin Fuji hiện tại: (.+)$/,(_,a)=>`✅ Current Fuji Admin: ${a}`],
 [/^Chỉ ví admin Fuji (.+) mới được cấp\/thu hồi recorder\.$/,(_,a)=>`Only the Fuji admin wallet ${a} can grant/revoke recorders.`],
 [/^⚠️ Ghi audit Fuji thất bại; phiếu chỉ được lưu trong hồ sơ nhóm sau khi máy chủ xác nhận: (.+)$/,(_,a)=>`⚠️ Fuji audit recording failed; vote is saved to group records only after server confirmation: ${a}`],
 [/^📤 Đã gửi khai báo chuyển khoản (.+)\. Khoản này đang ở trạng thái CHỜ ĐỐI SOÁT SAO KÊ trước khi cộng vào số dư quỹ!$/,(_,a)=>`📤 Submitted transfer claim for ${a}. It is PENDING STATEMENT VERIFICATION before being added to the vault balance!`],
 [/^Contract tại (.+) không hỗ trợ hàm của StudentGroupVaultV4 \(execution reverted\)\. Hãy deploy StudentGroupVaultV4\.sol mới lên Fuji và bấm "Đổi Contract" để dán địa chỉ mới\.$/,(_,a)=>`Contract at ${a} does not support StudentGroupVaultV4 functions (execution reverted). Deploy the new StudentGroupVaultV4.sol to Fuji and click "Change Contract" to paste the new address.`],
 [/^Không tìm thấy smart contract tại địa chỉ (.+) trên Avalanche Fuji \(43113\)\.$/,(_,a)=>`No smart contract found at ${a} on Avalanche Fuji (43113).`],
 [/^🗳️ Đồng thuận chi quỹ: (\d+)\/(\d+) thành viên đồng ý(.*)$/,(m,c,r,rest)=>`🗳️ Fund payout consensus: ${c}/${r} members approved${rest}`],
 [/^👍 Đồng ý chi \((\d+)\/(\d+)\)$/,(m,c,r)=>`👍 Approve Payout (${c}/${r})`],
 [/^✓ Bạn đã đồng ý \((\d+)\/(\d+)\)$/,(m,c,r)=>`✓ You approved (${c}/${r})`],
 [/^🔒 Chờ đủ phiếu \((\d+)\/(\d+)\)$/,(m,c,r)=>`🔒 Locked (${c}/${r} votes)`],
 [/^✅ Đã đủ phiếu đồng thuận \((\d+)\/(\d+)\)! Thủ quỹ có thể quét QR hoàn tiền ngay\.$/,(m,c,r)=>`✅ Quorum reached (${c}/${r})! The treasurer can now scan the QR code to reimburse.`],
 [/^👍 Đã ghi nhận đồng ý chi hoàn tiền \((\d+)\/(\d+) thành viên\)\.$/,(m,c,r)=>`👍 Recorded your payout approval (${c}/${r} members).`],
 [/^Lãi dự kiến mỗi tháng \(([^)]+)\):$/,(m,r)=>`Estimated monthly yield (${r}):`],
 [/^✅ Đã ghi nhận (.+) vào quỹ nhóm!$/,(m,a)=>`✅ Recorded ${a} into the group fund!`],
 [/^⏳ Đã gửi xác nhận chuyển khoản (.+)\. Chờ trưởng nhóm đối soát biến động số dư!$/,(m,a)=>`⏳ Submitted transfer confirmation for ${a}. Waiting for the group leader to verify!`],
 [/^✅ Đã duyệt khoản góp quỹ (.+) của (.+)!$/,(m,a,b)=>`✅ Approved ${b}'s fund deposit of ${a}!`],
 [/^✅ Đã tạo đề nghị hoàn (.+) cho (.+)!$/,(m,a,b)=>`✅ Created reimbursement request of ${a} for ${b}!`],
 [/^✅ Đã hoàn (.+) từ quỹ cho (.+)!$/,(m,a,b)=>`✅ Reimbursed ${a} from the fund to ${b}!`],
 [/^✅ Đã khóa đối soát hóa đơn \(([^)]+)\)!$/,(m,id)=>`✅ Locked receipt verification (${id})!`],[/^Đã sửa (\d)\/3 lần$/,(_,a)=>'Edited '+a+'/3 times'],[/^Sửa \(còn (\d) lần\)$/,(_,a)=>'Edit ('+a+' left)'],[/^Số tiền không được nhỏ hơn tổng các món đã chi tiết \((.+)\)\.$/,(_,a)=>'Amount cannot be below the itemised total ('+a+').'],[/^Dựa trên (\d+) hóa đơn đã quét và lưu\.$/,(_,a)=>'Based on '+a+' scanned and saved receipts.'],[/^Tháng (\d+) so với tháng (\d+)$/,(_,a,b)=>MN[a-1]+' vs '+MN[b-1]],[/^Đặt ngân sách cho từng danh mục trong tháng (\d+), (\d+)\.$/,(_,a,b)=>'Set a budget for each category in '+MN[a-1]+' '+b+'.'],[/^Tháng (\d+), (\d+) so với tháng (\d+), (\d+)$/,(_,a,b,c,d)=>MN[a-1]+' '+b+' vs '+MN[c-1]+' '+d],[/^Tháng (\d+), (\d+)$/,(_,a,b)=>MN[a-1]+' '+b],[/^Tháng (\d+)$/,(_,a)=>MN[a-1]],[/^T(\d+)$/,(_,a)=>MN[a-1].slice(0,3)],[/^([\d.]+)tr$/,(_,a)=>a+'M'],
[/^Hóa đơn (.+)$/,(_,a)=>a+' receipt'],[/^Phiếu (.+)$/,(_,a)=>tr(a)+' slip'],[/^(\d+) hóa đơn$/,(_,a)=>a+(a==1?' receipt':' receipts')],[/^Tổng: (.+)$/,(_,a)=>'Total: '+a],[/^(\d+) món$/,(_,a)=>a+(a==1?' item':' items')],
[/^Thêm món vào hóa đơn này$/,()=>'Add an item to this receipt'],[/^Thêm món vào hóa đơn này \(còn (.+) chưa chi tiết\)$/,(_,a)=>'Add an item to this receipt ('+a+' not itemised yet)'],
[/^Số tiền vượt phần còn lại của hóa đơn \((.+)\)\.$/,(_,a)=>'Amount exceeds what is left on this receipt ('+a+').'],[/^Đang nhận dạng chữ… (\d+)%$/,(_,a)=>'Reading text… '+a+'%'],
[/^Đã nhận diện (\d+) món,.*$/,(_,a)=>'Detected '+a+' items and suggested a category for each. Edit them or press + Details to add more.'],[/^Đã lưu ngân sách (.+)$/,(_,a)=>'Saved budget for '+tr(a)],[/^Áp dụng danh mục này cho tất cả (\d+) món bên trong$/,(_,a)=>'Apply this category to all '+a+' items inside'],
[/^Không thể chọn ngày từ 2 ngày trước trở về trước \(chỉ cho phép từ hôm qua trong năm (\d+)\)\.$/,(_,a)=>'Cannot select dates from 2 or more days ago (only from yesterday within '+a+').'],
[/^Chỉ được chọn ngày trong năm (\d+)\.$/,(_,a)=>'Dates must be within '+a+'.'],
[/^\(Không thấy ngày trên ảnh, chỉ chọn từ hôm qua trong năm (\d+)\)$/,(_,a)=>'(No date found on image; only from yesterday within '+a+')'],
[/^\(Đang tự sửa: chỉ chọn từ hôm qua trong năm (\d+)\)$/,(_,a)=>'(Editing manually: only from yesterday within '+a+')'],
[/^Khôi phục ngày AI \((.+)\)$/,(_,a)=>'Restore AI date ('+a+')'],
[/^💱 Phát hiện ngoại tệ: (.+) \((.+)\)$/,(_,a,b)=>'💱 Foreign currency detected: '+a+' ('+b+')'],
[/^Tỷ giá 1 ([A-Z]{3}) =$/,(_,a)=>'Rate 1 '+a+' ='],
[/^Tổng tiền \((.+)\)$/,(_,a)=>'Total ('+a+')'],
[/^Giữ nguyên giá trị số gốc từ hóa đơn \((.+) → (.+)\)\.$/,(_,a,b)=>'Keeping original numeric value from receipt ('+a+' → '+b+').'],
[/^🔄 Quy đổi sang (.+)$/,(_,a)=>'🔄 Convert to '+a],
[/^📌 Giữ nguyên số tiền gốc \((.+)\)$/,(_,a)=>'📌 Keep original amount ('+a+')'],
[/^(.+) đã vượt ngân sách \((\d+)%\)$/,(_,a,b)=>tr(a)+' is over budget ('+b+'%)'],[/^(.+) đã dùng (\d+)% ngân sách$/,(_,a,b)=>'You have used '+b+'% of your '+tr(a)+' budget'],
[/^Đối chiếu kết quả trích xuất với thông tin thật trên (\d+) hóa đơn mẫu \(dữ liệu minh họa\)\.$/,(_,a)=>'Extracted results compared with the real details on '+a+' sample receipts (demo data).'],
[/^Đúng (cửa hàng|số tiền|ngày)$/,(_,a)=>'Correct '+{'cửa hàng':'store name','số tiền':'amount','ngày':'date'}[a]],
[/^👥 Thành viên \((\d+)\)$/,(_,a)=>'👥 Members ('+a+')'],
[/^👥 Danh sách nhóm của bạn \((\d+)\)$/,(_,a)=>'👥 Your groups ('+a+')'],
[/^• (\d+) thành viên$/,(_,a)=>'• '+a+(a==1?' member':' members')],
[/^Tổng chi tiêu nhóm \(T(\d+)\)$/,(_,a)=>'Group spending ('+MN[a-1].slice(0,3)+')'],
[/^Đóng góp chi tiêu từng thành viên \(Tháng (\d+)\/(\d+)\)$/,(_,a,b)=>'Member spending contributions ('+MN[a-1]+' '+b+')'],
[/^Mức đã dùng của nhóm \(Tháng (\d+)\/(\d+)\)$/,(_,a,b)=>'Group budget usage ('+MN[a-1]+' '+b+')'],
[/^Thiết lập ngân sách nhóm(.*)$/,(_,a)=>'Group budget settings'+(a.includes('Chỉ xem')?' (View only)':'')],
[/^Chi tiêu tháng (\d+)$/,(_,a)=>MN[a-1]+' spending'],
[/^🏆 Chi tiêu nhiều nhất \(T(\d+)\)$/,(_,a)=>'🏆 Top spender ('+MN[a-1].slice(0,3)+')'],
[/^Số giao dịch T(\d+)$/,(_,a)=>MN[a-1].slice(0,3)+' transactions'],
[/^Bảng xếp hạng chi tiêu thành viên \(T(\d+)\/(\d+)\)$/,(_,a,b)=>'Member spending ranking ('+MN[a-1].slice(0,3)+' '+b+')'],
[/^Danh sách thành viên & Phân quyền \((\d+)\)$/,(_,a)=>'Members & Permissions ('+a+')'],
[/^Chi tiết từng món \((\d+)\)$/,(_,a)=>'Itemized details ('+a+')'],
[/^(\d+) hóa đơn nhóm \(Bấm vào từng dòng để xem & sửa chi tiết từng món\)$/,(_,a)=>a+' group receipts (Click each row to view & edit items)'],
[/^Tổng cộng: (.+)$/,(_,a)=>'Total: '+a],
[/^Đã chạm ngưỡng cảnh báo \((\d+)%\)!$/,(_,a)=>'Reached alert threshold ('+a+'%)!'],
[/^So với T(\d+):$/,(_,a)=>'vs '+MN[a-1].slice(0,3)+':'],
[/^Mã nhóm: (.+)$/,(_,a)=>'Group code: '+a],
[/^⚠️ AI chưa đọc được hóa đơn \((.+)\)\. Kết quả dưới đây dùng OCR dự phòng và có thể sai; kiểm tra kỹ từng trường trước khi lưu\.$/,(_,a)=>'⚠️ AI could not read the receipt ('+(a==='không rõ nguyên nhân'?'unknown reason':tr(a))+'). The result below uses backup OCR and may be inaccurate; review every field carefully before saving.'],
[/^(.+) đã vượt ngân sách \((.+)\)$/,(_,a,b)=>tr(a)+' is over budget ('+b.replace('ngân sách 0 đ','0 VND budget')+')'],
[/^\[Nhóm (.+)\] (.+) đã vượt ngân sách \((.+)\)$/,(_,g,a,b)=>'[Group '+g+'] '+tr(a)+' is over budget ('+b.replace('ngân sách 0 đ','0 VND budget')+')'],
[/^\[Nhóm (.+)\] (.+) đã dùng (\d+)% ngân sách$/,(_,g,a,b)=>'[Group '+g+'] '+tr(a)+' has used '+b+'% of its budget'],
[/^Không mở được cửa sổ tài khoản: (.+)$/,(_,a)=>'Could not open account dialog: '+(a==='Lỗi không xác định'?'Unknown error':tr(a))],
[/^(\d+) chờ duyệt$/,(_,a)=>a+' pending'],
[/^· Tỷ giá: (.+)$/,(_,a)=>'· Rate updated: '+a],
[/^⚠️ Chưa đồng bộ được lên máy chủ nhóm \((.+)\)\.$/,(_,a)=>'⚠️ Could not sync to group server ('+a+').'],
[/^Không chuyển được sang mạng Avalanche Fuji: (.+)$/,(_,a)=>'Could not switch to Avalanche Fuji network: '+tr(a)],
[/^Ví không ký được thông điệp\. Lần 1: (.+)\. Lần 2: (.+)$/,(_,a,b)=>'Wallet could not sign the message. Attempt 1: '+tr(a)+'. Attempt 2: '+tr(b)],
[/^⏳ Đang xác nhận đồng ý chi cho khoản #(\d+)\.\.\.$/,(_,a)=>'⏳ Confirming spending approval for request #'+a+'...'],
[/^✅ Bạn đã xác nhận đồng ý cho khoản #(\d+)!$/,(_,a)=>'✅ You approved request #'+a+'!'],
[/^⏳ Đang chuyển tiền cho yêu cầu #(\d+)\.\.\.$/,(_,a)=>'⏳ Executing payout for request #'+a+'...'],
[/^✅ Đã chuyển tiền cho yêu cầu #(\d+)\.$/,(_,a)=>'✅ Funds transferred for request #'+a+'.'],
[/^Niêm phong hóa đơn "(.+)" \((.+)\) lên blockchain\?\n\nChỉ ghi mã chống sửa đổi, KHÔNG rút tiền từ quỹ\. Bạn cần là thành viên đã góp quỹ của nhóm (.+)\.$/,(_,s,amt,g)=>'Seal receipt "'+s+'" ('+amt+') on the blockchain?\n\nThis only records a tamper-proof hash and does NOT withdraw funds. You must be a contributing member of group '+g+'.'],
[/^Niêm phong hóa đơn "(.+)" \((.+)\) lên Quỹ chung của nhóm (.+)\?\n\nLưu ý: thao tác này tạo một YÊU CẦU RÚT (.+) từ quỹ về ví của bạn\. Tiền chỉ được chi khi đủ thành viên bấm "Đồng ý chi"\.$/,(_,s,amt,g,avax)=>'Seal receipt "'+s+'" ('+amt+') to the Shared Vault of group '+g+'?\n\nNote: this creates a WITHDRAWAL REQUEST of '+avax+' from the fund to your wallet. Funds are only released once enough members click "Approve spending".'],
[/^Đề nghị hoàn (.+) từ quỹ nhóm (.+) về ví (.+) của (.+)\?\n\nTiền chỉ được chuyển khi đa số thành viên đã góp quỹ bấm "Đồng ý chi"\.$/,(_,amt,g,w,buyer)=>'Request a reimbursement of '+amt+' from group '+g+'’s fund to '+buyer+'’s wallet ('+w+')?\n\nFunds are only transferred once a majority of contributing members click "Approve spending".'],
[/^Hoàn tiền: (.+)$/,(_,a)=>'Reimbursement: '+a]];
const EXD=Object.assign({"🌍 Thiết lập quốc gia & tiền tệ":"🌍 Set Country & Currency","Chào mừng bạn! Hãy chọn quốc gia hoặc đơn vị tiền tệ chính của bạn (có thể đổi lại bất cứ lúc nào tại biểu tượng 👤 trên góc).":"Welcome! Choose your country or default currency (you can change it anytime via the 👤 icon at the top).","Tiền tệ":"Currency","Đang chọn:":"Selected:","Tìm theo tên quốc gia hoặc mã tiền tệ":"Search by country name or currency code","VD: Việt Nam, Switzerland, CHF, USD, Nhật...":"e.g. Vietnam, Switzerland, CHF, USD, Japan...","Lưu đơn vị tiền tệ":"Save currency","Đơn vị tiền tệ":"Currency","🇻🇳 Việt Nam (VND - đ)":"🇻🇳 Vietnam (VND - đ)","🇺🇸 Hoa Kỳ / Quốc tế (USD - $)":"🇺🇸 United States / Intl (USD - $)","🇪🇺 Châu Âu (EUR - €)":"🇪🇺 Europe (EUR - €)","🇨🇭 Thụy Sĩ (CHF)":"🇨🇭 Switzerland (CHF)","🇷🇺 Nga (RUB - ₽)":"🇷🇺 Russia (RUB - ₽)","🇬🇧 Anh (GBP - £)":"🇬🇧 United Kingdom (GBP - £)","🇯🇵 Nhật Bản (JPY - ¥)":"🇯🇵 Japan (JPY - ¥)","🇰🇷 Hàn Quốc (KRW - ₩)":"🇰🇷 South Korea (KRW - ₩)","🇨🇳 Trung Quốc (CNY - ¥)":"🇨🇳 China (CNY - ¥)","🇸🇬 Singapore (SGD - S$)":"🇸🇬 Singapore (SGD - S$)","🇦🇺 Úc (AUD - A$)":"🇦🇺 Australia (AUD - A$)","🇨🇦 Canada (CAD - C$)":"🇨🇦 Canada (CAD - C$)","🇹🇭 Thái Lan (THB - ฿)":"🇹🇭 Thailand (THB - ฿)","🔄 Quy đổi sang VNĐ":"🔄 Convert to VND","📌 Giữ nguyên số tiền gốc":"📌 Keep original amount","✓ AI tự động nhận diện từ hóa đơn (khóa sửa ngày quá khứ)":"✓ AI auto-detected from receipt (past date locked)","Tự sửa ngày":"Edit date manually","✓ AI tự động nhận diện từ hóa đơn (khóa sửa ngày quá khứ)":"✓ AI auto-detected from receipt (past date locked)","Tự sửa ngày":"Edit date manually","Khôi phục ngày AI":"Restore AI date","Phát hiện ngoại tệ:":"Foreign currency detected:","🔄 Quy đổi sang VNĐ":"🔄 Convert to VND","📌 Giữ nguyên số tiền gốc":"📌 Keep original amount","Tỷ giá 1":"Rate: 1","Giữ nguyên giá trị số gốc từ hóa đơn":"Keeping original numeric value from receipt","✓ Tự động nhận diện từ hóa đơn":"✓ Auto-detected from receipt","(Không thấy ngày trên ảnh, dùng hôm nay)":"(No date found on image, using today)","Không lưu được lên máy chủ": "Could not save to the server", "Kiểm tra mạng và thử lại.": "Check your connection and try again.", "Đã sao chép mã:": "Code copied:", "Tháng": "Month", "Tổng tiền": "Total amount", "+ Thêm món": "+ Add item", "Chi tiết từng món": "Item details", "Tỷ trọng:": "Share:", "tổng chi nhóm": "of group spending", "Hóa đơn": "Receipt", "hóa đơn": "receipts", "Tổng:": "Total:", "Tổng cộng:": "Total:", "Đã sửa": "Edited", "lần": "times", "còn": "left", "Sửa": "Edit", "Hết lượt sửa": "No edits left", "Rời nhóm": "Leave group", "Xóa nhóm": "Delete group", "Đang lưu...": "Saving…", "Đang tạo...": "Creating...", "Đang tham gia...": "Joining...", "Đang thêm...": "Adding...", "Đang kết nối...": "Connecting...", "Trưởng nhóm": "Group leader", "Toàn quyền": "Full access", "Thành viên": "Members", "Mặc định": "Default", "thành viên": "members", "Tiếng Việt": "Vietnamese", "Chưa tải được thư viện ví. Kiểm tra mạng và tải lại trang.": "Could not load the wallet library. Check your network and reload the page.", "Chưa tải được thư viện ví": "Could not load the wallet library", "Địa chỉ ví không hợp lệ (phải bắt đầu bằng 0x, đủ 42 ký tự và đúng chữ hoa chữ thường).": "Invalid wallet address (it must start with 0x, be 42 characters long and have the correct upper/lower case).", "Không lưu được ví. Hãy chạy schema_groups_secure.sql trong Supabase (thiếu cột wallet_address).": "Could not save the wallet. Run schema_groups_secure.sql in Supabase (the wallet_address column is missing).", "Đã lưu địa chỉ ví": "Wallet address saved", "Đã xóa địa chỉ ví": "Wallet address removed", "Đã điền địa chỉ ví đang kết nối. Bấm Lưu ví để lưu.": "Connected wallet address filled in. Press Save wallet to store it.", "Không kết nối được ví:": "Could not connect the wallet:", "Ví Avalanche của bạn (để nhận tiền hoàn từ quỹ nhóm)": "Your Avalanche wallet (to receive group vault reimbursements)", "Ví Avalanche của bạn": "Your Avalanche wallet", "để nhận tiền hoàn từ quỹ nhóm": "to receive refunds from the group fund", "Lưu ví": "Save wallet", "🔗 Dùng ví đang kết nối": "🔗 Use connected wallet", "Ví của bạn:": "Your wallet:", "Tài khoản ví đã thay đổi. Hãy bấm Kết nối ví để dùng lại.": "Wallet account changed. Click Connect wallet to continue.", "Mạng ví đã thay đổi. Hãy kết nối lại ví (cần mạng Avalanche Fuji).": "Wallet network changed. Reconnect your wallet (Avalanche Fuji required).", "Bạn đã từ chối chuyển sang mạng Avalanche Fuji.": "You rejected switching to the Avalanche Fuji network.", "Không chuyển được sang mạng Avalanche Fuji:": "Could not switch to the Avalanche Fuji network:", "Ví chưa ở mạng Avalanche Fuji (testnet). Hãy chuyển mạng rồi thử lại.": "Your wallet is not on Avalanche Fuji (testnet). Switch networks and try again.", "Bạn chưa cài ví điện tử (Core Wallet hoặc MetaMask) trên trình duyệt này!": "No wallet extension (Core Wallet or MetaMask) was found in this browser!", "Không tìm thấy ví trên trình duyệt": "No wallet found in browser", "Ví chưa cấp quyền truy cập tài khoản": "Wallet has not granted account access", "Địa chỉ ví người nhận không hợp lệ (phải bắt đầu bằng 0x...)": "Invalid recipient wallet address (must start with 0x...)", "Đã cập nhật tỷ giá quy đổi: 1 AVAX": "Exchange rate updated: 1 AVAX", "Quy đổi tham khảo: ≈": "Reference value: ≈", "Đã kết nối ví quỹ chung thành công!": "Shared vault wallet connected successfully!", "Không thể kết nối ví:": "Could not connect wallet:", "Hãy deploy StudentGroupVaultV3.sol lên Fuji, sau đó điền CONTRACT_ADDRESS_V3 trước.": "Deploy StudentGroupVaultV3.sol to Fuji first, then set CONTRACT_ADDRESS_V3.", "Chỉ trưởng nhóm mới có thể đăng ký/cập nhật thành viên trên blockchain.": "Only the group leader can register or update members on the blockchain.", "Trưởng nhóm cần lưu địa chỉ ví Avalanche trong hồ sơ trước.": "The group leader must save an Avalanche wallet address in their profile first.", "Hãy kết nối đúng ví Avalanche đã lưu trong hồ sơ của trưởng nhóm.": "Connect the exact Avalanche wallet address saved in the group leader profile.", "cần lưu ví Avalanche trước khi đăng ký nhóm.": "must save an Avalanche wallet before the group is registered.", "Bạn đã từ chối yêu cầu ký trong ví.": "You rejected the signature request in your wallet.", "Ví không ký được thông điệp. Lần 1:": "The wallet could not sign the message. Attempt 1:", ". Lần 2:": ". Attempt 2:", "Mã nhóm đã được đăng ký bởi một ví khác. Hãy kiểm tra trước khi tiếp tục.": "This group code is already registered by another wallet. Verify before continuing.", "Đã đồng bộ danh sách ví thành viên lên Fuji.": "Synced member wallet list to Fuji.", "Không đồng bộ được thành viên (bước:": "Could not sync members (step:", "kết nối ví": "connect wallet", "đọc trạng thái nhóm trên Fuji": "read group status on Fuji", "đọc mã xác nhận đăng ký từ Fuji": "read registration digest from Fuji", "xin ví ký xác nhận danh sách ví": "request wallet signature for member list", "gửi giao dịch đăng ký nhóm": "send group registration transaction", "chờ Fuji xác nhận giao dịch": "wait for Fuji transaction confirmation", "cập nhật ví thành viên trên Fuji": "update member wallet on Fuji", "chờ Fuji xác nhận cập nhật thành viên": "wait for Fuji member update confirmation", "Quỹ Chung Minh Bạch •": "Transparent Shared Fund •", "Số dư và các yêu cầu rút quỹ tại đây được tách riêng cho nhóm": "Balances and withdrawal requests here are isolated for group", "Mã:": "Code:", "Hóa đơn được niêm phong chống sửa đổi và chỉ chi tiền khi có thành viên duyệt.": "Receipts are tamper-sealed and funds are only disbursed once approved by members.", "Tổng tiền hiện có trong quỹ của nhóm": "Total funds currently available in group", "Số tiền muốn góp": "Amount to contribute", "Đóng góp của thành viên": "Member contributions", "Đây là tiền góp vào quỹ chung, được theo dõi riêng và không cộng vào tổng chi tiêu.": "This is money paid into the shared fund. It is tracked separately and not added to total spending.", "Kết nối ví để tải số tiền từng thành viên đã góp.": "Connect a wallet to load how much each member has contributed.", "Yêu cầu hoàn tiền từ các khoản chi": "Refund requests from expenses", "• Két sắt riêng của nhóm": "• Group isolated vault", "Két sắt riêng của nhóm": "Group isolated vault", "Trạng thái: Chưa kết nối ví điện tử": "Status: No wallet connected", "Core Wallet hoặc MetaMask": "Core Wallet or MetaMask", "Tự động tính số tiền VNĐ tương đương": "Automatically calculates the equivalent amount in VND", "Vui lòng nhập số tiền muốn góp vào quỹ!": "Please enter the amount to contribute to the vault!", "⏳ Đang chuyển tiền vào két sắt riêng của nhóm, vui lòng xác nhận trên ví...": "⏳ Transferring funds to the group isolated vault, please confirm in your wallet...", "✅ Đã góp": "✅ Contributed", "vào quỹ nhóm!": "to the group fund!", "Xem biên lai công khai ↗": "View public receipt ↗", "Góp quỹ thành công!": "Vault contribution succeeded!", "❌ Giao dịch chưa hoàn tất:": "❌ Transaction not completed:", "Vui lòng nhập đầy đủ nội dung khoản chi và số tiền!": "Please enter both the expense description and amount!", "⏳ Đang niêm phong hóa đơn và gửi yêu cầu duyệt chi...": "⏳ Sealing receipt and submitting spending approval request...", "✅ Đã tạo yêu cầu rút quỹ": "✅ Withdrawal request created", "và niêm phong hóa đơn!": "and receipt sealed!", "Mã chống sửa đổi:": "Tamper-proof hash:", "Đã tạo yêu cầu chi tiêu và khóa hóa đơn!": "Created spending request and sealed receipt!", "❌ Không thể tạo yêu cầu:": "❌ Could not create the request:", "⏳ Đang xác nhận đồng ý chi cho khoản #": "⏳ Confirming approval for item #", "✅ Bạn đã xác nhận đồng ý cho khoản #": "✅ You approved item #", "❌ Lỗi xác nhận:": "❌ Approval error:", "⏳ Đang chuyển tiền cho yêu cầu #": "⏳ Sending money for request #", "✅ Đã chuyển tiền cho yêu cầu #": "✅ Money sent for request #", "Xem giao dịch ↗": "View transaction ↗", "❌ Chưa thể chuyển tiền:": "❌ Could not send the money yet:", "Chưa có thành viên.": "No members yet.", "Không tìm thấy hóa đơn này!": "Receipt not found!", "Niêm phong hóa đơn": "Seal receipt", ") lên blockchain?": ") on the blockchain?", "Chỉ ghi mã chống sửa đổi, KHÔNG rút tiền từ quỹ. Bạn cần là thành viên đã góp quỹ của nhóm": "This only records an anti-tampering code and does NOT withdraw money from the fund. You must be a member who has contributed to the group fund", "Lưu ý: thao tác này tạo một YÊU CẦU RÚT": "Note: this action creates a WITHDRAWAL REQUEST for", "AVAX từ quỹ về ví của bạn. Tiền chỉ được chi khi đủ thành viên bấm": "AVAX from the fund to your wallet. Money is only spent when enough members press", "Đồng ý chi": "Approve", "⏳ Đang kết nối ví và niêm phong hóa đơn...": "⏳ Connecting wallet and sealing receipt...", "✅ Đã niêm phong hóa đơn #": "✅ Receipt sealed #", "lên Quỹ chung!": "on the Shared Fund!", "Không thể niêm phong hóa đơn:": "Could not seal receipt:", "⏳ Đang kiểm tra niêm phong trên blockchain...": "⏳ Verifying seal on the blockchain...", "✅ Mã hóa đơn trên blockchain khớp với bản đã niêm phong.": "✅ Receipt hash on the blockchain matches the sealed version.", "❌ Mã hóa đơn trên blockchain KHÔNG khớp.": "❌ Receipt hash on the blockchain DOES NOT match.", "ℹ️ Hóa đơn này được niêm phong bằng phiên bản cũ nên không lưu dữ liệu gốc, chưa đối chiếu được với hóa đơn hiện tại.": "ℹ️ This receipt was sealed with an older version without stored payload data, so it cannot be compared against the current receipt.", "✅ Dữ liệu gốc đã lưu đúng với mã trên blockchain.": "✅ Stored original data matches the hash on the blockchain.", "❌ Dữ liệu gốc đã lưu đã bị thay đổi.": "❌ Stored original data has been modified.", "✅ Hóa đơn hiện tại trùng với lúc niêm phong.": "✅ Current receipt matches the sealed version.", "⚠️ Hóa đơn hiện tại đã bị sửa sau khi niêm phong (cửa hàng, ngày, số tiền, danh mục hoặc món).": "⚠️ Current receipt was modified after sealing (shop, date, amount, category, or items).", "Không kiểm tra được:": "Could not verify:", "Cần contract V2 để niêm phong mà không tạo yêu cầu rút quỹ": "Contract V2 is required to seal without creating a withdrawal request", "Đã gửi giao dịch nhưng chưa tìm thấy mã niêm phong. Hãy kiểm tra trên Snowtrace.": "Transaction sent, but the seal ID was not found yet. Check on Snowtrace.", "Giao dịch đã gửi nhưng chưa tìm thấy yêu cầu trên hợp đồng. Hãy làm mới và kiểm tra lại trên Snowtrace.": "Transaction sent, but the request was not found on the contract yet. Refresh and check on Snowtrace.", "Thiếu dữ liệu niêm phong": "Missing seal data", "Nhóm": "Group", "chưa có yêu cầu rút quỹ nào được tạo.": "has no withdrawal requests yet.", "Người nhận:": "Recipient:", "• Mã hóa đơn:": "• Receipt code:", "• Đã duyệt:": "• Approved:", "✅ Đã chi tiền": "✅ Paid", "💸 Quỹ đã đủ · Chuyển tiền": "💸 Fund is enough · Send money", "👍 Đồng ý chi": "👍 Approve spending", "✅ Quỹ đã chi": "✅ Paid from vault", "⏳ Chờ duyệt": "⏳ Awaiting approval", "🔐 Đã niêm phong quỹ · Kiểm tra": "🔐 Sealed on the fund · Verify", "🔐 Biên lai #": "🔐 Receipt #", "lên Quỹ chung của nhóm": "to the group's Shared Fund", "lên blockchain?": "on the blockchain?", "từ quỹ nhóm": "from the group fund", "lên Quỹ chung": "on the Shared Fund", "💸 Đề nghị hoàn từ quỹ #": "💸 Refund request from the fund #", "💸 Đề nghị hoàn từ quỹ": "💸 Request refund from the fund", "Giao dịch ↗": "Transaction ↗", "Quỹ nhóm có thể hoàn tiền khoản này cho người đã mua.": "The group fund can refund this expense to the person who paid.", "Cần contract V2 để dùng tính năng này.": "Contract V2 is required for this feature.", "Không tìm thấy khoản chi này!": "Expense not found!", "Khoản chi này chưa đồng bộ lên máy chủ. Hãy tải lại trang rồi thử lại.": "This expense has not synced to the server yet. Reload the page and try again.", "Khoản chi này đã có đề nghị hoàn từ quỹ.": "A reimbursement request has already been created for this expense.", "người mua": "buyer", "chưa lưu địa chỉ ví. Nhờ": "has not saved a wallet address. Ask", "vào mục": "to go to", "để nhập ví Avalanche rồi thử lại.": "to enter an Avalanche wallet, then try again.", "Đề nghị hoàn": "Request a refund of", ") từ quỹ nhóm": ") from the group fund", "về ví": "to the wallet", "của": "of", "Tiền chỉ được chuyển khi đa số thành viên đã góp quỹ bấm": "Money is only sent when most members who contributed to the fund press", "⏳ Đang kết nối ví và gửi đề nghị...": "⏳ Connecting wallet and submitting reimbursement request...", "Ví đang kết nối chưa góp tối thiểu 0.01 AVAX cho nhóm này nên chưa thể tạo đề nghị. Hãy góp quỹ ở mục Quỹ chung trước.": "The connected wallet has not contributed at least 0.01 AVAX to this group yet, so it cannot create a request. Contribute to the vault under Shared Vault first.", "Quỹ nhóm hiện có": "The group fund currently has", "AVAX, chưa đủ để hoàn": "AVAX, not enough to refund", "AVAX. Hãy góp thêm quỹ rồi thử lại.": "AVAX. Add more to the fund and try again.", "Hoàn tiền:": "Refund:", "Giao dịch đã lên blockchain nhưng trạng thái chưa lưu được lên máy chủ. Bản này đang được giữ tạm trên thiết bị": "The transaction is on the blockchain but its status could not be saved to the server. It is kept temporarily on this device", "đừng gửi lại yêu cầu. Hãy chạy schema_groups_secure.sql rồi kiểm tra khoản chi.": "do not send the request again. Run schema_groups_secure.sql, then check the expense.", "✅ Đã tạo đề nghị hoàn #": "✅ Refund request created #", ". Các thành viên cần bấm": ". Members need to press", "ở mục Quỹ chung.": "in the Shared Fund section.", "Không thể tạo đề nghị hoàn:": "Could not create reimbursement request:", "Lưu avax_reimburse:": "Saving avax_reimburse:", "Đã gửi yêu cầu lên blockchain nhưng chưa lưu được vào hệ thống (thiếu cột avax_reimburse, hãy chạy schema_groups_secure.sql).": "Request was sent to the blockchain but could not be saved to the database (missing avax_reimburse column; run schema_groups_secure.sql).", "đã vượt ngân sách (ngân sách 0 đ)": "is over budget (budget 0 VND)", "đã vượt ngân sách (": "is over budget (", "đã vượt ngân sách": "is over budget", "đã dùng": "has used", "ngân sách": "budget", "Đặt ngân sách cho từng danh mục trong tháng": "Set a budget for each category in month", "Mức đã dùng (Biểu đồ tròn)": "Amount used (Pie chart)", "⚠️ Cảnh báo giới hạn ngân sách nhóm:": "⚠️ Group budget limit warning:", "Tổng chi tiêu nhóm đã vượt giới hạn ngân sách tháng (": "Total group spending has exceeded the monthly budget limit (", "⚠️ Vượt hạn mức danh mục nhóm:": "⚠️ Group category limit exceeded:", "🔔 Sắp chạm ngưỡng ngân sách (": "🔔 Approaching the budget threshold (", "Tổng chi tiêu nhóm (T": "Group spending (M", "Đóng góp chi tiêu từng thành viên (Tháng": "Member spending contributions (Month", "Mức đã dùng của nhóm (Tháng": "Group budget usage (Month", "Giới hạn tối đa mỗi danh mục:": "Maximum limit per category:", ". Hệ thống tự động cảnh báo khi chi tiêu chạm ngưỡng.": ". The system warns automatically when spending reaches the threshold.", "Chi tiêu tháng": "Spending in month", "So với T": "vs M", "🏆 Chi tiêu nhiều nhất (T": "🏆 Top spender (M", "Số giao dịch T": "Transactions M", "/lần": "/tx", "Bảng xếp hạng chi tiêu thành viên (T": "Member spending ranking (M", "Danh sách thành viên & Phân quyền (": "Members & Permissions (", "Cài đặt thông báo riêng cho nhóm": "Notification settings for this group", "Khi rời nhóm, bạn sẽ không còn xem hoặc thêm khoản chi chung trong nhóm": "When you leave the group, you can no longer view or add shared expenses in it", ". Dữ liệu ví cá nhân của bạn không bị ảnh hưởng.": ". Your personal wallet data is not affected.", "👥 Thành viên (": "👥 Members (", "👥 Danh sách nhóm của bạn (": "👥 Your groups (", "Mã nhóm:": "Group code:", "BÁO CÁO QUẢN TRỊ TÀI CHÍNH CÁ NHÂN (12 THÁNG)": "PERSONAL FINANCIAL MANAGEMENT REPORT (12 MONTHS)", "BÁO CÁO QUẢN TRỊ TÀI CHÍNH CÁ NHÂN": "PERSONAL FINANCIAL MANAGEMENT REPORT", "12 THÁNG": "12 MONTHS", "Kỳ báo cáo: Tháng": "Reporting period: Month", "(Lũy kế 12 tháng: T": "(12-month cumulative: M", "Mã chứng từ:": "Document ID:", "Ngày lập:": "Prepared on:", "Đơn vị tính:": "Unit:", "VNĐ": "VND", "Phân tích P&L cá nhân, Budget Variance & Burn Rate — Tháng": "Personal P&L, Budget Variance & Burn Rate analysis — Month", "Chi tiêu kỳ này (T": "Spending this period (M", "so với T": "vs M", "Lũy kế 12 tháng (LTM)": "12-Month Cumulative (LTM)", "Bình quân:": "Average:", "/tháng": "/month", "Budget Variance (Chênh lệch NS)": "Budget Variance", "Cash Runway (Sức chịu đựng)": "Cash Runway", "/ngày": "/day", "Định phí:": "Fixed Cost:", "• Biến phí:": "• Variable cost:", "Đầu tư Học tập:": "Study CAPEX:", "/ Tổng chi": "/ Total spend", "Pareto 80/20 (Top 3 Danh mục)": "Pareto 80/20 (Top 3 Categories)", "Phân loại": "Classification", "Thực chi T": "Actual spend M", "Ngân sách (Budget)": "Budget", "NGƯỜI LẬP BÁO CÁO": "REPORT PREPARED BY", "(Ký và ghi rõ họ tên)": "(Sign and print full name)", "Sinh viên thực hiện": "Student", "XÁC NHẬN / GHI CHÚ QUẢN TRỊ": "CONFIRMATION / MANAGEMENT NOTES", "Chỉ được chọn ngày trong năm": "Dates must be within the year", "Số tiền không được nhỏ hơn tổng các món đã chi tiết (": "Amount cannot be below the itemised total (", "Số tiền vượt phần còn lại của hóa đơn (": "Amount exceeds what is left on this receipt (", "Đang đọc chữ bằng OCR dự phòng (lần đầu có thể mất vài phút)…": "Reading text with backup OCR (the first run may take a few minutes)…", "Đang nhận dạng chữ…": "Recognizing text…", "Đã quét xong. Kiểm tra lại thông tin bên phải.": "Scan finished. Check the details on the right.", "Đang phân tích hóa đơn nhóm…": "Analyzing group receipt…", "✓ AI đã đọc xong hóa đơn! Kiểm tra lại từng món bên phải.": "✓ AI finished reading the receipt! Check each item on the right.", "Không tải được bộ nhận dạng chữ.": "Could not load the text recognition engine.", "Đang đọc chữ bằng OCR…": "Reading text with OCR…", "Đã quét xong. Kiểm tra lại bên phải.": "Scan finished. Check the details on the right.", "Không đọc được hóa đơn.": "Could not read the receipt.", "Hóa đơn nhóm": "Group receipt", "💾 Lưu vào chi tiêu nhóm": "💾 Save to group spending", "Chưa lưu được hóa đơn vào chi tiêu nhóm.": "Could not save receipt to group spending.", "Đã lưu hóa đơn quét vào chi tiêu nhóm!": "Saved scanned receipt to group spending!", "hóa đơn nhóm (Bấm vào từng dòng để xem & sửa chi tiết từng món)": "group receipts (Click each row to view & edit items)", "Bạn chỉ được sửa tối đa 3 lần cho mỗi hóa đơn (còn": "You can edit each receipt at most 3 times (", "lần).": "left).", "✏️ Sửa (còn": "✏️ Edit (", "lần)": "left)", "Đã lưu thay đổi hóa đơn nhóm (": "Saved group expense changes (", "/3 lần sửa).": "/3 edits).", "/3 lần sửa)": "/3 edits)", "/3 lần": "/3 times", "Số tiền món không hợp lệ hoặc vượt quá tổng hóa đơn.": "Invalid item amount or exceeds receipt total.", "Đã lưu ngân sách": "Budget saved", "Đã lưu tùy chọn thông báo nhóm.": "Group notification preferences saved.", "Bạn đang là trưởng nhóm. Nếu rời nhóm mà không còn trưởng nhóm khác, nhóm có thể bị giải tán hoặc chuyển quyền. Bạn có chắc muốn rời nhóm": "You are the group leader. If you leave and there is no other leader, the group may be dissolved or transferred. Are you sure you want to leave the group", "Bạn có chắc chắn muốn rời khỏi nhóm": "Are you sure you want to leave the group", "Bạn đã rời khỏi nhóm.": "You have left the group.", "Nhập tên nhóm.": "Enter a group name.", "Chưa kết nối máy chủ.": "Not connected to the server.", "Lỗi tạo nhóm:": "Error creating the group:", "Đã tạo nhóm": "Group created", "Nhập mã nhóm.": "Enter a group code.", "Không tìm thấy nhóm với mã này.": "No group found with this code.", "Bạn đã ở trong nhóm này rồi.": "You are already in this group.", "Không thể tham gia nhóm:": "Could not join the group:", "Đã tham gia nhóm": "Joined the group", "(Quyền mặc định: Chỉ được xem)": "(Default permission: View only)", "Nhập mã riêng của người dùng.": "Enter the user’s personal code.", "Không tìm thấy người dùng có mã": "No user found with code", "Người dùng này đã có trong nhóm.": "This user is already in the group.", "Lỗi thêm thành viên:": "Error adding member:", "Đã thêm": "Added", "vào nhóm (Mặc định: Chỉ được xem)": "to the group (Default: View only)", "Chỉ trưởng nhóm mới có quyền phân quyền.": "Only the group leader can manage permissions.", "Đã cấp quyền Chỉnh sửa cho thành viên.": "Granted Edit permission to member.", "Đã chuyển thành viên về quyền Chỉ được xem.": "Set member to View only permission.", "Xóa thành viên này khỏi nhóm?": "Remove this member from the group?", "Đã xóa thành viên khỏi nhóm.": "Removed member from group.", "Bạn chỉ có quyền xem trong nhóm này.": "You only have view permission in this group.", "Đã xác nhận: Đã chi!": "Confirmed: Paid!", "Đã chuyển trạng thái: Chưa chi.": "Status changed: Not paid yet.", "Không lưu được lên máy chủ. Kiểm tra mạng hoặc quyền của bạn trong nhóm rồi thử lại.": "Could not save to server. Check your network or your group permissions and try again.", "Chưa lưu được khoản chi nhóm lên máy chủ.": "Could not save group expense to server.", "Đã lưu khoản chi riêng của nhóm!": "Saved group expense!", "Đã xóa khoản chi nhóm.": "Deleted group expense.", "Đã cập nhật giới hạn ngân sách nhóm.": "Updated group budget limit.", "Đã lưu ngưỡng cảnh báo ngân sách nhóm (": "Saved group budget alert threshold (", "Nhập tên danh mục ngân sách.": "Enter a budget category name.", "Danh mục ngân sách này đã tồn tại trong nhóm.": "This budget category already exists in the group.", "Giới hạn ngân sách tối đa mỗi danh mục là 50.000.000.000 đ.": "The maximum budget limit per category is 50.000.000.000 VND.", "Đã thêm ngân sách nhóm:": "Group budget added:", "Cần giữ ít nhất một danh mục ngân sách nhóm.": "At least one group budget category must remain.", "Xóa danh mục ngân sách": "Delete budget category", "khỏi nhóm?": "from the group?", "Đã xóa ngân sách nhóm.": "Deleted group budget.", "Xóa nhóm này? Toàn bộ dữ liệu riêng của nhóm sẽ bị xóa, dữ liệu cá nhân của bạn không bị ảnh hưởng.": "Delete this group? All of the group's own data will be deleted. Your personal data is not affected.", "Không thể xóa nhóm:": "Could not delete the group:", "Đã xóa nhóm thành công!": "Group deleted successfully!", "Lỗi profiles:": "Profiles error:", "Lỗi budgets:": "Budgets error:", "Lỗi expenses:": "Expenses error:", "Lỗi notifications:": "Notifications error:", "Lỗi tải dữ liệu:": "Error loading data:", "Lỗi khởi động:": "Startup error:", "Cài ứng dụng lên màn hình chính": "Install app on home screen", "Trên iPhone: mở bằng Safari, bấm nút Chia sẻ rồi chọn": "On iPhone: open in Safari, tap the Share button, then choose", "Thêm vào Màn hình chính": "Add to Home Screen", "Nhóm chi tiêu": "Expense group", "Tài khoản": "Account", "👤 Tài khoản của tôi": "👤 My account", "Thông tin cá nhân": "Personal information", "Họ và tên mới": "New full name", "Lưu tên": "Save name", "Đổi email": "Change email", "Email mới": "New email", "Gửi liên kết xác nhận": "Send confirmation link", "Mật khẩu hiện tại": "Current password", "Đóng": "Close", "Hủy": "Cancel", "Đã cập nhật họ và tên.": "Name updated.", "Mật khẩu hiện tại không đúng.": "Current password is incorrect.", "Nhập mật khẩu hiện tại.": "Enter your current password.", "Đã đổi mật khẩu.": "Password changed.", "Email mới phải khác email hiện tại.": "The new email must be different from your current email.", "Đã gửi liên kết xác nhận tới email mới (và có thể cả email cũ). Hãy mở liên kết để hoàn tất đổi email.": "A confirmation link was sent to the new email (and possibly the old one too). Open the link to finish changing your email.", "Email hiện tại:": "Current email:", "Email": "Email", "Nhập mật khẩu mới ít nhất 6 ký tự.": "Enter a new password of at least 6 characters.", "Mã xác nhận (6 số)": "Verification code (6 digits)", "Nhập mã trong email": "Enter the code from your email", "Nhập mã xác nhận trong email.": "Enter the verification code from the email.", "Mã không đúng hoặc đã hết hạn. Hãy gửi lại.": "The code is incorrect or expired. Request a new one.", "Liên kết không mở được? Nhập mã trong email để đặt lại mật khẩu.": "Link not working? Enter the code from your email to reset your password.", "Đặt lại mật khẩu": "Reset password", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy gửi lại liên kết mới.": "The password reset link is invalid or expired. Request a new link.", "Lưu ý: nếu bạn dùng cùng lúc 2 thiết bị, hãy mở liên kết trên thiết bị đã yêu cầu.": "Note: open the link on the device where you requested it.", "Kết quả quét bằng AI Vision": "AI Vision scan result", "Đây là kết quả đã lưu của đúng ảnh này, nên luôn giống lần quét trước.": "This is the saved result for this exact photo, so it always matches the previous scan.", "Quét lại ảnh này": "Rescan this photo", "⚠️ AI Vision không phản hồi, đã dùng OCR dự phòng (độ chính xác thấp hơn). Hãy kiểm tra kỹ từng dòng.": "⚠️ AI Vision did not respond, so backup OCR was used (lower accuracy). Check every line carefully.", "Đã quét xong bằng OCR dự phòng. Kiểm tra kỹ thông tin bên phải.": "Scan finished with the backup OCR. Check the details on the right carefully.", "Chọn ảnh đại diện": "Choose profile picture", "Đổi ảnh đại diện": "Change profile picture", "Họ và tên": "Full name", "Mật khẩu mới": "New password", "Nhập lại mật khẩu mới": "Re-enter new password", "Chọn ảnh JPG, PNG hoặc WebP.": "Choose a JPG, PNG, or WebP image.", "Ảnh tối đa 8 MB.": "Image must be 8 MB or smaller.", "Đang xử lý ảnh…": "Processing image…", "Đã lưu ảnh đại diện.": "Profile picture saved.", "Không lưu được ảnh đại diện.": "Could not save the profile picture.", "Không tìm thấy hồ sơ user_profiles để cập nhật.": "Could not find your profile record to update.", "Nhập họ và tên.": "Enter your full name.", "Email hoặc mật khẩu không đúng.": "Email or password is incorrect.", "Email chưa đúng định dạng.": "Enter a valid email address.", "Mật khẩu mới cần ít nhất 6 ký tự.": "The new password must be at least 6 characters.", "Hai mật khẩu không khớp.": "The passwords do not match.", "Mật khẩu mới phải khác mật khẩu cũ.": "The new password must be different from the old password.", "Quét hóa đơn": "Scan receipt", "Tải ảnh hóa đơn, AI đọc thông tin, tách từng món và gợi ý danh mục tự động. Bạn có thể sửa trước khi lưu.": "Upload a receipt photo. AI reads it, separates items, and suggests categories. Review and edit before saving.", "1. Tải ảnh lên": "1. Upload a photo", "2. Kiểm tra và chỉnh sửa": "2. Review and edit", "Chọn, chụp hoặc kéo thả ảnh hóa đơn (JPG, PNG)": "Choose, take, or drop a receipt photo (JPG, PNG)", "Chụp ảnh": "Take a photo", "Chọn từ thư viện": "Choose from library", "Đang phân tích hóa đơn…": "Analyzing receipt…", "Đang quét thông minh bằng AI Vision…": "Scanning with AI Vision…", "Không tải được bộ nhận dạng chữ. Kiểm tra mạng rồi tải lại trang.": "Could not load the text recognition engine. Check your connection and reload.", "Không đọc được hóa đơn. Thử ảnh khác hoặc nhập tay.": "Could not read the receipt. Try another photo or enter it manually.", "✓ AI đã đọc xong hóa đơn! Kiểm tra lại thông tin bên phải.": "✓ AI finished reading the receipt. Review the details on the right.", "Cửa hàng": "Store", "Tổng tiền (đ)": "Total (VND)", "Danh mục chính (dùng khi không chia món)": "Main category (used when items are not split)", "Ngày": "Date", "Chi tiết từng món (tùy chọn)": "Item details (optional)", "Tên món (VD: Rau)": "Item name (e.g. vegetables)", "Số tiền": "Amount", "Danh mục món": "Item category", "+ Chi tiết": "+ Details", "Lưu hóa đơn": "Save receipt", "Phí, thuế và khác": "Fees, tax, and other", "Hóa đơn đã tải": "Uploaded receipt", "Quên mật khẩu?": "Forgot password?", "Quay lại đăng nhập": "Back to sign in", "Gửi liên kết đặt lại mật khẩu": "Send password reset link", "Đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra email của bạn, kể cả thư rác.": "Password reset link sent. Check your inbox and spam folder.", "Đặt mật khẩu mới": "Set a new password", "Đăng nhập": "Sign in", "Đăng ký": "Sign up", "Tạo tài khoản": "Create account", "Email sinh viên": "Student email", "Thêm khoản chi": "Add expense", "Thêm": "Add", "Lưu": "Save", "Xóa": "Delete", "Làm mới": "Refresh", "Chưa có dữ liệu": "No data yet", "Chưa có giao dịch": "No transactions yet", "Đang tải…": "Loading…", "Không thể kết nối. Kiểm tra mạng và thử lại.": "Could not connect. Check your connection and try again.", "Thử quá nhiều lần. Hãy đợi một lúc rồi thử lại.": "Too many attempts. Wait a while and try again.", "Đã có lỗi xảy ra. Thử lại sau.": "Something went wrong. Try again later.", "Ngân sách": "Budget", "Báo cáo": "Reports", "Lịch sử chi tiêu": "Spending history", "Tổng quan": "Overview", "Thông báo": "Notifications", "Nhóm & Chia sẻ": "Groups & Sharing", "Cài đặt": "Settings", "Tháng này": "This month", "Tổng chi": "Total spend", "Đã chi": "Paid", "Chưa chi": "Unpaid", "Mã nhóm": "Group code", "Tên nhóm": "Group name", "Tạo nhóm": "Create group", "Tham gia nhóm": "Join group", "Mã riêng của bạn": "Your personal code", "Sao chép mã của tôi": "Copy my code", "Thêm vào nhóm": "Add to group", "Lưu thay đổi": "Save changes", "Chọn ngày chi tiêu.": "Choose an expense date.", "Hãy kiểm tra kỹ từng dòng.": "Review every line carefully.", "Đang quét hóa đơn bằng AI…": "Scanning receipt with AI…", "AI không đọc được nội dung hóa đơn": "AI could not read the receipt content", "Tổng các dòng không khớp tổng hóa đơn": "Itemized lines do not match the receipt total", "Số tiền AI trả về vượt giới hạn hợp lệ": "Amount returned by AI exceeds the valid limit", "Không kết nối được dịch vụ AI": "Could not connect to the AI service", "Dịch vụ AI chưa phản hồi": "AI service did not respond", "Chưa kết nối dịch vụ": "Service not connected", "không rõ nguyên nhân": "unknown reason", "Chưa kết nối dịch vụ tài khoản.": "Account service is not connected.", "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.": "Your session has expired. Please sign in again.", "Không mở được cửa sổ tài khoản:": "Could not open account dialog:", "Lỗi không xác định": "Unknown error", "Ảnh đại diện": "Avatar", "Liên kết đặt lại chưa được xác nhận. Hãy mở lại email trên cùng trình duyệt hoặc gửi mã xác nhận.": "Reset link is not verified yet. Re-open the email in the same browser or request a verification code.", "Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.": "Password changed. Please sign in with your new password.", "Số tiền (đ)": "Amount (VND)", "(Vượt!)": "(Over!)", "(chưa lưu ví)": "(no wallet saved)", "Quy đổi tham khảo:": "Reference conversion:", "Đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra hộp thư (kể cả thư rác) và bấm vào liên kết trong email.": "Password reset link sent. Check your inbox (including spam) and click the link in the email.", "Nhập mật khẩu mới cho tài khoản của bạn.": "Enter a new password for your account.", "Hủy và quay lại đăng nhập": "Cancel and return to sign in", "Liên kết đặt lại chưa được xác nhận hoặc đã hết hạn. Hãy mở liên kết trong email trên cùng trình duyệt đã yêu cầu.": "Reset link is not verified or has expired. Open the link from your email in the same browser where you requested it.", "🐞 Báo lỗi / Góp ý": "🐞 Report a bug / Feedback", "🐞 Báo lỗi / Góp ý cho nhà phát triển": "🐞 Report a bug / Feedback to developer", "Báo lỗi / Góp ý": "Report a bug / Feedback", "Phản hồi của bạn sẽ mở ứng dụng Email với đầy đủ thông tin kỹ thuật đính kèm sẵn.": "Your feedback will open your Email app with diagnostic details pre-filled.", "Loại phản hồi": "Feedback category", "Lỗi chức năng / Nút bấm": "Feature / Button bug", "Lỗi quét hóa đơn AI / OCR": "AI / OCR receipt scan issue", "Lỗi đăng nhập / Quên mật khẩu": "Sign in / Password reset issue", "Lỗi nhóm & Quỹ Avalanche": "Group & Avalanche vault issue", "Lỗi giao diện / Ngôn ngữ": "UI / Language issue", "Góp ý tính năng mới": "Feature request / Suggestion", "Mô tả chi tiết": "Detailed description", "Bạn đang thao tác ở mục nào và gặp hiện tượng gì?": "Which screen were you using and what happened?", "✉️ Mở Email gửi ngay": "✉️ Open Email to send", "📋 Sao chép": "📋 Copy", "Vui lòng nhập mô tả ngắn trước khi gửi.": "Please enter a brief description before sending.", "Đang mở ứng dụng Email với nội dung báo lỗi sẵn...": "Opening your Email app with the bug report pre-filled...", "Đã sao chép nội dung báo lỗi. Bạn có thể dán vào Gmail hoặc Zalo.": "Bug report copied to clipboard. You can paste it into Gmail or Zalo.", "Không tự sao chép được. Hãy bôi đen và copy thủ công.": "Could not copy automatically. Please select and copy manually.", "Gửi nhanh qua biểu mẫu Google Form trực tuyến hoặc mở Email đính kèm sẵn thông tin kỹ thuật.": "Submit quickly via the online Google Form or open your Email app with diagnostic details pre-filled.", "📝 Mở Google Form góp ý (tự sao chép chi tiết)": "📝 Open Google Form feedback (auto-copies details)", "✉️ Gửi qua Email": "✉️ Send via Email", "Đã mở Google Form và tự động sao chép chi tiết lỗi để bạn dán vào biểu mẫu.": "Google Form opened and bug details copied to clipboard so you can paste them right in.", "Đã mở Google Form góp ý trong tab mới.": "Feedback Google Form opened in a new tab.", "Đã sao chép nội dung báo lỗi. Bạn có thể dán vào Google Form hoặc Email.": "Bug report copied to clipboard. You can paste it into the Google Form or Email.", "Gửi nhanh qua biểu mẫu Google Form trực tuyến hoặc mở Gmail soạn sẵn thông tin kỹ thuật.": "Submit quickly via the online Google Form or open Gmail with diagnostic details pre-filled.", "✉️ Gửi qua Gmail": "✉️ Send via Gmail", "Đang mở Gmail với nội dung báo lỗi soạn sẵn...": "Opening Gmail with the bug report pre-filled...", "Biểu đồ chi tiêu 12 tháng": "12-month spending chart", "Biểu đồ tròn chi tiêu theo danh mục": "Category spending pie chart", "Bấm để kiểm tra niêm phong": "Click to verify seal", "Thành viên mua": "Buyer", "Chi tiết từng món (": "Itemised breakdown (", "Thông tin đính kèm tự động:": "Auto-attached diagnostic info:", "Chưa đăng nhập": "Not signed in", "Cốc Cốc": "Coc Coc", "Báo lỗi": "Bug report", "(Chưa nhập mô tả)": "(No description entered)", "Đã nhận diện": "Recognized", "món, danh mục được gợi ý cho từng món. Bạn có thể sửa hoặc bấm + Chi tiết để thêm món.": "items, with suggested categories for each. You can edit them or click + Details to add more.", "món. Bạn có thể sửa từng món hoặc bấm + Chi tiết để thêm món.": "items. You can edit each item or click + Details to add more.", "Thêm món vào hóa đơn này": "Add an item to this receipt", "Phiên bản": "Version", "Trang": "Page", "Ngôn ngữ": "Language", "Bạn đang là trưởng nhóm. Nếu rời nhóm mà không còn trưởng nhóm khác, nhóm có thể bị giải tán hoặc chuyển quyền. Bạn có chắc muốn rời nhóm \"": "You are the group leader. If you leave without another leader, the group may be disbanded or leadership transferred. Are you sure you want to leave group \"", "Bạn có chắc chắn muốn rời khỏi nhóm \"": "Are you sure you want to leave group \"", "Xóa danh mục ngân sách \"": "Delete budget category \"", "Đã tạo nhóm \"": "Created group \"", "Đã tham gia nhóm \"": "Joined group \"", "Đã thêm ": "Added ", " vào nhóm (Mặc định: Chỉ được xem)": " to the group (Default: View only)", "Không tìm thấy người dùng có mã ": "No user found with code ", "Đã thêm ngân sách nhóm: ": "Added group budget: ", "Hóa đơn này đã hết lượt sửa (3/3).": "This receipt has reached the edit limit (3/3).", "Hóa đơn nhóm này đã hết lượt sửa (3/3) nên không thể xóa.": "This group receipt has reached the edit limit (3/3) and cannot be deleted.", "Xóa khoản chi này khỏi nhóm? Việc xóa tính là 1 lần sửa.": "Delete this expense from the group? Deleting counts as 1 edit.", "Hóa đơn này chưa được niêm phong.": "This receipt has not been sealed yet.", "Đã cập nhật tỷ giá quy đổi: 1 AVAX =": "Updated reference exchange rate: 1 AVAX =", "Đã kết nối ví": "Wallet connected", "Kết nối ví của bạn": "Connect your wallet",
  "QUỸ CHUNG CHUYỂN KHOẢN NGÂN HÀNG": "BANK TRANSFER SHARED FUND",
  "Tài khoản ngân hàng nhận quỹ của nhóm (Thủ quỹ / Trưởng nhóm):": "Group receiving bank account (Treasurer / Leader):",
  "Tài khoản ngân hàng của bạn (để nhận tiền hoàn từ quỹ nhóm qua VietQR)": "Your bank account (to receive VietQR reimbursements from group fund)",
  "Số tài khoản nhận quỹ": "Receiving account number",
  "Tên chủ tài khoản (không dấu)": "Account holder name (no accents)",
  "Lưu TK nhận quỹ": "Save Fund Account",
  "Lưu tài khoản": "Save Account",
  "1. Số dư quỹ nhóm & Nạp tiền qua VietQR": "1. Group Fund Balance & Deposit via VietQR",
  "2. Kế hoạch khóa quỹ sinh lãi & Giải ngân định kỳ": "2. Treasury Lock Yield & Periodic Disbursement Plan",
  "Số tiền muốn nạp vào quỹ (VNĐ)": "Amount to deposit into fund (VND)",
  "Tạo mã QR chuyển khoản": "Generate Bank Transfer QR",
  "Quét mã VietQR bằng App Ngân hàng bất kỳ": "Scan VietQR with any Banking App",
  "Tôi đã chuyển khoản xong": "I have completed the transfer",
  "Duyệt đã nhận tiền": "Approve Received Funds",
  "Đã vào quỹ": "Deposited",
  "Chờ trưởng nhóm duyệt": "Pending leader approval",
  "Đề nghị hoàn tiền từ quỹ": "Request Fund Reimbursement",
  "Quét QR hoàn tiền": "Scan QR to Reimburse",
  "Xác nhận đã chuyển hoàn": "Confirm Reimbursement Paid",
  "Khóa đối soát hóa đơn": "Lock Receipt Verification",
  "Đã khóa đối soát": "Receipt Locked", "Giao dịch đã lên blockchain nhưng trạng thái chưa lưu được lên máy chủ. Bản này đang được giữ tạm trên thiết bị; đừng gửi lại yêu cầu. Hãy chạy schema_groups_secure.sql rồi kiểm tra khoản chi.": "The transaction is on the blockchain, but its status could not be saved to the server. It is kept temporarily on this device; do not resend. Run schema_groups_secure.sql and check the expense.", "Chưa có yêu cầu rút quỹ nào được tạo.": "No withdrawal requests have been created yet.", "Mã hóa đơn:": "Receipt hash:", "Đã duyệt:": "Approved:", "Amount used (Biểu đồ tròn)": "Amount used (Pie chart)", "Biểu đồ tròn": "Pie chart", "Đang quét hóa đơn bằng AI...": "Scanning receipt with AI...", "Báo cáo tài chính 12 tháng": "12-Month Financial Report", "Phân tích P&L cá nhân, Budget Variance & Burn Rate": "Personal P&L Analysis, Budget Variance & Burn Rate", "Chi tiêu kỳ này": "Current Period Spend", "so với": "vs.", "Unfavorable (Vượt NS)": "Unfavorable (Over Budget)", "Favorable (Đạt NS)": "Favorable (On Budget)", "ngày": "days", "Chỉ số phân tích tài chính (Business Analytics)": "Financial & Business Analytics", "Biến phí:": "Variable Cost:", "giao dịch": "transactions", "Ticket Size TB:": "Avg. Ticket Size:", "Báo cáo Variance & Cấu trúc chi phí theo danh mục": "Variance & Cost Structure by Category", "Danh mục": "Category", "Thực chi": "Actual", "Tỷ trọng": "Share", "Xu hướng dòng tiền chi ra 12 tháng (LTM Cash Outflow)": "12-Month Cash Outflow Trend (LTM)", "Dùng ví đang kết nối": "Use connected wallet", "Đã lưu:": "Saved:", "Chưa lưu ví. Thành viên khác cần ví của bạn để đề nghị hoàn tiền cho bạn.": "No wallet saved yet. Other members need your wallet to request reimbursements for you.", "Hệ thống tự động cảnh báo khi chi tiêu chạm ngưỡng.": "The system automatically alerts when spending reaches the threshold.", "Quỹ Chung Minh Bạch": "Transparent Shared Vault", "Chưa kết nối ví điện tử (Core Wallet hoặc MetaMask)": "Wallet not connected (Core Wallet or MetaMask)", "🔐 Đăng ký / đồng bộ ví thành viên trên Fuji": "🔐 Register / sync member wallets on Fuji", "Đăng ký / đồng bộ ví thành viên trên Fuji": "Register / sync member wallets on Fuji", "Yêu cầu ví trưởng nhóm và ví đã lưu của các thành viên.": "Requires the group leader wallet and saved member wallets.", "Quy đổi tham khảo: ≈ -- đ": "Reference value: ≈ -- VND", "Phiên bản:": "Version:", "Trang:": "Page:", "Ngôn ngữ:": "Language:", "Tài khoản:": "Account:"},window.I18N_EXTRA||{}),VIC=/[\u00C0-\u1EF9]/,trCache=new Map();let PHR=null;