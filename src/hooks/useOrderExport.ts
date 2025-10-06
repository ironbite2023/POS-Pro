import { useState } from 'react';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Database } from '@/lib/supabase/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

interface UseOrderExportReturn {
  exportToExcel: (orders: Order[], filename?: string) => void;
  exportToPDF: (orders: Order[], title?: string) => void;
  exporting: boolean;
  error: Error | null;
}

export const useOrderExport = (): UseOrderExportReturn => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToExcel = async (orders: Order[], filename?: string) => {
    try {
      setExporting(true);
      setError(null);

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Orders');

      // Define columns
      worksheet.columns = [
        { header: 'Order Number', key: 'orderNumber', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Type', key: 'type', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        { header: 'Subtotal', key: 'subtotal', width: 12 },
        { header: 'Tax', key: 'tax', width: 10 },
        { header: 'Total', key: 'total', width: 12 },
        { header: 'Table', key: 'table', width: 10 },
        { header: 'Phone', key: 'phone', width: 15 },
      ];

      // Add data rows
      orders.forEach(order => {
        worksheet.addRow({
          orderNumber: order.order_number,
          date: format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
          customer: order.customer_name || 'Guest',
          type: order.order_type,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method || '-',
          subtotal: order.subtotal,
          tax: order.tax_amount,
          total: order.total_amount,
          table: order.table_number || '-',
          phone: order.customer_phone || '-',
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const defaultFilename = `orders-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      link.download = filename || defaultFilename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError(err as Error);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = (orders: Order[], title?: string) => {
    try {
      setExporting(true);
      setError(null);

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(title || 'Sales Report', 20, 20);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 30);

      // Prepare table data
      const tableData = orders.map(order => [
        order.order_number,
        format(new Date(order.created_at), 'MM/dd HH:mm'),
        order.customer_name || 'Guest',
        order.order_type,
        order.status,
        `$${order.total_amount.toFixed(2)}`,
      ]);

      // Add table
      autoTable(doc, {
        startY: 40,
        head: [['Order #', 'Date/Time', 'Customer', 'Type', 'Status', 'Total']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Add summary
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total Orders: ${totalOrders}`, 20, finalY);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, finalY + 10);
      doc.text(`Average Order Value: $${avgOrderValue.toFixed(2)}`, 20, finalY + 20);

      // Download PDF
      const defaultFilename = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(defaultFilename);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setError(err as Error);
    } finally {
      setExporting(false);
    }
  };

  return { exportToExcel, exportToPDF, exporting, error };
};
