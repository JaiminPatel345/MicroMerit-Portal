
import * as XLSX from 'xlsx';
import * as path from 'path';

const filePath = path.join(__dirname, '../data/nqr.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read the first 10 rows to find identifying headers
    const range = XLSX.utils.decode_range(sheet['!ref'] || "A1:Z10");
    const maxRow = Math.min(range.e.r, 10);
    
    console.log("Reading rows...");
    for(let R = range.s.r; R <= maxRow; ++R) {
        const row = [];
        for(let C = range.s.c; C <= range.e.c; ++C) {
            const cell = sheet[XLSX.utils.encode_cell({r:R, c:C})];
            row.push(cell ? cell.v : null);
        }
        console.log(`Row ${R}:`, JSON.stringify(row));
    }
    
} catch (error: any) {
    console.error("Error reading file:", error.message);
}
