// i18n.config.js
import en from "./locales/en.json";
import es from "./locales/es.json";

export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: 'en',  // Idioma por defecto
    fallbackLocale: {
      // Variantes de español
      'es_CL': ['es', 'en'],     // Español de Chile con fallback a español de España y luego inglés de EE.UU.
      'es_PE': ['es', 'en'],     // Español de Perú
      'es_AR': ['es', 'en'],     // Español de Argentina
      'es_MX': ['es', 'en'],     // Español de México
    
      // Variantes de inglés
      'en': ['es'],              // Inglés de EE.UU. con fallback a español de España
      'en_CA': ['en', 'es'],     // Inglés de Canadá con fallback a inglés de EE.UU. y luego a español de España
    
      // Variantes de francés y alemán
      'fr_CA': ['fr', 'en'],        // Francés de Canadá con fallback a francés genérico y luego inglés de EE.UU.
      'de': ['en', 'es'],        // Alemán con fallback a inglés de EE.UU. y español de España
    
      // Español de España
      'es': ['en'],              // Español de España con fallback a inglés de EE.UU.
    
      // Idiomas genéricos (preparados para agregar en el futuro)
      'es': ['es', 'en'],        // Español genérico con fallback a español de España e inglés de EE.UU.
      'en': ['en', 'es'],        // Inglés genérico con fallback a inglés de EE.UU. y español de España
      'fr': ['fr_CA', 'en'],        // Francés genérico con fallback a francés de Canadá e inglés de EE.UU.
    
      // Fallback global
      default: 'en'                 // Fallback global a inglés de EE.UU.
    },
    messages: {
      en,
      es
    },
    datetimeFormats: {
      'en': {
        short: {
          year: 'numeric', month: 'short', day: 'numeric'
        },
        long: {
          year: 'numeric', month: 'short', day: 'numeric',
          weekday: 'short', hour: 'numeric', minute: 'numeric'
        }
      },
      'es': {
        short: {
          year: 'numeric', month: 'short', day: 'numeric'
        },
        long: {
          year: 'numeric', month: 'short', day: 'numeric',
          weekday: 'short', hour: 'numeric', minute: 'numeric'
        }
      }
    }
  };
});
