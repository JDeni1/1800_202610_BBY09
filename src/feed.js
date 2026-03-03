/*Content */
const form = document.getElementById("postForm");
const feed = document.getElementById("feed");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const content = document.getElementById("content").value;
  const fileInput = document.getElementById("imageFile");
  const file = fileInput.files[0];

  // Function to create and add post
  function createPost(imageSrc = "") {
    const post = document.createElement("div");
    post.className = "card mb-3";

    post.innerHTML = `
      ${imageSrc ? `<img src="${imageSrc}" class="card-img-top" alt="post image">` : ""}
      <div class="card-body">
        <h6 class="card-title mb-0">${username}</h6>
        <small class="text-muted">Just now</small>
        <p class="card-text mt-2">${content}</p>
      </div>
    `;

    feed.prepend(post);
    form.reset();
  }

  // If user uploaded an image
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      createPost(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    createPost();
  }
});

// After feed.prepend(post);
let posts = JSON.parse(localStorage.getItem("posts") || "[]");

// Save the new post
posts.unshift({
  username,
  content,
  image: imgSrc || "",
});

localStorage.setItem("posts", JSON.stringify(posts));
