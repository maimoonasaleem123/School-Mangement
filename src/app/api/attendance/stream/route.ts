import { NextResponse } from 'next/server';
import { subscribe } from '@/lib/attendanceEvents';

export async function GET(request: Request) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      const push = (ev: any) => {
        try {
          const data = `data: ${JSON.stringify(ev)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        } catch (e) {}
      };

      const unsubscribe = subscribe(push);

      // keep the stream open until client disconnects
      // when the client disconnects, cancel will be called
      (controller as any).unsubscribe = unsubscribe;
    },
    cancel() {
      // noop handled via unsubscribe in start
    },
  });

  return new NextResponse(stream, { headers });
}
