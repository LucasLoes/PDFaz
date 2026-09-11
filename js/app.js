/**
 * PDFaz - Gerador Rápido de Orçamentos e Recibos em PDF
 * Aplicação 100% Client-side (SPA)
 * Desenvolvido com HTML5, CSS3 e JavaScript ES6+
 */

(function () {
  'use strict';

  // Chave do LocalStorage para persistência de dados
  const STORAGE_KEY = 'pdfaz_app_state_v2';

  // Estado Inicial da Aplicação
  const state = {
    docType: 'orcamento', // 'orcamento' ou 'recibo'
    docNumber: '001',
    docDate: new Date().toISOString().split('T')[0],
    docValidity: '',
    paymentMethod: 'PIX',
    
    // Dados do Emissor
    emitterName: '',
    emitterDoc: '',
    emitterPhone: '',
    emitterEmail: '',

    // Dados do Cliente
    clientName: '',
    clientDoc: '',
    clientAddress: '',

    // Itens
    items: [
      { id: 1, description: 'Consultoria e Desenvolvimento de Website', quantity: 1, unitPrice: 1500 }
    ],

    // Financeiro
    discount: 0,

    // Dados de PIX e Pagamento
    pixKey: '45.123.789/0001-90',
    pixBank: 'Banco Inter (Studio Digital Nexus MEI)',
    includePixQr: true,

    // Observações Gerais
    notes: 'Condições de pagamento: 50% de entrada e 50% na entrega.\nPrazo de entrega: 15 dias úteis após aprovação.'
  };

  // Elementos do DOM
  const dom = {
    btnTypeOrcamento: document.getElementById('btn-type-orcamento'),
    btnTypeRecibo: document.getElementById('btn-type-recibo'),
    orcamentoFields: document.getElementById('orcamento-specific-fields'),
    reciboFields: document.getElementById('recibo-specific-fields'),
    docTypeBadgeText: document.getElementById('doc-type-badge-text'),
    docDateLabel: document.getElementById('doc-date-label'),

    // Inputs do cabeçalho
    docNumber: document.getElementById('doc-number'),
    docDate: document.getElementById('doc-date'),
    docValidity: document.getElementById('doc-validity'),
    paymentMethod: document.getElementById('payment-method'),

    // Declaração de Quitação no Recibo
    reciboDeclarationBox: document.getElementById('recibo-declaration-box'),
    reciboDeclarationText: document.getElementById('recibo-declaration-text'),

    // Emissor
    emitterName: document.getElementById('emitter-name'),
    emitterDoc: document.getElementById('emitter-doc'),
    emitterPhone: document.getElementById('emitter-phone'),
    emitterEmail: document.getElementById('emitter-email'),

    // Cliente
    clientName: document.getElementById('client-name'),
    clientDoc: document.getElementById('client-doc'),
    clientAddress: document.getElementById('client-address'),

    // Lista de Itens
    itemsList: document.getElementById('items-list'),
    btnAddItem: document.getElementById('btn-add-item'),

    // Totais
    subtotalDisplay: document.getElementById('subtotal-display'),
    inputDiscount: document.getElementById('input-discount'),
    totalDisplay: document.getElementById('total-display'),
    mobileTotalDisplay: document.getElementById('mobile-total-display'),

    // PIX & QR Code
    pixKeyInput: document.getElementById('pix-key-input'),
    pixBankInput: document.getElementById('pix-bank-input'),
    btnCopyPix: document.getElementById('btn-copy-pix'),
    copyPixText: document.getElementById('copy-pix-text'),
    btnCopyPixPayload: document.getElementById('btn-copy-pix-payload'),
    copyPixPayloadText: document.getElementById('copy-pix-payload-text'),
    pixQrcodeDisplay: document.getElementById('pix-qrcode-display'),
    includePixQrCheckbox: document.getElementById('include-pix-qr-checkbox'),

    // Seção de Doação & Apoio PIX
    donationQrcodeDisplay: document.getElementById('donation-qrcode-display'),
    btnCopyDonationPix: document.getElementById('btn-copy-donation-pix'),
    copyDonationText: document.getElementById('copy-donation-text'),
    btnCopyDonationPayload: document.getElementById('btn-copy-donation-payload'),
    copyDonationPayloadText: document.getElementById('copy-donation-payload-text'),

    // Observações
    notes: document.getElementById('notes-input'),

    // Botões de Ação
    btnGeneratePdf: document.getElementById('btn-generate-pdf'),
    btnGenerateText: document.getElementById('btn-generate-text'),
    btnGeneratePdfMobile: document.getElementById('btn-generate-pdf-mobile'),
    btnGenerateMobileText: document.getElementById('btn-generate-mobile-text'),
    btnPreviewPdf: document.getElementById('btn-preview-pdf'),
    btnPreviewText: document.getElementById('btn-preview-text'),
    btnLoadExample: document.getElementById('btn-load-example'),
    btnClearForm: document.getElementById('btn-clear-form'),
    btnInstallPwa: document.getElementById('btn-install-pwa'),

    // Container de Toasts
    toastContainer: document.getElementById('toast-container'),

    // Pesquisa de Satisfação & Feedback
    surveyBackdrop: document.getElementById('survey-backdrop'),
    surveyCard: document.getElementById('survey-card'),
    surveyForm: document.getElementById('survey-form'),
    surveyBtnClose: document.getElementById('survey-btn-close'),
    surveyBtnLater: document.getElementById('survey-btn-later'),
    surveyBtnSubmit: document.getElementById('survey-btn-submit'),
    surveySubmitText: document.getElementById('survey-submit-text'),
    surveyStarsGroup: document.getElementById('survey-stars-group'),
    surveyRatingText: document.getElementById('survey-rating-text'),
    surveyRecommendGroup: document.getElementById('survey-recommend-group'),
    surveyFeatureSuggestion: document.getElementById('survey-feature-suggestion'),
    surveySuccessCard: document.getElementById('survey-success-card'),
    surveyBtnCloseSuccess: document.getElementById('survey-btn-close-success'),
    btnOpenSurvey: document.getElementById('btn-open-survey')
  };

  // Instâncias do gerador QRCode.js
  let qrCodeInstance = null;
  let donationQrCodeInstance = null;

  // Configuração do PIX de Doação
  const DONATION_CONFIG = {
    pixKey: 'lucasladeiraloes@gmail.com',
    name: 'Lucas Ladeira Loes',
    city: 'BRASIL',
    description: 'Apoio PDFaz'
  };

  // =========================================================================
  // Utilitários de Formatação e Feedback
  // =========================================================================

  /**
   * Formata número para moeda Real Brasileira (R$ 0,00)
   */
  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /**
   * Formata data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/AAAA)
   */
  function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  /**
   * Exibe notificação flutuante (Toast)
   */
  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Ícone correspondente
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'danger') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // Gerenciamento de Itens e Cálculos
  // =========================================================================

  /**
   * Recalcula Subtotal, Desconto e Total Geral
   */
  function calculateTotals() {
    let subtotal = 0;

    state.items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const itemTotal = qty * price;
      subtotal += itemTotal;
    });

    const discountVal = parseFloat(state.discount) || 0;
    const total = Math.max(0, subtotal - discountVal);

    // Atualiza exibições
    if (dom.subtotalDisplay) dom.subtotalDisplay.textContent = formatCurrency(subtotal);
    if (dom.totalDisplay) dom.totalDisplay.textContent = formatCurrency(total);
    if (dom.mobileTotalDisplay) dom.mobileTotalDisplay.textContent = formatCurrency(total);

    // Atualiza texto da declaração se o modo recibo estiver ativo
    updateReciboDeclaration(total);

    return { subtotal, discount: discountVal, total };
  }

  /**
   * Atualiza a caixa de declaração formal no modo Recibo
   */
  function updateReciboDeclaration(totalValue) {
    if (!dom.reciboDeclarationText) return;

    const currentTotal = totalValue !== undefined ? totalValue : calculateTotals().total;
    const client = state.clientName.trim() || '[Nome do Cliente]';
    const clientDoc = state.clientDoc.trim() ? `, CPF/CNPJ ${state.clientDoc.trim()},` : '';
    const payment = state.paymentMethod || 'PIX';

    dom.reciboDeclarationText.innerHTML = `
      Declaramos para os devidos fins que recebemos de <strong>${escapeHtml(client)}</strong>${escapeHtml(clientDoc)} a importância de <strong>${formatCurrency(currentTotal)}</strong>, paga via <strong>${escapeHtml(payment)}</strong>, referente aos serviços/produtos descritos abaixo, conferindo-lhe plena e irrevogável quitação.
    `;
  }

  /**
   * Renderiza a lista de itens no DOM
   */
  function renderItems() {
    if (!dom.itemsList) return;
    dom.itemsList.innerHTML = '';

    state.items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.dataset.id = item.id;

      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const totalItem = qty * price;

      row.innerHTML = `
        <!-- Descrição -->
        <div class="form-group" style="margin-bottom: 0;">
          <span class="mobile-label">Descrição do Item #${index + 1}</span>
          <input 
            type="text" 
            class="form-input item-desc-input" 
            placeholder="Ex: Consultoria, Website, Manutenção..." 
            value="${escapeHtml(item.description)}"
            data-field="description"
          />
        </div>

        <!-- Mobile Grid / Desktop Direct Columns -->
        <div class="item-row-grid-mobile">
          <!-- Quantidade -->
          <div class="form-group" style="margin-bottom: 0;">
            <span class="mobile-label">Qtd</span>
            <input 
              type="number" 
              class="form-input item-qty-input" 
              min="1" 
              step="1" 
              value="${item.quantity}"
              data-field="quantity"
            />
          </div>

          <!-- Preço Unitário -->
          <div class="form-group" style="margin-bottom: 0;">
            <span class="mobile-label">Valor Unit. (R$)</span>
            <input 
              type="number" 
              class="form-input item-price-input" 
              min="0" 
              step="0.01" 
              placeholder="0,00"
              value="${item.unitPrice !== undefined ? item.unitPrice : ''}"
              data-field="unitPrice"
            />
          </div>

          <!-- Total do Item -->
          <div class="item-total-display">
            <span class="mobile-label">Total</span>
            <span class="item-row-total">${formatCurrency(totalItem)}</span>
          </div>

          <!-- Botão Excluir -->
          <button 
            type="button" 
            class="btn-delete-item" 
            title="Excluir Item" 
            aria-label="Excluir item ${index + 1}"
            ${state.items.length <= 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;

      // Event Listeners dos inputs do item
      const descInput = row.querySelector('.item-desc-input');
      const qtyInput = row.querySelector('.item-qty-input');
      const priceInput = row.querySelector('.item-price-input');
      const deleteBtn = row.querySelector('.btn-delete-item');
      const itemRowTotal = row.querySelector('.item-row-total');

      const updateRow = () => {
        item.description = descInput.value;
        item.quantity = parseFloat(qtyInput.value) || 0;
        item.unitPrice = parseFloat(priceInput.value) || 0;
        itemRowTotal.textContent = formatCurrency(item.quantity * item.unitPrice);
        calculateTotals();
        updatePixQrCode();
        saveToLocalStorage();
      };

      descInput.addEventListener('input', updateRow);
      qtyInput.addEventListener('input', updateRow);
      priceInput.addEventListener('input', updateRow);

      deleteBtn.addEventListener('click', () => {
        if (state.items.length > 1) {
          state.items = state.items.filter(i => i.id !== item.id);
          renderItems();
          calculateTotals();
          updatePixQrCode();
          saveToLocalStorage();
          showToast('Item removido.', 'info');
        }
      });

      dom.itemsList.appendChild(row);
    });

    calculateTotals();
  }

  /**
   * Adiciona um novo item à lista
   */
  function addNewItem() {
    const newId = state.items.length > 0 ? Math.max(...state.items.map(i => i.id)) + 1 : 1;
    state.items.push({
      id: newId,
      description: '',
      quantity: 1,
      unitPrice: 0
    });
    renderItems();
    saveToLocalStorage();

    // Foco no campo do novo item
    setTimeout(() => {
      const lastRow = dom.itemsList.lastElementChild;
      if (lastRow) {
        const input = lastRow.querySelector('.item-desc-input');
        if (input) input.focus();
      }
    }, 50);

    showToast('Novo item adicionado.', 'info');
  }

  /**
   * Escapa caracteres HTML para segurança
   */
  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // =========================================================================
  // Gestão de PIX & Geração de QR Code (Padrão Oficial Banco Central / BR Code)
  // =========================================================================

  /**
   * Remove acentos e caracteres especiais para conformidade com a especificação EMVCo / BACEN
   */
  function cleanPixString(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim();
  }

  /**
   * Sanitiza a chave PIX para o padrão exigido pelo DICT / BACEN
   * - CPF: 11 dígitos numéricos
   * - CNPJ: 14 dígitos numéricos
   * - E-mail: minúsculo e sem espaços
   * - Telefone: formato internacional com +55 (ex: +5531999998888)
   * - EVP / Aleatória: formato UUID minúsculo
   */
  function sanitizePixKey(key) {
    if (!key) return '';
    const trimmed = String(key).trim();

    // E-mail (contém @)
    if (trimmed.includes('@')) {
      return trimmed.toLowerCase();
    }

    // Telefone que já começa com '+'
    if (trimmed.startsWith('+')) {
      return '+' + trimmed.replace(/\D/g, '');
    }

    // Telefone formatado com parênteses (ex: (31) 98765-4321)
    if (/\(\d{2}\)/.test(trimmed)) {
      return '+55' + trimmed.replace(/\D/g, '');
    }

    const digits = trimmed.replace(/\D/g, '');

    // CNPJ (14 dígitos)
    if (digits.length === 14) {
      return digits;
    }

    // CPF formatado com pontos (ex: 123.456.789-00)
    if (/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(trimmed)) {
      return digits;
    }

    // 11 dígitos: verifica se foi digitado como celular com hífen (ex: 31 98765-4321)
    if (digits.length === 11) {
      if (!trimmed.includes('.') && trimmed.includes('-')) {
        return '+55' + digits;
      }
      return digits; // CPF não formatado
    }

    // 10 dígitos (telefone fixo com DDD)
    if (digits.length === 10) {
      return '+55' + digits;
    }

    // 12 ou 13 dígitos começando com 55 (DDI do Brasil)
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
      return '+' + digits;
    }

    // Chave Aleatória EVP (UUID: 8-4-4-4-12)
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
    if (isUuid) {
      return trimmed.toLowerCase();
    }

    return trimmed;
  }

  /**
   * Formata um elemento TLV (Tag-Length-Value) do padrão EMV
   */
  function formatEMV(id, value) {
    const strVal = String(value || '');
    const len = strVal.length.toString().padStart(2, '0');
    return id + len + strVal;
  }

  /**
   * Calcula o checksum CRC16-CCITT (0xFFFF) no padrão oficial Pix BR Code
   */
  function calculateCRC16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= (str.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Gera a string completa de payload PIX (BR Code / Copia e Cola)
   * segundo as normas do Banco Central do Brasil.
   */
  function generatePixPayload({ key, name, city, amount, txid, description }) {
    const cleanKey = sanitizePixKey(key);
    if (!cleanKey) return '';

    // Tag 00: Payload Format Indicator ("01")
    const tag00 = formatEMV('00', '01');

    // Tag 26: Merchant Account Information
    const gui = formatEMV('00', 'br.gov.bcb.pix');
    const keyTag = formatEMV('01', cleanKey);
    let descTag = '';
    if (description) {
      const cleanDesc = cleanPixString(description).substring(0, 25);
      if (cleanDesc) descTag = formatEMV('02', cleanDesc);
    }
    const mai = formatEMV('26', gui + keyTag + descTag);

    // Tag 52: Merchant Category Code ("0000")
    const tag52 = formatEMV('52', '0000');

    // Tag 53: Transaction Currency ("986" = BRL)
    const tag53 = formatEMV('53', '986');

    // Tag 54: Transaction Amount (opcional, incluído se > 0)
    let tag54 = '';
    const numAmount = parseFloat(amount) || 0;
    if (numAmount > 0) {
      tag54 = formatEMV('54', numAmount.toFixed(2));
    }

    // Tag 58: Country Code ("BR")
    const tag58 = formatEMV('58', 'BR');

    // Tag 59: Merchant Name (máximo 25 caracteres, sem acentos)
    let merchantName = cleanPixString(name).substring(0, 25);
    if (!merchantName) merchantName = 'RECEBEDOR';
    const tag59 = formatEMV('59', merchantName);

    // Tag 60: Merchant City (máximo 15 caracteres, sem acentos)
    let merchantCity = cleanPixString(city).substring(0, 15);
    if (!merchantCity) merchantCity = 'BRASIL';
    const tag60 = formatEMV('60', merchantCity);

    // Tag 62: Additional Data Field (txid)
    // Para PIX estático sem conciliação bancária dinâmica, BACEN estipula '***'
    const cleanTxid = cleanPixString(txid).substring(0, 25) || '***';
    const txidTag = formatEMV('05', cleanTxid);
    const tag62 = formatEMV('62', txidTag);

    // Tag 63: CRC16
    const payloadNoCrc = tag00 + mai + tag52 + tag53 + tag54 + tag58 + tag59 + tag60 + tag62 + '6304';
    const crc = calculateCRC16(payloadNoCrc);
    return payloadNoCrc + crc;
  }

  /**
   * Obtém o payload BR Code do formulário atual com o valor total calculado
   */
  function getCurrentDocumentPixPayload() {
    const rawKey = (state.pixKey || '').trim();
    if (!rawKey) return '';
    const totals = calculateTotals();
    return generatePixPayload({
      key: rawKey,
      name: state.emitterName || 'RECEBEDOR',
      city: 'BRASIL',
      amount: totals.total,
      txid: state.docNumber ? cleanPixString(state.docNumber).replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) : '***'
    });
  }

  /**
   * Obtém o payload BR Code para a doação (valor aberto para o doador definir)
   */
  function getDonationPixPayload() {
    return generatePixPayload({
      key: DONATION_CONFIG.pixKey,
      name: DONATION_CONFIG.name,
      city: DONATION_CONFIG.city,
      description: DONATION_CONFIG.description,
      amount: null,
      txid: '***'
    });
  }

  /**
   * Gera / Atualiza o QR Code visual da Chave PIX do documento
   */
  function updatePixQrCode() {
    if (!dom.pixQrcodeDisplay) return;

    const rawKey = (state.pixKey || '').trim();
    dom.pixQrcodeDisplay.innerHTML = '';

    if (!rawKey) {
      dom.pixQrcodeDisplay.innerHTML = '<span style="font-size:0.75rem; color:#94A3B8;">Digite a Chave PIX</span>';
      return;
    }

    const payload = getCurrentDocumentPixPayload();
    if (!payload) {
      dom.pixQrcodeDisplay.innerHTML = '<span style="font-size:0.75rem; color:#EF4444;">Chave inválida</span>';
      return;
    }

    try {
      if (typeof QRCode !== 'undefined') {
        qrCodeInstance = new QRCode(dom.pixQrcodeDisplay, {
          text: payload,
          width: 120,
          height: 120,
          colorDark: '#0F172A',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    } catch (e) {
      console.warn('Erro ao gerar QR Code:', e);
    }
  }

  /**
   * Renderiza o QR Code na seção de Doação & Apoio PIX
   */
  function updateDonationPixQrCode() {
    if (!dom.donationQrcodeDisplay) return;

    const payload = getDonationPixPayload();
    dom.donationQrcodeDisplay.innerHTML = '';

    try {
      if (typeof QRCode !== 'undefined') {
        donationQrCodeInstance = new QRCode(dom.donationQrcodeDisplay, {
          text: payload,
          width: 130,
          height: 130,
          colorDark: '#0F172A',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    } catch (e) {
      console.warn('Erro ao gerar QR Code de doação:', e);
    }
  }

  /**
   * Utilitário genérico para cópia para a área de transferência com fallback
   */
  function copyTextToClipboard(text, successCallback, errorCallback) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { if (successCallback) successCallback(); })
        .catch(() => { fallbackCopyTextInternal(text, successCallback, errorCallback); });
    } else {
      fallbackCopyTextInternal(text, successCallback, errorCallback);
    }
  }

  function fallbackCopyTextInternal(text, successCallback, errorCallback) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (successCallback) successCallback();
    } catch (err) {
      if (errorCallback) errorCallback();
      else showToast('Não foi possível copiar automaticamente.', 'danger');
    }
    document.body.removeChild(textArea);
  }

  /**
   * Copia a chave PIX informada no formulário
   */
  function copyPixKeyToClipboard() {
    const key = (state.pixKey || '').trim();
    if (!key) {
      showToast('Por favor, informe a Chave PIX antes de copiar.', 'danger');
      return;
    }

    copyTextToClipboard(key, () => {
      showToast(`Chave PIX "${key}" copiada!`, 'success');
      if (dom.btnCopyPix) {
        dom.btnCopyPix.classList.add('copied');
        if (dom.copyPixText) dom.copyPixText.textContent = 'Copiado! ✓';
        setTimeout(() => {
          dom.btnCopyPix.classList.remove('copied');
          if (dom.copyPixText) dom.copyPixText.textContent = 'Copiar Chave';
        }, 2000);
      }
    });
  }

  /**
   * Copia o código PIX Copia e Cola completo do formulário (com valor)
   */
  function copyPixPayloadToClipboard() {
    const payload = getCurrentDocumentPixPayload();
    if (!payload) {
      showToast('Preencha a chave PIX para gerar o código Copia e Cola.', 'danger');
      return;
    }

    copyTextToClipboard(payload, () => {
      showToast('Código PIX Copia e Cola (com valor) copiado com sucesso!', 'success');
      if (dom.btnCopyPixPayload) {
        dom.btnCopyPixPayload.classList.add('copied');
        if (dom.copyPixPayloadText) dom.copyPixPayloadText.textContent = 'Código PIX Copiado com Sucesso! ✓';
        const subText = document.getElementById('copy-pix-payload-sub');
        if (subText) subText.textContent = 'Código oficial copiado! Pronto para colar no app do banco ou enviar no WhatsApp';
        setTimeout(() => {
          dom.btnCopyPixPayload.classList.remove('copied');
          if (dom.copyPixPayloadText) dom.copyPixPayloadText.textContent = 'Copiar PIX Copia e Cola (com valor)';
          if (subText) subText.textContent = 'Gera o código oficial com o valor total pronto para o cliente colar no app do banco';
        }, 2500);
      }
    });
  }

  /**
   * Copia a chave de e-mail da seção de doação
   */
  function copyDonationPixToClipboard() {
    const email = DONATION_CONFIG.pixKey;
    copyTextToClipboard(email, () => {
      showToast(`Chave PIX de apoio "${email}" copiada!`, 'success');
      if (dom.btnCopyDonationPix) {
        dom.btnCopyDonationPix.classList.add('copied');
        if (dom.copyDonationText) dom.copyDonationText.textContent = 'Copiado! ✓';
        setTimeout(() => {
          dom.btnCopyDonationPix.classList.remove('copied');
          if (dom.copyDonationText) dom.copyDonationText.textContent = 'Copiar Chave PIX';
        }, 2000);
      }
    });
  }

  /**
   * Copia o código PIX Copia e Cola da seção de doação
   */
  function copyDonationPayloadToClipboard() {
    const payload = getDonationPixPayload();
    copyTextToClipboard(payload, () => {
      showToast('Código PIX Copia e Cola de doação copiado! Muito obrigado pelo apoio.', 'success');
      if (dom.btnCopyDonationPayload) {
        dom.btnCopyDonationPayload.classList.add('copied');
        if (dom.copyDonationPayloadText) dom.copyDonationPayloadText.textContent = 'Copiado! ✓';
        setTimeout(() => {
          dom.btnCopyDonationPayload.classList.remove('copied');
          if (dom.copyDonationPayloadText) dom.copyDonationPayloadText.textContent = 'Copiar PIX Copia e Cola';
        }, 2000);
      }
    });
  }

  /**
   * Gera um QR Code em elemento temporário com alta resolução (200x200) para inclusão no PDF
   */
  function generateQrCodeDataUrl(text, size = 200) {
    if (typeof QRCode === 'undefined' || !text) return null;
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = size + 'px';
    tempDiv.style.height = size + 'px';
    document.body.appendChild(tempDiv);
    try {
      new QRCode(tempDiv, {
        text: text,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M
      });
      const canvas = tempDiv.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        document.body.removeChild(tempDiv);
        return dataUrl;
      }
      const img = tempDiv.querySelector('img');
      if (img && img.src && img.src.startsWith('data:image')) {
        const dataUrl = img.src;
        document.body.removeChild(tempDiv);
        return dataUrl;
      }
    } catch (e) {
      console.warn('Erro ao gerar imagem do QR Code:', e);
    }
    if (tempDiv.parentNode) {
      document.body.removeChild(tempDiv);
    }
    return getQrCodeDataUrl();
  }

  /**
   * Obtém a imagem base64 do QR Code gerado atualmente na tela
   */
  function getQrCodeDataUrl() {
    if (!dom.pixQrcodeDisplay) return null;
    const canvas = dom.pixQrcodeDisplay.querySelector('canvas');
    if (canvas) {
      try {
        return canvas.toDataURL('image/png');
      } catch (e) {
        return null;
      }
    }
    const img = dom.pixQrcodeDisplay.querySelector('img');
    if (img && img.src && img.src.startsWith('data:image')) {
      return img.src;
    }
    return null;
  }

  // =========================================================================
  // Atualização Dinâmica dos Botões de Ação
  // =========================================================================

  /**
   * Atualiza com 100% de confiabilidade os textos dos botões de download e visualização
   */
  function setActionButtonsText(docType) {
    const isRecibo = docType === 'recibo';
    const downloadLabel = isRecibo ? 'Baixar Recibo' : 'Baixar Orçamento';
    const previewLabel = isRecibo ? 'Visualizar Recibo' : 'Visualizar Orçamento';

    // 1. Botão Desktop de Download
    const btnGenDesktop = document.getElementById('btn-generate-pdf');
    if (btnGenDesktop) {
      let span = document.getElementById('btn-generate-text') || btnGenDesktop.querySelector('span');
      if (span) {
        span.textContent = downloadLabel;
      } else {
        btnGenDesktop.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span id="btn-generate-text">${downloadLabel}</span>
        `;
      }
    }

    // 2. Botão Mobile de Download (Barra Flutuante)
    const btnGenMobile = document.getElementById('btn-generate-pdf-mobile');
    if (btnGenMobile) {
      let spanMob = document.getElementById('btn-generate-mobile-text') || btnGenMobile.querySelector('span');
      if (spanMob) {
        spanMob.textContent = downloadLabel;
      } else {
        btnGenMobile.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span id="btn-generate-mobile-text">${downloadLabel}</span>
        `;
      }
    }

    // 3. Botão de Visualização Desktop
    const btnPrev = document.getElementById('btn-preview-pdf');
    if (btnPrev) {
      let spanPrev = document.getElementById('btn-preview-text') || btnPrev.querySelector('span');
      if (spanPrev) {
        spanPrev.textContent = previewLabel;
      } else {
        btnPrev.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span id="btn-preview-text">${previewLabel}</span>
        `;
      }
    }
  }

  // =========================================================================
  // Alternância de Tipo de Documento (Orçamento vs Recibo)
  // =========================================================================

  function setDocType(type) {
    state.docType = type;

    // Atualiza imediatamente os textos de todos os botões de ação
    setActionButtonsText(type);

    const btnTypeOrc = document.getElementById('btn-type-orcamento');
    const btnTypeRec = document.getElementById('btn-type-recibo');
    const orcFields = document.getElementById('orcamento-specific-fields');
    const recFields = document.getElementById('recibo-specific-fields');
    const recDeclBox = document.getElementById('recibo-declaration-box');
    const badgeText = document.getElementById('doc-type-badge-text');
    const dateLabel = document.getElementById('doc-date-label');

    if (type === 'orcamento') {
      if (btnTypeOrc) btnTypeOrc.classList.add('active');
      if (btnTypeRec) btnTypeRec.classList.remove('active');

      if (orcFields) orcFields.style.display = 'block';
      if (recFields) recFields.style.display = 'none';
      if (recDeclBox) recDeclBox.style.display = 'none';

      if (badgeText) badgeText.textContent = 'Orçamento Comercial';
      if (dateLabel) dateLabel.textContent = 'Data de Emissão';

      document.body.classList.remove('mode-recibo');

      // Ao alternar para Orçamento Comercial, marca automaticamente a inclusão do QR Code PIX
      if (dom.includePixQrCheckbox) {
        dom.includePixQrCheckbox.checked = true;
        state.includePixQr = true;
      }
    } else {
      if (btnTypeRec) btnTypeRec.classList.add('active');
      if (btnTypeOrc) btnTypeOrc.classList.remove('active');

      if (orcFields) orcFields.style.display = 'none';
      if (recFields) recFields.style.display = 'block';
      if (recDeclBox) recDeclBox.style.display = 'block';

      if (badgeText) badgeText.textContent = 'Recibo de Quitação • PAGO';
      if (dateLabel) dateLabel.textContent = 'Data do Pagamento';

      document.body.classList.add('mode-recibo');
      updateReciboDeclaration();

      // Ao alternar para Recibo de Quitação, desmarca automaticamente a inclusão do QR Code PIX
      if (dom.includePixQrCheckbox) {
        dom.includePixQrCheckbox.checked = false;
        state.includePixQr = false;
      }
    }

    saveToLocalStorage();
  }

  // =========================================================================
  // Persistência com LocalStorage
  // =========================================================================

  function saveToLocalStorage() {
    try {
      state.docNumber = dom.docNumber.value;
      state.docDate = dom.docDate.value;
      state.docValidity = dom.docValidity ? dom.docValidity.value : '';
      state.paymentMethod = dom.paymentMethod ? dom.paymentMethod.value : 'PIX';

      state.emitterName = dom.emitterName.value;
      state.emitterDoc = dom.emitterDoc.value;
      state.emitterPhone = dom.emitterPhone.value;
      state.emitterEmail = dom.emitterEmail.value;

      state.clientName = dom.clientName.value;
      state.clientDoc = dom.clientDoc.value;
      state.clientAddress = dom.clientAddress.value;

      state.discount = parseFloat(dom.inputDiscount.value) || 0;

      // Dados do PIX
      if (dom.pixKeyInput) state.pixKey = dom.pixKeyInput.value;
      if (dom.pixBankInput) state.pixBank = dom.pixBankInput.value;
      if (dom.includePixQrCheckbox) state.includePixQr = dom.includePixQrCheckbox.checked;

      state.notes = dom.notes.value;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Não foi possível salvar no localStorage:', e);
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);

      // Preenche os inputs com os dados recuperados
      if (dom.docNumber) dom.docNumber.value = state.docNumber || '';
      if (dom.docDate) dom.docDate.value = state.docDate || new Date().toISOString().split('T')[0];
      if (dom.docValidity) dom.docValidity.value = state.docValidity || '';
      if (dom.paymentMethod) dom.paymentMethod.value = state.paymentMethod || 'PIX';

      if (dom.emitterName) dom.emitterName.value = state.emitterName || '';
      if (dom.emitterDoc) dom.emitterDoc.value = state.emitterDoc || '';
      if (dom.emitterPhone) dom.emitterPhone.value = state.emitterPhone || '';
      if (dom.emitterEmail) dom.emitterEmail.value = state.emitterEmail || '';

      if (dom.clientName) dom.clientName.value = state.clientName || '';
      if (dom.clientDoc) dom.clientDoc.value = state.clientDoc || '';
      if (dom.clientAddress) dom.clientAddress.value = state.clientAddress || '';

      if (dom.inputDiscount) dom.inputDiscount.value = state.discount > 0 ? state.discount : '';
      if (dom.notes) dom.notes.value = state.notes || '';

      if (dom.pixKeyInput) dom.pixKeyInput.value = state.pixKey || '';
      if (dom.pixBankInput) dom.pixBankInput.value = state.pixBank || '';
      if (dom.includePixQrCheckbox) dom.includePixQrCheckbox.checked = state.includePixQr !== false;

      setDocType(state.docType || 'orcamento');
      renderItems();
      updatePixQrCode();
      return true;
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
      return false;
    }
  }

  // =========================================================================
  // Dados de Exemplo e Limpeza
  // =========================================================================

  function loadExampleData() {
    const today = new Date();
    const validityDate = new Date();
    validityDate.setDate(today.getDate() + 15);

    state.docType = 'orcamento';
    state.docNumber = '2026-0042';
    state.docDate = today.toISOString().split('T')[0];
    state.docValidity = validityDate.toISOString().split('T')[0];
    state.paymentMethod = 'PIX';

    state.emitterName = 'Studio Digital Nexus MEI';
    state.emitterDoc = '45.123.789/0001-90';
    state.emitterPhone = '(11) 98765-4321';
    state.emitterEmail = 'contato@studionexus.com.br';

    state.clientName = 'Dra. Camila Vasconcelos Consultoria';
    state.clientDoc = '312.654.987-00';
    state.clientAddress = 'Av. Paulista, 1000, Cj. 42 - Bela Vista, São Paulo - SP';

    state.items = [
      { id: 1, description: 'Desenvolvimento de Website Responsivo & Otimizado', quantity: 1, unitPrice: 2200 },
      { id: 2, description: 'Criação de Identidade Visual e Manual de Marca', quantity: 1, unitPrice: 850 },
      { id: 3, description: 'Hospedagem de Alta Performance e Domínio (1 ano)', quantity: 1, unitPrice: 350 }
    ];

    state.discount = 200;
    state.pixKey = '45.123.789/0001-90';
    state.pixBank = 'Banco Inter (Studio Digital Nexus MEI)';
    state.includePixQr = true;
    state.notes = 'Condições: 50% de entrada e 50% na entrega.\nPrazo de execução: 15 dias úteis a contar do pagamento da entrada.\nGarantia de 90 dias após entrega final.';

    // Atualiza DOM
    dom.docNumber.value = state.docNumber;
    dom.docDate.value = state.docDate;
    dom.docValidity.value = state.docValidity;
    dom.paymentMethod.value = state.paymentMethod;

    dom.emitterName.value = state.emitterName;
    dom.emitterDoc.value = state.emitterDoc;
    dom.emitterPhone.value = state.emitterPhone;
    dom.emitterEmail.value = state.emitterEmail;

    dom.clientName.value = state.clientName;
    dom.clientDoc.value = state.clientDoc;
    dom.clientAddress.value = state.clientAddress;

    dom.inputDiscount.value = state.discount;
    dom.notes.value = state.notes;

    if (dom.pixKeyInput) dom.pixKeyInput.value = state.pixKey;
    if (dom.pixBankInput) dom.pixBankInput.value = state.pixBank;
    if (dom.includePixQrCheckbox) dom.includePixQrCheckbox.checked = true;

    setDocType('orcamento');
    renderItems();
    updatePixQrCode();
    saveToLocalStorage();

    showToast('Modelo de exemplo preenchido com sucesso!', 'success');
  }

  function clearForm() {
    if (!confirm('Deseja realmente limpar todos os campos do formulário?')) return;

    state.docNumber = '001';
    state.docDate = new Date().toISOString().split('T')[0];
    state.docValidity = '';
    state.paymentMethod = 'PIX';

    state.emitterName = '';
    state.emitterDoc = '';
    state.emitterPhone = '';
    state.emitterEmail = '';

    state.clientName = '';
    state.clientDoc = '';
    state.clientAddress = '';

    state.items = [
      { id: 1, description: '', quantity: 1, unitPrice: 0 }
    ];

    state.discount = 0;
    state.pixKey = '';
    state.pixBank = '';
    state.notes = '';

    // Atualiza DOM
    dom.docNumber.value = state.docNumber;
    dom.docDate.value = state.docDate;
    if (dom.docValidity) dom.docValidity.value = '';
    if (dom.paymentMethod) dom.paymentMethod.value = 'PIX';

    dom.emitterName.value = '';
    dom.emitterDoc.value = '';
    dom.emitterPhone.value = '';
    dom.emitterEmail.value = '';

    dom.clientName.value = '';
    dom.clientDoc.value = '';
    dom.clientAddress.value = '';

    dom.inputDiscount.value = '';
    dom.notes.value = '';

    if (dom.pixKeyInput) dom.pixKeyInput.value = '';
    if (dom.pixBankInput) dom.pixBankInput.value = '';

    renderItems();
    updatePixQrCode();
    saveToLocalStorage();

    showToast('Formulário limpo.', 'info');
  }

  // =========================================================================
  // Geração do Documento PDF (jsPDF + jsPDF-AutoTable)
  // Layouts distintos para Orçamento e Recibo
  // =========================================================================

  /**
   * Constrói o objeto jsPDF com layout customizado e diferenciado
   */
  function buildPdfDocument() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('A biblioteca jsPDF não foi carregada corretamente.');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const isOrcamento = state.docType === 'orcamento';
    const docNum = state.docNumber ? `#${state.docNumber.trim()}` : '#001';
    const dateFormatted = formatDateBR(state.docDate) || formatDateBR(new Date().toISOString().split('T')[0]);
    const validityFormatted = state.docValidity ? formatDateBR(state.docValidity) : '15 dias';

    // Dimensões A4 e Margens
    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 14;
    const contentWidth = pageWidth - (marginX * 2); // 182mm
    let currentY = 0;

    // Totais calculados
    const totals = calculateTotals();

    // QR Code PIX (se disponível e habilitado) gerado no padrão BR Code oficial com valor total
    let qrDataUrl = null;
    if (state.includePixQr && state.pixKey) {
      const pixPayload = getCurrentDocumentPixPayload();
      if (pixPayload) {
        qrDataUrl = generateQrCodeDataUrl(pixPayload, 220);
      }
    }

    // =======================================================================
    // LAYOUT 1: ORÇAMENTO COMERCIAL (Tema Azul Corporativo)
    // =======================================================================
    if (isOrcamento) {
      // 1. Barra Superior Azul
      doc.setFillColor(37, 99, 235); // #2563EB
      doc.rect(0, 0, pageWidth, 5, 'F');
      currentY = 16;

      // 2. Cabeçalho Principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);

      const headerBrandText = state.emitterName ? state.emitterName.toUpperCase() : 'PDFaz';
      doc.text(headerBrandText, marginX, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Proposta Comercial & Orçamento de Prestação de Serviços', marginX, currentY + 5);

      // Badge: ORÇAMENTO COMERCIAL
      const badgeWidth = 48;
      const badgeHeight = 8;
      const badgeX = pageWidth - marginX - badgeWidth;
      const badgeY = currentY - 6;

      doc.setFillColor(37, 99, 235);
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text('ORÇAMENTO', badgeX + (badgeWidth / 2), badgeY + 5.5, { align: 'center' });

      // Detalhes da Proposta
      currentY += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      doc.text(`Orçamento Nº: ${docNum}`, pageWidth - marginX, currentY, { align: 'right' });
      doc.text(`Data de Emissão: ${dateFormatted}`, pageWidth - marginX, currentY + 4.5, { align: 'right' });
      doc.text(`Validade da Proposta: ${validityFormatted}`, pageWidth - marginX, currentY + 9, { align: 'right' });

      currentY += 14;

      // Divisor
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 8;

      // 3. Emissor (De) e Cliente (Para)
      const colWidth = (contentWidth - 8) / 2;
      const boxHeight = 32;

      // Card Emissor
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, colWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      doc.text('PRESTADOR / EMISSOR:', marginX + 4, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(doc.splitTextToSize(state.emitterName || 'Prestador não informado', colWidth - 8)[0], marginX + 4, currentY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      let emY = currentY + 17;
      if (state.emitterDoc) { doc.text(`CNPJ/CPF: ${state.emitterDoc}`, marginX + 4, emY); emY += 4; }
      if (state.emitterPhone) { doc.text(`Tel: ${state.emitterPhone}`, marginX + 4, emY); emY += 4; }
      if (state.emitterEmail) { doc.text(`E-mail: ${state.emitterEmail}`, marginX + 4, emY); }

      // Card Cliente
      const clientX = marginX + colWidth + 8;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(clientX, currentY, colWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      doc.text('CLIENTE / DESTINATÁRIO:', clientX + 4, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(doc.splitTextToSize(state.clientName || 'Cliente não informado', colWidth - 8)[0], clientX + 4, currentY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      let clY = currentY + 17;
      if (state.clientDoc) { doc.text(`Doc: ${state.clientDoc}`, clientX + 4, clY); clY += 4; }
      if (state.clientAddress) {
        const addressLines = doc.splitTextToSize(state.clientAddress, colWidth - 8);
        doc.text(addressLines[0] || '', clientX + 4, clY);
        if (addressLines[1]) doc.text(addressLines[1], clientX + 4, clY + 4);
      }

      currentY += boxHeight + 8;

      // 4. Tabela de Itens do Orçamento
      const tableBody = state.items.map((item, index) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return [
          String(index + 1),
          item.description || 'Item sem descrição',
          String(qty),
          formatCurrency(price),
          formatCurrency(qty * price)
        ];
      });

      doc.autoTable({
        startY: currentY,
        margin: { left: marginX, right: marginX },
        head: [['#', 'Descrição do Item / Serviço', 'Qtd', 'Valor Unit.', 'Total']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235], // #2563EB
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 3.5
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3.2,
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 32, halign: 'right' },
          4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      currentY = doc.lastAutoTable.finalY + 6;

      // 5. Totais & Caixa de Pagamento PIX com QR Code
      const totalsWidth = 72;
      const totalsX = pageWidth - marginX - totalsWidth;
      const paymentBoxWidth = contentWidth - totalsWidth - 6;
      let totalsBoxHeight = totals.discount > 0 ? 30 : 24;
      const paymentBoxHeight = Math.max(totalsBoxHeight, qrDataUrl ? 32 : 24);

      // Box de Totais
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(totalsX, currentY, totalsWidth, paymentBoxHeight, 2, 2, 'FD');

      let totY = currentY + 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Subtotal:', totalsX + 4, totY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(totals.subtotal), totalsX + totalsWidth - 4, totY, { align: 'right' });

      if (totals.discount > 0) {
        totY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Desconto:', totalsX + 4, totY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text(`- ${formatCurrency(totals.discount)}`, totalsX + totalsWidth - 4, totY, { align: 'right' });
      }

      // Tarja Total
      totY += 5.5;
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(totalsX + 2, totY, totalsWidth - 4, 9, 1.5, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('TOTAL:', totalsX + 5, totY + 6);
      doc.setFontSize(10.5);
      doc.text(formatCurrency(totals.total), totalsX + totalsWidth - 5, totY + 6.2, { align: 'right' });

      // Box de Pagamento PIX (Esquerda dos Totais)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, paymentBoxWidth, paymentBoxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      doc.text('DADOS PARA PAGAMENTO (PIX):', marginX + 4, currentY + 5.5);

      // Renderiza QR Code se disponível
      if (qrDataUrl) {
        try {
          doc.addImage(qrDataUrl, 'PNG', marginX + 4, currentY + 8, 22, 22);
        } catch (err) {
          console.warn('Erro ao inserir QR Code no PDF:', err);
        }

        const pixTextX = marginX + 28;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(`Chave PIX: ${state.pixKey}`, pixTextX, currentY + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        if (state.pixBank) doc.text(state.pixBank, pixTextX, currentY + 17);
        doc.text('Aponte a câmera do banco no QR Code para pagar', pixTextX, currentY + 22);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Chave PIX: ${state.pixKey || 'Consulte o emissor'}`, marginX + 4, currentY + 12);
        if (state.pixBank) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text(state.pixBank, marginX + 4, currentY + 18);
        }
      }

      currentY += paymentBoxHeight + 8;

      // 6. Observações e Prazos do Orçamento
      if (state.notes && state.notes.trim()) {
        const notesBoxHeight = 18;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, currentY, contentWidth, notesBoxHeight, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('CONDIÇÕES DA PROPOSTA & OBSERVAÇÕES:', marginX + 4, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const splitNotes = doc.splitTextToSize(state.notes.trim(), contentWidth - 8);
        doc.text(splitNotes.slice(0, 3), marginX + 4, currentY + 10);

        currentY += notesBoxHeight + 8;
      }

      // 7. Duas Assinaturas no Orçamento (Aceite do Cliente e Emissor)
      if (currentY + 28 > pageHeight - 16) {
        doc.addPage();
        currentY = 25;
      }

      const signLineWidth = 75;

      // Assinatura 1: Aceite do Cliente
      const signClientX = marginX;
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(signClientX, currentY + 16, signClientX + signLineWidth, currentY + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Aceite do Cliente / De Acordo', signClientX + (signLineWidth / 2), currentY + 20, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Data: ____ / ____ / ________', signClientX + (signLineWidth / 2), currentY + 24, { align: 'center' });

      // Assinatura 2: Emissor / Prestador
      const signEmitterX = pageWidth - marginX - signLineWidth;
      doc.line(signEmitterX, currentY + 16, signEmitterX + signLineWidth, currentY + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(state.emitterName || 'Assinatura do Emissor', signEmitterX + (signLineWidth / 2), currentY + 20, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Prestador do Serviço', signEmitterX + (signLineWidth / 2), currentY + 24, { align: 'center' });

    // =======================================================================
    // LAYOUT 2: RECIBO DE QUITAÇÃO (Tema Verde Esmeralda / Carimbo de Quitado)
    // =======================================================================
    } else {
      // 1. Barra Superior Verde Esmeralda
      doc.setFillColor(5, 150, 105); // #059669
      doc.rect(0, 0, pageWidth, 5, 'F');
      currentY = 16;

      // 2. Cabeçalho do Recibo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);

      const headerBrandText = state.emitterName ? state.emitterName.toUpperCase() : 'PDFaz';
      doc.text(headerBrandText, marginX, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(5, 150, 105);
      doc.text('Comprovante Oficial de Pagamento e Quitação', marginX, currentY + 5);

      // Selo Retangular de Pagamento Confirmado no Topo Direito
      const stampWidth = 56;
      const stampHeight = 16;
      const stampX = pageWidth - marginX - stampWidth;
      const stampY = currentY - 6;

      doc.setFillColor(236, 253, 245); // Emerald 50
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.6);
      doc.roundedRect(stampX, stampY, stampWidth, stampHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105);
      doc.text('RECIBO DE QUITAÇÃO', stampX + (stampWidth / 2), stampY + 6, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setTextColor(6, 95, 70);
      doc.text('PAGAMENTO CONFIRMADO', stampX + (stampWidth / 2), stampY + 11.5, { align: 'center' });

      // Detalhes do Recibo
      currentY += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      doc.text(`Recibo Nº: ${docNum}`, pageWidth - marginX, currentY, { align: 'right' });
      doc.text(`Data do Pagamento: ${dateFormatted}`, pageWidth - marginX, currentY + 4.5, { align: 'right' });
      doc.text(`Forma: PAGO VIA ${state.paymentMethod || 'PIX'}`, pageWidth - marginX, currentY + 9, { align: 'right' });

      currentY += 13;

      // 3. Bloco Distintivo do Recibo: GRANDE DECLARAÇÃO DE QUITAÇÃO
      const reciboBoxHeight = 24;
      doc.setFillColor(236, 253, 245); // Emerald 50
      doc.setDrawColor(167, 243, 208); // Emerald 200
      doc.setLineWidth(0.4);
      doc.roundedRect(marginX, currentY, contentWidth, reciboBoxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(6, 95, 70);
      doc.text('DECLARAÇÃO DE QUITAÇÃO INTEGRAL:', marginX + 4, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(4, 78, 57);

      const clientReference = state.clientName ? state.clientName.trim() : 'o cliente acima qualificado';
      const clientDocStr = state.clientDoc ? `, CPF/CNPJ ${state.clientDoc.trim()},` : '';
      const receiptStatement = `Declaramos para os devidos fins que RECEBEMOS de ${clientReference}${clientDocStr} a importância de ${formatCurrency(totals.total)} (${state.paymentMethod || 'PIX'}), referente à liquidação dos produtos/serviços descritos abaixo, conferindo-lhe por este instrumento plena, geral e irrevogável quitação de pagamento.`;
      
      const statementLines = doc.splitTextToSize(receiptStatement, contentWidth - 8);
      doc.text(statementLines, marginX + 4, currentY + 11);

      currentY += reciboBoxHeight + 8;

      // 4. Emissor (Recebedor) e Cliente (Pagador)
      const colWidth = (contentWidth - 8) / 2;
      const boxHeight = 28;

      // Emissor
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, colWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text('RECEBEDOR (EMISSOR):', marginX + 4, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(doc.splitTextToSize(state.emitterName || 'Recebedor não informado', colWidth - 8)[0], marginX + 4, currentY + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      let emY2 = currentY + 16;
      if (state.emitterDoc) { doc.text(`CNPJ/CPF: ${state.emitterDoc}`, marginX + 4, emY2); emY2 += 4; }
      if (state.emitterPhone) { doc.text(`Tel: ${state.emitterPhone}`, marginX + 4, emY2); }

      // Cliente
      const clientX = marginX + colWidth + 8;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(clientX, currentY, colWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text('PAGADOR (CLIENTE):', clientX + 4, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(doc.splitTextToSize(state.clientName || 'Cliente não informado', colWidth - 8)[0], clientX + 4, currentY + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      let clY2 = currentY + 16;
      if (state.clientDoc) { doc.text(`CPF/CNPJ: ${state.clientDoc}`, clientX + 4, clY2); clY2 += 4; }
      if (state.clientAddress) {
        doc.text(doc.splitTextToSize(state.clientAddress, colWidth - 8)[0], clientX + 4, clY2);
      }

      currentY += boxHeight + 8;

      // 5. Tabela de Itens Liquidados
      const tableBody = state.items.map((item, index) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return [
          String(index + 1),
          item.description || 'Item sem descrição',
          String(qty),
          formatCurrency(price),
          formatCurrency(qty * price)
        ];
      });

      doc.autoTable({
        startY: currentY,
        margin: { left: marginX, right: marginX },
        head: [['#', 'Serviço / Produto Quitado', 'Qtd', 'Valor Unit.', 'Total Quitado']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [5, 150, 105], // Emerald 600
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 3.5
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3.2,
          lineColor: [209, 250, 229], // Emerald 100
          lineWidth: 0.2,
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 32, halign: 'right' },
          4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      currentY = doc.lastAutoTable.finalY + 6;

      // 6. Totais e Dados do PIX no Recibo
      const totalsWidth = 75;
      const totalsX = pageWidth - marginX - totalsWidth;
      const receiptNotesWidth = contentWidth - totalsWidth - 6;
      let totalsBoxHeight = totals.discount > 0 ? 30 : 24;
      const receiptNotesHeight = Math.max(totalsBoxHeight, qrDataUrl ? 32 : 24);

      // Box de Totais
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(totalsX, currentY, totalsWidth, receiptNotesHeight, 2, 2, 'FD');

      let totY2 = currentY + 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Subtotal:', totalsX + 4, totY2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(totals.subtotal), totalsX + totalsWidth - 4, totY2, { align: 'right' });

      if (totals.discount > 0) {
        totY2 += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Desconto:', totalsX + 4, totY2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text(`- ${formatCurrency(totals.discount)}`, totalsX + totalsWidth - 4, totY2, { align: 'right' });
      }

      // Tarja Total Quitado (Verde)
      totY2 += 5.5;
      doc.setFillColor(5, 150, 105);
      doc.roundedRect(totalsX + 2, totY2, totalsWidth - 4, 9, 1.5, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text('TOTAL PAGO:', totalsX + 4, totY2 + 6);
      doc.setFontSize(10.5);
      doc.text(formatCurrency(totals.total), totalsX + totalsWidth - 4, totY2 + 6.2, { align: 'right' });

      // Box de Observações do Recibo / Chave PIX
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, receiptNotesWidth, receiptNotesHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text('COMPROVAÇÃO DE QUITAÇÃO & PIX:', marginX + 4, currentY + 5.5);

      if (qrDataUrl) {
        try {
          doc.addImage(qrDataUrl, 'PNG', marginX + 4, currentY + 8, 22, 22);
        } catch (err) {
          console.warn('Erro ao inserir QR Code:', err);
        }

        const infoX = marginX + 28;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(`Chave PIX: ${state.pixKey}`, infoX, currentY + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        if (state.pixBank) doc.text(state.pixBank, infoX, currentY + 17);
        doc.text(`Status: Quitado em ${dateFormatted}`, infoX, currentY + 22);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const notesToPrint = state.notes ? state.notes.trim() : `Pagamento recebido integralmente via ${state.paymentMethod || 'PIX'}.`;
        const splitNotes = doc.splitTextToSize(notesToPrint, receiptNotesWidth - 8);
        doc.text(splitNotes.slice(0, 4), marginX + 4, currentY + 12);
      }

      currentY += receiptNotesHeight + 10;

      // 7. Assinatura ÚNICA no Recibo (Apenas do Emissor / Recebedor)
      if (currentY + 26 > pageHeight - 16) {
        doc.addPage();
        currentY = 25;
      }

      const signLineWidth = 90;
      const signX = (pageWidth - signLineWidth) / 2; // Centralizada

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(signX, currentY + 14, signX + signLineWidth, currentY + 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(state.emitterName || 'Assinatura do Recebedor', pageWidth / 2, currentY + 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const docStr = state.emitterDoc ? `CPF/CNPJ: ${state.emitterDoc}` : 'Recebedor';
      doc.text(`${docStr} • Quitação válida e irrevogável`, pageWidth / 2, currentY + 22, { align: 'center' });
    }

    // =======================================================================
    // 8. Rodapé Oficial em todas as páginas
    // =======================================================================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      const footerDocName = isOrcamento ? 'Orçamento emitido via PDFaz' : 'Comprovante de Quitação emitido via PDFaz';
      doc.text(`${footerDocName} • pdfaz.com.br`, marginX, pageHeight - 7);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
    }

    return doc;
  }

  /**
   * Dispara o download automático do PDF com feedback
   */
  function generateAndDownloadPdf() {
    try {
      setButtonLoading(dom.btnGeneratePdf, true);
      setButtonLoading(dom.btnGeneratePdfMobile, true);

      setTimeout(() => {
        try {
          const doc = buildPdfDocument();
          const cleanDocType = state.docType === 'orcamento' ? 'orcamento' : 'recibo';
          const cleanNum = (state.docNumber || '001').replace(/[^a-zA-Z0-9_-]/g, '');
          const cleanClient = (state.clientName || 'cliente').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);
          const fileName = `${cleanDocType}_${cleanNum}_${cleanClient}.pdf`;

          doc.save(fileName);
          showToast(`Arquivo "${fileName}" baixado com sucesso!`, 'success');
          scheduleSatisfactionSurvey(15000);
        } catch (err) {
          console.error(err);
          showToast(`Erro ao gerar documento: ${err.message}`, 'danger');
        } finally {
          setButtonLoading(dom.btnGeneratePdf, false);
          setButtonLoading(dom.btnGeneratePdfMobile, false);
        }
      }, 150);
    } catch (e) {
      console.error(e);
      setButtonLoading(dom.btnGeneratePdf, false);
      setButtonLoading(dom.btnGeneratePdfMobile, false);
    }
  }

  /**
   * Abre a pré-visualização do PDF em uma nova aba
   */
  function previewPdf() {
    try {
      setButtonLoading(dom.btnPreviewPdf, true);

      setTimeout(() => {
        try {
          const doc = buildPdfDocument();
          const blobUrl = doc.output('bloburl');
          window.open(blobUrl, '_blank');
          showToast('Pré-visualização aberta em nova aba.', 'info');
          scheduleSatisfactionSurvey(20000);
        } catch (err) {
          console.error(err);
          showToast(`Erro na pré-visualização: ${err.message}`, 'danger');
        } finally {
          setButtonLoading(dom.btnPreviewPdf, false);
        }
      }, 150);
    } catch (e) {
      console.error(e);
      setButtonLoading(dom.btnPreviewPdf, false);
    }
  }

  /**
   * Feedback visual de carregamento nos botões
   */
  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    const span = btn.querySelector('span');
    if (isLoading) {
      btn.disabled = true;
      if (span) {
        span.innerHTML = '<span class="spinner"></span> Gerando...';
      }
    } else {
      btn.disabled = false;
      // Restaura sempre o texto correto conforme o tipo de documento atual
      setActionButtonsText(state.docType);
    }
  }

  // =========================================================================
  // Inicialização e Event Listeners Globais
  // =========================================================================

  function init() {
    // Tenta carregar do LocalStorage; caso contrário, usa estado inicial
    const hasData = loadFromLocalStorage();
    if (!hasData) {
      renderItems();
    }
    // Garante que os QR Codes visualizados na tela comecem sempre atualizados
    updatePixQrCode();
    updateDonationPixQrCode();

    // Garante que os botões de ação comecem com os textos corretos
    setActionButtonsText(state.docType || 'orcamento');

    // Toggle de tipo de documento com listeners diretos
    const btnOrc = document.getElementById('btn-type-orcamento');
    const btnRec = document.getElementById('btn-type-recibo');
    if (btnOrc) {
      btnOrc.addEventListener('click', function (e) {
        e.preventDefault();
        setDocType('orcamento');
      });
    }
    if (btnRec) {
      btnRec.addEventListener('click', function (e) {
        e.preventDefault();
        setDocType('recibo');
      });
    }

    // Adicionar Item
    if (dom.btnAddItem) {
      dom.btnAddItem.addEventListener('click', () => {
        addNewItem();
        updatePixQrCode();
      });
    }

    // Desconto
    if (dom.inputDiscount) {
      dom.inputDiscount.addEventListener('input', () => {
        state.discount = parseFloat(dom.inputDiscount.value) || 0;
        calculateTotals();
        updatePixQrCode();
        saveToLocalStorage();
      });
    }

    // Inputs de PIX e QR Code
    if (dom.pixKeyInput) {
      dom.pixKeyInput.addEventListener('input', () => {
        state.pixKey = dom.pixKeyInput.value;
        updatePixQrCode();
        saveToLocalStorage();
      });
    }

    if (dom.pixBankInput) {
      dom.pixBankInput.addEventListener('input', () => {
        state.pixBank = dom.pixBankInput.value;
        saveToLocalStorage();
      });
    }

    if (dom.btnCopyPix) {
      dom.btnCopyPix.addEventListener('click', copyPixKeyToClipboard);
    }

    if (dom.btnCopyPixPayload) {
      dom.btnCopyPixPayload.addEventListener('click', copyPixPayloadToClipboard);
    }

    if (dom.includePixQrCheckbox) {
      dom.includePixQrCheckbox.addEventListener('change', () => {
        state.includePixQr = dom.includePixQrCheckbox.checked;
        saveToLocalStorage();
      });
    }

    // Eventos da Seção de Doação & Apoio PIX
    if (dom.btnCopyDonationPix) {
      dom.btnCopyDonationPix.addEventListener('click', copyDonationPixToClipboard);
    }

    if (dom.btnCopyDonationPayload) {
      dom.btnCopyDonationPayload.addEventListener('click', copyDonationPayloadToClipboard);
    }

    // Atualização do QR code e dados bancários quando emitente ou número mudam
    if (dom.emitterName) {
      dom.emitterName.addEventListener('input', () => {
        state.emitterName = dom.emitterName.value;
        updatePixQrCode();
      });
    }
    if (dom.docNumber) {
      dom.docNumber.addEventListener('input', () => {
        state.docNumber = dom.docNumber.value;
        updatePixQrCode();
      });
    }

    // Atualização da declaração do recibo ao digitar cliente ou forma de pgto
    if (dom.clientName) {
      dom.clientName.addEventListener('input', () => updateReciboDeclaration());
    }
    if (dom.clientDoc) {
      dom.clientDoc.addEventListener('input', () => updateReciboDeclaration());
    }
    if (dom.paymentMethod) {
      dom.paymentMethod.addEventListener('change', () => updateReciboDeclaration());
    }

    // Inputs gerais com salvamento automático
    const autoSaveInputs = [
      dom.docNumber, dom.docDate, dom.docValidity, dom.paymentMethod,
      dom.emitterName, dom.emitterDoc, dom.emitterPhone, dom.emitterEmail,
      dom.clientName, dom.clientDoc, dom.clientAddress, dom.notes
    ];

    autoSaveInputs.forEach(input => {
      if (input) {
        input.addEventListener('input', saveToLocalStorage);
        input.addEventListener('change', saveToLocalStorage);
      }
    });

    // Botões de ação do PDF
    if (dom.btnGeneratePdf) {
      dom.btnGeneratePdf.addEventListener('click', generateAndDownloadPdf);
    }
    if (dom.btnGeneratePdfMobile) {
      dom.btnGeneratePdfMobile.addEventListener('click', generateAndDownloadPdf);
    }
    if (dom.btnPreviewPdf) {
      dom.btnPreviewPdf.addEventListener('click', previewPdf);
    }

    // Botões auxiliares
    if (dom.btnLoadExample) {
      dom.btnLoadExample.addEventListener('click', () => {
        loadExampleData();
        updatePixQrCode();
      });
    }
    if (dom.btnClearForm) {
      dom.btnClearForm.addEventListener('click', () => {
        clearForm();
        updatePixQrCode();
      });
    }

    // Inicialização do PWA (Service Worker & Instalação Nativa)
    setupPWA();

    // Inicialização da Pesquisa de Satisfação pós-download
    setupSatisfactionSurvey();
  }

  // =========================================================================
  // Módulo: Pesquisa de Satisfação & Feedback pós-download
  // =========================================================================
  const surveyState = {
    rating: 0,
    recommend: '',
    feedback: '',
    timerId: null
  };

  const RATING_LABELS = {
    1: '1 de 5 • Pouco útil 🙁',
    2: '2 de 5 • Razoável 😐',
    3: '3 de 5 • Útil e prático 🙂',
    4: '4 de 5 • Muito bom e rápido! 😊',
    5: '5 de 5 • Excelente e indispensável! 🤩'
  };

  /**
   * Programa a exibição da pesquisa após o download ou pré-visualização
   * @param {number} delayMs Tempo em milissegundos (padrão: 15 segundos)
   */
  function scheduleSatisfactionSurvey(delayMs = 15000) {
    // 1. Não exibe automaticamente se já respondeu
    const hasAnswered = localStorage.getItem('pdfaz_survey_done') === 'true';
    if (hasAnswered) return;

    // 2. Não exibe se dispensou recentemente (7 dias de carência)
    const dismissedAt = localStorage.getItem('pdfaz_survey_dismissed_at');
    if (dismissedAt) {
      const daysPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 7) return;
    }

    if (surveyState.timerId) {
      clearTimeout(surveyState.timerId);
    }

    surveyState.timerId = setTimeout(() => {
      openSurveyModal();
    }, delayMs);
  }

  function openSurveyModal() {
    if (!dom.surveyBackdrop) return;
    if (dom.surveyForm && dom.surveySuccessCard) {
      dom.surveyForm.style.display = 'block';
      dom.surveySuccessCard.style.display = 'none';
      if (dom.surveyBtnSubmit) {
        dom.surveyBtnSubmit.disabled = !surveyState.rating || !surveyState.recommend;
      }
    }
    dom.surveyBackdrop.classList.add('active');
    dom.surveyBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeSurveyModal(isDismiss = true) {
    if (!dom.surveyBackdrop) return;
    dom.surveyBackdrop.classList.remove('active');
    dom.surveyBackdrop.setAttribute('aria-hidden', 'true');
    if (isDismiss) {
      localStorage.setItem('pdfaz_survey_dismissed_at', Date.now().toString());
    }
  }

  function updateSurveyStarsVisual(highlightValue) {
    if (!dom.surveyStarsGroup) return;
    const stars = dom.surveyStarsGroup.querySelectorAll('.survey-star');
    stars.forEach(star => {
      const val = parseInt(star.getAttribute('data-rating'), 10);
      if (val <= highlightValue) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });

    if (dom.surveyRatingText) {
      if (highlightValue > 0 && RATING_LABELS[highlightValue]) {
        dom.surveyRatingText.textContent = RATING_LABELS[highlightValue];
      } else {
        dom.surveyRatingText.textContent = 'Clique para selecionar de 1 a 5 estrelas';
      }
    }
  }

  function checkSurveyValidation() {
    const isValid = surveyState.rating > 0 && surveyState.recommend.trim().length > 0;
    if (dom.surveyBtnSubmit) {
      dom.surveyBtnSubmit.disabled = !isValid;
    }
  }

  async function submitSurvey(e) {
    if (e) e.preventDefault();
    if (!surveyState.rating || !surveyState.recommend) {
      showToast('Por favor, informe uma nota de 1 a 5 e se você recomendaria.', 'warning');
      return;
    }

    const featureText = dom.surveyFeatureSuggestion ? dom.surveyFeatureSuggestion.value.trim() : '';

    const payload = {
      _subject: `[PDFaz.com.br] Nova Avaliação de Satisfação (${surveyState.rating}★)`,
      _template: 'table',
      _captcha: 'false',
      _honey: '',
      aplicativo: 'PDFaz.com.br',
      data_envio: new Date().toLocaleString('pt-BR'),
      utilidade_nota: `${surveyState.rating} de 5 (${RATING_LABELS[surveyState.rating] || ''})`,
      recomendaria: surveyState.recommend,
      recursos_que_sentiu_falta: featureText || '(Nenhum comentário preenchido)',
      tipo_documento_utilizado: state.docType || 'não definido',
      valor_total: dom.totalDisplay ? dom.totalDisplay.textContent : 'R$ 0,00'
    };

    // Salva cópia localmente (backup no LocalStorage)
    try {
      const history = JSON.parse(localStorage.getItem('pdfaz_feedback_history') || '[]');
      history.push({ ...payload, timestamp: Date.now() });
      localStorage.setItem('pdfaz_feedback_history', JSON.stringify(history));
    } catch (err) {
      console.warn('Erro ao salvar feedback local:', err);
    }

    // Feedback visual no botão
    if (dom.surveyBtnSubmit) {
      dom.surveyBtnSubmit.disabled = true;
      if (dom.surveySubmitText) {
        dom.surveySubmitText.textContent = 'Enviando...';
      }
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('[Feedback] Enviado com sucesso para /api/feedback:', data);
      } else {
        console.warn('[Feedback] Servidor respondeu com status:', response.status);
      }
    } catch (networkError) {
      console.warn('[Feedback] Requisição falhou (salvo em LocalStorage):', networkError);
    } finally {
      localStorage.setItem('pdfaz_survey_done', 'true');

      if (dom.surveyForm) dom.surveyForm.style.display = 'none';
      if (dom.surveySuccessCard) dom.surveySuccessCard.style.display = 'block';

      showToast('Obrigado pelo seu feedback!', 'success');

      setTimeout(() => {
        closeSurveyModal(false);
      }, 4000);
    }
  }

  function setupSatisfactionSurvey() {
    // 1. Estrelas interativas
    if (dom.surveyStarsGroup) {
      const stars = dom.surveyStarsGroup.querySelectorAll('.survey-star');
      stars.forEach(star => {
        const ratingVal = parseInt(star.getAttribute('data-rating'), 10);

        star.addEventListener('click', () => {
          surveyState.rating = ratingVal;
          updateSurveyStarsVisual(surveyState.rating);
          checkSurveyValidation();
        });

        star.addEventListener('mouseenter', () => {
          stars.forEach(s => {
            const v = parseInt(s.getAttribute('data-rating'), 10);
            if (v <= ratingVal) {
              s.classList.add('hover-active');
            } else {
              s.classList.remove('hover-active');
            }
          });
        });

        star.addEventListener('mouseleave', () => {
          stars.forEach(s => s.classList.remove('hover-active'));
        });
      });
    }

    // 2. Chips de Recomendação
    if (dom.surveyRecommendGroup) {
      const chips = dom.surveyRecommendGroup.querySelectorAll('.survey-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          surveyState.recommend = chip.getAttribute('data-recommend') || '';
          checkSurveyValidation();
        });
      });
    }

    // 3. Botão Enviar
    if (dom.surveyBtnSubmit) {
      dom.surveyBtnSubmit.addEventListener('click', submitSurvey);
    }

    // 4. Botões Fechar e Agora não
    if (dom.surveyBtnClose) {
      dom.surveyBtnClose.addEventListener('click', () => closeSurveyModal(true));
    }
    if (dom.surveyBtnLater) {
      dom.surveyBtnLater.addEventListener('click', () => closeSurveyModal(true));
    }
    if (dom.surveyBtnCloseSuccess) {
      dom.surveyBtnCloseSuccess.addEventListener('click', () => closeSurveyModal(false));
    }

    // 5. Clique fora no Backdrop fecha modal
    if (dom.surveyBackdrop) {
      dom.surveyBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.surveyBackdrop) {
          closeSurveyModal(true);
        }
      });
    }

    // 6. Botão manual no rodapé "Avaliar PDFaz"
    if (dom.btnOpenSurvey) {
      dom.btnOpenSurvey.addEventListener('click', (e) => {
        e.preventDefault();
        openSurveyModal();
      });
    }
  }

  // =========================================================================
  // PWA & Service Worker (Suporte Offline & Instalação Nativa)
  // =========================================================================
  let deferredPrompt = null;

  function setupPWA() {
    // 1. Registro do Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
          })
          .catch(err => {
            console.warn('[PWA] Erro ao registrar Service Worker:', err);
          });
      });
    }

    // 2. Captura do evento beforeinstallprompt para exibir o botão nativo
    window.addEventListener('beforeinstallprompt', e => {
      // Previne que o navegador mostre o mini-infobar automaticamente
      e.preventDefault();
      deferredPrompt = e;

      // Exibe o botão de instalação no cabeçalho
      if (dom.btnInstallPwa) {
        dom.btnInstallPwa.style.display = 'inline-flex';
      }
    });

    // 3. Clique no botão de instalação
    if (dom.btnInstallPwa) {
      dom.btnInstallPwa.addEventListener('click', async () => {
        if (!deferredPrompt) {
          showToast('O aplicativo já está pronto para uso ou já foi instalado.', 'info');
          return;
        }

        // Exibe o diálogo nativo do sistema operacional (Windows/Chrome/Edge)
        deferredPrompt.prompt();

        // Aguarda a escolha do usuário
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Resposta do usuário à instalação:', outcome);

        if (outcome === 'accepted') {
          showToast('Instalação iniciada com sucesso!', 'success');
          dom.btnInstallPwa.style.display = 'none';
        }
        deferredPrompt = null;
      });
    }

    // 4. Quando o aplicativo é instalado com sucesso
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] PDFaz instalado com sucesso!');
      showToast('PDFaz instalado no seu dispositivo com sucesso!', 'success');
      if (dom.btnInstallPwa) {
        dom.btnInstallPwa.style.display = 'none';
      }
      deferredPrompt = null;
    });

    // 5. Se já estiver rodando como aplicativo instalado (Standalone)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      if (dom.btnInstallPwa) {
        dom.btnInstallPwa.style.display = 'none';
      }
    }
  }

  // Executa inicialização assim que o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
