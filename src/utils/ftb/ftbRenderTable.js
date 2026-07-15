import { additional_tables, table_title, dp_link, meta_tab } from "../elements.js";

export function renderFTBTable(result) {

    const rows = result.rows

    const table = document.getElementById("table-preview");

    if (additional_tables) {
        additional_tables.style.display = "none";
    }

    const ftb_title = document.querySelectorAll("#tables-title")[1];

    if (ftb_title) {
        const dims = result.dimensions
                .filter(d => d.variable.name !== "PARLCON24")
                .map(d => d.variable.label);
        
        ftb_title.textContent =`${dims[0]} by ${dims[1]}`;
    }

    if (dp_link) {
        dp_link.style.display = "none";
    }

    if (meta_tab) {
        meta_tab.style.display = "none";
    }

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
        );
    }

    table.innerHTML = "";

    const headers = [
        "Constituency",
        "Accommodation",
        "Renewable Energy",
        "Value"
    ];

    const thead = document.createElement("thead");

    thead.innerHTML = `
        <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
        </tr>
    `;

    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    rows.forEach(row => {

        tbody.innerHTML += `
            <tr>
                <td>${toTitleCase(row.PARLCON24)}</td>
                <td>${row.ACCOMMODATION_TYPE}</td>
                <td>${row.RENEWABLE_ENERGY}</td>
                <td>${row.value.toLocaleString()}</td>
            </tr>
        `;

    });

    table.appendChild(tbody);
}
