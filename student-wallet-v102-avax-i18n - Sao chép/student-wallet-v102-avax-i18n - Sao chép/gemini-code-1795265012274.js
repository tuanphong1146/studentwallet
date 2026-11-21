(function () {
  "use strict";

  // =========================================================================
  // 1. KÉO DÀI THANH CUỘN BIỂU ĐỒ TRÒN BẰNG ĐÚNG CHIỀU CAO KHUNG HỘP
  // =========================================================================
  function fixDonutScrollbars() {
    document.querySelectorAll(".card").forEach((card) => {
      const title = card.querySelector("h2, h3, b, div");
      if (!title || !/Biểu đồ tròn|Donut|Pie/i.test(card.textContent || "")) return;

      const cardHeight = card.getBoundingClientRect().height;
      const targetHeight = Math.max(260, Math.round(cardHeight - 88));

      card.querySelectorAll("div").forEach((el) => {
        const st = window.getComputedStyle(el);
        const inlineMaxH = el.style.maxHeight || "";
        if (
          st.overflowY === "auto" ||
          st.overflowY === "scroll" ||
          /1\d\dpx|2[0-6]\dpx/.test(inlineMaxH)
        ) {
          el.style.maxHeight = targetHeight + "px";
          el.style.height = targetHeight + "px";
          el.style.paddingBottom = "12px";
        }
      });
    });
  }

  // =========================================================================
  // 2. CAN THIỆP SUPABASE CLIENT ĐỂ XỬ LÝ TÊN THÀNH VIÊN & DUYỆT NHÓM
  // =========================================================================
  let profileMap = {};
  let pendingMembersByGroup = {};
  let currentUserId = null;
  let wrappedClients = new WeakSet();

  async function refreshProfilesAndPending(sb) {
    try {
      const { data: authData } = await sb.auth.getUser();
      currentUserId = authData?.user?.id || currentUserId;

      const { data: profiles } = await sb
        .from("user_profiles")
        .select("id, full_name, user_code");
      if (Array.isArray(profiles)) {
        profiles.forEach((p) => {
          if (p.id && p.full_name) profileMap[p.id] = p.full_name;
        });
      }

      const { data: pendingRows } = await sb
        .from("group_members")
        .select("id, group_id, user_id, status, joined_at")
        .eq("status", "pending");

      const grouped = {};
      if (Array.isArray(pendingRows)) {
        pendingRows.forEach((r) => {
          if (!grouped[r.group_id]) grouped[r.group_id] = [];
          grouped[r.group_id].push(r);
        });
      }
      pendingMembersByGroup = grouped;
    } catch (_) {}
  }

  function wrapSupabase(sb) {
    if (!sb || typeof sb.from !== "function" || wrappedClients.has(sb)) return sb;
    wrappedClients.add(sb);

    const origFrom = sb.from.bind(sb);
    sb.from = function (table) {
      const query = origFrom(table);

      if (table === "group_members") {
        // Ép status = 'pending' khi thành viên tự xin vào nhóm bằng mã
        if (typeof query.insert === "function") {
          const origInsert = query.insert.bind(query);
          query.insert = function (values, options) {
            const patchRow = (row) => {
              if (!row || typeof row !== "object") return row;
              if (currentUserId && row.user_id === currentUserId && !row.status) {
                return { ...row, status: "pending", can_edit: false };
              }
              return row;
            };
            const patched = Array.isArray(values)
              ? values.map(patchRow)
              : patchRow(values);
            return origInsert(patched, options);
          };
        }

        // Lọc bỏ thành viên 'pending' khỏi danh sách thành viên chính thức
        if (typeof query.select === "function") {
          const origSelect = query.select.bind(query);
          query.select = function (...args) {
            const sel = origSelect(...args);
            const origThen = sel.then?.bind(sel);
            if (origThen) {
              sel.then = function (onFulfilled, onRejected) {
                return origThen((res) => {
                  if (res && Array.isArray(res.data)) {
                    const hasStatus = res.data.some((r) => r && "status" in r);
                    if (hasStatus) {
                      const pendingOnly = res.data.filter((r) => r.status === "pending");
                      if (pendingOnly.length > 0 && pendingOnly.length === res.data.length) {
                        return onFulfilled ? onFulfilled(res) : res;
                      }
                      res = {
                        ...res,
                        data: res.data.filter((r) => !r.status || r.status === "approved"),
                      };
                    }
                  }
                  return onFulfilled ? onFulfilled(res) : res;
                }, onRejected);
              };
            }
            return sel;
          };
        }
      }

      return query;
    };

    refreshProfilesAndPending(sb).then(() => renderApprovalPanelAndNames(sb));
    return sb;
  }

  // Bắt Supabase client từ window hoặc createClient
  function hookSupabaseGlobal() {
    if (window.supabase && typeof window.supabase.createClient === "function" && !window.supabase.__swHooked) {
      const origCreate = window.supabase.createClient.bind(window.supabase);
      window.supabase.createClient = function (...args) {
        const client = origCreate(...args);
        window.__swSbClient = wrapSupabase(client);
        return client;
      };
      window.supabase.__swHooked = true;
    }
    ["sb", "_supabase", "supabaseClient", "client"].forEach((k) => {
      if (window[k] && typeof window[k].from === "function") {
        window.__swSbClient = wrapSupabase(window[k]);
      }
    });
  }

  // =========================================================================
  // 3. THAY TÊN THẬT & RENDER KHUNG DUYỆT THÀNH VIÊN CHO TRƯỞNG NHÓM
  // =========================================================================
  window.__swApproveReq = async function (rowId) {
    const sb = window.__swSbClient;
    if (!sb) return;
    const { error } = await sb.from("group_members").update({ status: "approved" }).eq("id", rowId);
    if (error) return alert("Không duyệt được: " + error.message);
    await refreshProfilesAndPending(sb);
    renderApprovalPanelAndNames(sb);
    if (typeof window.renderGroups === "function") window.renderGroups();
  };

  window.__swRejectReq = async function (rowId) {
    const sb = window.__swSbClient;
    if (!sb) return;
    const { error } = await sb.from("group_members").delete().eq("id", rowId);
    if (error) return alert("Không từ chối được: " + error.message);
    await refreshProfilesAndPending(sb);
    renderApprovalPanelAndNames(sb);
    if (typeof window.renderGroups === "function") window.renderGroups();
  };

  function renderApprovalPanelAndNames(sb) {
    const root = document.getElementById("root");
    if (!root) return;

    // 3.1. Thay thế các nhãn "Thành viên" đơn lẻ bằng tên chủ tài khoản nếu đang ở trang Nhóm
    const myName = currentUserId ? profileMap[currentUserId] : null;
    if (myName) {
      root.querySelectorAll("option, span, b, strong").forEach((el) => {
        if (el.children.length === 0 && el.textContent.trim() === "Thành viên") {
          el.textContent = myName;
        }
      });
    }

    // 3.2. Hiển thị box "Yêu cầu chờ duyệt" trong trang Nhóm cho Trưởng nhóm
    if (!location.hash.includes("groups")) return;
    const allPending = Object.values(pendingMembersByGroup).flat();
    let box = document.getElementById("sw-pending-approvals-box");

    if (allPending.length === 0) {
      if (box) box.remove();
      return;
    }

    if (!box) {
      box = document.createElement("div");
      box.id = "sw-pending-approvals-box";
      box.className = "card";
      box.style.borderLeft = "4px solid var(--am)";
      const main = root.querySelector("main") || root;
      const firstCard = main.querySelector(".card");
      if (firstCard) main.insertBefore(box, firstCard);
      else main.prepend(box);
    }

    box.innerHTML = `
      <h2 style="margin:0 0 10px;display:flex;align-items:center;gap:8px">
        ⏳ Yêu cầu tham gia nhóm chờ duyệt (${allPending.length})
      </h2>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${allPending
          .map((m) => {
            const name = profileMap[m.user_id] || "Người dùng (" + String(m.user_id).slice(0, 6) + ")";
            return `
              <div class="row" style="align-items:center;padding:8px 10px;background:var(--bg);border-radius:8px">
                <div><b>${name}</b> <span class="mu" style="font-size:12px">• Xin vào nhóm</span></div>
                <div style="display:flex;gap:6px">
                  <button class="btn" style="padding:6px 12px;background:var(--gr)" onclick="window.__swApproveReq('${m.id}')">✓ Duyệt</button>
                  <button class="btn o" style="padding:6px 12px;color:var(--rd);border-color:var(--rd)" onclick="window.__swRejectReq('${m.id}')">✕ Từ chối</button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  // Theo dõi thay đổi DOM để tự động áp dụng ngay khi chuyển tab
  hookSupabaseGlobal();
  const observer = new MutationObserver(() => {
    hookSupabaseGlobal();
    fixDonutScrollbars();
    if (window.__swSbClient) renderApprovalPanelAndNames(window.__swSbClient);
  });

  window.addEventListener("DOMContentLoaded", () => {
    hookSupabaseGlobal();
    fixDonutScrollbars();
    observer.observe(document.body, { childList: true, subtree: true });
  });
  window.addEventListener("resize", fixDonutScrollbars);
  window.addEventListener("hashchange", () => {
    setTimeout(() => {
      fixDonutScrollbars();
      if (window.__swSbClient) {
        refreshProfilesAndPending(window.__swSbClient).then(() =>
          renderApprovalPanelAndNames(window.__swSbClient)
        );
      }
    }, 250);
  });
})();