import { headline, chart_subtitle, breadcrumb, map_subtitle, chart_updated, dp_link, meta_tab, additional_tables } from "../elements.js";

export function resetFTBView() {

    if (headline) {
        headline.style.display = "";
    }

    if (chart_subtitle) {
        chart_subtitle.style.display = "";
    }

    if (breadcrumb) {
        breadcrumb.style.display = "";
    }

    if (map_subtitle) {
        map_subtitle.style.display = "";
    }

    if (chart_updated) {
        chart_updated.style.display = "";
    }

    if (dp_link) {
        dp_link.style.display = "";
    }

    if (meta_tab) {
        meta_tab.style.display = "";
    }

    if (additional_tables) {
        additional_tables.style.display = "";
    }
    
    const ftb_title = document.querySelectorAll("#tables-title")[1];
    
    if (ftb_title) {
        ftb_title.textContent = "NISRA Data Portal";
    }

}