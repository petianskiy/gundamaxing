/**
 * Email templates for verification, password reset, and email change.
 * Returns HTML strings (not using @react-email).
 * All templates display a 6-digit verification code instead of clickable links.
 */

function codeBlock(code: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:#1a1a1a;border:2px solid #dc2626;border-radius:8px;padding:20px 40px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#ffffff;font-family:'Courier New',monospace;">${code}</span>
        </td>
      </tr>
    </table>`;
}

export function verificationEmailHtml(code: string): string {
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
                Your registration signal has been received at GUNDAMAXING HQ. Enter the verification code below on the website to activate your builder account.
              </p>

              <!-- Code Display -->
              ${codeBlock(code)}

              <p style="margin:0;font-size:12px;color:#525252;">
                This code expires in 15 minutes. If you did not create an account on Gundamaxing, you can safely ignore this email.
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

export function passwordResetEmailHtml(code: string): string {
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
                A password reset was requested for your GUNDAMAXING pilot account. Enter the code below on the website to set a new password.
              </p>

              <!-- Code Display -->
              ${codeBlock(code)}

              <p style="margin:0;font-size:12px;color:#525252;">
                This code expires in 1 hour. If you did not request a password reset, you can safely ignore this email — your account remains secure.
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

export function emailChangeVerificationHtml(code: string): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify New Email — GUNDAMAXING</title>
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
                    <span style="font-size:11px;letter-spacing:2px;color:#666;text-transform:uppercase;">Email Change Verification</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f5f5f5;">Verify Your New Email</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a3a3a3;">
                You requested to change the email address on your GUNDAMAXING account. Enter the code below on the website to confirm this new email address.
              </p>

              <!-- Code Display -->
              ${codeBlock(code)}

              <p style="margin:0;font-size:12px;color:#525252;">
                This code expires in 1 hour. If you did not request this change, you can safely ignore this email.
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

export function emailChangeNotificationHtml(newEmail: string): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Change Requested — GUNDAMAXING</title>
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
                    <span style="font-size:11px;letter-spacing:2px;color:#666;text-transform:uppercase;">Security Notification</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f5f5f5;">Email Change Requested</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a3a3a3;">
                A request was made to change the email address on your GUNDAMAXING account to <strong style="color:#f5f5f5;">${newEmail}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a3a3a3;">
                If you made this request, a verification code has been sent to the new address. No action is needed here.
              </p>
              <p style="margin:0;font-size:12px;color:#525252;">
                If you did not request this change, please secure your account immediately by changing your password.
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
