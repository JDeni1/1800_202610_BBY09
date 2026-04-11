import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "./styles/style.css";
import { loginUser, signupUser, authErrorMessage } from "./authentication.js";

/* The entry point to reading the page.*/
function initAuthUI() {
  const alertEl = document.getElementById("authAlert");
  const loginView = document.getElementById("loginView");
  const signupView = document.getElementById("signupView");
  const toSignupBtn = document.getElementById("toSignup");
  const toLoginBtn = document.getElementById("toLogin");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  const redirectUrl = "index.html";

  /* Expressive naming : A function that hides the login view */
  function setVisible(el, visible) {
    el.classList.toggle("d-none", !visible);
  }

  let errorTimeout;

  /* Puts error messages as alerts and makes it visible for a certain number of times  */
  function showError(msg) {
    alertEl.textContent = msg || "";
    alertEl.classList.remove("d-none");
    //if user triggers twice, clears the first trigger before moving on to the second one.
    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(hideError, 5000);
  }

  function hideError() {
    alertEl.classList.add("d-none");
    alertEl.textContent = "";
    clearTimeout(errorTimeout);
  }

  /* Prevents double submissions : if the form is null, it won't crash.
    That way when users press submit with an empty form, the button will be disabled. */
  function setSubmitDisabled(form, disabled) {
    const submitBtn = form?.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = disabled;
  }

  /*Call back functions where when clicked determines if the (login/sign up) view is visible. 
    This will display the log in form when the user clicks the log in button.*/
  toSignupBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    hideError();
    setVisible(loginView, false);
    setVisible(signupView, true);
    signupView?.querySelector("input")?.focus();
  });

  toLoginBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    hideError();
    setVisible(signupView, false);
    setVisible(loginView, true);
    loginView?.querySelector("input")?.focus();
  });

  /* Navigates from login/sign up form to index.html */
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const email = document.querySelector("#loginEmail")?.value?.trim() ?? "";
    const password = document.querySelector("#loginPassword")?.value ?? "";

    if (!email || !password) {
      showError("Please enter your email and password.");
      return;
    }

    setSubmitDisabled(loginForm, true);
    // try/catch for error handling
    try {
      await loginUser(email, password);
      location.href = redirectUrl;
    } catch (err) {
      showError(authErrorMessage(err));
      console.error(err);
      // Will run regardless of error
    } finally {
      setSubmitDisabled(loginForm, false);
    }
  });

  /* The same concept on login, but for sign up. */
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const name = document.querySelector("#signupName")?.value?.trim() ?? "";
    const email = document.querySelector("#signupEmail")?.value?.trim() ?? "";
    const password = document.querySelector("#signupPassword")?.value ?? "";

    if (!name || !email || !password) {
      showError("Please fill in name, email, and password.");
      return;
    }

    setSubmitDisabled(signupForm, true);
    try {
      await signupUser(name, email, password);
      location.href = redirectUrl;
    } catch (err) {
      showError(authErrorMessage(err));
      console.error(err);
    } finally {
      setSubmitDisabled(signupForm, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", initAuthUI);
