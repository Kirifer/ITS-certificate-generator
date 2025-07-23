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
certificates = [
    {
      name: 'John Doe',
      certificate: 'Internship Certificate',
      status: 'Approved',
      fileName: 'john-doe.pdf'
    },
    {
      name: 'Jane Doe',
      certificate: 'Recognition Certificate',
      status: 'Approved',
      fileName: 'jane-doe.pdf'
    },
    {
      name: 'Henry C',
      certificate: 'Appreciation Certificate',
      status: 'Approved',
      fileName: 'henry-c.pdf'
    },
    {
      name: 'Henry D',
      certificate: 'Appreciation Certificate',
      status: 'Approved',
      fileName: 'henry-d.pdf'
    },
    {
      name: 'Juan Dela Cruz',
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

