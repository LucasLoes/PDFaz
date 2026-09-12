/**
 * PDFaz - Registro Seguro do Service Worker para Páginas Institucionais
 * Elimina scripts inline para total conformidade com Content Security Policy (CSP)
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.update();
    }).catch(err => {
      console.warn('[PDFaz SW] Falha no registro do Service Worker:', err);
    });
  });
}
