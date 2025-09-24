import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-certificate-download',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './certficate-download.component.html',
  styleUrls: ['./certficate-download.component.css']
})
export class CertificateDownloadComponent implements OnInit {
  certificates: any[] = [];
  showModal = false;
  selectedCert: any;

  // Role-based access
  accessDenied = false;
  userRole: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userRole = (user.role || '').toLowerCase();

    // Allow only certificate_editor or both
    if (this.userRole !== 'certificate_editor' && this.userRole !== 'both') {
      this.accessDenied = true;
    } else {
      this.fetchApprovedCertificates();
    }
  }

  fetchApprovedCertificates() {
    this.http.get<any[]>('https://its-certificate-generator.onrender.com/api/approved-certificates')
      .subscribe({
        next: (data) => {
          this.certificates = data.map(cert => ({
            id: cert.id,
            name: cert.rname,
            creator: cert.creator_name,
            certificate: 'Certificate',
            certificateType: cert.certificate_type || 'Certificate',
            status: cert.status,
            imageUrl: `https://its-certificate-generator.onrender.com/${cert.png_path}`
          }));
        },
        error: (err) => console.error('Failed to fetch approved certificates', err)
      });
  }

  openModal(cert: any) {
    this.selectedCert = cert;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedCert = null;
  }

  downloadSelectedCert(format: 'pdf' | 'png' = 'pdf') {
    if (!this.selectedCert || !this.selectedCert.imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.selectedCert.imageUrl;

    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      const aspectRatio = imgWidth / imgHeight;

      if (format === 'pdf') {
        const portraitTypes = ['Certificate of Completion', 'Certificate of Service'];
        const orientation = portraitTypes.includes(this.selectedCert.certificateType)
          ? 'portrait'
          : 'landscape';

        const pdf = new jsPDF(orientation, 'pt', 'letter');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        let renderWidth = pageWidth;
        let renderHeight = pageWidth / aspectRatio;

        if (renderHeight > pageHeight) {
          renderHeight = pageHeight;
          renderWidth = pageHeight * aspectRatio;
        }

        const x = (pageWidth - renderWidth) / 2;
        const y = (pageHeight - renderHeight) / 2;

        pdf.addImage(img, 'PNG', x, y, renderWidth, renderHeight);
        pdf.save(`certificate-${this.selectedCert.name}.pdf`);
      } else if (format === 'png') {
        const canvas = document.createElement('canvas');
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `certificate-${this.selectedCert.name}.png`;
          link.click();
        }
      }

      this.closeModal();
    };

    img.onerror = (err) => {
      console.error('Failed to load image for export', err);
    };
  }

  removeCertificate(cert: any) {
    if (!confirm(`Are you sure you want to delete certificate for ${cert.name}?`)) return;

    this.http.delete(`https://its-certificate-generator.onrender.com/api/approved-certificates/${cert.id}`)
      .subscribe({
        next: () => {
          this.certificates = this.certificates.filter(c => c.id !== cert.id);
          alert('Certificate deleted successfully.');
        },
        error: (err) => {
          console.error('Failed to delete certificate:', err);
          alert('Failed to delete certificate.');
        }
      });
  }
}
