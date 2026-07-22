import { additional_tables, data_preview, table_tabs, table_tabs_content, tables_title,
         stats_menu, chart_title } from "./elements.js";

import { ni_result } from "./buildCharts.js";

export let headline_total = null;

export async function buildTables(tables, matrix, statistic, geog_type, year, time_var, other_vars, other_selections, id_vars, unit) {

    const isDP = tables[matrix]?.type === "dp";

     if (!isDP) {
        data_preview.classList.add("d-none");
    } else {
        data_preview.classList.remove("d-none");
    }

    // Build a table for each additional variable and place behind a tab
    if (other_vars.length > 0) {

        additional_tables.classList.remove("d-none");

         // Add new tables
         tables_title.textContent = `${tables[matrix].statistics[stats_menu.value]} in Northern Ireland (${year}) by:`;

        for (let i = 0; i < other_vars.length; i ++) {   

            let li = document.createElement("li");
            li.classList.add("nav-item");
            li.role = "presentation";
            li.innerHTML = `<button class="nav-link ${i == 0 ? "active" : ""}" id="data-tab-${i}" data-bs-toggle="tab" data-bs-target="#table-tab-${i}" type="button" role="tab" aria-controls="data-preview-${i}" aria-selected="${i == 0 ? "true" : "false"}">${tables[matrix].categories[other_vars[i]].label}</button>`;

            table_tabs.appendChild(li);

            let div = document.createElement("div");
            div.classList.add("tab-pane");
            div.classList.add("fade");
            if (i == 0) div.classList.add("show");
            if (i == 0) div.classList.add("active");
            div.role = "tabpanel";
            div.id = `table-tab-${i}`;

            for (let j = 0; j < other_vars.length; j ++) {
                if (j != i) {
                    div.innerHTML += `<p class="text-secondary"><strong>${tables[matrix].categories[other_vars[j]].label}:</strong> ${tables[matrix].categories[other_vars[j]].category.label[document.getElementById(other_vars[j]).value]}</p>`;
                    div.innerHTML += `<p class="text-secondary"><em>Use the menus on the left to see the <strong>${tables[matrix].categories[other_vars[i]].label}</strong> breakdown for other <strong>${tables[matrix].categories[other_vars[j]].label}</strong> categories.</em></p>`;
                }
            }

            let table_selections = other_selections.split(",");
            table_selections = table_selections.filter(x => x.indexOf(other_vars[i]) == -1)
            table_selections = table_selections.join(",");
            if (geog_type != "none") table_selections += `,"${geog_type}":{"category":{"index":["N92000002"]}}`;

            let table_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
                encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":' +
                    id_vars + ',"dimension":{"STATISTIC":{"category":{"index":["' +
                    statistic + '"]}},"' + time_var + '":{"category":{"index":["' + year +
                    '"]}}' + table_selections +
                    '},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
                    matrix + '"},"version":"2.0"}}');


            let result;

            if (isDP) {
                const response = await fetch(table_url);
                const json = await response.json();
                result = json.result;
            } else {
                const response = await fetch(tables[matrix].path);
                result = await response.json();
            }

            let geography_count;
            let statistic_count;
            let breakdown_count;
            let statistic_index;
            let breakdown_dim;

            if (!isDP) {
                const dimensions = result.table.dimensions;
                breakdown_dim = dimensions.find(d => d.variable.name === other_vars[0]);
                const statistic_dim = dimensions.find(d => d.count === Object.keys(tables[matrix].statistics).length);
                const geography_dim = dimensions.find(d => d.variable.name !== breakdown_dim.variable.name && d.variable.name !== statistic_dim.variable.name);

                geography_count = geography_dim.count;
                statistic_count = statistic_dim.count;
                breakdown_count = breakdown_dim.count;

                const selected_code = stats_menu.value;

                statistic_index = statistic_dim.categories.findIndex(c => c.code === selected_code);
            }
            
            let table_div = document.createElement("div");
            table_div.classList.add("table-responsive");

            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table-sm");
            table.classList.add("table-bordered");
            table.classList.add("mb-0");

            let tr = document.createElement("tr");

            let var_header = document.createElement("th");
            var_header.textContent = tables[matrix].categories[other_vars[i]].label;
            tr.appendChild(var_header);

            let stat_header = document.createElement("th");
            
            if (isDP) {
                stat_header.textContent = result.dimension.STATISTIC.category.label[statistic];
            } else {
                stat_header.textContent = tables[matrix].statistics?.[stats_menu.value] || "Value";
            }

            stat_header.style = "text-align: right;"
            tr.appendChild(stat_header);

            table.appendChild(tr);

            let values;

            if (isDP) {
                values = result.value;
            } else {
                values = result.table.values;
            }
            
            const hasData = values.some(v => v != null);
            
            if (!hasData) {
                additional_tables.classList.add("d-none");
                return;
            }

            let breakdown_totals = null;

            if (!isDP) {

                breakdown_totals = new Array(breakdown_count).fill(0);

                for (let geography = 0; geography < geography_count; geography++) {

                    for (let breakdown = 0; breakdown < breakdown_count; breakdown++) {

                        const value_index = (geography * statistic_count * breakdown_count) + (statistic_index * breakdown_count) + breakdown;

                        breakdown_totals[breakdown] += values[value_index] || 0;
                    }
                }

                const selectedBreakdownCode = document.getElementById(other_vars[0]).value;

                const breakdown_index = breakdown_dim.categories.findIndex(c => c.code === selectedBreakdownCode);

                headline_total = breakdown_totals[breakdown_index];
            }

            if (isDP) {

                for (let j = 0; j < values.length; j++) {

                    let tr = document.createElement("tr");

                    let td_0 = document.createElement("td");
                    td_0.textContent = Object.values(result.dimension[other_vars[i]].category.label)[j];

                    tr.appendChild(td_0);

                    let td_1 = document.createElement("td");

                    if (values[j] == null) {
                        td_1.textContent = "..";
                    } else {

                        const decimals = result.dimension.STATISTIC.category.unit[stats_menu.value].decimals;

                        td_1.textContent = values[j].toLocaleString("en-GB", {
                            minimumFractionDigits: decimals,
                            maximumFractionDigits: decimals
                        });
                    }

                    td_1.style = "text-align: right;";

                    if (["all", "ni", "n92000002"].includes(Object.keys(result.dimension[other_vars[i]].category.label)[j].toLowerCase())) {
                        td_0.style = "font-weight: bold;";
                        td_1.style = "text-align: right; font-weight: bold;";
                    }

                    tr.appendChild(td_1);
                    table.appendChild(tr);
                }

            } else {

                const dim = result.table.dimensions.find(d => d.variable.name === other_vars[i]);

                for (let j = 0; j < breakdown_count; j++) {

                    let tr = document.createElement("tr");

                    let td_0 = document.createElement("td");
                    td_0.textContent = dim.categories[j].label;
                    tr.appendChild(td_0);

                    let td_1 = document.createElement("td");
                    td_1.textContent = breakdown_totals[j].toLocaleString("en-GB");
                    td_1.style = "text-align: right;";
                    tr.appendChild(td_1);

                    table.appendChild(tr);
                }
            }

            table_div.appendChild(table);
            div.appendChild(table_div);
            table_tabs_content.appendChild(div);
        }

        // Else build a table of one row per statistic at Northern Ireland level
    }  else if (ni_result) {

        let statistic_categories = tables[matrix].categories.STATISTIC.category.index;
        

        if (Array.isArray(statistic_categories)) {

            additional_tables.classList.remove("d-none");

            tables_title.textContent = `${tables[matrix].name} - Northern Ireland Summary (${year})`;

            let div = document.createElement("div");
            div.classList.add("tab-pane");
            div.classList.add("fade");
            div.classList.add("show");
            div.classList.add("active");
            div.role = "tabpanel";
            div.id = `table-tab-statistic`;

            let table_selections = "";
            if (geog_type != "none") table_selections += `,"${geog_type}":{"category":{"index":["N92000002"]}}`;

            

            let table_url = 'https://ws-data.nisra.gov.uk/public/api.jsonrpc?data=' +
                encodeURIComponent('{"jsonrpc":"2.0","method":"PxStat.Data.Cube_API.ReadDataset","params":{"class":"query","id":["' +
                    time_var + '", "' + geog_type + '"],"dimension":{"' + time_var + '":{"category":{"index":["' + year +
                    '"]}}' + table_selections + 
                    '},"extension":{"pivot":null,"codes":false,"language":{"code":"en"},"format":{"type":"JSON-stat","version":"2.0"},"matrix":"' +
                    matrix + '"},"version":"2.0"}}');


            const response = await fetch(table_url);
            const { result } = await response.json();
                
            let table_div = document.createElement("div");
            table_div.classList.add("table-responsive");

            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table-sm");
            table.classList.add("table-bordered");
            table.classList.add("mb-0");

            let tr = document.createElement("tr");

            let var_header = document.createElement("th");
            var_header.textContent = "Statistic";
            tr.appendChild(var_header);


            let stat_header = document.createElement("th");
            stat_header.textContent = `Northern Ireland`;
            stat_header.style = "text-align: right;"
            tr.appendChild(stat_header);

            table.appendChild(tr);

            let values = result.value;

            if (!values || values.length === 0) {
                additional_tables.classList.add("d-none");
            }

            for (let j = 0; j < values.length; j ++) {
                let tr = document.createElement("tr");

                let td_0 = document.createElement("td");
                td_0.textContent = Object.values(result.dimension.STATISTIC.category.label)[j];
                tr.appendChild(td_0);

                let td_1 = document.createElement("td");
                if (values[j] == null) {
                    td_1.textContent = "..";
                } else {
                    let decimals = result.dimension.STATISTIC.category.unit[stats_menu.value].decimals;
                    td_1.textContent = values[j].toLocaleString("en-GB", {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    });
                }
                td_1.style = "text-align: right;"
                if (["all", "ni", "n92000002"].includes(Object.keys(result.dimension.STATISTIC.category.label)[j].toLowerCase())) {
                    td_0.style = "font-weight: bold;"
                    td_1.style = "text-align: right; font-weight: bold;"
                }
                tr.appendChild(td_1);

                table.appendChild(tr);
            }

            table_div.appendChild(table);
            div.appendChild(table_div);
            table_tabs_content.appendChild(div);
        } else {
            // Else build a table that shows chart figs
            additional_tables.classList.remove("d-none");

            const xAxisTitle = ni_result.result.dimension[time_var].label || "";
            const yAxisTitle = unit || "";

            tables_title.textContent = chart_title.textContent;

            let table_div = document.createElement("div");
            table_div.classList.add("table-responsive");

            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table-sm");
            table.classList.add("table-bordered");
            table.classList.add("mb-0");

            let tr = document.createElement("tr");

            let var_header = document.createElement("th");
            var_header.textContent = xAxisTitle;
            tr.appendChild(var_header);

            let stat_header = document.createElement("th");
            stat_header.textContent = `Northern Ireland (${yAxisTitle})`;
            stat_header.style = "text-align: right;"
            tr.appendChild(stat_header);

            table.appendChild(tr);

            const values = ni_result.result.value;
            const time_series = ni_result.result.dimension[time_var].category.index;

            for (let i = 0; i < values.length; i++) {
                let tr = document.createElement("tr");

                let td_0 = document.createElement("td");
                td_0.textContent = time_series[i];
                tr.appendChild(td_0);

                let td_1 = document.createElement("td");
                if (values[i] == null) {
                    td_1.textContent = "..";
                } else {
                    let decimals = ni_result.result.dimension.STATISTIC.category.unit[stats_menu.value].decimals;
                    td_1.textContent = values[i].toLocaleString("en-GB", {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    });
                }
                td_1.style = "text-align: right;"
                tr.appendChild(td_1);

                table.appendChild(tr);
            }

            table_div.appendChild(table);
            table_tabs_content.appendChild(table_div);
        }

    } else {
        additional_tables.classList.add("d-none")
    }
}