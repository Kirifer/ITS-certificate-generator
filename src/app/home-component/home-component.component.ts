import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home-component.component.html',
  styleUrl: './home-component.component.css'
})
export class HomeComponentComponent implements OnInit {
  @ViewChild('certificateContainer', { static: false }) certificateContainer!: ElementRef;
  pendingCertificates: any[] = [];
  certificates: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchPendingCertificates();
    this.fetchApprovedCertificates();
  }

  fetchPendingCertificates() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userEmail = user.email;

    this.http.get<any[]>(`https://its-certificate-generator.onrender.com/api/pending-certificates?email=${encodeURIComponent(userEmail)}`)
      .subscribe({
        next: (data) => {
          this.pendingCertificates = data;
        },
        error: (err) => {
          console.error('Error fetching certificates:', err);
        }
      });
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
          }));
        },
        error: (err) => console.error('Failed to fetch approved certificates', err)
      });
  }
}