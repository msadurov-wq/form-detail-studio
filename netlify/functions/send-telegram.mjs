export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405, headers: { 'content-type': 'application/json; charset=utf-8', 'Allow': 'POST' }
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return new Response(JSON.stringify({ ok: false, error: 'Server configuration is incomplete' }), {
      status: 500, headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  let data;
  try { data = await request.json(); }
  catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400, headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const name = String(data.name || '').trim().slice(0, 100);
  const phone = String(data.phone || '').trim().slice(0, 80);
  const service = String(data.service || '').trim().slice(0, 120);
  const details = String(data.details || '').trim().slice(0, 1000);
  if (!name || !phone || !service) {
    return new Response(JSON.stringify({ ok: false, error: 'Please complete the required fields' }), {
      status: 400, headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const text = [
    '🚘 Новая заявка с сайта FORM / Detail Studio',
    `Имя: ${name}`,
    `Контакт: ${phone}`,
    `Услуга: ${service}`,
    `Комментарий: ${details || 'не указан'}`
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    const result = await telegramResponse.json();
    if (!telegramResponse.ok || !result.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Telegram could not deliver the message' }), {
        status: 502, headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Temporary delivery failure' }), {
      status: 502, headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
};
