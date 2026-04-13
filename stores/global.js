import { defineStore } from "pinia";
import api_rome from "@/composables/api_rome";
import { getCurrentYearAndTimeZone } from "@/utils/helpers";

export default defineStore("global", {
  state: () => ({
    breadcrumb: [],
    title: "",
    showBtnOmitWizard: false,
    namePage: "",
    tag: "",
    organizations: [],
    loading: false,
    languages: [],
    conexion: true,
    edit: true,
    disabled: false,
    changeOrg: false,
    isRedirectConfig: false,
    organizationId: null,
    lang: "es",
    year: null,
    currentDate: null,
    isDark: false,
    currencies: [],
    defCurrency: null,
    sliderExpand: false,
    // Slider
    tab: 0,
    //Filters Calendar
    filtersCalendar: {
      incomes: {
        projects: {
          rangeDate: "",
          year: null,
          month: null,
          prop: null,
          zone: null,
        },
        movements: {
          rangeDate: "",
          year: null,
          month: null,
          prop: null,
          zone: null,
        },
      },
      outcomes: {
        purchases: {
          rangeDate: "",
          year: null,
          month: null,
          prop: null,
          zone: null,
        },
        purchasesDocs: {
          rangeDate: "",
          year: null,
          month: null,
          prop: null,
          zone: null,
        },
      },
      salesDocs: {
        sales: {
          rangeDate: "",
          year: null,
          month: null,
          prop: null,
          zone: null,
        },
      },
      bankingTransactions: {
        transactions: {
          rangeDate: "",
          year: null,
          month: null,
          prop: null,
          zone: null,
        },
        banks: {
          rangeDate: "",
          year: null,
          month: null,
          prop: null,
          zone: null,
        },
      },
    },

    // Filters
    showFilters: false,
    filters: [],
    filtersCustoms: [],
    newFilter: false,
    savingFilter: false,
    disableFilter: false,
    filterContactsLoader: false,
    filterUsersContactLoader: false,
    filterUsersOrganizationLoader: false,

    // Owner
    isOwner: false,
  }),

  getters: {
    appliedFiltersCount(state) {
      return state.filters.reduce(
        (count, filter) =>
          count +
          filter.options.reduce(
            (optionCount, option) => optionCount + (option.active ? 1 : 0),
            0,
          ),
        0,
      );
    },
    activeFilters(state) {
      return state.filters
        .map((filter) => ({
          ...filter,
          options: filter.options.filter((opt) => opt.active),
        }))
        .filter((filter) => filter.options.length > 0);
    },
    // TODOS los filtros (incluyendo personalizados)
    allFilters(state) {
      try {
        return [
          ...(state.filters || []),
          ...(state.filtersCustoms || []).flatMap((f) => f.filters || []),
        ];
      } catch {
        return [];
      }
    },
  },

  actions: {
    // Breadcrumb
    updatedBreadcrumb(breadcrumb) {
      this.breadcrumb = breadcrumb;
    },
    // Limpiar header prinicipal
    cleanHeader() {
      this.breadcrumb = [];
      this.title = "";
      this.namePage = "";
      this.tag = "";
    },
    // Title Page
    updatedTitle(title) {
      this.title = title;
    },
    // Organizations
    async getAllOrganizations() {
      const API_PATH = "/organizations";
      try {
        const resp = await useCustomFetch("GET", API_PATH, {});
        if (resp?.docs?.length) {
          this.organizations = resp.docs;
        } else {
          this.organizations = [];
        }
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);
      }
    },
    async getOrganizationsByName(name) {
      const API_PATH = "/organizations";
      try {
        const resp = await useCustomFetch("GET", API_PATH, { name });
        if (resp?.docs?.length) {
          this.organizations = resp.docs;
        } else {
          this.organizations = [];
        }
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);
      }
    },
    // Languages
    async getAllLanguages() {
      const API_PATH = "/languages/getAll";
      try {
        const resp = await useCustomFetch("GET", API_PATH, {});
        if (resp.length) {
          this.languages = resp;
        } else {
          this.languages = [];
        }
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);
      }
    },
    // Paises
    async getCountries() {
      const API_PATH = "/countries";
      try {
        const resp = await useCustomFetch("GET", API_PATH, {});
        const lang = this.lang;

        if (resp?.docs?.length) {
          return resp.docs.sort((a, b) => {
            const nameA = a.name?.[lang] || "";
            const nameB = b.name?.[lang] || "";
            return nameA.localeCompare(nameB);
          });
        }

        return [];
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);
        return [];
      }
    },
    // actualizar Pagina
    updatedPage(path) {
      this.changeOrg = true;
      setTimeout(() => {
        this.changeOrg = false;
        if (path) navigateTo(path);
        this.loading = false;
      }, 0);
    },
    async uploadFile(file, type = "profile") {
      const baseURL = await api_rome();
      const API_PATH = `${baseURL}/files/uploadFile?type=${type}`;
      try {
        const resp = await useCustomFetchUrl("POST", API_PATH, file, "");
        if (resp) {
          toast.success("Imagen Actualizada.", { autoClose: 3000 });
        }
        return resp;
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);
      }
    },
    // Currencies
    async getMyCurrencies(store = false, base = null) {
      let API_PATH = "/currencies/getMycurrencies";
      if (base) API_PATH = API_PATH + `?currencyBase=${base}`;
      try {
        const resp = await useCustomFetch("GET", API_PATH);
        if (store) {
          let currencies = resp.currencies || [];
          if (resp.currency)
            currencies.unshift({ ...resp.currency, base: true });
          this.currencies = currencies;
        }
        return resp;
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);
        return { currencies: [] };
      }
    },
    // Search Currencies
    async searchCurrencies(str) {
      const API_PATH = `/currencies/search/${str}`;
      try {
        const resp = await useCustomFetch("GET", API_PATH);
        return resp;
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);
        return false;
      }
    },
    // Edit Currencies
    async editCurrencies(body) {
      const API_PATH = "/currencies/edit/";
      try {
        const resp = await useCustomFetch("PUT", API_PATH, {}, body);
        return resp;
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);
        return false;
      }
    },

    // date initial
    initDate() {
      if (!import.meta.client) return;

      const savedDateRaw = localStorage.getItem("currentDate");
      const savedYear = localStorage.getItem("year");
      const currentYear = new Date().getFullYear();

      function normalizeDate(date = {}) {
        return {
          manual: date.manual ?? false,
          ...date,
          rangeDate: {
            projects: date?.rangeDate?.projects ?? "noFilter",
            incomes: date?.rangeDate?.incomes ?? "noFilter",
          },
        };
      }

      // =========================
      //  EXISTE currentDate
      // =========================
      if (savedDateRaw) {
        const parsedDate = JSON.parse(savedDateRaw);
        const savedDate = normalizeDate(parsedDate);

        //  Migración (si faltaban campos)
        localStorage.setItem("currentDate", JSON.stringify(savedDate));

        // Año permanente
        if (!savedYear) {
          localStorage.setItem("year", currentYear);
          this.year = currentYear;
        }

        // Si Cambio de año
        if (Number(savedYear) !== currentYear) {
          const newDate = normalizeDate({
            ...getCurrentYearAndTimeZone(),
          });

          this.currentDate = newDate;
          this.year = currentYear;

          localStorage.setItem("currentDate", JSON.stringify(newDate));
          localStorage.setItem("year", currentYear);
          return;
        }

        //  Caso normal
        this.currentDate = savedDate;
        return;
      }

      // =========================
      // USUARIO NUEVO
      // =========================
      localStorage.setItem("year", currentYear);
      this.year = currentYear;

      const newDate = normalizeDate({
        ...getCurrentYearAndTimeZone(),
      });

      this.currentDate = newDate;
      localStorage.setItem("currentDate", JSON.stringify(newDate));
    },

    setDate(date) {
      const newDate = {
        ...date,
        manual: true,
      };

      this.currentDate = newDate;

      if (import.meta.client) {
        localStorage.setItem("currentDate", JSON.stringify(newDate));
      }
    },

    clearDate() {
      this.currentDate = null;
      this.year = null;
      if (import.meta.client) {
        localStorage.removeItem("currentDate");
        localStorage.removeItem("year");
      }
    },

    //Filters calendar
    createCalendarFilter(rangeDate, year, month, prop, zone) {
      return {
        rangeDate, // noFilter, all, etc.
        year,
        month,
        prop,
        zone,
      };
    },
    initFiltersCalendar() {
      const { year, month, prop } = getCurrentYearAndTimeZone();

      this.filtersCalendar = {
        incomes: {
          projects: this.createCalendarFilter("noFilter", year, month, prop),
          movements: this.createCalendarFilter("all", year, month, prop),
        },
        outcomes: {
          purchases: this.createCalendarFilter("noFilter", year, month, prop),
          purchasesDocs: this.createCalendarFilter(
            "noFilter",
            year,
            month,
            prop,
          ),
        },
        salesDocs: {
          sales: this.createCalendarFilter("noFilter", year, month, prop),
        },
        bankingTransactions: {
          transactions: this.createCalendarFilter(
            "noFilter",
            year,
            month,
            prop,
          ),
          banks: this.createCalendarFilter("noFilter", year, month, prop),
        },
      };
    },

    setFiltersCalendar(dataCalendar, module, view) {
      const { rangeDate, year, month, prop, zone } = dataCalendar;

      this.filtersCalendar[module][view] = this.createCalendarFilter(
        rangeDate,
        year,
        month,
        prop,
        zone,
      );
    },

    // Filters
    initFilters(body) {
      const { filters, filtersCustoms } = body;
      this.filters = filters;
      this.filtersCustoms = filtersCustoms?.map((filter) => {
        return {
          ...filter,
          filters: filter.filters.map((subF) => {
            return {
              ...subF,
              options: subF.options.map((op) => {
                return { ...op, custom: op.active };
              }),
            };
          }),
        };
      });
      this.newFilter = false;
      this.savingFilter = false;
    },

    // Filters con endpoints de contacto
    /**
     * Obtiene filtros de contactos según los parámetros enviados.
     *
     * @async
     * @function getFiltersTypeContacts
     * @param {Object} param - Parámetros para obtener los filtros.
     * @param {string} [param.filterType] - Tipo de filtro ejemplo: 'project', 'income', 'outcome'.
     * @param {string} [param.idProject] - ID del proyecto a filtrar en incomes ejemplo: '123456789'.
     * @param {string} [param.name] - Nombre o texto de búsqueda.
     * @param {string} [param.searchType] - Tipo de búsqueda ejemplo: 'contacts', 'projects', 'executives' etc'.
     * @param {string} [param.state] - Tipo de movimiento de income ejemplo: 'budget' o 'business'.
     * @returns {Promise<Object>} Retorna una promesa con los filtros de contactos.
     */
    async getFiltersTypeContacts(params = {}) {
      // filterType = "", idProject = "", name = "", searchType = "", state = ""
      const {
        filterType = "",
        idProject = "",
        name = "",
        searchType = "",
        state = "",
      } = params;

      const API_PATH = "/contacts/all/filters";

      try {
        const params = Object.fromEntries(
          Object.entries({
            filterType,
            project: idProject,
            name,
            searchType,
            state,
          }).filter(([_, v]) => v),
        );

        const resp = await useCustomFetch("GET", API_PATH, params);

        // Configuración de tipos de respuesta por medio del   (filterType)
        const responseConfig = {
          project: () => resp, // Retorna objeto completo
          income: () => resp || [], // Retorna objeto completo
          outcome: () => resp.docs || [], // Retorna array de docs
          default: () => resp.docs || [], // Fallback por defecto
        };

        // Retorna según el tipo o usa default
        return (responseConfig[filterType] || responseConfig.default)();
      } catch (error) {
        console.error(`Error fetching from ${API_PATH}:`, error);

        // Retornos por defecto según tipo
        const errorDefaults = {
          project: {},
          default: [],
        };

        return errorDefaults[filterType] || errorDefaults.default;
      }
    },
    // Limpiar Filtros
    cleanFilters() {
      this.filters = this.filters.map((filter) => {
        return {
          ...filter,
          options: filter.options.map((option) => {
            return { ...option, custom: false, active: false };
          }),
        };
      });
      this.filtersCustoms = this.filtersCustoms?.map((filter) => {
        return { ...filter, active: false };
      });
    },
  },
});
