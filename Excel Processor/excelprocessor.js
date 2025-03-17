import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";

const ExcelMerger = () => {
  const [files, setFiles] = useState([]);

  const handleFileUpload = (event) => {
    setFiles([...event.target.files]);
  };

  const mergeExcelFiles = async () => {
    let mergedData = [];

    for (let file of files) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      mergedData = mergedData.concat(jsonData);
    }

    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(mergedData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Merged Data");
    XLSX.writeFile(newWorkbook, "merged_data.xlsx");
  };

  return (
    <div className="p-6 space-y-4">
      <input type="file" multiple accept=".xlsx, .xls" onChange={handleFileUpload} />
      <Button onClick={mergeExcelFiles} disabled={files.length === 0}>
        Merge Excel Files
      </Button>
    </div>
  );
};

export default ExcelMerger;
