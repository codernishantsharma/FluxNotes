"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAW_JSON_PATH = exports.RESULT_JSON_PATH = exports.resultsDir = exports.imagesDir = exports.dataFilePath = void 0;
exports.ensureDirectoriesExist = ensureDirectoriesExist;
exports.readDataFileAsync = readDataFileAsync;
exports.writeDataFileAsync = writeDataFileAsync;
exports.getStoredNotes = getStoredNotes;
exports.getStoredRecords = getStoredRecords;
exports.saveRecordToDb = saveRecordToDb;
exports.saveNotesCollection = saveNotesCollection;
exports.saveImageRecords = saveImageRecords;
exports.writeRawResponse = writeRawResponse;
exports.appendToResultJson = appendToResultJson;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const helpers_1 = require("./helpers");
exports.dataFilePath = path_1.default.join(electron_1.app.getPath('userData'), 'notes_data.json');
exports.imagesDir = path_1.default.join(electron_1.app.getPath('userData'), 'images');
exports.resultsDir = path_1.default.join(electron_1.app.getPath('userData'), 'results');
exports.RESULT_JSON_PATH = path_1.default.resolve(__dirname, '..', '..', 'result.json');
exports.RAW_JSON_PATH = path_1.default.resolve(__dirname, '..', '..', 'raw.json');
function ensureDirectoriesExist() {
    if (!fs_1.default.existsSync(exports.imagesDir)) {
        fs_1.default.mkdirSync(exports.imagesDir, { recursive: true });
    }
    if (!fs_1.default.existsSync(exports.resultsDir)) {
        fs_1.default.mkdirSync(exports.resultsDir, { recursive: true });
    }
}
async function readDataFileAsync() {
    try {
        if (fs_1.default.existsSync(exports.dataFilePath)) {
            const rawData = await fs_1.default.promises.readFile(exports.dataFilePath, 'utf-8');
            const parsed = JSON.parse(rawData);
            return {
                notes_collection: Array.isArray(parsed.notes_collection) ? parsed.notes_collection : [],
                image_records: Array.isArray(parsed.image_records) ? parsed.image_records : [],
            };
        }
    }
    catch (err) {
        console.error('Failed to read local JSON data file:', err);
    }
    return { notes_collection: [], image_records: [] };
}
async function writeDataFileAsync(data) {
    try {
        await fs_1.default.promises.writeFile(exports.dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Failed to write local JSON data file:', err);
    }
}
async function getStoredNotes() {
    const data = await readDataFileAsync();
    return data.notes_collection;
}
async function getStoredRecords() {
    const data = await readDataFileAsync();
    return data.image_records;
}
async function saveRecordToDb(record) {
    const data = await readDataFileAsync();
    data.image_records.push(record);
    await writeDataFileAsync(data);
}
async function saveNotesCollection(notes) {
    const data = await readDataFileAsync();
    data.notes_collection = notes;
    await writeDataFileAsync(data);
}
async function saveImageRecords(records) {
    const data = await readDataFileAsync();
    data.image_records = records;
    await writeDataFileAsync(data);
}
async function writeRawResponse(responseData) {
    try {
        let formattedJson = null;
        try {
            const jsonText = (0, helpers_1.extractJsonFromResponse)(responseData.rawResponse);
            formattedJson = JSON.parse((0, helpers_1.completeTruncatedJson)(jsonText));
        }
        catch {
            // Preserve raw response when not JSON
        }
        await fs_1.default.promises.writeFile(exports.RAW_JSON_PATH, JSON.stringify({ ...responseData, formattedJson }, null, 2), 'utf8');
        console.log(`[raw.json] Saved latest raw response -> ${exports.RAW_JSON_PATH}`);
    }
    catch (error) {
        const err = error;
        console.error('[raw.json] Failed to save raw response:', err.message);
    }
}
function appendToResultJson(entry) {
    if (!electron_1.app.isPackaged) {
        try {
            let arr = [];
            try {
                if (fs_1.default.existsSync(exports.RESULT_JSON_PATH)) {
                    const raw = fs_1.default.readFileSync(exports.RESULT_JSON_PATH, 'utf8');
                    if (raw && raw.trim()) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed))
                            arr = parsed;
                    }
                }
            }
            catch (e) {
                const err = e;
                console.warn('[result.json] Failed to read existing file, starting fresh:', err.message);
                arr = [];
            }
            arr.push({
                timestamp: new Date().toISOString(),
                ...entry,
            });
            fs_1.default.writeFileSync(exports.RESULT_JSON_PATH, JSON.stringify(arr, null, 2), 'utf8');
            console.log(`[result.json] Appended entry #${arr.length} -> ${exports.RESULT_JSON_PATH}`);
        }
        catch (writeErr) {
            const err = writeErr;
            console.error('[result.json] Failed to write:', err.message);
        }
    }
}
