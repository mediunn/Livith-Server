import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline as any);

@Injectable()
export class ImageProxyService {
  private allowedDomains = ['instagram.com', 'cdninstagram.com'];

  async proxyToResponse(urlStr: string, res: Response): Promise<void> {
    if (!urlStr) {
      res.status(400).json({ message: 'url is required' });
      return;
    }

    let target: URL;
    try {
      target = new URL(urlStr);
    } catch {
      res.status(400).json({ message: 'invalid url' });
      return;
    }

    const hostname = target.hostname.toLowerCase();
    const okHost = this.allowedDomains.some(
      (d) => hostname === d || hostname.endsWith('.' + d),
    );
    if (!okHost) {
      res.status(403).json({ message: 'forbidden host' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const upstream = await fetch(target.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
          Accept: 'image/*',
          Referer: 'https://www.instagram.com/',
        },
        redirect: 'follow',
        signal: controller.signal,
      } as any);

      if (!upstream.ok || !upstream.body) {
        res.sendStatus(upstream.status);
        return;
      }

      const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
      const contentLength = upstream.headers.get('content-length');

      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      await streamPipeline(upstream.body as any, res);
      return;
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        res.sendStatus(504);
        return;
      }
      res.sendStatus(502);
      return;
    } finally {
      clearTimeout(timeout);
    }
  }
}
