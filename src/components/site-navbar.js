import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "/src/firebaseConfig.js";
import { logoutUser } from "/src/authentication.js";

class SiteNavbar extends HTMLElement {
  constructor() {
    super();
    this.renderNavbar();
    this.renderAuthControls();
  }

  renderNavbar() {
    this.innerHTML = `
      <style>
        .sidebar {
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          width: 60px;
          background: #989fa9;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 0;
          transition: width 0.25s ease;
          overflow: hidden;
          z-index: 1000;
        }
        .sidebar.open {
          width: 220px;
          align-items: flex-start;
          padding: 12px;
        }
        .sidebar-toggle {
          background: none;
          border: none;
          color: white;
          font-size: 22px;
          cursor: pointer;
          margin-bottom: 24px;
          padding: 0 4px;
          align-self: center;
        }
        .nav-brand {
          display: none;
          color: white;
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 20px;
          white-space: nowrap;
          align-items: center;
          gap: 8px;
        }
        .sidebar.open .nav-brand {
          display: flex;
        }
        .sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
          width: 100%;
        }
        .sidebar ul li a {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          text-decoration: none;
          padding: 10px 8px;
          border-radius: 6px;
          white-space: nowrap;
          transition: background 0.15s;
          justify-content: center;
        }
        .sidebar ul li a:hover {
          background: rgba(255,255,255,0.15);
        }
        .sidebar ul li a .icon {
          font-size: 20px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
        }
        .nav-label {
          display: none;
        }
        .sidebar.open .nav-label {
          display: inline;
        }
        .auth-controls {
          margin-top: auto;
          width: 100%;
          padding-top: 12px;
        }
        .auth-controls button,
        .auth-controls a {
          width: 100%;
          white-space: nowrap;
        }
      </style>

      <nav class="sidebar" id="sidebar">
        <button class="sidebar-toggle" id="sidebarToggle">☰</button>

        <div class="nav-brand">
          <img src="/images/ApplogowithoutName.png" height="28">
          CrowdControl
        </div>

        <ul>
          <li><a href="index.html"><span class="icon">🏠</span><span class="nav-label">Home</span></a></li>
          <li><a href="map.html"><span class="icon">🗺️</span><span class="nav-label">Heatmap</span></a></li>
          <li><a href="newPost.html"><span class="icon">✏️</span><span class="nav-label">New Post</span></a></li>
          <li><a href="socialfeed.html"><span class="icon">💬</span><span class="nav-label">Social</span></a></li>
          <li><a href="profile.html"><span class="icon" id="profileNavIcon">👤</span><span class="nav-label">Profile</span></a></li>
        </ul>

        <div id="authControls" class="auth-controls"></div>
      </nav>
    `;

    document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('search-bar').classList.toggle('sidebar-open');
});
    document.getElementById("sidebarToggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
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
          icon.innerHTML = `<img src="${data.profileImage}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`;
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
        authControls.innerHTML = `<button class="btn btn-outline-light w-100" id="signOutBtn" type="button"><img src = "/images/log-out.png" height = "28"> <span class="nav-label">Log out</span></button>`;
        authControls
          .querySelector("#signOutBtn")
          .addEventListener("click", logoutUser);
      } else {
        authControls.innerHTML = `<a class="btn btn-outline-light w-100" href="/login.html"><img src = "/images/log-in.png" height = "28"><span class="nav-label">Log in</span></a>`;
      }
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
