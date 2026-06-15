/* ==========================================================================
   FLORIAN PUECH PORTFOLIO v2 — APP
   Full-bleed feed, overlay menu, optimized images
   ========================================================================== */

(function () {
    "use strict";

    // Image base path — points to optimized folder
    var IMG_BASE = "assets/";

    /* ------------------------------------------------------------------
       STATE
    ------------------------------------------------------------------ */
    var data = [];
    var lbIdx = 0;
    var category = "all";
    var subcategory = "all";
    var menuOpen = false;

    /* ------------------------------------------------------------------
       DOM
    ------------------------------------------------------------------ */
    var viewHero = document.getElementById("viewHero");
    var viewPortfolio = document.getElementById("viewPortfolio");
    var enterBtn = document.getElementById("enterBtn");

    var feed = document.getElementById("feed");
    var empty = document.getElementById("empty");
    var counter = document.getElementById("counter");

    var homeBtn = document.getElementById("homeBtn");
    var scrollIndicator = document.getElementById("scrollIndicator");

    var menuBtn = document.getElementById("menuBtn");
    var menuOverlay = document.getElementById("menuOverlay");
    var menuArtistSection = document.getElementById("menuArtistSection");

    var lb = document.getElementById("lb");
    var lbImg = document.getElementById("lbImg");
    var lbFlash = document.getElementById("lbFlash");
    var lbClose = document.getElementById("lbClose");
    var lbBg = document.getElementById("lbBg");
    var lbPrev = document.getElementById("lbPrev");
    var lbNext = document.getElementById("lbNext");
    var lbFrame = document.getElementById("lbFrame");
    var lbCat = document.getElementById("lbCat");

    var cursor = document.getElementById("cursor");
    var cursorLabel = cursor.querySelector(".cursor-label");

    /* ------------------------------------------------------------------
       INIT
    ------------------------------------------------------------------ */
    var firstPhoto = GALLERY_DATA.slice(0, 1);
    var restData = GALLERY_DATA.slice(1);

    var fwPhotos = restData.filter(function(it) {
        return it.path.indexOf("PFW") !== -1 || it.path.indexOf("FW JOUR") !== -1;
    });
    var otherPhotos = restData.filter(function(it) {
        return it.path.indexOf("PFW") === -1 && it.path.indexOf("FW JOUR") === -1;
    });
    
    var REORDERED_DATA = firstPhoto.concat(fwPhotos, otherPhotos);
    data = REORDERED_DATA.slice();

    enterBtn.addEventListener("click", function () {
        viewHero.classList.remove("is-active");
        viewPortfolio.classList.add("is-active");
        window.scrollTo(0, 0);
        render();
    });

    homeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        viewPortfolio.classList.remove("is-active");
        viewHero.classList.add("is-active");
        window.scrollTo(0, 0);
    });

    window.addEventListener("scroll", function () {
        if (viewPortfolio.classList.contains("is-active")) {
            if (window.scrollY > 50) {
                scrollIndicator.classList.add("is-hidden");
            } else {
                scrollIndicator.classList.remove("is-hidden");
            }
        }
    });

    /* ------------------------------------------------------------------
       RENDER FEED
    ------------------------------------------------------------------ */
    var obs = null;

    function render() {
        feed.innerHTML = "";

        if (!data.length) {
            empty.classList.add("is-visible");
            counter.textContent = "0 CLICHÉ";
            return;
        }
        empty.classList.remove("is-visible");
        counter.textContent = data.length + " CLICHÉS";

        data.forEach(function (item, i) {
            var el = document.createElement("div");
            el.className = "feed-item";

            var label = item.subcategory || item.category;
            var frameNum = "F" + String(i + 1).padStart(3, "0");

            el.innerHTML =
                '<img class="feed-img" src="' + IMG_BASE + item.path + '" ' +
                    'alt="' + item.category + (item.subcategory ? ' — ' + item.subcategory : '') + '" ' +
                    'loading="lazy">' +
                '<span class="feed-label">' + frameNum + ' — ' + label + '</span>';

            el.addEventListener("click", function () { openLb(i); });

            feed.appendChild(el);
        });

        // IntersectionObserver for staggered reveal
        requestAnimationFrame(observe);
    }

    function observe() {
        if (obs) obs.disconnect();

        var items = feed.querySelectorAll(".feed-item");

        obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add("is-visible");
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.05, rootMargin: "0px 0px 100px 0px" });

        items.forEach(function (it) { obs.observe(it); });
    }

    /* ------------------------------------------------------------------
       MENU
    ------------------------------------------------------------------ */
    menuBtn.addEventListener("click", function () {
        menuOpen = !menuOpen;
        menuOverlay.classList.toggle("is-open", menuOpen);
        menuBtn.classList.toggle("is-open", menuOpen);
        document.body.classList.toggle("no-scroll", menuOpen);
    });

    function closeMenu() {
        menuOpen = false;
        menuOverlay.classList.remove("is-open");
        menuBtn.classList.remove("is-open");
        document.body.classList.remove("no-scroll");
    }

    // Category click (event delegation)
    document.getElementById("menuCategories").addEventListener("click", function (e) {
        var btn = e.target.closest(".menu-link");
        if (!btn) return;

        // Update active
        this.querySelectorAll(".menu-link").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");

        category = btn.getAttribute("data-filter");
        subcategory = "all";

        // Show/hide artist sub-section
        if (category === "ARTISTES") {
            menuArtistSection.classList.add("is-visible");
            // Reset artist sub-filters
            document.getElementById("menuArtists").querySelectorAll(".menu-link-sub").forEach(function (s) { s.classList.remove("active"); });
            document.getElementById("menuArtists").querySelector('[data-sub="all"]').classList.add("active");
        } else {
            menuArtistSection.classList.remove("is-visible");
        }

        applyFilters();
        closeMenu();
        window.scrollTo({ top: 0, behavior: "instant" });
    });

    // Artist sub-filter click
    document.getElementById("menuArtists").addEventListener("click", function (e) {
        var btn = e.target.closest(".menu-link-sub");
        if (!btn) return;

        this.querySelectorAll(".menu-link-sub").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");

        subcategory = btn.getAttribute("data-sub");
        applyFilters();
        closeMenu();
        window.scrollTo({ top: 0, behavior: "instant" });
    });

    function applyFilters() {
        if (category === "all") {
            data = REORDERED_DATA.slice();
        } else {
            data = GALLERY_DATA.filter(function (it) { return it.category === category; });
            if (category === "ARTISTES" && subcategory !== "all") {
                data = data.filter(function (it) { return it.subcategory === subcategory; });
            }
        }
        render();
    }

    /* ------------------------------------------------------------------
       LIGHTBOX
    ------------------------------------------------------------------ */
    function openLb(i) {
        lbIdx = i;
        fillLb();
        lb.classList.add("is-open");
        document.body.classList.add("no-scroll");
        flash();
    }

    function closeLb() {
        lb.classList.remove("is-open");
        document.body.classList.remove("no-scroll");
        setTimeout(function () { lbImg.src = ""; }, 300);
    }

    function fillLb() {
        var item = data[lbIdx];
        lbImg.classList.add("is-loading");
        lbImg.onload = function () { lbImg.classList.remove("is-loading"); };
        lbImg.src = IMG_BASE + item.path;
        lbImg.alt = item.category + (item.subcategory ? " — " + item.subcategory : "");
        lbFrame.textContent = "F" + String(lbIdx + 1).padStart(3, "0");
        lbCat.textContent = item.subcategory || item.category;
    }

    function nav(dir) {
        if (data.length < 2) return;
        lbIdx = (lbIdx + dir + data.length) % data.length;
        flash();
        fillLb();
    }

    function flash() {
        lbFlash.classList.remove("is-flashing");
        void lbFlash.offsetWidth;
        lbFlash.classList.add("is-flashing");
    }

    lbClose.addEventListener("click", closeLb);
    lbBg.addEventListener("click", closeLb);
    lbPrev.addEventListener("click", function () { nav(-1); });
    lbNext.addEventListener("click", function () { nav(1); });

    document.addEventListener("keydown", function (e) {
        if (lb.classList.contains("is-open")) {
            if (e.key === "Escape") closeLb();
            else if (e.key === "ArrowRight") nav(1);
            else if (e.key === "ArrowLeft") nav(-1);
        }
        // Close overlay menu with Escape too
        if (menuOpen && e.key === "Escape") closeMenu();
    });

    /* ------------------------------------------------------------------
       CURSOR
    ------------------------------------------------------------------ */
    document.addEventListener("mousemove", function (e) {
        cursor.style.transform = "translate(" + (e.clientX - 5) + "px," + (e.clientY - 5) + "px)";
    });

    document.addEventListener("mouseover", function (e) {
        if (e.target.closest(".feed-item") && !lb.classList.contains("is-open")) {
            cursor.classList.add("is-hover");
            cursorLabel.textContent = "VOIR";
        } else if (e.target.closest("button, a")) {
            cursor.classList.add("is-hover");
            cursorLabel.textContent = "";
        }
    });

    document.addEventListener("mouseout", function (e) {
        if (e.target.closest(".feed-item") || e.target.closest("button, a")) {
            cursor.classList.remove("is-hover");
            cursorLabel.textContent = "";
        }
    });

})();
