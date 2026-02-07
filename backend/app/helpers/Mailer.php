<?php

namespace App\Helpers;

class Mailer
{
    /**
     * Envoyer un email de bienvenue au nouveau client
     */
    public static function sendWelcomeEmail(string $email, string $firstName): bool
    {
        $subject = 'Bienvenue sur GlamGo !';
        $html = self::buildWelcomeTemplate($firstName);

        return self::send($email, $subject, $html);
    }

    /**
     * Envoyer un email
     */
    public static function send(string $to, string $subject, string $html): bool
    {
        $fromEmail = getenv('MAIL_FROM') ?: 'glamgo.noreply@gmail.com';
        $fromName = 'GlamGo';

        // Priorite 1: Brevo (envoie a tout le monde, 300/jour gratuit)
        $brevoKey = getenv('BREVO_API_KEY');
        if ($brevoKey) {
            $result = self::sendViaBrevo($to, $subject, $html, $fromEmail, $fromName, $brevoKey);
            if ($result) return true;
        }

        // Priorite 2: Resend (limite aux emails verifies en mode gratuit)
        $resendKey = getenv('RESEND_API_KEY');
        if ($resendKey) {
            $resendFrom = getenv('RESEND_FROM') ?: 'onboarding@resend.dev';
            $result = self::sendViaResend($to, $subject, $html, $resendFrom, $fromName, $resendKey);
            if ($result) return true;
        }

        // Fallback: mail() natif PHP
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            "From: {$fromName} <{$fromEmail}>",
            "Reply-To: {$fromEmail}",
        ];

        $sent = @mail($to, $subject, $html, implode("\r\n", $headers));

        if (!$sent) {
            error_log("[Mailer] All methods failed for {$to} - subject: {$subject}");
        }

        return $sent;
    }

    /**
     * Envoyer via Brevo API (gratuit: 300 emails/jour, envoie a tout le monde)
     */
    private static function sendViaBrevo(string $to, string $subject, string $html, string $fromEmail, string $fromName, string $apiKey): bool
    {
        $data = json_encode([
            'sender' => ['name' => $fromName, 'email' => $fromEmail],
            'to' => [['email' => $to]],
            'subject' => $subject,
            'htmlContent' => $html,
        ]);

        $options = [
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\naccept: application/json\r\napi-key: {$apiKey}\r\n",
                'content' => $data,
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ];

        $context = stream_context_create($options);
        $result = @file_get_contents('https://api.brevo.com/v3/smtp/email', false, $context);

        if ($result === false) {
            error_log("[Mailer] Brevo API connection failed for {$to}");
            return false;
        }

        $response = json_decode($result, true);
        if (isset($response['messageId'])) {
            error_log("[Mailer] Email sent via Brevo to {$to} (messageId: {$response['messageId']})");
            return true;
        }

        $errorMsg = $response['message'] ?? $result;
        error_log("[Mailer] Brevo API error for {$to}: {$errorMsg}");
        return false;
    }

    /**
     * Envoyer via Resend API (fallback)
     */
    private static function sendViaResend(string $to, string $subject, string $html, string $from, string $fromName, string $apiKey): bool
    {
        $data = json_encode([
            'from' => "{$fromName} <{$from}>",
            'to' => [$to],
            'subject' => $subject,
            'html' => $html,
        ]);

        $options = [
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\nAuthorization: Bearer {$apiKey}\r\n",
                'content' => $data,
                'timeout' => 10,
                'ignore_errors' => true,
            ],
        ];

        $context = stream_context_create($options);
        $result = @file_get_contents('https://api.resend.com/emails', false, $context);

        if ($result === false) {
            error_log("[Mailer] Resend API failed for {$to}");
            return false;
        }

        $response = json_decode($result, true);
        if (isset($response['id'])) {
            error_log("[Mailer] Email sent via Resend to {$to}");
            return true;
        }

        $errorMsg = $response['message'] ?? $result;
        error_log("[Mailer] Resend API error for {$to}: {$errorMsg}");
        return false;
    }

    /**
     * Envoyer un email de reinitialisation de mot de passe
     */
    public static function sendPasswordResetEmail(string $email, string $firstName, string $resetLink): bool
    {
        $subject = 'Réinitialisation de votre mot de passe GlamGo';
        $html = self::buildPasswordResetTemplate($firstName, $resetLink);

        return self::send($email, $subject, $html);
    }

    /**
     * Template HTML email de reinitialisation mot de passe
     */
    private static function buildPasswordResetTemplate(string $firstName, string $resetLink): string
    {
        return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

<!-- Header -->
<tr>
<td style="background-color:#E63946;padding:30px 40px;text-align:center;">
  <h1 style="color:#ffffff;margin:0;font-size:28px;">GlamGo</h1>
  <p style="color:#ffcdd2;margin:8px 0 0;font-size:14px;">Reinitialisation de mot de passe</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px;">
  <h2 style="color:#333;margin:0 0 16px;font-size:22px;">Bonjour ' . htmlspecialchars($firstName) . ',</h2>
  <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
    Vous avez demande la reinitialisation de votre mot de passe GlamGo. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
  </p>

  <table cellpadding="0" cellspacing="0" style="margin:24px auto;">
  <tr>
    <td style="background-color:#E63946;border-radius:8px;padding:16px 40px;">
      <a href="' . htmlspecialchars($resetLink) . '" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Reinitialiser mon mot de passe</a>
    </td>
  </tr>
  </table>

  <p style="color:#555;font-size:14px;line-height:1.6;margin:20px 0;">
    Ce lien est valable pendant <strong>1 heure</strong>. Apres ce delai, vous devrez refaire une demande.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#fff3f4;border-radius:8px;padding:16px 20px;">
      <p style="margin:0;color:#E63946;font-size:13px;">
        Si vous n\'avez pas demande cette reinitialisation, ignorez cet email. Votre mot de passe restera inchange.
      </p>
    </td>
  </tr>
  </table>

  <p style="color:#999;font-size:12px;line-height:1.6;margin:20px 0 0;">
    Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
    <a href="' . htmlspecialchars($resetLink) . '" style="color:#E63946;word-break:break-all;">' . htmlspecialchars($resetLink) . '</a>
  </p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#fafafa;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
  <p style="color:#999;font-size:12px;margin:0 0 8px;">GlamGo - Beaute et bien-etre a domicile</p>
  <p style="color:#bbb;font-size:11px;margin:0;">Cet email a ete envoye automatiquement suite a votre demande de reinitialisation.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>';
    }

    /**
     * Template HTML email de bienvenue
     */
    private static function buildWelcomeTemplate(string $firstName): string
    {
        return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

<!-- Header -->
<tr>
<td style="background-color:#E63946;padding:30px 40px;text-align:center;">
  <h1 style="color:#ffffff;margin:0;font-size:28px;">GlamGo</h1>
  <p style="color:#ffcdd2;margin:8px 0 0;font-size:14px;">Beaute et bien-etre a domicile</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px;">
  <h2 style="color:#333;margin:0 0 16px;font-size:22px;">Bienvenue ' . htmlspecialchars($firstName) . ' !</h2>
  <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
    Votre compte GlamGo a ete cree avec succes. Vous pouvez desormais reserver vos services de beaute et bien-etre directement depuis l\'application.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#fff3f4;border-radius:8px;padding:20px;">
      <p style="margin:0 0 12px;color:#E63946;font-weight:bold;font-size:15px;">Ce que vous pouvez faire :</p>
      <p style="margin:0 0 8px;color:#555;font-size:14px;">&#10003; Decouvrir les prestataires pres de chez vous</p>
      <p style="margin:0 0 8px;color:#555;font-size:14px;">&#10003; Reserver un service en quelques clics</p>
      <p style="margin:0 0 8px;color:#555;font-size:14px;">&#10003; Suivre votre prestataire en temps reel</p>
      <p style="margin:0;color:#555;font-size:14px;">&#10003; Payer en toute securite</p>
    </td>
  </tr>
  </table>

  <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px;">
    Ouvrez l\'application et commencez a explorer les services disponibles dans votre region !
  </p>

  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#E63946;border-radius:8px;padding:14px 32px;">
      <a href="glamgo://home" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Ouvrir GlamGo</a>
    </td>
  </tr>
  </table>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#fafafa;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
  <p style="color:#999;font-size:12px;margin:0 0 8px;">GlamGo - Beaute et bien-etre a domicile</p>
  <p style="color:#bbb;font-size:11px;margin:0;">Cet email a ete envoye automatiquement suite a votre inscription.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>';
    }
}
