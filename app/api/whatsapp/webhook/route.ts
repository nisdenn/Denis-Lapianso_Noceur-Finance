import { NextRequest, NextResponse } from 'next/server';
import { whatsAppService } from '@/lib/services/whatsapp.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'noceur_finance_webhook_verify_secret';

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value || !value.messages) continue;

        const contact = value.contacts?.[0];
        const senderName = contact?.profile?.name || 'User';

        for (const message of value.messages) {
          const from = message.from;
          const messageId = message.id;
          const type = message.type;

          let text = '';
          let buttonPayload: string | undefined = undefined;

          if (type === 'text') {
            text = message.text?.body || '';
          } else if (type === 'interactive') {
            const interactive = message.interactive;
            if (interactive.type === 'button_reply') {
              buttonPayload = interactive.button_reply?.id;
              text = interactive.button_reply?.title || '';
            } else if (interactive.type === 'list_reply') {
              buttonPayload = interactive.list_reply?.id;
              text = interactive.list_reply?.title || '';
            }
          } else if (type === 'button') {
            buttonPayload = message.button?.payload || message.button?.text;
            text = message.button?.text || '';
          }

          if (from && (text || buttonPayload)) {
            try {
              await whatsAppService.handleIncomingMessage({
                senderPhone: from,
                senderName,
                text,
                messageId,
                buttonPayload,
              });
            } catch (error) {
              console.error('WhatsApp message processing failed:', error);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 200 });
  }
}
