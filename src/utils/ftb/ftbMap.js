import { map_title, map_updated, map_subtitle} from "../elements.js";
import { loadShapes } from "../loadShapes.js";
import { getColour } from "../getColour.js";
import { titleCase } from "../titleCase.js";
import { GEOG_PROPS } from "../../config/config.js";
import { getFTBTotals } from "./ftbChart.js";
 
export let ftbMap = null;
 
export async function renderFTBMap(result) {
 
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
 
    mapContainer.innerHTML = `
        <div id="map" class="map"></div>
    `;

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