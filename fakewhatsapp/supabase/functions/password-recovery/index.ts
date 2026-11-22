const url = Deno.env.get("SUPABASE_URL")!;
const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = { apikey: adminKey, Authorization: `Bearer ${adminKey}` };
const table = `${url}/rest/v1/password_recovery_codes`;

function reply(status: number, body: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function hash(code: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return reply(405);
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== "object") return reply(400);
  try {
    if (input.action === "generate") {
      const token = request.headers.get("Authorization");
      if (!token?.startsWith("Bearer ")) return reply(401);
      const userResponse = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: adminKey, Authorization: token },
      });
      if (!userResponse.ok) return reply(userResponse.status < 500 ? 401 : 503);
      const user = await userResponse.json();
      if (!user.id || !user.email_confirmed_at || user.is_anonymous) return reply(403);
      const code = crypto.randomUUID();
      const saved = await fetch(`${table}?on_conflict=user_id`, {
        method: "POST",
        headers: { ...admin, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ user_id: user.id, code_hash: await hash(code) }),
      });
      return saved.ok ? reply(200, { code }) : reply(503);
    }

    if (input.action !== "reset") return reply(400);
    if (typeof input.code !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.code)) {
      return reply(400, { error_code: "invalid_recovery_code" });
    }
    if (typeof input.password !== "string" || input.password.length < 8 ||
        new TextEncoder().encode(input.password).length > 72) {
      return reply(400, { error_code: "recovery_password_length" });
    }

    // DELETE consumes the matching code in one database statement, even on concurrent requests.
    const claimed = await fetch(`${table}?code_hash=eq.${await hash(input.code.toLowerCase())}&select=user_id`, {
      method: "DELETE",
      headers: { ...admin, Prefer: "return=representation" },
    });
    if (!claimed.ok) return reply(503);
    const [row] = await claimed.json();
    if (!row) return reply(400, { error_code: "invalid_recovery_code" });
    try {
      const updated = await fetch(`${url}/auth/v1/admin/users/${row.user_id}`, {
        method: "PUT",
        headers: { ...admin, "Content-Type": "application/json" },
        body: JSON.stringify({ password: input.password }),
      });
      if (!updated.ok) return reply(503, { error_code: "recovery_consumed" });
      return reply(200);
    } catch {
      return reply(503, { error_code: "recovery_consumed" });
    }
  } catch {
    return reply(503);
  }
});
