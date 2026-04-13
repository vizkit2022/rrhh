import { transformedDate, generateIdByDate } from "@/utils/helpers";
import { version } from "vue";

// Formatea numeros -> mayores a 9 cifras = 123456789123 '$123.456M' y menores 12345678 '$12.345.678'
export const formatMoneyWithSuffix = (
  number,
  showMoney = true,
  money = "$",
) => {
  const mount = number.toString().split(",")[0];
  if (mount.length <= 9) {
    return `${showMoney ? money : ""} ${mount.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ".",
    )}`;
  }
  return `${showMoney ? money : ""} ${mount
    .slice(0, -6)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}M`;
};

// Formatea los tabs que llegan desde el back
export const mapperTabs = (tabs, states) => {
  const labels = {
    projects: "Proyectos",
    movements: "Movimientos",
    opportunity: "Oportunidades",
    budget: "Cotizaciones",
    business: "Negocios",
  };

  const translateRoute = {
    projects: "modules.incomes.pages.projects.tabs.tab1.label",
    movements: "Movimientos",
    opportunity: "Oportunidades",
    budget: "modules.incomes.pages.projects.tabs.tab2.label",
    business: "modules.incomes.pages.projects.tabs.tab3.label",
  };

  return tabs
    .filter((t) => states.some((r) => r.params == t.props))
    .map((t, pos) => ({
      label: labels[t.props],
      translateRoute: translateRoute[t.props],
      icon: pos === 0 ? "folder" : "", // Solo el primer elemento tendrá el icono "folder"
      tab: pos,
      indicator: true,
      number: t.mount || 0,
      disabled: false,
      main: false,
    }));
};

// Formatea las metricas que llegan desde el back
export const mapperMetrics = (metrics) => {
  const labels = {
    sumPrice: {
      label: "Ventas" /* TEMPORAL SE TIENE QUE IR */,
      icon: "contabilidad",
    },
    budgetUtility: {
      label: "Utilidad Presupuestada" /* TEMPORAL SE TIENE QUE IR */,
      icon: "contabilidad",
    },
    cost: {
      label: "Costo Total" /* TEMPORAL SE TIENE QUE IR */,
      icon: "compras",
    },
    projectedUtility: {
      label: "Utilidad Proyectada" /* TEMPORAL SE TIENE QUE IR */,
      icon: "contabilidad",
    },
    total: {
      label: "Total" /* TEMPORAL SE TIENE QUE IR */,
      icon: "shopping-cart",
    },
    documented: {
      label: "Documentado" /* TEMPORAL SE TIENE QUE IR */,
      icon: "invoice",
    },
    undocumented: {
      label: "Por Documentar" /* TEMPORAL SE TIENE QUE IR */,
      icon: "invoice",
    },
    paid: {
      label: "Pagado" /* TEMPORAL SE TIENE QUE IR */,
      icon: "pay",
    },
    unpaid: {
      label: "Por Pagar" /* TEMPORAL SE TIENE QUE IR */,
      icon: "pay",
    },
  };

  return metrics.map((m) => ({
    label: labels[m.props]?.label || "cancel",
    icon: labels[m.props]?.icon || "cancel",
    mount: m.mount,
    percentage: m.percentage || 0,
  }));
};

// Formatea las columnas de la tabla BasicInfo
export const mapperColumnsBasicInfo = (columsUser, columnsDefault) => {
  const arrayFiltrado = columsUser.filter((item) => item.val === true);

  const arrayFiltradoYMatched = arrayFiltrado.map((item1) => {
    const matchedItem = columnsDefault.find(
      (item2) => item2.property === item1.prop,
    );

    return matchedItem;
  });

  return arrayFiltradoYMatched;
};

// Formatea la respuesta del get de Pojects
export const mapperProjects = (data) => {
  return data.map((element) => {
    return {
      path: `/incomes/project/${element._id}`,
      selected: false,
      state: "cotización",
      id: element._id,
      idNumber: element?.idNumber ?? "",

      name: element?.name ?? "-",

      modification: transformedDate(element.updatedAt ?? "-"),

      client:
        (element.client?.user?.name?.first ?? "") +
        (element.client?.user?.name?.first && element.client?.user?.name?.last
          ? " "
          : "") +
        (element.client?.user?.name?.last ?? "No registrado"),

      client_img: element.client?.user?.imgUrl ?? "",

      executive:
        (element.executive?.user?.name?.first ?? "") +
        (element.executive?.user?.name?.first &&
        element.executive?.user?.name?.last
          ? " "
          : "") +
        (element.executive?.user?.name?.last ?? "No registrado"),

      executive_img: element.executive?.user?.imgUrl ?? "",

      contact:
        (element.contact?.user?.name?.first ?? "") +
        (element.contact?.user?.name?.first && element.contact?.user?.name?.last
          ? " "
          : "") +
        (element.contact?.user?.name?.last ?? "No registrado"),

      contact_img: element.contact?.user?.imgUrl ?? "",

      totalPrice: element.numbers?.sumPrice?.value ?? "$ 0",
      sumBudget: element.numbers?.sumBudget?.value ?? "$ 0",
      projectedUtility: element.numbers?.projectedUtility?.value ?? "$ 0",
      totalCost: element.numbers?.cost?.value ?? "$ 0",
      budgetMargin: element.numbers?.budgetMargin?.value ?? "$ 0",
      variancePercentage: "30%",
      varianceReal: "$ 234.23",
      _id: element._id,
      marginReal: element.numbers?.projectedMargin?.value ?? "$ 0",
    };
  });
};

// Formatea la respuesta del get de Movements
export const mapperMovements = (data) => {
  return data.map((element) => {
    return {
      selected: element.false,
      state: element?.state ?? "",
      id: element._id,
      _id: element._id,

      idNumber: element?.idNumber ?? "",

      name: element?.name ?? "-",

      path: `/incomesv2/project/${element.project ?? "withoutProjectId"}/income/${
        element._id
      }`,

      modification: transformedDate(element.updatedAt ?? "-"),

      client:
        (element.client?.user?.name?.first ?? "") +
        (element.client?.user?.name?.first && element.client?.user?.name?.last
          ? " "
          : "") +
        (element.client?.user?.name?.last ?? "No registrado"),

      client_img: element.client?.user?.imgUrl ?? "",

      executive:
        (element.executive?.user?.name?.first ?? "") +
        (element.executive?.user?.name?.first &&
        element.executive?.user?.name?.last
          ? " "
          : "") +
        (element.executive?.user?.name?.last ?? "No registrado"),

      executive_img: element.executive?.user?.imgUrl ?? "",

      contact:
        (element.owner?.user?.name?.first ?? "") +
        (element.owner?.user?.name?.first && element.owner?.user?.name?.last
          ? " "
          : "") +
        (element.owner?.user?.name?.last ?? "No registrado"),

      contact_img: element.owner?.user?.imgUrl ?? "",

      totalPrice: element.numbers?.sumPrice?.value ?? "$ 0",
      sumBudget: element.numbers?.sumBudget?.value ?? "$ 0",
      projectedUtility: element.numbers?.projectedUtility?.value ?? "$ 0",
      totalCost: element.numbers?.cost?.value ?? "$ 0",
      budgetMargin: element.numbers?.budgetMargin?.value ?? "$ 0",
      variancePercentage: "30%",
      varianceReal: "$ 234.23",
      marginReal: element.numbers?.projectedMargin?.value ?? "$ 0",
    };
  });
};

// Formatea la respuesta del get de outcomes -> /outcomes
export const mapperOutcomes = (data) => {
  return data.map((element) => {
    return {
      selected: false,
      type: "OC", // o FXR

      supplier: "Fabian Pacherres",

      supplierImg:
        "https://www.directvsports.com/__export/1679609602375/sites/dsports/img/2023/03/23/20230323_071321962_iui0qif2ukkk1s6mv0ohrri5q.jpg_1301049368.jpg",

      reference: "Santiago Bernabeu",
      movementOutcomes: {
        textMain: "Parques Nacionales",
        textSecond: "Turismo Chile",
      },

      idDoc: 1242,
      labelDoc: "F.E",
      countDoc: 2,

      issueDate: transformedDate("2023-10-24T17:18:17.111Z"),
      expiryDate: transformedDate("2023-10-26T17:18:17.111Z"),

      amount: "$ 232,123.02",
      toPay: "$ 165.87",
      stateOutcomes: "Vinculado a OC",
    };
  });
};

// Formatea una linea por defecto
export const mapperLineDefault = (defaultAmount) => {
  return {
    _id: "",
    __id: "",
    level: 1,
    name: "",
    description: {
      htmlText: "",
    },
    observation: "",
    code: "",
    isVisible: true,
    selected: false,
    changeBudget: false,
    changeBudgetTax: false,
    changeSurcharge: false,
    change: false,
    expand: false,
    isSurcharge: false,
    isCut: false,
    cut: null,
    superiorCut: null,
    order: 0,
    isSmartLine: false,
    isParent: false,
    parent: "",
    parents: [],
    children: [],
    numberChildren: 0,
    purchasesBlocked: false,
    idKey: "",
    version: 0,
    taxes: [],
    currency: "",
    organization: "",
    numbers: {
      isHotbudget: false,
      amountHotbudget: {
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
      dscto: {
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
      days: {
        value: "1",
        lastValue: "1",
        number: 1,
        lastNumber: 1,
      },
      percentage: {
        value: "0 %",
        lastValue: "0 %",
        number: 0,
        lastNumber: 0,
      },
      total: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      sumPriceSmart: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      budgetUtility: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      budgetMargin: {
        value: "0 %",
        lastValue: "0 %",
        number: 0,
        lastNumber: 0,
      },
      base: {
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
      rate: {
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
      overTime1: {
        overTimeValue: "0",
        overTimeNumber: 0,
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
      overTime2: {
        overTimeValue: "0",
        overTimeNumber: 0,
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
      overTime3: {
        overTimeValue: "0",
        overTimeNumber: 0,
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
      amount1: {
        value: "1",
        lastValue: "1",
        number: 1,
        lastNumber: 1,
      },
      amount2: {
        value: "1",
        lastValue: "1",
        number: 1,
        lastNumber: 1,
      },
      amount3: {
        value: "0",
        lastValue: "0",
        number: 1,
        lastNumber: 1,
      },
      price: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
        valueNoSymbol: "0",
        lastValueNoSymbol: "0",
      },
      sumPrice: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      budget: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
        valueNoSymbol: "0",
        lastValueNoSymbol: "0",
      },
      budgetAmount1: {
        value: "1",
        lastValue: "1",
        number: 1,
        lastNumber: 1,
      },
      budgetAmount2: {
        value: "1",
        lastValue: "1",
        number: 1,
        lastNumber: 1,
      },
      budgetAmount3: {
        value: "0",
        lastValue: "0",
        number: 1,
        lastNumber: 1,
      },
      sumBudget: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      cost: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      toSpend: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      efc: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      varianceMount: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      variancePerc: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      projectedUtility: {
        value: defaultAmount,
        lastValue: defaultAmount,
        number: 0,
        lastNumber: 0,
      },
      projectedMargin: {
        value: "0 %",
        lastValue: "0 %",
        number: 0,
        lastNumber: 0,
      },
    },
    income: {
      _id: "",
      name: "",
      project: {
        _id: "",
        name: "",
      },
    },
    tax: null,
    surchargesLines: [],
    surchargesLinesBudget: [],
    owner: {
      _id: "",
      username: "",
      roles: [],
      imgUrl: "",
    },
    users: [],
    creator: {
      _id: "",
      username: "",
      roles: [],
      imgUrl: "",
    },
  };
};

// Formatea la busqueda de usuarios por su nombre para usarlo en el select o search
export const mapperSearchUsers = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((l) => ({
    label: `${l.name?.first || ""} ${l.name?.last || ""}`,
    text:
      Array.isArray(l.emails) && l.emails.length > 0
        ? l.emails[0]?.email || ""
        : "",
    img: l.imgUrl || "",
    oldData: { ...l },
  }));
};

// Formatea la busqueda de los roles por su nombre para usarlo en el select o search
export const mapperSearchRoles = (list, lang) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((l) => ({
    label: l.name[lang] || "",
    oldData: { ...l },
  }));
};

// Formatea la busqueda de los idiomas por su nombre para usarlo en el select o search
export const mapperSearchLanguages = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((l) => ({
    label: l.spanish || "",
    oldData: { ...l },
  }));
};

// Formatea la busqueda de las empresas por su nombre para usarlo en el select o search
export const mapperSearchOrganizations = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((l) => ({
    label: l.razon_social || "",
    text: l.rut || "",
    oldData: { ...l },
  }));
};

// Formatea la respuesta del get de Crew
export const mapperCrew = (data) => {
  return data.map((element) => {
    return {
      selected: false,
      id: element?.user?._id ?? null,
      user: element?.user ?? {},
      member: element?.member,

      nameUser: `${element.user?.name?.first} ${element.user?.name?.last}`,
      nameUser_img: element.user?.imgUrl ?? null,
      first: element.user?.name.first ?? "",
      last: element.user?.name.last ?? "",
      nickName: element.user?.name.nickName ?? "",
      emailUser: element.user?.emails[0]?.email ?? "",

      path: null,

      // company: element?.companies[0]?.razon_social ?? "-",
      // companyId: element?.companies[0]?._id ?? "-",

      rol: element.roles ?? [],

      lastConnection: transformedDate(element.user?.lastLogin ?? "-"),
      assignmentLines: element.user?.assignmentLines ?? 0,

      nameCreator: `${element.creator?.name?.first || "Desconocido"} ${
        element.creator?.name?.last || ""
      }`,
      nameCreator_img: element.creator?.imgUrl ?? null,

      profile: null,
    };
  });
};

// Formatea la organizacion
export const mapperOrganization = (data) => {
  //para agregar numero al azar para engañar el navegador y no intente recuperar las imagenes desde la cache
  const addRandomQuery = (url) => {
    if (!url) return "";

    // Elimina cualquier parámetro 'r' existente
    const cleanedUrl = url.replace(/([?&])r=\d+(\.\d+)?(&|$)/, "$1");

    // Añade el nuevo número aleatorio
    const separator = cleanedUrl.includes("?") ? "&" : "?";
    return `${cleanedUrl}${separator}r=${Math.random()}`;
  };

  return {
    rut: 0,
    dv: data?.dv ?? "",
    isActive: data?.isActive ?? true,
    razon_social: data?.razon_social ?? "",
    owner: data?.owner ?? "",
    default: data?.default ?? false,
    name: data?.name ?? "",
    country: data?.country ?? "",
    giro: data?.giro ?? "",
    idNumber: data?.idNumber ?? "",
    imgUrl: data?.imgUrl ? addRandomQuery(data.imgUrl) : "",
    coverUrl: data?.coverUrl ?? "",
    createdAt: data?.createdAt ?? "",
    updatedAt: data?.updatedAt ?? "",
    currency: data?.currency ?? "",
    formData: "",
    color: data?.color ?? "",
    users: data?.users ?? [],
    __v: data?.__v ?? 0,
    _id: data?._id ?? "",
    address: {
      street: {
        name: data?.address?.street?.name ?? "",
        place_id: data?.address?.street?.place_id ?? "",
      },
      number: data?.address?.number ?? "",
      city: {
        name: data?.address?.city?.name ?? "",
        place_id: data?.address?.city?.place_id ?? "",
      },
      region: {
        name: data?.address?.region?.name ?? "",
        place_id: data?.address?.region?.place_id ?? "",
      },
      country: {
        name: data?.address?.country?.name ?? "",
        place_id: data?.address?.country?.place_id ?? "",
        short_name: data?.address?.country?.short_name ?? "",
      },
      postal_code: data?.address?.postal_code ?? "",
    },
    contact: {
      phone: data?.contact?.phone ?? "",
      phone2: data?.contact?.phone2 ?? "",
      email: data?.contact?.email ?? "",
      email2: data?.contact?.email2 ?? "",
      webSite: data?.contact?.webSite ?? "",
    },
    otherAccounts: {
      behance: data?.otherAccounts?.behance ?? "",
      facebook: data?.otherAccounts?.facebook ?? "",
      github: data?.otherAccounts?.github ?? "",
      instagram: data?.otherAccounts?.instagram ?? "",
      linkedin: data?.otherAccounts?.linkedin ?? "",
      soundCloud: data?.otherAccounts?.soundCloud ?? "",
      spotify: data?.otherAccounts?.spotify ?? "",
      twitter: data?.otherAccounts?.twitter ?? "",
      vimeo: data?.otherAccounts?.vimeo ?? "",
      web: data?.otherAccounts?.web ?? "",
      youtube: data?.otherAccounts?.youtube ?? "",
    },
    owner: {
      _id: data?.owner?._id ?? "",
      username: data?.owner?.username ?? "",
    },
    v3: {
      status: data?.v3?.status ?? false,
      url: data?.v3?.url ?? "",
    },
    printPdf: {
      color: data?.printPdf?.color ?? "",
      solidColor: data?.printPdf?.solidColor ?? false,
      isHeaderTextWhite: data?.printPdf?.isHeaderTextWhite ?? false,
      shouldShowZeroAmountLines:
        data?.printPdf?.shouldShowZeroAmountLines ?? true,
      showOvertime: data?.printPdf?.showOvertime ?? true,
      showValues: data?.printPdf?.showValues ?? true, // Nueva
      showAmounts: data?.printPdf?.showAmounts ?? true, // Nueva
      showUnit: data?.printPdf?.showUnit ?? true, // Nueva
      showTotal: data?.printPdf?.showTotal ?? true, // Nueva
      showDescriptionLine: data?.printPdf?.showDescriptionLine ?? true, // Nueva
      showDescriptionGroup: data?.printPdf?.showDescriptionGroup ?? true, // Nueva
    },
    invoicing: data?.invoicing ?? {},
  };
};
