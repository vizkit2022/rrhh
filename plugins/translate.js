// plugins/i18n.js
import { watch } from 'vue';


const fetchTranslationsFromAPI = async (locale) => {
  try {
    const response = await fetch(`/api/translations/${locale}`);
    if (!response.ok) {
      throw new Error(`No se encontraron traducciones para ${locale}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching translations:', error.message);
    return null;
  }
};

const cacheTranslations = (locale, translations) => {
  if (process.client) {
    const cacheData = {
      data: translations,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`translations_${locale}`, JSON.stringify(cacheData));
  }
};

const checkAndUpdateTranslations = async (locale, messages) => {
  if (process.client) {
    
    try {

      const cachedTranslations = JSON.parse(localStorage.getItem(`translations_${locale}`)) || {};
      const apiTranslations = await fetchTranslationsFromAPI(locale);

      if (apiTranslations) {
        if (!cachedTranslations.lastUpdated || new Date(cachedTranslations.lastUpdated) < new Date(apiTranslations.lastUpdated)) {
          messages[locale] = { ...messages[locale], ...apiTranslations.data };
          cacheTranslations(locale, messages[locale]);
        } else {
          messages[locale] = { ...messages[locale], ...cachedTranslations.data };
        }
      } else {
        console.warn(`No se encontraron traducciones para ${locale}, pasando al siguiente idioma en el fallback.`);
      }
    } catch (error) {
      console.warn("error en checkAndUpdateTranslations");
    }
  }
};

export default defineNuxtPlugin(async (nuxtApp) => {
  const i18n = nuxtApp.vueApp.config.globalProperties.$i18n;

  let userLocale = 'en'; // Valor por defecto
  if (process.client) {
    // Usar las funciones nativas para obtener la cookie
    const cookieLocale = i18n.getLocaleCookie();
    console.log("Recuperar cookie: ", cookieLocale); // Debug para ver el valor de la cookie
    const browserLocale = i18n.getBrowserLocale();
    userLocale = cookieLocale || browserLocale || 'en';

    // Cargar traducciones desde la API
    // await checkAndUpdateTranslations(userLocale, i18n.messages);

    // Establecer el idioma inicial
    i18n.locale = userLocale;

    // Observa los cambios en el idioma actual de `vue-i18n` y actualiza automáticamente
    watch(
      () => i18n.locale,
      (newLang) => {
        i18n.locale = newLang;

      }
    );

  }
});
