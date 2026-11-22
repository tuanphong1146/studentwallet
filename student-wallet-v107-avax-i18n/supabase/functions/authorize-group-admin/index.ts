import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { privateKeyToAccount } from "npm:viem@2/accounts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const contractAddress = Deno.env.get("FUJI_VAULT_CONTRACT_ADDRESS") || "";
    const rawPrivateKey = Deno.env.get("ADMIN_ATTESTOR_PRIVATE_KEY") || "";
    if (!token || !supabaseUrl || !anonKey || !rawPrivateKey || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return json({ error: "Server authorization settings are incomplete." }, 500);
    }

    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Authentication required." }, 401);
    const { groupId, adminAddress } = await req.json();
    if (typeof groupId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(groupId)) return json({ error: "Invalid group id." }, 400);
    if (typeof adminAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(adminAddress)) return json({ error: "Invalid admin wallet." }, 400);

    const [{ data: group, error: groupError }, { data: profile, error: profileError }] = await Promise.all([
      client.from("groups").select("id,owner_id").eq("id", groupId).maybeSingle(),
      client.from("user_profiles").select("wallet_address").eq("id", authData.user.id).maybeSingle(),
    ]);
    if (groupError || !group || group.owner_id !== authData.user.id) return json({ error: "Only the authenticated group owner can request initialization." }, 403);
    if (profileError || !profile?.wallet_address || profile.wallet_address.toLowerCase() !== adminAddress.toLowerCase()) {
      return json({ error: "Admin wallet must match the group owner's saved wallet." }, 403);
    }

    const groupKeyBytes = new TextEncoder().encode(`group:${groupId}`);
    const digest = await crypto.subtle.digest("SHA-256", groupKeyBytes);
    const groupKey = `0x${Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const privateKey = (rawPrivateKey.startsWith("0x") ? rawPrivateKey : `0x${rawPrivateKey}`) as `0x${string}`;
    const account = privateKeyToAccount(privateKey);
    const signature = await account.signTypedData({
      domain: { name: "StudentGroupVaultV4", version: "1", chainId: 43113, verifyingContract: contractAddress as `0x${string}` },
      primaryType: "InitializeGroupAdmin",
      types: { InitializeGroupAdmin: [
        { name: "groupKey", type: "bytes32" },
        { name: "admin", type: "address" },
        { name: "deadline", type: "uint256" },
      ] },
      message: { groupKey, admin: adminAddress as `0x${string}`, deadline: BigInt(deadline) },
    });
    return json({ groupKey, adminAddress, deadline, signature, attestorAddress: account.address, contractAddress });
  } catch (error) {
    console.error("authorize-group-admin:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
