import { additional_tables, table_title } from "../elements.js";
import { renderFTBChart } from "./ftbChart.js";

export function renderFTBTable(result) {

    const rows = result.rows

    const table = document.getElementById("table-preview");

    if (additional_tables) {
        additional_tables.style.display = "none";
    }

    const ftb_title = document.querySelectorAll("#tables-title")[1];

    if (ftb_title) {

        const geographyLabel = result.dimensions[0].variable.label;
        const otherDimensions = result.dimensions.slice(1);
        const measureLabel = otherDimensions[otherDimensions.length - 1].variable.label;
        const breakdownLabels = otherDimensions.slice(0, -1).map(d => d.variable.label.split("-")[0].trim()).join(" and ");

        const titleText = `${measureLabel} by ${geographyLabel} and ${breakdownLabels}`;

        ftb_title.textContent = titleText;
    }

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
        );
    }

    table.innerHTML = "";

    const dimensionNames = result.dimensions.map(d => d.variable.name);

    const headers = [
        ...result.dimensions.map(
            d => d.variable.label
        ),
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
    
        const dimensionCells = dimensionNames.map((name, index) => {

        const value = row[name];

        return `<td>${
            index === 0
                ? toTitleCase(String(value))
                : value
        }</td>`;

    })
    .join("");

        tbody.innerHTML += `
            <tr>
                ${dimensionCells}
                <td>${row.value.toLocaleString()}</td>
            </tr>
        `;

    });

    table.appendChild(tbody);
}
