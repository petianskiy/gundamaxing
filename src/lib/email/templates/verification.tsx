/**
 * Email templates for verification and password reset.
 * Returns HTML strings (not using @react-email).
 */

export function verificationEmailHtml(verifyUrl: string): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email — GUNDAMAXING</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0000 0%,#2d0000 100%);padding:32px 40px;border-bottom:2px solid #dc2626;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:28px;font-weight:800;letter-spacing:4px;color:#dc2626;text-transform:uppercase;">GUNDAMAXING</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:4px;">
                    <span style="font-size:11px;letter-spacing:2px;color:#666;text-transform:uppercase;">Pilot Verification Protocol</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f5f5f5;">Confirm Your Identity, Pilot</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a3a3a3;">
                Your registration signal has been received at GUNDAMAXING HQ. To activate your builder account and gain access to the hangar, verify your email address by clicking the button below.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background-color:#dc2626;border-radius:6px;">
                    <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:1px;color:#ffffff;text-decoration:none;text-transform:uppercase;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#666;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;padding:12px 16px;background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:4px;font-size:12px;color:#dc2626;word-break:break-all;">
                ${verifyUrl}
              </p>

              <p style="margin:0;font-size:12px;color:#525252;">
                This verification link expires in 24 hours. If you did not create an account on Gundamaxing, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a2a;background-color:#0f0f0f;">
              <p style="margin:0;font-size:11px;color:#525252;text-align:center;">
                &copy; ${year} GUNDAMAXING &mdash; Built by builders, for builders.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmailHtml(resetUrl: string): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset — GUNDAMAXING</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0000 0%,#2d0000 100%);padding:32px 40px;border-bottom:2px solid #dc2626;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:28px;font-weight:800;letter-spacing:4px;color:#dc2626;text-transform:uppercase;">GUNDAMAXING</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:4px;">
                    <span style="font-size:11px;letter-spacing:2px;color:#666;text-transform:uppercase;">Security Override Protocol</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f5f5f5;">Password Reset Requested</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a3a3a3;">
                A password reset was requested for your GUNDAMAXING pilot account. Click the button below to set a new password and regain access to your hangar.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background-color:#dc2626;border-radius:6px;">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:1px;color:#ffffff;text-decoration:none;text-transform:uppercase;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#666;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;padding:12px 16px;background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:4px;font-size:12px;color:#dc2626;word-break:break-all;">
                ${resetUrl}
              </p>

              <p style="margin:0;font-size:12px;color:#525252;">
                This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email — your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a2a;background-color:#0f0f0f;">
              <p style="margin:0;font-size:11px;color:#525252;text-align:center;">
                &copy; ${year} GUNDAMAXING &mdash; Built by builders, for builders.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
