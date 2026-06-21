// netlify/functions/prices.js
// Серверный прокси для Travelpayouts Data API.
// Токен хранится в переменной окружения Netlify (TRAVELPAYOUTS_TOKEN) —
// он никогда не передаётся в браузер и не лежит в коде на GitHub.
// Браузер обращается к этой функции на нашем домене (без CORS-проблем),
// а функция уже на сервере делает запрос к Travelpayouts и возвращает ответ.

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN;

  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Токен не настроен на сервере. Добавьте переменную окружения TRAVELPAYOUTS_TOKEN в настройках Netlify (Site configuration → Environment variables) и сделайте redeploy.'
      })
    };
  }

  const { origin, destination, month, currency } = event.queryStringParameters || {};

  if (!origin || !destination || !month) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Не переданы origin, destination или month' }) };
  }

  const url = `https://api.travelpayouts.com/v2/prices/month-matrix?currency=${encodeURIComponent(currency || 'rub')}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&month=${encodeURIComponent(month)}&show_to_affiliates=true`;

  try {
    const upstream = await fetch(url, {
      headers: { 'x-access-token': token }
    });

    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Неверный ответ от Travelpayouts (статус ${upstream.status})`,
          raw: text.slice(0, 600)
        })
      };
    }

    if (!upstream.ok) {
      return {
        statusCode: upstream.status,
        headers,
        body: JSON.stringify({ success: false, error: data.error || `Travelpayouts вернул статус ${upstream.status}` })
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (e) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ success: false, error: 'Не удалось связаться с Travelpayouts: ' + e.message })
    };
  }
};
