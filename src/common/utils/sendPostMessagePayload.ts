import { Response } from 'express';

export function sendPostMessagePayload(res: Response, payload: any) {
  const allowedOrigins = (process.env.FRONTEND_URLS?.split(',') ?? [])
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin && origin.length > 0));

  const fallbackOrigin = allowedOrigins[0] ?? 'http://localhost:5173';

  return res.send(`
    <html>
      <body>
        <script>
          const allowedOrigins = ${JSON.stringify(allowedOrigins)};
          const fallbackOrigin = '${fallbackOrigin}';

          let targetOrigin = fallbackOrigin;

          try {
            if (document.referrer) {
              const referrerOrigin = new URL(document.referrer).origin;
              if (allowedOrigins.includes(referrerOrigin)) {
                targetOrigin = referrerOrigin;
              }
            }
          } catch (_) {}

          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload)}, targetOrigin);
            window.close();
          } else {
            window.location.href = fallbackOrigin;
          }
        </script>
      </body>
    </html>
  `);
}
