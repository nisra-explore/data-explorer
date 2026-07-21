import { additional_tables, other_menu,
         map_subtitle, SIDEBAR_OPEN_KEY,
         geo_menu, stats_menu, map_card, chart_card } from "./elements.js";
import { refreshRoute } from "./refreshRoute.js";

export let id_vars;
export let other_selections = "";
export let other_headline = "";
export let other_vars = [];
export let subtitle_text = "";

export function addOtherMenus (tables, matrix, geog_type, time_var, search) {

    other_menu.replaceChildren();

    // Reset variables when selecting new vars
    other_selections = "";
    other_headline = "";
    subtitle_text = "";
    id_vars = "";

    const normal_vars = ["STATISTIC", geog_type, time_var];
    if (geog_type == "COB_BASIC") {
        normal_vars.push("NI")
    }

    other_vars = Object.keys(tables[matrix].categories)
        .filter(x => !normal_vars.includes(x));


    if (["none", "NI"].includes(geog_type)) {
        map_card.classList.add("d-none");
        chart_card.classList.remove("col-xl-6");
        
        id_vars = `["STATISTIC", "${time_var}"`;

    } else {

        id_vars = `["STATISTIC", "${time_var}", "${geog_type}"`;
        chart_card.classList.add("col-xl-6");
        map_card.classList.remove("d-none");

    }

    if (other_vars.length > 0) {
        
        additional_tables.classList.remove("d-none");

        for (let i = 0; i < other_vars.length; i ++) {
            
            id_vars += `, "${other_vars[i]}"`;

            let new_menu = document.createElement("div");

            new_menu.innerHTML = `<label for = "${other_vars[i]}" class = "form-label">${tables[matrix].categories[other_vars[i]].label}</label><select id = "${other_vars[i]}" name = "${other_vars[i]}" class = "form-select" aria-label="Select ${tables[matrix].categories[other_vars[i]].label}"></select>`

            let options = Object.keys(tables[matrix].categories[other_vars[i]].category.label);
            let labels = Object.values(tables[matrix].categories[other_vars[i]].category.label);

            other_menu.appendChild(new_menu);

            const new_select = document.getElementById(other_vars[i]);

            for (let j = 0; j < labels.length; j ++) {
                let option = document.createElement("option");
                option.value = options[j];
                option.textContent = labels[j];
                new_select.appendChild(option);
            }

            
            let selected_option = options[0];

            const other_defaults = ["All", "ALL", "N92000002"];
            
            for (let j = 0; j < other_defaults.length; j ++) {
                if (options.includes(other_defaults[j])) {
                    selected_option = other_defaults[j];
                }
            }                

            for (let j = 0; j < search.length; j ++) {
                if (search[j].includes(`${other_vars[i]}=`)) {
                    let search_split = search[j].split("=");
                    selected_option = search_split[1];
                    break;
                }
            }

            new_select.value = selected_option;              

            new_menu.onchange = async function () {

                localStorage.setItem(SIDEBAR_OPEN_KEY, "1");
                let search_string = `?table=${geo_menu.value}&stat=${stats_menu.value}`;

                for (let j = 0; j < other_vars.length; j ++) {
                    search_string += `&${other_vars[j]}=${document.getElementById(other_vars[j]).value}`;
                }                    

                window.history.pushState({}, "", search_string);

                await refreshRoute();
                
            }
                    
            other_selections += `,"${other_vars[i]}":{"category":{"index":["${new_select.value}"]}}`;


            subtitle_text += `<strong>${tables[matrix].categories[other_vars[i]].label}</strong>: ${tables[matrix].categories[other_vars[i]].category.label[new_select.value]}<br>`;
            

            other_headline += `<strong>${tables[matrix].categories[other_vars[i]].label}</strong> category: <em>"${tables[matrix].categories[other_vars[i]].category.label[new_select.value]}"</em>`;
                if (i != other_vars.length - 1) {
                    other_headline += "<br>"
                }

        }

        map_subtitle.innerHTML = subtitle_text;
    }
    
    id_vars += `]`;   

}