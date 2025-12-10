import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MediaItem {
    name: string;
    location: string;
    type: string;
    price: number;
    width?: number;
    height?: number;
    traffic?: string;
    image?: string;
    // New fields for the detailed view
    skuId?: string;
    resolution?: string;
    operatingTime?: string;
    fileFormat?: string;
    availability?: string;
    gps?: string;
    rentalRates?: { duration: string; rentalPrice: number }[];
    [key: string]: any;
}

interface ProposalData {
    clientName: string;
    clientEmail: string;
    message?: string;
    createdAt: string;
    billboards: MediaItem[];
    totalAmount?: number;
}

export const generatePDF = async (proposal: ProposalData, settings?: any, returnDoc: boolean = false) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Settings Defaults
    const companyName = settings?.companyName || "SBH OUTDOOR MEDIA";
    const website = settings?.website || "eastmymedia.my";
    const footerText = settings?.footerText || "Your Gateway to Audience";
    const sstRate = (settings?.sstRate || 8) / 100;
    const logoText = settings?.logoUrl || companyName; // Using logoUrl field for text logo for now

    // Colors
    const white: [number, number, number] = [255, 255, 255];
    const black: [number, number, number] = [0, 0, 0];
    const teal: [number, number, number] = [20, 184, 166]; // Teal-500
    const grayText: [number, number, number] = [55, 65, 81]; // Gray-700
    const grayBorder: [number, number, number] = [209, 213, 219]; // Gray-300
    const darkFooter: [number, number, number] = [15, 23, 42]; // Slate-900

    // Helper to load image and get dimensions
    const getImageProperties = (url: string): Promise<{ width: number; height: number; ratio: number; data: string }> => {
        return new Promise(async (resolve, reject) => {
            try {
                // Use proxy to avoid CORS issues
                const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    const img = new Image();
                    img.onload = () => {
                        resolve({
                            width: img.width,
                            height: img.height,
                            ratio: img.width / img.height,
                            data: base64data
                        });
                    };
                    img.src = base64data;
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error("Error fetching image:", url, error);
                reject(error);
            }
        });
    };

    // --- ITEM PAGES ---
    // Use for...of loop to support await
    for (let index = 0; index < proposal.billboards.length; index++) {
        const item = proposal.billboards[index];

        if (index > 0) doc.addPage();

        // 1. Background
        doc.setFillColor(white[0], white[1], white[2]);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // 2. Header
        // Title (Left)
        doc.setTextColor(black[0], black[1], black[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(item.name.toUpperCase(), 10, 15);

        // Subtitle (Location)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        doc.text(`1 Panel ${item.type} Billboard at ${item.location}`, 10, 20);

        // Logo (Right) - Text Placeholder
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(teal[0], teal[1], teal[2]);
        doc.text(logoText, pageWidth - 10, 15, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayText[0], grayText[1], grayText[2]);
        doc.text(footerText, pageWidth - 10, 19, { align: 'right' });
        doc.setTextColor(teal[0], teal[1], teal[2]);
        doc.text(website, pageWidth - 10, 23, { align: 'right' });

        // 3. Main Layout (3 Columns)
        const startY = 30;
        const colGap = 5;
        const sideMargin = 10;
        const availableWidth = pageWidth - (sideMargin * 2);
        const colWidth = (availableWidth - (colGap * 2)) / 3;
        const imgHeight = 90;

        // Column 1: Main Image
        if (item.image) {
            try {
                // Load image to get dimensions
                const imgProps = await getImageProperties(item.image);

                // Calculate "contain" dimensions
                const boxRatio = colWidth / imgHeight;
                let drawW = colWidth;
                let drawH = imgHeight;
                let drawX = sideMargin;
                let drawY = startY;

                if (imgProps.ratio > boxRatio) {
                    // Image is wider than box -> Fit to width
                    drawH = colWidth / imgProps.ratio;
                    drawY = startY + (imgHeight - drawH) / 2; // Center vertically
                } else {
                    // Image is taller than box -> Fit to height
                    drawW = imgHeight * imgProps.ratio;
                    drawX = sideMargin + (colWidth - drawW) / 2; // Center horizontally
                }

                doc.addImage(imgProps.data, 'JPEG', drawX, drawY, drawW, drawH);

                // Optional: Draw a border around the image box area to show the bounds
                // doc.setDrawColor(240, 240, 240);
                // doc.rect(sideMargin, startY, colWidth, imgHeight, 'S');

            } catch (e) {
                console.error("Failed to add image to PDF", e);
                doc.setFillColor(240, 240, 240);
                doc.rect(sideMargin, startY, colWidth, imgHeight, 'F');
                doc.setTextColor(150, 150, 150);
                doc.text("Image Error", sideMargin + colWidth / 2, startY + imgHeight / 2, { align: 'center' });
            }
        } else {
            doc.setFillColor(240, 240, 240);
            doc.rect(sideMargin, startY, colWidth, imgHeight, 'F');
            doc.setTextColor(150, 150, 150);
            doc.text("No Image", sideMargin + colWidth / 2, startY + imgHeight / 2, { align: 'center' });
        }

        // Column 2: Map Image
        const col2X = sideMargin + colWidth + colGap;

        // Try to generate Mapbox Static Image
        let mapLoaded = false;
        if (item.gps && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
            try {
                // Parse GPS "lat, lng" -> Mapbox expects "lng,lat"
                const [lat, lng] = item.gps.split(',').map((s: string) => s.trim());
                if (lat && lng) {
                    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
                    // Add red pin marker: pin-s+f00({lng},{lat})
                    // Static API: https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom},{bearing},{pitch}/{width}x{height}@2x?access_token={token}
                    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+f00(${lng},${lat})/${lng},${lat},15,0,0/600x400?access_token=${token}`;

                    const mapProps = await getImageProperties(mapUrl);

                    // Calculate "contain" dimensions for map (same as main image)
                    const boxRatio = colWidth / imgHeight;
                    let drawW = colWidth;
                    let drawH = imgHeight;
                    let drawX = col2X;
                    let drawY = startY;

                    if (mapProps.ratio > boxRatio) {
                        // Image is wider than box -> Fit to width
                        drawH = colWidth / mapProps.ratio;
                        drawY = startY + (imgHeight - drawH) / 2; // Center vertically
                    } else {
                        // Image is taller than box -> Fit to height
                        drawW = imgHeight * mapProps.ratio;
                        drawX = col2X + (colWidth - drawW) / 2; // Center horizontally
                    }

                    doc.addImage(mapProps.data, 'JPEG', drawX, drawY, drawW, drawH);
                    mapLoaded = true;
                }
            } catch (e) {
                console.error("Error generating static map:", e);
            }
        }

        if (!mapLoaded) {
            doc.setFillColor(245, 245, 245);
            doc.rect(col2X, startY, colWidth, imgHeight, 'F');
            doc.setTextColor(150, 150, 150);
            doc.text("Map View Placeholder", col2X + colWidth / 2, startY + imgHeight / 2, { align: 'center' });
        }

        // Column 3: Info Boxes
        const col3X = col2X + colWidth + colGap;
        let boxY = startY;

        const drawInfoBox = (title: string, data: [string, string][]) => {
            // Box Header
            doc.setDrawColor(grayBorder[0], grayBorder[1], grayBorder[2]);
            doc.setFillColor(white[0], white[1], white[2]);
            doc.rect(col3X, boxY, colWidth, 6, 'S'); // Header Border

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(black[0], black[1], black[2]);
            doc.text(title, col3X + 2, boxY + 4.5);

            // Box Content
            let contentY = boxY + 6;
            const lineHeight = 5;
            const boxHeight = (data.length * lineHeight) + 4;

            doc.rect(col3X, boxY + 6, colWidth, boxHeight, 'S'); // Content Border

            data.forEach(([label, value]) => {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(grayText[0], grayText[1], grayText[2]);
                doc.text(label, col3X + 2, contentY + 3.5);

                doc.text(":", col3X + 25, contentY + 3.5);

                // Wrap text for value
                const valueWidth = colWidth - 28;
                const splitValue = doc.splitTextToSize(value, valueWidth);
                doc.text(splitValue, col3X + 28, contentY + 3.5);

                contentY += lineHeight * (splitValue.length > 1 ? splitValue.length * 0.8 : 1);
            });

            boxY = contentY + 4; // Spacing for next box
        };

        // Box 1: Media Info
        drawInfoBox("Media Info", [
            ["Location", item.location],
            ["GPS Coordinate", item.gps || "N/A"],
            ["Media Type", item.type],
            ["Screen Size", item.width && item.height ? `${item.width}m (W) x ${item.height}m (H)` : "N/A"],
            ["Resolution", item.resolution || "1920 x 1080"],
            ["Traffic Volume", item.traffic || "N/A"],
            ["Media Availability", item.availability ? "Available" : "Subject to Availability"]
        ]);

        // Box 2: Screen Info (Only for Digital Media)
        const isDigital = item.type.toLowerCase().includes('digital') || item.type.toLowerCase().includes('screen');

        if (isDigital) {
            drawInfoBox("Screen Info", [
                ["Screening Hours", item.operatingTime || "7:00am - 12:00am"],
                ["Duration Per Ad", "15 Seconds"],
                ["No. of Advertiser", "9 Ads"], // Hardcoded based on image
                ["File Format", item.fileFormat || "MP4, MOV & JPEG"]
            ]);
        }

        // Box 3: Description
        drawInfoBox("Description", [
            ["Landmark", item.landmark || "N/A"],
            ["Target Market", item.targetMarket || "General Public"]
        ]);


        // 4. Pricing Table
        const tableY = Math.max(startY + imgHeight + 10, boxY + 5);

        const price = Number(item.price) || 0;
        // const sstRate = 0.08; // Now using variable from settings

        // Helper to calculate row
        const createRow = (duration: string, rental: number, production: number) => {
            const sst = (rental + production) * sstRate;
            const total = rental + production + sst;
            return [
                duration,
                `RM${rental.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'N/A',
                `RM${production.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `RM${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `RM${sst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ];
        };

        const tableHead = [['Duration', 'Rental', 'Change of Material', 'Production', 'Total', `SST ${sstRate * 100}%`]];

        let tableData: any[] = [];

        if (item.rentalRates && item.rentalRates.length > 0) {
            // Use defined rental rates
            tableData = item.rentalRates.map((rate: any) => [
                rate.duration,
                `RM${Number(rate.rentalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'N/A',
                `RM${Number(rate.productionCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `RM${Number(rate.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `RM${Number(rate.sst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ]);
        } else {
            // Fallback to calculated rates
            tableData = [
                createRow('Daily', Math.round(price / 30), 500),
                createRow('Weekly', Math.round(price / 4), 500),
                createRow('1 Month', price, 500)
            ];
        }

        autoTable(doc, {
            startY: tableY,
            head: tableHead,
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: white,
                textColor: black,
                halign: 'center',
                valign: 'middle',
                fontSize: 9,
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: grayBorder
            },
            bodyStyles: {
                fillColor: white,
                textColor: black,
                halign: 'center',
                valign: 'middle',
                fontSize: 9,
                cellPadding: 4,
                lineWidth: 0.1,
                lineColor: grayBorder
            },
            columnStyles: {
                0: { fontStyle: 'bold' }
            },
            margin: { left: sideMargin, right: sideMargin },
            tableWidth: 'auto'
        });

        // 5. Bank Details
        if (settings?.bankName && settings?.bankAccountNumber) {
            const bankY = (doc as any).lastAutoTable.finalY + 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(black[0], black[1], black[2]);
            doc.text("Payment Details:", sideMargin, bankY);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(grayText[0], grayText[1], grayText[2]);
            doc.text(`${settings.bankName}`, sideMargin, bankY + 5);
            doc.text(`${settings.bankAccountNumber}`, sideMargin, bankY + 10);
            if (settings.bankAccountName) {
                doc.text(`${settings.bankAccountName}`, sideMargin, bankY + 15);
            }
        }

        // 5. Footer
        doc.setFillColor(darkFooter[0], darkFooter[1], darkFooter[2]);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    }

    // Save or Return
    if (returnDoc) {
        return doc;
    } else {
        const fileName = `Proposal_${proposal.clientName.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
    }
};
