import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generatePDF(proposal: any, settings: any = {}) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(settings.websiteName || 'Eastmy Media', 14, 22);

    doc.setFontSize(12);
    doc.text('Proposal', 14, 35);
    doc.text(`Client: ${proposal.clientName}`, 14, 45);
    doc.text(`Email: ${proposal.clientEmail}`, 14, 52);
    doc.text(`Date: ${new Date(proposal.createdAt).toLocaleDateString()}`, 14, 59);

    if (proposal.message) {
        doc.text(`Message: ${proposal.message}`, 14, 69);
    }

    const billboards = proposal.billboards || [];
    if (billboards.length > 0) {
        autoTable(doc, {
            startY: 80,
            head: [['#', 'Name', 'Location', 'Type', 'Price (RM)']],
            body: billboards.map((b: any, i: number) => [
                i + 1,
                b.name || 'N/A',
                b.location || 'N/A',
                b.type || 'N/A',
                Number(b.price || 0).toLocaleString(),
            ]),
        });
    }

    doc.save(`proposal_${proposal.clientName || 'client'}.pdf`);
}
