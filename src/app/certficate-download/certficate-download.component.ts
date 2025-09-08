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
            creator: cert.creator,    
            certificate: 'Certificate',
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

  downloadSelectedCert() {
    if (!this.selectedCert || !this.selectedCert.imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous'; 
    img.src = this.selectedCert.imageUrl;

    img.onload = () => {
      const pdf = new jsPDF('landscape', 'pt', [img.width, img.height]);
      pdf.addImage(img, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`certificate-${this.selectedCert.name}.pdf`);
      this.closeModal();
    };

    img.onerror = (err) => {
      console.error('Failed to load image for PDF', err);
    };
  }
}
