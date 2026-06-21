// netlify/functions/autocomplete.js
// Прокси для публичного автодополнения городов/аэропортов Aviasales.
// Не требует токена, но всё равно идёт через прокси на случай CORS-ограничений
// и чтобы фронтенд работал с единообразными путями /.netlify/functions/*.

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

  const { term } = event.queryStringParameters || {};

  if (!term || term.trim().length < 2) {
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }

  const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(term)}&locale=ru&types[]=city&types[]=airport`;

  try {
    const upstream = await fetch(url);
    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }
};
