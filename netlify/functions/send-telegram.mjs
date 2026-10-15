
const PORTAL_ID = '149554758';
const FORM_ID = '0dc7dde0-95c2-4a15-ad3f-0fdf74146ccb';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
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

  const name = String(data.name || '').trim().slice(0, 100);
  const phone = String(data.phone || '').trim().slice(0, 80);
  const email = String(data.email || '').trim().slice(0, 254);
  const service = String(data.service || '').trim().slice(0, 120);
  const details = String(data.details || '').trim().slice(0, 1000);

  if (!name || !phone || !service) {
    return json({ ok: false, error: 'Missing required fields' }, 400);
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

  if (email) {
    fields.push({ name: 'email', value: email });
  }

  const hubspotUrl =
    `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`;

  let hubspotOk = false;
  let telegramOk = false;

  try {
    const response = await fetch(hubspotUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: 'https://form-detail-studio.netlify.app/',
          pageName: 'FORM / Detail Studio'
        }
      })
    });

    hubspotOk = response.ok;
    if (!hubspotOk) {
      console.error('HubSpot submission failed:', response.status);
    }
  } catch (error) {
    console.error('HubSpot request failed:', error.message);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    const text = [
      '🚘 Новая заявка с сайта FORM / Detail Studio',
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Почта: ${email || 'не указана'}`,
      `Услуга: ${service}`,
      `Комментарий: ${details || 'не указан'}`
    ].join('\n');

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text })
        }
      );

      const result = await response.json();
      telegramOk = response.ok && result.ok;
    } catch (error) {
      console.error('Telegram request failed:', error.message);
    }
  }

  return json(
    { ok: hubspotOk && telegramOk, hubspotOk, telegramOk },
    hubspotOk && telegramOk ? 200 : 502
  );
};
