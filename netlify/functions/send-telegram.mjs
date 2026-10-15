
const PORTAL_ID = '149554758';
const FORM_ID = '0dc7dde0-95c2-4a15-ad3f-0fdf74146ccb';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default async function handler(request) {
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

  const name = String(data.name ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  const email = String(data.email ?? '').trim();
  const service = String(data.service ?? '').trim();
  const details = String(data.details ?? '').trim();

  if (!name || !phone || !service) {
    return json({
      ok: false,
      error: 'Заполните обязательные поля'
    }, 400);
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({
      ok: false,
      error: 'Некорректная электронная почта'
    }, 400);
  }

  const fields = [
    { name: 'firstname', value: name.slice(0, 100) },
    { name: 'phone', value: phone.slice(0, 80) },
    { name: 'usluga', value: service.slice(0, 120) }
  ];

  if (email) {
    fields.push({
      name: 'email',
      value: email.slice(0, 254)
    });
  }

  if (details) {
    fields.push({
      name: 'kommentarij_k_zaavke',
      value: details.slice(0, 1000)
    });
  }

  try {
    const response = await fetch(
      `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: 'https://form-detail-studio.netlify.app/',
            pageName: 'FORM / Detail Studio'
          }
        })
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error('HubSpot error:', response.status, responseText);

      return json({
        ok: false,
        error: 'HubSpot отклонил заявку',
        status: response.status
      }, 502);
    }

    console.log('HubSpot form submission accepted');

    return json({
      ok: true,
      message: 'HubSpot принял отправку формы'
    });

  } catch (error) {
    console.error('HubSpot connection error:', error.message);

    return json({
      ok: false,
      error: 'Ошибка соединения с HubSpot'
    }, 502);
  }
}
