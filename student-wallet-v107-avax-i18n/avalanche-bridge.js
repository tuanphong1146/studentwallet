  // Avalanche Fuji (Chain ID 43113) Audit Bridge for StudentGroupVaultV4
(function () {
  const FUJI_CHAIN_ID_DEC = 43113;
  const FUJI_CHAIN_ID_HEX = "0xa869";
  const FUJI_EXPLORER_TX = "https://testnet.snowtrace.io/tx/";
  const FUJI_RPC_URLS = [
    "https://api.avax-test.network/ext/bc/C/rpc",
    "https://avalanche-fuji-c-chain-rpc.publicnode.com"
  ];

  // Set to the newly deployed attestation-protected contract address on Fuji.
  const DEFAULT_CONTRACT_ADDRESS = "0xA83681B88c175eF1d73224002989D0F64bA45aa6";

  function getContractAddress() {
    if (typeof window !== "undefined" && window.FUJI_AUDIT_CONTRACT && /^0x[a-fA-F0-9]{40}$/.test(window.FUJI_AUDIT_CONTRACT)) {
      return window.FUJI_AUDIT_CONTRACT;
    }
    try {
      const saved = localStorage.getItem("sw_fuji_audit_contract");
      if (saved && /^0x[a-fA-F0-9]{40}$/.test(saved)) return saved;
    } catch (_) {}
    return DEFAULT_CONTRACT_ADDRESS;
  }

  function setContractAddress(addr) {
    const clean = String(addr || "").trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(clean)) {
      throw new Error("Địa chỉ contract không hợp lệ (cần 0x + 40 ký tự hex).");
    }
    try { localStorage.setItem("sw_fuji_audit_contract", clean); } catch (_) {}
    if (typeof window !== "undefined") window.FUJI_AUDIT_CONTRACT = clean;
    return clean;
  }

  // Exact Keccak-256 4-byte selectors verified against Solidity signatures
  const SELECTORS = {
    initializeGroupAdmin: "0x3ea06798", // initializeGroupAdmin(bytes32,address,uint256,bytes)
    setAuthorizedRecorder: "0xc5d9cbdc",  // setAuthorizedRecorder(bytes32,address,bool)
    recordReceiptHash: "0xe1e64200",        // recordReceiptHash(bytes32,bytes32,bytes32)
    appendReceiptRevision: "0x3cf29c8b",    // appendReceiptRevision(bytes32,bytes32,bytes32)
    recordApprovalAudit: "0x36a45cc5",      // recordApprovalAudit(bytes32,bytes32,bytes32)
    receiptHashes: "0x51a25245",            // receiptHashes(bytes32,bytes32)
    auditRecords: "0xbd84b28a",             // auditRecords(bytes32,bytes32)
    getReceiptHistoryCount: "0x403d02bc",   // getReceiptHistoryCount(bytes32,bytes32)
    getReceiptHistoryAt: "0x8947fbfc",      // getReceiptHistoryAt(bytes32,bytes32,uint256)
    getApprovalHistoryCount: "0xc4bd93c8",  // getApprovalHistoryCount(bytes32,bytes32)
    getApprovalHistoryAt: "0x4a468591",     // getApprovalHistoryAt(bytes32,bytes32,uint256)
    groupAdmin: "0xb0670d7a",               // groupAdmin(bytes32)
    authorizedRecorder: "0xc0e1d4e9"        // authorizedRecorder(bytes32,address)
  };

  function pad32Hex(hexNo0x) { return String(hexNo0x || "").replace(/^0x/i, "").padStart(64, "0").slice(-64); }
  function encodeAddress(addr) { return pad32Hex(String(addr || "").toLowerCase()); }
  function encodeBool(b) { return pad32Hex(b ? "1" : "0"); }
  function encodeUint256(n) { return BigInt(Math.max(0, Math.floor(Number(n) || 0))).toString(16).padStart(64, "0"); }
  function encodeBytes(hex) {
    const clean = String(hex || "").replace(/^0x/i, "");
    if (!/^(?:[0-9a-fA-F]{2})*$/.test(clean)) throw new Error("Attestation signature không hợp lệ.");
    return encodeUint256(clean.length / 2) + clean.padEnd(Math.ceil(clean.length / 64) * 64, "0");
  }
  function utf8ToBytes(str) { return new TextEncoder().encode(String(str || "")); }
  function bytesToHex(bytes) { return "0x" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(""); }

  async function sha256Hex(input) {
    const data = typeof input === "string" ? utf8ToBytes(input) : new Uint8Array(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(digest));
  }
  async function toBytes32Key(label) { return await sha256Hex(String(label || "")); }

  function getEthereumProvider() {
    if (typeof window === "undefined") return null;
    if (window.ethereum) return window.ethereum;
    if (window.avalanche) return window.avalanche;
    return null;
  }

  async function getConnectedFujiAccount() {
    const eth = getEthereumProvider();
    if (!eth || typeof eth.request !== "function") return null;
    try {
      const accounts = await eth.request({ method: "eth_accounts" });
      if (!accounts || !accounts[0]) return null;
      const chainIdHex = await eth.request({ method: "eth_chainId" });
      return {
        address: String(accounts[0]),
        chainId: parseInt(String(chainIdHex), 16) || 0,
        isFuji: String(chainIdHex).toLowerCase() === FUJI_CHAIN_ID_HEX
      };
    } catch (_) { return null; }
  }

  async function connectFujiWallet() {
    const eth = getEthereumProvider();
    if (!eth || typeof eth.request !== "function") throw new Error("Không tìm thấy ví Web3 (MetaMask / Core Wallet).");
    const accounts = await eth.request({ method: "eth_requestAccounts" });
    const account = accounts && accounts[0] ? String(accounts[0]) : "";
    if (!account) throw new Error("Chưa chọn tài khoản ví.");

    let chainIdHex = await eth.request({ method: "eth_chainId" });
    if (String(chainIdHex).toLowerCase() !== FUJI_CHAIN_ID_HEX) {
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: FUJI_CHAIN_ID_HEX }] });
      } catch (switchErr) {
        if (switchErr && switchErr.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: FUJI_CHAIN_ID_HEX,
              chainName: "Avalanche Fuji C-Chain",
              nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
              rpcUrls: FUJI_RPC_URLS,
              blockExplorerUrls: ["https://testnet.snowtrace.io/"]
            }]
          });
        } else { throw switchErr; }
      }
      chainIdHex = await eth.request({ method: "eth_chainId" });
    }

    return { address: account, chainId: parseInt(String(chainIdHex), 16) || FUJI_CHAIN_ID_DEC, contractAddress: getContractAddress() };
  }

  function isAuthOrKeyError(msg) {
    const s = String(msg || "").toLowerCase();
    return s.includes("api key") || s.includes("authenticate") || s.includes("unauthorized") || s.includes("forbidden") || s.includes("401") || s.includes("403");
  }

  async function rpcCallWithStatus(method, params) {
    const eth = getEthereumProvider();
    let lastErr = "";
    const errors = [];

    for (const rpc of FUJI_RPC_URLS) {
      try {
        const res = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
        });
        const j = await res.json();
        if (j && j.result !== undefined && j.result !== null) {
          return { ok: true, result: j.result, error: "" };
        }
        const errMsg = (j && j.error && (j.error.message || JSON.stringify(j.error))) || ("HTTP " + res.status);
        errors.push(`${rpc}: ${errMsg}`);
        if (!isAuthOrKeyError(errMsg)) lastErr = errMsg;
      } catch (e) {
        const m = e && e.message ? e.message : String(e);
        errors.push(`${rpc}: ${m}`);
        if (!isAuthOrKeyError(m)) lastErr = m;
      }
    }

    if (eth && typeof eth.request === "function") {
      try {
        const res = await eth.request({ method, params });
        if (res !== undefined && res !== null) return { ok: true, result: res, error: "" };
      } catch (e) {
        const m = e && e.message ? e.message : String(e);
        errors.push(`wallet: ${m}`);
        lastErr = m;
      }
    }

    return { ok: false, result: null, error: lastErr || errors[0] || "Không kết nối được RPC Avalanche Fuji." };
  }

  async function waitForTxConfirmation(txHash, maxPolls = 20, intervalMs = 1500) {
    for (let i = 0; i < maxPolls; i++) {
      const r = await rpcCallWithStatus("eth_getTransactionReceipt", [txHash]);
      const receipt = r.ok ? r.result : null;
      if (receipt) {
        if (receipt.status === "0x0") {
          return { txStatus: "failed", blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : null, error: "Giao dịch bị revert trên Avalanche Fuji (status = 0x0)." };
        }
        if (receipt.status === "0x1") {
          return { txStatus: "confirmed", blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : null, error: "" };
        }
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return { txStatus: "pending", blockNumber: null, error: "" };
  }

  async function sendAuditTx(fromAddress, dataHex) {
    const eth = getEthereumProvider();
    if (!eth) throw new Error("Ví Web3 chưa sẵn sàng.");
    const contractAddr = getContractAddress();

    const codeCheck = await rpcCallWithStatus("eth_getCode", [contractAddr, "latest"]);
    if (!codeCheck.ok) throw new Error("Không kiểm tra được bytecode contract trên Fuji: " + codeCheck.error);
    if (!codeCheck.result || codeCheck.result === "0x" || codeCheck.result === "0x0") {
      throw new Error(`Không có contract tại địa chỉ ${contractAddr} trên Fuji (43113).`);
    }

    const txHash = await eth.request({
      method: "eth_sendTransaction",
      params: [{ from: fromAddress, to: contractAddr, data: dataHex, value: "0x0" }]
    });
    if (!txHash) throw new Error("Không nhận được txHash từ ví.");

    const conf = await waitForTxConfirmation(txHash, 20, 1500);
    if (conf.txStatus === "failed") throw new Error(conf.error || "Giao dịch bị revert trên Fuji.");

    return {
      txHash: String(txHash),
      txStatus: conf.txStatus,
      blockNumber: conf.blockNumber,
      contractAddress: contractAddr,
      explorerUrl: FUJI_EXPLORER_TX + String(txHash)
    };
  }

  async function callContractReadDetailed(dataHex) {
    const contractAddr = getContractAddress();
    const codeCheck = await rpcCallWithStatus("eth_getCode", [contractAddr, "latest"]);
    if (!codeCheck.ok) return { ok: false, raw: "0x", error: codeCheck.error };
    if (!codeCheck.result || codeCheck.result === "0x" || codeCheck.result === "0x0") {
      return { ok: false, raw: "0x", error: `Không tìm thấy smart contract tại địa chỉ ${contractAddr} trên Avalanche Fuji (43113).` };
    }
    const r = await rpcCallWithStatus("eth_call", [{ to: contractAddr, data: dataHex }, "latest"]);
    if (!r.ok) {
      const msg = String(r.error || "");
      if (msg.toLowerCase().includes("execution reverted")) {
        return {
          ok: false,
          raw: "0x",
          error: `Contract tại ${contractAddr} không hỗ trợ hàm của StudentGroupVaultV4 (execution reverted). Hãy deploy StudentGroupVaultV4.sol mới lên Fuji và bấm "Đổi Contract" để dán địa chỉ mới.`
        };
      }
      return { ok: false, raw: "0x", error: r.error };
    }
    return { ok: true, raw: r.result || "0x", error: "" };
  }

  window.AvalancheBridge = {
    chainId: FUJI_CHAIN_ID_DEC,
    chainIdHex: FUJI_CHAIN_ID_HEX,
    explorerTxBase: FUJI_EXPLORER_TX,
    rpcUrls: FUJI_RPC_URLS,
    get contractAddress() { return getContractAddress(); },
    getContractAddress,
    setContractAddress,
    sha256Hex,
    toBytes32Key,
    getConnectedFujiAccount,
    connectFujiWallet,
    waitForTxConfirmation,

    async initializeGroupAdminOnChain(fromAddress, groupId, adminAddress, deadline, signature) {
      const gKey = await toBytes32Key("group:" + groupId);
      if (!/^0x[a-fA-F0-9]{40}$/.test(String(adminAddress || ""))) throw new Error("Ví admin không hợp lệ.");
      const data = SELECTORS.initializeGroupAdmin + pad32Hex(gKey) + encodeAddress(adminAddress) + encodeUint256(deadline) + encodeUint256(128) + encodeBytes(signature);
      return await sendAuditTx(fromAddress, data);
    },

    async setAuthorizedRecorderOnChain(fromAddress, groupId, recorderAddr, allowed) {
      const gKey = await toBytes32Key("group:" + groupId);
      const data = SELECTORS.setAuthorizedRecorder + pad32Hex(gKey) + encodeAddress(recorderAddr) + encodeBool(!!allowed);
      return await sendAuditTx(fromAddress, data);
    },

    async recordReceiptHashOnChain(fromAddress, groupId, expenseId, canonicalReceiptPayload) {
      const gKey = await toBytes32Key("group:" + groupId);
      const eKey = await toBytes32Key("expense:" + expenseId);
      const rawHash = await sha256Hex(JSON.stringify(canonicalReceiptPayload || {}));
      const data = SELECTORS.recordReceiptHash + pad32Hex(gKey) + pad32Hex(eKey) + pad32Hex(rawHash);
      const txRes = await sendAuditTx(fromAddress, data);
      return { ...txRes, groupKey: gKey, expenseKey: eKey, receiptHash: rawHash.replace(/^0x/i, ""), recorder: fromAddress };
    },

    async appendReceiptRevisionOnChain(fromAddress, groupId, expenseId, canonicalReceiptPayload) {
      const gKey = await toBytes32Key("group:" + groupId);
      const eKey = await toBytes32Key("expense:" + expenseId);
      const rawHash = await sha256Hex(JSON.stringify(canonicalReceiptPayload || {}));
      const data = SELECTORS.appendReceiptRevision + pad32Hex(gKey) + pad32Hex(eKey) + pad32Hex(rawHash);
      const txRes = await sendAuditTx(fromAddress, data);
      return { ...txRes, groupKey: gKey, expenseKey: eKey, receiptHash: rawHash.replace(/^0x/i, ""), recorder: fromAddress };
    },

    async recordApprovalAuditOnChain(fromAddress, groupId, eventId, auditPayload) {
      const gKey = await toBytes32Key("group:" + groupId);
      const eKey = await toBytes32Key("audit:" + eventId);
      const rawHash = await sha256Hex(JSON.stringify({ type: "APPROVAL_AUDIT", groupId, eventId, ...(auditPayload || {}) }));
      const data = SELECTORS.recordApprovalAudit + pad32Hex(gKey) + pad32Hex(eKey) + pad32Hex(rawHash);
      const txRes = await sendAuditTx(fromAddress, data);
      return { ...txRes, groupKey: gKey, eventKey: eKey, auditHash: rawHash.replace(/^0x/i, ""), recorder: fromAddress };
    },

    async getOnChainReceiptHashDetailed(groupId, expenseId) {
      const gKey = await toBytes32Key("group:" + groupId);
      const eKey = await toBytes32Key("expense:" + expenseId);
      const r = await callContractReadDetailed(SELECTORS.receiptHashes + pad32Hex(gKey) + pad32Hex(eKey));
      if (!r.ok) return { ok: false, hash: "", error: r.error };
      const clean = String(r.raw || "").replace(/^0x/i, "").padStart(64, "0").slice(-64);
      if (!clean || /^0+$/.test(clean)) return { ok: true, hash: "", error: "" };
      return { ok: true, hash: clean.toLowerCase(), error: "" };
    },

    async getOnChainReceiptHash(groupId, expenseId) {
      const d = await this.getOnChainReceiptHashDetailed(groupId, expenseId);
      return d.ok ? d.hash : "";
    },

    async getReceiptHistoryFromChain(groupId, expenseId) {
      const gKey = await toBytes32Key("group:" + groupId);
      const eKey = await toBytes32Key("expense:" + expenseId);
      const cntRes = await callContractReadDetailed(SELECTORS.getReceiptHistoryCount + pad32Hex(gKey) + pad32Hex(eKey));
      if (!cntRes.ok) return { ok: false, versions: [], error: cntRes.error };
      const count = Number(BigInt(cntRes.raw && cntRes.raw !== "0x" ? cntRes.raw : "0x0"));
      const versions = [];
      for (let i = 0; i < count; i++) {
        const itemRes = await callContractReadDetailed(SELECTORS.getReceiptHistoryAt + pad32Hex(gKey) + pad32Hex(eKey) + encodeUint256(i));
        if (itemRes.ok && itemRes.raw && itemRes.raw.length >= 258) {
          const h = itemRes.raw.replace(/^0x/i, "");
          versions.push({
            index: i,
            recordHash: h.slice(0, 64).toLowerCase(),
            recorder: "0x" + h.slice(88, 128),
            timestamp: Number(BigInt("0x" + h.slice(128, 192))),
            version: Number(BigInt("0x" + h.slice(192, 256)))
          });
        }
      }
      return { ok: true, versions, error: "" };
    },

    async getApprovalHistoryFromChain(groupId, eventId) {
      const gKey = await toBytes32Key("group:" + groupId);
      const eKey = await toBytes32Key("audit:" + eventId);
      const cntRes = await callContractReadDetailed(SELECTORS.getApprovalHistoryCount + pad32Hex(gKey) + pad32Hex(eKey));
      if (!cntRes.ok) return { ok: false, versions: [], error: cntRes.error };
      const count = Number(BigInt(cntRes.raw && cntRes.raw !== "0x" ? cntRes.raw : "0x0"));
      const versions = [];
      for (let i = 0; i < count; i++) {
        const itemRes = await callContractReadDetailed(SELECTORS.getApprovalHistoryAt + pad32Hex(gKey) + pad32Hex(eKey) + encodeUint256(i));
        if (!itemRes.ok || !itemRes.raw || itemRes.raw.length < 258) continue;
        const h = itemRes.raw.replace(/^0x/i, "");
        versions.push({
          index: i,
          recordHash: h.slice(0, 64).toLowerCase(),
          recorder: "0x" + h.slice(88, 128),
          timestamp: Number(BigInt("0x" + h.slice(128, 192))),
          version: Number(BigInt("0x" + h.slice(192, 256)))
        });
      }
      return { ok: true, versions, error: "" };
    },

    async verifyApprovalAudit(groupId, eventId, expectedHash, txHash) {
      const history = await this.getApprovalHistoryFromChain(groupId, eventId);
      if (!history.ok) return { ok: false, error: history.error, history: [] };
      const normalized = String(expectedHash || "").replace(/^0x/i, "").toLowerCase();
      const match = !!normalized && history.versions.some(v => v.recordHash === normalized);
      const latest = history.versions.length ? history.versions[history.versions.length - 1] : null;
      const summary = await this.getOnChainAuditRecord(groupId, eventId);
      const tx = txHash ? await waitForTxConfirmation(txHash, 1, 0) : { txStatus: "not_recorded", blockNumber: null };
      return { ok: true, match, latestMatch: !!(latest && latest.recordHash === normalized && summary && summary.recordHash === latest.recordHash), summary, latest, txStatus: tx.txStatus, blockNumber: tx.blockNumber, history: history.versions };
    },

    async getGroupAdminFromChain(groupId) {
      const gKey = await toBytes32Key("group:" + groupId);
      const r = await callContractReadDetailed(SELECTORS.groupAdmin + pad32Hex(gKey));
      if (!r.ok) return { ok: false, address: "", error: r.error };
      const h = String(r.raw || "").replace(/^0x/i, "").padStart(64, "0");
      const address = "0x" + h.slice(-40);
      return { ok: true, address: /^0x0{40}$/i.test(address) ? "" : address, error: "" };
    },

    async isAuthorizedRecorderOnChain(groupId, address) {
      const gKey = await toBytes32Key("group:" + groupId);
      const r = await callContractReadDetailed(SELECTORS.authorizedRecorder + pad32Hex(gKey) + encodeAddress(address));
      if (!r.ok) return { ok: false, allowed: false, error: r.error };
      return { ok: true, allowed: BigInt(r.raw && r.raw !== "0x" ? r.raw : "0x0") !== 0n, error: "" };
    },

    async getOnChainAuditRecord(groupId, eventId) {
      const gKey = await toBytes32Key("group:" + groupId);
      const eKey = await toBytes32Key("audit:" + eventId);
      const r = await callContractReadDetailed(SELECTORS.auditRecords + pad32Hex(gKey) + pad32Hex(eKey));
      if (!r.ok) return null;
      const hex = String(r.raw || "").replace(/^0x/i, "");
      if (hex.length < 256) return null;
      const recordHash = hex.slice(0, 64).toLowerCase();
      if (!recordHash || /^0+$/.test(recordHash)) return null;
      return {
        recordHash,
        recorder: "0x" + hex.slice(88, 128),
        timestamp: Number(BigInt("0x" + hex.slice(128, 192))),
        version: Number(BigInt("0x" + hex.slice(192, 256)))
      };
    }
  };
})();
