import { plotMap } from "./plotMap.js";
import { geo_menu, stats_menu } from "./elements.js";

export function mapSelections (categories, tables) {

    let geog_type;
    
    if (categories.includes("LGD2014")) {
        geog_type = "LGD2014";
    } else if (categories.includes("LGD")) {
        geog_type = "LGD";
    } else if (categories.includes("LGD1992")) {
        geog_type = "LGD1992";
    } else if (categories.includes("AA")) {
        geog_type = "AA";
    } else if (categories.includes("AA2024")) {
        geog_type = "AA2024";
    } else if (categories.includes("HSCT")) {
        geog_type = "HSCT";
    } else if (categories.includes("DEA2014")) {
        geog_type = "DEA2014";
    } else if (categories.includes("SDZ2021")) {
        geog_type = "SDZ2021";
    } else if (categories.includes("DZ2021")) {
        geog_type = "DZ2021";
    } else if (categories.includes("Ward2014")) {
        geog_type = "Ward2014";
    } else if (categories.includes("SOA")) {
        geog_type = "SOA";
    } else if (categories.includes("SA")) {
        geog_type = "SA";
    } else if (categories.includes("LCG")) {
        geog_type = "LCG";
    } else if (categories.includes("UR2015")) {
        geog_type = "UR2015";
    } else if (categories.includes("SETTLEMENT")) {
        geog_type = "SETTLEMENT";
    } else if (categories.includes("SETTLEMENT15")) {
        geog_type = "SETTLEMENT15";
    } else if (categories.includes("NUTS3")) {
        geog_type = "NUTS3";
    } else if (categories.includes("ELB")) {
        geog_type = "ELB";
    } else if (categories.includes("COB_BASIC")) {
        geog_type = "COB_BASIC";
    } else if (categories.includes("COUNTY_NI")) {
        geog_type = "COUNTY_NI";
    } else if (categories.includes("NI")) {
        geog_type = "NI"
    } else {
        geog_type = "none";
    }

    plotMap(tables, geog_type);

}