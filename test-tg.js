const botToken = "8428582373:AAGtk8RDB4kudUA0dPBriifUzrRXAn0jdVw";
const chatId = "6866344165";

const ai_summary = "Token has a lot of volume on Pump.fun! _This is a quote_ or a pump_fun issue";
const message = `
🤖 *AI NARRATIVE AGENT*
_${ai_summary}_
`;

fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown'
  })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
