import axios from 'axios';

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;

export async function sendMenuTemplate(to: string, mealType: string, menuItems: string): Promise<boolean> {
  console.log(`[WhatsappService] ➡️ Attempting to send template to: ${to}`);

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'daily_menu',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: mealType },
            { type: 'text', text: menuItems },
          ],
        },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '0',
          parameters: [{ type: 'payload', payload: 'YES_PAYLOAD' }]
        },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '1',
          parameters: [{ type: 'payload', payload: 'NO_PAYLOAD' }]
        }
      ],
    },
  };

  console.log('[WhatsappService] 📤 Constructed Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[WhatsappService] ✅ Message sent successfully. Meta API Response:', response.data);
    return true;

  } catch (error: any) {
    console.error('[WhatsappService] ❌ Error sending WhatsApp template.');
    if (error.response) {
      console.error('[WhatsappService] ❌ Status:', error.response.status);
      console.error('[WhatsappService] ❌ Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('[WhatsappService] ❌ Error Message:', error.message);
    }
    return false;
  }
}