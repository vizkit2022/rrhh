import useAuthStore from "@/stores/auth";
const authStore = useAuthStore();

export default defineNuxtRouteMiddleware((to, from) => {
  const tokenCookie = useCookie("access_token");

  if (tokenCookie.value) {
    if (to.path === "/login/validation") {
      if (!authStore.validationPage) {
        abortNavigation();
        return navigateTo("/login");
      }
    } else if (to.path === "/login/welcome") {
      if (!authStore.welcome) {
        abortNavigation();
        return navigateTo("/login");
      }
    } else if (to.path === "/login/new-pass") {
      if (!authStore.validationForgot) {
        abortNavigation();
        return navigateTo("/login");
      }
      return;
    } else if (to.path === "/login/validation-forgot") {
      return;
    } else {
      return navigateTo("/incomes");
    }
  } else {
    if (to.path === "/login/validation" || to.path === "/login/welcome") {
      return navigateTo("/login");
    } else if (
      to.path === "/login/validation-forgot" ||
      to.path === "/login/new-pass"
    ) {
      if (!authStore.validationForgot) {
        abortNavigation();
        return navigateTo("/login");
      }
    }
  }
});
