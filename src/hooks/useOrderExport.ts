import { useState } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
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

  const exportToExcel = (orders: Order[], filename?: string) => {
    try {
      setExporting(true);
      setError(null);

      // Prepare data for export
      const exportData = orders.map(order => ({
        'Order Number': order.order_number,
        'Date': format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
        'Customer': order.customer_name || 'Guest',
        'Type': order.order_type,
        'Status': order.status,
        'Payment Status': order.payment_status,
        'Payment Method': order.payment_method || '-',
        'Subtotal': order.subtotal,
        'Tax': order.tax_amount,
        'Total': order.total_amount,
        'Table': order.table_number || '-',
        'Phone': order.customer_phone || '-',
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');

      // Download file
      const defaultFilename = `orders-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, filename || defaultFilename);
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
