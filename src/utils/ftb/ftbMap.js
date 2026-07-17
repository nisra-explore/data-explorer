import { map_title, map_updated, map_subtitle, map_card, chart_card } from "../elements.js";
import { loadShapes } from "../loadShapes.js";
import { getColour } from "../getColour.js";
import { titleCase } from "../titleCase.js";
import { GEOG_PROPS, palette } from "../../config/config.js";
import { getFTBTotals } from "./ftbChart.js";
 
export let ftbMap = null;
 
export async function renderFTBMap(result) {
    
    if (map_card) {
        map_card.classList.remove("d-none");
        map_card.classList.add("col-xl-6");
    }

    if (chart_card) {
        chart_card.classList.remove("col-xl-12");
        chart_card.classList.add("col-xl-6");
    }
 
    const rows = result.rows;
 
    const totals = getFTBTotals(result);
 
    if (map_updated) {
        map_updated.style.display = "none";
    }

    if (map_subtitle) {
        map_subtitle.style.display = "none";
    }

    const geographyLabel = result.dimensions[0].variable.label;

    const otherDimensions = result.dimensions.slice(1);

    const measureLabel = otherDimensions[otherDimensions.length - 1].variable.label;

    const titleText = `${measureLabel} by ${geographyLabel}`;
 
    if (map_title) {
        map_title.textContent = titleText;
    }
 
    const values = Object.values(totals);
 
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
 
    const mapContainer = document.getElementById("map-container");

    mapContainer.innerHTML = "";

    const mapDiv = document.createElement("div");
    mapDiv.id = "map";
    mapDiv.className = "map";

    mapContainer.appendChild(mapDiv);

    const range_min = Math.floor(min);
    const range_max = Math.ceil(max);

    let min_value;
    let max_value;

    let legend_div = document.getElementById("map-legend");

    if (!legend_div) {
        
        legend_div = document.createElement("div");
        legend_div.id = "map-legend";
        legend_div.classList.add(
            "map-legend",
            "align-self-center",
            "col-6"
        );

        const legend_row_1 = document.createElement("div");
        legend_row_1.classList.add("row");
        legend_row_1.style.display = "flex";
        legend_row_1.style.justifyContent = "space-between";
        legend_row_1.style.alignItems = "center";

        min_value = document.createElement("div");
        min_value.id = "legend-min";
        min_value.classList.add("legend-min");

        legend_row_1.appendChild(min_value);

        max_value = document.createElement("div");
        max_value.id = "legend-max";
        max_value.classList.add("legend-max");

        legend_row_1.appendChild(max_value);

        legend_div.appendChild(legend_row_1);

        const legend_row_2 = document.createElement("div");
        legend_row_2.classList.add("row");

        palette.forEach((colour, i) => {

            const colour_block = document.createElement("div");

            colour_block.style.backgroundColor = colour;
            colour_block.style.opacity = "0.8";
            colour_block.classList.add("colour-block");

            if (i === palette.length - 1) {
                colour_block.style.borderRight = "1px #555555 solid";
            }

            legend_row_2.appendChild(colour_block);

        });

        legend_div.appendChild(legend_row_2);

        mapContainer.insertBefore(legend_div, mapDiv);
    
    } else {
        
        min_value = document.getElementById("legend-min");
        max_value = document.getElementById("legend-max");

        mapContainer.insertBefore(legend_div, mapDiv);

    }

    min_value.textContent = range_min.toLocaleString("en-GB");
    max_value.textContent = range_max.toLocaleString("en-GB");

    if (ftbMap) {
    ftbMap.remove();
}
 
    ftbMap = new maplibregl.Map({
        container: "map",
        style: "public/map/style-omt.json",
        center: [-6.85, 54.67],
        zoom: 7,
        minZoom: 5,
        maxZoom: 12,
        attributionControl: false
    });
    
    ftbMap.dragPan.disable();
 
    ftbMap.addControl(
        new maplibregl.NavigationControl({
            showZoom: true,
            showCompass: false
        }),
        "top-right"
    );
 
    const geojsonData = await loadShapes("PARLCON24");
 
    ftbMap.on("load", () => {
 
        const features = geojsonData.features.map((feature, idx) => {
 
            const constituency = feature.properties.PCON24NM;
 
            const value = totals[constituency];
 
            const colourScale = value == null ? -1 : (value - min) / range;
 
            return {
                ...feature,
                id: idx,
                properties: {
                    ...feature.properties,
                    value,
                    label: constituency,
                    fill: value == null
                        ? "#eeeeee"
                        : getColour(colourScale)
                }
            };
 
        }
    );
        ftbMap.addSource("ftb-data", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features
            },
            generateId: true
        });
 
        ftbMap.addLayer({
            id: "ftb-fill",
            type: "fill",
            source: "ftb-data",
            paint: {
                "fill-color": [
                    "get",
                    "fill"
                ],
                "fill-opacity": 0.75
            }
        });
 
        ftbMap.addLayer({
            id: "ftb-outline",
            type: "line",
            source: "ftb-data",
            paint: {
                "line-color": "#555555",
                "line-width": 1
            }
        });
 
        const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false
        });
 
        let hoveredId = null;
 
        ftbMap.on("mousemove", "ftb-fill", e => {
 
            const feature = e.features?.[0];
 
            if (!feature) {
                return;
            }
 
            ftbMap.getCanvas().style.cursor = "pointer";
 
            if (hoveredId !== null) {
                ftbMap.setFeatureState(
                    {
                        source: "ftb-data",
                        id: hoveredId
                    },
                    {
                        hover: false
                    }
                );
            }
 
            hoveredId = feature.id;
 
            ftbMap.setFeatureState(
                {
                    source: "ftb-data",
                    id: hoveredId
                },
                {
                    hover: true
                }
            );
 
            popup
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div>
                        <strong>
                            ${titleCase(feature.properties.label)}
                        </strong>
                        <br>
                        ${Number(
                            feature.properties.value || 0
                        ).toLocaleString()}
                    </div>
                `)
                .addTo(ftbMap);
 
        });
 
        ftbMap.on("mouseleave", "ftb-fill", () => {
 
            ftbMap.getCanvas().style.cursor = "";
 
            if (hoveredId !== null) {
 
                ftbMap.setFeatureState(
                    {
                        source: "ftb-data",
                        id: hoveredId
                    },
                    {
                        hover: false
                    }
                );
 
                hoveredId = null;
            }
 
            popup.remove();
 
        });
 
    });
 
}