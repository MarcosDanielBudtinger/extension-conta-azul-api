🔹 Como testar sua extensão?
1.  Entre na pasta da extensão e instale as dependencias de desenvolviemnto com `npm install`
2.	No Chrome, vá até chrome://extensions/
3.	Ative o “Modo de desenvolvedor” (canto superior direito)
4.	Clique em “Carregar sem compactação” e selecione a pasta da extensão
5.  Agora, um ícone da extensão deve aparecer no Chrome.
6.  Clique sobre o ícone da extensão, aparecerá a redirect uri, copie ela tomando cuidado para não deixar espaços e adicione no seu app do portal do desenvolvedor.
7.  Copie os valores de CLIENT_ID e CLIENT_SECRET do seu app e informe eles no arquivo popup.js nas linhas 3 e 4
8.  Salve e clique novamente na extensão, quando solicitado login basta logar com sua conta de teste da conta azul ou outra conta desde que tenha acesso.
9.  Serão exibidos os dados necessarios para buscar um token e uma curl completa para tal.

