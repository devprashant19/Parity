import { jsPDF } from 'jspdf';
import { VerificationResult, FieldComparison } from '../compare/types';

/**
 * Generates an authoritative PDF verification report using jsPDF.
 * Suitable for both client-side download and Node.js testing.
 */
export function generatePdfReport(
  result: VerificationResult,
  presetTitle = 'Document Packet Verification'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Primary brand header bar
  doc.setFillColor(11, 15, 26); // #0b0f1a dark slate
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent stripe
  doc.setFillColor(239, 77, 35); // #ef4d23 parity orange
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Brand Logo: 8 circles around center in #ef4d23
  const logoX = margin + 3.5;
  const logoY = 13;
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const rCircle = 0.9;
  const radius = 2.6;
  doc.setFillColor(239, 77, 35); // #ef4d23
  doc.circle(logoX, logoY, rCircle, 'F');
  for (const deg of petalAngles) {
    const rad = (deg * Math.PI) / 180;
    doc.circle(logoX + radius * Math.cos(rad), logoY + radius * Math.sin(rad), rCircle, 'F');
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PARITY — VERIFICATION AUDIT REPORT', margin + 10, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 205, 215);
  doc.text(
    `Deterministic Pre-Submission Document Verification • Generated: ${new Date().toLocaleString()}`,
    margin + 10,
    21
  );

  y = 38;

  // Metadata Card
  doc.setFillColor(245, 246, 248);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'D');

  doc.setTextColor(30, 35, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Packet Configuration: ${presetTitle}`, margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Packet Mode: ${result.packet_type.toUpperCase()}`, margin + 5, y + 14);

  // Summary Metrics Badge Blocks
  const badgeX = pageWidth - margin - 75;
  // Conflict Badge
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(badgeX, y + 4, 22, 13, 1, 1, 'FD');
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONFLICT', badgeX + 2, y + 8);
  doc.setFontSize(11);
  doc.text(String(result.conflicts_count), badgeX + 8, y + 15);

  // Consistent Badge
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(badgeX + 25, y + 4, 23, 13, 1, 1, 'FD');
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MATCHED', badgeX + 27, y + 8);
  doc.setFontSize(11);
  doc.text(String(result.consistent_count), badgeX + 33, y + 15);

  // Needs Review Badge
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(59, 130, 246);
  doc.roundedRect(badgeX + 51, y + 4, 22, 13, 1, 1, 'FD');
  doc.setTextColor(29, 78, 216);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REVIEW', badgeX + 54, y + 8);
  doc.setFontSize(11);
  doc.text(String(result.needs_review_count), badgeX + 59, y + 15);

  y += 28;

  // Section Header: Detailed Findings
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Field Verification Audit Findings', margin, y);
  y += 6;

  // Render each field card
  result.fields.forEach((field, index) => {
    // Check page overflow
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin + 5;
    }

    const cardHeight = Math.max(30, 18 + field.documents.length * 6);

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, cardHeight, 1.5, 1.5, 'FD');

    // Left status accent line
    if (field.status === 'Conflict') {
      doc.setFillColor(220, 38, 38);
    } else if (field.status === 'Consistent') {
      doc.setFillColor(22, 163, 74);
    } else {
      doc.setFillColor(37, 99, 235);
    }
    doc.rect(margin, y, 2.5, cardHeight, 'F');

    // Field Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}. ${field.field_label}`, margin + 5, y + 6);

    // Status Pill
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    if (field.status === 'Conflict') {
      doc.setTextColor(220, 38, 38);
    } else if (field.status === 'Consistent') {
      doc.setTextColor(22, 163, 74);
    } else {
      doc.setTextColor(37, 99, 235);
    }
    doc.text(`[ ${field.status.toUpperCase()} ]`, pageWidth - margin - 25, y + 6);

    // Status reason
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const splitReason = doc.splitTextToSize(field.status_reason, pageWidth - margin * 2 - 10);
    doc.text(splitReason, margin + 5, y + 11);

    let docY = y + 17;
    field.documents.forEach((d) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`• ${d.doc_label}:`, margin + 6, docY);

      doc.setFont('courier', 'normal');
      doc.setTextColor(15, 23, 42);
      const valStr = d.raw_value ? `"${d.raw_value}"` : '<NOT FOUND>';
      doc.text(valStr, margin + 45, docY);

      if (d.quote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const excerpt = d.quote.length > 55 ? `${d.quote.slice(0, 55)}...` : d.quote;
        doc.text(`(Quote: "${excerpt}")`, margin + 95, docY);
      }

      docY += 5;
    });

    y += cardHeight + 4;
  });

  // Footer Disclaimer Section
  if (y > pageHeight - 35) {
    doc.addPage();
    y = margin;
  } else {
    y = Math.max(y + 6, pageHeight - 30);
  }

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'D');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VERIFICATION BOUNDARY & DISPUTE NOTICE', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const disclaimer =
    'This audit report was compiled by Parity using multimodal text perception and deterministic comparison logic. ' +
    'The AI model never decides whether fields match; all equivalences are evaluated by formal algorithmic rules. ' +
    'This document is intended for student pre-submission review and administrative error correction requests.';
  doc.text(doc.splitTextToSize(disclaimer, pageWidth - margin * 2 - 6), margin + 3, y + 10);

  return doc;
}

/**
 * Client-side helper to generate and trigger instant PDF file download.
 */
export function downloadPdfReport(result: VerificationResult, presetTitle?: string): void {
  const doc = generatePdfReport(result, presetTitle);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`parity-verification-report-${dateStr}.pdf`);
}
