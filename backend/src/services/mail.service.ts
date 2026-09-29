import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 1025;
const SMTP_FROM = process.env.SMTP_FROM || '"Dashboard" <no-reply@dashboard.local>';

/**
* Nodemailer transporter
**/
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
});

/**
* Send a verification email to the user
* @param email - The user's email
* @param token - The verification token
**/
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  const confirmationUrl = `${backendUrl}/api/auth/confirm/${token}`;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Activez votre compte Dashboard',

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1f2937;">Bienvenue sur Dashboard !</h2>
        <p style="color: #4b5563; font-size: 15px;">
          Merci de vous être inscrit. Pour valider votre adresse e-mail et commencer à utiliser votre tableau de bord, veuillez cliquer sur le bouton ci-dessous :
        </p>
        <p style="margin: 24px 0;">
          <a href="${confirmationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Confirmer mon compte
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
          <a href="${confirmationUrl}" style="color: #2563eb;">${confirmationUrl}</a>
        </p>
      </div>
    `,

    text: `Bienvenue sur Dashboard ! Pour confirmer votre compte, ouvrez ce lien : ${confirmationUrl}`,
  });
};