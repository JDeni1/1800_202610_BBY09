import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";

// If you have custom global styles, import them as well:
import "../styles/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";

// If you have custom global styles, import them as well:
import "../styles/style.css";

function sayHello() {}
// document.addEventListener('DOMContentLoaded', sayHello);

/*For Profile Validation */
// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false,
    );
  });
})();
