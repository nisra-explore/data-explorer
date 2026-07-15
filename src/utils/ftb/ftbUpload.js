import { ftb_upload } from "../elements.js";
import { parseFTB } from "./ftbParse.js";

ftb_upload.addEventListener("click", handleFTBUpload);

async function handleFTBUpload() {
    const fileInput = document.getElementById("ftb-upload");

    if (!fileInput.files.length) {
        alert("Please select a JSON file.");
        return;
    }

    try {
        const file = fileInput.files[0];
        const text = await file.text();
        const json = JSON.parse(text);

        parseFTB(json);

    } catch (err) {
        console.error(err);
        alert("Invalid FTB JSON file.");
    }
}