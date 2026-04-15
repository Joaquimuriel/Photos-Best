/* config.js - Configurações do Supabase */
var CONFIG = {
  /* Supabase */
  supabaseUrl: 'https://dkfdqzfultgqpqcucnul.supabase.co',
  supabaseAnonKey: 'sb_publishable_IqR3gJ03b0xhGyZSNGO7cw_w-uT8fFK',

  /* Maker.com Webhook */
  makerWebhookURL: 'https://hook.us2.make.com/lcr2uc0ikvu4rapb84no5g0schpocnle',

  /* Gemini API */
  geminiAPIEndpoint: 'YOUR_GEMINI_API_ENDPOINT',

  /* Limites */
  maxPhotosPerDay: 3,
  maxFileSizeMB: 10,
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp']
};

/* Exportar para global */
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}