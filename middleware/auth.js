export default defineNuxtRouteMiddleware((to) => {
  const tokenCookie = useCookie("access_token");

  // DEV BYPASS
  if (import.meta.dev) {
    tokenCookie.value = "local-dev-token"; // siempre forzar en dev
    if (to.path === "/home" || to.path === "/") return navigateTo("/incomes");
    return;
  }

  // No autenticado -> login
  if (!tokenCookie.value) {
    abortNavigation();
    return navigateTo("/login");
  }

  // Redirigir /home -> /incomes
  if (to.path === "/home" || to.path === "/") {
    abortNavigation();
    return navigateTo("/incomes");
  }
});
