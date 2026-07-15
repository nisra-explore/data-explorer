import { renderFTBTable } from "./ftbRenderTable.js";
import { renderFTBChart } from "./ftbChart.js";

function buildRows(dimensions, values) {

    const rows = [];
    let valueIndex = 0;

    function recurse(dimIndex, currentRow) {

        if (dimIndex === dimensions.length) {

            rows.push({
                ...currentRow,
                value: values[valueIndex++]
            });

            return;
        }

        const dim = dimensions[dimIndex];

        dim.categories.forEach(category => {

            recurse(dimIndex + 1, {
                ...currentRow,
                [dim.variable.name]: category.label,
                ...(category.code && {
                    [`${dim.variable.name}_CODE`]: category.code
                })
            });

        });

    }

    recurse(0, {});

    return rows;
}

export function parseFTB(json) {

    const dimensions = json.table.dimensions;
    const values = json.table.values;

    const rows = buildRows(dimensions, values);

    const result = {
        datasetName: json.label,
        dimensions,
        rows
    };

    renderFTBTable(result);
    renderFTBChart(result);

    return result;
}