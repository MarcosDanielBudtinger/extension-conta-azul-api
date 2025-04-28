//Extension for testing api conta azul
//Altere os valores de CLIENT_ID e CLIENT_SECRET com os valores do seu app do contaazul
const CLIENT_ID = 'SEU_CLIENT_ID';
const CLIENT_SECRET = 'SEU_CLIENT_SECRET';
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
            alert(REDIRECT_URL);
        }
    } catch (error) {
        hideLoading();
        showLoginButton();
    }

    loginContaAzulButton.addEventListener('click', async () => {
        try {
            const authUrl = new URL(AUTH_URL);
            const params = {
                response_type: 'code',
                client_id: CLIENT_ID,
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

    function showInformationModal(code, redirectUrl, credentials) {
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
        `;

        const copyBtn = document.getElementById('copyCurlBtn');
        const curlCode = document.getElementById('curlCode');
        if (copyBtn && curlCode) {
            copyBtn.addEventListener('click', () => {
                const text = curlCode.innerText;
                navigator.clipboard.writeText(text);
                copyBtn.textContent = 'Copiado!';
                setTimeout(() => copyBtn.textContent = 'Copiar', 1500);
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

    async function getInfoToAcess(code) {
        try {
            const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
            showInformationModal(code, REDIRECT_URL, 'Basic ' + credentials);
            return;
        } catch (error) {
            throw new Error(`Error to get token: ${error.message}`);
        }
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