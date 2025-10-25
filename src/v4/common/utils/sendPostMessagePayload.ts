import { Response } from 'express';

export function sendPostMessagePayload(res: Response, payload: any) {
  return res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload)}, '${process.env.FRONTEND_URL}');
            window.close();
          } else {
            window.location.href = '${process.env.FRONTEND_URL}';
          }
        </script>
      </body>
    </html>
  `);
}
