import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';  
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

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userRole = (user.role || '').toLowerCase();

    if (this.userRole !== 'certificate_editor' && this.userRole !== 'both') {
      this.accessDenied = true;
    } else {
      this.fetchApprovedCertificates();
    }
  }

  fetchApprovedCertificates() {
    const headers = this.getAuthHeaders();

    this.http.get<any[]>('https://its-certificate-generator.onrender.com/api/approved-certificates', { headers })
      .subscribe({
        next: (data) => {
          this.certificates = data.map(cert => ({
            id: cert.id,
            name: cert.rname,
            creator: cert.creator_name,
            certificate: 'Certificate',
            certificateType: cert.certificate_type || 'Certificate',
            status: cert.status,
            imageUrl: cert.png_path  
          })).filter(cert => cert.imageUrl);  
        },
        error: (err) => {
          console.error('Failed to fetch approved certificates (check auth/Cloudinary):', err);
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              alert('Unauthorized - Please log in again.');
              // Optional: this.router.navigate(['/login']);  // Redirect if needed
            } else {
              alert('Failed to fetch approved certificates.');
            }
          }
        }
      });
  }

  openModal(cert: any) {
    // Cloudinary integration: Validate URL before opening modal
    if (!cert.imageUrl || !cert.imageUrl.startsWith('http')) {
      console.warn('Invalid Cloudinary URL for certificate:', cert.id);
      alert('Cannot preview: Invalid image URL.');
      return;
    }
    this.selectedCert = cert;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedCert = null;
  }

  downloadSelectedCert(format: 'pdf' | 'png' = 'pdf') {
    if (!this.selectedCert || !this.selectedCert.imageUrl) {
      alert('No valid image available for download.');
      return;
    }

    // Cloudinary integration: Validate URL before loading
    if (!this.selectedCert.imageUrl.startsWith('http')) {
      console.error('Invalid Cloudinary URL:', this.selectedCert.imageUrl);
      alert('Invalid image URL for download.');
      return;
    }

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
      console.error('Failed to load Cloudinary image for export:', err);
      alert('Failed to load image from cloud storage. Check URL or network.');
    };
  }

  removeCertificate(cert: any) {
    if (!confirm(`Are you sure you want to delete certificate for ${cert.name}? This will remove it from database and cloud storage.`)) return;

    const headers = this.getAuthHeaders();

    this.http.delete(`https://its-certificate-generator.onrender.com/api/approved-certificates/${cert.id}`, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Deleted Cloudinary URL:', cert.imageUrl);  
          this.certificates = this.certificates.filter(c => c.id !== cert.id);
          alert('Certificate deleted successfully from database and cloud storage.');
        },
        error: (err) => {
          console.error('Failed to delete certificate (check Cloudinary/backend):', err);
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              alert('Unauthorized - Please log in again.');
            } else if (err.status === 500) {
              console.error('Likely Cloudinary delete error:', err.error?.message || err.message);
              alert('Failed to delete from cloud storage. Check server logs.');
            } else {
              alert(`Delete failed: ${err.error?.message || err.message}`);
            }
          } else {
            alert('Failed to delete certificate.');
          }
        }
      });
  }
}