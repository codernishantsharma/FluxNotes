import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { NoteRecord, ImageRecord, NotesData, RawResponseData } from '../types';
import { extractJsonFromResponse, completeTruncatedJson } from './helpers';

export const dataFilePath = path.join(app.getPath('userData'), 'notes_data.json');
export const imagesDir = path.join(app.getPath('userData'), 'images');
export const resultsDir = path.join(app.getPath('userData'), 'results');

export const RESULT_JSON_PATH = path.resolve(__dirname, '..', '..', 'result.json');
export const RAW_JSON_PATH = path.resolve(__dirname, '..', '..', 'raw.json');

export function ensureDirectoriesExist(): void {
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
}

export async function readDataFileAsync(): Promise<NotesData> {
  try {
    if (fs.existsSync(dataFilePath)) {
      const rawData = await fs.promises.readFile(dataFilePath, 'utf-8');
      const parsed = JSON.parse(rawData);
      return {
        notes_collection: Array.isArray(parsed.notes_collection) ? parsed.notes_collection : [],
        image_records: Array.isArray(parsed.image_records) ? parsed.image_records : [],
      };
    }
  } catch (err) {
    console.error('Failed to read local JSON data file:', err);
  }
  return { notes_collection: [], image_records: [] };
}

export async function writeDataFileAsync(data: NotesData): Promise<void> {
  try {
    await fs.promises.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local JSON data file:', err);
  }
}

export async function getStoredNotes(): Promise<NoteRecord[]> {
  const data = await readDataFileAsync();
  return data.notes_collection;
}

export async function getStoredRecords(): Promise<ImageRecord[]> {
  const data = await readDataFileAsync();
  return data.image_records;
}

export async function saveRecordToDb(record: ImageRecord): Promise<void> {
  const data = await readDataFileAsync();
  data.image_records.push(record);
  await writeDataFileAsync(data);
}

export async function saveNotesCollection(notes: NoteRecord[]): Promise<void> {
  const data = await readDataFileAsync();
  data.notes_collection = notes;
  await writeDataFileAsync(data);
}

export async function saveImageRecords(records: ImageRecord[]): Promise<void> {
  const data = await readDataFileAsync();
  data.image_records = records;
  await writeDataFileAsync(data);
}

export async function writeRawResponse(responseData: RawResponseData): Promise<void> {
  try {
    let formattedJson: unknown = null;
    try {
      const jsonText = extractJsonFromResponse(responseData.rawResponse);
      formattedJson = JSON.parse(completeTruncatedJson(jsonText));
    } catch {
      // Preserve raw response when not JSON
    }

    await fs.promises.writeFile(
      RAW_JSON_PATH,
      JSON.stringify({ ...responseData, formattedJson }, null, 2),
      'utf8',
    );
    console.log(`[raw.json] Saved latest raw response -> ${RAW_JSON_PATH}`);
  } catch (error) {
    const err = error as Error;
    console.error('[raw.json] Failed to save raw response:', err.message);
  }
}

export function appendToResultJson(entry: Record<string, unknown>): void {
  if (!app.isPackaged) {
    try {
      let arr: Record<string, unknown>[] = [];
      try {
        if (fs.existsSync(RESULT_JSON_PATH)) {
          const raw = fs.readFileSync(RESULT_JSON_PATH, 'utf8');
          if (raw && raw.trim()) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) arr = parsed;
          }
        }
      } catch (e) {
        const err = e as Error;
        console.warn('[result.json] Failed to read existing file, starting fresh:', err.message);
        arr = [];
      }
      arr.push({
        timestamp: new Date().toISOString(),
        ...entry,
      });
      fs.writeFileSync(RESULT_JSON_PATH, JSON.stringify(arr, null, 2), 'utf8');
      console.log(`[result.json] Appended entry #${arr.length} -> ${RESULT_JSON_PATH}`);
    } catch (writeErr) {
      const err = writeErr as Error;
      console.error('[result.json] Failed to write:', err.message);
    }
  }
}
