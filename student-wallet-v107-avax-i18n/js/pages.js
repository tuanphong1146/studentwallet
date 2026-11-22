const pages={
dashboard:()=>`<div class="top" style="align-items:center;margin-bottom:14px"><div><h1>Tổng quan</h1><div class="sub" style="margin-bottom:0">Tháng ${CM}, ${CY}</div></div><a class="btn" href="#scan" style="text-decoration:none">+ Quét hóa đơn</a></div>
<div class="card" style="background:linear-gradient(135deg, var(--navy), #2d3b76);color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px">
  <div style="display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer" onclick="accOpen('profile')" title="Đổi ảnh đại diện & hồ sơ">
    ${renderAvatarBadge(userName||'bạn', userAvatar||loadUserAvatarLocal(uid), 40, 'border:2px solid rgba(255,255,255,0.35)', uid, 'greetAvatar')}
    <div style="min-width:0">
      <div style="font-size:12px;opacity:0.85">Xin chào,</div>
      <div id="greetName" data-no-xl="1" style="font-size:17px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(cleanName(userName)||'bạn')} 👋</div>
    </div>
  </div>
  <div style="font-size:12px;text-align:right;white-space:nowrap;line-height:1.5;flex-shrink:0">
    <div><b>${NOW.toLocaleDateString(LOC())}</b></div>
    <div><span style="color:#4cd137">●</span> Đã đồng bộ</div>
  </div>
</div>
<div class="g4"><div class="card"><span class="mu">Tổng chi tiêu</span><div class="kpi" style="color:var(--rd)">${fmtVnd(total())}</div></div>
<div class="card"><span class="mu">Ngân sách</span><div class="kpi" style="color:var(--yl)">${fmt(bud())}</div></div>
<div class="card"><span class="mu">Còn lại</span><div class="kpi" style="color:var(--gr)">${fmtCur(bud()-vndToCur(total()))}</div></div>
<div class="card" style="border-left:4px solid var(--bl)"><span class="mu">Hóa đơn đã quét</span><div class="kpi" style="color:var(--bl)">${scanned}</div></div></div>
<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px"><h2 style="margin:0">${lang==='en'?'Budget tracking':'Theo dõi ngân sách'}</h2>${chartControlsHTML(true)}</div>${donutChart(null, dashChartMode==='budget', dashChartSort)}</div>
<div class="card"><h2>Giao dịch gần đây</h2><div class="scroll"><table class="mt"><tr><th>Ngày</th><th>Tên cửa hàng</th><th>Danh mục</th><th class="r">Số tiền</th></tr>${trows(sorted().slice(0,5))}</table></div></div>`,

expenses:()=>`<h1>Thêm khoản chi</h1><div class="sub">Nhập thủ công. Hóa đơn có nhiều món thì bấm + Chi tiết để tách từng món.</div>
<div class="card" id="expCard" style="max-width:${ed.items.length?'1080px':'560px'}">
  <div id="persSplit" class="exp-split${ed.items.length?' has-items':''}">
    <div>
      <label style="margin-top:0">Tên cửa hàng / nội dung</label><input id="s" placeholder="VD: Siêu thị Co.opmart">
      <label>Ngày</label><input id="d" type="date" value="${today()}" min="${minDate()}" max="${maxDate()}">
      <label>Tổng tiền (${curUnit(appCur)})</label><input id="a" class="money" inputmode="decimal" placeholder="50.000">
      <label>Danh mục chính</label><select id="c">${catOpts()}</select>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn o" onclick="addIt()">+ Chi tiết</button>
        <button class="btn" onclick="addEx()">Lưu khoản chi</button>
      </div>
      <div id="m" class="err" style="margin:8px 0"></div>
    </div>
    <div class="exp-side">
      <div class="row" style="align-items:center;margin-bottom:10px">
        <b style="font-size:15px">Chi tiết từng món (<span id="itCnt">${ed.items.length}</span>)</b>
        <button class="btn o" style="padding:4px 10px;font-size:13px" onclick="addIt()">+ Thêm món</button>
      </div>
      <div id="it" class="exp-scroll">${itRows()}</div>
    </div>
  </div>
</div>`,

history:()=>`<h1>Lịch sử chi tiêu</h1><div class="sub">Bấm vào từng hóa đơn để xem các món bên trong và thêm chi tiết.</div>
<div class="card"><div class="g2e"><div><label>Tìm cửa hàng hoặc món</label><input value="${esc(hf.q)}" placeholder="VD: nồi, rau, Grab" oninput="hf.q=this.value;ei=null;hist()"></div>
<div><label>Danh mục</label><select onchange="hf.c=this.value;ei=null;hist()"><option value="">Tất cả danh mục</option>${cats.map(c=>`<option value="${esc(c.n)}" ${c.n===hf.c?'selected':''}>${esc(c.n)}</option>`).join('')}</select></div></div></div><div id="hl">${histList()}</div>`,

budget:()=>`<h1>Ngân sách</h1><div class="sub">Đặt ngân sách cho từng danh mục trong tháng ${CM}, ${CY}.</div>
<div class="g2e" style="align-items:start"><div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px"><h2 style="margin:0">${lang==='en'?'Used amount (Pie chart)':'Mức đã dùng (Biểu đồ tròn)'}</h2>${chartControlsHTML(false)}</div><div id="bl">${donutChart(null, true, dashChartSort)}</div></div>
<div class="card"><div class="row" style="align-items:center"><h2 style="margin:0">Đặt ngân sách tháng</h2><button class="btn" onclick="bAdd=!bAdd;render()" aria-label="Thêm ngân sách">+</button></div>
${bAdd?`<div class="card" style="margin:12px 0 0;background:var(--bg)"><label>Tên ngân sách</label><input id="bn" placeholder="VD: Sức khỏe"><label>Số tiền (đ)</label><input id="bv" class="money" inputmode="decimal" placeholder="1.000.000"><label style="display:flex;align-items:center;gap:8px">Màu <span id="bnPrev" class="cdot" style="background:${budNewCol()};cursor:default"></span></label>${palHTML(budNewCol(),budUsedCols(-1),'pickNewCol(','bpalNew')}<div id="bm" class="err" style="margin:8px 0"></div><button class="btn" onclick="addBud()">Thêm</button> <button class="btn o" onclick="bAdd=false;bNewCol='';render()">Hủy</button></div>`:''}
<div data-bl style="${cats.length>5?'max-height:360px;overflow-y:auto;padding-right:8px;':''}margin-top:6px">${cats.map((c,i)=>`<div class="bri" data-bi="${i}"><div class="br" style="align-items:center;gap:10px"><div style="flex:1"><div style="display:flex;align-items:center;gap:6px;margin:12px 0 4px"><button type="button" class="bdh" onpointerdown="budDragStart(event,${i})" aria-label="Kéo để sắp xếp" title="Kéo để sắp xếp">${BUDICO.grip}</button><button type="button" class="cdot" style="background:${esc(c.c||pickFixedColor(c.n))}" onclick="budPick=budPick===${i}?-1:${i};render()" aria-label="Đổi màu" aria-expanded="${budPick===i}" title="Đổi màu"></button><label style="margin:0;flex:1;min-width:0">${esc(c.n)}</label><button type="button" class="mvb" onclick="moveBud(${i},0)" ${i===0?'disabled':''} aria-label="Lên đầu" title="Lên đầu">${BUDICO.top}</button><button type="button" class="mvb" onclick="moveBud(${i},cats.length-1)" ${i===cats.length-1?'disabled':''} aria-label="Xuống cuối" title="Xuống cuối">${BUDICO.bot}</button></div>${budPick===i?palHTML(c.c,budUsedCols(i),`setBudCol(${i},`):''}<input class="money" inputmode="decimal" value="${fmtN(c.b)}" oninput="cats[${i}].b=num(this.value);updBud()" onchange="setBud(${i},this.value)"></div><button class="btn o" onclick="delBud(${i})" aria-label="Xóa ngân sách">✕</button></div></div>`).join('')}</div>
<label>Cảnh báo khi đạt (%)</label><input type="number" min="50" max="100" value="${thr}" onchange="setThr(this.value)"><div id="m" class="ok" style="margin-top:10px"></div>
<div class="row" style="margin-top:14px"><b>Tổng ngân sách</b><b id="tb">${fmt(bud())}</b></div></div></div>`,

scan:()=>`<h1>Quét hóa đơn</h1><div class="sub">Tải ảnh hóa đơn, AI đọc thông tin, tách từng món và gợi ý danh mục tự động. Bạn có thể sửa trước khi lưu.</div>
<div class="g2e"><div class="card"><h2>1. Tải ảnh lên</h2><label class="drop" for="f" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="event.preventDefault();this.classList.remove('drag');if(event.dataTransfer&&event.dataTransfer.files[0])doScan(event.dataTransfer.files[0])"><span id="pv">Chọn, chụp hoặc kéo thả ảnh hóa đơn (JPG, PNG)</span></label><input id="f" type="file" accept="image/*" hidden onchange="doScan(this.files[0])"><div class="mcam"><button class="btn" onclick="$('#fc').click()">📷 Chụp ảnh</button><button class="btn o" onclick="$('#f').click()">🖼️ Chọn từ thư viện</button></div><input id="fc" type="file" accept="image/*" capture="environment" hidden onchange="doScan(this.files[0])">
<div id="pg" style="margin-top:12px"></div></div>
<div class="card"><h2>2. Kiểm tra và chỉnh sửa</h2><div id="fm" class="mu">Thông tin trích xuất sẽ hiện ở đây sau khi quét.</div></div></div>`,


groups:()=>{
  const curGrp = myGroups.find(g=>g.id===activeGroupId);
  const curMKey = mAdd(0).key;
  const prevMKey = mAdd(-1).key;

  let groupBoxHTML = '';
  if(curGrp && curGrp.myStatus === 'pending'){
    groupBoxHTML = `<div class="card" style="border:2px solid var(--am);background:var(--card);margin-bottom:22px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <div>
          <span class="tag" style="background:var(--am)">⏳ ĐANG CHỜ TRƯỞNG NHÓM DUYỆT</span>
          <h2 style="margin:8px 0 4px">${esc(curGrp.name)}</h2>
          <div class="mu" style="font-size:13.5px">Yêu cầu tham gia nhóm của bạn đã được gửi tới Trưởng nhóm <b>${esc(curGrp.owner_name||'Trưởng nhóm')}</b>. Sau khi được phê duyệt, bạn mới có thể xem lịch sử chi tiêu và quỹ chung của nhóm.</div>
        </div>
        <button class="btn o" style="color:var(--rd)" onclick="cancelJoinRequest('${curGrp.id}')">✕ Hủy yêu cầu</button>
      </div>
    </div>`;
  } else if(curGrp){
    const isLeader = curGrp.owner_id === uid;
    const me = (curGrp.members || []).find(m=>m.user_id===uid);
    const canEdit = isLeader || (me && me.can_edit);
    const roleLabel = isLeader ? '👑 Trưởng nhóm (Toàn quyền)' : (canEdit ? '✏️ Thành viên (Được chỉnh sửa)' : '👁️ Thành viên (Chỉ được xem)');

    const mEx = grpEx.filter(e=>inM(e,curMKey));
    const gTotal = mEx.reduce((s,e)=>s+e.a,0);
    const gPrevTotal = grpEx.filter(e=>inM(e,prevMKey)).reduce((s,e)=>s+e.a,0);
    const gSpentCat = n => mEx.filter(e=>e.c===n).reduce((s,e)=>s+e.a,0);
    const activeBuds = grpBuds.length ? grpBuds : cats.map(c=>({n:c.n,b:c.b,c:c.c}));
    const gTotalBud = activeBuds.reduce((s,c)=>s+c.b,0);
    const mems = curGrp.members || [];

    if(!canEdit && (grpTab === 'add' || grpTab === 'scan')) grpTab = 'overview';

    let tabBody = '';
    if(grpTab === 'overview'){
      tabBody = `
        ${(()=>{
          const ovCats = activeBuds.filter(c=>c.b>0 && gSpentCat(c.n)>c.b);
          const warnCats = activeBuds.filter(c=>c.b>0 && gSpentCat(c.n)<=c.b && (gSpentCat(c.n)/c.b*100)>=grpThr);
          let banner = '';
          if(gTotalBud>0 && gTotal>gTotalBud){
            banner += `<div class="card" style="background:rgba(217,69,69,0.12);border:1px solid var(--rd);padding:12px 16px;margin-bottom:14px;color:var(--rd)"><b>⚠️ Cảnh báo giới hạn ngân sách nhóm:</b> Tổng chi tiêu nhóm đã vượt giới hạn ngân sách tháng (${fmtVnd(gTotal)} / ${fmt(gTotalBud)})!</div>`;
          } else if(ovCats.length){
            banner += `<div class="card" style="background:rgba(217,69,69,0.12);border:1px solid var(--rd);padding:12px 16px;margin-bottom:14px;color:var(--rd)"><b>⚠️ Vượt hạn mức danh mục nhóm:</b> ${ovCats.map(c=>`${esc(c.n)} (${Math.round(gSpentCat(c.n)/c.b*100)}%)`).join(', ')}.</div>`;
          } else if(warnCats.length){
            banner += `<div class="card" style="background:rgba(224,146,43,0.12);border:1px solid var(--am);padding:12px 16px;margin-bottom:14px;color:var(--am)"><b>🔔 Sắp chạm ngưỡng ngân sách (${grpThr}%):</b> ${warnCats.map(c=>`${esc(c.n)} (${Math.round(gSpentCat(c.n)/c.b*100)}%)`).join(', ')}.</div>`;
          }
          return banner;
        })()}
        <div class="g4">
          <div class="card" style="background:var(--bg)"><span class="mu">Tổng chi tiêu nhóm (T${CM})</span><div class="kpi" style="color:var(--rd)">${fmtVnd(gTotal)}</div></div>
          <div class="card" style="background:var(--bg)"><span class="mu">Giới hạn ngân sách nhóm</span><div class="kpi" style="color:var(--yl)">${fmt(gTotalBud)}</div></div>
          <div class="card" style="background:var(--bg)"><span class="mu">Còn lại</span><div class="kpi" style="color:var(--${gTotalBud-gTotal<0?'rd':'gr'})">${fmtCur(gTotalBud - vndToCur(gTotal))}</div></div>
          <div class="card" style="background:var(--bg)"><span class="mu">Bình quân / thành viên</span><div class="kpi" style="color:var(--bl)">${fmtVnd(mems.length ? gTotal/mems.length : 0)}</div></div>
        </div>

        <h3 style="margin:14px 0 10px;font-size:16px">Đóng góp chi tiêu từng thành viên (Tháng ${CM}/${CY})</h3>
        <div class="biz-grid">
          ${mems.map(m=>{
            const ms = mEx.filter(e=>e.uid===m.user_id).reduce((s,e)=>s+e.a,0);
            const sh = gTotal ? Math.round(ms/gTotal*100) : 0;
            const mAv = m.avatar || (m.user_id === uid ? (userAvatar || loadUserAvatarLocal(uid)) : '');
            return `<div class="biz-card" style="background:var(--bg);border-left-color:var(--bl)">
              <div class="biz-lbl" style="display:flex;align-items:center;gap:6px">${renderAvatarBadge(m.full_name, mAv, 22, '', m.user_id)}<span>${esc(m.full_name)}</span></div>
              <div class="biz-val">${fmtVnd(ms)}</div>
              <div class="biz-sub">Tỷ trọng: <b>${sh}%</b> tổng chi nhóm</div>
            </div>`;
          }).join('')}
        </div>

        <h3 style="margin:14px 0 10px;font-size:16px">Giao dịch gần đây của nhóm</h3>
        <div class="scroll"><table>
          <tr><th>Ngày</th><th>Thành viên</th><th>Cửa hàng / Nội dung</th><th>Danh mục</th><th>Trạng thái</th><th class="r">Số tiền</th></tr>
          ${mEx.length ? mEx.slice(0,8).map(e=>{
            const edCnt = e.edits || 0;
            return `<tr>
            <td>${e.d.split('-').reverse().join('/')}</td>
            <td><span class="tag" style="background:var(--navy)">${esc(e.memberName)}</span></td>
            <td>${esc(e.s)}</td>
            <td>${tag(e.c)}</td>
            <td>${(canEdit && edCnt<3)
              ? `<button class="btn o" style="padding:3px 9px;font-size:12px;border-color:${e.paid?'var(--gr)':'var(--am)'};color:${e.paid?'var(--gr)':'var(--am)'}" onclick="toggleGrpPaid('${e.id}')">${e.paid?'✅ Đã chi':'⏳ Chưa chi'}</button>`
              : `<span class="tag" style="background:${e.paid?'var(--gr)':'var(--am)'}">${e.paid?'✅ Đã chi':'⏳ Chưa chi'}</span>`}</td>
            <td class="r"><b>${fmtVnd(e.a)}</b></td>
          </tr>`;
          }).join('') : '<tr><td colspan="6" class="mu">Chưa có giao dịch riêng nào trong nhóm tháng này.</td></tr>'}
        </table></div>`;
    } else if(grpTab === 'scan' && canEdit){
      tabBody = `
        <div class="g2e">
          <div class="card" style="background:var(--bg);margin:0">
            <h3 style="margin:0 0 10px">1. Tải ảnh hóa đơn nhóm</h3>
            <label class="drop" for="gf" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="event.preventDefault();this.classList.remove('drag');if(event.dataTransfer&&event.dataTransfer.files[0])doGrpScan(event.dataTransfer.files[0])">
              <span id="gpv">Chọn, chụp hoặc kéo thả ảnh hóa đơn nhóm (JPG, PNG)</span>
            </label>
            <input id="gf" type="file" accept="image/*" hidden onchange="doGrpScan(this.files[0])"><div class="mcam"><button class="btn" onclick="$('#gfc').click()">📷 Chụp ảnh</button><button class="btn o" onclick="$('#gf').click()">🖼️ Chọn từ thư viện</button></div><input id="gfc" type="file" accept="image/*" capture="environment" hidden onchange="doGrpScan(this.files[0])">
            <div id="gpg" style="margin-top:12px"></div>
          </div>
          <div class="card" style="background:var(--bg);margin:0">
            <h3 style="margin:0 0 10px">2. Kiểm tra & Lưu vào nhóm</h3>
            <div id="gfm" class="mu">${grpDraft ? '' : 'Thông tin trích xuất sẽ hiện ở đây sau khi quét.'}</div>
          </div>
        </div>`;
    } else if(grpTab === 'add' && canEdit){
      const memOpts = mems.map(m=>`<option value="${esc(m.user_id)}" ${m.user_id===uid?'selected':''}>${esc(m.full_name)}</option>`).join('');
      tabBody = `
        <div id="grpAddWrap" style="max-width:${grpEdItems.length?'100%':'560px'}">
          <h3 style="margin:0 0 12px">Thêm khoản chi mới cho nhóm (Tách biệt hoàn toàn với ví cá nhân)</h3>
          <div id="grpSplit" class="exp-split${grpEdItems.length?' has-items':''}">
            <div>
              <label style="margin-top:0">Tên cửa hàng / nội dung</label>
              <input id="gs" placeholder="VD: Tiền điện nước, Đi siêu thị chung...">
              <label>Ngày chi tiêu</label>
              <input id="gd" type="date" value="${today()}" min="${minDate()}" max="${maxDate()}">
              <label>Tổng tiền (${curUnit()})</label>
              <input id="ga" class="money" data-grp="1" inputmode="decimal" placeholder="150.000">
              <label>Danh mục chính</label>
              <select id="gc">${activeBuds.map(c=>`<option value="${esc(c.n)}">${esc(c.n)}</option>`).join('')}</select>
              <label>Thành viên đã mua</label>
              <select id="gmem" onchange="syncGrpMemberDefault(this.value)">${memOpts}</select>
              <label>Trạng thái thanh toán</label>
              <input type="hidden" id="gpaid" value="1">
              <div style="display:flex;gap:8px;margin-top:4px">
                <button type="button" id="btnPaidYes" class="btn" style="flex:1;background:var(--gr)" onclick="setGrpPaidInput(true)">✅ Đã chi</button>
                <button type="button" id="btnPaidNo" class="btn o" style="flex:1" onclick="setGrpPaidInput(false)">⏳ Chưa chi</button>
              </div>
              <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn o" onclick="addGrpIt()">+ Chi tiết</button>
                <button class="btn" id="btnSaveGrpExp" onclick="addGrpExpense()">💾 Lưu khoản chi nhóm</button>
              </div>
              <div id="gm_add" class="err" style="margin:8px 0"></div>
            </div>
            <div class="exp-side">
              <div class="row" style="align-items:center;margin-bottom:10px">
                <b style="font-size:15px">Chi tiết từng món (<span id="gitCnt">${grpEdItems.length}</span>)</b>
                <button class="btn o" style="padding:4px 10px;font-size:13px" onclick="addGrpIt()">+ Thêm món</button>
              </div>
              ${grpEdHTML(activeBuds, true)}
            </div>
          </div>
        </div>`;
    } else if(grpTab === 'history'){
      tabBody = `
        <div class="g2e" style="margin-bottom:12px">
          <div><label>Tìm cửa hàng, món hoặc thành viên</label><input value="${esc(grpHf.q)}" placeholder="VD: WinMart, Rau củ, Tuấn Phong..." oninput="grpHf.q=this.value;updGrpHist()"></div>
          <div><label>Lọc danh mục</label><select onchange="grpHf.c=this.value;updGrpHist()"><option value="">Tất cả danh mục</option>${activeBuds.map(c=>`<option value="${esc(c.n)}" ${c.n===grpHf.c?'selected':''}>${esc(c.n)}</option>`).join('')}</select></div>
        </div>
        <div id="ghl">${grpHistList(activeBuds, canEdit)}</div>`;
    } else if(grpTab === 'budget'){
      const gChartData = activeBuds.map((c,idx)=>({
        n: c.n,
        v: gSpentCat(c.n),
        b: c.b,
        c: c.c || cc(c.n) || PAL[idx % PAL.length]
      }));
      tabBody = `
        <div class="g2e">
          <div>
            <h3 style="margin:0 0 12px">Mức đã dùng của nhóm (Tháng ${CM}/${CY})</h3>
            ${donutChart(gChartData, true)}
          </div>
          <div>
            <div class="row" style="align-items:center;margin-bottom:10px">
              <h3 style="margin:0">Thiết lập ngân sách nhóm ${canEdit?'':'(Chỉ xem)'}</h3>
              ${canEdit ? `<button class="btn" onclick="grpBAdd=!grpBAdd;render()" aria-label="Thêm ngân sách nhóm">+</button>` : ''}
            </div>
            ${(canEdit && grpBAdd) ? `
              <div class="card" style="margin:0 0 12px;background:var(--bg)">
                <label style="margin-top:0">Tên danh mục ngân sách nhóm</label>
                <input id="gbn" placeholder="VD: Quỹ liên hoan, Điện nước...">
                <label>Số tiền (đ)</label>
                <input id="gbv" class="money" data-grp="1" inputmode="decimal" placeholder="1.000.000">
                <label style="display:flex;align-items:center;gap:8px">Màu <span id="gbPrev" class="cdot" style="background:${gbNewColor()};cursor:default"></span></label>${palHTML(gbNewColor(),gbUsed(-1),'pickGrpNewCol(','gpalNew')}
                <div id="gbm" class="err" style="margin:8px 0"></div>
                <button class="btn" onclick="addGrpBud()">Thêm</button>
                <button class="btn o" onclick="grpBAdd=false;gbNewCol='';render()">Hủy</button>
              </div>` : ''}
            <div class="mu" style="font-size:12.5px;margin-bottom:8px">Giới hạn tối đa mỗi danh mục: <b>50.000.000.000 đ</b>. Hệ thống tự động cảnh báo khi chi tiêu chạm ngưỡng.</div>
            <div style="${activeBuds.length>5?'max-height:320px;overflow-y:auto;padding-right:8px;':''}">
            ${activeBuds.map((c,i)=>{
              const sp = gSpentCat(c.n);
              const pctUsed = c.b>0 ? Math.round(sp/c.b*100) : (sp>0?101:0);
              const barCls = pctUsed>100 ? 'x' : (pctUsed>=grpThr ? 'w' : '');
              return `<div style="margin-bottom:10px">
                <div class="br">
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:4px">${canEdit?`<button type="button" class="cdot" style="background:${esc(c.c||'#888')}" onclick="gbPick=gbPick===${i}?-1:${i};render()" aria-label="Đổi màu" aria-expanded="${gbPick===i}" title="Đổi màu"></button>`:`<span class="cdot" style="background:${esc(c.c||'#888')};cursor:default"></span>`}<label style="margin:0">${esc(c.n)} <span class="mu">(${fmtVnd(sp)} / ${fmt(c.b)} — <b>${pctUsed}%</b>)</span></label></div>
                    ${(canEdit&&gbPick===i)?palHTML(c.c,gbUsed(i),`setGrpBudCol(${i},`):''}
                    <input class="money" data-grp="1" inputmode="decimal" value="${fmtN(c.b)}" ${canEdit?`onchange="setGrpBud(${i},this.value)"`:'disabled'}>
                  </div>
                  ${canEdit ? `<button class="btn o" onclick="delGrpBud(${i})" aria-label="Xóa ngân sách nhóm">✕</button>` : ''}
                </div>
                <div class="bar" style="margin:6px 0 4px"><i class="${barCls}" style="width:${Math.min(pctUsed,100)}%"></i></div>
                ${pctUsed>100?'<div class="err" style="font-size:12px">Đã vượt giới hạn ngân sách nhóm!</div>':(pctUsed>=grpThr?`<div style="color:var(--am);font-size:12px">Đã chạm ngưỡng cảnh báo (${grpThr}%)!</div>`:'')}
              </div>`;
            }).join('')}
            </div>
            <label>Ngưỡng cảnh báo ngân sách nhóm (%)</label>
            <input type="number" min="50" max="100" value="${grpThr}" ${canEdit?'onchange="setGrpThr(this.value)"':'disabled'}>
            <div class="row" style="margin-top:14px;padding-top:10px;border-top:1px solid var(--bd)">
              <b>Tổng giới hạn ngân sách nhóm</b>
              <b>${fmt(gTotalBud)}</b>
            </div>
          </div>
        </div>`;
    } else if(grpTab === 'report'){
      const m12=Array.from({length:12},(_,i)=>mAdd(i-11));
      const m12Vals=m12.map(x=>grpEx.filter(e=>inM(e,x.key)).reduce((s,e)=>s+e.a,0));
      const df = gPrevTotal ? (gTotal - gPrevTotal)/gPrevTotal*100 : 0;

      const memStats = mems.map(m=>{
        const mTx = mEx.filter(e=>e.uid===m.user_id);
        const spentAmt = mTx.reduce((s,e)=>s+e.a,0);
        return {
          uid: m.user_id,
          name: m.full_name,
          isLeader: m.user_id === curGrp.owner_id,
          spent: spentAmt,
          txCount: mTx.length,
          share: gTotal ? (spentAmt / gTotal * 100) : 0
        };
      }).sort((a,b)=>b.spent - a.spent);
      const topSpender = memStats.length && memStats[0].spent > 0 ? memStats[0] : null;

      tabBody = `
        <div class="g2e" style="align-items:stretch;margin-bottom:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="card" style="background:var(--bg);margin:0"><span class="mu">Chi tiêu tháng ${CM}</span><div class="kpi">${fmtVnd(gTotal)}</div><div class="biz-sub">So với T${mAdd(-1).m}: <b style="color:var(--${df>0?'rd':'gr'})">${df>0?'+':''}${df.toFixed(1)}%</b></div></div>
            <div class="card" style="background:var(--bg);margin:0;border-left:4px solid var(--am)">
              <span class="mu">🏆 Chi tiêu nhiều nhất (T${CM})</span>
              <div class="kpi" style="color:var(--am);font-size:20px">${topSpender ? esc(topSpender.name) : 'Chưa có'}</div>
              <div class="biz-sub">${topSpender ? `<b>${fmtVnd(topSpender.spent)}</b> (${topSpender.share.toFixed(1)}% tổng chi nhóm)` : 'Chưa có giao dịch tháng này'}</div>
            </div>
            <div class="card" style="background:var(--bg);margin:0"><span class="mu">Lũy kế 12 tháng</span><div class="kpi">${fmtVnd(m12Vals.reduce((s,v)=>s+v,0))}</div></div>
            <div class="card" style="background:var(--bg);margin:0"><span class="mu">Số giao dịch T${CM}</span><div class="kpi">${mEx.length}</div><div class="biz-sub">TB: <b>${fmtVnd(mEx.length?gTotal/mEx.length:0)}</b>/lần</div></div>
          </div>

          <div class="card" style="background:var(--bg);margin:0;display:flex;flex-direction:column">
            <div class="row" style="align-items:center;margin-bottom:8px">
              <h3 style="margin:0;font-size:15.5px">Bảng xếp hạng chi tiêu thành viên (T${CM}/${CY})</h3>
              <div style="display:flex;gap:4px">
                <button class="btn o" style="padding:2px 8px;font-size:12px" aria-label="Cuộn lên" onclick="$('#rankScroll').scrollBy({top:-90,behavior:'smooth'})">▲</button>
                <button class="btn o" style="padding:2px 8px;font-size:12px" aria-label="Cuộn xuống" onclick="$('#rankScroll').scrollBy({top:90,behavior:'smooth'})">▼</button>
              </div>
            </div>
            <div id="rankScroll" class="scroll" style="max-height:190px;overflow-y:auto;flex:1"><table>
              <thead><tr><th style="position:sticky;top:0;z-index:2">Hạng</th><th style="position:sticky;top:0;z-index:2">Thành viên</th><th class="r" style="position:sticky;top:0;z-index:2">GD</th><th class="r" style="position:sticky;top:0;z-index:2">Tổng đã chi</th><th class="r" style="position:sticky;top:0;z-index:2">Tỷ trọng</th></tr></thead>
              <tbody>${memStats.map((ms, idx)=>`<tr style="${idx===0&&ms.spent>0?'background:rgba(224,146,43,0.12)':''}">
                <td><b>${idx===0&&ms.spent>0?'🥇 #1':'#'+(idx+1)}</b></td>
                <td><b>${esc(ms.name)}</b> ${idx===0&&ms.spent>0?'<span class="tag" style="background:var(--am)">Top 1</span>':''}</td>
                <td class="r">${ms.txCount}</td>
                <td class="r"><b>${fmtVnd(ms.spent)}</b></td>
                <td class="r">${ms.share.toFixed(1)}%</td>
              </tr>`).join('')}</tbody>
            </table></div>
          </div>
        </div>

        <h3 style="margin:10px 0 8px">Biểu đồ chi tiêu nhóm 12 tháng</h3>
        ${bars(m12Vals, m12.map(x=>'T'+x.m))}
        <div class="scroll" style="margin-top:14px;${activeBuds.length>5?'max-height:265px;overflow-y:auto;':''}"><table>
          <thead><tr><th style="position:sticky;top:0;z-index:2">Danh mục</th><th class="r" style="position:sticky;top:0;z-index:2">Tháng ${mAdd(-1).m}</th><th class="r" style="position:sticky;top:0;z-index:2">Tháng ${CM}</th><th class="r" style="position:sticky;top:0;z-index:2">Tỷ trọng</th></tr></thead>
          <tbody>${activeBuds.map(c=>{
            const spPrev = grpEx.filter(e=>inM(e,prevMKey)&&e.c===c.n).reduce((s,e)=>s+e.a,0);
            const spCur = gSpentCat(c.n);
            const sh = gTotal ? (spCur/gTotal*100) : 0;
            return `<tr><td>${tag(c.n)}</td><td class="r">${fmtVnd(spPrev)}</td><td class="r"><b>${fmtVnd(spCur)}</b></td><td class="r">${sh.toFixed(1)}%</td></tr>`;
          }).join('')}</tbody>
        </table></div>`;
        } else if(grpTab === 'vault'){
      const bankCfg = window.BankVault ? window.BankVault.getGroupBankConfig(curGrp.id) : { bankBin: '970422', accountNo: '', accountName: '' };
      const vSum = window.BankVault ? window.BankVault.computeSummary(curGrp.id) : { totalIn: 0, paidOut: 0, pendingOut: 0, balance: 0, memberContributions: [], deposits: [], reimbursements: [], treasury: { lockedVnd: 0, apyPct: 6.5, monthlyPayrollVnd: 0 } };
      const banksList = (window.BankVault && window.BankVault.banks) || [];
      const bankLabel = window.BankVault ? window.BankVault.getBankLabel(bankCfg.bankBin) : 'MB Bank';

      tabBody = `
        <div class="card" style="background:var(--bg);border-left:4px solid var(--bl);margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="tag" style="background:var(--bl)">NGÂN HÀNG (VND) + FUJI AUDIT</span>
              <h3 style="margin:0;font-size:17px">Quỹ Chung Minh Bạch • ${esc(curGrp.name)}</h3>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              ${(() => {
                const cAddr = window.AvalancheBridge ? window.AvalancheBridge.contractAddress : '0xA83681B88c175eF1d73224002989D0F64bA45aa6';
                const shortAddr = cAddr.slice(0, 6) + '…' + cAddr.slice(-4);
                return `<a href="https://testnet.snowtrace.io/address/${esc(cAddr)}" target="_blank" rel="noopener" class="tag" style="background:var(--navy);text-decoration:none" title="Contract Audit Fuji: ${esc(cAddr)}">⛓️ Fuji Contract: ${esc(shortAddr)}</a>
                <button type="button" class="btn o" style="padding:4px 8px;font-size:12px" onclick="const cur=window.AvalancheBridge?window.AvalancheBridge.contractAddress:'';const next=prompt('Nhập địa chỉ contract StudentGroupVaultV4 mới deploy trên Avalanche Fuji (43113):',cur);if(next&&window.AvalancheBridge){try{window.AvalancheBridge.setContractAddress(next);flash('✅ Đã cập nhật địa chỉ contract Fuji!');render();}catch(e){flash('❌ '+e.message);}}">✏️ Đổi Contract</button>`;
              })()}
              <button type="button" class="btn o" style="padding:4px 10px;font-size:12px" onclick="connectFujiAuditWallet()">🦊 Kết nối ví Fuji (Gas Audit)</button>
            </div>
          </div>
          <div class="mu" style="font-size:13px;margin-top:5px">
            Thành viên nạp trực tiếp bằng <b>chuyển khoản ngân hàng (VietQR)</b> vào tài khoản nhận quỹ của nhóm <b>${esc(curGrp.name)}</b> (Mã: <code>${esc(curGrp.group_code)}</code>). Mọi khoản nạp, số dư và hoàn tiền đều tính bằng <b>VNĐ</b> và minh bạch theo từng thành viên.
          </div>

          <div style="margin-top:12px;padding:10px 12px;border:1px solid var(--bd);border-radius:9px;background:var(--card)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
              <div><b>🔐 Fuji Admin & Recorder</b><div class="mu" style="font-size:12px;margin-top:3px">Admin kiểm soát ví được phép ghi receipt/approval audit lên contract. Phí giao dịch Fuji do người ký trả bằng AVAX testnet.</div></div>
              <button type="button" class="btn o" style="padding:4px 9px;font-size:12px" onclick="refreshGroupAdminState()">🔄 Đọc trạng thái on-chain</button>
            </div>
            <div style="font-size:12.5px;margin-top:6px">Admin đang lưu: <code>${esc(window.BankVault.getVaultState(curGrp.id).groupAdminWallet || 'Chưa đọc / chưa khởi tạo')}</code>${window.BankVault.getVaultState(curGrp.id).groupAdminTx ? ` • Tx: <a href="${esc(window.BankVault.getVaultState(curGrp.id).groupAdminExplorerUrl || ('https://testnet.snowtrace.io/tx/' + window.BankVault.getVaultState(curGrp.id).groupAdminTx))}" target="_blank" rel="noopener">${esc(window.BankVault.getVaultState(curGrp.id).groupAdminTx.slice(0, 12))}…</a>` : ''}</div>
            ${isLeader ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn" style="padding:5px 10px;font-size:12.5px;background:var(--navy)" onclick="initGroupAdminOnChain()">🛡️ Khởi tạo / thử khởi tạo admin bằng attestation</button></div>
            <div style="margin-top:10px;display:grid;gap:6px">${(curGrp.members || []).filter(m => m.user_id !== curGrp.owner_id).map(m => {
              const addr = String(m.wallet || '');
              const meta = window.BankVault.getVaultState(curGrp.id).authorizedRecorders || {};
              const rec = addr ? meta[addr.toLowerCase()] : null;
              return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:6px 8px;border:1px solid var(--bd);border-radius:7px"><span>${esc(m.full_name || 'Thành viên')} • <code>${addr ? esc(addr.slice(0, 8) + '…' + addr.slice(-4)) : 'Chưa lưu ví Fuji'}</code> • ${rec ? (rec.allowed ? '<b style="color:var(--gr)">Recorder đang bật</b>' : '<span class="mu">Recorder đang tắt</span>') : '<span class="mu">Chưa đọc trạng thái</span>'}</span>${addr && /^0x[a-fA-F0-9]{40}$/.test(addr) ? `<span style="display:flex;gap:5px"><button type="button" class="btn" style="padding:3px 8px;font-size:11.5px;background:var(--gr)" onclick="grantGroupRecorderAccess('${m.user_id}','${addr}',true)">Cấp quyền</button><button type="button" class="btn o" style="padding:3px 8px;font-size:11.5px" onclick="grantGroupRecorderAccess('${m.user_id}','${addr}',false)">Thu hồi</button></span>` : ''}</div>`;
            }).join('') || '<div class="mu" style="font-size:12px">Chưa có thành viên khác trong nhóm.</div>'}</div>` : '<div class="mu" style="font-size:12px;margin-top:7px">Chỉ trưởng nhóm mới được khởi tạo admin hoặc thay đổi recorder.</div>'}
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--bd)">
            <div style="font-weight:600;font-size:13.5px;margin-bottom:6px">🏦 Tài khoản ngân hàng / Ví MoMo nhận quỹ của nhóm (Thủ quỹ / Trưởng nhóm):</div>
            ${isLeader ? (() => {
              const myBank = window.BankVault && window.BankVault.getPersonalBank ? window.BankVault.getPersonalBank() : null;
              const preBin = bankCfg.accountNo ? bankCfg.bankBin : (myBank ? myBank.bankBin : bankCfg.bankBin);
              const preAcc = bankCfg.accountNo || (myBank ? myBank.accountNo : '');
              const preName = bankCfg.accountNo ? (bankCfg.accountName || '') : (myBank ? (myBank.accountName || '') : '');
              return `
              ${!bankCfg.accountNo && myBank ? `<div style="margin-bottom:8px;padding:7px 10px;border-radius:8px;background:var(--card);border:1px dashed var(--bl);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <span style="font-size:12.5px">💡 Đã điền sẵn từ tài khoản cá nhân của bạn (<b>${esc(myBank.accountNo)}</b>).</span>
                <button type="button" class="btn" style="padding:4px 10px;font-size:12.5px;background:var(--bl)" onclick="useMyBankForGroup(false)">⚡ Dùng ngay TK cá nhân</button>
              </div>` : ''}
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;align-items:end">
                <div>
                  <label style="margin-top:0">Ngân hàng / Ví điện tử</label>
                  <select id="grp-bank-bin" onchange="window.checkBankAccountLive('group')" style="padding:7px 8px">
                    ${banksList.map(b => `<option value="${b.bin}" ${b.bin===preBin?'selected':''}>${esc(b.code)} - ${esc(b.name)}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label style="margin-top:0">Số tài khoản / SĐT nhận quỹ</label>
                  <input id="grp-bank-acc" oninput="window.checkBankAccountLive('group')" value="${esc(preAcc)}" inputmode="numeric" placeholder="VD: 0987654321">
                </div>
                <div>
                  <label style="margin-top:0">Tên chủ tài khoản (không dấu)</label>
                  <input id="grp-bank-name" value="${esc(preName)}" placeholder="VD: NGUYEN VAN A">
                </div>
                <div style="display:flex;gap:6px">
                  <button type="button" class="btn" style="flex:1" onclick="saveGroupBankSettings()">💾 Lưu TK nhận quỹ</button>
                  ${myBank && bankCfg.accountNo !== myBank.accountNo ? `<button type="button" class="btn o" style="padding:7px 9px;white-space:nowrap" title="Dùng tài khoản ngân hàng cá nhân đã lưu" onclick="useMyBankForGroup(false)">⚡ TK cá nhân</button>` : ''}
                </div>
              </div>
            `; })() : `
              <div style="font-size:13.5px;padding:8px 10px;background:var(--card);border-radius:8px;border:1px solid var(--bd)">
                ${bankCfg.accountNo
                  ? `Ngân hàng: <b>${esc(bankLabel)}</b> • STK: <b>${esc(bankCfg.accountNo)}</b> ${bankCfg.accountName ? `• Chủ TK: <b>${esc(bankCfg.accountName)}</b>` : ''}`
                  : '<span class="mu">Trưởng nhóm chưa cấu hình số tài khoản ngân hàng nhận quỹ.</span>'}
              </div>
            `}
          </div>
        </div>

        <div class="g2e" style="align-items:stretch">
          <div class="card" style="background:var(--bg);margin:0;display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="font-weight:700;font-size:15px;margin-bottom:4px">Số dư quỹ nhóm & Nạp tiền qua VietQR</div>
              <div class="mu" style="font-size:12.5px">Số dư khả dụng hiện tại của nhóm <b>${esc(curGrp.name)}</b>:</div>
              <div class="kpi" style="color:var(--bl);margin:6px 0 2px">${fmtVnd(vSum.balance)}</div>
              <div class="mu" style="font-size:12.5px;margin-bottom:10px">Tổng đã nạp: <b>${fmtVnd(vSum.totalIn)}</b> • Đã chi hoàn: <b>${fmtVnd(vSum.paidOut)}</b></div>
            </div>
            <div>
              <div class="br">
                <div>
                  <label style="margin-top:0">Số tiền muốn nạp vào quỹ (VNĐ)</label>
                  <input id="bank-deposit-amount" class="money" inputmode="numeric" placeholder="VD: 500.000">
                </div>
                <button type="button" class="btn" style="background:var(--gr)" onclick="generateDepositVietQR()">📲 Tạo mã QR chuyển khoản</button>
              </div>
              <div id="vietqr-deposit-preview"></div>
            </div>
          </div>

          <div class="card" style="background:var(--bg);margin:0;display:flex;flex-direction:column">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px">Đóng góp của từng thành viên</div>
            <div class="mu" style="font-size:12.5px;margin-bottom:8px">Tổng hợp số tiền chuyển khoản đã được đối soát vào quỹ chung (tách biệt với tổng chi tiêu).</div>
            <div style="flex:1;max-height:240px;overflow-y:auto">
              ${vSum.memberContributions.length
                ? vSum.memberContributions.map(x => `<div class="row" style="padding:7px 0;border-bottom:1px solid var(--bd)"><span>${esc(x.name)}</span><b>${fmtVnd(x.amountVnd)}</b></div>`).join('')
                : '<div class="mu" style="font-size:13px;padding:8px 0">Chưa có khoản nạp quỹ nào được xác nhận.</div>'}
            </div>
          </div>
        </div>

        <div style="margin-top:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:0 0 8px">
            <h3 style="margin:0;font-size:15.5px">${lang==='en'?'Bank transfer deposit history':'Lịch sử nạp quỹ chuyển khoản'} (${vSum.deposits.length})${vSum.deposits.filter(d=>d.status!=='confirmed').length ? ` <span class="tag" style="background:var(--am);margin-left:6px">${vSum.deposits.filter(d=>d.status!=='confirmed').length} ${lang==='en'?'pending':'chờ duyệt'}</span>` : ''}</h3>
            <button type="button" class="btn o" style="padding:5px 10px;font-size:12.5px" onclick="if(window.BankVault&&window.BankVault.syncRemoteLedger){window.BankVault.syncRemoteLedger('${curGrp.id}').then(()=>{if(typeof flash==='function')flash(lang==='en'?'✅ Synced latest group fund ledger!':'✅ Đã đồng bộ dữ liệu quỹ nhóm mới nhất!');render();})}">${lang==='en'?'🔄 Sync fund':'🔄 Đồng bộ quỹ'}</button>
          </div>
          ${vSum.deposits.length
            ? vSum.deposits.slice(0, 15).map(d => `
                <div style="padding:10px 12px;border:1px solid var(--bd);border-radius:8px;margin-top:8px;background:var(--card);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
                  <div>
                    <div style="font-weight:600;font-size:14px">${esc(d.memberName)} • <span style="color:var(--gr)">+${fmtVnd(d.amountVnd)}</span></div>
                    <div class="mu" style="font-size:12px;margin-top:2px">Nội dung CK: <code>${esc(d.note)}</code> • Mã đối soát: <code>${esc(d.receiptHash||'')}</code>${d.approvedByName ? ` • Duyệt bởi: <b>${esc(d.approvedByName)}</b>` : ''}${d.fujiAuditTx ? ` • <a href="${esc(d.fujiExplorerUrl || ('https://testnet.snowtrace.io/tx/' + d.fujiAuditTx))}" target="_blank" rel="noopener" style="color:var(--bl)">⛓️ Fuji Audit Tx</a>` : (d.fujiAuditError ? ` • <span style="color:var(--rd)">⚠️ Lỗi Fuji: ${esc(d.fujiAuditError)}</span>` : '')}</div>
                  </div>
                  <div>
                    ${d.status === 'confirmed'
                      ? (d.fujiAuditTx
                          ? '<span class="tag" style="background:var(--gr)">✅ Đã vào quỹ • ⛓️ Có audit Fuji</span>'
                          : '<span class="tag" style="background:var(--gr)">✅ Đã vào quỹ</span> <span class="tag" style="background:var(--am)" title="Khoản này được duyệt khi chưa kết nối ví Fuji nên chưa có giao dịch on-chain">⚠️ Chưa ghi Fuji</span>')
                      : (isLeader
                          ? `<button type="button" class="btn" style="padding:5px 10px;font-size:12.5px" onclick="approveBankDeposit('${d.id}')">✓ Duyệt đã nhận tiền</button>`
                          : '<span class="tag" style="background:var(--am)">⏳ Chờ trưởng nhóm duyệt</span>')}
                  </div>
                </div>
              `).join('')
            : '<div class="mu" style="font-size:13px">Chưa có giao dịch nạp quỹ nào.</div>'}
        </div>

        <div style="margin-top:16px">
          <h3 style="margin:0 0 8px;font-size:15.5px">Yêu cầu hoàn tiền từ quỹ (${vSum.reimbursements.length})</h3>
          ${vSum.reimbursements.length
            ? vSum.reimbursements.map(r => `
                ${(() => {
                  const cons = window.getReimburseConsensus ? window.getReimburseConsensus(r, curGrp) : { count: 1, required: 1, unlocked: true, hasApproved: false, names: [] };
                  const voterStr = cons.names && cons.names.length ? ` (${cons.names.map(esc).join(', ')})` : '';
                  const approvalAuditState = (r.approvals || []).map(a => {
                    const status = a.fujiAuditStatus || (a.fujiTxHash ? 'unverified' : (a.fujiTxStatus || 'not_recorded'));
                    const color = status === 'verified' ? 'var(--gr)' : (status === 'unverified' || status === 'pending') ? 'var(--am)' : 'var(--rd)';
                    return `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:3px"><span>${esc(a.name || 'Thành viên')}</span><span class="tag" style="background:${color}">${status === 'verified' ? 'Fuji audit verified' : status === 'pending' ? 'Fuji transaction pending' : status === 'unverified' ? 'Chưa đối chiếu (' + esc(a.fujiTxStatus || 'pending') + ')' : '⚠️ Fuji audit ' + esc(status)}</span>${a.fujiTxHash ? `<a href="${esc(a.fujiExplorerUrl || ('https://testnet.snowtrace.io/tx/' + a.fujiTxHash))}" target="_blank" rel="noopener">Tx ${esc(a.fujiTxHash.slice(0,10))}…</a>` : ''}<button type="button" class="btn o" style="padding:2px 6px;font-size:10.5px" onclick="verifyReimburseApproval('${esc(r.id)}','${esc(a.userId)}')">Đối chiếu</button><button type="button" class="btn o" style="padding:2px 6px;font-size:10.5px" onclick="showApprovalAuditHistory('${esc(r.id)}','${esc(a.userId)}')">Lịch sử</button></div>`;
                  }).join('');
                  return `<div style="padding:10px 12px;border:1px solid var(--bd);border-radius:8px;margin-top:8px;background:var(--card);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
                    <div>
                      <div style="font-weight:600;font-size:14px">Hoàn tiền: ${esc(r.shop)} • <span style="color:var(--bl)">${fmtVnd(r.amountVnd)}</span></div>
                      <div class="mu" style="font-size:12px;margin-top:2px">Người nhận: <b>${esc(r.recipientName)}</b> (${esc(r.bankInfo)}) • Hóa đơn #<code>${esc(r.expenseId || '-')}</code></div>
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px">${window.renderReceiptHashBadge ? window.renderReceiptHashBadge(r.expenseId) : ''}</div>
                      ${r.status !== 'paid' ? `<div class="mu" style="font-size:12px;margin-top:3px">🗳️ Đồng thuận chi quỹ: <b>${cons.count}/${cons.required}</b> thành viên đồng ý${voterStr}</div>` : ''}
                      ${approvalAuditState ? `<div style="font-size:11.5px;margin-top:5px"><b>Approval transaction audit:</b>${approvalAuditState}</div>` : ''}
                      ${r.status === 'paid' ? `<div style="margin-top:5px"><span class="tag" style="background:${r.fujiAuditStatus === 'verified' ? 'var(--gr)' : (r.fujiAuditStatus === 'unverified' || r.fujiAuditStatus === 'pending') ? 'var(--am)' : 'var(--rd)'}">${r.fujiAuditStatus === 'verified' ? '✅ Payout audit verified' : '⚠️ Payout audit ' + esc(r.fujiAuditStatus || 'not_recorded')}${r.fujiAuditTxStatus ? ' • tx ' + esc(r.fujiAuditTxStatus) : ''}</span> <button type="button" class="btn o" style="padding:2px 6px;font-size:10.5px" onclick="verifyReimburseApproval('${esc(r.id)}','__payout__')">Đối chiếu</button><button type="button" class="btn o" style="padding:2px 6px;font-size:10.5px" onclick="showApprovalAuditHistory('${esc(r.id)}','__payout__')">Lịch sử</button>${r.fujiAuditStatus !== 'verified' ? '<div style="color:var(--rd);font-size:11.5px;margin-top:3px">⚠️ Tiền hoàn đã ghi nhận trong app nhưng Fuji audit chưa được xác nhận.</div>' : ''}</div>` : ''}
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                      ${r.status === 'paid'
                        ? '<span class="tag" style="background:var(--gr)">✅ Đã chuyển hoàn</span>'
                        : `
                          ${!cons.hasApproved
                            ? `<button type="button" class="btn o" style="padding:5px 10px;font-size:12.5px;border-color:var(--gr);color:var(--gr)" onclick="approveReimburseRequest('${r.id}')">👍 Đồng ý chi (${cons.count}/${cons.required})</button>`
                            : `<span class="tag" style="background:var(--bl)">✓ Bạn đã đồng ý (${cons.count}/${cons.required})</span>`}
                          ${isLeader
                            ? (cons.unlocked
                                ? `<button type="button" class="btn" style="padding:5px 10px;font-size:12.5px;background:var(--bl)" onclick="openReimburseQrModal('${r.id}')">📲 Quét QR hoàn tiền</button>`
                                : `<button type="button" class="btn o" style="padding:5px 10px;font-size:12.5px;opacity:.75" onclick="openReimburseQrModal('${r.id}')">🔒 Chờ đủ phiếu (${cons.count}/${cons.required})</button>`)
                            : (cons.unlocked ? '<span class="tag" style="background:var(--am)">⏳ Đủ phiếu • Chờ thủ quỹ chuyển</span>' : '')}
                        `}
                    </div>
                  </div>`;
                })()}
              `).join('')
            : '<div class="mu" style="font-size:13px">Chưa có yêu cầu hoàn tiền nào. Vào tab <b>Lịch sử chi tiêu</b> để tạo đề nghị hoàn tiền cho hóa đơn.</div>'}
        </div>`;
    } else if(grpTab === 'members'){
      const pendList = curGrp.pendingMembers || [];
      const pendingBox = (isLeader && pendList.length) ? `
        <div class="card" style="background:rgba(224,146,43,0.08);border:1px solid rgba(224,146,43,0.45);margin:0 0 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <h3 style="margin:0;color:var(--am)">⏳ Yêu cầu xin vào nhóm chờ duyệt (${pendList.length})</h3>
            <span class="mu" style="font-size:12.5px">Chỉ khi bạn duyệt, người xin vào mới xem được dữ liệu & quỹ nhóm</span>
          </div>
          <div class="scroll"><table>
            <tr><th>Người xin tham gia</th><th>Mã riêng</th><th class="r">Phê duyệt</th></tr>
            ${pendList.map(pm => `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">${renderAvatarBadge(pm.full_name, pm.avatar, 26, '', pm.user_id)}<b>${esc(pm.full_name)}</b></div></td>
              <td><code>${esc(pm.user_code || '—')}</code></td>
              <td class="r" style="white-space:nowrap">
                <button class="btn" style="padding:5px 10px;font-size:12.5px;background:var(--gr)" onclick="approvePendingMember('${curGrp.id}','${pm.user_id}',false)">✅ Duyệt (Chỉ xem)</button>
                <button class="btn o" style="padding:5px 10px;font-size:12.5px;margin-left:4px" onclick="approvePendingMember('${curGrp.id}','${pm.user_id}',true)">✏️ Duyệt & Cho sửa</button>
                <button class="btn o" style="padding:5px 10px;font-size:12.5px;color:var(--rd);margin-left:4px" onclick="rejectPendingMember('${curGrp.id}','${pm.user_id}')">✕ Từ chối</button>
              </td>
            </tr>`).join('')}
          </table></div>
        </div>
      ` : '';
      tabBody = `
        ${pendingBox}
        <h3 style="margin:0 0 10px">Danh sách thành viên & Phân quyền (${mems.length})</h3>
        <div class="scroll" style="margin-bottom:16px"><table>
          <tr><th>Thành viên</th><th>Vai trò / Quyền hạn</th>${isLeader?'<th class="r">Điều chỉnh quyền</th>':''}</tr>
          ${mems.map(m=>{
            const mIsLeader = m.user_id === curGrp.owner_id;
            const mAv = m.avatar || (m.user_id === uid ? (userAvatar || loadUserAvatarLocal(uid)) : '');
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">${renderAvatarBadge(m.full_name, mAv, 26, '', m.user_id)}<b>${esc(m.full_name)}</b></div></td>
              <td>${mIsLeader
                ? '<span class="tag" style="background:var(--gr)">Trưởng nhóm (Toàn quyền)</span>'
                : (m.can_edit
                    ? '<span class="tag" style="background:var(--bl)">Được chỉnh sửa</span>'
                    : '<span class="tag" style="background:var(--mu)">Chỉ được xem (Mặc định)</span>')
              }</td>
              ${isLeader ? `<td class="r">${mIsLeader ? '<span class="mu">—</span>' : `
                <select aria-label="Quyền thành viên" style="width:auto;padding:4px 8px;display:inline-block" onchange="toggleMemberPermission('${curGrp.id}','${m.user_id}',this.value==='1')">
                  <option value="0" ${!m.can_edit?'selected':''}>Chỉ được xem</option>
                  <option value="1" ${m.can_edit?'selected':''}>Cho phép chỉnh sửa</option>
                </select>
                <button class="btn o" style="padding:4px 8px;font-size:12px;color:var(--rd);margin-left:6px" onclick="removeGroupMember('${curGrp.id}','${m.user_id}')">Xóa</button>
              `}</td>` : ''}
            </tr>`;
          }).join('')}
        </table></div>
        ${isLeader ? `
          <label>Thêm thành viên mới bằng mã riêng (Mặc định khi thêm sẽ ở chế độ Chỉ được xem)</label>
          <div class="br" style="max-width:460px">
            <div><input id="addm_${curGrp.id}" placeholder="Nhập mã riêng người dùng..."></div>
            <button class="btn" id="btnAddMem_${curGrp.id}" onclick="addMemberByUserCode('${curGrp.id}')">+ Thêm vào nhóm</button>
          </div>
          <div id="mm_${curGrp.id}" class="err" style="margin-top:6px"></div>
        ` : '<div class="mu" style="font-size:13px">Chỉ trưởng nhóm mới có thể thêm thành viên và cấp quyền chỉnh sửa.</div>'}`;
    } else if(grpTab === 'settings'){
      const gOpts = getGrpOpts(curGrp.id);
      const otherMems = mems.filter(m => m.user_id !== curGrp.owner_id);
      const guard = window.getGroupFundGuard ? window.getGroupFundGuard(curGrp.id) : { balance: 0, pendingReimburseCount: 0, pendingDepositsCount: 0, hasOpenFunds: false };
      const vSt = window.BankVault ? window.BankVault.getVaultState(curGrp.id) : { handovers: [] };
      const handovers = Array.isArray(vSt.handovers) ? vSt.handovers : [];
      tabBody = `
        <div class="g2e">
          <div class="card" style="background:var(--bg);margin:0">
            <h3 style="margin:0 0 10px">🔔 Tùy chọn nhận thông báo nhóm</h3>
            <div class="mu" style="font-size:13px;margin-bottom:10px">Cài đặt thông báo riêng cho nhóm <b>${esc(curGrp.name)}</b>:</div>
            <label class="sw2" style="margin:10px 0"><input type="checkbox" ${gOpts.budget?'checked':''} onchange="setGrpOpt('${curGrp.id}','budget',this.checked)"> Khi gần chạm ngưỡng ngân sách</label>
            <label class="sw2" style="margin:10px 0"><input type="checkbox" ${gOpts.over?'checked':''} onchange="setGrpOpt('${curGrp.id}','over',this.checked)"> Khi vượt ngân sách</label>
            <label class="sw2" style="margin:10px 0"><input type="checkbox" ${gOpts.weekly?'checked':''} onchange="setGrpOpt('${curGrp.id}','weekly',this.checked)"> Tóm tắt chi tiêu mỗi tuần</label>
          </div>
          <div class="card" style="background:var(--bg);margin:0;border:1px solid rgba(217,69,69,0.35)">
            <h3 style="margin:0 0 10px;color:var(--rd)">⚠️ Rời khỏi nhóm</h3>
            ${isLeader && guard.hasOpenFunds ? `
              <div style="background:rgba(217,69,69,0.1);border:1px solid rgba(217,69,69,0.35);border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:12px">
                <b style="color:var(--rd)">🔒 Đang khóa rời nhóm để bảo vệ quỹ chung:</b>
                <div style="margin-top:4px">• Số dư quỹ đang giữ: <b>${fmtVnd(guard.balance)}</b></div>
                ${guard.pendingReimburseCount > 0 ? `<div>• Phiếu hoàn tiền chưa chi: <b>${guard.pendingReimburseCount} phiếu</b></div>` : ''}
                ${guard.pendingDepositsCount > 0 ? `<div>• Giao dịch nạp quỹ chờ duyệt: <b>${guard.pendingDepositsCount} giao dịch</b></div>` : ''}
                <div class="mu" style="margin-top:6px;font-size:12px">Trưởng nhóm chỉ có thể rời nhóm sau khi đã hoàn/quyết toán hết quỹ hoặc bàn giao quyền Trưởng nhóm & Thủ quỹ cho thành viên khác.</div>
              </div>
            ` : `
              <div class="mu" style="font-size:13px;margin-bottom:14px">Khi rời nhóm, bạn sẽ không còn xem hoặc thêm khoản chi chung trong nhóm <b>${esc(curGrp.name)}</b>. Dữ liệu ví cá nhân của bạn không bị ảnh hưởng.</div>
            `}
            <button class="btn" style="background:var(--rd);color:#fff" onclick="leaveGroup('${curGrp.id}')">🚪 Rời nhóm</button>
          </div>
        </div>
        ${isLeader ? `
          <div class="card" style="background:var(--bg);margin:16px 0 0;border:1px solid rgba(79,127,232,0.4)">
            <h3 style="margin:0 0 8px">👑 Bàn giao quyền Trưởng nhóm & Thủ quỹ</h3>
            <div class="mu" style="font-size:13px;margin-bottom:12px">Nếu bạn muốn rút lui hoặc đổi người giữ quỹ, hãy chọn thành viên kế nhiệm và xác nhận bàn giao số dư quỹ hiện tại (<b>${fmtVnd(guard.balance)}</b>). Hệ thống sẽ ghi nhận biên bản đối soát kèm mã hash chống sửa đổi.</div>
            ${otherMems.length ? `
              <div class="br" style="align-items:flex-end;flex-wrap:wrap">
                <div style="flex:1;min-width:210px">
                  <label style="margin-top:0">Chọn thành viên kế nhiệm</label>
                  <select id="handover_to_${curGrp.id}">
                    ${otherMems.map(m => `<option value="${m.user_id}">${esc(m.full_name)}</option>`).join('')}
                  </select>
                </div>
                <div style="flex:1;min-width:220px">
                  <label style="margin-top:0">Ghi chú bàn giao quỹ (VD: Đã CK sang TK thủ quỹ mới)</label>
                  <input id="handover_note_${curGrp.id}" placeholder="VD: Đã chuyển giao ${fmtN(guard.balance)}đ tiền quỹ">
                </div>
                <button class="btn" onclick="transferGroupLeadership('${curGrp.id}')">🤝 Bàn giao & Chuyển quyền</button>
              </div>
            ` : `<div class="mu" style="font-size:13px">Nhóm hiện chưa có thành viên nào khác để bàn giao quyền trưởng nhóm.</div>`}
            ${handovers.length ? `
              <div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--bd)">
                <div style="font-weight:600;font-size:13px;margin-bottom:6px">📜 Lịch sử biên bản bàn giao quỹ (${handovers.length})</div>
                ${handovers.slice(0,5).map(h => `
                  <div style="font-size:12.5px;padding:6px 8px;border-radius:6px;background:var(--card);border:1px solid var(--bd);margin-bottom:6px">
                    <div><b>${esc(h.fromName)}</b> → <b>${esc(h.toName)}</b> • Số dư bàn giao: <b>${fmtVnd(h.balanceVnd||0)}</b></div>
                    <div class="mu">${esc(h.note||'Bàn giao quyền trưởng nhóm & thủ quỹ')} • ${new Date(h.createdAt).toLocaleString(LOC())} • Mã đối soát: <code>${esc((h.hash||'').slice(0,12))}…</code></div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}`;
    }

    groupBoxHTML = `
    <div id="grpRectBox" class="card" style="border:2px solid var(--bl);border-radius:12px;padding:22px;box-shadow:0 8px 24px rgba(0,0,0,0.12);margin-bottom:22px">
      <div class="row" style="align-items:center;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid var(--bd);margin-bottom:16px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="tag" style="background:var(--bl)">NHÓM CHI TIÊU</span>
            <h2 style="margin:0;font-size:22px">${esc(curGrp.name)}</h2>
            <span class="mu" style="font-size:13px">• Trưởng nhóm: <b>${esc(curGrp.owner_name)}</b></span>
            <span class="mu" style="font-size:13px">• Mã nhóm: <b>${esc(curGrp.group_code)}</b></span>
            <button onclick="copyTxt('${esc(curGrp.group_code)}')" class="btn o" style="padding:2px 8px;font-size:12px">Copy mã</button>
          </div>
          <div style="margin-top:6px;font-size:13px;color:var(--bl);font-weight:600">${roleLabel}</div>
        </div>
        <button class="btn o" onclick="openGroupBox(null)">✕ Đóng bảng nhóm</button>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;padding-bottom:2px">
        <button class="${grpTab==='overview'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='overview';render()">📊 Tổng quan</button>
        ${canEdit ? `<button class="${grpTab==='scan'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='scan';grpDraft=null;grpEdItems=[];render()">📷 Quét hóa đơn</button>` : ''}
        ${canEdit ? `<button class="${grpTab==='add'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='add';grpEdItems=[];render()">➕ Thêm khoản chi</button>` : ''}
        <button class="${grpTab==='history'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='history';render()">🧾 Lịch sử chi tiêu</button>
        <button class="${grpTab==='budget'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='budget';render()">💰 Ngân sách</button>
        <button class="${grpTab==='report'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='report';render()">📈 Báo cáo</button>
        <button class="${grpTab==='vault'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='vault';if(activeGroupId)loadGroupData(activeGroupId).then(()=>render());else render()">🔐 Quỹ chung</button>
        <button class="${grpTab==='members'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='members';render()">👥 Thành viên (${mems.length})${(isLeader && (curGrp.pendingMembers||[]).length) ? ` <span class="tag" style="background:var(--am);margin-left:4px">+${(curGrp.pendingMembers||[]).length} chờ duyệt</span>` : ''}</button>
        <button class="${grpTab==='settings'?'btn':'btn o'}" style="padding:7px 9px;font-size:12.5px;white-space:nowrap;flex-shrink:0" onclick="grpTab='settings';render()">⚙️ Cài đặt</button>
      </div>

      <div>${tabBody}</div>
    </div>`;
  }

  return `<h1>Nhóm & Chia sẻ</h1>
  <div class="sub">Quản lý nhóm chi tiêu chung (dữ liệu nhóm tách biệt hoàn toàn với chi tiêu cá nhân).</div>

  <div class="card" style="border-left:4px solid var(--bl);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div>
      <div class="mu" style="font-size:12px;text-transform:uppercase;letter-spacing:.5px">Mã riêng của bạn (Dùng để trưởng nhóm thêm bạn vào nhóm)</div>
      <div style="font-size:24px;font-weight:700;letter-spacing:1.5px;color:var(--bl);margin-top:4px">${esc(userCode || '---')}</div>
    </div>
    <button class="btn" onclick="copyTxt('${esc(userCode)}')">📋 Sao chép mã của tôi</button>
  </div>

  ${(()=>{
    const myBank = (window.BankVault && window.BankVault.getPersonalBank) ? window.BankVault.getPersonalBank() : (window.parseMemberBank ? window.parseMemberBank(userWallet) : null);
    const banksList = (window.BankVault && window.BankVault.banks) || [];
    return `<div class="card" style="border-left:4px solid var(--gr)">
      <div class="mu" style="font-size:12px;text-transform:uppercase;letter-spacing:.5px">Tài khoản ngân hàng / Ví MoMo của bạn (lưu 1 lần để nhận hoàn tiền & dùng nhanh cho mọi nhóm mới)</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;align-items:end;margin-top:8px;max-width:720px">
        <div>
          <label style="margin-top:0">Ngân hàng / Ví điện tử</label>
          <select id="myBankBin" style="padding:7px 8px" onchange="window.checkBankAccountLive('personal')">
            ${banksList.map(b => `<option value="${b.bin}" ${myBank&&myBank.bankBin===b.bin?'selected':''}>${esc(b.code)} - ${esc(b.name)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="margin-top:0">Số tài khoản / SĐT MoMo</label>
          <input id="myBankAcc" value="${esc(myBank?myBank.accountNo:'')}" inputmode="numeric" placeholder="VD: 0987654321" oninput="window.checkBankAccountLive('personal')">
        </div>
        <div>
          <label style="margin-top:0">Tên chủ tài khoản</label>
          <input id="myBankName" value="${esc(myBank?myBank.accountName:'')}" placeholder="VD: NGUYEN VAN A">
        </div>
        <div>
          <button type="button" class="btn" style="width:100%" onclick="savePersonalBankAccount()">💾 Lưu tài khoản</button>
        </div>
      </div>
      <div id="myBankStatus" style="font-size:12px;margin-top:5px"></div><div id="walMsg" class="mu" style="margin-top:4px;font-size:13px">${myBank ? 'Đã lưu (bank_account): '+esc((window.BankVault?window.BankVault.getBankLabel(myBank.bankBin):'')+' • '+myBank.accountNo) : 'Chưa lưu tài khoản ngân hàng. Hãy lưu để thủ quỹ quét QR hoàn tiền nhanh cho bạn.'}</div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--bd)">
        <div style="font-size:12px;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.4px">🦊 Ví Avalanche Fuji C-Chain của bạn (wallet_address — dùng ký & nhận quyền Recorder)</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px;max-width:720px">
          <input id="myFujiWalletInput" value="${esc(window.myFujiWallet || '')}" placeholder="0x... (42 ký tự địa chỉ ví EVM)" style="flex:1;min-width:240px;font-family:monospace">
          <button type="button" class="btn o" onclick="window.fillConnectedFujiWalletToProfile && window.fillConnectedFujiWalletToProfile()">🦊 Lấy từ ví đang kết nối</button>
          <button type="button" class="btn" style="background:var(--navy)" onclick="window.savePersonalFujiWallet && window.savePersonalFujiWallet()">💾 Lưu ví Fuji</button>
        </div>
        <div class="mu" style="font-size:12px;margin-top:4px">${window.myFujiWallet ? 'Ví Fuji đã xác minh định dạng: <code>'+esc(window.myFujiWallet)+'</code> (hiển thị tự động cho trưởng nhóm cấp quyền Recorder).' : 'Chưa lưu ví Fuji. Lưu địa chỉ 0x... để trưởng nhóm cấp quyền ghi audit cho bạn.'}</div>
      </div>
    </div>`;
  })()}

  ${groupBoxHTML}

  <div class="g2e">
    <div class="card">
      <h2>➕ Tạo nhóm mới</h2>
      <label>Tên nhóm chi tiêu</label>
      <input id="gnm" placeholder="VD: Phòng trọ 402, Nhóm đi Đà Lạt...">
      <div id="gm1" class="err" style="margin:8px 0"></div>
      <button class="btn" id="btnCreateGrp" onclick="createGroup()">Tạo nhóm & Lấy mã ngẫu nhiên</button>
    </div>

    <div class="card">
      <h2>🔑 Tham gia nhóm bằng mã nhóm</h2>
      <label>Nhập mã nhóm (VD: GRP-8K9P2X)</label>
      <input id="gjc" placeholder="Nhập mã nhóm được chia sẻ...">
      <div id="gm2" class="err" style="margin:8px 0"></div>
      <div class="mu" style="font-size:12.5px;margin-bottom:8px">🔒 Để bảo mật quỹ nhóm, yêu cầu tham gia qua mã sẽ ở trạng thái <b>Chờ duyệt</b> cho đến khi Trưởng nhóm xác nhận.</div>
      <button class="btn" id="btnJoinGrp" onclick="joinGroupByCode()">Gửi yêu cầu tham gia</button>
    </div>
  </div>

  <div class="card">
    <h2>👥 Danh sách nhóm của bạn (${myGroups.length})</h2>
    ${myGroups.length ? myGroups.map(g=>{
      const isAct = g.id === activeGroupId;
      const isPendingMe = g.myStatus === 'pending';
      const pendCnt = (g.pendingMembers || []).length;
      const mems = g.members || [];
      const otherMems = mems.filter(m => m.user_id !== g.owner_id);
      return `<div class="card" style="background:var(--bg);margin-bottom:12px;border:${isPendingMe?'2px solid var(--am)':(isAct?'2px solid var(--bl)':'1px solid var(--bd)')}">
        <div class="row" style="align-items:center;flex-wrap:wrap">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <b style="font-size:17px">${esc(g.name)}</b>
              ${isPendingMe
                ? `<span class="tag" style="background:var(--am)">⏳ Chờ Trưởng nhóm duyệt</span>`
                : `<span class="tag" style="background:var(--bl)">Mã nhóm: ${esc(g.group_code)}</span>`}
              ${(g.owner_id===uid && pendCnt>0) ? `<span class="tag" style="background:var(--am)">🔔 ${pendCnt} yêu cầu chờ duyệt</span>` : ''}
              <span class="mu" style="font-size:13px">• ${mems.length} thành viên</span>
            </div>
            <div style="margin-top:6px;font-size:13px">
              <span class="mu">Trưởng nhóm:</span> <b>${esc(g.owner_name || 'Trưởng nhóm')}</b>
            </div>
            ${(!isPendingMe && otherMems.length) ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
              ${otherMems.map(m=>`<span class="tag" style="background:var(--navy)">${esc(m.full_name||'Thành viên')}</span>`).join('')}
            </div>` : ''}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${isPendingMe ? `
              <button class="btn o" onclick="loadGroups().then(()=>render())">🔄 Kiểm tra duyệt</button>
              <button class="btn o" style="color:var(--rd)" onclick="cancelJoinRequest('${g.id}')">✕ Hủy yêu cầu</button>
            ` : `
              <button class="btn" onclick="openGroupBox('${g.id}')">📋 Mở bảng chi tiêu nhóm</button>
              <button onclick="copyTxt('${esc(g.group_code)}')" class="btn o">Copy mã</button>
              ${g.owner_id===uid ? `<button onclick="deleteGroup('${g.id}')" class="btn o" style="color:var(--rd)">🗑️ Xóa nhóm</button>` : ''}
            `}
          </div>
        </div>
      </div>`;
    }).join('') : '<div class="mu">Danh sách nhóm đang trống. Bạn có thể tự tạo nhóm mới hoặc nhập mã nhóm ở trên để tham gia!</div>'}
  </div>`;
},

report:()=>{
  const c=mAdd(0),p=mAdd(-1),t=total(),pt=monthTotal(p.key),df=pt?(t-pt)/pt*100:0,cnt=ex.filter(e=>inM(e,c.key)).length;
  const m12=Array.from({length:12},(_,i)=>mAdd(i-11));
  const m12Vals=m12.map(x=>monthTotal(x.key));
  const ytdTotal=m12Vals.reduce((s,v)=>s+v,0);
  const activeMonths=m12Vals.filter(v=>v>0).length||1;
  const burnRate=ytdTotal/activeMonths;
  const totalBud=bud();
  const varAmt=t-totalBud;
  const varPct=totalBud?(varAmt/totalBud*100):0;
  const fixedCost=spent('Tiền nhà');
  const varCost=Math.max(0,t-fixedCost);
  const fixedRatio=t?(fixedCost/t*100):0;
  const eduInvest=spent('Học tập');
  const capexRatio=t?(eduInvest/t*100):0;
  const dayOfMonth=Math.max(1,NOW.getDate());
  const dailyBurn=t/dayOfMonth;
  const remBud=Math.max(0,totalBud-t);
  const runwayDays=dailyBurn>0?Math.floor(remBud/dailyBurn):30;
  const sortedCats=[...cats].map(x=>({n:x.n,v:spent(x.n),b:x.b})).sort((a,b)=>b.v-a.v);
  const top3Sum=sortedCats.slice(0,3).reduce((s,x)=>s+x.v,0);
  const paretoPct=t?(top3Sum/t*100):0;
  const docCode='SW-FIN-'+c.y+String(c.m).padStart(2,'0');
  const todayStr=NOW.toLocaleDateString(LOC());

  return `
  <div class="print-only print-doc-head">
    <div style="display:flex;align-items:center;gap:12px;">
      <img src="${LOGO}" style="width:42px;height:42px;background:#1a2456;border-radius:8px;padding:0;object-fit:cover;" alt="Logo">
      <div>
        <div style="font-size:8.5pt;font-weight:700;color:#4f7fe8;letter-spacing:1px;text-transform:uppercase">STUDENT WALLET • PERSONAL FINANCIAL STATEMENT</div>
        <h1 style="font-size:15pt!important;margin:2px 0;">BÁO CÁO QUẢN TRỊ TÀI CHÍNH CÁ NHÂN (12 THÁNG)</h1>
        <div style="font-size:9pt;color:#555;">Kỳ báo cáo: Tháng ${c.m}/${c.y} (Lũy kế 12 tháng: T${m12[0].m}/${m12[0].y} – T${c.m}/${c.y})</div>
      </div>
    </div>
    <div class="print-meta">
      <div><b>Mã chứng từ:</b> ${docCode}</div>
      <div><b>Ngày lập:</b> ${todayStr}</div>
      <div><b>Đơn vị tính:</b> VNĐ</div>
    </div>
  </div>

  <div class="top no-print" style="align-items:center;">
    <div style="display:flex;align-items:center;gap:14px;">
      <img src="${LOGO}" style="width:44px;height:44px;background:var(--navy);border-radius:10px;padding:0;object-fit:cover;" alt="Logo">
      <div><h1>Báo cáo tài chính 12 tháng</h1><div class="sub" style="margin-bottom:0">Phân tích P&L cá nhân, Budget Variance & Burn Rate — Tháng ${c.m}/${c.y}</div></div>
    </div>
    <button class="btn" onclick="print()">🖨️ In báo cáo chuẩn A4 / Lưu PDF</button>
  </div>

  <div class="g4">
    <div class="card"><span class="mu">Chi tiêu kỳ này (T${c.m})</span><div class="kpi">${fmtVnd(t)}</div><div class="biz-sub">MoM: <b style="color:var(--${df>0?'rd':'gr'})">${df>0?'+':''}${df.toFixed(1)}%</b> so với T${p.m}</div></div>
    <div class="card"><span class="mu">Lũy kế 12 tháng (LTM)</span><div class="kpi">${fmtVnd(ytdTotal)}</div><div class="biz-sub">Bình quân: <b>${fmtVnd(burnRate)}</b>/tháng</div></div>
    <div class="card"><span class="mu">Budget Variance (Chênh lệch NS)</span><div class="kpi" style="color:var(--${varAmt>0?'rd':'gr'})">${varAmt>0?'+':''}${fmtVnd(varAmt)}</div><div class="biz-sub">${varAmt>0?'Unfavorable (Vượt NS)':'Favorable (Đạt NS)'} (${varPct>0?'+':''}${varPct.toFixed(1)}%)</div></div>
    <div class="card"><span class="mu">Cash Runway (Sức chịu đựng)</span><div class="kpi">${runwayDays} ngày</div><div class="biz-sub">Daily Burn: <b>${fmtVnd(dailyBurn)}</b>/ngày</div></div>
  </div>

  <div class="card">
    <h2>Chỉ số phân tích tài chính (Business Analytics)</h2>
    <div class="biz-grid" style="margin-bottom:0">
      <div class="biz-card">
        <div class="biz-lbl">Fixed vs. Variable Cost</div>
        <div class="biz-val">${fixedRatio.toFixed(0)}% / ${(100-fixedRatio).toFixed(0)}%</div>
        <div class="biz-sub">Định phí: ${fmtVnd(fixedCost)} • Biến phí: ${fmtVnd(varCost)}</div>
      </div>
      <div class="biz-card" style="border-left-color:#9b5de5">
        <div class="biz-lbl">Human Capital CAPEX</div>
        <div class="biz-val">${capexRatio.toFixed(1)}%</div>
        <div class="biz-sub">Đầu tư Học tập: ${fmtVnd(eduInvest)} / Tổng chi</div>
      </div>
      <div class="biz-card" style="border-left-color:#2bb3a3">
        <div class="biz-lbl">Pareto 80/20 (Top 3 Danh mục)</div>
        <div class="biz-val">${paretoPct.toFixed(1)}%</div>
        <div class="biz-sub">${sortedCats.slice(0,3).map(x=>x.n).join(', ')}</div>
      </div>
      <div class="biz-card" style="border-left-color:#e0922b">
        <div class="biz-lbl">Transaction Velocity</div>
        <div class="biz-val">${cnt} giao dịch</div>
        <div class="biz-sub">Ticket Size TB: <b>${fmtVnd(cnt?t/cnt:0)}</b>/lần</div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>Báo cáo Variance & Cấu trúc chi phí theo danh mục</h2>
    <div class="scroll" style="${cats.length>5?'max-height:290px;overflow-y:auto;':''}">
      <table>
        <tr>
          <th style="position:sticky;top:0;z-index:2">Danh mục</th>
          <th style="position:sticky;top:0;z-index:2">Phân loại</th>
          <th class="r" style="position:sticky;top:0;z-index:2">Thực chi T${p.m}</th>
          <th class="r" style="position:sticky;top:0;z-index:2">Thực chi T${c.m}</th>
          <th class="r" style="position:sticky;top:0;z-index:2">Ngân sách (Budget)</th>
          <th class="r" style="position:sticky;top:0;z-index:2">Variance</th>
          <th class="r" style="position:sticky;top:0;z-index:2">Tỷ trọng</th>
        </tr>
        ${cats.map(x=>{
          const a=spentIn(x.n,p.key),b=spent(x.n),v=b-x.b,share=t?(b/t*100):0;
          const isCapex=x.n==='Học tập',isFixed=x.n==='Tiền nhà';
          const badge=isCapex?'<span class="badge-capex">CAPEX</span>':(isFixed?'<span class="badge-opex">Fixed OPEX</span>':'<span class="badge-opex">Var OPEX</span>');
          return `<tr>
            <td>${tag(x.n)}</td>
            <td>${badge}</td>
            <td class="r">${fmtVnd(a)}</td>
            <td class="r"><b>${fmt(b)}</b></td>
            <td class="r">${fmt(x.b)}</td>
            <td class="r" style="color:var(--${v>0?'rd':'gr'})">${v>0?'+':''}${fmt(v)}</td>
            <td class="r">${share.toFixed(1)}%</td>
          </tr>`;
        }).join('')}
      </table>
    </div>
  </div>

  <div class="card">
    <div class="row" style="align-items:center;margin-bottom:8px">
      <h2 style="margin:0">Xu hướng dòng tiền chi ra 12 tháng (LTM Cash Outflow)</h2>
      <span class="mu" style="font-size:13px">T${m12[0].m}/${m12[0].y} – T${c.m}/${c.y}</span>
    </div>
    ${trend()}
  </div>

  <div class="print-only print-sign">
    <div>
      <b>NGƯỜI LẬP BÁO CÁO</b><br><span style="font-size:8.5pt;color:#666">(Ký và ghi rõ họ tên)</span>
      <div class="box"></div>
      <div>Sinh viên thực hiện</div>
    </div>
    <div>
      <b>XÁC NHẬN / GHI CHÚ QUẢN TRỊ</b><br><span style="font-size:8.5pt;color:#666">Generated by Student Wallet Analytics</span>
      <div class="box"></div>
      <div>Ngày ${todayStr}</div>
    </div>
  </div>`;
},
};
const NAV=[['dashboard','Tổng quan'],['scan','Quét hóa đơn'],['expenses','Thêm khoản chi'],['history','Lịch sử chi tiêu'],['budget','Ngân sách'],['report','Báo cáo'],['groups','Nhóm & Chia sẻ'],];
