// Utility functions for exporting data to PDF and CSV

// Export to CSV
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header];
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  // Create CSV file
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

// Export to PDF (simplified version)
const exportToPDF = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create a simple HTML table for PDF
  const headers = Object.keys(data[0]);
  let html = '<table border="1" cellpadding="5" cellspacing="0">';

  // Add headers
  html += '<thead><tr>';
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead>';

  // Add data rows
  html += '<tbody>';
  data.forEach(item => {
    html += '<tr>';
    headers.forEach(header => {
      html += `<td>${item[header]}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank');
  printWindow.document.write('<html><head><title>Export to PDF</title></head><body>');
  printWindow.document.write(html);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
};

export { exportToCSV, exportToPDF };