// utils/taxAuthority.js  o  composables/useTaxAuthority.js
import { computed } from "vue";
import useOrganizationStore from "@/stores/organization";
import useSalesStore from "@/stores/sales";

export const hasTaxProvidesNationalTaxAuthority = (tax) => {
  const organizationStore = useOrganizationStore();
  const salesStore = useSalesStore();

  const countryCode = organizationStore?.organization?.country?.code;
  const taxCode = salesStore?.formDocInvoice?.typeDocument?.taxCode;

  if (!countryCode || !taxCode) return false;

  switch (countryCode) {
    case "CL":
      if ([33, 39].includes(taxCode)) {
        const ivaRegex = /\biva\b/i;
        return ivaRegex.test(tax.name);
      }
      return false;

    case "CO":
    case "MX":
    case "PE":
    case "US":
    default:
      return false;
  }
};

export const hasProvidesNationalTaxAuthority = computed(() => {
  const organizationStore = useOrganizationStore();
  const salesStore = useSalesStore();

  const countryCode = organizationStore?.organization?.country?.code;
  const statusSalesDoc = {
    CL: salesStore?.sale?.salesDoc?.invoicingInformationCL?.status,
  };

  switch (countryCode) {
    case "CL":
      if (
        ["generated", "sent", "accepted", "rejected"].includes(
          statusSalesDoc?.CL,
        )
      ) {
        return true;
      } else {
        return false;
      }
    default:
      return false;
  }
});
