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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchApprovedCertificates();
  }

  fetchApprovedCertificates() {
    this.http.get<any[]>('http://localhost:4000/api/approved-certificates')
      .subscribe({
        next: (data) => {
          this.certificates = data.map(cert => ({
            id: cert.id,
            name: cert.rname,
            creator: cert.creator_name,
            certificate: 'Certificate',
            certificateType: cert.certificate_type || 'Certificate',
            status: cert.status,
            imageUrl: `http://localhost:4000/${cert.png_path}`
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
      //  PDF Export 
      const pdf = new jsPDF('landscape', 'pt', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

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
    } 
    

    this.closeModal();
  };

  img.onerror = (err) => {
    console.error('Failed to load image for export', err);
  };
}


removeCertificate(cert: any) {
  if (!confirm(`Are you sure you want to delete certificate for ${cert.name}?`)) return;

  this.http.delete(`http://localhost:4000/api/approved-certificates/${cert.id}`)
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

