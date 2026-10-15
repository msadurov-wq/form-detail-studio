// Имя файла сохранено для совместимости с текущим index.html.
// Заявки отправляются только в HubSpot CRM.
const PORTAL_ID = '149554758';
const FORM_ID = '0dc7dde0-95c2-4a15-ad3f-0fdf74146ccb';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export default async (request) => {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json({ ok: false, error: 'Invalid data' }, 400);
  }

  const name = String(data.name ?? '').trim().slice(0, 100);
  const phone = String(data.phone ?? '').trim().slice(0, 80);
  const email = String(data.email ?? '').trim().slice(0, 254);
  const service = String(data.service ?? '').trim().slice(0, 120);
  const details = String(data.details ?? '').trim().slice(0, 1000);

  if (!name || !phone || !service) {
    return json({ ok: false, error: 'Please fill in required fields' }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Invalid email' }, 400);
  }

  const fields = [
    { name: 'firstname', value: name },
    { name: 'phone', value: phone },
    { name: 'usluga', value: service },
    { name: 'kommentarij_k_zaavke', value: details }
  ];
  if (email) fields.push({ name: 'email', value: email });

  try {
    const response = await fetch(
      `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: 'https://form-detail-studio.netlify.app/',
            pageName: 'FORM / Detail Studio'
          }
        })
      }
    );

    if (!response.ok) {
      console.error('HubSpot submission failed:', response.status);
      return json({ ok: false, error: 'CRM could not accept the application' }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    console.error('HubSpot request error:', error?.message || 'Network error');
    return json({ ok: false, error: 'Temporary CRM connection error' }, 502);
  }
};
