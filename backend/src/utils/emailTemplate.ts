export function generateKitaPayEmail(title: string, bodyHtml: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .sidebar-wrapper {
            display: flex;
            background-color: #00DDFD; /* KitaPay Cyan */
            padding: 0;
        }
        .content-box {
            background-color: #ffffff;
            margin: 0 40px; 
            padding: 40px;
            width: 100%;
            min-height: 400px;
        }
        .logo {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo img {
            max-width: 160px;
            height: auto;
        }
        .greeting {
            font-size: 22px;
            font-weight: bold;
            color: #14213d;
            margin-bottom: 20px;
        }
        .body-text {
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }
        .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #666666;
            border-top: 1px solid #eeeeee;
            padding-top: 20px;
        }
        /* Fallback for email clients that don't support flexbox */
        .fallback-table {
            width: 100%;
            border-collapse: collapse;
        }
        .fallback-sidebar {
            width: 40px;
            background-color: #00DDFD;
        }
        .fallback-content {
            background-color: #ffffff;
            padding: 40px;
            vertical-align: top;
        }
    </style>
</head>
<body>
    <div style="background-color: #f4f4f4; padding: 20px 0;">
        <table class="container fallback-table" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td class="fallback-sidebar"></td>
                <td class="fallback-content">
                    <div class="logo">
                        <img src="https://res.cloudinary.com/djkkckmig/image/upload/v1790675680/f1qcm0gwdcozwxnrzjbd.png" alt="KitaPay Logo" />
                    </div>
                    
                    <div class="greeting">
                        ${title}
                    </div>
                    
                    <div class="body-text">
                        ${bodyHtml}
                    </div>
                    
                    <div class="footer">
                        <p>Terima kasih,<br/><strong>Tim KitaPay</strong></p>
                        <p style="margin-top: 15px; font-size: 13px;">Butuh bantuan? Silakan kunjungi <a href="https://kitapay.rinzgroup.web.id/dashboard/support" style="color: #00DDFD; text-decoration: none; font-weight: bold;">Halaman Support</a> kami.</p>
                    </div>
                </td>
                <td class="fallback-sidebar"></td>
            </tr>
        </table>
    </div>
</body>
</html>
    `;
}
