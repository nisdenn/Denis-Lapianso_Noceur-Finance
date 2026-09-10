export class WhatsAppClient {
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  private accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  private apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  async sendTextMessage(recipient: string, text: string) {
    const phone = recipient.replace(/\D/g, '');

    if (!this.isConfigured()) {
      console.log(`[WhatsApp Mock -> ${phone}]: ${text}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    try {
      const endpoint = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { body: text },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Gagal mengirim pesan WhatsApp' };
      }

      return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendInteractiveButtons(
    recipient: string,
    bodyText: string,
    buttons: { id: string; title: string }[]
  ) {
    const phone = recipient.replace(/\D/g, '');

    if (!this.isConfigured()) {
      console.log(`[WhatsApp Mock Interactive -> ${phone}]: ${bodyText}`);
      return { success: true, messageId: `mock_interactive_${Date.now()}` };
    }

    try {
      const endpoint = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons: buttons.slice(0, 3).map(btn => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title.slice(0, 20),
                },
              })),
            },
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        const textFallback = `${bodyText}\n\n${buttons.map(btn => `👉 Ketik *${btn.title}*`).join('\n')}`;
        return await this.sendTextMessage(phone, textFallback);
      }

      return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const whatsAppClient = new WhatsAppClient();
