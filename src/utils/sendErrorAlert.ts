// utils/sendErrorAlert.ts
import nodemailer from "nodemailer";

/**
 * Envia um alerta por email quando um erro grave ocorre durante a renderização de uma notícia.
 * Apenas em produção (ignora no ambiente local).
 */
export async function sendErrorAlert(slug: string, mensagem: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Erro detectado em ${slug}: ${mensagem}`);
    return;
  }

  // ⚠️ Certifique-se de definir estas variáveis no .env do Vercel:
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // true se usar SSL (porta 465)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"GeekNews - Monitor de Erros" <pablo.h.moura@gmail.com>',
      to: "pablo.h.moura@gmail.com",
      subject: `🚨 Erro crítico na notícia: ${slug}`,
      html: `
        <h2>Erro ao carregar página do GeekNews</h2>
        <p><strong>Slug:</strong> ${slug}</p>
        <p><strong>Mensagem:</strong></p>
        <pre style="background:#f6f6f6;padding:10px;border-left:4px solid red;border-radius:4px;color:#333">${mensagem}</pre>
        <p><a href="https://www.geeknews.com.br/noticia/${slug}">Visualizar notícia</a></p>
      `,
    });

    console.log("📧 Email de erro enviado:", info.messageId);
  } catch (err) {
    console.error("❌ Falha ao enviar alerta por email:", err);
  }
}
