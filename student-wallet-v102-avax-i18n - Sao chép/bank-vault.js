// bank-vault.js (V63) — Quỹ chung chuyển khoản ngân hàng trực tiếp (VietQR) & Đối soát hóa đơn nhóm
const VIETQR_BANKS = [
  { bin: "971005", code: "MOMO", name: "Ví MoMo (SĐT / Tài khoản MoMo)" },
  { bin: "971011", code: "ZALOPAY", name: "Ví ZaloPay (SĐT / Tài khoản ZaloPay)" },
  { bin: "970422", code: "MB", name: "MB Bank (Quân Đội)" },
  { bin: "970436", code: "VCB", name: "Vietcombank" },
  { bin: "970407", code: "TCB", name: "Techcombank" },
  { bin: "970415", code: "CTG", name: "VietinBank" },
  { bin: "970418", code: "BIDV", name: "BIDV" },
  { bin: "970416", code: "ACB", name: "ACB (Á Châu)" },
  { bin: "970432", code: "VPB", name: "VPBank" },
  { bin: "970423", code: "TPB", name: "TPBank" },
  { bin: "970441", code: "VIB", name: "VIB" },
  { bin: "970448", code: "OCB", name: "OCB" },
  { bin: "970403", code: "STB", name: "Sacombank" },
  { bin: "970437", code: "HDB", name: "HDBank" },
  { bin: "970405", code: "VBA", name: "Agribank" },
  { bin: "970443", code: "SHB", name: "SHB" },
  { bin: "970426", code: "MSB", name: "MSB" }
];

window.showVaultNotice = function({ title, message, type = "warn", actionLabel = "", onAction = null, focusId = "" }) {
  const old = document.getElementById("vault-notice-modal");
  if (old) old.remove();

  const colors = {
    warn: { badge: "var(--am)", icon: "⚠️" },
    err: { badge: "var(--rd)", icon: "❗" },
    ok: { badge: "var(--gr)", icon: "✅" },
    info: { badge: "var(--bl)", icon: "ℹ️" }
  };
  const st = colors[type] || colors.warn;
  const isEn = typeof lang !== "undefined" && lang === "en";
  const closeText = isEn ? "Got it" : "Đã hiểu";

  const modal = document.createElement("div");
  modal.id = "vault-notice-modal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.58);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px";
  modal.innerHTML = `
    <div class="card" style="max-width:420px;width:100%;margin:0;border-top:4px solid ${st.badge};box-shadow:0 16px 40px rgba(0,0,0,.28)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:15.5px">
          <span>${st.icon}</span>
          <span>${title}</span>
        </div>
        <button type="button" class="btn o" style="padding:3px 9px;font-size:12px" id="vn-close-x">✕</button>
      </div>
      <div style="font-size:13.8px;line-height:1.5;color:var(--tx);white-space:pre-line;margin-bottom:14px">${message}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
        ${actionLabel ? `<button type="button" class="btn" style="background:${st.badge}" id="vn-action-btn">${actionLabel}</button>` : ""}
        <button type="button" class="btn ${actionLabel ? "o" : ""}" id="vn-close-btn">${closeText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeModal = () => {
    modal.remove();
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus(), 180);
      }
    }
  };

  document.getElementById("vn-close-x")?.addEventListener("click", closeModal);
  document.getElementById("vn-close-btn")?.addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  if (actionLabel && typeof onAction === "function") {
    document.getElementById("vn-action-btn")?.addEventListener("click", () => {
      modal.remove();
      onAction();
    });
  }
};

window.BankVault = {
  banks: VIETQR_BANKS,

  getCurrentGroup() {
    if (typeof myGroups !== "undefined" && typeof activeGroupId !== "undefined" && activeGroupId) {
      const g = myGroups.find(x => x.id === activeGroupId);
      if (g) return g;
    }
    return { id: "default", group_code: "DEFAULT", name: "Nhóm chi tiêu", members: [] };
  },

  removeAccents(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  },

  getBankLabel(binOrCode) {
    const k = String(binOrCode || "").trim().toUpperCase();
    const b = VIETQR_BANKS.find(x => x.bin === k || x.code === k);
    return b ? `${b.code} - ${b.name}` : (k || "Ngân hàng");
  },

  getBankBin(binOrCode) {
    const k = String(binOrCode || "").trim().toUpperCase();
    const b = VIETQR_BANKS.find(x => x.bin === k || x.code === k);
    return b ? b.bin : k;
  },

  buildVietQrUrl({ bankBin, accountNo, accountName, amountVnd, addInfo }) {
    const bin = this.getBankBin(bankBin);
    const acc = String(accountNo || "").replace(/\s+/g, "");
    if (!bin || !acc) return "";
    const amt = Math.max(0, Math.round(Number(amountVnd) || 0));
    const info = encodeURIComponent(this.removeAccents(addInfo).slice(0, 50));
    const name = encodeURIComponent(this.removeAccents(accountName).slice(0, 50));
    let url = `https://img.vietqr.io/image/${encodeURIComponent(bin)}-${encodeURIComponent(acc)}-compact2.png?addInfo=${info}`;
    if (amt > 0) url += `&amount=${amt}`;
    if (name) url += `&accountName=${name}`;
    return url;
  },

  getPersonalBank() {
    try {
      if (typeof userWallet !== "undefined" && userWallet) {
        const p = window.parseMemberBank ? window.parseMemberBank(userWallet) : null;
        if (p && p.accountNo) return p;
      }
      const raw = localStorage.getItem("sw_my_bank_" + (typeof uid !== "undefined" && uid ? uid : "guest"));
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.accountNo) return p;
      }
    } catch (e) {}
    return null;
  },

  getGroupBankConfig(groupId) {
    try {
      const raw = localStorage.getItem("sw_grp_bank_" + groupId);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { bankBin: "970422", accountNo: "", accountName: "" };
  },

  saveGroupBankConfig(groupId, cfg) {
    try {
      localStorage.setItem("sw_grp_bank_" + groupId, JSON.stringify(cfg));
    } catch (e) {}
    if (typeof sb !== "undefined" && sb && groupId && groupId !== "default") {
      const grp = (typeof myGroups !== "undefined" && Array.isArray(myGroups)) ? myGroups.find(g => g.id === groupId) : null;
      const actorId = typeof uid !== "undefined" ? uid : "";
      if (!grp || grp.owner_id !== actorId) return;
      try {
        sb.from("group_budgets").upsert({
          group_id: groupId,
          category: "__vault_bank__",
          amount: 0,
          color: JSON.stringify(cfg),
          threshold: 80
        }, { onConflict: "group_id,category" }).then(() => {}).catch(() => {});
      } catch (e) {}
    }
  },

  getVaultState(groupId) {
    try {
      const raw = localStorage.getItem("sw_vnd_vault_" + groupId);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
          reimbursements: Array.isArray(parsed.reimbursements) ? parsed.reimbursements : [],
          handovers: Array.isArray(parsed.handovers) ? parsed.handovers : [],
          authorizedRecorders: parsed.authorizedRecorders || {},
          groupAdminWallet: parsed.groupAdminWallet || "",
          groupAdminTx: parsed.groupAdminTx || "",
          treasury: parsed.treasury || { lockedVnd: 0, apyPct: 6.5, monthlyPayrollVnd: 0 }
        };
      }
    } catch (e) {}
    return {
      deposits: [],
      reimbursements: [],
      handovers: [],
      authorizedRecorders: {},
      treasury: { lockedVnd: 0, apyPct: 6.5, monthlyPayrollVnd: 0 }
    };
  },

  mergeRemoteLedger(groupId, remote) {
    if (!remote || typeof remote !== "object") return;
    const local = this.getVaultState(groupId);
    const depMap = new Map();
    (local.deposits || []).forEach(d => depMap.set(d.id, d));
    (remote.deposits || []).forEach(d => {
      const ex = depMap.get(d.id);
      if (!ex || d.status === "confirmed") depMap.set(d.id, d);
    });

    const rmbMap = new Map();
    (local.reimbursements || []).forEach(r => rmbMap.set(r.id, r));
    (remote.reimbursements || []).forEach(r => {
      const ex = rmbMap.get(r.id);
      if (!ex) {
        rmbMap.set(r.id, r);
      } else {
        const mergedAppsMap = new Map();
        (ex.approvals || []).forEach(a => { if (a && a.userId) mergedAppsMap.set(a.userId, a); });
        (r.approvals || []).forEach(a => { if (a && a.userId) mergedAppsMap.set(a.userId, a); });
        const mergedApps = Array.from(mergedAppsMap.values());
        const base = (r.status === "paid") ? r : (ex.status === "paid" ? ex : r);
        rmbMap.set(r.id, { ...base, approvals: mergedApps });
      }
    });

    const merged = {
      deposits: Array.from(depMap.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))),
      reimbursements: Array.from(rmbMap.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))),
      handovers: Array.isArray(remote.handovers) ? remote.handovers : (local.handovers || []),
      authorizedRecorders: remote.authorizedRecorders || local.authorizedRecorders || {},
      groupAdminWallet: remote.groupAdminWallet || local.groupAdminWallet || "",
      groupAdminTx: remote.groupAdminTx || local.groupAdminTx || "",
      treasury: remote.treasury && (remote.treasury.lockedVnd || remote.treasury.monthlyPayrollVnd) ? remote.treasury : local.treasury
    };
    try {
      localStorage.setItem("sw_vnd_vault_" + groupId, JSON.stringify(merged));
    } catch (e) {}
  },

  mergeRemoteVaultEvents(groupId, rows) {
    if (!Array.isArray(rows) || !rows.length) return;
    const st = this.getVaultState(groupId);
    rows.forEach(row => {
      const p = row && row.payload;
      if (!p) return;
      if (row.event_type === "deposit_submitted") {
        const i = st.deposits.findIndex(d => d.id === row.event_id);
        if (i < 0) st.deposits.push(p);
      } else if (row.event_type === "reimbursement_vote") {
        const req = st.reimbursements.find(r => String(r.id) === String(row.event_id));
        if (req) {
          req.approvals = Array.isArray(req.approvals) ? req.approvals : [];
          const i = req.approvals.findIndex(a => a && a.userId === row.actor_id);
          if (i < 0) req.approvals.push(p);
          else req.approvals[i] = { ...req.approvals[i], ...p };
        }
      } else if (row.event_type === "approval_status_checked") {
        const req = st.reimbursements.find(r => String(r.id) === String(p.requestId));
        const vote = req && (req.approvals || []).find(a => a.userId === row.actor_id && a.fujiTxHash === p.txHash);
        if (vote) {
          vote.fujiTxStatus = p.txStatus;
          vote.fujiAuditStatus = p.auditStatus || vote.fujiAuditStatus || "unverified";
          vote.fujiStatusCheckedAt = p.checkedAt || row.created_at;
          vote.fujiStatusSource = "rpc-check";
        }
      }
    });
    try { localStorage.setItem("sw_vnd_vault_" + groupId, JSON.stringify(st)); } catch (e) {}
  },

  async recordMemberVaultEvent(groupId, eventType, eventId, payload) {
    if (!groupId || groupId === "default" || typeof sb === "undefined" || !sb) return { ok: true, localOnly: true };
    const actorId = typeof uid !== "undefined" ? uid : "";
    if (!actorId) return { ok: false, error: "Cần đăng nhập để ghi sự kiện quỹ." };
    const { error } = await sb.from("group_vault_events").insert({
      group_id: groupId, actor_id: actorId, event_type: eventType, event_id: String(eventId), payload
    });
    return error ? { ok: false, error: error.message || String(error) } : { ok: true };
  },

  async syncRemoteLedger(groupId) {
    if (typeof sb === "undefined" || !sb || !groupId || groupId === "default") return this.getVaultState(groupId);
    try {
      const { data: gbRows, error } = await sb
        .from("group_budgets")
        .select("category,color")
        .eq("group_id", groupId)
        .in("category", ["__vault_bank__", "__vault_ledger__"]);
      if (!error && Array.isArray(gbRows)) {
        const bankRow = gbRows.find(r => r.category === "__vault_bank__");
        if (bankRow && bankRow.color) {
          try {
            const parsedBank = JSON.parse(bankRow.color);
            if (parsedBank && parsedBank.accountNo) localStorage.setItem("sw_grp_bank_" + groupId, JSON.stringify(parsedBank));
          } catch (e) {}
        }
        const ledgerRow = gbRows.find(r => r.category === "__vault_ledger__");
        if (ledgerRow && ledgerRow.color) {
          try {
            const remoteLedger = JSON.parse(ledgerRow.color);
            this.mergeRemoteLedger(groupId, remoteLedger);
          } catch (e) {}
        }
      }
      const { data: events, error: eventError } = await sb.from("group_vault_events")
        .select("actor_id,event_type,event_id,payload,created_at")
        .eq("group_id", groupId).order("created_at", { ascending: true });
      if (!eventError && Array.isArray(events)) this.mergeRemoteVaultEvents(groupId, events);
    } catch (e) {}
    return this.getVaultState(groupId);
  },

  async saveVaultState(groupId, state) {
    try {
      localStorage.setItem("sw_vnd_vault_" + groupId, JSON.stringify(state));
    } catch (e) {}
    if (typeof sb !== "undefined" && sb && groupId && groupId !== "default") {
      try {
        const grp = (typeof myGroups !== "undefined" && Array.isArray(myGroups)) ? myGroups.find(g => g.id === groupId) : null;
        const actorId = typeof uid !== "undefined" ? uid : "";
        const canManage = !!(grp && actorId && grp.owner_id === actorId);
        if (!canManage) {
          if (typeof flash === "function") flash("⚠️ Chỉ trưởng nhóm / thủ quỹ (owner) mới được ghi trực tiếp vào sổ quỹ; thành viên gửi khai báo nạp hoặc phiếu duyệt riêng.");
          return false;
        }
        // Kéo dữ liệu mới nhất trên server trước khi ghi đè để tránh mất khoản nạp của thành viên khác
        const { data: existing } = await sb
          .from("group_budgets")
          .select("color")
          .eq("group_id", groupId)
          .eq("category", "__vault_ledger__")
          .maybeSingle();
        if (existing && existing.color) {
          try {
            const remote = JSON.parse(existing.color);
            this.mergeRemoteLedger(groupId, remote);
          } catch (e) {}
        }
        const { data: events, error: eventError } = await sb.from("group_vault_events")
          .select("actor_id,event_type,event_id,payload,created_at")
          .eq("group_id", groupId).order("created_at", { ascending: true });
        if (!eventError && Array.isArray(events)) this.mergeRemoteVaultEvents(groupId, events);
        const mergedToPush = this.getVaultState(groupId);
        const { error } = await sb.from("group_budgets").upsert({
          group_id: groupId,
          category: "__vault_ledger__",
          amount: 0,
          color: JSON.stringify(mergedToPush),
          threshold: 80
        }, { onConflict: "group_id,category" });
        if (error) {
          console.warn("Vault sync error:", error);
          if (typeof flash === "function") {
            const isEn = typeof lang !== "undefined" && lang === "en";
            flash(isEn
              ? "⚠️ Could not sync to group server (" + (error.message || "check group_budgets RLS policy") + ")."
              : "⚠️ Chưa đồng bộ được lên máy chủ nhóm (" + (error.message || "kiểm tra quyền RLS group_budgets") + ").");
          }
          return false;
        }
        return true;
      } catch (e) {
        console.warn("Vault sync exception:", e);
        return false;
      }
    }
    return true;
  },

  async sha256(obj) {
    const raw = JSON.stringify(obj);
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  },

  computeSummary(groupId) {
    const st = this.getVaultState(groupId);
    const confirmedDeposits = st.deposits.filter(d => d.status === "confirmed");
    const totalIn = confirmedDeposits.reduce((s, d) => s + Number(d.amountVnd || 0), 0);
    const paidOut = st.reimbursements
      .filter(r => r.status === "paid" || r.executed === true)
      .reduce((s, r) => s + Number(r.amountVnd || 0), 0);
    const pendingOut = st.reimbursements
      .filter(r => r.status === "pending" && !r.executed)
      .reduce((s, r) => s + Number(r.amountVnd || 0), 0);
    const balance = Math.max(0, totalIn - paidOut);

    const byMember = {};
    confirmedDeposits.forEach(d => {
      const k = d.userId || d.memberName || "member";
      if (!byMember[k]) byMember[k] = { name: d.memberName || "Thành viên", amountVnd: 0 };
      byMember[k].amountVnd += Number(d.amountVnd || 0);
    });

    return {
      totalIn,
      paidOut,
      pendingOut,
      balance,
      memberContributions: Object.values(byMember),
      deposits: st.deposits,
      reimbursements: st.reimbursements,
      treasury: st.treasury
    };
  },

  getSealInfoForExpense(expOrId) {
    const exp = typeof expOrId === "object" && expOrId !== null
      ? expOrId
      : (typeof grpEx !== "undefined" ? grpEx.find(x => x.id === expOrId) : null);
    if (exp && exp.avax_seal && exp.avax_seal.receiptHash) return exp.avax_seal;
    const id = exp ? exp.id : expOrId;
    try {
      const map = JSON.parse(localStorage.getItem("sw_verified_receipts") || "{}");
      return map[id] || null;
    } catch (e) {
      return null;
    }
  }
};

window.fmtVnd = function(n) {
  const v = Math.round(Number(n) || 0);
  return (typeof lang !== "undefined" && lang === "en")
    ? v.toLocaleString("en-US") + " VND"
    : v.toLocaleString("vi-VN") + " đ";
};

window.validateBankAccount = function(bankBin, rawAcc) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const bin = window.BankVault.getBankBin(bankBin);
  const acc = String(rawAcc || "").replace(/[^0-9]/g, "").trim();
  const bankInfo = VIETQR_BANKS.find(b => b.bin === bin) || { code: "BANK", name: isEn ? "Bank" : "Ngân hàng" };

  if (!acc) {
    return {
      ok: false,
      level: "err",
      title: isEn ? "Missing Account Number" : "Thiếu số tài khoản",
      message: isEn ? "Please enter a bank account number." : "Vui lòng nhập số tài khoản ngân hàng."
    };
  }
  if (!/^[0-9]+$/.test(acc) || acc.length < 6 || acc.length > 20) {
    return {
      ok: false,
      level: "err",
      title: isEn ? "Invalid Account Format" : "Sai định dạng số tài khoản",
      message: isEn
        ? "Account number must contain 6–20 digits only."
        : "Số tài khoản ngân hàng chỉ gồm 6 đến 20 chữ số."
    };
  }
  if (/^(\d)\1{5,}$/.test(acc) || /^0123456789|^1234567890|^9876543210/.test(acc)) {
    return {
      ok: false,
      level: "err",
      title: isEn ? "Suspicious / Fake Account Number" : "Số tài khoản không hợp lệ",
      message: isEn
        ? `"${acc}" looks like a placeholder or repeating/sequential number rather than a real ${bankInfo.name} account.`
        : `Số "${acc}" có dạng lặp lại hoặc dãy số mẫu, không phải số tài khoản thật của ${bankInfo.name}.`
    };
  }

  const rules = {
    "971005": { min: 10, max: 11, phonePrefix: true, hintVi: "Ví MoMo dùng số điện thoại Việt Nam (10 số, bắt đầu bằng 0)", hintEn: "MoMo wallet uses a 10-digit Vietnamese phone number (starting with 0)" },
    "971011": { min: 10, max: 11, phonePrefix: true, hintVi: "Ví ZaloPay dùng số điện thoại Việt Nam (10 số, bắt đầu bằng 0)", hintEn: "ZaloPay wallet uses a 10-digit Vietnamese phone number (starting with 0)" },
    "970405": { min: 13, max: 13, hintVi: "Agribank chuẩn thường gồm đúng 13 chữ số", hintEn: "Agribank accounts are typically 13 digits" },
    "970407": { min: 8, max: 16, hintVi: "Techcombank thường gồm 8–16 chữ số (nhiều TK bắt đầu bằng 190...)", hintEn: "Techcombank accounts are usually 8–16 digits (many start with 190...)" },
    "970415": { min: 8, max: 12, hintVi: "VietinBank thường gồm 8–12 chữ số", hintEn: "VietinBank accounts are usually 8–12 digits" },
    "970416": { min: 6, max: 10, hintVi: "ACB thường gồm 6–10 chữ số", hintEn: "ACB accounts are usually 6–10 digits" },
    "970418": { min: 8, max: 14, hintVi: "BIDV thường gồm 8–14 chữ số", hintEn: "BIDV accounts are usually 8–14 digits" },
    "970422": { min: 9, max: 13, hintVi: "MB Bank thường gồm 9–13 chữ số", hintEn: "MB Bank accounts are usually 9–13 digits" },
    "970423": { min: 8, max: 12, hintVi: "TPBank thường gồm 8–12 chữ số", hintEn: "TPBank accounts are usually 8–12 digits" },
    "970436": { min: 9, max: 14, hintVi: "Vietcombank thường gồm 9–14 chữ số", hintEn: "Vietcombank accounts are usually 9–14 digits" }
  };
  const r = rules[bin];
  if (r && r.phonePrefix && !/^0[35789][0-9]{8}$/.test(acc)) {
    return {
      ok: false,
      level: "err",
      title: isEn ? `Invalid ${bankInfo.code} Phone Number` : `Sai số điện thoại ví ${bankInfo.code}`,
      message: isEn
        ? `Please enter a valid 10-digit Vietnamese phone number starting with 0 (e.g. 0987654321).`
        : `Ví điện tử ${bankInfo.code} nhận tiền qua số điện thoại Việt Nam gồm 10 chữ số bắt đầu bằng số 0 (VD: 0987654321).`
    };
  }
  if (r && (acc.length < r.min || acc.length > r.max)) {
    return {
      ok: false,
      level: "err",
      title: isEn ? `Invalid ${bankInfo.code} Account Length` : `Sai độ dài STK ${bankInfo.code}`,
      message: isEn
        ? `Entered ${acc.length} digits. ${r.hintEn}.`
        : `Bạn đang nhập ${acc.length} chữ số. ${r.hintVi}.`
    };
  }

  return {
    ok: true,
    level: "ok",
    accountNo: acc,
    bankCode: bankInfo.code,
    bankName: bankInfo.name,
    hint: r ? (isEn ? r.hintEn : r.hintVi) : (isEn ? `Valid ${bankInfo.code} account format (${acc.length} digits)` : `Hợp lệ định dạng STK ${bankInfo.code} (${acc.length} chữ số)`)
  };
};

window.checkBankAccountLive = function(mode) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const isPersonal = mode === "personal";
  const bankEl = document.getElementById(isPersonal ? "myBankBin" : "grp-bank-bin");
  const accEl = document.getElementById(isPersonal ? "myBankAcc" : "grp-bank-acc");
  const statusEl = document.getElementById(isPersonal ? "myBankStatus" : "grpBankStatus");
  if (!bankEl || !accEl) return;

  const raw = accEl.value.trim();
  if (!raw) {
    if (statusEl) statusEl.innerHTML = "";
    return;
  }
  const chk = window.validateBankAccount(bankEl.value, raw);
  if (statusEl) {
    if (chk.ok) {
      statusEl.innerHTML = `<span style="color:var(--gr)">✓ ${chk.hint}</span>`;
    } else {
      statusEl.innerHTML = `<span style="color:var(--rd)">✕ ${chk.message}</span>`;
    }
  }
};

window.savePersonalBankAccount = async function() {
  const bankEl = document.getElementById("myBankBin");
  const accEl = document.getElementById("myBankAcc");
  const nameEl = document.getElementById("myBankName");
  const msgEl = document.getElementById("walMsg");
  if (!bankEl || !accEl || !nameEl) return;

  const isEn = typeof lang !== "undefined" && lang === "en";
  const bankBin = bankEl.value.trim();
  const accountNo = accEl.value.replace(/\s+/g, "").trim();
  const accountName = window.BankVault.removeAccents(nameEl.value);

  if (accountNo) {
    const chk = window.validateBankAccount(bankBin, accountNo);
    if (!chk.ok) {
      if (msgEl) { msgEl.className = "err"; msgEl.textContent = chk.message; }
      window.showVaultNotice({
        title: chk.title,
        message: chk.message,
        type: chk.level || "err",
        focusId: "myBankAcc"
      });
      return;
    }
  }

  const bankObj = accountNo ? { bankBin, accountNo, accountName } : null;
  const payload = bankObj ? JSON.stringify(bankObj) : "";
  if (typeof sb !== "undefined" && sb && typeof uid !== "undefined" && uid) {
    const r = await sb.from("user_profiles").update({ bank_account: bankObj }).eq("id", uid);
    if (r.error) console.warn("savePersonalBankAccount:", r.error);
  }
  try { localStorage.setItem("sw_my_bank_" + (uid || "guest"), payload); } catch (e) {}
  if (typeof userWallet !== "undefined") userWallet = payload;
  if (typeof loadGroups === "function") await loadGroups();
  if (typeof flash === "function") flash(payload ? "Đã lưu tài khoản ngân hàng nhận hoàn tiền (bank_account)!" : "Đã xóa tài khoản ngân hàng.");
  if (typeof render === "function") render();
};

window.savePersonalFujiWallet = async function(rawAddr) {
  const inputEl = document.getElementById("myFujiWalletInput");
  const addr = String(rawAddr !== undefined ? rawAddr : (inputEl ? inputEl.value : "")).trim();
  if (addr && !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return window.showVaultNotice({
      title: "Địa chỉ ví Avalanche Fuji không hợp lệ",
      message: "Vui lòng nhập đúng định dạng địa chỉ ví EVM (0x + 40 ký tự hex) hoặc bấm lấy từ ví đã kết nối.",
      type: "warn",
      focusId: "myFujiWalletInput"
    });
  }
  if (typeof sb !== "undefined" && sb && typeof uid !== "undefined" && uid) {
    const r = await sb.from("user_profiles").update({ wallet_address: addr || null }).eq("id", uid);
    if (r.error) {
      return window.showVaultNotice({
        title: "Không lưu được ví Fuji lên Supabase",
        message: r.error.message || String(r.error),
        type: "err"
      });
    }
  }
  try { localStorage.setItem("sw_my_fuji_wallet_" + (uid || "guest"), addr); } catch (e) {}
  window.myFujiWallet = addr;
  if (typeof loadGroups === "function") await loadGroups();
  if (typeof flash === "function") flash(addr ? `🦊 Đã lưu ví Avalanche Fuji (${addr.slice(0, 8)}…${addr.slice(-4)})!` : "Đã xóa ví Avalanche Fuji.");
  if (typeof render === "function") render();
};

window.fillConnectedFujiWalletToProfile = async function() {
  if (!window.AvalancheBridge || typeof window.AvalancheBridge.connectFujiWallet !== "function") return;
  try {
    const info = await window.AvalancheBridge.connectFujiWallet();
    const el = document.getElementById("myFujiWalletInput");
    if (el) el.value = info.address;
    await window.savePersonalFujiWallet(info.address);
  } catch (err) {
    window.showVaultNotice({
      title: "Kết nối ví Fuji thất bại",
      message: err && err.message ? err.message : String(err),
      type: "err"
    });
  }
};

window.parseMemberBank = function(rawBankVal) {
  if (!rawBankVal) return null;
  if (typeof rawBankVal === "object" && rawBankVal.accountNo) return rawBankVal;
  const s = String(rawBankVal).trim();
  if (s.startsWith("{")) {
    try {
      const o = JSON.parse(s);
      if (o && o.accountNo) return o;
    } catch (e) {}
  }
  return null;
};

window.saveGroupBankSettings = function() {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const grp = window.BankVault.getCurrentGroup();
  const bankBin = document.getElementById("grp-bank-bin")?.value || "970422";
  const accountNo = (document.getElementById("grp-bank-acc")?.value || "").replace(/\s+/g, "").trim();
  const accountName = window.BankVault.removeAccents(document.getElementById("grp-bank-name")?.value || "");
  const chkGrp = window.validateBankAccount(bankBin, accountNo);
  if (!chkGrp.ok) {
    return window.showVaultNotice({
      title: chkGrp.title,
      message: chkGrp.message,
      type: chkGrp.level || "warn",
      focusId: "grp-bank-acc"
    });
  }
  window.BankVault.saveGroupBankConfig(grp.id, { bankBin, accountNo, accountName });
  if (typeof flash === "function") flash("Đã lưu tài khoản ngân hàng nhận quỹ của nhóm!");
  if (typeof render === "function") render();
};

window.useMyBankForGroup = function(autoGenerateQr = false) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const grp = window.BankVault.getCurrentGroup();
  const myBank = window.BankVault.getPersonalBank();
  if (!myBank || !myBank.accountNo) {
    return window.showVaultNotice({
      title: isEn ? "No Personal Bank Account Saved" : "Chưa có tài khoản cá nhân",
      message: isEn
        ? "You haven't saved your personal bank account yet. Save it once in the green card on the Groups page, and you can reuse it across all groups in 1 click."
        : "Bạn chưa lưu tài khoản ngân hàng cá nhân. Chỉ cần lưu 1 lần ở khung viền xanh ngoài trang Nhóm, sau đó mọi nhóm mới đều dùng lại được chỉ với 1 bấm.",
      type: "warn"
    });
  }
  const cfg = {
    bankBin: myBank.bankBin || "970422",
    accountNo: myBank.accountNo,
    accountName: myBank.accountName || ""
  };
  window.BankVault.saveGroupBankConfig(grp.id, cfg);
  if (typeof flash === "function") flash("Đã áp dụng tài khoản ngân hàng cá nhân làm tài khoản nhận quỹ nhóm!");
  if (typeof render === "function") render();
  if (autoGenerateQr) {
    setTimeout(() => { if (typeof window.generateDepositVietQR === "function") window.generateDepositVietQR(); }, 60);
  }
};

window.generateDepositVietQR = function() {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const grp = window.BankVault.getCurrentGroup();
  const isLeader = typeof uid !== "undefined" && grp.owner_id === uid;
  let cfg = window.BankVault.getGroupBankConfig(grp.id);

  // Kiểm tra nếu trưởng nhóm đã nhập STK vào ô nhưng chưa bấm Lưu thì nhắc rõ ràng hoặc cho lưu nhanh
  const typedAcc = (document.getElementById("grp-bank-acc")?.value || "").replace(/\s+/g, "").trim();
  if (!cfg.accountNo) {
    if (isLeader && /^[0-9]{6,20}$/.test(typedAcc)) {
      const typedBin = document.getElementById("grp-bank-bin")?.value || "970422";
      const typedName = window.BankVault.removeAccents(document.getElementById("grp-bank-name")?.value || "");
      cfg = { bankBin: typedBin, accountNo: typedAcc, accountName: typedName };
      window.BankVault.saveGroupBankConfig(grp.id, cfg);
      if (typeof flash === "function") flash("Đã tự động lưu tài khoản ngân hàng nhận quỹ của nhóm!");
    } else {
      const myBank = isLeader ? window.BankVault.getPersonalBank() : null;
      return window.showVaultNotice({
        title: isEn ? "Fund Receiving Account Not Set" : "Chưa lưu tài khoản nhận quỹ",
        message: isLeader
          ? (myBank
              ? (isEn
                  ? `Group "${grp.name}" has not saved a receiving bank account yet.\nYou can reuse your saved personal bank account (${window.BankVault.getBankLabel(myBank.bankBin)} • ${myBank.accountNo}) with 1 click!`
                  : `Nhóm "${grp.name}" chưa lưu tài khoản nhận quỹ.\nBạn có thể dùng ngay tài khoản cá nhân đã lưu (${window.BankVault.getBankLabel(myBank.bankBin)} • ${myBank.accountNo}) chỉ với 1 bấm!`)
              : (isEn
                  ? `Group "${grp.name}" does not have a saved receiving bank account yet.\nPlease enter the bank account number in the box above and click "Save Fund Account" before generating a deposit QR code.`
                  : `Nhóm "${grp.name}" chưa lưu số tài khoản ngân hàng nhận quỹ.\nBạn hãy nhập số tài khoản ở khung bên trên rồi bấm "Lưu TK nhận quỹ" trước khi tạo mã QR nạp tiền.`))
          : (isEn
              ? `Group "${grp.name}" does not have a receiving bank account configured yet.\nPlease ask the group leader to save the fund's bank account first.`
              : `Nhóm "${grp.name}" chưa được cấu hình tài khoản ngân hàng nhận quỹ.\nVui lòng nhờ trưởng nhóm lưu số tài khoản nhận quỹ trước.`),
        type: "warn",
        actionLabel: (isLeader && myBank) ? (isEn ? "⚡ Use My Personal Bank & Create QR" : "⚡ Dùng TK cá nhân & Tạo QR ngay") : "",
        onAction: (isLeader && myBank) ? () => window.useMyBankForGroup(true) : null,
        focusId: (isLeader && !myBank) ? "grp-bank-acc" : ""
      });
    }
  }

  const rawAmt = String(document.getElementById("bank-deposit-amount")?.value || "");
  const amountVnd = typeof num === "function" ? Math.round(num(rawAmt)) : (Number(rawAmt.replace(/\D/g, "")) || 0);
  if (amountVnd < 1000) {
    return window.showVaultNotice({
      title: isEn ? "Invalid Deposit Amount" : "Số tiền nạp chưa hợp lệ",
      message: isEn
        ? "Please enter an amount of at least 1,000 VND to generate a VietQR transfer code."
        : "Vui lòng nhập số tiền muốn nạp vào quỹ tối thiểu 1.000 đ để tạo mã chuyển khoản VietQR.",
      type: "warn",
      focusId: "bank-deposit-amount"
    });
  }

  const senderName = (typeof userName !== "undefined" && userName) ? userName : "Thanh vien";
  const transferNote = `NAPQUY ${grp.group_code || "GRP"} ${window.BankVault.removeAccents(senderName)}`;
  const qrUrl = window.BankVault.buildVietQrUrl({
    bankBin: cfg.bankBin,
    accountNo: cfg.accountNo,
    accountName: cfg.accountName,
    amountVnd,
    addInfo: transferNote
  });

  const box = document.getElementById("vietqr-deposit-preview");
  if (box) {
    box.innerHTML = `
      <div style="margin-top:12px;padding:12px;border-radius:10px;border:1.5px solid var(--bl);background:var(--card);text-align:center">
        <div style="font-weight:700;font-size:14.5px;color:var(--bl);margin-bottom:4px">${isEn ? "Scan VietQR with any Banking App or MoMo" : "Quét mã VietQR bằng App Ngân hàng hoặc Ví MoMo"}</div>
        <div class="mu" style="font-size:12.5px;margin-bottom:8px">${isEn ? "Amount:" : "Số tiền:"} <b style="color:var(--tx)">${window.fmtVnd(amountVnd)}</b> • ${isEn ? "Bank:" : "Ngân hàng:"} <b>${window.BankVault.getBankLabel(cfg.bankBin)}</b></div>
        <img src="${qrUrl}" alt="VietQR" style="max-width:220px;width:100%;border-radius:8px;border:1px solid var(--bd);background:#fff;padding:6px">
        <div style="font-size:12.5px;margin-top:8px;text-align:left;background:var(--bg);padding:8px 10px;border-radius:8px">
          <div>${isEn ? "Receiving Account:" : "STK nhận quỹ:"} <b>${cfg.accountNo}</b> ${cfg.accountName ? `(${cfg.accountName})` : ""}</div>
          <div>${isEn ? "Transfer Note:" : "Nội dung CK:"} <code>${transferNote}</code> <button type="button" class="btn o" style="padding:2px 7px;font-size:11px;margin-left:4px" onclick="copyTxt('${transferNote}')">Copy</button></div>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button type="button" class="btn" style="background:var(--gr)" onclick="confirmBankDeposit(${amountVnd}, '${transferNote}')">${isEn ? "📤 Submit Transfer Declaration (Pending Treasurer Verification)" : "📤 Gửi khai báo đã chuyển khoản (Chờ thủ quỹ đối soát)"}</button>
        </div>
      </div>
    `;
  }
};

window.confirmBankDeposit = async function(amountVnd, transferNote) {
  const grp = window.BankVault.getCurrentGroup();
  const isLeader = typeof uid !== "undefined" && grp.owner_id === uid;
  const st = window.BankVault.getVaultState(grp.id);
  const memberName = (typeof userName !== "undefined" && userName) ? userName : "Thành viên";
  const txId = "DEP-" + Date.now().toString(36).toUpperCase();
  const hash = await window.BankVault.sha256({ txId, groupId: grp.id, amountVnd, memberName, transferNote, ts: Date.now() });

  const deposit = {
    id: txId,
    userId: typeof uid !== "undefined" ? uid : "guest",
    memberName,
    amountVnd: Math.round(Number(amountVnd) || 0),
    note: transferNote,
    status: "pending",
    receiptHash: hash.slice(0, 16),
    createdAt: new Date().toISOString()
  };
  const eventResult = await window.BankVault.recordMemberVaultEvent(grp.id, "deposit_submitted", txId, deposit);
  if (!eventResult.ok) {
    return window.showVaultNotice({
      title: "Chưa gửi được khai báo chuyển khoản",
      message: `Máy chủ từ chối lưu khai báo: ${eventResult.error}. Không cộng khoản này vào sổ quỹ.`,
      type: "err"
    });
  }
  st.deposits.unshift(deposit);
  try { localStorage.setItem("sw_vnd_vault_" + grp.id, JSON.stringify(st)); } catch (e) {}
  const syncedOk = true;

  if (typeof flash === "function" && syncedOk) {
    flash(`📤 Đã gửi khai báo chuyển khoản ${window.fmtVnd(amountVnd)}. Khoản này đang ở trạng thái CHỜ ĐỐI SOÁT SAO KÊ trước khi cộng vào số dư quỹ!`);
  }
  if (typeof render === "function") render();
};

window.approveBankDeposit = async function(depId) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const grp = window.BankVault.getCurrentGroup();
  if (typeof uid === "undefined" || grp.owner_id !== uid) {
    return window.showVaultNotice({
      title: isEn ? "Permission Denied" : "Không có quyền duyệt",
      message: isEn
        ? "Only the group leader / treasurer can approve received bank transfers."
        : "Chỉ trưởng nhóm / thủ quỹ mới có quyền xác nhận đã nhận tiền chuyển khoản.",
      type: "err"
    });
  }
  const st = window.BankVault.getVaultState(grp.id);
  const item = st.deposits.find(x => x.id === depId);
  if (!item) return;
  const nowIso = new Date().toISOString();
  const approverName = (typeof userName !== "undefined" && userName) ? userName : "Trưởng nhóm";
  let fujiError = "";

  if (window.AvalancheBridge && typeof window.AvalancheBridge.getConnectedFujiAccount === "function") {
    const acct = await window.AvalancheBridge.getConnectedFujiAccount();
    if (acct && acct.address) {
      try {
        const wallet = acct.isFuji ? acct : await window.AvalancheBridge.connectFujiWallet();
        const auditRes = await window.AvalancheBridge.recordApprovalAuditOnChain(
          wallet.address,
          grp.id,
          item.id,
          {
            action: "APPROVE_DEPOSIT",
            depositId: item.id,
            amountVnd: item.amountVnd,
            contributor: item.memberName,
            approvedBy: typeof uid !== "undefined" ? uid : "leader",
            approvedByName: approverName,
            confirmedAt: nowIso
          }
        );
        item.fujiAuditTx = auditRes.txHash;
        item.fujiAuditHash = auditRes.auditHash;
        item.fujiExplorerUrl = auditRes.explorerUrl;
        item.fujiRecorder = auditRes.recorder;
      } catch (err) {
        fujiError = err && err.message ? err.message : String(err);
        item.fujiAuditError = fujiError;
      }
    }
  }

  item.status = "confirmed";
  item.confirmedAt = nowIso;
  item.approvedBy = typeof uid !== "undefined" ? uid : "leader";
  item.approvedByName = approverName;
  await window.BankVault.saveVaultState(grp.id, st);

  if (fujiError) {
    window.showVaultNotice({
      title: isEn ? "Approved Off-Chain, Fuji Audit Failed" : "Đã duyệt quỹ nội bộ, nhưng ghi audit Fuji thất bại",
      message: isEn
        ? `The bank deposit was confirmed in the app, but recording the audit hash on Avalanche Fuji failed:
${fujiError}`
        : `Khoản nạp đã được xác nhận trong sổ quỹ, nhưng giao dịch ghi bằng chứng lên Avalanche Fuji thất bại:
${fujiError}`,
      type: "warn"
    });
  } else if (typeof flash === "function") {
    flash(item.fujiAuditTx
      ? `✅ Đã duyệt khoản góp ${window.fmtVnd(item.amountVnd)} & ghi audit lên Fuji (${item.fujiAuditTx.slice(0, 10)}…)!`
      : `✅ Đã duyệt khoản góp quỹ ${window.fmtVnd(item.amountVnd)} của ${item.memberName}!`);
  }
  if (typeof render === "function") render();
};

window.updateBankTreasuryPlan = function() {
  const grp = window.BankVault.getCurrentGroup();
  const st = window.BankVault.getVaultState(grp.id);
  const lockRaw = String(document.getElementById("tr-lock-vnd")?.value || "");
  const payRaw = String(document.getElementById("tr-payroll-vnd")?.value || "");
  const lockIn = typeof num === "function" ? Math.round(num(lockRaw)) : (Number(lockRaw.replace(/\D/g, "")) || 0);
  const apyIn = Math.max(0, Math.min(50, Number(document.getElementById("tr-apy")?.value || 6.5)));
  const payIn = typeof num === "function" ? Math.round(num(payRaw)) : (Number(payRaw.replace(/\D/g, "")) || 0);
  st.treasury = { lockedVnd: lockIn, apyPct: apyIn, monthlyPayrollVnd: payIn };
  window.BankVault.saveVaultState(grp.id, st);
  if (typeof flash === "function") flash("Đã cập nhật kế hoạch khóa quỹ sinh lãi & giải ngân định kỳ!");
  if (typeof render === "function") render();
};

window.connectFujiAuditWallet = async function() {
  const isEn = typeof lang !== "undefined" && lang === "en";
  if (!window.AvalancheBridge || typeof window.AvalancheBridge.connectFujiWallet !== "function") {
    return window.showVaultNotice({
      title: isEn ? "Bridge Unavailable" : "Chưa tải module Avalanche Bridge",
      message: isEn ? "avalanche-bridge.js is not loaded." : "Không tìm thấy avalanche-bridge.js.",
      type: "err"
    });
  }
  try {
    const info = await window.AvalancheBridge.connectFujiWallet();
    if (typeof flash === "function") {
      flash(`🦊 Đã kết nối ví Fuji Audit: ${info.address.slice(0, 6)}…${info.address.slice(-4)}`);
    }
    if (typeof render === "function") render();
    if (typeof updGrpHist === "function") updGrpHist();
    return info;
  } catch (err) {
    window.showVaultNotice({
      title: isEn ? "Fuji Wallet Connection Failed" : "Kết nối ví Avalanche Fuji thất bại",
      message: err && err.message ? err.message : String(err),
      type: "err"
    });
    return null;
  }
};

window.sealGroupExpenseOnChain = async function(expenseId) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  if (typeof grpEx === "undefined") return;
  const exp = grpEx.find(x => String(x.id) === String(expenseId));
  if (!exp) return;
  const grp = window.BankVault.getCurrentGroup();
  const prevSeal = window.BankVault.getSealInfoForExpense(exp);
  const isRevision = !!(prevSeal && prevSeal.receiptHash && prevSeal.onChain);

  const cleanItems = (exp.items || []).filter(x => x && !x._avax_seal);
  const payload = {
    expenseId: exp.id,
    groupId: grp.id,
    shop: exp.s,
    date: exp.d,
    category: exp.c,
    totalVnd: exp.a,
    items: cleanItems
  };
  const hash = await window.BankVault.sha256(payload);
  const sealedBy = typeof uid !== "undefined" ? uid : "unknown";
  const sealedByName = (typeof userName !== "undefined" && userName) ? userName : "Thành viên";
  const sealedAt = new Date().toISOString();

  let txMeta = null;
  let chainErr = "";
  if (window.AvalancheBridge && typeof window.AvalancheBridge.connectFujiWallet === "function") {
    try {
      const wallet = await window.AvalancheBridge.connectFujiWallet();
      if (isRevision && typeof window.AvalancheBridge.appendReceiptRevisionOnChain === "function") {
        txMeta = await window.AvalancheBridge.appendReceiptRevisionOnChain(wallet.address, grp.id, exp.id, payload);
      } else {
        txMeta = await window.AvalancheBridge.recordReceiptHashOnChain(wallet.address, grp.id, exp.id, payload);
      }
    } catch (err) {
      chainErr = err && err.message ? err.message : String(err);
    }
  } else {
    chainErr = "AvalancheBridge chưa sẵn sàng trên trình duyệt.";
  }

  if (!txMeta || !txMeta.txHash) {
    return window.showVaultNotice({
      title: isEn ? "On-Chain Receipt Seal Failed" : "Ghi bằng chứng hóa đơn lên Fuji thất bại",
      message: isEn
        ? `Receipt was NOT marked as on-chain verified:\n${chainErr}`
        : `Hệ thống KHÔNG đánh dấu đã xác thực on-chain vì giao dịch Fuji thất bại:\n${chainErr}`,
      type: "err"
    });
  }

  const isConfirmed = txMeta.txStatus === "confirmed";
  const revEntry = {
    version: isRevision ? ((prevSeal.revisions ? prevSeal.revisions.length : 0) + 2) : 1,
    receiptHash: hash,
    txHash: txMeta.txHash,
    txStatus: txMeta.txStatus,
    blockNumber: txMeta.blockNumber || null,
    explorerUrl: txMeta.explorerUrl,
    recorder: txMeta.recorder,
    sealedBy,
    sealedByName,
    sealedAt,
    payload
  };

  const sealInfo = isRevision
    ? {
        ...prevSeal,
        latestReceiptHash: hash,
        latestTxHash: txMeta.txHash,
        latestExplorerUrl: txMeta.explorerUrl,
        latestTxStatus: txMeta.txStatus,
        txStatus: txMeta.txStatus,
        onChain: isConfirmed,
        revisions: [...(Array.isArray(prevSeal.revisions) ? prevSeal.revisions : [prevSeal]), revEntry]
      }
    : {
        requestId: "CHK-" + hash.slice(0, 6).toUpperCase(),
        receiptHash: hash,
        latestReceiptHash: hash,
        txHash: txMeta.txHash,
        latestTxHash: txMeta.txHash,
        txStatus: txMeta.txStatus,
        latestTxStatus: txMeta.txStatus,
        blockNumber: txMeta.blockNumber || null,
        explorerUrl: txMeta.explorerUrl,
        latestExplorerUrl: txMeta.explorerUrl,
        contractAddress: txMeta.contractAddress || window.AvalancheBridge.contractAddress,
        chainId: 43113,
        recorder: txMeta.recorder,
        sealedBy,
        sealedByName,
        sealedAt,
        onChain: isConfirmed,
        revisions: [revEntry],
        payload
      };

  exp.avax_seal = sealInfo;
  try {
    const map = JSON.parse(localStorage.getItem("sw_verified_receipts") || "{}");
    map[expenseId] = sealInfo;
    localStorage.setItem("sw_verified_receipts", JSON.stringify(map));
  } catch (e) {}
  if (typeof saveLocalGrpEx === "function" && typeof activeGroupId !== "undefined" && activeGroupId) {
    saveLocalGrpEx(activeGroupId, grpEx);
  }
  if (typeof sb !== "undefined" && sb && !String(expenseId).startsWith("gex_")) {
    await sb.from("group_expenses").update({ avax_seal: sealInfo }).eq("id", expenseId);
  }
  if (typeof flash === "function") {
    flash(isConfirmed
      ? `⛓️ Đã ghi ${isRevision ? "phiên bản chỉnh sửa" : "hash hóa đơn"} lên Fuji! Tx: ${txMeta.txHash.slice(0, 12)}…`
      : `⏳ Đã gửi giao dịch lên Fuji (${txMeta.txHash.slice(0, 12)}…), đang chờ xác nhận block.`);
  }
  if (typeof updGrpHist === "function") updGrpHist();
};

window.verifyReceiptIntegrity = async function(exp) {
  if (!exp) return { status: "unsealed" };
  const seal = window.BankVault.getSealInfoForExpense(exp);
  if (!seal || !seal.receiptHash) return { status: "unsealed" };
  const groupId = (seal.payload && seal.payload.groupId) || (typeof activeGroupId !== "undefined" ? activeGroupId : "default");
  const cleanItems = (exp.items || []).filter(x => x && !x._avax_seal);
  const nowHash = await window.BankVault.sha256({
    expenseId: exp.id,
    groupId,
    shop: exp.s,
    date: exp.d,
    category: exp.c,
    totalVnd: exp.a,
    items: cleanItems
  });

  let onChainHash = "";
  let chainVersions = [];
  let rpcChecked = false;
  let rpcError = "";
  if (window.AvalancheBridge && typeof window.AvalancheBridge.getOnChainReceiptHashDetailed === "function") {
    try {
      const d = await window.AvalancheBridge.getOnChainReceiptHashDetailed(groupId, exp.id);
      rpcChecked = d.ok;
      onChainHash = d.ok ? d.hash : "";
      rpcError = d.error || "";
      if (d.ok && typeof window.AvalancheBridge.getReceiptHistoryFromChain === "function") {
        const hist = await window.AvalancheBridge.getReceiptHistoryFromChain(groupId, exp.id);
        if (hist.ok && Array.isArray(hist.versions)) chainVersions = hist.versions;
      }
    } catch (e) {
      rpcError = e && e.message ? e.message : String(e);
    }
  }

  const expectedLatest = String(seal.latestReceiptHash || seal.receiptHash).toLowerCase();
  const localIntact = nowHash.toLowerCase() === expectedLatest;
  const latestChainRev = chainVersions.length > 0 ? chainVersions[chainVersions.length - 1] : null;
  const latestChainHash = latestChainRev ? String(latestChainRev.recordHash || "").toLowerCase() : String(onChainHash || "").toLowerCase();
  const chainIntact = !!(latestChainHash && latestChainHash === nowHash.toLowerCase());
  const matchedOlderOnly = !chainIntact && chainVersions.some(v => v.recordHash === nowHash.toLowerCase());
  return {
    status: !localIntact ? "tampered" : (chainIntact ? "onchain_intact" : (matchedOlderOnly ? "stale_revision" : (!rpcChecked && rpcError ? "rpc_error" : (rpcChecked && !latestChainHash ? "not_on_chain" : "chain_mismatch")))),
    seal,
    nowHash,
    onChainHash,
    latestChainHash,
    latestChainVersion: latestChainRev ? latestChainRev.version : (onChainHash ? 1 : 0),
    chainVersions,
    rpcChecked,
    rpcError
  };
};

window.verifyGroupSeal = async function(expenseId) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const exp = typeof grpEx !== "undefined" ? grpEx.find(x => String(x.id) === String(expenseId)) : null;
  const seal = window.BankVault.getSealInfoForExpense(exp || expenseId);
  const latestTxHash = seal && (seal.latestTxHash || seal.txHash);
  const latestTxStatus = seal && (seal.latestTxStatus || seal.txStatus);
  if (seal && latestTxHash && latestTxStatus === "pending" && window.AvalancheBridge && typeof window.AvalancheBridge.waitForTxConfirmation === "function") {
    const conf = await window.AvalancheBridge.waitForTxConfirmation(latestTxHash, 4, 1000);
    if (conf.txStatus === "confirmed") {
      seal.latestTxStatus = "confirmed";
      seal.latestBlockNumber = conf.blockNumber;
      if (seal.latestTxHash === seal.txHash || !seal.latestTxHash) {
        seal.txStatus = "confirmed";
        seal.blockNumber = conf.blockNumber;
      }
      const activeRevision = (seal.revisions || []).find(r => r.txHash === latestTxHash);
      if (activeRevision) { activeRevision.txStatus = "confirmed"; activeRevision.blockNumber = conf.blockNumber; }
      seal.onChain = true;
      if (exp) exp.avax_seal = seal;
      try {
        const map = JSON.parse(localStorage.getItem("sw_verified_receipts") || "{}");
        map[expenseId] = seal;
        localStorage.setItem("sw_verified_receipts", JSON.stringify(map));
      } catch (_) {}
      if (typeof updGrpHist === "function") updGrpHist();
    } else if (conf.txStatus === "failed") {
      seal.latestTxStatus = "failed";
      seal.latestError = conf.error || "Reverted";
      const activeRevision = (seal.revisions || []).find(r => r.txHash === latestTxHash);
      if (activeRevision) { activeRevision.txStatus = "failed"; activeRevision.error = conf.error || "Reverted"; }
      if (seal.latestTxHash === seal.txHash || !seal.latestTxHash) seal.txStatus = "failed";
      seal.onChain = false;
      seal.lastError = conf.error || "Reverted";
      if (exp) exp.avax_seal = seal;
      try {
        const map = JSON.parse(localStorage.getItem("sw_verified_receipts") || "{}");
        map[expenseId] = seal;
        localStorage.setItem("sw_verified_receipts", JSON.stringify(map));
      } catch (_) {}
      if (typeof updGrpHist === "function") updGrpHist();
      return window.showVaultNotice({
        title: isEn ? "Fuji Transaction Failed" : "Giao dịch trên Fuji bị thất bại (Reverted)",
        message: conf.error || "Giao dịch đã bị revert trên mạng Avalanche Fuji.",
        type: "err"
      });
    }
  }
  if (!seal) {
    return window.showVaultNotice({
      title: isEn ? "Not Sealed On-Chain Yet" : "Chưa ghi bằng chứng lên Fuji",
      message: isEn ? "This receipt has not been recorded on Avalanche Fuji yet." : "Hóa đơn này chưa được ghi mã băm lên Avalanche Fuji.",
      type: "info"
    });
  }

  const res = exp ? await window.verifyReceiptIntegrity(exp) : { status: "local_intact", seal, nowHash: seal.receiptHash, onChainHash: "", chainVersions: [], rpcError: "" };
  const activeTx = seal.latestTxHash || seal.txHash;
  const activeUrl = seal.latestExplorerUrl || seal.explorerUrl;
  const txLine = activeTx ? `\nTxHash Fuji: ${activeTx}` : "";
  const whoLine = seal.sealedByName ? `\nNgười chốt: ${seal.sealedByName} (${seal.sealedAt || ""})` : "";
  const revLine = res.chainVersions && res.chainVersions.length > 0
    ? `\nLịch sử trên Contract Fuji: ${res.chainVersions.length} phiên bản (${res.chainVersions.map(v => "v" + v.version + ":" + v.recordHash.slice(0, 8)).join(", ")})`
    : "";
  const chainLine = res.onChainHash
    ? `\nHash gốc v1 trên Contract Fuji: ${res.onChainHash.slice(0, 16)}…${res.onChainHash.slice(-12)}${revLine}`
    : (res.rpcError ? `\nLỗi kết nối RPC Fuji: ${res.rpcError}` : `\nHash đọc từ Contract Fuji: (Chưa có bản ghi trên contract)`);

  if (res.status === "onchain_intact") {
    window.showVaultNotice({
      title: isEn ? "Verified 100% Against Avalanche Fuji Contract" : "Khớp 100% với Smart Contract trên Fuji",
      message: isEn
        ? `Current receipt data matches BOTH the database snapshot and the immutable record on Avalanche Fuji.${txLine}${whoLine}${chainLine}`
        : `Dữ liệu hóa đơn hiện tại khớp hoàn toàn với bản lưu trong app VÀ đối chiếu trực tiếp khớp 100% với dữ liệu đọc từ Smart Contract trên Avalanche Fuji!${txLine}${whoLine}${chainLine}`,
      type: "ok",
      actionLabel: activeUrl ? "🔎 Xem trên Snowtrace Fuji" : "",
      onAction: activeUrl ? () => window.open(activeUrl, "_blank", "noopener") : null
    });
  } else if (res.status === "tampered") {
    window.showVaultNotice({
      title: isEn ? "Receipt Tampering Detected!" : "Cảnh báo: Dữ liệu hóa đơn đã bị sửa đổi!",
      message: isEn
        ? `Current receipt hash (${res.nowHash.slice(0, 16)}…) DOES NOT MATCH the sealed hash!${txLine}${chainLine}`
        : `Mã băm hiện tại (${res.nowHash.slice(0, 16)}…) KHÔNG KHỚP với mã đã niêm phong! Dữ liệu đã bị chỉnh sửa ngoài quy trình.${txLine}${chainLine}`,
      type: "err"
    });
  } else if (res.status === "stale_revision") {
    window.showVaultNotice({
      title: isEn ? "Stale Revision Detected (Not Latest On-Chain)" : "Cảnh báo: Dữ liệu đang khớp bản cũ, KHÔNG khớp revision mới nhất trên Fuji!",
      message: isEn
        ? `Current data matches an older version, but the latest on-chain revision (v${res.latestChainVersion}: ${res.latestChainHash.slice(0, 16)}…) has a different hash.${txLine}${chainLine}`
        : `Dữ liệu hiện tại chỉ khớp một phiên bản cũ trong lịch sử, nhưng KHÔNG khớp với revision mới nhất trên Fuji (v${res.latestChainVersion}: ${res.latestChainHash.slice(0, 16)}…).${txLine}${chainLine}`,
      type: "err"
    });
  } else if (res.status === "chain_mismatch") {
    window.showVaultNotice({
      title: isEn ? "Latest On-Chain Hash Mismatch" : "Không khớp với revision mới nhất trên Fuji Contract",
      message: isEn
        ? `Current hash (${res.nowHash.slice(0, 16)}…) does not match the latest on-chain hash (${res.latestChainHash.slice(0, 16)}…).${txLine}${chainLine}`
        : `Mã băm hiện tại (${res.nowHash.slice(0, 16)}…) không khớp với revision mới nhất đang lưu trên Fuji (${res.latestChainHash.slice(0, 16)}…).${txLine}${chainLine}`,
      type: "err"
    });
  } else if (res.status === "rpc_error") {
    window.showVaultNotice({
      title: isEn ? "Fuji RPC Connection Error" : "Không truy vấn được RPC Avalanche Fuji",
      message: isEn
        ? `Could not reach Avalanche Fuji RPC to verify on-chain state.${txLine}${chainLine}`
        : `Không thể kết nối tới node RPC Avalanche Fuji để đối chiếu trực tiếp (không phải do thiếu bản ghi).${txLine}${chainLine}`,
      type: "warn"
    });
  } else {
    window.showVaultNotice({
      title: isEn ? "Local Snapshot Intact, Missing On-Chain Record" : "Khớp bản lưu nội bộ, nhưng chưa thấy trên Fuji Contract",
      message: isEn
        ? `Local data matches the saved snapshot, but no matching record was found on the Fuji contract (${window.AvalancheBridge ? window.AvalancheBridge.contractAddress : ""}).${txLine}${chainLine}`
        : `Dữ liệu khớp với bản lưu nội bộ, nhưng khi truy vấn trực tiếp Smart Contract trên Fuji thì chưa thấy hash này trên chain.${txLine}${chainLine}`,
      type: "warn"
    });
  }
};

window.getReimburseConsensus = function(req, grpObj) {
  const grp = grpObj || window.BankVault.getCurrentGroup();
  const members = Array.isArray(grp.members) ? grp.members : [];
  const totalMembers = Math.max(1, members.length);
  // Yêu cầu >50% thành viên đồng ý (tối thiểu 2 người nếu nhóm có >= 2 người; 1 người nếu nhóm chỉ có 1 người)
  const required = totalMembers === 1 ? 1 : Math.max(2, Math.floor(totalMembers / 2) + 1);
  const rawApps = Array.isArray(req.approvals) ? req.approvals : [];
  // Deduplicate by userId
  const byUid = new Map();
  rawApps.forEach(a => { if (a && a.userId) byUid.set(a.userId, a); });
  const approvals = Array.from(byUid.values());
  const count = approvals.length;
  const curUid = typeof uid !== "undefined" ? uid : "";
  const hasApproved = !!(curUid && byUid.has(curUid));
  const unlocked = count >= required;
  const names = approvals.map(a => a.name || "Thành viên");
  return { count, required, totalMembers, unlocked, hasApproved, approvals, names };
};

window.verifyReimburseApproval = async function(reqId, voterUserId) {
  const grp = window.BankVault.getCurrentGroup();
  await window.BankVault.syncRemoteLedger(grp.id);
  const vaultState = window.BankVault.getVaultState(grp.id);
  const req = vaultState.reimbursements.find(r => r.id === reqId);
  if (!req || !window.AvalancheBridge) return;
  const isPayout = voterUserId === "__payout__";
  const vote = isPayout ? req : (req.approvals || []).find(a => a.userId === voterUserId);
  if (!vote) return;
  const eventId = isPayout ? req.id : `${req.id}:vote:${voterUserId}`;
  const txHash = isPayout ? (req.fujiAuditTx || "") : (vote.fujiTxHash || "");
  const expectedHash = isPayout ? (req.fujiAuditHash || "") : (vote.fujiAuditHash || "");
  try {
    if (!expectedHash && !txHash) throw new Error("Không có transaction hash để đối chiếu trên Fuji.");
    const result = await window.AvalancheBridge.verifyApprovalAudit(grp.id, eventId, expectedHash, txHash);
    if (!result.ok) throw new Error(result.error || "Không đọc được approval history.");
    if (txHash && result.txStatus && result.txStatus !== "not_recorded") {
      const checkedAt = new Date().toISOString();
      const computedStatus = result.txStatus === "pending"
        ? "pending"
        : (expectedHash
            ? (result.latestMatch ? "verified" : (result.history.length ? "mismatch" : "not_found"))
            : "not_found");
      if (isPayout) {
        req.fujiAuditTxStatus = result.txStatus;
        req.fujiAuditStatus = computedStatus;
        req.fujiAuditCheckedAt = checkedAt;
        try { localStorage.setItem("sw_vnd_vault_" + grp.id, JSON.stringify(vaultState)); } catch (e) {}
        await window.BankVault.saveVaultState(grp.id, vaultState);
      } else if (typeof uid !== "undefined" && uid === voterUserId) {
        vote.fujiTxStatus = result.txStatus;
        vote.fujiAuditStatus = computedStatus;
        vote.fujiStatusCheckedAt = checkedAt;
        vote.fujiStatusSource = "rpc-check";
        const statusEventId = `${req.id}:status:${voterUserId}:${Date.now()}`;
        const statusEvent = await window.BankVault.recordMemberVaultEvent(grp.id, "approval_status_checked", statusEventId, {
          requestId: req.id, userId: voterUserId, txHash, txStatus: result.txStatus, auditStatus: vote.fujiAuditStatus, checkedAt
        });
        if (!statusEvent.ok) console.warn("Approval status sync failed:", statusEvent.error);
        try { localStorage.setItem("sw_vnd_vault_" + grp.id, JSON.stringify(vaultState)); } catch (e) {}
      }
    }
    const isLatestVerified = !!(result.latestMatch && result.txStatus === "confirmed");
    const detail = `On-chain history: ${result.history.length} phiên bản. Khớp trong lịch sử: ${result.match ? "Có" : "Không"}. Bản mới nhất (latest) khớp: ${result.latestMatch ? "Có" : "Không"}. Trạng thái transaction: ${result.txStatus}${result.blockNumber ? ` (block ${result.blockNumber})` : ""}${txHash ? `\nTx: ${txHash}` : ""}`;
    window.showVaultNotice({
      title: isLatestVerified ? "Approval audit đã xác minh khớp bản mới nhất" : "Cảnh báo approval audit chưa khớp bản mới nhất",
      message: detail,
      type: isLatestVerified ? "ok" : "warn"
    });
  } catch (err) {
    window.showVaultNotice({ title: "Không xác minh được approval audit", message: err && err.message ? err.message : String(err), type: "warn" });
  }
};

window.showApprovalAuditHistory = async function(reqId, voterUserId) {
  const grp = window.BankVault.getCurrentGroup();
  if (!window.AvalancheBridge) return;
  const eventId = voterUserId === "__payout__" ? reqId : `${reqId}:vote:${voterUserId}`;
  try {
    const result = await window.AvalancheBridge.getApprovalHistoryFromChain(grp.id, eventId);
    if (!result.ok) throw new Error(result.error || "Không đọc được history.");
    const lines = result.versions.length
      ? result.versions.map(v => `v${v.version} • ${v.recordHash.slice(0, 14)}… • ${v.recorder} • ${new Date(v.timestamp * 1000).toLocaleString()}`).join("\n")
      : "Contract chưa có approval history cho mã này.";
    window.showVaultNotice({ title: "Approval history trên Fuji", message: lines, type: result.versions.length ? "info" : "warn" });
  } catch (err) {
    window.showVaultNotice({ title: "Không đọc được approval history", message: err && err.message ? err.message : String(err), type: "warn" });
  }
};

window.approveReimburseRequest = async function(reqId) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const grp = window.BankVault.getCurrentGroup();
  await window.BankVault.syncRemoteLedger(grp.id);
  const st = window.BankVault.getVaultState(grp.id);
  const req = st.reimbursements.find(r => r.id === reqId);
  if (!req) return;
  if (req.status === "paid") return;

  const curUid = typeof uid !== "undefined" ? uid : "guest";
  const curName = (typeof userName !== "undefined" && userName) ? userName : (isEn ? "Member" : "Thành viên");
  if (!Array.isArray(req.approvals)) req.approvals = [];
  if (req.approvals.some(a => a && a.userId === curUid)) {
    return window.showVaultNotice({
      title: isEn ? "Already Approved" : "Bạn đã đồng ý rồi",
      message: isEn
        ? "You have already voted to approve this reimbursement request."
        : "Bạn đã bấm đồng ý duyệt khoản chi hoàn tiền này trước đó rồi.",
      type: "info"
    });
  }

  const voteTs = new Date().toISOString();
  let voteTxHash = "";
  let voteSigner = "";
  let voteAuditHash = "";
  let voteExplorerUrl = "";
  let voteTxStatus = "not_recorded";
  let voteAuditError = "";
  if (window.AvalancheBridge && typeof window.AvalancheBridge.getConnectedFujiAccount === "function") {
    const acct = await window.AvalancheBridge.getConnectedFujiAccount();
    if (acct && acct.address && acct.isFuji) {
      try {
        const res = await window.AvalancheBridge.recordApprovalAuditOnChain(
          acct.address,
          grp.id,
          `${req.id}:vote:${curUid}`,
          {
            action: "VOTE_REIMBURSEMENT",
            reimburseId: req.id,
            expenseId: req.expenseId,
            voterUserId: curUid,
            voterName: curName,
            signerWallet: acct.address,
            approvedAt: voteTs
          }
        );
        voteTxHash = res.txHash || "";
        voteSigner = acct.address;
        voteAuditHash = res.auditHash || "";
        voteExplorerUrl = res.explorerUrl || "";
        voteTxStatus = res.txStatus || "pending";
      } catch (err) {
        voteTxStatus = "failed";
        voteAuditError = err && err.message ? err.message : String(err);
        if (typeof flash === "function") {
          flash(`⚠️ Ghi audit Fuji thất bại; phiếu chỉ được lưu trong hồ sơ nhóm sau khi máy chủ xác nhận: ${voteAuditError}`);
        }
      }
    } else {
      voteTxStatus = "not_recorded";
    }
  } else {
    voteTxStatus = "not_recorded";
  }
  const vote = {
    userId: curUid,
    name: curName,
    approvedAt: voteTs,
    fujiTxHash: voteTxHash,
    signerWallet: voteSigner,
    fujiAuditHash: voteAuditHash,
    fujiExplorerUrl: voteExplorerUrl,
    fujiTxStatus: voteTxStatus,
    fujiAuditStatus: voteTxHash ? "unverified" : voteTxStatus,
    fujiAuditError: voteAuditError
  };
  const eventResult = await window.BankVault.recordMemberVaultEvent(grp.id, "reimbursement_vote", req.id, {
    ...vote,
    requestId: req.id
  });
  if (!eventResult.ok) {
    return window.showVaultNotice({
      title: isEn ? "Vote Was Not Saved" : "Chưa lưu được phiếu đồng ý",
      message: `${isEn ? "The server rejected this vote:" : "Máy chủ từ chối lưu phiếu:"} ${eventResult.error}${voteTxHash ? `\nFuji transaction: ${voteTxHash}` : ""}`,
      type: "err"
    });
  }
  req.approvals.push(vote);
  try { localStorage.setItem("sw_vnd_vault_" + grp.id, JSON.stringify(st)); } catch (e) {}

  const cons = window.getReimburseConsensus(req, grp);
  if (typeof flash === "function") {
    flash(cons.unlocked
      ? `✅ Đã đủ phiếu đồng thuận (${cons.count}/${cons.required})! Thủ quỹ có thể quét QR hoàn tiền ngay.`
      : `👍 Đã ghi nhận đồng ý chi hoàn tiền (${cons.count}/${cons.required} thành viên).`);
  }
  if (typeof render === "function") render();
};

window.renderReceiptHashBadge = function(expOrId) {
  const q = typeof esc === "function" ? esc : (s => String(s));
  const isEn = typeof lang !== "undefined" && lang === "en";
  const seal = window.BankVault && window.BankVault.getSealInfoForExpense
    ? window.BankVault.getSealInfoForExpense(expOrId)
    : null;
  if (!seal || !seal.receiptHash) {
    return `<span class="tag" style="background:var(--mu)">${isEn ? "No receipt hash yet" : "Chưa có mã hash hóa đơn"}</span>`;
  }
  const fullHash = String(seal.receiptHash);
  const shortHash = fullHash.length > 14 ? (fullHash.slice(0, 8) + "…" + fullHash.slice(-6)) : fullHash;
  const reqCode = seal.requestId ? `${q(seal.requestId)} • ` : "";
  const txTag = seal.txHash
    ? (seal.txStatus === "pending"
        ? `<a href="${q(seal.explorerUrl || ('https://testnet.snowtrace.io/tx/' + seal.txHash))}" target="_blank" rel="noopener" class="tag" style="background:var(--am);text-decoration:none" title="Giao dịch đã gửi lên Fuji, đang chờ xác nhận block">⏳ Fuji Pending: ${q(String(seal.txHash).slice(0, 10))}…</a>`
        : (seal.txStatus === "confirmed" && seal.onChain
            ? `<a href="${q(seal.explorerUrl || ('https://testnet.snowtrace.io/tx/' + seal.txHash))}" target="_blank" rel="noopener" class="tag" style="background:var(--bl);text-decoration:none" title="Đã xác nhận receipt trên Avalanche Fuji Snowtrace">⛓️ Fuji Confirmed: ${q(String(seal.txHash).slice(0, 10))}…</a>`
            : `<span class="tag" style="background:var(--rd)" title="${q(seal.lastError || 'Giao dịch Fuji thất bại hoặc chưa được xác nhận')}">❌ Fuji Failed: ${q(String(seal.txHash).slice(0, 10))}…</span>`))
    : `<span class="tag" style="background:var(--am)">⚠️ Chưa ghi Fuji</span>`;
  return `<span class="tag" style="background:var(--gr)" title="${q(fullHash)}">🔐 ${reqCode}SHA-256: <code>${q(shortHash)}</code></span>
    ${txTag}
    <button type="button" class="btn o" style="padding:2px 7px;font-size:11.5px" onclick="navigator.clipboard?.writeText('${q(fullHash)}');if(typeof flash==='function')flash('${isEn ? "Copied receipt hash" : "Đã sao chép mã hash hóa đơn"}')">${isEn ? "Copy hash" : "Copy hash"}</button>`;
};

window.renderReimburseHTML = function(e, canEdit) {
  const q = typeof esc === "function" ? esc : (s => String(s));
  const isEn = typeof lang !== "undefined" && lang === "en";
  const grp = window.BankVault.getCurrentGroup();
  const st = window.BankVault.getVaultState(grp.id);
  const rb = st.reimbursements.find(r => String(r.expenseId) === String(e.id)) || e.avax_reimburse;

  if (rb) {
    const isPaid = rb.status === "paid" || rb.executed === true;
    const isLeader = typeof uid !== "undefined" && grp.owner_id === uid;
    const cons = window.getReimburseConsensus(rb, grp);
    const voterTxt = cons.names.length ? ` (${cons.names.map(q).join(", ")})` : "";
    const voteAuditRows = (rb.approvals || []).map(a => {
      const status = a.fujiAuditStatus || (a.fujiTxHash ? "unverified" : (a.fujiTxStatus || "not_recorded"));
      const color = status === "verified" ? "var(--gr)" : (status === "unverified" || status === "pending") ? "var(--am)" : "var(--rd)";
      const label = status === "verified" ? "Fuji audit verified" : status === "pending" ? "Fuji transaction pending" : status === "unverified" ? `Chưa đối chiếu (${a.fujiTxStatus || "pending"})` : status === "mismatch" ? "⚠️ Hash không khớp" : status === "not_found" ? "⚠️ Chưa có hash trên chain" : "⚠️ Fuji audit " + status;
      return `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:3px"><span>${q(a.name || "Thành viên")}:</span><span class="tag" style="background:${color}">${label}</span>${a.fujiTxHash ? `<a href="${q(a.fujiExplorerUrl || ('https://testnet.snowtrace.io/tx/' + a.fujiTxHash))}" target="_blank" rel="noopener" class="tag" style="background:var(--navy)">Tx ${q(a.fujiTxHash.slice(0, 10))}…</a>` : ""}<button type="button" class="btn o" style="padding:2px 6px;font-size:10.5px" onclick="verifyReimburseApproval('${q(rb.id)}','${q(a.userId)}')">Đối chiếu</button><button type="button" class="btn o" style="padding:2px 6px;font-size:10.5px" onclick="showApprovalAuditHistory('${q(rb.id)}','${q(a.userId)}')">Lịch sử</button></div>`;
    }).join("");
    const payoutStatus = rb.fujiAuditStatus || (rb.fujiAuditTx ? "unverified" : "not_recorded");
    const payoutWarning = isPaid && payoutStatus !== "verified";
    return `<div class="row" style="align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;background:var(--bg);padding:8px 10px;border-radius:8px">
      <div style="font-size:13px">
        <div>🏦 ${isEn ? "Fund reimbursement:" : "Đề nghị hoàn từ quỹ:"} <b>${window.fmtVnd(rb.amountVnd || e.a)}</b> → <b>${q(rb.recipientName || e.memberName || (isEn ? "Buyer" : "Người mua"))}</b> ${rb.bankInfo ? `(${q(rb.bankInfo)})` : ""}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px">${window.renderReceiptHashBadge(rb.expenseId || e)}</div>
        ${!isPaid ? `<div class="mu" style="font-size:12px;margin-top:3px">🗳️ ${isEn ? `Group consensus: <b>${cons.count}/${cons.required}</b> members approved` : `Đồng thuận nhóm: <b>${cons.count}/${cons.required}</b> thành viên đồng ý`}${voterTxt}</div>` : ""}
        ${voteAuditRows ? `<div style="font-size:11.5px;margin-top:5px"><b>Approval transaction audit:</b>${voteAuditRows}</div>` : ""}
        ${isPaid ? `<div style="margin-top:5px"><span class="tag" style="background:${payoutStatus === 'verified' ? 'var(--gr)' : (payoutStatus === 'unverified' || payoutStatus === 'pending') ? 'var(--am)' : 'var(--rd)'}">${payoutStatus === 'verified' ? '✅ Payout audit verified' : '⚠️ Payout audit ' + q(payoutStatus)}${rb.fujiAuditTxStatus ? ' • tx ' + q(rb.fujiAuditTxStatus) : ''}</span> ${rb.fujiAuditTx ? `<a href="${q(rb.fujiExplorerUrl || ('https://testnet.snowtrace.io/tx/' + rb.fujiAuditTx))}" target="_blank" rel="noopener">Tx ${q(rb.fujiAuditTx.slice(0, 10))}…</a>` : ''} <button type="button" class="btn o" style="padding:2px 6px;font-size:10.5px" onclick="verifyReimburseApproval('${q(rb.id)}','__payout__')">Đối chiếu</button><button type="button" class="btn o" style="padding:2px 6px;font-size:10.5px" onclick="showApprovalAuditHistory('${q(rb.id)}','__payout__')">Lịch sử</button>${payoutWarning ? `<div style="color:var(--rd);font-size:11.5px;margin-top:3px">⚠️ Tiền hoàn đã được ghi nhận trong app, nhưng chưa có audit transaction được xác nhận trên Fuji.</div>` : ''}</div>` : ""}
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        ${isPaid
          ? `<span class="tag" style="background:var(--gr)">${isEn ? "✅ Reimbursed" : "✅ Đã chuyển khoản hoàn"}</span>`
          : `
            ${!cons.hasApproved && rb.id ? `<button type="button" class="btn o" style="padding:4px 10px;font-size:12.5px;border-color:var(--gr);color:var(--gr)" onclick="approveReimburseRequest('${rb.id}')">${isEn ? `👍 Approve Payout (${cons.count}/${cons.required})` : `👍 Đồng ý chi (${cons.count}/${cons.required})`}</button>` : `<span class="tag" style="background:var(--bl)">${isEn ? `✓ You approved (${cons.count}/${cons.required})` : `✓ Bạn đã đồng ý (${cons.count}/${cons.required})`}</span>`}
            ${isLeader && rb.id ? (cons.unlocked
              ? `<button type="button" class="btn" style="padding:4px 10px;font-size:12.5px;background:var(--bl)" onclick="openReimburseQrModal('${rb.id}')">${isEn ? "📲 Scan QR to Reimburse" : "📲 Quét QR hoàn tiền"}</button>`
              : `<button type="button" class="btn o" style="padding:4px 10px;font-size:12.5px;opacity:.75" onclick="openReimburseQrModal('${rb.id}')">${isEn ? `🔒 Locked (${cons.count}/${cons.required} votes)` : `🔒 Chờ đủ phiếu (${cons.count}/${cons.required})`}</button>`) : ""}
          `}
      </div>
    </div>`;
  }
  if (!canEdit) return "";
  return `<div class="row" style="align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
    <span class="mu" style="font-size:13px">${isEn ? "The group fund can reimburse this expense to the buyer via bank transfer." : "Quỹ nhóm có thể chuyển khoản hoàn tiền khoản này cho người đã mua."}</span>
    <button type="button" class="btn o" style="padding:4px 10px;font-size:13px" onclick="requestBankReimburse('${e.id}')">${isEn ? "🏦 Request Fund Reimbursement" : "🏦 Đề nghị hoàn tiền từ quỹ"}</button>
  </div>`;
};

window.requestBankReimburse = function(expenseId) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  if (typeof grpEx === "undefined") return;
  const exp = grpEx.find(x => String(x.id) === String(expenseId));
  if (!exp) return;

  const grp = window.BankVault.getCurrentGroup();
  const sum = window.BankVault.computeSummary(grp.id);
  if (sum.balance < Number(exp.a || 0)) {
    return window.showVaultNotice({
      title: isEn ? "Insufficient Fund Balance" : "Số dư quỹ nhóm chưa đủ",
      message: isEn
        ? `The group fund currently has ${window.fmtVnd(sum.balance)}, which is not enough to reimburse ${window.fmtVnd(exp.a)}. Please deposit more into the Shared Fund first.`
        : `Số dư quỹ nhóm hiện có ${window.fmtVnd(sum.balance)}, chưa đủ để hoàn ${window.fmtVnd(exp.a)}. Hãy nạp thêm tiền vào tab Quỹ chung trước.`,
      type: "warn"
    });
  }

  const members = grp.members || [];
  const buyer = members.find(m => m.user_id === exp.uid);
  const buyerName = (buyer && buyer.full_name) || exp.memberName || (isEn ? "Buyer" : "Người mua");
  const bankObj = window.parseMemberBank(buyer && buyer.bank_account) || ((typeof uid !== 'undefined' && exp.uid === uid) ? window.BankVault.getPersonalBank() : null);

  const st = window.BankVault.getVaultState(grp.id);
  if (st.reimbursements.some(r => String(r.expenseId) === String(expenseId))) {
    return window.showVaultNotice({
      title: isEn ? "Request Already Exists" : "Đã có đề nghị hoàn tiền",
      message: isEn
        ? "A reimbursement request has already been created for this receipt."
        : "Khoản chi này đã được tạo đề nghị hoàn tiền rồi.",
      type: "info"
    });
  }

  const req = {
    id: "RMB-" + Date.now().toString(36).toUpperCase(),
    expenseId: exp.id,
    shop: exp.s,
    amountVnd: Math.round(Number(exp.a) || 0),
    recipientUserId: exp.uid,
    recipientName: buyerName,
    bankBin: bankObj ? bankObj.bankBin : "",
    accountNo: bankObj ? bankObj.accountNo : "",
    accountName: bankObj ? bankObj.accountName : window.BankVault.removeAccents(buyerName),
    bankInfo: bankObj ? `${window.BankVault.getBankLabel(bankObj.bankBin)} • ${bankObj.accountNo}` : (isEn ? "No personal bank account saved" : "Chưa lưu STK cá nhân"),
    approvals: typeof uid !== "undefined" && uid ? [{
      userId: uid,
      name: (typeof userName !== "undefined" && userName) ? userName : (isEn ? "Requester" : "Người đề nghị"),
      approvedAt: new Date().toISOString()
    }] : [],
    status: "pending",
    createdAt: new Date().toISOString()
  };
  st.reimbursements.unshift(req);
  window.BankVault.saveVaultState(grp.id, st);

  if (typeof flash === "function") flash(`✅ Đã tạo đề nghị hoàn ${window.fmtVnd(req.amountVnd)} cho ${buyerName}!`);
  if (typeof updGrpHist === "function") updGrpHist();
};

window.openReimburseQrModal = function(reqId) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const grp = window.BankVault.getCurrentGroup();
  const st = window.BankVault.getVaultState(grp.id);
  const req = st.reimbursements.find(r => r.id === reqId);
  if (!req) return;

  const cons = window.getReimburseConsensus(req, grp);
  if (!cons.unlocked) {
    const votersList = cons.names.length ? cons.names.join(", ") : (isEn ? "None yet" : "Chưa có ai");
    return window.showVaultNotice({
      title: isEn ? "More Member Approvals Required" : "Cần thêm thành viên đồng duyệt",
      message: isEn
        ? `To protect the shared fund, at least ${cons.required} of ${cons.totalMembers} group members (>50%) must approve before the QR payout unlocks.

Current approvals (${cons.count}/${cons.required}): ${votersList}`
        : `Để minh bạch quỹ chung, cần tối thiểu ${cons.required}/${cons.totalMembers} thành viên (>50% nhóm) bấm đồng ý trước khi mở khóa mã QR chuyển hoàn tiền.

Đã đồng ý (${cons.count}/${cons.required}): ${votersList}`,
      type: "warn",
      actionLabel: !cons.hasApproved ? (isEn ? "👍 Cast My Approval Now" : "👍 Bấm đồng ý ngay") : "",
      onAction: !cons.hasApproved ? () => window.approveReimburseRequest(reqId) : null
    });
  }

  if (!req.accountNo) {
    return window.showVaultNotice({
      title: isEn ? "Recipient Has No Saved Bank Account" : "Người nhận chưa lưu số tài khoản",
      message: isEn
        ? `${req.recipientName} has not saved a personal bank account yet.\nDo you want to mark ${window.fmtVnd(req.amountVnd)} as already reimbursed via cash or manual transfer?`
        : `${req.recipientName} chưa lưu số tài khoản ngân hàng cá nhân.\nBạn có muốn đánh dấu đã hoàn ${window.fmtVnd(req.amountVnd)} cho ${req.recipientName} (tiền mặt / chuyển khoản thủ công) ngay không?`,
      type: "warn",
      actionLabel: isEn ? "✅ Mark as Reimbursed" : "✅ Đánh dấu đã hoàn tiền",
      onAction: () => window.markReimbursePaid(reqId)
    });
  }

  const note = `HOANQUY ${grp.group_code || "GRP"} ${window.BankVault.removeAccents(req.shop)}`;
  const qrUrl = window.BankVault.buildVietQrUrl({
    bankBin: req.bankBin,
    accountNo: req.accountNo,
    accountName: req.accountName,
    amountVnd: req.amountVnd,
    addInfo: note
  });

  const old = document.getElementById("reimburse-qr-modal");
  if (old) old.remove();
  const modal = document.createElement("div");
  modal.id = "reimburse-qr-modal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px";
  modal.innerHTML = `
    <div class="card" style="max-width:400px;width:100%;margin:0;text-align:center">
      <div class="row" style="align-items:center;margin-bottom:8px">
        <b>${isEn ? "Bank Transfer Reimbursement" : "Chuyển khoản hoàn tiền từ quỹ"}</b>
        <button type="button" class="btn o" style="padding:3px 9px" onclick="document.getElementById('reimburse-qr-modal').remove()">✕</button>
      </div>
      <div class="mu" style="font-size:13px;margin-bottom:8px">${isEn ? "Recipient:" : "Người nhận:"} <b>${req.recipientName}</b> • ${isEn ? "Amount:" : "Số tiền:"} <b style="color:var(--bl)">${window.fmtVnd(req.amountVnd)}</b></div>
      <img src="${qrUrl}" alt="VietQR" style="max-width:230px;width:100%;border-radius:8px;border:1px solid var(--bd);background:#fff;padding:6px">
      <div style="font-size:12.5px;margin-top:8px;text-align:left;background:var(--bg);padding:8px 10px;border-radius:8px">
        <div>${isEn ? "Bank:" : "Ngân hàng:"} <b>${window.BankVault.getBankLabel(req.bankBin)}</b></div>
        <div>${isEn ? "Account No:" : "Số tài khoản:"} <b>${req.accountNo}</b></div>
        <div>${isEn ? "Note:" : "Nội dung:"} <code>${note}</code></div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
        <button type="button" class="btn" style="background:var(--gr)" onclick="markReimbursePaid('${req.id}');document.getElementById('reimburse-qr-modal').remove()">${isEn ? "✅ Confirm Reimbursement Paid" : "✅ Xác nhận đã chuyển hoàn"}</button>
        <button type="button" class="btn o" onclick="document.getElementById('reimburse-qr-modal').remove()">${isEn ? "Close" : "Đóng"}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.getGroupFundGuard = function(groupId) {
  const sum = window.BankVault ? window.BankVault.computeSummary(groupId) : { totalIn: 0, paidOut: 0, pendingOut: 0, balance: 0, deposits: [], reimbursements: [] };
  const pendingDeposits = (sum.deposits || []).filter(d => d.status !== "confirmed");
  const pendingReimburse = (sum.reimbursements || []).filter(r => r.status === "pending" && !r.executed);
  const pendingDepositVnd = pendingDeposits.reduce((s, d) => s + Number(d.amountVnd || 0), 0);
  const hasOpenFunds = (sum.balance > 0) || (pendingReimburse.length > 0) || (pendingDeposits.length > 0);
  return {
    balance: sum.balance || 0,
    totalIn: sum.totalIn || 0,
    paidOut: sum.paidOut || 0,
    pendingOut: sum.pendingOut || 0,
    pendingDepositsCount: pendingDeposits.length,
    pendingDepositVnd,
    pendingReimburseCount: pendingReimburse.length,
    hasOpenFunds
  };
};

window.recordHandoverAudit = async function(groupId, payload) {
  const st = window.BankVault.getVaultState(groupId);
  if (!Array.isArray(st.handovers)) st.handovers = [];
  const auditId = "HND-" + Date.now().toString(36).toUpperCase();
  const hash = await window.BankVault.sha256({ auditId, groupId, ...payload, ts: Date.now() });
  st.handovers.unshift({
    id: auditId,
    hash,
    createdAt: new Date().toISOString(),
    ...payload
  });
  await window.BankVault.saveVaultState(groupId, st);
  return { auditId, hash };
};

window.markReimbursePaid = async function(reqId) {
  const isEn = typeof lang !== "undefined" && lang === "en";
  const grp = window.BankVault.getCurrentGroup();
  if (typeof uid === "undefined" || grp.owner_id !== uid) {
    return window.showVaultNotice({
      title: isEn ? "Leader Permission Required" : "Chỉ trưởng nhóm / thủ quỹ mới được xác nhận hoàn tiền",
      message: isEn ? "Only the group leader can confirm reimbursement payout." : "Chỉ trưởng nhóm / thủ quỹ mới có quyền xác nhận đã chuyển khoản hoàn tiền.",
      type: "err"
    });
  }
  const st = window.BankVault.getVaultState(grp.id);
  const req = st.reimbursements.find(r => r.id === reqId);
  if (!req) return;
  const cons = window.getReimburseConsensus ? window.getReimburseConsensus(req, grp) : { unlocked: true, count: 1, required: 1 };
  if (!cons.unlocked) {
    return window.showVaultNotice({
      title: isEn ? "Insufficient Group Approvals" : "Chưa đủ phiếu đồng thuận của nhóm",
      message: isEn ? `Need ${cons.count}/${cons.required} member approvals first.` : `Cần tối thiểu ${cons.count}/${cons.required} thành viên đồng ý trước khi giải ngân hoàn tiền.`,
      type: "warn"
    });
  }
  const nowIso = new Date().toISOString();
  const payerName = (typeof userName !== "undefined" && userName) ? userName : "Thủ quỹ";
  let fujiError = "";
  let fujiAuditStatus = "not_recorded";

  if (window.AvalancheBridge && typeof window.AvalancheBridge.getConnectedFujiAccount === "function") {
    const acct = await window.AvalancheBridge.getConnectedFujiAccount();
    if (acct && acct.address) {
      try {
        const wallet = acct.isFuji ? acct : await window.AvalancheBridge.connectFujiWallet();
        const auditRes = await window.AvalancheBridge.recordApprovalAuditOnChain(
          wallet.address,
          grp.id,
          req.id,
          {
            action: "EXECUTE_REIMBURSEMENT",
            reimburseId: req.id,
            expenseId: req.expenseId,
            amountVnd: req.amountVnd,
            recipientName: req.recipientName,
            approvalsCount: Array.isArray(req.approvals) ? req.approvals.length : 0,
            executedBy: typeof uid !== "undefined" ? uid : "leader",
            executedByName: payerName,
            paidAt: nowIso
          }
        );
        req.fujiAuditTx = auditRes.txHash;
        req.fujiAuditHash = auditRes.auditHash;
        req.fujiExplorerUrl = auditRes.explorerUrl;
        fujiAuditStatus = auditRes.txStatus || "pending";
      } catch (err) {
        fujiError = err && err.message ? err.message : String(err);
        req.fujiAuditError = fujiError;
        fujiAuditStatus = "failed";
      }
    }
  }

  req.status = "paid";
  req.paidAt = nowIso;
  req.executedByName = payerName;
  req.fujiAuditTxStatus = fujiAuditStatus;
  req.fujiAuditStatus = req.fujiAuditTx ? "unverified" : (fujiError ? "failed" : "not_recorded");
  if (fujiError) req.fujiAuditError = fujiError;
  await window.BankVault.saveVaultState(grp.id, st);

  if (fujiError) {
    window.showVaultNotice({
      title: isEn ? "Reimbursed Off-Chain, Fuji Audit Failed" : "Đã xác nhận hoàn tiền, nhưng ghi audit Fuji thất bại",
      message: isEn
        ? `Bank reimbursement was recorded in the app, but the Avalanche Fuji audit transaction failed:
${fujiError}`
        : `Đã đánh dấu hoàn tiền ngân hàng, nhưng giao dịch ghi lịch sử duyệt chi lên Avalanche Fuji thất bại:
${fujiError}`,
      type: "warn"
    });
  } else if (fujiAuditStatus === "pending") {
    window.showVaultNotice({
      title: isEn ? "Reimbursement Saved; Fuji Audit Pending" : "Đã ghi nhận hoàn tiền; Fuji audit đang chờ xác nhận",
      message: isEn ? `The bank payout is recorded in the app. Fuji transaction is pending: ${req.fujiAuditTx || "(unknown)"}` : `Đã ghi nhận hoàn tiền ngân hàng trong app. Transaction audit Fuji đang chờ block xác nhận: ${req.fujiAuditTx || "không có tx hash"}`,
      type: "warn"
    });
  } else if (typeof flash === "function") {
    flash(req.fujiAuditTx
      ? `✅ Đã hoàn ${window.fmtVnd(req.amountVnd)} & ghi audit lên Fuji (${req.fujiAuditTx.slice(0, 10)}…)!`
      : `✅ Đã hoàn ${window.fmtVnd(req.amountVnd)} từ quỹ cho ${req.recipientName}!`);
  }
  if (typeof render === "function") render();
};

window.grantGroupRecorderAccess = async function(memberUserId, walletAddr, allowed) {
  const grp = window.BankVault.getCurrentGroup();
  if (typeof uid === "undefined" || grp.owner_id !== uid) {
    return window.showVaultNotice({
      title: "Chỉ trưởng nhóm mới cấp/thu hồi quyền ghi audit",
      message: "Chỉ chủ nhóm mới có quyền gọi setAuthorizedRecorder trên Fuji.",
      type: "err"
    });
  }
  const addr = String(walletAddr || "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return window.showVaultNotice({
      title: "Địa chỉ ví thành viên không hợp lệ",
      message: "Vui lòng nhập địa chỉ ví EVM hợp lệ (0x...) của thành viên.",
      type: "warn"
    });
  }
  try {
    const wallet = await window.AvalancheBridge.connectFujiWallet();
    const admin = await window.AvalancheBridge.getGroupAdminFromChain(grp.id);
    if (!admin.ok || !admin.address || admin.address.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error(admin.address
        ? `Chỉ ví admin Fuji ${admin.address} mới được cấp/thu hồi recorder.`
        : "Nhóm chưa có admin Fuji. Hãy khởi tạo admin trước.");
    }
    const txRes = await window.AvalancheBridge.setAuthorizedRecorderOnChain(wallet.address, grp.id, addr, !!allowed);
    const st = window.BankVault.getVaultState(grp.id);
    st.authorizedRecorders = st.authorizedRecorders || {};
    st.authorizedRecorders[addr.toLowerCase()] = {
      userId: memberUserId || "",
      address: addr,
      allowed: !!allowed,
      txHash: txRes.txHash,
      txStatus: txRes.txStatus || "pending",
      explorerUrl: txRes.explorerUrl || "",
      updatedAt: new Date().toISOString()
    };
    await window.BankVault.saveVaultState(grp.id, st);
    if (typeof flash === "function") {
      flash(allowed ? `✅ Đã cấp quyền ghi audit Fuji cho ví ${addr.slice(0, 8)}…` : `🔒 Đã thu hồi quyền ghi audit của ví ${addr.slice(0, 8)}…`);
    }
    if (typeof render === "function") render();
  } catch (err) {
    window.showVaultNotice({
      title: "Cập nhật quyền recorder trên Fuji thất bại",
      message: err && err.message ? err.message : String(err),
      type: "err"
    });
  }
};

window.initGroupAdminOnChain = async function() {
  const grp = window.BankVault.getCurrentGroup();
  if (typeof uid === "undefined" || grp.owner_id !== uid) {
    return window.showVaultNotice({
      title: "Chỉ trưởng nhóm mới khởi tạo Admin Fuji",
      message: "Chỉ chủ nhóm mới có quyền khởi tạo groupAdmin cho nhóm này.",
      type: "err"
    });
  }
  try {
    const wallet = await window.AvalancheBridge.connectFujiWallet();
    const currentAdmin = await window.AvalancheBridge.getGroupAdminFromChain(grp.id);
    if (currentAdmin.ok && currentAdmin.address) {
      if (currentAdmin.address.toLowerCase() !== wallet.address.toLowerCase()) throw new Error(`Nhóm đã có admin khác trên Fuji: ${currentAdmin.address}`);
      const existingState = window.BankVault.getVaultState(grp.id);
      existingState.groupAdminWallet = currentAdmin.address;
      await window.BankVault.saveVaultState(grp.id, existingState);
      if (typeof flash === "function") flash(`✅ Ví này đã là admin Fuji của nhóm: ${wallet.address}`);
      if (typeof render === "function") render();
      return;
    }
    if (typeof sb === "undefined" || !sb) throw new Error("Cần kết nối Supabase để xác thực chủ nhóm và ký attestation.");
    const { data: attestation, error: attestError } = await sb.functions.invoke("authorize-group-admin", {
      body: { groupId: grp.id, adminAddress: wallet.address }
    });
    if (attestError || !attestation || !attestation.signature) {
      throw new Error(attestation && attestation.error ? attestation.error : (attestError && attestError.message) || "Không nhận được chữ ký attestation từ máy chủ.");
    }
    const txRes = await window.AvalancheBridge.initializeGroupAdminOnChain(
      wallet.address, grp.id, attestation.adminAddress, attestation.deadline, attestation.signature
    );
    const st = window.BankVault.getVaultState(grp.id);
    st.groupAdminWallet = wallet.address;
    st.groupAdminTx = txRes.txHash;
    st.groupAdminTxStatus = txRes.txStatus;
    st.groupAdminExplorerUrl = txRes.explorerUrl;
    await window.BankVault.saveVaultState(grp.id, st);
    if (typeof flash === "function") flash(txRes.txStatus === "confirmed"
      ? `✅ Đã khởi tạo Admin nhóm trên Fuji (${wallet.address.slice(0, 8)}…)`
      : `⏳ Transaction khởi tạo Admin đã gửi lên Fuji (${txRes.txHash.slice(0, 10)}…), đang chờ xác nhận.`);
    if (typeof render === "function") render();
  } catch (err) {
    window.showVaultNotice({
      title: "Khởi tạo Admin nhóm thất bại",
      message: err && err.message ? err.message : String(err),
      type: "err"
    });
  }
};

window.refreshGroupAdminState = async function() {
  const grp = window.BankVault.getCurrentGroup();
  if (!window.AvalancheBridge) return;
  try {
    const admin = await window.AvalancheBridge.getGroupAdminFromChain(grp.id);
    if (!admin.ok) throw new Error(admin.error || "Không đọc được groupAdmin từ Fuji.");
    const st = window.BankVault.getVaultState(grp.id);
    st.groupAdminWallet = admin.address;
    st.authorizedRecorders = st.authorizedRecorders || {};
    for (const member of (grp.members || [])) {
      if (!member.wallet || !/^0x[a-fA-F0-9]{40}$/.test(member.wallet)) continue;
      const result = await window.AvalancheBridge.isAuthorizedRecorderOnChain(grp.id, member.wallet);
      if (result.ok) st.authorizedRecorders[member.wallet.toLowerCase()] = {
        ...(st.authorizedRecorders[member.wallet.toLowerCase()] || {}),
        userId: member.user_id, address: member.wallet, allowed: result.allowed, checkedAt: new Date().toISOString()
      };
    }
    await window.BankVault.saveVaultState(grp.id, st);
    if (typeof flash === "function") flash(admin.address
      ? `✅ Admin Fuji hiện tại: ${admin.address}`
      : "⚠️ Nhóm chưa khởi tạo admin trên Fuji.");
    if (typeof render === "function") render();
  } catch (err) {
    window.showVaultNotice({ title: "Không đọc được trạng thái admin Fuji", message: err && err.message ? err.message : String(err), type: "err" });
  }
};
