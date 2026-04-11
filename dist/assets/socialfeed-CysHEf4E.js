import{f as x,g as p,c as d,d as m,q as f,a as h,h as b,i as L}from"./style-BFfoeqTT.js";import"./app-NQZPMTrD.js";const w=x();let v=!1;document.addEventListener("DOMContentLoaded",async()=>{const t=document.getElementById("socialFeed");t.innerHTML='<p class="text-muted">Loading Posts…</p>';try{const e=await C();if(e.length===0){t.innerHTML='<p class="text-muted">No posts yet. Be the first to post!</p>';return}t.innerHTML="",e.forEach(o=>{t.appendChild(T(o))}),v=!0,u()}catch(e){console.error("Failed to load social feed:",e),t.innerHTML='<p class="text-danger">Failed to load posts. Please try again.</p>'}});async function C(){const t=await p(d(m,"eventspots")),e=[];for(const o of t.docs){const s=o.data(),a=f(d(m,"eventspots",o.id,"updates"),h("timestamp","desc"));(await p(a)).docs.forEach(i=>{e.push({spotId:o.id,updateId:i.id,spotName:s.name,...i.data()})})}return e.sort((o,s)=>{const a=o.timestamp?.toDate().getTime()??0;return(s.timestamp?.toDate().getTime()??0)-a}),e}const S={1:{label:"Not Crowded",colour:"#00c853"},2:{label:"Slightly Busy",colour:"#aeea00"},3:{label:"Moderate",colour:"#ffd600"},4:{label:"Busy",colour:"#ff6d00"},5:{label:"Very Crowded",colour:"#d50000"}};function T(t){const e=document.createElement("div");e.className="card mb-3 shadow-sm";const o=t.timestamp?t.timestamp.toDate().toLocaleString("en-CA",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Unknown time",s=S[t.status]??{label:"Unknown",colour:"#9e9e9e"},a=`background-color:${s.colour};color:#fff;padding:3px 10px;border-radius:12px;font-size:13px;font-weight:600;`;e.innerHTML=`
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5 class="card-title mb-0">${t.spotName}</h5>
          <p class="mb-0" style="font-size:14px;font-weight:500;">${t.caption||""}</p>
          <p class="text-muted mb-0" style="font-size:13px;">${o}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span style="${a}">${t.status}/5 — ${s.label}</span>
        </div>
      </div>
    </div>

    <div class="card-body">
      ${t.details?`<p class="mb-3">${t.details}</p>`:'<p class="text-muted mb-3"><em>No description provided.</em></p>'}

      ${t.image?`<img src="${t.image}"
               alt="Crowd photo"
               class="img-fluid rounded mb-3"
               style="max-height:240px;object-fit:cover;width:100%;">`:""}

      <hr>
      <h6 class="mb-3">Comments</h6>

      <div class="comments-list mb-3">
        <p class="text-muted" style="font-size:13px;">Loading comments…</p>
      </div>

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
  `,e.dataset.status=t.status,e.dataset.spotName=(t.spotName||"").toLowerCase().trim();const n=e.querySelector(".comment-input"),i=e.querySelector(".comment-submit"),r=e.querySelector(".comment-feedback");return g(t.spotId,t.updateId,e),i.addEventListener("click",async l=>{l.stopPropagation(),await y(t.spotId,t.updateId,n,r,e)}),n.addEventListener("keydown",async l=>{l.key==="Enter"&&(l.stopPropagation(),await y(t.spotId,t.updateId,n,r,e))}),e}async function g(t,e,o){const s=o.querySelector(".comments-list");s.innerHTML='<p class="text-muted" style="font-size:13px;">Loading comments…</p>';try{const a=f(d(m,"eventspots",t,"updates",e,"comments"),h("timestamp","asc")),n=await p(a);if(n.empty){s.innerHTML='<p class="text-muted" style="font-size:13px;">No comments yet. Be the first to comment!</p>';return}s.innerHTML="",n.docs.forEach(i=>{s.appendChild(M(i.data()))})}catch(a){console.error("Failed to load comments:",a),s.innerHTML='<p class="text-danger" style="font-size:13px;">Could not load comments.</p>'}}function M(t){const e=document.createElement("div");e.className="mb-2 pb-2",e.style.borderBottom="1px solid #f0f0f0";const o=t.timestamp?t.timestamp.toDate().toLocaleString("en-CA",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"";return e.innerHTML=`
    <p class="mb-0" style="font-size:14px;">${t.text}</p>
    <p class="text-muted mb-0" style="font-size:12px;">${o}</p>
  `,e}async function y(t,e,o,s,a){const n=o.value.trim(),i=w.currentUser;if(s.textContent="",!n){s.style.color="#d50000",s.textContent="Comment cannot be empty.";return}if(!i){s.style.color="#d50000",s.textContent="You must be logged in to comment.";return}try{await b(d(m,"eventspots",t,"updates",e,"comments"),{text:n,owner:i.uid,timestamp:L()}),o.value="",s.style.color="#00c853",s.textContent="Comment posted!",setTimeout(()=>s.textContent="",2e3),await g(t,e,a)}catch(r){console.error("Failed to post comment:",r),s.style.color="#d50000",s.textContent="Failed to post comment. Try again."}}const c={status:new Set,location:new Set};function u(){v&&document.querySelectorAll("#socialFeed .card").forEach(t=>{const e=parseInt(t.dataset.status),o=t.dataset.spotName||"",s=c.status.size===0||c.status.has(e),a=c.location.size===0||[...c.location].some(n=>o.includes(n));t.style.display=s&&a?"":"none"})}document.addEventListener("click",t=>{const e=t.target.closest(".filter-btn");if(!e)return;const o=e.dataset.filter.toLowerCase(),s=e.innerText.trim().toLowerCase();if(o==="crowd-level"){const a=parseInt(s);if(isNaN(a))return;c.status.has(a)?(c.status.delete(a),e.classList.remove("active")):(c.status.add(a),e.classList.add("active"))}else o==="location"&&(c.location.has(s)?(c.location.delete(s),e.classList.remove("active")):(c.location.add(s),e.classList.add("active")));u()});document.addEventListener("click",t=>{t.target.closest("#clearFilterBtn")&&(c.status.clear(),c.location.clear(),document.querySelectorAll(".filter-btn.active").forEach(e=>e.classList.remove("active")),u())});
