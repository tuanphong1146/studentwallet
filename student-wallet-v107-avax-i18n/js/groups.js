const gStoreKey=(k)=>'sw_grp_'+k;
function getLocalGrpMeta(){try{return JSON.parse(localStorage.getItem(gStoreKey('meta'))||'{}')}catch(e){return{}}}
function saveLocalGrpMeta(m){try{localStorage.setItem(gStoreKey('meta'),JSON.stringify(m))}catch(e){}}
function getGrpOpts(gid){const m=getLocalGrpMeta();return Object.assign({budget:true,over:true,weekly:true},(m[gid]&&m[gid].opts)||{})}
function setGrpOpt(gid,k,v){const m=getLocalGrpMeta();m[gid]=m[gid]||{perms:{}};m[gid].opts=Object.assign(getGrpOpts(gid),{[k]:!!v});saveLocalGrpMeta(m);flash('Đã lưu tùy chọn thông báo nhóm.')}
async function transferGroupLeadership(gid){
  const grp = myGroups.find(g => g.id === gid);
  if(!grp || grp.owner_id !== uid) return;
  const selEl = document.getElementById('handover_to_' + gid);
  const noteEl = document.getElementById('handover_note_' + gid);
  const targetUid = selEl ? selEl.value : '';
  const targetMem = (grp.members || []).find(m => m.user_id === targetUid);
  if(!targetMem) return flash('Vui lòng chọn thành viên kế nhiệm hợp lệ.');
  const note = (noteEl ? noteEl.value.trim() : '') || 'Bàn giao quyền trưởng nhóm và sổ quỹ nhóm';
  const guard = window.getGroupFundGuard ? window.getGroupFundGuard(gid) : { balance: 0, pendingReimburseCount: 0, pendingDepositsCount: 0 };

  const confirmMsg = `Xác nhận bàn giao quyền Trưởng nhóm & Thủ quỹ "${grp.name}" cho ${targetMem.full_name}?\n`
    + `• Số dư quỹ bàn giao: ${fmtVnd(guard.balance)}\n`
    + `• Sau khi bàn giao, ${targetMem.full_name} sẽ là Trưởng nhóm mới và có quyền duyệt nạp quỹ / hoàn tiền.`;

  ask(confirmMsg, async () => {
    if(window.recordHandoverAudit){
      await window.recordHandoverAudit(gid, {
        fromUid: uid,
        fromName: grp.owner_name || userName || 'Trưởng nhóm cũ',
        toUid: targetMem.user_id,
        toName: targetMem.full_name,
        balanceVnd: guard.balance,
        pendingReimburseCount: guard.pendingReimburseCount,
        pendingDepositsCount: guard.pendingDepositsCount,
        note
      });
    }
    if(sb){
      const upGrp = await sb.from('groups').update({ owner_id: targetMem.user_id }).eq('id', gid);
      if(upGrp && upGrp.error){
        return flash('⚠️ Không thể chuyển quyền trên máy chủ: ' + (upGrp.error.message || 'Hãy chạy lại schema_groups_secure.sql mới nhất trên Supabase'));
      }
      await safeDb(() => sb.from('group_members').update({ can_edit: true }).eq('group_id', gid).eq('user_id', targetMem.user_id));
    }
    grp.owner_id = targetMem.user_id;
    grp.owner_name = targetMem.full_name;
    targetMem.can_edit = true;
    const meMem = (grp.members || []).find(m => m.user_id === uid);
    if(meMem) meMem.can_edit = true;
    flash('✅ Đã lập biên bản bàn giao quỹ và chuyển quyền Trưởng nhóm cho ' + targetMem.full_name + '!');
    render();
  }, 'Xác nhận bàn giao');
}

async function leaveGroup(gid){
  const grp=myGroups.find(g=>g.id===gid);
  if(!grp)return;
  const isLeader=grp.owner_id===uid;
  const guard = window.getGroupFundGuard ? window.getGroupFundGuard(gid) : { balance: 0, pendingReimburseCount: 0, pendingDepositsCount: 0, hasOpenFunds: false };
  const otherMems = (grp.members || []).filter(m => m.user_id !== uid);

  if(isLeader && guard.hasOpenFunds){
    const parts = [];
    if(guard.balance > 0) parts.push('số dư quỹ còn ' + fmtVnd(guard.balance));
    if(guard.pendingReimburseCount > 0) parts.push(guard.pendingReimburseCount + ' phiếu hoàn tiền chưa chi');
    if(guard.pendingDepositsCount > 0) parts.push(guard.pendingDepositsCount + ' giao dịch nạp quỹ chờ duyệt');
    const reason = parts.join(', ');
    if(otherMems.length > 0){
      return flash('🔒 Không thể rời nhóm khi ' + reason + '. Hãy xử lý hết hoặc bàn giao quyền Trưởng nhóm & Quỹ cho thành viên khác ở mục bên dưới!');
    } else {
      return flash('🔒 Không thể rời nhóm khi ' + reason + '. Hãy hoàn/quyết toán hết số dư quỹ về 0đ trước khi rời hoặc giải tán nhóm!');
    }
  }

  if(isLeader && otherMems.length > 0){
    return flash('👑 Bạn đang là Trưởng nhóm và nhóm vẫn còn ' + otherMems.length + ' thành viên. Vui lòng bàn giao quyền Trưởng nhóm cho thành viên khác trước khi rời nhóm!');
  }

  const msg=isLeader
    ? 'Bạn đang là trưởng nhóm và nhóm không còn thành viên hay số dư quỹ nào. Rời nhóm sẽ giải tán nhóm "' + grp.name + '". Bạn có chắc chắn?'
    : 'Bạn có chắc chắn muốn rời khỏi nhóm "' + grp.name + '"?';
  ask(msg, async ()=>{
    if(sb){
      await safeDb(()=>sb.from('group_members').delete().eq('group_id',gid).eq('user_id',uid));
      if(isLeader && (grp.members||[]).length<=1){
        await safeDb(()=>sb.from('group_expenses').delete().eq('group_id',gid));
        await safeDb(()=>sb.from('groups').delete().eq('id',gid));
      }
    }
    myGroups=myGroups.filter(g=>g.id!==gid);
    if(activeGroupId===gid){activeGroupId=null;grpEx=[];}
    flash('Bạn đã rời khỏi nhóm.');
    render();
  }, 'Rời nhóm');
}
function getLocalGrpEx(gid){try{return JSON.parse(localStorage.getItem(gStoreKey('ex_'+gid))||'[]')}catch(e){return[]}}
function saveLocalGrpEx(gid,list){try{localStorage.setItem(gStoreKey('ex_'+gid),JSON.stringify(list))}catch(e){}}
function getLocalGrpBud(gid){try{const raw=JSON.parse(localStorage.getItem(gStoreKey('bud_'+gid))||'null');if(Array.isArray(raw))return{list:raw,thr:80};return raw}catch(e){return null}}
function saveLocalGrpBud(gid,list,t){
  const th=t!==undefined?t:grpThr;
  try{localStorage.setItem(gStoreKey('bud_'+gid),JSON.stringify({list,thr:th}))}catch(e){}
  if(sb&&gid){
    safeDb(async ()=>{
      await sb.from('group_budgets').delete().eq('group_id',gid).not('category','in','("__vault_bank__","__vault_ledger__")');
      if(list&&list.length){
        await sb.from('group_budgets').insert(list.map(c=>({group_id:gid,category:c.n,amount:c.b,color:c.c||'',threshold:th})));
      }
    });
  }
}
function grpAlertCheck(grpName, catName){
  const activeBuds = grpBuds.length ? grpBuds : cats.map(c=>({n:c.n,b:c.b,c:c.c}));
  const bObj = activeBuds.find(x=>x.n===catName);
  if(!bObj) return;
  const curMKey = mAdd(0).key;
  const sp = grpEx.filter(e=>inM(e,curMKey)&&e.c===catName).reduce((s,e)=>s+e.a,0);
  const p = bObj.b>0 ? (sp/bObj.b*100) : (sp>0?101:0);
  const gOpts = getGrpOpts(activeGroupId);
  if(p>100 && gOpts.over) push(bObj.b>0?`[Nhóm ${grpName}] ${catName} đã vượt ngân sách (${fmtPct(p)})`:`[Nhóm ${grpName}] ${catName} đã vượt ngân sách (ngân sách 0 đ)`,'--rd');
  else if(p>=grpThr && p<=100 && gOpts.budget) push(`[Nhóm ${grpName}] ${catName} đã dùng ${fmtPct(p)} ngân sách`,'--am');
}

async function ensureUserProfile(){
  if(!sb||!uid)return;
  try{
    let authName=cleanName(userName);
    let {data:up}=await sb.from('user_profiles').select('*').eq('id',uid).maybeSingle();
    const dbName=up?cleanName(up.full_name):'';
    const bestName=dbName||authName;
    if(!up){
      const newCode=genCode('US');
      const ins=await sb.from('user_profiles').insert({id:uid,user_code:newCode,full_name:bestName}).select().single();
      if(ins.data)up=ins.data;
    }else if(bestName && up.full_name!==bestName){
      await sb.from('user_profiles').update({full_name:bestName}).eq('id',uid);
      up.full_name=bestName;
    }
    if(up){
      userCode=up.user_code;
      const bankJson = up.bank_account ? (typeof up.bank_account === 'string' ? up.bank_account : JSON.stringify(up.bank_account)) : '';
      userWallet = bankJson || localStorage.getItem('sw_my_bank_'+uid) || '';
      window.myFujiWallet = (up.wallet_address && /^0x[a-fA-F0-9]{40}$/.test(up.wallet_address)) ? up.wallet_address : (localStorage.getItem('sw_my_fuji_wallet_'+uid) || '');
      if(cleanName(up.full_name))userName=cleanName(up.full_name);
    }
    if(!cleanName(userName) && authName)userName=authName;
  }catch(e){console.warn('user_profiles:',e)}
}

async function loadGroups(){
  if(!sb||!uid)return;
  try{
    const {data:gms}=await sb.from('group_members').select('*').eq('user_id',uid);
    const gids=[...new Set((gms||[]).map(x=>x.group_id))];
    if(!gids.length){myGroups=[];return;}
    const [{data:grps},{data:allMems}]=await Promise.all([
      sb.from('groups').select('*').in('id',gids),
      sb.from('group_members').select('*').in('group_id',gids)
    ]);
    const memberUserIds=[...new Set([uid,...(allMems||[]).map(m=>m.user_id),...(grps||[]).map(g=>g.owner_id)].filter(Boolean))];
    const {data:allProfs}=memberUserIds.length
      ? await sb.from('user_profiles').select('id,user_code,full_name,bank_account,wallet_address').in('id',memberUserIds)
      : {data:[]};
    const profMap=Object.fromEntries((allProfs||[]).map(p=>[p.id,p]));
    const meta=getLocalGrpMeta();
    myGroups=(grps||[]).map(g=>{
      const gMeta=meta[g.id]||{};
      const gAll = (allMems||[]).filter(m=>m.group_id===g.id).map(m=>{
        const isOwner = m.user_id === g.owner_id;
        const dbCanEdit = (typeof m.can_edit === 'boolean') ? m.can_edit : (m.role === 'editor');
        const localPerm = gMeta.perms && typeof gMeta.perms[m.user_id] === 'boolean' ? gMeta.perms[m.user_id] : false;
        const pRec = profMap[m.user_id] || {};
        const memAvatar = (m.user_id === uid)
          ? (userAvatar || loadUserAvatarLocal(uid) || pRec.avatar_data || pRec.avatar_url || '')
          : (pRec.avatar_data || pRec.avatar_url || '');
        const rawStatus = isOwner ? 'active' : (m.status || (gMeta.pending && gMeta.pending[m.user_id] ? 'pending' : 'active'));
        return {
          user_id: m.user_id,
          full_name: pRec.full_name || 'Thành viên',
          user_code: pRec.user_code || '',
          bank_account: pRec.bank_account || null,
          wallet: (pRec.wallet_address && /^0x[a-fA-F0-9]{40}$/.test(pRec.wallet_address)) ? pRec.wallet_address : '',
          avatar: memAvatar,
          status: rawStatus,
          joined_at: m.joined_at || '',
          can_edit: isOwner ? true : (dbCanEdit || localPerm)
        };
      });
      const members = gAll.filter(m => m.status !== 'pending');
      const pendingMembers = gAll.filter(m => m.status === 'pending');
      const myRec = gAll.find(m => m.user_id === uid);
      const myStatus = (g.owner_id === uid) ? 'active' : (myRec ? myRec.status : 'active');
      const ownerProf = profMap[g.owner_id] || members.find(m=>m.user_id===g.owner_id) || {};
      return {...g, owner_name: ownerProf.full_name || 'Trưởng nhóm', members, pendingMembers, myStatus};
    });
  }catch(e){console.warn('loadGroups:',e)}
}

async function createGroup(){
  if(busyLock.createGroup)return;
  const nm=($('#gnm')||{}).value?.trim(),m=$('#gm1'),btn=$('#btnCreateGrp');
  if(!nm){if(m)m.textContent='Nhập tên nhóm.';return;}
  if(!sb||!uid){if(m)m.textContent='Chưa kết nối máy chủ.';return;}
  busyLock.createGroup=true;
  if(btn){btn.disabled=true;btn.textContent='Đang tạo...';}
  try{
    const gcode=genCode('GRP');
    const {data:g,error}=await sb.from('groups').insert({name:nm,group_code:gcode,owner_id:uid}).select().single();
    if(error){if(m)m.textContent='Lỗi tạo nhóm: '+error.message;return;}
    await sb.from('group_members').insert({group_id:g.id,user_id:uid});
    await loadGroups();
    flash('Đã tạo nhóm "'+nm+'" (Mã: '+gcode+')');
    render();
  }finally{
    busyLock.createGroup=false;
    if(btn){btn.disabled=false;btn.textContent='Tạo nhóm & Lấy mã ngẫu nhiên';}
  }
}

async function joinGroupByCode(){
  if(busyLock.joinGroup)return;
  const raw=($('#gjc')||{}).value?.trim().toUpperCase(),m=$('#gm2'),btn=$('#btnJoinGrp');
  if(!raw){if(m)m.textContent='Nhập mã nhóm.';return;}
  if(!sb||!uid){if(m)m.textContent='Chưa kết nối máy chủ.';return;}
  busyLock.joinGroup=true;
  if(btn){btn.disabled=true;btn.textContent='Đang gửi yêu cầu...';}
  try{
    let g=null;
    const rpcG=await sb.rpc('lookup_group_by_code',{p_code:raw});
    if(!rpcG.error && Array.isArray(rpcG.data)){g=rpcG.data[0]||null;}
    else{const resG=await sb.from('groups').select('id,group_code,name').eq('group_code',raw).maybeSingle();g=resG.data||null;}
    if(!g){if(m)m.textContent='Không tìm thấy nhóm với mã này.';return;}
    const existing = myGroups.find(x=>x.id===g.id);
    if(existing){
      if(m)m.textContent = existing.myStatus==='pending'
        ? 'Bạn đã gửi yêu cầu tham gia nhóm này rồi, vui lòng chờ Trưởng nhóm duyệt.'
        : 'Bạn đã ở trong nhóm này rồi.';
      return;
    }
    let insRes = await sb.from('group_members').insert({group_id:g.id,user_id:uid,can_edit:false,status:'pending'});
    if(insRes.error && /column .*status.* does not exist/i.test(insRes.error.message||'')){
      insRes = await sb.from('group_members').insert({group_id:g.id,user_id:uid,can_edit:false});
      const meta=getLocalGrpMeta();
      meta[g.id]=meta[g.id]||{perms:{},pending:{}};
      meta[g.id].pending=meta[g.id].pending||{};
      meta[g.id].pending[uid]=true;
      saveLocalGrpMeta(meta);
    }
    if(insRes.error){if(m)m.textContent='Không thể gửi yêu cầu tham gia: '+insRes.error.message;return;}
    if($('#gjc')) $('#gjc').value = '';
    if(m) m.textContent = '';
    await loadGroups();
    flash('⏳ Đã gửi yêu cầu tham gia nhóm "'+g.name+'". Vui lòng chờ Trưởng nhóm phê duyệt!');
    render();
  }finally{
    busyLock.joinGroup=false;
    if(btn){btn.disabled=false;btn.textContent='Gửi yêu cầu tham gia';}
  }
}

async function approvePendingMember(gid, targetUid, allowEdit=false){
  const grp=myGroups.find(g=>g.id===gid);
  if(!grp || grp.owner_id!==uid) return flash('Chỉ trưởng nhóm mới có quyền duyệt thành viên.');
  const meta=getLocalGrpMeta();
  meta[gid]=meta[gid]||{perms:{},pending:{}};
  if(meta[gid].pending) delete meta[gid].pending[targetUid];
  meta[gid].perms=meta[gid].perms||{};
  meta[gid].perms[targetUid]=!!allowEdit;
  saveLocalGrpMeta(meta);
  if(sb){
    const up = await sb.from('group_members').update({status:'active', can_edit:!!allowEdit}).eq('group_id',gid).eq('user_id',targetUid);
    if(up && up.error && /column .*status.* does not exist/i.test(up.error.message||'')){
      await safeDb(()=>sb.from('group_members').update({can_edit:!!allowEdit}).eq('group_id',gid).eq('user_id',targetUid));
    }
  }
  await loadGroups();
  flash(allowEdit ? '✅ Đã duyệt thành viên vào nhóm (Quyền chỉnh sửa).' : '✅ Đã duyệt thành viên vào nhóm (Chỉ được xem).');
  render();
}

async function rejectPendingMember(gid, targetUid){
  const grp=myGroups.find(g=>g.id===gid);
  if(!grp || grp.owner_id!==uid) return flash('Chỉ trưởng nhóm mới có quyền từ chối yêu cầu.');
  ask('Từ chối yêu cầu tham gia nhóm của thành viên này?', async ()=>{
    const meta=getLocalGrpMeta();
    if(meta[gid] && meta[gid].pending) delete meta[gid].pending[targetUid];
    saveLocalGrpMeta(meta);
    if(sb){
      await safeDb(()=>sb.from('group_members').delete().eq('group_id',gid).eq('user_id',targetUid));
    }
    await loadGroups();
    flash('Đã từ chối yêu cầu tham gia nhóm.');
    render();
  }, 'Từ chối');
}

async function cancelJoinRequest(gid){
  const grp=myGroups.find(g=>g.id===gid);
  if(!grp) return;
  ask('Hủy yêu cầu tham gia nhóm "' + grp.name + '"?', async ()=>{
    const meta=getLocalGrpMeta();
    if(meta[gid] && meta[gid].pending) delete meta[gid].pending[uid];
    saveLocalGrpMeta(meta);
    if(sb){
      await safeDb(()=>sb.from('group_members').delete().eq('group_id',gid).eq('user_id',uid));
    }
    myGroups=myGroups.filter(g=>g.id!==gid);
    if(activeGroupId===gid){activeGroupId=null;grpEx=[];}
    flash('Đã hủy yêu cầu tham gia nhóm.');
    render();
  }, 'Hủy yêu cầu');
}

async function addMemberByUserCode(gid){
  if(busyLock.addMem)return;
  const inp=$('#addm_'+gid),m=$('#mm_'+gid),btn=$('#btnAddMem_'+gid);
  const raw=(inp?.value||'').trim().toUpperCase();
  if(!raw){if(m)m.textContent='Nhập mã riêng của người dùng.';return;}
  if(!sb){if(m)m.textContent='Chưa kết nối máy chủ.';return;}
  busyLock.addMem=true;
  if(btn){btn.disabled=true;btn.textContent='Đang thêm...';}
  try{
    let prof=null;
    const rpcU=await sb.rpc('lookup_user_by_code',{p_code:raw});
    if(!rpcU.error && Array.isArray(rpcU.data)){prof=rpcU.data[0]||null;}
    else{const resU=await sb.from('user_profiles').select('id,user_code,full_name').eq('user_code',raw).maybeSingle();prof=resU.data||null;}
    if(!prof){if(m)m.textContent='Không tìm thấy người dùng có mã '+raw;return;}
    const grp=myGroups.find(g=>g.id===gid);
    if(grp&&grp.members.some(x=>x.user_id===prof.id)){if(m)m.textContent='Người dùng này đã có trong nhóm.';return;}
    if(grp&&(grp.pendingMembers||[]).some(x=>x.user_id===prof.id)){
      return approvePendingMember(gid, prof.id, false);
    }
    let addRes=await sb.from('group_members').insert({group_id:gid,user_id:prof.id,can_edit:false,status:'active'});
    if(addRes.error && /column .*status.* does not exist/i.test(addRes.error.message||'')){
      addRes=await sb.from('group_members').insert({group_id:gid,user_id:prof.id,can_edit:false});
    }
    const {error}=addRes;
    if(error){if(m)m.textContent='Lỗi thêm thành viên: '+error.message;return;}
    const meta=getLocalGrpMeta();
    meta[gid]=meta[gid]||{perms:{}};
    meta[gid].perms[prof.id]=false;
    saveLocalGrpMeta(meta);
    await loadGroups();
    flash('Đã thêm '+(prof.full_name||raw)+' vào nhóm (Mặc định: Chỉ được xem)');
    render();
  }finally{
    busyLock.addMem=false;
    if(btn){btn.disabled=false;btn.textContent='+ Thêm vào nhóm';}
  }
}

async function toggleMemberPermission(gid, targetUid, canEdit){
  const grp=myGroups.find(g=>g.id===gid);
  if(!grp || grp.owner_id!==uid)return flash('Chỉ trưởng nhóm mới có quyền phân quyền.');
  const meta=getLocalGrpMeta();
  meta[gid]=meta[gid]||{perms:{}};
  meta[gid].perms[targetUid]=!!canEdit;
  saveLocalGrpMeta(meta);
  if(sb){
    await safeDb(()=>sb.from('group_members').update({can_edit:!!canEdit}).eq('group_id',gid).eq('user_id',targetUid));
  }
  await loadGroups();
  flash(canEdit ? 'Đã cấp quyền Chỉnh sửa cho thành viên.' : 'Đã chuyển thành viên về quyền Chỉ được xem.');
  render();
}

async function removeGroupMember(gid, targetUid){
  const grp=myGroups.find(g=>g.id===gid);
  if(!grp || grp.owner_id!==uid)return;
  ask('Xóa thành viên này khỏi nhóm?', async ()=>{
    if(sb) await sb.from('group_members').delete().eq('group_id',gid).eq('user_id',targetUid);
    await loadGroups();
    flash('Đã xóa thành viên khỏi nhóm.');
    render();
  }, 'Xóa');
}

function setGrpPaidInput(isPaid, prefix=''){
  const inp=$('#'+prefix+'gpaid'), b1=$('#'+prefix+'btnPaidYes'), b0=$('#'+prefix+'btnPaidNo');
  if(inp) inp.value = isPaid ? '1' : '0';
  if(b1){ b1.className = isPaid ? 'btn' : 'btn o'; b1.style.background = isPaid ? 'var(--gr)' : ''; }
  if(b0){ b0.className = !isPaid ? 'btn' : 'btn o'; b0.style.background = !isPaid ? 'var(--am)' : ''; }
}
function syncGrpMemberDefault(mid){
  grpEdItems.forEach(p=>{ if(!p.uid) p.uid = mid; });
  drawGrpIt();
}
async function toggleGrpPaid(eid){
  const grp=myGroups.find(g=>g.id===activeGroupId);
  if(!grp)return;
  const me=(grp.members||[]).find(m=>m.user_id===uid);
  const canEdit = grp.owner_id===uid || (me && me.can_edit);
  if(!canEdit)return flash('Bạn chỉ có quyền xem trong nhóm này.');
  const e=grpEx.find(x=>x.id===eid);
  if(!e)return;
  if((e.edits||0)>=3)return flash('Hóa đơn này đã hết lượt sửa (3/3).');
  e.paid = !e.paid;
  e.edits = (e.edits||0) + 1;
  saveLocalGrpEx(activeGroupId, grpEx);
  flash((e.paid ? 'Đã xác nhận: Đã chi!' : 'Đã chuyển trạng thái: Chưa chi.') + ' (' + e.edits + '/3 lần sửa)');
  if(grpTab === 'history' && $('#ghl')){
    updGrpHist();
  }else{
    const sx = window.scrollX, sy = window.scrollY;
    render();
    window.scrollTo(sx, sy);
  }
  await safeDb(()=>sb.from('group_expenses').update({is_paid:e.paid,edit_count:e.edits}).eq('id',eid));
}

async function loadGroupData(gid){
  if(!gid)return;
  const grp=myGroups.find(g=>g.id===gid);
  if(!grp)return;
  let loadedFromDb=false;
  if(sb){
    try{
      const {data:gRows, error}=await sb.from('group_expenses').select('*').eq('group_id',gid).order('spent_on',{ascending:false});
      if(!error && Array.isArray(gRows)){
        loadedFromDb=true;
        const localPrev = Object.fromEntries(getLocalGrpEx(gid).map(x=>[x.id, x]));
        grpEx=gRows.map(r=>{
          const mem=(grp.members||[]).find(m=>m.user_id===r.user_id);
          const lp = localPrev[r.id] || {};
          const itemObj = {
            id:r.id,
            group_id:r.group_id,
            uid:r.user_id,
            memberName:r.member_name || (mem?mem.full_name:'Thành viên'),
            d:r.spent_on,
            s:r.shop,
            c:r.category,
            a:+r.amount,
            edits: typeof r.edit_count==='number' ? r.edit_count : (lp.edits || 0),
            paid: typeof r.is_paid==='boolean' ? r.is_paid : (typeof lp.paid==='boolean' ? lp.paid : true)
          };
          const rawItems = Array.isArray(r.items) ? r.items : (Array.isArray(lp.items) ? lp.items : []);
          const sealMeta = rawItems.find(x => x && x._avax_seal);
          if(r.avax_reimburse && r.avax_reimburse.requestId !== undefined) itemObj.avax_reimburse = r.avax_reimburse;
          else if(lp.avax_reimburse) itemObj.avax_reimburse = lp.avax_reimburse;
          if(r.avax_seal && r.avax_seal.txHash) itemObj.avax_seal = r.avax_seal;
          else if(sealMeta && sealMeta._avax_seal) itemObj.avax_seal = sealMeta._avax_seal;
          else if(lp.avax_seal) itemObj.avax_seal = lp.avax_seal;
          const cleanItems = rawItems.filter(x => x && !x._avax_seal);
          if(cleanItems.length) itemObj.items = cleanItems;
          return itemObj;
        });
        saveLocalGrpEx(gid, grpEx);
      }
    }catch(e){}
  }
  if(!loadedFromDb){
    grpEx=getLocalGrpEx(gid).map(x=>({edits:0, paid:true, ...x}));
  }
  let dbBuds=null, dbThr=null;
  if(sb){
    try{
      const {data:gbRows, error:gbErr}=await sb.from('group_budgets').select('*').eq('group_id',gid);
      if(!gbErr && Array.isArray(gbRows) && gbRows.length){
        const metaBankRow = gbRows.find(r=>r.category==='__vault_bank__');
        if(metaBankRow && metaBankRow.color){
          try{
            const parsedBank = JSON.parse(metaBankRow.color);
            if(parsedBank && parsedBank.accountNo) localStorage.setItem('sw_grp_bank_'+gid, JSON.stringify(parsedBank));
          }catch(e){}
        }
        const metaLedgerRow = gbRows.find(r=>r.category==='__vault_ledger__');
        if(metaLedgerRow && metaLedgerRow.color && window.BankVault && window.BankVault.mergeRemoteLedger){
          try{
            const remoteLedger = JSON.parse(metaLedgerRow.color);
            window.BankVault.mergeRemoteLedger(gid, remoteLedger);
          }catch(e){}
        }
        const realRows = gbRows.filter(r=>r.category!=='__vault_bank__' && r.category!=='__vault_ledger__');
        if(realRows.length){
          dbBuds=realRows.map(r=>({n:r.category, b:+r.amount, c:r.color||META[r.category]?.c||PAL[hash(r.category)%PAL.length]}));
          dbThr=realRows[0].threshold || 80;
        }
      }
    }catch(e){}
  }
  const savedBud=getLocalGrpBud(gid);
  grpBuds = dbBuds || ((savedBud && savedBud.list) ? savedBud.list : cats.map(c=>({n:c.n, b:c.b, c:c.c})));
  if(normCur(appCur)==='VND' && Array.isArray(grpBuds)){
    const DEF_V={'Ăn uống':4000000,'Mua sắm':3000000,'Di chuyển':2000000,'Giải trí':1500000,'Học tập':1500000,'Khác':1000000};
    let healed=false;
    grpBuds.forEach(gb=>{if(gb.b>0&&gb.b<1000&&DEF_V[gb.n]){gb.b=DEF_V[gb.n];healed=true;}});
    if(healed)saveLocalGrpBud(gid,grpBuds,grpThr);
  }
  grpThr = dbThr || ((savedBud && savedBud.thr) ? savedBud.thr : 80);
}

async function openGroupBox(gid){
  const targetG = myGroups.find(g=>g.id===gid);
  if(targetG && targetG.myStatus === 'pending'){
    return flash('⏳ Yêu cầu tham gia nhóm "' + targetG.name + '" đang chờ Trưởng nhóm duyệt. Bạn chưa thể xem dữ liệu quỹ nhóm.');
  }
  activeGroupId=gid;
  grpTab='overview';
  grpEx=[];
  if(gid) {
    await loadGroupData(gid);
    if(window.BankVault && window.BankVault.syncRemoteLedger) await window.BankVault.syncRemoteLedger(gid);
  }
  render();
}

async function addGrpExpense(){
  if(busyLock.addGrpExp)return;
  const grp=myGroups.find(g=>g.id===activeGroupId);
  if(!grp)return;
  const me=(grp.members||[]).find(m=>m.user_id===uid);
  const canEdit = grp.owner_id===uid || (me && me.can_edit);
  if(!canEdit)return flash('Bạn chỉ có quyền xem trong nhóm này.');

  const s=($('#gs')||{}).value?.trim(),d=($('#gd')||{}).value,m=$('#gm_add'),btn=$('#btnSaveGrpExp');
  const buyerUid = ($('#gmem')||{}).value || uid;
  const buyerObj = (grp.members||[]).find(x=>x.user_id===buyerUid);
  const buyerName = buyerObj ? buyerObj.full_name : userName;
  const isPaid = ($('#gpaid')||{}).value === '1';

  let a=num(($('#ga')||{}).value,MAXV_GRP),c=($('#gc')||{}).value,its=null;
  const gIsAiDate=!!(grpDraft&&grpDraft.dateFound&&!grpDraft.manualDateEdit&&d===grpDraft.aiDate);
  const gFloor=gIsAiDate?aiMinDate():minDate();
  if(!d){if(m)m.textContent='Chọn ngày chi tiêu.';return;}if(d<minDate()&&d!==e.d){if(m)m.textContent='Không thể chọn ngày từ 2 ngày trước trở về trước (chỉ cho phép từ hôm qua trong năm '+CY+').';return;}if(d>maxDate()){if(m)m.textContent='Chỉ được chọn ngày trong năm '+CY+'.';return;}if(d<minDate()){if(m)m.textContent='Không thể chọn ngày từ 2 ngày trước trở về trước (chỉ cho phép từ hôm qua trong năm '+CY+').';return;}if(d>maxDate()){if(m)m.textContent='Chỉ được chọn ngày trong năm '+CY+'.';return;}
  if(d<gFloor){if(m)m.textContent='Không thể chọn ngày từ 2 ngày trước trở về trước (chỉ cho phép từ hôm qua trong năm '+CY+').';return;}
  if(d>maxDate()){if(m)m.textContent='Chỉ được chọn ngày trong năm '+CY+'.';return;}
  if(!s){if(m)m.textContent='Nhập tên cửa hàng hoặc nội dung.';return;}
  if(grpEdItems.length){
    if(grpEdItems.some(p=>!p.n.trim()||!(p.a>0))){if(m)m.textContent='Mỗi món cần có tên và số tiền lớn hơn 0.';return;}
    its=grpEdItems.map(p=>{
      const pUid = p.uid || buyerUid;
      const pMem = (grp.members||[]).find(x=>x.user_id===pUid);
      return {...p, n:p.n.trim(), uid:pUid, memberName: pMem ? pMem.full_name : buyerName};
    });
    a=round2(its.reduce((x,p)=>x+p.a,0));
    const mp={};its.forEach(p=>mp[p.c]=(mp[p.c]||0)+p.a);
    c=Object.keys(mp).sort((x,y)=>mp[y]-mp[x])[0];
  }
  if(!(a>0)){if(m)m.textContent='Nhập số tiền lớn hơn 0.';return;}

  busyLock.addGrpExp=true;
  if(btn){btn.disabled=true;btn.textContent='Đang lưu...';}
  try{
    const newItem={
      id:'gex_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      group_id:activeGroupId,
      uid:buyerUid,
      memberName:buyerName,
      d:d,
      s:s,
      c:c,
      a:a,
      edits:0,
      paid:isPaid,
      ts:Date.now()
    };
    if(its)newItem.items=its;

    if(sb){
      let saved=false;
      try{
        const basePayload={
          group_id:activeGroupId,
          user_id:buyerUid,
          member_name:buyerName,
          spent_on:d,
          shop:s,
          category:c,
          amount:a
        };
        let {data:ins, error}=await sb.from('group_expenses').insert({...basePayload, is_paid:isPaid, edit_count:0, items:its||[]}).select().single();
        if(error){
          console.warn('group_expenses insert (đầy đủ):',error);
          const fallback=await sb.from('group_expenses').insert(basePayload).select().single();
          ins=fallback.data; error=fallback.error;
        }
        if(!error && ins){newItem.id=ins.id;saved=true}
        else if(error)console.error('group_expenses insert:',error);
      }catch(e){console.error('group_expenses insert:',e)}
      if(!saved){
        if(m)m.textContent='Không lưu được lên máy chủ. Kiểm tra mạng hoặc quyền của bạn trong nhóm rồi thử lại.';
        flash('Chưa lưu được khoản chi nhóm lên máy chủ.');
        return;
      }
    }
    grpEx.unshift(newItem);
    saveLocalGrpEx(activeGroupId, grpEx);
    if(inM(newItem,mAdd(0).key)) grpAlertCheck(grp.name, c);
    flash('Đã lưu khoản chi riêng của nhóm!');
    grpTab='history';
    render();
  }finally{
    busyLock.addGrpExp=false;
    if(btn){btn.disabled=false;btn.textContent='💾 Lưu khoản chi nhóm';}
  }
}

async function delGrpExpense(eid){
  const grp=myGroups.find(g=>g.id===activeGroupId);
  if(!grp)return;
  const me=(grp.members||[]).find(m=>m.user_id===uid);
  const canEdit = grp.owner_id===uid || (me && me.can_edit);
  if(!canEdit)return flash('Bạn chỉ có quyền xem trong nhóm này.');
  const target=grpEx.find(x=>x.id===eid);
  if(!target || (target.edits||0)>=3)return flash('Hóa đơn nhóm này đã hết lượt sửa (3/3) nên không thể xóa.');

  ask('Xóa khoản chi này khỏi nhóm? Việc xóa tính là 1 lần sửa.', async ()=>{
    target.edits = (target.edits||0) + 1;
    await safeDb(()=>sb.from('group_expenses').delete().eq('id',eid));
    grpEx=grpEx.filter(x=>x.id!==eid);
    saveLocalGrpEx(activeGroupId, grpEx);
    flash('Đã xóa khoản chi nhóm.');
    render();
  }, 'Xóa');
}


/* ===== Bảng màu ngân sách nhóm ===== */
let gbNewCol='',gbPick=-1;
const gbList=()=>grpBuds.length?grpBuds:cats.map(c=>({n:c.n,b:c.b,c:c.c}));
const gbUsed=skip=>new Set(gbList().filter((x,k)=>k!==skip).map(x=>String(x.c||'').toLowerCase()));
function gbNewColor(){const u=gbUsed(-1),s=String(gbNewCol||'').toLowerCase();if(s&&!u.has(s))return s;return BUDPAL.find(c=>!u.has(c))||PAL[0]}
function pickGrpNewCol(col){gbNewCol=col;document.querySelectorAll('#gpalNew .pc').forEach(b=>{const on=b.dataset.c===col;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});const p=$('#gbPrev');if(p)p.style.background=col}
function setGrpBudCol(idx,col){
  const grp=myGroups.find(g=>g.id===activeGroupId);if(!grp)return;
  const me=(grp.members||[]).find(m=>m.user_id===uid);
  if(!(grp.owner_id===uid||(me&&me.can_edit)))return flash('Bạn chỉ có quyền xem trong nhóm này.');
  if(!grpBuds.length)grpBuds=cats.map(c=>({n:c.n,b:c.b,c:c.c}));
  col=String(col).toLowerCase();
  if(gbUsed(idx).has(col))return flash('Màu này đang được dùng cho ngân sách khác.');
  grpBuds[idx].c=col;saveLocalGrpBud(activeGroupId,grpBuds,grpThr);gbPick=-1;render();
}
function setGrpBud(idx, val){
  const grp=myGroups.find(g=>g.id===activeGroupId);
  if(!grp)return;
  const me=(grp.members||[]).find(m=>m.user_id===uid);
  const canEdit = grp.owner_id===uid || (me && me.can_edit);
  if(!canEdit)return flash('Bạn chỉ có quyền xem trong nhóm này.');
  if(!grpBuds.length) grpBuds = cats.map(c=>({n:c.n,b:c.b,c:c.c}));
  grpBuds[idx].b=num(val, MAXV_GRP);
  saveLocalGrpBud(activeGroupId, grpBuds, grpThr);
  flash('Đã cập nhật giới hạn ngân sách nhóm.');
  render();
}

function setGrpThr(val){
  grpThr = Math.min(100, Math.max(50, +val||80));
  if(!grpBuds.length) grpBuds = cats.map(c=>({n:c.n,b:c.b,c:c.c}));
  saveLocalGrpBud(activeGroupId, grpBuds, grpThr);
  flash('Đã lưu ngưỡng cảnh báo ngân sách nhóm ('+grpThr+'%).');
  render();
}

function addGrpBud(){
  const grp=myGroups.find(g=>g.id===activeGroupId);
  if(!grp)return;
  const n=($('#gbn')||{}).value?.trim(), v=num(($('#gbv')||{}).value, MAXV_GRP), m=$('#gbm');
  if(!n){if(m)m.textContent='Nhập tên danh mục ngân sách.';return;}
  if(!grpBuds.length) grpBuds = cats.map(c=>({n:c.n,b:c.b,c:c.c}));
  if(grpBuds.some(c=>c.n.toLowerCase()===n.toLowerCase())){if(m)m.textContent='Danh mục ngân sách này đã tồn tại trong nhóm.';return;}
  if(!(v>0))return m.textContent='Nhập số tiền lớn hơn 0.';
  if(v>MAXV_GRP){if(m)m.textContent='Giới hạn ngân sách tối đa mỗi danh mục là 50.000.000.000 đ.';return;}
  const col = gbNewColor();
  grpBuds.push({n, b:v, c:col});
  gbNewCol='';gbPick=-1;
  saveLocalGrpBud(activeGroupId, grpBuds, grpThr);
  grpBAdd=false;
  flash('Đã thêm ngân sách nhóm: '+n);
  render();
}

function delGrpBud(idx){
  if(!grpBuds.length) grpBuds = cats.map(c=>({n:c.n,b:c.b,c:c.c}));
  if(grpBuds.length<2)return flash('Cần giữ ít nhất một danh mục ngân sách nhóm.');
  const target=grpBuds[idx];
  ask('Xóa danh mục ngân sách "'+target.n+'" khỏi nhóm?', ()=>{
    grpBuds.splice(idx,1);
    saveLocalGrpBud(activeGroupId, grpBuds, grpThr);
    flash('Đã xóa ngân sách nhóm.');
    render();
  }, 'Xóa');
}

function grpEdHTML(budList, hideLabel){
  const list = budList || (grpBuds.length ? grpBuds : cats);
  const curGrp = myGroups.find(g=>g.id===activeGroupId);
  const mems = (curGrp && curGrp.members) ? curGrp.members : [{user_id:uid, full_name:userName}];
  const defBuyer = ($('#gmem')||$('#g_smem')||{}).value || uid;
  const gOpts = sel => list.map(c=>`<option value="${esc(c.n)}" ${c.n===sel?'selected':''}>${esc(c.n)}</option>`).join('');
  const mOpts = sel => mems.map(m=>`<option value="${esc(m.user_id)}" ${m.user_id===(sel||defBuyer)?'selected':''}>${esc(m.full_name)}</option>`).join('');
  const rows = grpEdItems.map((p,i)=>`
    <div class="ir ir5">
      <input placeholder="Tên món (VD: Rau)" aria-label="Tên món" value="${esc(p.n)}" onchange="grpEdItems[${i}].n=this.value;grpEdItems[${i}].c=guess(this.value,grpEdItems[${i}].c);drawGrpIt()">
      <input class="money" data-grp="1" inputmode="decimal" aria-label="Số tiền" placeholder="Số tiền" value="${p.a?fmtN(p.a):''}" oninput="grpEdItems[${i}].a=num(this.value,MAXV_GRP);syncGrpIt()">
      <select aria-label="Danh mục" onchange="grpEdItems[${i}].c=this.value">${gOpts(p.c)}</select>
      <select aria-label="Thành viên mua" onchange="grpEdItems[${i}].uid=this.value">${mOpts(p.uid)}</select>
      <button class="btn o" onclick="rmGrpIt(${i})" aria-label="Xóa món">✕</button>
    </div>`).join('');
  if(hideLabel) return `<div id="git" class="exp-scroll">${rows}</div>`;
  return `<label>Chi tiết từng món (tùy chọn)</label><div id="git" style="max-height:270px;overflow-y:auto;padding-right:6px;margin-bottom:8px">${rows}</div><button class="btn o" onclick="addGrpIt()">+ Chi tiết</button>`;
}
function drawGrpIt(){
  const el=$('#git');if(el)el.innerHTML=grpEdHTML(null,true).replace(/^<div[^>]*>|<\/div>$/g,'');
  const cnt=$('#gitCnt');if(cnt)cnt.textContent=grpEdItems.length;
  const sp=$('#grpSplit');if(sp)sp.classList.toggle('has-items',grpEdItems.length>0);
  const wr=$('#grpAddWrap');if(wr)wr.style.maxWidth=grpEdItems.length?'100%':'560px';
  syncGrpIt();
}
function addGrpIt(){
  const defCat = ($('#gc')||$('#g_sc')||{}).value || 'Ăn uống';
  const defBuyer = ($('#gmem')||$('#g_smem')||{}).value || uid;
  grpEdItems.push({n:'',a:0,c:defCat,uid:defBuyer});
  drawGrpIt();
}
function rmGrpIt(i){grpEdItems.splice(i,1);drawGrpIt()}
function syncGrpIt(){
  const a=$('#ga')||$('#g_sa');
  if(!a)return;
  if(grpEdItems.length){
    a.value=fmtN(round2(grpEdItems.reduce((s,p)=>s+(p.a||0),0)));
    a.readOnly=true;
  }else{
    a.readOnly=false;
  }
}

function applyGrpScanCurrency(mode, customRate){
  if(!grpDraft)return;
  const cur=normCur(grpDraft.currency);
  const tgt=normCur(appCur);
  if(cur===tgt){
    grpDraft.fxMode='keep';
    grpDraft.a=round2(grpDraft.origTotal||0);
    grpEdItems=(grpDraft.origItems||[]).map(it=>({n:it.n,c:it.c,a:round2(it.a)||0.01,uid:it.uid||uid}));
    return grpScanForm();
  }
  if(mode)grpDraft.fxMode=mode;
  if(customRate!==undefined){
    const r=num(customRate,10000000);
    if(r>0){grpDraft.fxRate=r;grpDraft.customFxRate=true;}
  }
  const rate=grpDraft.fxRate||getFxRate(cur,tgt);
  const conv=v=>grpDraft.fxMode==='convert'?(tgt==='VND'?Math.round(v*rate):round2(v*rate)):round2(v);
  grpDraft.a=conv(grpDraft.origTotal||0);
  grpEdItems=(grpDraft.origItems||[]).map(it=>{const val=conv(it.a);return{n:it.n,c:it.c,a:val>0?val:0.01,uid:it.uid||uid}});
  grpScanForm();
}

async function doGrpScan(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=()=>{const pv=$('#gpv');if(pv)pv.innerHTML=`<img src="${r.result}" alt="Hóa đơn nhóm">`};
  r.readAsDataURL(file);
  const pg=$('#gpg'), fm=$('#gfm');
  if(fm)fm.innerHTML='<span class="mu">Đang phân tích hóa đơn nhóm…</span>';
  try{
    const canvas=await prep(file,1800);
    if(pg)pg.innerHTML='<div class="mu">Đang quét thông minh bằng AI Vision…</div><div class="bar"><i style="width:45%"></i></div>';
    const aiRes=await scanWithGemini(canvas);
    if(aiRes){
      const cur=normCur(aiRes.currency);
      if(pg)pg.innerHTML='<div class="ok">✓ AI đã đọc xong hóa đơn! Kiểm tra lại từng món bên phải.</div>';
      const tgt=normCur(appCur);
      grpDraft={s:aiRes.shop,c:aiRes.cat,d:aiRes.date,aiDate:aiRes.dateFound?aiRes.date:'',dateFound:aiRes.dateFound,currency:cur,targetCur:tgt,origTotal:aiRes.total,origItems:aiRes.items.map(x=>({...x})),fxMode:cur===tgt?'keep':'convert',fxRate:getFxRate(cur,tgt),a:0};
      if(cur===tgt){grpEdItems=aiRes.items.map(x=>({...x,a:round2(x.a)}));grpDraft.a=round2(aiRes.total);grpScanForm();}
      else applyGrpScanCurrency('convert');
      return;
    }
  }catch(e){console.warn(e)}
  if(!window.Tesseract){if(pg)pg.innerHTML='<div class="err">Không tải được bộ nhận dạng chữ.</div>';return}
  let w;
  try{
    if(pg)pg.innerHTML='<div class="mu">Đang đọc chữ bằng OCR…</div><div class="bar"><i style="width:30%"></i></div>';
    w=await Tesseract.createWorker('vie+eng+rus',1);
    const{data}=await w.recognize(await prep(file,2000));
    const o=parseReceipt(data.text||'');
    const cur=normCur(o.currency);
    if(pg)pg.innerHTML=o.empty?'<div class="err">Không đọc được hóa đơn. Thử ảnh khác hoặc nhập tay.</div>':'<div class="err">⚠️ AI Vision không phản hồi, đã dùng OCR dự phòng (độ chính xác thấp hơn). Hãy kiểm tra kỹ từng dòng.</div>';
    grpDraft={s:o.shop,c:o.cat,d:o.date,aiDate:o.dateFound?o.date:'',dateFound:o.dateFound,currency:cur,origTotal:o.total,origItems:o.items.map(x=>({...x})),fxMode:'convert',fxRate:FX_RATES[cur]||25000,a:0};
    if(cur==='VND'){grpEdItems=o.items.map(x=>({...x}));grpDraft.a=o.total;grpScanForm();}
    else applyGrpScanCurrency('convert');
  }catch(x){
    if(pg)pg.innerHTML='<div class="err">Không đọc được hóa đơn.</div>';
    grpEdItems = [];
    grpDraft={s:'',c:'Khác',d:today(),dateFound:false,currency:'VND',a:0,items:[]};
    grpScanForm();
  }finally{if(w)w.terminate()}
}

function grpScanForm(){
  const fm=$('#gfm');
  if(!fm||!grpDraft)return;
  const curGrp = myGroups.find(g=>g.id===activeGroupId);
  const mems = (curGrp && curGrp.members) ? curGrp.members : [{user_id:uid, full_name:userName}];
  const budList = grpBuds.length ? grpBuds : cats;
  const gOpts = budList.map(c=>`<option value="${esc(c.n)}" ${c.n===grpDraft.c?'selected':''}>${esc(c.n)}</option>`).join('');
  const memOpts = mems.map(m=>`<option value="${esc(m.user_id)}" ${m.user_id===uid?'selected':''}>${esc(m.full_name)}</option>`).join('');
  const cur=normCur(grpDraft.currency);
  const tgt=normCur(appCur);
  if(grpDraft&&grpDraft.targetCur!==tgt){
    grpDraft.targetCur=tgt;
    grpDraft.fxRate=getFxRate(cur,tgt);
    if(cur===tgt){grpDraft.fxMode='keep';grpDraft.a=round2(grpDraft.origTotal||0);grpEdItems=(grpDraft.origItems||[]).map(it=>({n:it.n,c:it.c,a:round2(it.a)||0.01,uid:it.uid||uid}));}
    else if(grpDraft.fxMode==='convert'){const rate=grpDraft.fxRate;const conv=v=>tgt==='VND'?Math.round(v*rate):round2(v*rate);grpDraft.a=conv(grpDraft.origTotal||0);grpEdItems=(grpDraft.origItems||[]).map(it=>{const val=conv(it.a);return{n:it.n,c:it.c,a:val>0?val:0.01,uid:it.uid||uid}});}
  }
  const isFx=cur!==tgt;
  const fxBox=isFx?`<div class="card" style="padding:10px 12px;margin:8px 0;background:var(--bg);border:1px solid var(--bl)">
    <div style="font-weight:600;font-size:13.5px;margin-bottom:6px">💱 Phát hiện ngoại tệ: <b>${cur}</b> (${fmtOrigAmt(grpDraft.origTotal||0,cur)})</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <button type="button" class="btn ${grpDraft.fxMode!=='keep'?'':'o'}" style="padding:6px 10px;font-size:13px" onclick="applyGrpScanCurrency('convert')">🔄 Quy đổi sang ${curUnit(tgt)}</button>
      <button type="button" class="btn ${grpDraft.fxMode==='keep'?'':'o'}" style="padding:6px 10px;font-size:13px" onclick="applyGrpScanCurrency('keep')">📌 Giữ nguyên số tiền gốc (${cur})</button>
    </div>
    ${grpDraft.fxMode!=='keep'?`<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><span class="mu" style="font-size:12.5px">Tỷ giá 1 ${cur} =</span><input class="money" style="max-width:140px;padding:5px 8px" value="${fmtN(grpDraft.fxRate||getFxRate(cur,tgt))}" onchange="applyGrpScanCurrency('convert',this.value)"><span class="mu" style="font-size:12.5px">${curUnit(tgt)}</span><button type="button" class="btn o" style="padding:3px 8px;font-size:11.5px" onclick="delete grpDraft.customFxRate;syncLiveFxRates(true).then(ok=>{if(typeof flash==='function')flash(ok?(lang==='en'?'✅ Exchange rates updated!':'✅ Đã cập nhật tỷ giá mới nhất!'):(lang==='en'?'⚠️ Could not fetch live rates, using cached rate':'⚠️ Không lấy được tỷ giá trực tuyến, đang dùng tỷ giá lưu tạm'));applyGrpScanCurrency('convert')})">${lang==='en'?'🔄 Update rate':'🔄 Cập nhật tỷ giá'}</button>${fxLiveUpdatedAt?`<span class="mu" style="font-size:11.5px">· ${lang==='en'?'Rate updated:':'Tỷ giá:'} ${esc(fxLiveUpdatedAt)}</span>`:''}</div>`:`<div class="mu" style="font-size:12.5px">Giữ nguyên giá trị số gốc từ hóa đơn (${fmtOrigAmt(grpDraft.origTotal||0,cur)} → ${fmtN(grpDraft.origTotal||0)}).</div>`}
  </div>`:'';
  const gAiLocked=!!(grpDraft.dateFound&&!grpDraft.manualDateEdit);
  const dateNote=gAiLocked
    ?`<span class="ok" style="font-size:12px;margin-left:6px">✓ AI tự động nhận diện từ hóa đơn (khóa sửa ngày quá khứ)</span> <a href="#" style="font-size:12px;margin-left:6px;color:var(--bl)" onclick="unlockGrpScanDate();return false">Tự sửa ngày</a>`
    :(grpDraft.dateFound
      ?`<span class="mu" style="font-size:12px;margin-left:6px">(Đang tự sửa: chỉ chọn từ hôm qua trong năm ${CY})</span> <a href="#" style="font-size:12px;margin-left:6px;color:var(--bl)" onclick="restoreAiGrpScanDate();return false">Khôi phục ngày AI (${grpDraft.aiDate})</a>`
      :`<span class="mu" style="font-size:12px;margin-left:6px">(Không thấy ngày trên ảnh, chỉ chọn từ hôm qua trong năm ${CY})</span>`);
  fm.innerHTML=`
    <div class="${grpEdItems.length?'ok':'err'}" style="margin-bottom:6px">${grpEdItems.length?`Đã nhận diện ${grpEdItems.length} món. Bạn có thể sửa từng món hoặc bấm + Chi tiết để thêm món.`:'Chưa tách được món nào từ ảnh. Kiểm tra tổng tiền và bấm + Chi tiết để thêm món.'}</div>
    ${fxBox}
    <label>Cửa hàng / Nội dung</label>
    <input id="g_ss" value="${esc(grpDraft.s)}">
    <label>Tổng tiền (${curUnit(grpDraft.fxMode==='keep'?cur:appCur)})</label>
    <input id="g_sa" class="money" data-grp="1" inputmode="decimal">
    <label>Danh mục chính</label>
    <select id="g_sc">${gOpts}</select>
    <label>Thành viên đã mua</label>
    <select id="g_smem" onchange="syncGrpMemberDefault(this.value)">${memOpts}</select>
    <label>Trạng thái thanh toán</label>
    <input type="hidden" id="g_sgpaid" value="1">
    <div style="display:flex;gap:8px;margin-top:4px">
      <button type="button" id="g_sbtnPaidYes" class="btn" style="flex:1;background:var(--gr)" onclick="setGrpPaidInput(true,'g_s')">✅ Đã chi</button>
      <button type="button" id="g_sbtnPaidNo" class="btn o" style="flex:1" onclick="setGrpPaidInput(false,'g_s')">⏳ Chưa chi</button>
    </div>
    <label>Ngày chi tiêu ${dateNote}</label>
    ${gAiLocked?`<input id="g_sd" type="date" value="${grpDraft.d}" min="${aiMinDate()}" max="${maxDate()}" readonly style="opacity:.85;cursor:not-allowed">`:`<input id="g_sd" type="date" value="${grpDraft.d}" min="${minDate()}" max="${maxDate()}">`}
    ${grpEdHTML(budList)}
    <div id="g_sm" class="err" style="margin:8px 0"></div>
    <button class="btn" id="btnSaveGrpScan" onclick="saveGrpScan()">💾 Lưu vào chi tiêu nhóm</button>`;
  syncGrpIt();
  if(!grpEdItems.length)$('#g_sa').value = grpDraft.a ? fmtN(grpDraft.a) : '';
}

function unlockGrpScanDate(){if(!grpDraft)return;grpDraft.manualDateEdit=true;if(grpDraft.d<minDate())grpDraft.d=today();grpScanForm();}
function restoreAiGrpScanDate(){if(!grpDraft||!grpDraft.aiDate)return;grpDraft.manualDateEdit=false;grpDraft.d=grpDraft.aiDate;grpScanForm();}

async function saveGrpScan(){
  if(busyLock.saveGrpScan)return;
  const grp=myGroups.find(g=>g.id===activeGroupId);
  if(!grp)return;
  const s=($('#g_ss')||{}).value?.trim(), c0=($('#g_sc')||{}).value, d=($('#g_sd')||{}).value, m=$('#g_sm'), btn=$('#btnSaveGrpScan');
  const buyerUid = ($('#g_smem')||{}).value || uid;
  const buyerObj = (grp.members||[]).find(x=>x.user_id===buyerUid);
  const buyerName = buyerObj ? buyerObj.full_name : userName;
  const isPaid = ($('#g_sgpaid')||{}).value === '1';

  let a=num(($('#g_sa')||{}).value,MAXV_GRP), c=c0, its=null;
  if(!d){if(m)m.textContent='Chọn ngày chi tiêu.';return;}
  if(!s){if(m)m.textContent='Nhập tên cửa hàng hoặc nội dung.';return;}
  if(grpEdItems.length){
    if(grpEdItems.some(p=>!p.n.trim()||!(p.a>0))){if(m)m.textContent='Mỗi món cần có tên và số tiền lớn hơn 0.';return;}
    its=grpEdItems.map(p=>{
      const pUid = p.uid || buyerUid;
      const pMem = (grp.members||[]).find(x=>x.user_id===pUid);
      return {...p, n:p.n.trim(), uid:pUid, memberName: pMem ? pMem.full_name : buyerName};
    });
    a=round2(its.reduce((x,p)=>x+p.a,0));
    const mp={};its.forEach(p=>mp[p.c]=(mp[p.c]||0)+p.a);
    c=Object.keys(mp).sort((x,y)=>mp[y]-mp[x])[0];
  }
  if(!(a>0)){if(m)m.textContent='Nhập số tiền lớn hơn 0.';return;}

  busyLock.saveGrpScan=true;
  if(btn){btn.disabled=true;btn.textContent='Đang lưu...';}
  try{
    const newItem={
      id:'gex_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      group_id:activeGroupId,
      uid:buyerUid,
      memberName:buyerName,
      d, s, c, a,
      edits:0,
      paid:isPaid,
      ts:Date.now()
    };
    if(its)newItem.items=its;
    if(sb){
      let saved=false;
      try{
        const basePayload={
          group_id:activeGroupId, user_id:buyerUid, member_name:buyerName, spent_on:d, shop:s, category:c, amount:a
        };
        let {data:ins, error}=await sb.from('group_expenses').insert({...basePayload, is_paid:isPaid, edit_count:0, items:its||[]}).select().single();
        if(error){
          console.warn('group_expenses insert (đầy đủ):',error);
          const fallback=await sb.from('group_expenses').insert(basePayload).select().single();
          ins=fallback.data; error=fallback.error;
        }
        if(!error && ins){newItem.id=ins.id;saved=true}
        else if(error)console.error('group_expenses insert:',error);
      }catch(e){console.error('group_expenses insert:',e)}
      if(!saved){
        if(m)m.textContent='Không lưu được lên máy chủ. Kiểm tra mạng hoặc quyền của bạn trong nhóm rồi thử lại.';
        flash('Chưa lưu được hóa đơn vào chi tiêu nhóm.');
        return;
      }
    }
    grpEx.unshift(newItem);
    saveLocalGrpEx(activeGroupId, grpEx);
    if(inM(newItem,mAdd(0).key)) grpAlertCheck(grp.name, c);
    grpDraft=null;
    grpEdItems=[];
    grpOp.add(newItem.id);
    flash('Đã lưu hóa đơn quét vào chi tiêu nhóm!');
    grpTab='history';
    render();
  }finally{
    busyLock.saveGrpScan=false;
    if(btn){btn.disabled=false;btn.textContent='💾 Lưu vào chi tiêu nhóm';}
  }
}

function grpHistList(budList, canEditFlag){
  const curGrp = myGroups.find(g=>g.id===activeGroupId);
  if(!curGrp) return '';
  const isLeader = curGrp.owner_id === uid;
  const me = (curGrp.members || []).find(m=>m.user_id===uid);
  const canEdit = canEditFlag !== undefined ? canEditFlag : (isLeader || (me && me.can_edit));
  const mems = curGrp.members || [{user_id:uid, full_name:userName}];
  const activeBuds = budList || (grpBuds.length ? grpBuds : cats.map(c=>({n:c.n,b:c.b,c:c.c})));
  const gParts = e => {
    const its = e.items || [];
    const r = e.a - its.reduce((s,p)=>s+p.a,0);
    return its.length ? (r>0 ? [...its, {n:'Các khoản khác', c:e.c, a:r, uid:e.uid, memberName:e.memberName}] : its) : [{n:e.s, c:e.c, a:e.a, uid:e.uid, memberName:e.memberName}];
  };
  const flt = [...grpEx].sort((a,b)=>b.d.localeCompare(a.d) || (b.ts||0)-(a.ts||0)).filter(e=>(!grpHf.c||gParts(e).some(p=>p.c===grpHf.c))&&(!grpHf.q||(e.s+' '+e.memberName+' '+gParts(e).map(p=>p.n+' '+(p.memberName||'')).join(' ')).toLowerCase().includes(grpHf.q.toLowerCase())));
  const sumFlt = flt.reduce((s,e)=>s+(grpHf.c?gParts(e).filter(p=>p.c===grpHf.c).reduce((x,p)=>x+p.a,0):e.a),0);
  const gBudOpts = sel => activeBuds.map(c=>`<option value="${esc(c.n)}" ${c.n===sel?'selected':''}>${esc(c.n)}</option>`).join('');
  const gMemOpts = sel => mems.map(m=>`<option value="${esc(m.user_id)}" ${m.user_id===sel?'selected':''}>${esc(m.full_name)}</option>`).join('');
  return `<div class="row" style="margin-bottom:10px"><span class="mu">${flt.length} hóa đơn nhóm (Bấm vào từng dòng để xem & sửa chi tiết từng món)</span><b>Tổng cộng: ${fmtVnd(sumFlt)}</b></div>
    ${flt.length ? flt.map(e=>{
      const isOpen = grpOp.has(e.id);
      const its = e.items || [];
      const rem = e.a - its.reduce((s,p)=>s+p.a,0);
      const uCats = [...new Set(gParts(e).map(p=>p.c))];
      const edCnt = e.edits || 0;
      const isPaid = e.paid !== false;
      return `<div class="card" style="padding:0;margin-bottom:10px;background:var(--bg)">
        <button class="hh" onclick="tgGrpEx('${e.id}')" aria-expanded="${isOpen}">
          <span>${isOpen?'▾':'▸'}</span>
          <span class="mu">${e.d.split('-').reverse().join('/')}</span>
          <span class="tag" style="background:var(--navy)">${esc(e.memberName)}</span>
          <b>${esc(e.s)}</b>
          <span>${uCats.map(tag).join(' ')}</span>
          <span class="tag" style="background:${isPaid?'var(--gr)':'var(--am)'}">${isPaid?'✅ Đã chi':'⏳ Chưa chi'}</span>
          ${(window.BankVault && window.BankVault.getSealInfoForExpense(e)) ? `<span class="tag" style="background:var(--bl);cursor:pointer" title="Bấm để kiểm tra niêm phong" onclick="event.stopPropagation();verifyGroupSeal('${e.id}')">🔐 Đã niêm phong quỹ · Kiểm tra</span>` : ''}
          <span class="mu">${its.length ? its.length+' món' : 'chưa chi tiết'}</span>
          <b>${fmtVnd(e.a)}</b>
        </button>
        ${isOpen ? `<div style="padding:0 18px 16px">
          ${(canEdit && grpEditId===e.id) ? `
            <div class="card" style="background:var(--card);margin-bottom:12px">
              <label style="margin-top:0">Tên cửa hàng / nội dung</label>
              <input id="ges_${e.id}" value="${esc(e.s)}">
              <label>Ngày</label>
              <input id="ged_${e.id}" type="date" value="${e.d}" min="${minDate()}" max="${maxDate()}">
              <label>Tổng tiền (${curUnit(e.cur)})</label>
              <input id="gea_${e.id}" class="money" data-grp="1" inputmode="decimal" value="${fmtN(e.a)}">
              <label>Danh mục chính</label>
              <select id="gec_${e.id}">${gBudOpts(e.c)}</select>
              <label>Thành viên đã mua</label>
              <select id="gemem_${e.id}">${gMemOpts(e.uid)}</select>
              <div class="mu" style="margin-top:8px">Bạn chỉ được sửa tối đa 3 lần cho mỗi hóa đơn (còn ${Math.max(0,3-edCnt)} lần).</div>
              <div id="gem_${e.id}" class="err" style="margin:6px 0"></div>
              <button class="btn" onclick="saveGrpEdit('${e.id}')">Lưu thay đổi</button>
              <button class="btn o" onclick="grpEditId=null;updGrpHist()">Hủy</button>
            </div>` : (canEdit ? `<div class="row" style="align-items:center;margin-bottom:10px;flex-wrap:wrap">
              <span class="mu">Đã sửa ${edCnt}/3 lần</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${edCnt<3
                  ? `<button class="btn o" style="padding:4px 10px;font-size:13px;border-color:${isPaid?'var(--gr)':'var(--am)'};color:${isPaid?'var(--gr)':'var(--am)'}" onclick="toggleGrpPaid('${e.id}')">${isPaid?'✅ Đã chi':'⏳ Chưa chi'}</button>
                     <button class="btn o" style="padding:4px 10px;font-size:13px" onclick="grpEditId='${e.id}';updGrpHist()">✏️ Sửa (còn ${3-edCnt} lần)</button>
                     ${(() => {
                       const sInfo = window.BankVault && window.BankVault.getSealInfoForExpense ? window.BankVault.getSealInfoForExpense(e) : null;
                       if (sInfo && sInfo.onChain && !e._editingSealed) {
                         return `<span class="tag" style="background:var(--bl);padding:5px 10px">🔐 Đã khóa đối soát (${esc(sInfo.requestId)})</span>
                           <button class="btn o" style="padding:4px 10px;font-size:13px" onclick="unlockAndReSealExpense('${e.id}')">✏️ Sửa & nối revision</button>`;
                       }
                       if (sInfo && e._editingSealed) {
                         return `<button class="btn" style="padding:4px 10px;font-size:13px;background:var(--bl)" onclick="e._editingSealed=false;sealGroupExpenseOnChain('${e.id}')">⛓️ Ghi phiên bản mới lên Fuji</button>`;
                       }
                       return `<button class="btn" style="padding:4px 10px;font-size:13px;background:var(--navy)" onclick="sealGroupExpenseOnChain('${e.id}')">🔐 Khóa đối soát hóa đơn</button>`;
                     })()}`
                  : `<span class="mu" style="padding:4px 6px;font-size:13px">Hết lượt sửa (3/3)</span>`}
              </div>
            </div>` : '')}
          ${window.renderReimburseHTML ? window.renderReimburseHTML(e, canEdit) : ''}
          <div class="scroll"><table>
            <tr><th>Tên món</th><th>Danh mục</th><th>Thành viên</th><th class="r">Số tiền</th>${canEdit?'<th></th>':''}</tr>
            ${its.map((p,j)=>`<tr>
              <td>${canEdit ? `<input style="padding:4px 8px" value="${esc(p.n)}" onchange="updGrpDet('${e.id}',${j},'n',this.value)">` : esc(p.n)}</td>
              <td>${canEdit ? `<select style="padding:4px 8px;width:auto" onchange="updGrpDet('${e.id}',${j},'c',this.value)">${gBudOpts(p.c)}</select>` : tag(p.c)}</td>
              <td>${canEdit ? `<select style="padding:4px 8px;width:auto" onchange="updGrpDet('${e.id}',${j},'uid',this.value)">${gMemOpts(p.uid||e.uid)}</select>` : `<span class="tag" style="background:var(--navy)">${esc(p.memberName||e.memberName)}</span>`}</td>
              <td class="r">${canEdit ? `<input class="money" data-grp="1" inputmode="decimal" style="padding:4px 8px;width:120px;text-align:right" value="${fmtN(p.a)}" onchange="updGrpDet('${e.id}',${j},'a',this.value)">` : fmt(p.a)}</td>
              ${canEdit ? `<td><button class="btn o" style="padding:2px 8px" onclick="delGrpDet('${e.id}',${j})">✕</button></td>` : ''}
            </tr>`).join('')}
            ${rem>0 ? `<tr><td class="mu">Các khoản khác (chưa chi tiết)</td><td>${tag(e.c)}</td><td><span class="tag" style="background:var(--navy)">${esc(e.memberName)}</span></td><td class="r">${fmtVnd(rem)}</td>${canEdit?'<td></td>':''}</tr>` : ''}
          </table></div>
          ${canEdit ? `
            <label>Thêm món vào hóa đơn này${rem>0?` (còn ${fmtVnd(rem)} chưa chi tiết)`:''}</label>
            <div class="ir ir5">
              <input id="gdn_${e.id}" placeholder="Tên món">
              <input id="gda_${e.id}" class="money" data-grp="1" inputmode="decimal" placeholder="Số tiền">
              <select id="gdc_${e.id}">${gBudOpts(e.c)}</select>
              <select id="gdmem_${e.id}">${gMemOpts(e.uid)}</select>
              <button class="btn" onclick="addGrpDet('${e.id}')">+ Chi tiết</button>
            </div>
            <div id="gdm_${e.id}" class="err"></div>
            ${edCnt<3
              ? `<button class="btn o" style="margin-top:8px;color:var(--rd)" onclick="delGrpExpense('${e.id}')">🗑️ Xóa hóa đơn</button><span class="mu" style="margin-left:8px;font-size:13px">Xóa tính là 1 lần sửa</span>`
              : `<div class="mu" style="margin-top:8px">Đã hết lượt sửa nên không thể xóa hóa đơn này.</div>`}` : ''}
        </div>` : ''}
      </div>`;
    }).join('') : '<div class="mu">Nhóm chưa có giao dịch nào khớp bộ lọc.</div>'}`;
}
function updGrpHist(){
  const el=$('#ghl');
  if(el) el.innerHTML=grpHistList();
  else render();
}

function tgGrpEx(eid){
  if(grpOp.has(eid)){grpOp.delete(eid);if(grpEditId===eid)grpEditId=null;}
  else grpOp.add(eid);
  updGrpHist();
}

async function unlockAndReSealExpense(eid){
  const grp=myGroups.find(g=>g.id===activeGroupId);
  const e=grpEx.find(x=>x.id===eid);
  if(!e)return;
  const isLeader = grp && grp.owner_id === uid;
  const me = grp && (grp.members || []).find(m => m.user_id === uid);
  const canEdit = isLeader || (me && me.can_edit);
  if(!canEdit) return flash('Bạn chỉ có quyền xem trong nhóm này.');
  ask('Mở chỉnh sửa hóa đơn đã niêm phong "' + e.s + '"? Bản niêm phong gốc (v1) trên Fuji vẫn được giữ nguyên; sau khi sửa xong bạn có thể nối thêm phiên bản mới (revision).', async () => {
    e._editingSealed = true;
    grpEditId = eid;
    if(Array.isArray(e.items)) e.items = e.items.filter(x => x && !x._avax_seal);
    flash('✏️ Đang mở chỉnh sửa hóa đơn (giữ nguyên hash gốc v1).');
    updGrpHist();
  }, 'Mở chỉnh sửa');
}

async function saveGrpEdit(eid){
  const grp=myGroups.find(g=>g.id===activeGroupId);
  const e=grpEx.find(x=>x.id===eid);
  if(!e)return;
  if(window.BankVault && window.BankVault.getSealInfoForExpense(e) && !e._editingSealed){
    return flash('🔒 Hóa đơn đã khóa đối soát SHA-256, không thể sửa trực tiếp. Hãy bấm "Sửa & nối revision" trước.');
  }
  const s=($('#ges_'+eid)||{}).value?.trim(), d=($('#ged_'+eid)||{}).value, a=num(($('#gea_'+eid)||{}).value,MAXV_GRP), c=($('#gec_'+eid)||{}).value, m=$('#gem_'+eid);
  const newUid = ($('#gemem_'+eid)||{}).value || e.uid;
  const memObj = grp && (grp.members||[]).find(x=>x.user_id===newUid);
  const newMemName = memObj ? memObj.full_name : e.memberName;
  const sum=(e.items||[]).reduce((x,p)=>x+p.a,0);
  if(!s){if(m)m.textContent='Nhập tên cửa hàng hoặc nội dung.';return;}
  if(!d){if(m)m.textContent='Chọn ngày chi tiêu.';return;}
  if(!(a>0)){if(m)m.textContent='Nhập số tiền lớn hơn 0.';return;}
  if(a<sum){if(m)m.textContent='Số tiền không được nhỏ hơn tổng các món đã chi tiết ('+fmtVnd(sum)+').';return;}
  if((e.edits||0)>=3){if(m)m.textContent='Hóa đơn này đã hết lượt sửa (3/3).';return;}
  if(s===e.s && d===e.d && a===e.a && c===e.c && newUid===e.uid){
    grpEditId=null;
    return updGrpHist();
  }
  e.s=s; e.d=d; e.a=a; e.c=c; e.uid=newUid; e.memberName=newMemName;
  e.edits=(e.edits||0)+1;
  saveLocalGrpEx(activeGroupId, grpEx);
  grpEditId=null;
  flash('Đã lưu thay đổi hóa đơn nhóm ('+e.edits+'/3 lần sửa).');
  render();
  await safeDb(async ()=>{
    const {error}=await sb.from('group_expenses').update({shop:s,spent_on:d,amount:a,category:c,user_id:newUid,member_name:newMemName,edit_count:e.edits,items:e.items||[]}).eq('id',eid);
    if(error) await sb.from('group_expenses').update({shop:s,spent_on:d,amount:a,category:c,user_id:newUid,member_name:newMemName}).eq('id',eid);
  });
}

function addGrpDet(eid){
  const grp=myGroups.find(g=>g.id===activeGroupId);
  const e=grpEx.find(x=>x.id===eid);
  if(!e)return;
  const rem=e.a-(e.items||[]).reduce((s,p)=>s+p.a,0);
  const n=($('#gdn_'+eid)||{}).value?.trim(), a=num(($('#gda_'+eid)||{}).value,MAXV_GRP);
  let c=($('#gdc_'+eid)||{}).value;
  const pUid=($('#gdmem_'+eid)||{}).value || e.uid;
  const memObj = grp && (grp.members||[]).find(x=>x.user_id===pUid);
  const pMemName = memObj ? memObj.full_name : e.memberName;
  const m=$('#gdm_'+eid);
  if(!n){if(m)m.textContent='Nhập tên món.';return;}
  if(!(a>0)){if(m)m.textContent='Nhập số tiền lớn hơn 0.';return;}
  if(a>rem){if(m)m.textContent=`Số tiền vượt phần còn lại của hóa đơn (${fmtVnd(rem)}).`;return;}
  if(c===e.c)c=guess(n,c);
  e.items=e.items||[];
  e.items.push({n,c,a,uid:pUid,memberName:pMemName});
  saveLocalGrpEx(activeGroupId, grpEx);
  safeDb(()=>sb.from('group_expenses').update({items:e.items||[]}).eq('id',eid));
  render();
}

function updGrpDet(eid, idx, field, val){
  const grp=myGroups.find(g=>g.id===activeGroupId);
  const e=grpEx.find(x=>x.id===eid);
  if(!e||!e.items||!e.items[idx])return;
  if(window.BankVault && window.BankVault.getSealInfoForExpense(e) && !e._editingSealed){
    flash('🔒 Hóa đơn đã khóa đối soát SHA-256, không thể sửa từng món.');
    return updGrpHist();
  }
  if(field==='a'){
    const nv=num(val,MAXV_GRP);
    const otherSum=e.items.reduce((s,p,i)=>i===idx?s:s+p.a,0);
    if(!(nv>0) || otherSum+nv > e.a){
      flash('Số tiền món không hợp lệ hoặc vượt quá tổng hóa đơn.');
      return render();
    }
    e.items[idx].a=nv;
  }else if(field==='n'){
    if(!val.trim())return render();
    e.items[idx].n=val.trim();
  }else if(field==='c'){
    e.items[idx].c=val;
  }else if(field==='uid'){
    const memObj = grp && (grp.members||[]).find(x=>x.user_id===val);
    e.items[idx].uid=val;
    e.items[idx].memberName = memObj ? memObj.full_name : e.memberName;
  }
  saveLocalGrpEx(activeGroupId, grpEx);
  safeDb(()=>sb.from('group_expenses').update({items:e.items||[]}).eq('id',eid));
  render();
}

function delGrpDet(eid, idx){
  const e=grpEx.find(x=>x.id===eid);
  if(!e||!e.items)return;
  if(window.BankVault && window.BankVault.getSealInfoForExpense(e) && !e._editingSealed){
    flash('🔒 Hóa đơn đã khóa đối soát SHA-256, không thể xóa món.');
    return updGrpHist();
  }
  e.items.splice(idx,1);
  saveLocalGrpEx(activeGroupId, grpEx);
  safeDb(()=>sb.from('group_expenses').update({items:e.items||[]}).eq('id',eid));
  render();
}

async function deleteGroup(gid){
  const grp = myGroups.find(g => g.id === gid);
  const guard = window.getGroupFundGuard ? window.getGroupFundGuard(gid) : { balance: 0, pendingReimburseCount: 0, pendingDepositsCount: 0, hasOpenFunds: false };
  const otherMems = grp ? (grp.members || []).filter(m => m.user_id !== uid) : [];
  if(guard.hasOpenFunds && otherMems.length > 0){
    return flash('🔒 Nhóm vẫn còn số dư quỹ (' + fmtVnd(guard.balance) + ') hoặc khoản hoàn tiền đang chờ. Hãy quyết toán hết hoặc bàn giao quyền Trưởng nhóm trước khi xóa!');
  }
  ask('Xóa nhóm này? Toàn bộ dữ liệu riêng của nhóm sẽ bị xóa, dữ liệu cá nhân của bạn không bị ảnh hưởng.', async ()=>{
    if(sb){
      await safeDb(()=>sb.from('group_expenses').delete().eq('group_id', gid));
      const rmMem = await sb.from('group_members').delete().eq('group_id', gid);
      const rmGrp = await sb.from('groups').delete().eq('id', gid);
      if(rmMem.error && rmGrp.error){
        const rmSelf = await sb.from('group_members').delete().eq('group_id', gid).eq('user_id', uid);
        if(rmSelf.error) return flash('Không thể xóa nhóm: ' + rmSelf.error.message);
      }
    }
    try{
      localStorage.removeItem(gStoreKey('ex_'+gid));
      localStorage.removeItem(gStoreKey('bud_'+gid));
    }catch(e){}
    myGroups = myGroups.filter(g => g.id !== gid);
    if(activeGroupId === gid){ activeGroupId = null; grpEx = []; }
    flash('Đã xóa nhóm thành công!');
    render();
  }, 'Xóa nhóm');
}
