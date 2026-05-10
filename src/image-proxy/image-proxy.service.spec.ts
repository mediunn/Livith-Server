import { Readable, Writable } from 'stream';
import { ImageProxyService } from './image-proxy.service';

function makeFetchMock(ok = true, headers: Record<string, string> = {}, body?: Buffer | string) {
  return jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    body: body ? Readable.from([body]) : null,
  });
}

describe('ImageProxyService', () => {
  let svc: ImageProxyService;
  let res: any;

  beforeEach(() => {
    svc = new ImageProxyService();
    res = new Writable({
      write(chunk: any, _enc, cb) {
        // collect chunks in an array for assertions
        (res.__chunks ||= []).push(Buffer.from(chunk));
        cb();
      },
    }) as any;

    res.setHeader = jest.fn();
    res.sendStatus = jest.fn();
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();
  });

  afterEach(() => {
    (global as any).fetch = undefined;
    jest.clearAllMocks();
  });

  it('returns 400 for empty url', async () => {
    await svc.proxyToResponse('', res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('returns 400 for invalid url', async () => {
    await svc.proxyToResponse('not-a-url', res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('returns 403 for forbidden host', async () => {
    await svc.proxyToResponse('https://example.com/img.jpg', res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalled();
  });

  it('passes upstream status when not ok', async () => {
    (global as any).fetch = makeFetchMock(false, {}, null);
    await svc.proxyToResponse('https://cdninstagram.com/img.jpg', res);
    expect(res.sendStatus).toHaveBeenCalledWith(404);
  });

  it('streams body and sets headers when ok', async () => {
    const buf = Buffer.from([1, 2, 3]);
    (global as any).fetch = makeFetchMock(true, { 'content-type': 'image/png', 'content-length': '3' }, buf);

    await svc.proxyToResponse('https://cdninstagram.com/img.jpg', res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');

    const collected = Buffer.concat(res.__chunks || []);
    expect(collected).toEqual(buf);
  });
});
