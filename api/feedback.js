/**
 * Endpoint Serverless na Vercel: /api/feedback
 * Processa as avaliações de satisfação do PDFaz de forma segura e interna,
 * sem disparar alertas de antivírus (Kaspersky/Defender) e sem expor e-mails no frontend.
 */

module.exports = async function handler(req, res) {
  // Configurar CORS caso necessário
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const data = req.body || {};

    // 1. Registro em tempo real nos logs da Vercel (Vercel > Project > Logs)
    console.log('==============================================');
    console.log('📝 [NOVA AVALIAÇÃO DE SATISFAÇÃO - PDFaz.com.br]');
    console.log('Data/Hora:', data.data_envio || new Date().toLocaleString('pt-BR'));
    console.log('Nota (Utilidade):', data.utilidade_nota);
    console.log('Recomendaria:', data.recomendaria);
    console.log('Recursos Faltantes:', data.recursos_que_sentiu_falta);
    console.log('Tipo de Documento:', data.tipo_documento_utilizado);
    console.log('Valor Total:', data.valor_total);
    console.log('==============================================');

    // 2. Se houver Webhook (Google Sheets, Discord, Telegram) configurado em variáveis de ambiente:
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (webhookErr) {
        console.warn('Erro ao encaminhar para Webhook:', webhookErr.message);
      }
    }

    // 3. Se houver integração com Resend para envio de e-mail (RESEND_API_KEY):
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'PDFaz Pesquisa <onboarding@resend.dev>',
            to: ['lucasladeiraloes@gmail.com'],
            subject: data._subject || `[PDFaz.com.br] Nova Avaliação (${data.utilidade_nota || ''})`,
            html: `
              <h2>Nova Avaliação de Satisfação - PDFaz.com.br</h2>
              <p><strong>Data de Envio:</strong> ${data.data_envio || new Date().toLocaleString('pt-BR')}</p>
              <p><strong>1. Utilidade:</strong> ${data.utilidade_nota || 'Não informado'}</p>
              <p><strong>2. Recomendaria:</strong> ${data.recomendaria || 'Não informado'}</p>
              <p><strong>3. Recursos que sentiu falta:</strong> ${data.recursos_que_sentiu_falta || 'Nenhum'}</p>
              <p><strong>Documento gerado:</strong> ${data.tipo_documento_utilizado || '-'} (${data.valor_total || '-'})</p>
            `
          })
        });
      } catch (emailErr) {
        console.warn('Erro ao enviar e-mail via Resend:', emailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Avaliação recebida e processada com sucesso!'
    });
  } catch (error) {
    console.error('Erro no processamento da avaliação:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar avaliação',
      details: error.message
    });
  }
};
