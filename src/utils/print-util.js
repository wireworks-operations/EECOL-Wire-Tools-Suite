export function safeOpenPrintWindow(title, htmlContent) {
  const w = window.open('', '_blank');
  if (!w) {
    // fallback: create an in-page modal / inform the user
    alert('Unable to open print window. Please allow popups for this site to print.');
    return null;
  }
  // Mitigate Reverse Tabnabbing by clearing window.opener
  try {
    w.opener = null;
  } catch (e) {
    // ignore cross-browser quirks
  }
  w.document.write(htmlContent);
  try { w.document.close(); } catch (e) { /* ignore */ }
  return w;
}