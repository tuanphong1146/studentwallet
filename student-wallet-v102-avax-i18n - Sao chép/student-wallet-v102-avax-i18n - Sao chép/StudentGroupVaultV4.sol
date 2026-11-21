// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title StudentGroupVaultV4
/// @notice Append-only receipt fingerprint & approval audit trail on Avalanche Fuji C-Chain.
///         VND cashflows run via traditional banking rails; AVAX testnet is used strictly for gas.
contract StudentGroupVaultV4 {
    bytes32 private constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant ADMIN_TYPEHASH = keccak256("InitializeGroupAdmin(bytes32 groupKey,address admin,uint256 deadline)");
    uint256 private constant SECP256K1_HALF_N = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    address public immutable adminAttestor;
    struct AuditEntry {
        bytes32 recordHash;
        address recorder;
        uint256 timestamp;
        uint256 version;
    }

    mapping(bytes32 => address) public groupAdmin;
    mapping(bytes32 => mapping(address => bool)) public authorizedRecorder;

    // Write-once initial receipt hash (never overwritten)
    mapping(bytes32 => mapping(bytes32 => bytes32)) public receiptHashes;
    // Full append-only receipt revision history (v1, v2, ...)
    mapping(bytes32 => mapping(bytes32 => AuditEntry[])) private receiptHistory;

    // Latest approval/payout summary + full append-only history
    mapping(bytes32 => mapping(bytes32 => AuditEntry)) public auditRecords;
    mapping(bytes32 => mapping(bytes32 => AuditEntry[])) private approvalHistory;

    constructor(address trustedAdminAttestor) {
        require(trustedAdminAttestor != address(0), "Invalid attestor");
        adminAttestor = trustedAdminAttestor;
    }

    event GroupAdminInitialized(bytes32 indexed groupKey, address indexed admin);
    event RecorderAuthorized(bytes32 indexed groupKey, address indexed recorder, bool allowed);
    event ReceiptHashRecorded(
        bytes32 indexed groupKey,
        bytes32 indexed expenseKey,
        bytes32 indexed receiptHash,
        address recorder,
        uint256 version,
        uint256 timestamp
    );
    event ApprovalAuditRecorded(
        bytes32 indexed groupKey,
        bytes32 indexed eventKey,
        bytes32 indexed auditHash,
        address recorder,
        uint256 version,
        uint256 timestamp
    );

    modifier onlyAuthorized(bytes32 groupKey) {
        address admin = groupAdmin[groupKey];
        require(admin != address(0), "Group admin not initialized");
        require(
            msg.sender == admin || authorizedRecorder[groupKey][msg.sender],
            "Not authorized recorder for group"
        );
        _;
    }

    function initializeGroupAdmin(bytes32 groupKey, address admin, uint256 deadline, bytes calldata signature) external {
        require(groupKey != bytes32(0) && admin != address(0), "Invalid input");
        require(groupAdmin[groupKey] == address(0), "Group admin already set");
        require(block.timestamp <= deadline, "Attestation expired");
        bytes32 domain = keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes("StudentGroupVaultV4")),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));
        bytes32 structHash = keccak256(abi.encode(ADMIN_TYPEHASH, groupKey, admin, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domain, structHash));
        require(_recoverSigner(digest, signature) == adminAttestor, "Invalid admin attestation");
        groupAdmin[groupKey] = admin;
        authorizedRecorder[groupKey][admin] = true;
        emit GroupAdminInitialized(groupKey, admin);
        emit RecorderAuthorized(groupKey, admin, true);
    }

    function _recoverSigner(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        require(signature.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) v += 27;
        require((v == 27 || v == 28) && uint256(s) <= SECP256K1_HALF_N, "Invalid signature");
        signer = ecrecover(digest, v, r, s);
    }

    function setAuthorizedRecorder(bytes32 groupKey, address recorder, bool allowed) external {
        require(groupKey != bytes32(0) && recorder != address(0), "Invalid input");
        require(groupAdmin[groupKey] == msg.sender, "Only group admin");
        authorizedRecorder[groupKey][recorder] = allowed;
        emit RecorderAuthorized(groupKey, recorder, allowed);
    }

    function recordReceiptHash(
        bytes32 groupKey,
        bytes32 expenseKey,
        bytes32 receiptHash
    ) external onlyAuthorized(groupKey) {
        require(groupKey != bytes32(0) && expenseKey != bytes32(0), "Invalid key");
        require(receiptHash != bytes32(0), "Invalid receiptHash");
        require(receiptHashes[groupKey][expenseKey] == bytes32(0), "Receipt already sealed; use appendReceiptRevision");

        receiptHashes[groupKey][expenseKey] = receiptHash;
        receiptHistory[groupKey][expenseKey].push(AuditEntry({
            recordHash: receiptHash,
            recorder: msg.sender,
            timestamp: block.timestamp,
            version: 1
        }));

        emit ReceiptHashRecorded(groupKey, expenseKey, receiptHash, msg.sender, 1, block.timestamp);
    }

    function appendReceiptRevision(
        bytes32 groupKey,
        bytes32 expenseKey,
        bytes32 receiptHash
    ) external onlyAuthorized(groupKey) {
        require(groupKey != bytes32(0) && expenseKey != bytes32(0), "Invalid key");
        require(receiptHash != bytes32(0), "Invalid receiptHash");
        require(receiptHashes[groupKey][expenseKey] != bytes32(0), "Initial seal required first");

        uint256 ver = receiptHistory[groupKey][expenseKey].length + 1;
        receiptHistory[groupKey][expenseKey].push(AuditEntry({
            recordHash: receiptHash,
            recorder: msg.sender,
            timestamp: block.timestamp,
            version: ver
        }));

        emit ReceiptHashRecorded(groupKey, expenseKey, receiptHash, msg.sender, ver, block.timestamp);
    }

    function recordApprovalAudit(
        bytes32 groupKey,
        bytes32 eventKey,
        bytes32 auditHash
    ) external onlyAuthorized(groupKey) {
        require(groupKey != bytes32(0) && eventKey != bytes32(0), "Invalid key");
        require(auditHash != bytes32(0), "Invalid auditHash");

        uint256 ver = approvalHistory[groupKey][eventKey].length + 1;
        AuditEntry memory entry = AuditEntry({
            recordHash: auditHash,
            recorder: msg.sender,
            timestamp: block.timestamp,
            version: ver
        });

        approvalHistory[groupKey][eventKey].push(entry);
        auditRecords[groupKey][eventKey] = entry;

        emit ApprovalAuditRecorded(groupKey, eventKey, auditHash, msg.sender, ver, block.timestamp);
    }

    function getReceiptHistoryCount(bytes32 groupKey, bytes32 expenseKey) external view returns (uint256) {
        return receiptHistory[groupKey][expenseKey].length;
    }

    function getReceiptHistoryAt(
        bytes32 groupKey,
        bytes32 expenseKey,
        uint256 index
    ) external view returns (bytes32 recordHash, address recorder, uint256 timestamp, uint256 version) {
        AuditEntry memory e = receiptHistory[groupKey][expenseKey][index];
        return (e.recordHash, e.recorder, e.timestamp, e.version);
    }

    function getApprovalHistoryCount(bytes32 groupKey, bytes32 eventKey) external view returns (uint256) {
        return approvalHistory[groupKey][eventKey].length;
    }

    function getApprovalHistoryAt(
        bytes32 groupKey,
        bytes32 eventKey,
        uint256 index
    ) external view returns (bytes32 recordHash, address recorder, uint256 timestamp, uint256 version) {
        AuditEntry memory e = approvalHistory[groupKey][eventKey][index];
        return (e.recordHash, e.recorder, e.timestamp, e.version);
    }
}
