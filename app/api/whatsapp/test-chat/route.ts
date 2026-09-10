import { NextRequest, NextResponse } from 'next/server';
import { whatsAppService } from '@/lib/services/whatsapp.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message, senderName, buttonPayload } = body;

    if (!phoneNumber || (!message && !buttonPayload)) {
      return NextResponse.json(
        { error: 'phoneNumber and message (or buttonPayload) are required' },
        { status: 400 }
      );
    }

    const result = await whatsAppService.handleIncomingMessage({
      senderPhone: phoneNumber,
      senderName: senderName || 'Test User',
      text: message || '',
      buttonPayload,
      messageId: `test_msg_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      phoneNumber,
      actionTaken: result.actionTaken,
      replyText: result.replyText,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
