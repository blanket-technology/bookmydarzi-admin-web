export function validateCaptcha(captchaInput, generatedCaptcha) {
  return captchaInput.trim().toLowerCase() === generatedCaptcha.trim().toLowerCase();
}

export function getGreetingName(email) {
  const firstName = email ? email.split("@")[0].split(/[.\d_]/)[0] : "";
  if (!firstName) return "";
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

export function setLoginFavicon() {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.getElementsByTagName("head")[0].appendChild(link);
  }
  link.href = "/Logo.jpg";
  link.type = "image/png";
}
