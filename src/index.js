import { createMenus, getSearchIndex } from "./utils/createMenus.js";
import { wireSearch } from "./utils/wireSearch.js";
import { initSidebarPersistence } from "./utils/initSideBarPersistence.js";
import { share_btn } from "./utils/elements.js";
import { sharePage } from "./utils/sharePage.js";
import { initCookieConsent } from "./utils/cookies.js";
import { refreshRoute } from "./utils/refreshRoute.js";
import "./utils/skipToMainContent.js";
import "./utils/ftb/ftbUpload.js";

let searchIndex = [];

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Build menus AND the search index
    await createMenus();

    // Get the index produced during createMenus()
    if (typeof getSearchIndex === "function") {
      searchIndex = getSearchIndex() || [];
    }

    wireSearch(searchIndex);
    initSidebarPersistence();
    
    for (let i = 0; i < share_btn.length; i++) {
      share_btn[i].onclick = sharePage;
    }

      initCookieConsent({
        bannerId: 'cookie-banner',
        gtmId: 'GTM-WKK8ZWP'
      });

  } catch (e) {
    console.error("Startup failed:", e);
  }
});

window.addEventListener("popstate", async () => {
  await refreshRoute();
})
