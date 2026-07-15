import { chart_title, chart_updated } from "../elements.js";

let ftbChart = null;

export function renderFTBChart(result) {

    const rows = result.rows;

    const totals = {};

    rows.forEach(row => {

        if (!totals[row.PARLCON24]) {
            totals[row.PARLCON24] = 0;
        }

        totals[row.PARLCON24] += row.value;

    });
    
    if (chart_updated) {
        chart_updated.style.display = "none";
    }

    if (chart_title) {
        const dims = result.dimensions
                .filter(d => d.variable.name !== "PARLCON24")
                .map(d => d.variable.label);
        
        chart_title.textContent =`${dims[0]} by ${dims[1]}`;
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
                label: result.datasetName,
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