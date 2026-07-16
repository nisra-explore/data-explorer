import { chart_title, table_title, headline, chart_subtitle, breadcrumb, chart_updated, dp_link, meta_tab } from "../elements.js";

let ftbChart = null;

export function renderFTBChart(result) {

    if (headline) {
        headline.style.display = "none";
    }

    if (chart_subtitle) {
        chart_subtitle.style.display = "none";
    }

    if (breadcrumb) {
        breadcrumb.style.display = "none";
    }

    if (chart_updated) {
        chart_updated.style.display = "none";
    }

    if (dp_link) {
        dp_link.style.display = "none";
    }

    if (meta_tab) {
        meta_tab.style.display = "none";
    }

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

    const geographyLabel = result.dimensions[0].variable.label;

    const otherDimensions = result.dimensions.slice(1);

    const measureLabel = otherDimensions[otherDimensions.length - 1].variable.label;

    const titleText = `${measureLabel} by ${geographyLabel}`;

    if (chart_title) {
        chart_title.textContent = titleText;
    }

    if (table_title) {
        table_title.textContent = titleText;
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