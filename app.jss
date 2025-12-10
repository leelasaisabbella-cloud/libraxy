/* Atlas Library — Frontend demo
   - Background slider with large book images
   - Live search using Open Library search.json
   - Suggestions dropdown + results grid
   - Rent modal (demo, no payments)
*/

const bgImages = [
  // Large, stylish book/stack images (Unsplash). Replace with your own for production.
  "https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=1800&auto=format&fit=crop&ixlib=rb-4.0.3&s=a3b1a1c62f3d4dfc7b3c4e5e5099f1ea",
  "https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=1800&auto=format&fit=crop&ixlib=rb-4.0.3&s=9a8d86cb3f1c29b2be6d446b6f7c6756",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1800&auto=format&fit=crop&ixlib=rb-4.0.3&s=9adb6c4ea2d8ee3b2a4c261c84b10d0b",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1800&auto=format&fit=crop&ixlib=rb-4.0.3&s=2d61362a3ae0e5d1d8b9c8e7bde4cda9",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1800&auto=format&fit=crop&ixlib=rb-4.0.3&s=84a6bbf642e3f2d2d84d85b6e9f235b8"
];

const sliderRoot = document.getElementById("bg-slider");
const suggestionsEl = document.getElementById("suggestions");
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("search-btn");
const quickTags = document.querySelectorAll(".quick-tags button");
const resultsGrid = document.getElementById("results");
const noResults = document.getElementById("no-results");

let slides = [];
let slideIndex = 0;
let slideTimer = null;

function buildSlider() {
  bgImages.forEach((url, idx) => {
    const d = document.createElement("div");
    d.className = "bg-slide";
    d.style.backgroundImage = `url("${url}")`;
    if (idx === 0) d.classList.add("show");
    sliderRoot.appendChild(d);
    slides.push(d);
  });

  // cycle slides
  slideTimer = setInterval(() => {
    slides[slideIndex].classList.remove("show");
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add("show");
  }, 6000);
}

function debounce(fn, wait = 300){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

async function searchOpenLibrary(q, limit = 10){
  if(!q || q.trim().length === 0) return null;
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limit}`;
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error("Network error");
    const data = await res.json();
    return data;
  }catch(e){
    console.error("Search error", e);
    return null;
  }
}

function showSuggestions(docs){
  suggestionsEl.innerHTML = "";
  if(!docs || docs.length === 0){
    suggestionsEl.classList.remove("show");
    return;
  }
  docs.slice(0,6).forEach(doc => {
    const li = document.createElement("li");
    li.textContent = `${doc.title}${doc.author_name ? " — " + doc.author_name[0] : ""}${doc.first_publish_year ? " ("+doc.first_publish_year+")" : ""}`;
    li.tabIndex = 0;
    li.addEventListener("click", () => {
      searchInput.value = doc.title;
      doFullSearch(doc.title);
      suggestionsEl.classList.remove("show");
    });
    suggestionsEl.appendChild(li);
  });
  suggestionsEl.classList.add("show");
}

async function handleType(e){
  const q = e.target.value.trim();
  if(q.length < 2){
    suggestionsEl.classList.remove("show");
    return;
  }
  const data = await searchOpenLibrary(q, 6);
  if(data && data.docs) showSuggestions(data.docs);
}

const debouncedType = debounce(handleType, 350);
searchInput.addEventListener("input", debouncedType);

// quick tags
quickTags.forEach(btn => {
  btn.addEventListener("click", () => {
    const q = btn.dataset.q;
    searchInput.value = q;
    doFullSearch(q);
  });
});

// search button and enter
searchBtn.addEventListener("click", () => doFullSearch(searchInput.value));
searchInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") {
    e.preventDefault();
    doFullSearch(searchInput.value);
    suggestionsEl.classList.remove("show");
  }
});

// Core search + render
async function doFullSearch(q){
  resultsGrid.innerHTML = "";
  noResults.classList.add("hidden");

  if(!q || q.trim().length === 0){
    noResults.classList.remove("hidden");
    noResults.querySelector("p").textContent = "Please enter a title, author or ISBN to search.";
    return;
  }
  const data = await searchOpenLibrary(q, 24);
  if(!data || !data.docs || data.docs.length === 0){
    noResults.classList.remove("hidden");
    return;
  }
  renderResults(data.docs);
}

function coverUrlForDoc(doc, size = "M"){
  // prefer cover_i if available, otherwise try ISBN
  if(doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-${size}.jpg`;
  if(doc.isbn && doc.isbn.length) return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-${size}.jpg`;
  // fallback placeholder
  return `https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&s=b78d5f0b1cd1fd96f218b9b7d9a5b7d7`;
}

function openLibraryUrl(doc){
  if(doc.key) return `https://openlibrary.org${doc.key}`;
  if(doc.edition_key && doc.edition_key.length) return `https://openlibrary.org/books/${doc.edition_key[0]}`;
  return "https://openlibrary.org/";
}

function renderResults(docs){
  resultsGrid.innerHTML = "";
  docs.forEach(doc => {
    const card = document.createElement("div");
    card.className = "book-card";

    const cover = document.createElement("div");
    cover.className = "book-cover";
    cover.style.backgroundImage = `url("${coverUrlForDoc(doc,'L')}")`;

    const meta = document.createElement("div");
    meta.className = "book-meta";

    const title = document.createElement("h4");
    title.textContent = doc.title || "Untitled";

    const author = document.createElement("p");
    author.textContent = doc.author_name ? doc.author_name.join(", ") : "Unknown author";

    const year = document.createElement("p");
    year.textContent = doc.first_publish_year ? `First published ${doc.first_publish_year}` : "";

    const actions = document.createElement("div");
    actions.className = "book-actions";

    const rentBtn = document.createElement("button");
    rentBtn.className = "btn primary";
    rentBtn.textContent = "Rent";
    rentBtn.addEventListener("click", () => openRentModal(doc));

    const buyBtn = document.createElement("button");
    buyBtn.className = "btn ghost";
    buyBtn.textContent = "Buy";
    buyBtn.addEventListener("click", () => {
      // link to quick buy search — in production you'd integrate with retailers or a buy API
      const q = encodeURIComponent(`${doc.title} ${doc.author_name ? doc.author_name[0] : ""}`);
      window.open(`https://www.google.com/search?q=buy+${q}`, "_blank");
    });

    const detailsBtn = document.createElement("button");
    detailsBtn.className = "btn ghost";
    detailsBtn.textContent = "Details";
    detailsBtn.addEventListener("click", () => window.open(openLibraryUrl(doc), "_blank"));

    actions.appendChild(rentBtn);
    actions.appendChild(buyBtn);
    actions.appendChild(detailsBtn);

    meta.appendChild(title);
    meta.appendChild(author);
    if(year.textContent) meta.appendChild(year);
    meta.appendChild(actions);

    card.appendChild(cover);
    card.appendChild(meta);

    resultsGrid.appendChild(card);
  });
}

/* Rent modal (demo only) */
const rentModal = document.getElementById("rent-modal");
const rentBody = document.getElementById("rent-body");
const rentDuration = document.getElementById("rent-duration");
const estPrice = document.getElementById("est-price");
const rentClose = document.getElementById("rent-close");
const confirmRent = document.getElementById("confirm-rent");
const cancelRent = document.getElementById("cancel-rent");

let currentRentDoc = null;

function openRentModal(doc){
  currentRentDoc = doc;
  rentBody.innerHTML = `
    <div style="display:flex;gap:0.8rem;align-items:center">
      <div style="width:72px;height:100px;background-image:url('${coverUrlForDoc(doc,"M")}');background-size:cover;border-radius:8px;flex-shrink:0"></div>
      <div>
        <strong>${doc.title}</strong>
        <div style="color:var(--muted);font-size:0.95rem">${doc.author_name ? doc.author_name.join(", ") : "Unknown author"}</div>
        <a href="${openLibraryUrl(doc)}" target="_blank" style="color:var(--accent);font-size:0.9rem">View on Open Library</a>
      </div>
    </div>
  `;
  rentDuration.value = "14";
  updateEstPrice();
  rentModal.classList.remove("hidden");
}

function closeRentModal(){
  currentRentDoc = null;
  rentModal.classList.add("hidden");
}

function updateEstPrice(){
  // very simple pricing model for demo: base $1.5/day scaled by popularity (number of edition records)
  if(!currentRentDoc) {
    estPrice.textContent = "$0.00";
    return;
  }
  const basePerDay = 1.5;
  const popularityFactor = Math.min(3, (currentRentDoc.edition_count || 1) / 10 + 1); // 1..3
  const days = parseInt(rentDuration.value || "14", 10);
  const price = (basePerDay * popularityFactor * days).toFixed(2);
  estPrice.textContent = `$${price}`;
}

rentDuration.addEventListener("change", updateEstPrice);
rentClose.addEventListener("click", closeRentModal);
cancelRent.addEventListener("click", closeRentModal);
confirmRent.addEventListener("click", () => {
  // Demo behaviour: show a confirmation then close modal.
  alert(`Demo: Rent confirmed for "${currentRentDoc.title}" — ${estPrice.textContent}. (No payment processed)`);
  closeRentModal();
});

/* Close suggestions when clicking outside */
document.addEventListener("click", (ev) => {
  if(!suggestionsEl.contains(ev.target) && ev.target !== searchInput) {
    suggestionsEl.classList.remove("show");
  }
});

/* Initialize */
buildSlider();

// Optional: pre-search a popular title on load
doFullSearch("Pride and Prejudice");
