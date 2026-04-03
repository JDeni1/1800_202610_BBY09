import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig.js";
import { logoutUser } from "../authentication.js";

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
    this.renderAuthControls();
  }

  renderNavbar() {
    this.innerHTML = `
      <nav class="sidebar" id="sidebar">
        <button class="sidebar-toggle" id="sidebarToggle">☰</button>

        <div class="nav-brand">
          <img src="/images/ApplogowithoutName.png" height="28">
          CrowdControl
        </div>

        <ul>
          <li>
            <span><a href="map.html"><span class="icon">
            <img src="/images/maps.png" height="28">
            </span>
            <span class="nav-mini-label">Map</span>
            <span class="nav-label">Heatmap</span></a>
          </li>
          <li>
            <a href="newPost.html"><span class="icon">
            <img src="/images/post.png" height="28"></span>
            <span class="nav-mini-label">Post</span><span class="nav-label">New Post</span></a></li>
          <li>
            <span><a href="socialfeed.html">
            <span class="icon"><img src="/images/people.png" height="28"></span>
            <span class="nav-mini-label">Social</span><span class="nav-label">Social</span></a>
         </li>
          <li>
            <span><a href="profile.html">
            <span class="icon"><img src="/images/user.png" height="28"></span>
            <span class="nav-mini-label">Profile</span><span class="nav-label">Profile</span></a>
          </li>
        </ul>

        <div id="authControls" class="auth-controls"></div>
      </nav>
    `;

    document.getElementById("sidebarToggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
      const searchBar = document.getElementById("search-bar");
      if (searchBar) searchBar.classList.toggle("sidebar-open");
    });
  }

  async updateProfileIcon(user) {
    const icon = this.querySelector("#profileNavIcon");

    if (!user) {
      icon.innerHTML = "👤";
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();

        if (data.profileImage) {
          icon.innerHTML = `<img src="${data.profileImage}
          " style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`;
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  renderAuthControls() {
    const authControls = this.querySelector("#authControls");
    onAuthStateChanged(auth, (user) => {
      this.updateProfileIcon(user);

      if (user) {
        authControls.innerHTML = `<button class="btn btn-outline-dark w-100" id="signOutBtn" type="button"><img src = "/images/log-out.png" height = "28">
         <span class="nav-label">Log out</span></button>`;
        authControls
          .querySelector("#signOutBtn")
          .addEventListener("click", logoutUser);
      } else {
        authControls.innerHTML = `<a class="btn btn-outline-dark w-100" href="/login.html">
        LOGIN<span class="nav-label"></span></a>`;
      }
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
