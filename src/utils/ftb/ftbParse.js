import { renderFTBTable } from "./ftbRenderTable.js";
import { renderFTBChart } from "./ftbChart.js";

export function parseFTB(json) {

    const dimensions = json.table.dimensions;
    const values = json.table.values;

    const rows = [];

    let valueIndex = 0;

    for (const parlcon of dimensions[0].categories) {
        for (const accommodation of dimensions[1].categories) {
            for (const renewable of dimensions[2].categories) {

                rows.push({
                    PARLCON24: parlcon.label,
                    PARLCON24_CODE: parlcon.code,

                    ACCOMMODATION_TYPE: accommodation.label,

                    RENEWABLE_ENERGY: renewable.label,

                    value: values[valueIndex]
                });

                valueIndex++;
            }
        }
    }

    const result = {
        datasetName: json.label,
        dimensions,
        rows
    };

    console.log(result);

    renderFTBTable(result);
    renderFTBChart(result);

    return result;
}