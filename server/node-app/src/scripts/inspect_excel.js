
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const files = ['Qualifications 30-11-2025 08_17_20.xlsx', 'View List of QPs30_11_2025.xls'];

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`\n--- Inspecting ${file} ---`);
        const workbook = XLSX.readFile(path.join(__dirname, '../../data/Qualifications 30-11-2025 08_17_20.xlsx'));
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 3 }); 

console.log('Headers (Row 4):', data[0]);
console.log('Sample Data (Row 5):', data[1]);
        if (data.length > 0) {
            console.log('Row 4:', data[0]);
            console.log('Row 5:', data[1]);
        } else {
            console.log('Empty sheet');
        }
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
