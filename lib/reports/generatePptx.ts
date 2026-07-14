import PptxGenJS from "pptxgenjs";
import path from "path";
import { formatMoney } from "@/lib/formatMoney";
import type { MonthlyReportData } from "./monthly";

const NAVY = "44546A";
const BLUE = "2E75B5";
const MEDBLUE = "42719B";
const GREY = "C9C9C9";
const LIGHTBLUE = "C9DAF8";
const LIGHTGREY = "F2F2F2";
const WHITE = "FFFFFF";
const DARKTEXT = "434343";
const FONT = "Arial";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const LOGO_PATH = path.join(process.cwd(), "public", "assets", "da-logo.png");

type ExpenseItem = { description: string; amount: number };

export type MonthlyReportInput = {
  baseLabel: string;
  baseName: string;
  month: number;
  year: number;
  auto: MonthlyReportData;
  openingBalance: number;
  income: number;
  expenseItems: ExpenseItem[];
  theme: string;
  executiveSummary: string;
  issues: string;
  alternativeChurches: string;
  sundayTeaching: string;
  description: string;
  victories: string[];
  challenges: string[];
  plans: string[];
  updateOnTeens: string;
};

function dividerSlide(pptx: PptxGenJS, title: string) {
  const slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addText(title, {
    x: 0, y: 0, w: "100%", h: "100%",
    align: "center", valign: "middle",
    fontFace: FONT, fontSize: 44, bold: true, color: WHITE,
  });
  return slide;
}

export function buildMonthlyReportPptx(data: MonthlyReportInput): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "DA_WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "DA_WIDE";
  pptx.author = "DA Church Tracker";
  pptx.title = `Performance Report - ${data.baseLabel} - ${MONTHS[data.month - 1]} ${data.year}`;

  const monthLabel = MONTHS[data.month - 1].toUpperCase();
  const closing = data.openingBalance + data.income - data.expenseItems.reduce((s, e) => s + e.amount, 0);

  // Slide 1 - Cover
  const cover = pptx.addSlide();
  cover.background = { color: WHITE };
  cover.addImage({ path: LOGO_PATH, x: 5.17, y: 0.7, w: 3, h: 2.97 });
  cover.addText(
    [
      { text: "PERFORMANCE REPORT\n", options: { breakLine: true } },
      { text: `(${data.baseLabel.toUpperCase()} - ${monthLabel} ${data.year})` },
    ],
    { x: 1.3, y: 4.1, w: 10.7, h: 2.2, align: "center", valign: "top", fontFace: FONT, fontSize: 36, bold: true, color: NAVY },
  );

  // Slide 2 - Executive Summary divider
  dividerSlide(pptx, "Executive Summary");

  // Slide 3 - Executive Summary content
  const exec = pptx.addSlide();
  exec.background = { color: WHITE };
  exec.addText("DAVID'S ARMY", { x: 0.5, y: 0.3, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: NAVY });

  const execRows: { label: string; value: string }[] = [
    { label: "Estimated membership", value: String(data.auto.membership) },
    { label: "Issues", value: data.issues || "-" },
    { label: "Theme", value: data.theme || "-" },
    { label: "Revenue – ₦", value: formatMoney(data.income) },
    { label: "Expense – ₦", value: formatMoney(data.expenseItems.reduce((s, e) => s + e.amount, 0)) },
    { label: "A/C Balance", value: `DA ${data.baseLabel}: ${formatMoney(closing)}` },
    { label: "Alternative Churches", value: data.alternativeChurches || "-" },
  ];

  let execY = 1.2;
  for (const row of execRows) {
    exec.addText(row.label, { x: 0.5, y: execY, w: 3.8, h: 0.6, fontFace: FONT, fontSize: 14, bold: true, color: MEDBLUE, valign: "top" });
    exec.addText(row.value, { x: 4.4, y: execY, w: 8.3, h: 0.6, fontFace: FONT, fontSize: 14, color: DARKTEXT, valign: "top" });
    execY += 0.7;
  }

  // Slide 4 - Appendix divider
  dividerSlide(pptx, "Appendix");

  // Slide 5 - David's Army divider
  dividerSlide(pptx, "David's Army");

  // Slide 6 - Sunday Service
  const sunday = pptx.addSlide();
  sunday.background = { color: WHITE };
  sunday.addText("SUNDAY SERVICE", { x: 0.5, y: 0.3, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: NAVY });
  sunday.addText(`Sunday Service - Theme: ${data.theme || "-"}`, {
    x: 0.5, y: 1.1, w: 7.5, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: MEDBLUE,
  });
  sunday.addText(data.sundayTeaching || "", {
    x: 0.5, y: 1.6, w: 7.5, h: 4.5, fontFace: FONT, fontSize: 13, color: DARKTEXT, valign: "top",
  });

  if (data.auto.sundayAttendance.length) {
    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: "Date", options: { bold: true, color: WHITE, fill: { color: MEDBLUE } } },
        { text: "Attendance", options: { bold: true, color: WHITE, fill: { color: MEDBLUE } } },
      ],
      ...data.auto.sundayAttendance.map((a, idx): PptxGenJS.TableRow => [
        { text: new Date(a.date).toLocaleDateString(undefined, { month: "long", day: "numeric" }).toUpperCase(), options: { fill: { color: idx % 2 === 0 ? LIGHTGREY : WHITE } } },
        { text: String(a.count), options: { fill: { color: idx % 2 === 0 ? LIGHTGREY : WHITE } } },
      ]),
    ];
    sunday.addTable(tableRows, { x: 8.3, y: 1.1, w: 4.5, fontFace: FONT, fontSize: 13, color: DARKTEXT, border: { type: "solid", color: GREY, pt: 0.5 } });
  }

  // Slide 7 - Victories/Challenges/Plans + Finances
  const vcp = pptx.addSlide();
  vcp.background = { color: WHITE };
  vcp.addText("VICTORIES / CHALLENGES / PLANS", { x: 0.5, y: 0.3, w: 12.3, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, color: NAVY });

  const bulletBlock = (label: string, items: string[], y: number) => {
    vcp.addText(label, { x: 0.5, y, w: 6, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: MEDBLUE });
    vcp.addText(
      items.length ? items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })) : [{ text: "-" }],
      { x: 0.5, y: y + 0.4, w: 6, h: 1.1, fontFace: FONT, fontSize: 12, color: DARKTEXT, valign: "top" },
    );
  };

  vcp.addText(data.description || "-", { x: 0.5, y: 1.0, w: 6, h: 0.5, fontFace: FONT, fontSize: 12, color: DARKTEXT, italic: true });
  bulletBlock("Victories", data.victories, 1.5);
  bulletBlock("Challenges", data.challenges, 3.0);
  bulletBlock("Plans", data.plans, 4.5);

  const financeRows: PptxGenJS.TableRow[] = [
    [
      { text: "Item", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: `${data.baseLabel} ₦`, options: { bold: true, color: WHITE, fill: { color: NAVY } } },
    ],
    [{ text: "Opening Balance" }, { text: formatMoney(data.openingBalance) }],
    [{ text: "Income" }, { text: formatMoney(data.income) }],
    ...data.expenseItems.map((item): PptxGenJS.TableRow => [{ text: item.description }, { text: formatMoney(item.amount) }]),
    [
      { text: "Closing Balance", options: { bold: true, fill: { color: LIGHTBLUE } } },
      { text: formatMoney(closing), options: { bold: true, fill: { color: LIGHTBLUE } } },
    ],
  ];

  vcp.addText("FINANCES", { x: 7.3, y: 1.0, w: 5.5, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: MEDBLUE });
  vcp.addTable(financeRows, { x: 7.3, y: 1.4, w: 5.5, fontFace: FONT, fontSize: 12, color: DARKTEXT, border: { type: "solid", color: GREY, pt: 0.5 } });

  // Slide 8 - Update on Teens
  const teens = pptx.addSlide();
  teens.background = { color: WHITE };
  teens.addText("UPDATE ON TEENS", { x: 0.5, y: 0.3, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: NAVY });
  teens.addText(data.updateOnTeens || "", { x: 0.5, y: 1.3, w: 12.3, h: 5.5, fontFace: FONT, fontSize: 15, color: DARKTEXT, valign: "top" });

  return pptx;
}
