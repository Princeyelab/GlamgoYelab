<?php
/**
 * Page de reinitialisation du mot de passe
 * L'utilisateur arrive ici depuis le lien dans l'email
 * Il saisit son nouveau mot de passe, le formulaire appelle l'API
 */

$token = $_GET['token'] ?? '';
$email = $_GET['email'] ?? '';
$appUrl = getenv('APP_URL') ?: 'https://glamgo-api.fly.dev';
$apiUrl = $appUrl . '/api/auth/reset-password';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlamGo - Reinitialiser votre mot de passe</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1);
            max-width: 440px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background-color: #E63946;
            padding: 28px 32px;
            text-align: center;
        }
        .header h1 {
            color: #fff;
            font-size: 28px;
            margin: 0;
        }
        .header p {
            color: #ffcdd2;
            font-size: 14px;
            margin-top: 6px;
        }
        .content {
            padding: 32px;
        }
        .content h2 {
            color: #333;
            font-size: 20px;
            margin-bottom: 8px;
        }
        .content .subtitle {
            color: #666;
            font-size: 14px;
            margin-bottom: 24px;
            line-height: 1.5;
        }
        .form-group {
            margin-bottom: 16px;
        }
        .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 6px;
        }
        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
            outline: none;
        }
        .form-group input:focus {
            border-color: #E63946;
        }
        .form-group .hint {
            font-size: 12px;
            color: #999;
            margin-top: 4px;
        }
        .btn {
            width: 100%;
            padding: 14px;
            background-color: #E63946;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-top: 8px;
        }
        .btn:hover { background-color: #d32f3f; }
        .btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .error-msg {
            background: #fff3f4;
            color: #E63946;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 16px;
            display: none;
        }
        .success-container {
            text-align: center;
            padding: 40px 32px;
        }
        .success-container .icon {
            font-size: 64px;
            margin-bottom: 16px;
        }
        .success-container h2 {
            color: #333;
            margin-bottom: 12px;
        }
        .success-container p {
            color: #666;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 24px;
        }
        .link-btn {
            display: inline-block;
            padding: 12px 32px;
            background-color: #E63946;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
        }
        .expired-container {
            text-align: center;
            padding: 40px 32px;
        }
        .expired-container .icon {
            font-size: 64px;
            margin-bottom: 16px;
        }
        .expired-container h2 {
            color: #E63946;
            margin-bottom: 12px;
        }
        .expired-container p {
            color: #666;
            font-size: 14px;
            line-height: 1.5;
        }
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            vertical-align: middle;
            margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>GlamGo</h1>
            <p>Reinitialisation du mot de passe</p>
        </div>

        <?php if (empty($token) || empty($email)): ?>
        <!-- Lien invalide -->
        <div class="expired-container">
            <div class="icon">&#9888;&#65039;</div>
            <h2>Lien invalide</h2>
            <p>Ce lien de reinitialisation est invalide ou incomplet. Veuillez refaire une demande depuis l'application GlamGo.</p>
        </div>
        <?php else: ?>

        <!-- Formulaire -->
        <div class="content" id="form-container">
            <h2>Nouveau mot de passe</h2>
            <p class="subtitle">Saisissez votre nouveau mot de passe pour le compte <strong><?php echo htmlspecialchars($email); ?></strong></p>

            <div class="error-msg" id="error-msg"></div>

            <form id="reset-form" onsubmit="handleSubmit(event)">
                <div class="form-group">
                    <label for="password">Nouveau mot de passe</label>
                    <input type="password" id="password" name="password" required minlength="6" placeholder="Minimum 6 caracteres">
                    <div class="hint">Minimum 6 caracteres</div>
                </div>
                <div class="form-group">
                    <label for="password_confirm">Confirmer le mot de passe</label>
                    <input type="password" id="password_confirm" name="password_confirm" required minlength="6" placeholder="Retapez votre mot de passe">
                </div>
                <button type="submit" class="btn" id="submit-btn">Reinitialiser mon mot de passe</button>
            </form>
        </div>

        <!-- Succes -->
        <div class="success-container" id="success-container" style="display:none;">
            <div class="icon">&#9989;</div>
            <h2>Mot de passe modifie !</h2>
            <p>Votre mot de passe a ete reinitialise avec succes. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe dans l'application GlamGo.</p>
            <a href="glamgo://login" class="link-btn">Ouvrir GlamGo</a>
        </div>

        <!-- Token expire -->
        <div class="expired-container" id="expired-container" style="display:none;">
            <div class="icon">&#9200;</div>
            <h2>Lien expire</h2>
            <p>Ce lien de reinitialisation a expire ou a deja ete utilise. Veuillez refaire une demande depuis l'application GlamGo.</p>
        </div>

        <script>
            const API_URL = <?php echo json_encode($apiUrl); ?>;
            const TOKEN = <?php echo json_encode($token); ?>;
            const EMAIL = <?php echo json_encode($email); ?>;

            function showError(msg) {
                const el = document.getElementById('error-msg');
                el.textContent = msg;
                el.style.display = 'block';
            }

            function hideError() {
                document.getElementById('error-msg').style.display = 'none';
            }

            async function handleSubmit(e) {
                e.preventDefault();
                hideError();

                const password = document.getElementById('password').value;
                const confirm = document.getElementById('password_confirm').value;
                const btn = document.getElementById('submit-btn');

                if (password.length < 6) {
                    showError('Le mot de passe doit contenir au moins 6 caracteres.');
                    return;
                }

                if (password !== confirm) {
                    showError('Les mots de passe ne correspondent pas.');
                    return;
                }

                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span>Reinitialisation...';

                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: TOKEN,
                            email: EMAIL,
                            password: password
                        })
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        document.getElementById('form-container').style.display = 'none';
                        document.getElementById('success-container').style.display = 'block';
                    } else {
                        if (response.status === 400) {
                            document.getElementById('form-container').style.display = 'none';
                            document.getElementById('expired-container').style.display = 'block';
                        } else {
                            showError(data.message || 'Une erreur est survenue. Veuillez reessayer.');
                            btn.disabled = false;
                            btn.textContent = 'Reinitialiser mon mot de passe';
                        }
                    }
                } catch (err) {
                    showError('Erreur de connexion. Verifiez votre connexion internet.');
                    btn.disabled = false;
                    btn.textContent = 'Reinitialiser mon mot de passe';
                }
            }
        </script>
        <?php endif; ?>
    </div>
</body>
</html>
