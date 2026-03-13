"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAggregatePdfReport = exports.generatePdfReceipt = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
/**
 * Generates a premium PDF receipt for a single deposit
 */
const generatePdfReceipt = (depositData) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                margin: 50,
            });
            const fileName = `receipt-${depositData.id || (0, uuid_1.v4)()}.pdf`;
            const uploadDir = path_1.default.join(process.cwd(), 'uploads');
            if (!fs_1.default.existsSync(uploadDir))
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            const filePath = path_1.default.join(uploadDir, fileName);
            const stream = fs_1.default.createWriteStream(filePath);
            doc.pipe(stream);
            // Branding & Logo
            const logoPath = path_1.default.join(__dirname, 'assets', 'logo.png');
            if (fs_1.default.existsSync(logoPath)) {
                doc.image(logoPath, 50, 45, { width: 60 });
                doc.fontSize(22).fillColor('#f97316').font('Helvetica-Bold').text('SIMOTWET', 120, 50);
                doc.fontSize(10).fillColor('#71717a').font('Helvetica').text('COFFEE SOCIETY LIMITED', 120, 75);
            }
            else {
                doc.fontSize(22).fillColor('#f97316').font('Helvetica-Bold').text('SIMOTWET COFFEE SOCIETY', { align: 'center' });
            }
            doc.moveDown(2);
            doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 110).lineTo(550, 110).stroke();
            doc.moveDown(2);
            doc.fontSize(14).fillColor('#18181b').font('Helvetica-Bold').text('OFFICIAL DEPOSIT RECEIPT', { align: 'center' });
            doc.moveDown(2);
            // Info Grid
            doc.fontSize(10).fillColor('#3f3f46').font('Helvetica');
            const startY = doc.y;
            doc.text(`RECEIPT NO:`, 50, startY);
            doc.fillColor('#18181b').font('Helvetica-Bold').text(depositData.id || 'Pending', 150, startY);
            doc.fillColor('#3f3f46').font('Helvetica').text(`DATE:`, 50, startY + 15);
            doc.fillColor('#18181b').font('Helvetica-Bold').text(depositData.created_at ? new Date(depositData.created_at).toLocaleString() : new Date().toLocaleString(), 150, startY + 15);
            doc.fillColor('#3f3f46').font('Helvetica').text(`OPERATOR:`, 350, startY);
            doc.fillColor('#18181b').font('Helvetica-Bold').text(depositData.operator_name || 'Admin', 450, startY);
            doc.moveDown(3);
            // Member Section
            doc.fillColor('#f97316').fontSize(11).font('Helvetica-Bold').text('MEMBER IDENTIFICATION', 50, doc.y);
            doc.moveDown(0.3);
            doc.strokeColor('#f97316').lineWidth(0.5).moveTo(50, doc.y).lineTo(200, doc.y).stroke();
            doc.moveDown(0.8);
            doc.fontSize(10).fillColor('#3f3f46').font('Helvetica');
            doc.text(`FULL NAME:`, 50, doc.y);
            doc.fillColor('#18181b').font('Helvetica-Bold').text(depositData.user_name || 'N/A', 150, doc.y - 12);
            doc.moveDown(0.4);
            doc.text(`PHONE:`, 50, doc.y);
            doc.fillColor('#18181b').font('Helvetica-Bold').text(depositData.phone_number || 'N/A', 150, doc.y - 12);
            doc.moveDown(0.4);
            doc.text(`NATIONAL ID:`, 50, doc.y);
            doc.fillColor('#18181b').font('Helvetica-Bold').text(depositData.national_id || 'N/A', 150, doc.y - 12);
            doc.moveDown(3);
            // Volume Section (Highlighted)
            doc.rect(50, doc.y, 500, 70).fill('#fffaf5').stroke('#fdba74');
            doc.fillColor('#18181b').fontSize(18).font('Helvetica-Bold').text(`VOLUME: ${depositData.weight_kg} KG`, 70, doc.y + 15);
            doc.fontSize(11).fillColor('#4b5563').font('Helvetica').text(`QUALITY GRADE: ${depositData.quality_grade || 'Standard'}`, 70, doc.y + 5);
            doc.moveDown(2);
            doc.fillColor('#3f3f46').fontSize(10).font('Helvetica-Bold').text('NOTES:', 70, doc.y);
            doc.font('Helvetica').text(depositData.notes || 'No additional notes.', 70, doc.y + 2, { width: 460 });
            doc.moveDown(4);
            doc.strokeColor('#f97316').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);
            doc.fontSize(10).fillColor('#f97316').font('Helvetica-Bold').text('RECORD SUMMARY & AUTHENTICATION', 50, doc.y);
            doc.moveDown(0.5);
            doc.fontSize(8).fillColor('#71717a').font('Helvetica').text('This receipt confirms the digital entry in our immutable ledger. No password is required to view this document. Your total lifetime deposits are tracked in real-time.', { width: 480 });
            doc.moveDown(3);
            doc.fontSize(8).fillColor('#cbd5e1').font('Helvetica').text('Simotwet Coffee Society © 2026 - Digital Ledger Record', { align: 'center' });
            doc.end();
            stream.on('finish', () => resolve(`/uploads/${fileName}`));
            stream.on('error', (err) => reject(err));
        }
        catch (error) {
            reject(error);
        }
    });
});
exports.generatePdfReceipt = generatePdfReceipt;
/**
 * Generates an aggregate PDF report with a table layout for multiple records
 */
const generateAggregatePdfReport = (data, meta) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                margin: 50,
            });
            const fileName = `report-${meta.ref || (0, uuid_1.v4)()}.pdf`;
            const uploadDir = path_1.default.join(process.cwd(), 'uploads');
            if (!fs_1.default.existsSync(uploadDir))
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            const filePath = path_1.default.join(uploadDir, fileName);
            const stream = fs_1.default.createWriteStream(filePath);
            doc.pipe(stream);
            // Header & Branding
            const logoPath = path_1.default.join(__dirname, 'assets', 'logo.png');
            if (fs_1.default.existsSync(logoPath)) {
                doc.image(logoPath, 50, 40, { width: 50 });
                doc.fontSize(20).fillColor('#f97316').font('Helvetica-Bold').text('SIMOTWET', 110, 45);
                doc.fontSize(9).fillColor('#71717a').font('Helvetica').text('COFFEE SOCIETY - LOGISTICS DIVISION', 110, 68);
            }
            else {
                doc.fontSize(24).fillColor('#f97316').font('Helvetica-Bold').text('SIMOTWET COFFEE SOCIETY', { align: 'center' });
            }
            doc.moveDown(2);
            doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 95).lineTo(550, 95).stroke();
            doc.moveDown(1.5);
            doc.fontSize(14).fillColor('#18181b').font('Helvetica-Bold').text(`${meta.title || 'Aggregate Activity Report'}`, { align: 'left' });
            doc.fontSize(9).fillColor('#3f3f46').font('Helvetica').text(`GENERATED: ${new Date().toLocaleString()}`, { align: 'left' });
            doc.text(`SCOPE: ${meta.scope || 'Organization-Wide'}`, { align: 'left' });
            doc.moveDown(2);
            // Table Header
            const tableTop = doc.y;
            const columns = [
                { label: 'MEMBER NAME', width: 120 },
                { label: 'ID NO', width: 70 },
                { label: 'DATE', width: 70 },
                { label: 'VOL (KG)', width: 60 },
                { label: 'QUALITY', width: 60 },
                { label: 'STATUS', width: 60 },
                { label: 'PHONE', width: 90 }
            ];
            let currentX = 50;
            doc.rect(50, tableTop, 500, 25).fill('#f97316');
            doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
            columns.forEach(col => {
                doc.text(col.label, currentX + 5, tableTop + 8);
                currentX += col.width;
            });
            // Table Rows
            doc.fillColor('#18181b').font('Helvetica');
            let currentY = tableTop + 20;
            let totalVolume = 0;
            data.forEach((row, index) => {
                var _a, _b, _c;
                // Alternating row background
                if (index % 2 === 1) {
                    doc.rect(50, currentY, 500, 20).fill('#fff7ed');
                }
                doc.fillColor('#18181b');
                let cellX = 50;
                doc.text(row.user_name || ((_a = row.users) === null || _a === void 0 ? void 0 : _a.full_name) || 'N/A', cellX + 5, currentY + 5, { width: columns[0].width - 10, ellipsis: true });
                cellX += columns[0].width;
                doc.text(row.national_id || ((_b = row.users) === null || _b === void 0 ? void 0 : _b.national_id) || 'N/A', cellX + 5, currentY + 5);
                cellX += columns[1].width;
                doc.text(new Date(row.created_at).toLocaleDateString(), cellX + 5, currentY + 5);
                cellX += columns[2].width;
                doc.text(`${row.weight_kg}`, cellX + 5, currentY + 5);
                cellX += columns[3].width;
                doc.text(`${row.quality_grade || 'N/A'}`, cellX + 5, currentY + 5);
                cellX += columns[4].width;
                doc.text(`${row.status || 'N/A'}`, cellX + 5, currentY + 5);
                cellX += columns[5].width;
                doc.text(row.phone_number || ((_c = row.users) === null || _c === void 0 ? void 0 : _c.phone_number) || 'N/A', cellX + 5, currentY + 5);
                totalVolume += Number(row.weight_kg);
                currentY += 20;
                // Page break if needed
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }
            });
            // Footer / Total
            doc.moveDown(2);
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#f97316');
            doc.text(`TOTAL VOLUME: ${totalVolume.toFixed(2)} Kg`, 50, doc.y, { align: 'right' });
            doc.end();
            stream.on('finish', () => resolve(`/uploads/${fileName}`));
            stream.on('error', (err) => reject(err));
        }
        catch (error) {
            reject(error);
        }
    });
});
exports.generateAggregatePdfReport = generateAggregatePdfReport;
