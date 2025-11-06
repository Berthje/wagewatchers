import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SalaryEntry } from "@/lib/db/schema";

interface SectorData {
  sector: string;
  count: number;
  avgGross: number;
  totalGross: number;
}

/**
 * Exports salary entries to CSV format and triggers download
 */
export const exportToCSV = (entries: SalaryEntry[]) => {
  if (entries.length === 0) return;

  const headers = [
    "Country",
    "Sector",
    "Job Title",
    "Age",
    "Experience (Years)",
    "Gross Salary",
    "Net Salary",
    "Education",
    "Employee Count",
    "Vacation Days",
    "Telework Days",
    "Stress Level",
    "Work City",
    "Created Date",
  ];

  const rows = entries.map((entry) => [
    entry.country || "",
    entry.sector || "",
    entry.jobTitle || "",
    entry.age || "",
    entry.workExperience || "",
    entry.grossSalary || "",
    entry.netSalary || "",
    entry.education || "",
    entry.employeeCount || "",
    entry.vacationDays || "",
    entry.teleworkDays || "",
    entry.stressLevel || "",
    entry.workCity || "",
    new Date(entry.createdAt).toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell))
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `salary-data-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Exports salary statistics to PDF format and triggers download
 */
export const exportToPDF = (
  entries: SalaryEntry[],
  selectedCountries: string[],
  selectedSectors: string[],
  sectorData: SectorData[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Function to add footer source attribution
  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Gray color
    doc.text("Source: wagewatchers.com", pageWidth - 14, pageHeight - 10, { align: "right" });
    doc.setTextColor(0, 0, 0); // Reset to black
  };

  // Add footer to first page
  addFooter();

  // Title
  doc.setFontSize(20);
  doc.text("Salary Statistics Report", pageWidth / 2, 20, {
    align: "center",
  });

  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });

  // Filter info
  let yPos = 40;
  doc.setFontSize(12);
  if (selectedCountries.length > 0 || selectedSectors.length > 0) {
    doc.text("Filters Applied:", 14, yPos);
    yPos += 6;
    doc.setFontSize(10);
    if (selectedCountries.length > 0) {
      doc.text(`Countries: ${selectedCountries.join(", ")}`, 14, yPos);
      yPos += 6;
    }
    if (selectedSectors.length > 0) {
      doc.text(`Sectors: ${selectedSectors.join(", ")}`, 14, yPos);
      yPos += 6;
    }
  }

  yPos += 5;

  // Summary statistics
  doc.setFontSize(12);
  doc.text("Summary Statistics", 14, yPos);
  yPos += 8;

  const totalEntries = entries.length;
  const avgSalary = entries.reduce((sum, e) => sum + (e.grossSalary || 0), 0) / totalEntries;
  const salaries = entries
    .map((e) => e.grossSalary || 0)
    .filter((s) => s > 0)
    .sort((a, b) => a - b);
  const medianSalary = salaries[Math.floor(salaries.length / 2)] || 0;

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Total Entries", totalEntries.toString()],
      ["Average Salary", `€${avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
      ["Median Salary", `€${medianSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
      ["Countries", new Set(entries.map((e) => e.country).filter(Boolean)).size.toString()],
      ["Sectors", new Set(entries.map((e) => e.sector).filter(Boolean)).size.toString()],
    ],
    theme: "striped",
    headStyles: { fillColor: [234, 88, 12] },
    didDrawPage: () => {
      // Add footer if new page was created
      if (doc.getCurrentPageInfo().pageNumber > 1) {
        addFooter();
      }
    },
  });

  // Top sectors table
  doc.addPage();
  addFooter(); // Add footer to new page
  doc.setFontSize(14);
  doc.text("Top 10 Sectors by Average Salary", 14, 20);

  autoTable(doc, {
    startY: 28,
    head: [["Sector", "Avg Salary", "Entries"]],
    body: sectorData
      .slice(0, 10)
      .map((s) => [
        s.sector,
        `€${s.avgGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        s.count.toString(),
      ]),
    theme: "striped",
    headStyles: { fillColor: [234, 88, 12] },
    didDrawPage: addFooter,
  });

  // Save the PDF
  doc.save(`salary-statistics-${new Date().toISOString().split("T")[0]}.pdf`);
};
