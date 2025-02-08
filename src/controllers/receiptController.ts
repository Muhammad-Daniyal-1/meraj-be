// pdfController.ts
import puppeteer from 'puppeteer';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const generateReceiptPdf = async (req: Request, res: Response) => {
    try {
        // Simulated data fetching (Replace with DB query)
        const invoiceData = {
            id: "4032",
            date: "October 27, 2023",
            recipient: {
                name: "John Hawk",
                address: "1 Titans Way, Nashville, Tennessee 37213"
            },
            items: [
                { name: "Property maintenance services (hourly)", qty: 20, cost: 80, total: 1600 },
                { name: "Yard maintenance services (hourly)", qty: 20, cost: 80, total: 1600 },
                { name: "One-off junk removal", qty: 1, cost: 310, total: 310, description: "Clearance of bulky furniture throughout property. Excludes carpets, curtains, fixtures and fittings." }
            ],
            subtotal: 3510,
            tax: 456.30,
            total: 3966.30
        };
        
        const templatePath = path.join(__dirname, 'receiptTemplate.html');
        let templateHtml = fs.readFileSync(templatePath, 'utf8');
        
        // Replace placeholders with actual data
        templateHtml = templateHtml.replace('{{invoiceId}}', invoiceData.id)
            .replace('{{date}}', invoiceData.date)
            .replace('{{recipientName}}', invoiceData.recipient.name)
            .replace('{{recipientAddress}}', invoiceData.recipient.address)
            .replace('{{subtotal}}', invoiceData.subtotal.toFixed(2))
            .replace('{{tax}}', invoiceData.tax.toFixed(2))
            .replace('{{total}}', invoiceData.total.toFixed(2));
        
        // Generate table rows dynamically
        let itemRows = '';
        invoiceData.items.forEach(item => {
            itemRows += `<tr><td>${item.name}</td><td>${item.description || ''}</td><td>${item.qty}</td><td>$${item.cost.toFixed(2)}</td><td>$${item.total.toFixed(2)}</td></tr>`;
        });
        templateHtml = templateHtml.replace('{{items}}', itemRows);
        
        // Launch Puppeteer and generate PDF
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(templateHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();
        
        // Send PDF response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=receipt.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal Server Error');
    }
};
