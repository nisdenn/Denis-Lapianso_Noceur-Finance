export class WhatsAppClient {
  private get fonnteToken() {
    return process.env.FONNTE_TOKEN || '';
  }
  private get phoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }
  private get accessToken() {
    return process.env.WHATSAPP_ACCESS_TOKEN || '';
  }
  private get apiVersion() {
    return process.env.WHATSAPP_API_VERSION || 'v21.0';
  }

  isConfigured(): boolean {
    return Boolean(this.fonnteToken || (this.phoneNumberId && this.accessToken));
  }

  async sendTextMessage(recipient: string, text: string) {
    const phone = recipient.replace(/\D/g, '');

    if (!this.isConfigured()) {
      console.log(`[WhatsApp Mock -> ${phone}]: ${text}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    if (this.fonnteToken) {
      try {
        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: this.fonnteToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: phone,
            message: text,
          }),
        });

        const result = await response.json();
        if (!result.status) {
          return { success: false, error: result.reason || 'Fonnte gagal mengirim pesan' };
        }
        return { success: true, messageId: result.id?.[0] || `fonnte_${Date.now()}` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
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

    if (this.fonnteToken) {
      const optionsText = `${bodyText}\n\n👉 Balas *YA* untuk menyimpan, atau *BATAL* untuk membatalkan.`;
      return await this.sendTextMessage(phone, optionsText);
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

  async sendFileMessage(
    recipient: string,
    fileUrl: string,
    fileName: string,
    caption?: string
  ) {
    const phone = recipient.replace(/\D/g, '');

    if (!this.isConfigured()) {
      console.log(`[WhatsApp Mock File -> ${phone}]: ${fileName} (${fileUrl})`);
      return { success: true, messageId: `mock_file_${Date.now()}` };
    }

    if (this.fonnteToken) {
      try {
        const formData = new FormData();
        formData.append('target', phone);
        formData.append('url', fileUrl);
        formData.append('filename', fileName);
        if (caption) formData.append('message', caption);

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: this.fonnteToken,
          },
          body: formData,
        });

        const result = await response.json();
        if (!result.status) {
          return { success: false, error: result.reason || 'Fonnte gagal mengirim file' };
        }
        return { success: true, messageId: result.id?.[0] || `fonnte_file_${Date.now()}` };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'File sending only supported via Fonnte' };
  }
}

export const whatsAppClient = new WhatsAppClient();
