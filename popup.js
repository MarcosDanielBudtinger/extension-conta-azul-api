//Extension for testing api conta azul
//Altere os valores de CLIENT_ID e CLIENT_SECRET com os valores do seu app do contaazul
const REDIRECT_URL = chrome.identity.getRedirectURL();
const AUTH_URL = 'https://auth.contaazul.com/login';
const TOKEN_URL = 'https://auth.contaazul.com/oauth2/token';

const logoutButton = document.getElementById('logoutButton');

document.addEventListener('DOMContentLoaded', async () => {
    const loginContaAzulButton = document.getElementById('loginContaAzul');
    const loginContainer = document.getElementById('loginContainer');
    const appContainer = document.getElementById('appContainer');
    const appFrame = document.getElementById('appFrame');
    const loadingContainer = document.getElementById('loadingContainer');
    const confirmLogoutButton = document.getElementById('confirmLogout');
    const informationModal = document.getElementById('informationModal');
    const clientIdInput = document.getElementById('clientId');
    const clientSecretInput = document.getElementById('clientSecret');
    const redirectUrlDisplay = document.getElementById('redirectUrlDisplay');
    const copyRedirectUrlButton = document.getElementById('copyRedirectUrl');

    // Display redirect URL
    redirectUrlDisplay.textContent = REDIRECT_URL;

    // Copy redirect URL functionality
    copyRedirectUrlButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(REDIRECT_URL);
            copyRedirectUrlButton.textContent = 'Copiado!';
            setTimeout(() => {
                copyRedirectUrlButton.textContent = 'Copiar';
            }, 1500);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Erro ao copiar a URL');
        }
    });

    // Save credentials when they change
    clientIdInput.addEventListener('change', async () => {
        await chrome.storage.local.set({ client_id: clientIdInput.value });
    });

    clientSecretInput.addEventListener('change', async () => {
        await chrome.storage.local.set({ client_secret: clientSecretInput.value });
    });

    // Load saved credentials if they exist
    const savedCredentials = await chrome.storage.local.get(['client_id', 'client_secret']);
    if (savedCredentials.client_id) {
        clientIdInput.value = savedCredentials.client_id;
    }
    if (savedCredentials.client_secret) {
        clientSecretInput.value = savedCredentials.client_secret;
    }

    function showLoading() {
        loadingContainer.style.display = 'flex';
        loginContainer.style.display = 'none';
        appContainer.style.display = 'none';
    }

    function hideLoading() {
        loadingContainer.style.display = 'none';
    }

    showLoading();
    try {
        hideLoading();
        const storedCode = await chrome.storage.local.get(['oauth_code']);
        if (storedCode.oauth_code) {
            try {
                await getInfoToAcess(storedCode.oauth_code);
                hideLoading();
            } catch (error) {
                hideLoading();
                showLoginButton();
            }
        } else {
            hideLoading();
            showLoginButton();
        }
    } catch (error) {
        hideLoading();
        showLoginButton();
    }

    loginContaAzulButton.addEventListener('click', async () => {
        const clientId = clientIdInput.value.trim();
        const clientSecret = clientSecretInput.value.trim();

        if (!clientId || !clientSecret) {
            alert('Por favor, preencha o Client ID e Client Secret');
            return;
        }

        try {
            // Save credentials
            await chrome.storage.local.set({
                client_id: clientId,
                client_secret: clientSecret
            });

            const authUrl = new URL(AUTH_URL);
            const params = {
                response_type: 'code',
                client_id: clientId,
                redirect_uri: REDIRECT_URL,
                state: 'HGSRDFWf45A53sdfKef422',
                scope: 'openid profile aws.cognito.signin.user.admin'
            };

            Object.keys(params).forEach(key =>
                authUrl.searchParams.append(key, params[key])
            );

            await chrome.storage.local.set({
                oauth_state: 'HGSRDFWf45A53sdfKef422',
                domain: 'contaazul'
            });
            chrome.tabs.create({ url: authUrl.toString() });
            window.close();
        } catch (error) {
            console.error('Erro in autenticação:', error);
        }
    });

    async function getInfoToAcess(code) {
        try {
            const credentials = await chrome.storage.local.get(['client_id', 'client_secret']);
            if (!credentials.client_id || !credentials.client_secret) {
                throw new Error('Client ID or Client Secret not found');
            }
            const authString = btoa(`${credentials.client_id}:${credentials.client_secret}`);
            showInformationModal(code, REDIRECT_URL, 'Basic ' + authString);
            return;
        } catch (error) {
            throw new Error(`Error to get token: ${error.message}`);
        }
    }

    async function getTokens(code, credentials, redirectUrl) {
        try {
            const response = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Authorization': credentials,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUrl
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error_description || 'Failed to get tokens');
            }

            const data = await response.json();
            return {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in
            };
        } catch (error) {
            console.error('Error getting tokens:', error);
            throw error;
        }
    }

    async function showInformationModal(code, redirectUrl, credentials) {
        informationModal.style.display = 'block';
        informationModal.classList.add('fade-in');
        const modalMessage = informationModal.querySelector('.modal-message');
        modalMessage.innerHTML = `
            <div style="text-align:left;"><strong>code:</strong> <span style="word-break:break-all">${code}</span></div>
            <div style="text-align:left;"></br><strong>redirect_uri:</strong> <span style="word-break:break-all">${redirectUrl}</span></div>
            <div style="text-align:left;"></br><strong>Authorization:</strong> <span style="word-break:break-all">${credentials}</span></div>
            <div style="margin-top:16px; text-align:left;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    <strong>Curl completa:</strong>
                    <button id="copyCurlBtn" style="padding:4px 10px;font-size:12px;border-radius:4px;border:none;background:#4285f4;color:white;cursor:pointer;">Copiar</button>
                </div>
                <pre style="background:#f5f5f5;padding:10px;border-radius:6px;overflow-x:auto;margin:0;">
<code id="curlCode">curl --request POST \\
  --url https://auth.contaazul.com/oauth2/token \\
  --header 'Authorization: ${credentials}' \\
  --header 'Content-Type: application/x-www-form-urlencoded' \\
  --data code=${code} \\
  --data grant_type=authorization_code \\
  --data redirect_uri=${redirectUrl}
</code></pre>
            </div>
            <div style="margin-top:16px; text-align:center;">
                <button id="generateTokensBtn" style="padding:8px 16px;font-size:14px;border-radius:4px;border:none;background:#2a64a7;color:white;cursor:pointer;">Gerar Tokens</button>
            </div>
        `;

        const copyBtn = document.getElementById('copyCurlBtn');
        const curlCode = document.getElementById('curlCode');
        const generateTokensBtn = document.getElementById('generateTokensBtn');

        if (copyBtn && curlCode) {
            copyBtn.addEventListener('click', () => {
                const text = curlCode.innerText;
                navigator.clipboard.writeText(text);
                copyBtn.textContent = 'Copiado!';
                setTimeout(() => copyBtn.textContent = 'Copiar', 1500);
            });
        }

        if (generateTokensBtn) {
            generateTokensBtn.addEventListener('click', async () => {
                try {
                    generateTokensBtn.disabled = true;
                    generateTokensBtn.textContent = 'Gerando...';
                    const tokens = await getTokens(code, credentials, redirectUrl);
                    modalMessage.innerHTML = `
                        <div style="text-align:left;"><strong>Access Token:</strong> <span style="word-break:break-all">${tokens.access_token}</span></div>
                        <div style="text-align:left;"></br><strong>Refresh Token:</strong> <span style="word-break:break-all">${tokens.refresh_token}</span></div>
                        <div style="text-align:left;"></br><strong>Expires In:</strong> <span style="word-break:break-all">${tokens.expires_in} seconds</span></div>
                        <div style="margin-top:16px; text-align:center;">
                            <button id="backToInfoBtn" style="padding:8px 16px;font-size:14px;border-radius:4px;border:none;background:#2a64a7;color:white;cursor:pointer;">Voltar</button>
                        </div>
                    `;

                    const backToInfoBtn = document.getElementById('backToInfoBtn');
                    if (backToInfoBtn) {
                        backToInfoBtn.addEventListener('click', () => {
                            showInformationModal(code, redirectUrl, 'Basic ' + btoa(`${credentials.client_id}:${credentials.client_secret}`));
                        });
                    }
                } catch (error) {
                    modalMessage.innerHTML = `
                        <div style="color: red; text-align: center; margin: 20px 0;">
                            Erro ao gerar tokens: ${error.message}
                        </div>
                        <div style="margin-top:16px; text-align:center;">
                            <button id="backToInfoBtn" style="padding:8px 16px;font-size:14px;border-radius:4px;border:none;background:#2a64a7;color:white;cursor:pointer;">Voltar</button>
                        </div>
                    `;
                    const backToInfoBtn = document.getElementById('backToInfoBtn');
                    if (backToInfoBtn) {
                        backToInfoBtn.addEventListener('click', () => {
                            showInformationModal(code, redirectUrl, 'Basic ' + btoa(`${credentials.client_id}:${credentials.client_secret}`));
                        });
                    }
                }
            });
        }
    }

    function hideLogoutModal() {
        informationModal.classList.remove('fade-in');
        informationModal.style.display = 'none';
    }

    informationModal.addEventListener('click', (e) => {
        if (e.target === informationModal) {
            hideLogoutModal();
        }
    });

    document.addEventListener('keydown', async (e) => {
        if (e.key === 'Escape' && informationModal.style.display === 'block') {
            hideLogoutModal();
            showLoginButton();
            await logout();
        }
    });

    async function logout() {
        try {
            await chrome.storage.local.clear();
            appFrame.src = '';
            appContainer.style.display = 'none';
            loginContainer.style.display = 'flex';
            logoutButton.style.display = 'none';
        } catch (error) {
            console.error('Error on logout:', error);
        }
    }

    function showLoginButton() {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
        logoutButton.style.display = 'none';
        appFrame.src = '';
    }

    const logoutInsideModalButton = document.getElementById('logoutInsideModal');
    if (logoutInsideModalButton) {
        logoutInsideModalButton.addEventListener('click', async () => {
            informationModal.style.display = 'none';
        });
    }

    if (confirmLogoutButton) {
        confirmLogoutButton.addEventListener('click', async () => {
            await logout();
            informationModal.style.display = 'none';
        });
    }
});