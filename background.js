chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url && changeInfo.url.startsWith(chrome.identity.getRedirectURL())) {
        try {
            const url = new URL(changeInfo.url);
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');

            // Verificar o state
            const savedState = await chrome.storage.local.get('oauth_state');
            if (state === savedState.oauth_state) {
                // Salvar o código
                await chrome.storage.local.set({ oauth_code: code });
                
                // Limpar o state
                await chrome.storage.local.remove('oauth_state');

                // Fechar a aba de autenticação
                chrome.tabs.remove(tabId);

                // Abrir o popup da extensão
                chrome.action.openPopup();
            }
        } catch (error) {
            console.error('Erro ao processar redirecionamento:', error);
        }
    }
}); 