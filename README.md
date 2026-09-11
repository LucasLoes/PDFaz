# PDFaz • Gerador Rápido de Orçamentos e Recibos em PDF

O **PDFaz** é uma Single Page Application (SPA) utilitária, rápida, intuitiva e moderna, criada para microempreendedores individuais (MEI), profissionais autônomos e prestadores de serviços gerarem orçamentos comerciais e recibos de pagamento em PDF prontos para impressão ou envio por WhatsApp/E-mail.

Rodando **100% no lado do cliente (client-side)**, a aplicação não requer cadastro, login ou banco de dados externo, assegurando velocidade máxima e total privacidade dos dados financeiros e comerciais do usuário.

---

## Principais Funcionalidades

1. **Botões de Ação Dinâmicos:**
   - Ao escolher **Orçamento Comercial**, os botões passam a exibir **"Baixar Orçamento"** e **"Visualizar Orçamento"**.
   - Ao escolher **Recibo de Quitação**, os botões passam a exibir **"Baixar Recibo"** e **"Visualizar Recibo"**, eliminando qualquer confusão no momento do download.
2. **Layouts Distintos para Orçamento e Recibo:**
   - **Orçamento Comercial:** Identidade em azul corporativo (`#2563EB`), validade da proposta comercial e linhas duplas de assinatura (Aceite do Cliente e Emissor).
   - **Recibo de Quitação:** Identidade em verde esmeralda (`#059669`), selo estilizado de "PAGAMENTO CONFIRMADO", grande caixa com texto formal de quitação irrevogável, tabela com serviços liquidados e assinatura única do recebedor.
3. **Chave PIX com Botão Copiar e QR Code em Tempo Real:**
   - Campo para inserção da Chave PIX (CPF/CNPJ, celular, e-mail ou aleatória).
   - Botão **"Copiar Chave"** com 1 clique e feedback instantâneo.
   - Geração automática e em tempo real do **QR Code PIX** renderizado na tela.
   - Opção para **incluir o QR Code PIX diretamente no documento PDF gerado** para pagamento facilitado via celular.
4. **Tabela Dinâmica de Itens:**
   - Adição e remoção de serviços/produtos com 1 clique.
   - Cálculo automático e instantâneo do valor total por linha (`Quantidade × Preço Unitário`).
3. **Resumo Financeiro em Tempo Real:**
   - Subtotal calculado automaticamente.
   - Campo para Desconto monetário opcional (`R$`).
   - Total Geral em destaque com formatação brasileira de moeda (`R$ 0,00`).
4. **Geração de PDF Elegante (jsPDF + jsPDF-AutoTable):**
   - Layout profissional em folha A4 com identidade visual corporativa (faixa azul, tipografia limpa, tabela zebrada e badges).
   - Nome automático do arquivo semântico (ex: `orcamento_0042_camila_vasconcelos.pdf`).
   - Suporte a download direto e botão de pré-visualização em nova aba.
5. **Persistência Inteligente (LocalStorage):**
   - Todos os dados digitados são preservados caso a página seja recarregada ou fechada.
6. **Agilidade com Dados de Exemplo:**
   - Botão "Exemplo" para preencher instantaneamente um caso real de prestador de serviços MEI.
   - Botão "Limpar" para resetar todos os campos com segurança.
7. **Design Responsivo & Mobile-First:**
   - Adaptado para smartphones (com barra flutuante inferior fixa e botões com área de toque mínima de 44px), tablets e computadores desktop.

---

## Estrutura de Arquivos

```
c:/xampp/htdocs/aplicativo/
├── index.html       # Estrutura semântica HTML5, SEO e carregamento de CDNs
├── css/
│   └── style.css    # Design system, variáveis CSS, cards, animações e responsividade
├── js/
│   └── app.js       # Gerenciamento de estado, cálculos reativos, LocalStorage e jsPDF
└── README.md        # Documentação do projeto
```

---

## Como Executar Localmente

Como a aplicação está alocada no diretório do XAMPP (`htdocs/aplicativo`):
1. Inicie o módulo **Apache** no painel de controle do XAMPP.
2. Abra seu navegador e acesse:
   ```
   http://localhost/aplicativo/
   ```
3. A aplicação carregará imediatamente pronta para uso.

---

## Como Hospedar na Vercel com o Domínio `pdfaz.com.br`

O PDFaz é uma aplicação estática (HTML/CSS/JS), o que a torna perfeita para hospedagem gratuita com SSL automático e alta velocidade na Vercel ou Netlify.

### Passo a passo para a Vercel:
1. **Suba os arquivos para o GitHub** ou instale a CLI da Vercel no terminal:
   ```bash
   npm i -g vercel
   cd c:\xampp\htdocs\aplicativo
   vercel
   ```
2. **Configuração de Domínio Personalizado (`pdfaz.com.br`):**
   - Acesse o painel do seu projeto na Vercel: **Settings > Domains**.
   - Adicione o domínio `pdfaz.com.br` e `www.pdfaz.com.br`.
3. **Apontamento de DNS no Registro.br:**
   - No painel onde registrou `pdfaz.com.br` (ex: Registro.br), configure os seguintes registros DNS:
     - **Tipo A:** Nome `@` ou vazio -> Apontando para `76.76.21.21` (IP da Vercel).
     - **Tipo CNAME:** Nome `www` -> Apontando para `cname.vercel-dns.com`.
4. Em poucos minutos o certificado SSL gratuito (HTTPS) será emitido e seu site estará no ar globalmente.
