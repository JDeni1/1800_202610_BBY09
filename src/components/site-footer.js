class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
            <!-- Footer: single source of truth -->
            <footer class="bg-dark text-white text-center p-3 mt-5">
      <p class="mb-0">© 2026 Team BBY09</p>
    </footer>
        `;
  }
}

customElements.define("site-footer", SiteFooter);
