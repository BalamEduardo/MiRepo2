type ServiceAccount = { client_email: string; private_key: string; project_id: string };

const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
  .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const encodedJson = (value: unknown) => encode(new TextEncoder().encode(JSON.stringify(value)));

async function googleAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodedJson({ alg: 'RS256', typ: 'JWT' });
  const claims = encodedJson({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const pem = account.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const input = `${header}.${claims}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${input}.${encode(new Uint8Array(signature))}` }),
  });
  if (!response.ok) throw new Error('Google OAuth failed');
  return (await response.json()).access_token;
}

Deno.serve(async (request) => {
  const secret = Deno.env.get('FWA_WEBHOOK_SECRET');
  const supplied = request.headers.get('x-webhook-secret');
  if (request.method !== 'POST' || !secret || supplied !== secret) return new Response('Unauthorized', { status: 401 });
  try {
    const { mensaje_id } = await request.json();
    if (typeof mensaje_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(mensaje_id)) return new Response('Invalid request', { status: 400 });
    const url = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    async function rows(path: string) {
      const response = await fetch(`${url}/rest/v1/${path}`, { headers });
      if (!response.ok) throw new Error('Database lookup failed');
      return await response.json();
    }
    const [message] = await rows(`mensajes?id=eq.${mensaje_id}&select=conversacion_id,remitente_id,eliminado`);
    if (!message || message.eliminado) return new Response(null, { status: 204 });
    const members = await rows(`conversaciones_miembros?conversacion_id=eq.${message.conversacion_id}&perfil_id=neq.${message.remitente_id}&select=perfil_id`);
    if (members.length === 0) return new Response(null, { status: 204 });
    const devices = await rows(`tokens_fcm?usuario_id=in.(${members.map((m: { perfil_id: string }) => m.perfil_id).join(',')})&select=token,usuario_id`);
    if (!devices.length) return new Response(null, { status: 204 });
    const account: ServiceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);
    const access = await googleAccessToken(account);
    let failed = false;
    for (const device of devices) {
      const result = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
        method: 'POST', headers: { Authorization: `Bearer ${access}`, 'content-type': 'application/json' },
        body: JSON.stringify({ message: { token: device.token, android: { priority: 'high' },
          data: { title: 'FakeWhatsApp', body: 'Nuevo mensaje', conversacion_id: message.conversacion_id, usuario_id: device.usuario_id, mensaje_id } } }),
      });
      if (!result.ok) failed = true;
    }
    return new Response(failed ? 'FCM delivery failed' : 'OK', { status: failed ? 502 : 200 });
  } catch {
    return new Response('Notification processing failed', { status: 500 });
  }
});
