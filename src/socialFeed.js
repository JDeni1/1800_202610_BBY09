import { db } from "./firebaseConfig.js";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const auth = getAuth();

// ------------------------------------------------------------
// On DOM ready — load and render all reports
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const feed = document.getElementById("socialFeed");
  feed.innerHTML = `<p class="text-muted">Loading reports…</p>`;

  try {
    const allReports = await getAllReports();

    if (allReports.length === 0) {
      feed.innerHTML = `<p class="text-muted">No reports yet. Be the first to post!</p>`;
      return;
    }

    feed.innerHTML = "";
    allReports.forEach((report) => {
      feed.appendChild(createReportCard(report));
    });
  } catch (err) {
    console.error("Failed to load social feed:", err);
    feed.innerHTML = `<p class="text-danger">Failed to load reports. Please try again.</p>`;
  }
});

// ------------------------------------------------------------
// Fetch every update from every eventspot, sorted newest first
// ------------------------------------------------------------
async function getAllReports() {
  const spotsSnapshot = await getDocs(collection(db, "eventspots"));
  const allReports = [];

  for (const spotDoc of spotsSnapshot.docs) {
    const spotData = spotDoc.data();

    const updatesQuery = query(
      collection(db, "eventspots", spotDoc.id, "updates"),
      orderBy("timestamp", "desc"),
    );
    const updatesSnapshot = await getDocs(updatesQuery);

    updatesSnapshot.docs.forEach((updateDoc) => {
      allReports.push({
        spotId: spotDoc.id,
        updateId: updateDoc.id,
        spotName: spotData.name,
        ...updateDoc.data(),
      });
    });
  }

  // Sort all reports across all spots newest first
  allReports.sort((a, b) => {
    const timeA = a.timestamp?.toDate().getTime() ?? 0;
    const timeB = b.timestamp?.toDate().getTime() ?? 0;
    return timeB - timeA;
  });

  return allReports;
}

// ------------------------------------------------------------
// Status config
// ------------------------------------------------------------
const STATUS_LABELS = {
  1: { label: "Not Crowded", colour: "#00c853" },
  2: { label: "Slightly Busy", colour: "#aeea00" },
  3: { label: "Moderate", colour: "#ffd600" },
  4: { label: "Busy", colour: "#ff6d00" },
  5: { label: "Very Crowded", colour: "#d50000" },
};

// ------------------------------------------------------------
// Build a collapsed card — title + time only, click to expand
// ------------------------------------------------------------
function createReportCard(report) {
  const card = document.createElement("div");
  card.className = "card mb-3 shadow-sm";

  const time = report.timestamp
    ? report.timestamp.toDate().toLocaleString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown time";

  const status = STATUS_LABELS[report.status] ?? {
    label: "Unknown",
    colour: "#9e9e9e",
  };
  const badgeStyle = `background-color:${status.colour};color:#fff;padding:3px 10px;border-radius:12px;font-size:13px;font-weight:600;`;

  card.innerHTML = `
    <!-- Collapsed header — always visible, click to expand -->
    <div class="card-body collapsed-view" style="cursor:pointer;">
      <div class="d-flex justify-content-between align-items-center">
        <div>
            <h5 class="card-title mb-0">${report.spotName}</h5>
            <p class="mb-0" style="font-size:14px;font-weight:500;">${report.caption || ""}</p>
            <p class="text-muted mb-0" style="font-size:13px;">${time}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span style="${badgeStyle}">${report.status}/5 — ${status.label}</span>
          <span class="toggle-arrow" style="font-size:18px;color:#888;">▼</span>
        </div>
      </div>
    </div>

    <!-- Expanded detail view — hidden by default -->
    <div class="expanded-view" style="display:none;border-top:1px solid #eee;">
      <div class="card-body">

        ${
          report.details
            ? `<p class="mb-3">${report.details}</p>`
            : `<p class="text-muted mb-3"><em>No description provided.</em></p>`
        }

        ${
          report.image_url
            ? `<img src="${report.image_url}"
                 alt="Crowd photo"
                 class="img-fluid rounded mb-3"
                 style="max-height:240px;object-fit:cover;width:100%;">`
            : ""
        }

        <hr>
        <h6 class="mb-3">Comments</h6>

        <!-- Comments injected here -->
        <div class="comments-list mb-3">
          <p class="text-muted" style="font-size:13px;">Loading comments…</p>
        </div>

        <!-- Add comment input -->
        <div class="d-flex gap-2">
          <input
            type="text"
            class="form-control comment-input"
            placeholder="Add a comment…"
            style="font-size:14px;"
          />
          <button class="btn btn-primary btn-sm comment-submit" style="white-space:nowrap;">
            Post
          </button>
        </div>
        <div class="comment-feedback mt-2" style="font-size:13px;"></div>

      </div>
    </div>
  `;

  // Toggle expand / collapse on header click
  const collapsedView = card.querySelector(".collapsed-view");
  const expandedView = card.querySelector(".expanded-view");
  const arrow = card.querySelector(".toggle-arrow");

  collapsedView.addEventListener("click", async () => {
    const isOpen = expandedView.style.display !== "none";
    if (isOpen) {
      expandedView.style.display = "none";
      arrow.textContent = "▼";
    } else {
      expandedView.style.display = "block";
      arrow.textContent = "▲";
      await loadComments(report.spotId, report.updateId, card);
    }
  });

  // Post comment on button click
  const commentInput = card.querySelector(".comment-input");
  const commentBtn = card.querySelector(".comment-submit");
  const commentFeedback = card.querySelector(".comment-feedback");

  commentBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await postComment(
      report.spotId,
      report.updateId,
      commentInput,
      commentFeedback,
      card,
    );
  });

  // Post comment on Enter key
  commentInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      await postComment(
        report.spotId,
        report.updateId,
        commentInput,
        commentFeedback,
        card,
      );
    }
  });

  return card;
}

// ------------------------------------------------------------
// Load comments for a specific update and render them
// ------------------------------------------------------------
async function loadComments(spotId, updateId, card) {
  const commentsList = card.querySelector(".comments-list");
  commentsList.innerHTML = `<p class="text-muted" style="font-size:13px;">Loading comments…</p>`;

  try {
    const q = query(
      collection(db, "eventspots", spotId, "updates", updateId, "comments"),
      orderBy("timestamp", "asc"),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      commentsList.innerHTML = `<p class="text-muted" style="font-size:13px;">No comments yet. Be the first!</p>`;
      return;
    }

    commentsList.innerHTML = "";
    snapshot.docs.forEach((doc) => {
      commentsList.appendChild(createCommentEl(doc.data()));
    });
  } catch (err) {
    console.error("Failed to load comments:", err);
    commentsList.innerHTML = `<p class="text-danger" style="font-size:13px;">Could not load comments.</p>`;
  }
}

// ------------------------------------------------------------
// Build a single comment element
// ------------------------------------------------------------
function createCommentEl(data) {
  const div = document.createElement("div");
  div.className = "mb-2 pb-2";
  div.style.borderBottom = "1px solid #f0f0f0";

  const time = data.timestamp
    ? data.timestamp.toDate().toLocaleString("en-CA", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  div.innerHTML = `
    <p class="mb-0" style="font-size:14px;">${data.text}</p>
    <p class="text-muted mb-0" style="font-size:12px;">${time}</p>
  `;
  return div;
}

// ------------------------------------------------------------
// Post a comment to Firestore under:
// eventspots/{spotId}/updates/{updateId}/comments
// ------------------------------------------------------------
async function postComment(spotId, updateId, inputEl, feedbackEl, card) {
  const text = inputEl.value.trim();
  const user = auth.currentUser;

  feedbackEl.textContent = "";

  if (!text) {
    feedbackEl.style.color = "#d50000";
    feedbackEl.textContent = "Comment cannot be empty.";
    return;
  }
  if (!user) {
    feedbackEl.style.color = "#d50000";
    feedbackEl.textContent = "You must be logged in to comment.";
    return;
  }

  try {
    await addDoc(
      collection(db, "eventspots", spotId, "updates", updateId, "comments"),
      {
        text: text,
        owner: user.uid,
        timestamp: serverTimestamp(),
      },
    );

    inputEl.value = "";
    feedbackEl.style.color = "#00c853";
    feedbackEl.textContent = "Comment posted!";
    setTimeout(() => (feedbackEl.textContent = ""), 2000);

    // Reload comments to show the new one immediately
    await loadComments(spotId, updateId, card);
  } catch (err) {
    console.error("Failed to post comment:", err);
    feedbackEl.style.color = "#d50000";
    feedbackEl.textContent = "Failed to post comment. Try again.";
  }
}
