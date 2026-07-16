import { chart_title, chart_updated, breadcrumb } from "../elements.js";

let ftbChart = null;

export function renderFTBChart(result) {

    const rows = result.rows;

    const geographyDimension = result.dimensions[0].variable.name;

    const filterDimension = result.dimensions[result.dimensions.length - 1];

    const filterVariable = filterDimension.variable.name;

    const selectedCategory = filterDimension.categories[0].label;

    const totals = {};

    rows.forEach(row => {

        if (row[filterVariable] !== selectedCategory) {
            return;
        }

        const geography = row[geographyDimension];
        totals[geography] = (totals[geography] || 0) + row.value;

    });
    
    if (chart_updated) {
        chart_updated.style.display = "none";
    }

    if (breadcrumb) {
        breadcrumb.style.display = "none";
    }

    if (chart_title) {
        const dims = result.dimensions
                .slice(1)
                .map(d => d.variable.label);
        chart_title.textContent = dims.join(" by ");
    }
    
    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
        );
    }

    const labels = Object.keys(totals).map(label => toTitleCase(label));
    const values = Object.values(totals);

    const container = document.getElementById("chart-container");

    container.innerHTML = `
        <canvas id="ftb-chart"></canvas>
    `;

    const ctx = document
        .getElementById("ftb-chart")
        .getContext("2d");

    if (ftbChart) {
        ftbChart.destroy();
    }

    ftbChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: selectedCategory,
                data: values,
                backgroundColor: "#00205b",
                borderColor: "#00205b",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

}