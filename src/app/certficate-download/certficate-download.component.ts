import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-certficate-download',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './certficate-download.component.html',
  styleUrl:'./certficate-download.component.css'
})
export class CertficateDownloadComponent {
  showModal = false;
  selectedCert: any;

  openModal(cert: any) {
    this.selectedCert = cert;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedCert = null;
  }

  downloadSelectedCert() {
    if (!this.selectedCert || !this.selectedCert.downloadUrl) return;

    const link = document.createElement('a');
    link.href = this.selectedCert.downloadUrl;
    link.download = 'certificate.pdf'; // Change if needed
    link.click();

    this.closeModal();
  }

certificates = [
    {
      rname: 'John Doe',
      cname: 'Jose Rizal',
      certificate: 'Internship Certificate',
      status: 'Approved',
      fileName: 'john-doe.pdf'
    },
    {
      rname: 'Jane Doe',
      cname: 'Jose Laurel',
      certificate: 'Recognition Certificate',
      status: 'Approved',
      fileName: 'jane-doe.pdf'
    },
    {
      rname: 'Henry C',
      cname: 'Jose David',
      certificate: 'Appreciation Certificate',
      status: 'Approved',
      fileName: 'henry-c.pdf'
    },
    {
      rname: 'Henry D',
      cname: 'Jose Del Pilar',
      certificate: 'Appreciation Certificate',
      status: 'Approved',
      fileName: 'henry-d.pdf'
    },
    {
      rname: 'Juan Dela Cruz',
      cname: 'Jose Mercado',
      certificate: 'Recognition Certificate',
      status: 'Approved',
      fileName: 'juan-delacruz.pdf'
    }
  ];

  downloadCertificate(cert: any): void {
    const fileUrl = `assets/certificates/${cert.fileName}`;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = cert.fileName;
    a.click();
  }
}

