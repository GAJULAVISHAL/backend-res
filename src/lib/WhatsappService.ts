import axios from 'axios';

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;

export async function sendMenuTemplate(to: string, mealType: string, menuItems: string) {
  try {
    const response = await axios.post(WHATSAPP_API_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: 'daily_menu', // The exact name of your template
        language: { code: 'en' }, // Or your language code
        components: [
          // Body component for the variables {{1}} and {{2}}
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: mealType, // This replaces {{1}}
              },
              {
                type: 'text',
                text: menuItems, // This replaces {{2}}
              },
            ],
          },
          // Button component for the "Yes" button
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '0', // The first button
            parameters: [
              {
                type: 'payload',
                payload: 'YES_PAYLOAD' // A unique identifier for this button
              }
            ]
          },
          // Button component for the "No" button
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '1', // The second button
            parameters: [
              {
                type: 'payload',
                payload: 'NO_PAYLOAD' // A unique identifier for this button
              }
            ]
          }
        ],
      },
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('WhatsApp template with buttons sent successfully:', response.data);
  } catch (error: any) {
    console.error('Error sending WhatsApp template:', JSON.stringify(error.response?.data, null, 2));
  }
}