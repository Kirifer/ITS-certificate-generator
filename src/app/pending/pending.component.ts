import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';  
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css'
})
export class PendingComponent implements OnInit {
  @ViewChild('certificateContainer', { static: false }) certificateContainer!: ElementRef;

  pendingCertificates: any[] = [];
  showModal = false;
  selectedCert: any = null;

  signaturePreview: string | ArrayBuffer | null = null;
  signaturePosition = { x: 500, y: 420 };
  signatureSize = { width: 160, height: 60 };

  dragging = false;
  resizing = false;
  offset = { x: 0, y: 0 };

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
    // Load user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userRole = (user.role || '').toLowerCase();

    // Restrict access if not approval_authority or both
    if (this.userRole !== 'approval_authority' && this.userRole !== 'both') {
      this.accessDenied = true;
    } else {
      this.fetchPendingCertificates();
    }
  }

  fetchPendingCertificates() {
    const headers = this.getAuthHeaders();

    this.http.get<any[]>('https://its-certificate-generator.onrender.com/api/pending-certificates', { headers })
      .subscribe({
        next: (data) => {
          this.pendingCertificates = data;
        },
        error: (err) => {
          console.error('Error fetching certificates (check auth/Cloudinary):', err);
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              alert('Unauthorized - Please log in again.');
            } else {
              alert('Failed to fetch pending certificates.');
            }
          }
        }
      });
  }

  openModal(cert: any) {
    this.selectedCert = { ...cert };

    if (!this.selectedCert.png_path || !this.selectedCert.png_path.startsWith('http')) {
      console.warn('Invalid Cloudinary URL for certificate:', cert.id);
      this.selectedCert.png_path = '';  
    }

    this.showModal = true;
    this.signaturePosition = { x: 440, y: 880 };
    this.signatureSize = { width: 160, height: 60 };
    this.signaturePreview = null;
  }

  closeModal() {
    this.showModal = false;
    this.signaturePreview = null;
  }

  approveCert(cert: any) {
    if (this.userRole !== 'approval_authority' && this.userRole !== 'both') {
      alert('You are not authorized to approve certificates.');
      return;
    }

    if (!this.certificateContainer?.nativeElement) {
      alert('Certificate preview not loaded.');
      return;
    }

    html2canvas(this.certificateContainer.nativeElement, {
      allowTaint: true,
      useCORS: true,  
      scale: 2
    }).then(canvas => {
      canvas.toBlob(blob => {
        if (blob) {
          // Cloudinary integration: Validate blob before sending to backend
          if (blob.size === 0 || !blob.type.startsWith('image/png')) {
            console.error('Generated signed PNG blob is invalid');
            alert('Failed to generate signed certificate image');
            return;
          }

          const formData = new FormData();
          formData.append('certificatePng', blob, 'approved_cert.png');  
          formData.append('id', cert.id.toString()); 
          const headers = this.getAuthHeaders();

          this.http.post('https://its-certificate-generator.onrender.com/api/approve-certificate-with-signature', formData, { headers })
            .subscribe({
              next: (response: any) => {
                console.log('Cloudinary approved cert URL:', response?.url);  
                alert('Certificate approved and uploaded to cloud storage!');
                this.fetchPendingCertificates();  
                this.closeModal();
              },
              error: (err) => {
                console.error('Error approving certificate (check Cloudinary/backend):', err);
                
                // Cloudinary-specific error handling 
                if (err instanceof HttpErrorResponse) {
                  if (err.status === 401) {
                    alert('Unauthorized - Please log in again.');
                  } else if (err.status === 500) {
                    console.error('Likely Cloudinary upload error:', err.error?.message || err.message);
                    alert('Failed to upload signed certificate to cloud storage. Check server logs.');
                  } else if (err.status === 403) {
                    alert('Not authorized to approve this certificate.');
                  } else {
                    alert(`Approval failed: ${err.error?.message || err.message}`);
                  }
                } else {
                  alert('Failed to generate or approve certificate.');
                }
              }
            });
        } else {
          alert('Failed to generate signed image.');
        }
      }, 'image/png');
    }).catch(err => {
      console.error('html2canvas error (e.g., loading Cloudinary image failed):', err);
      alert('Failed to preview certificate for signing. Ensure image loads from cloud.');
    });
  }

  rejectCert(cert: any) {
    if (this.userRole !== 'approval_authority' && this.userRole !== 'both') {
      alert('You are not authorized to reject certificates.');
      return;
    }

    const headers = this.getAuthHeaders();

    this.http.post(`https://its-certificate-generator.onrender.com/api/pending-certificates/${cert.id}/reject`, {}, { headers })
      .subscribe({
        next: () => {
          alert('Certificate rejected successfully.');
          this.fetchPendingCertificates();  // Refresh list
          this.closeModal();
        },
        error: (err) => {
          console.error('Rejection failed (check auth):', err);
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              alert('Unauthorized - Please log in again.');
            } else if (err.status === 403) {
              alert('Not authorized to reject this certificate.');
            } else {
              alert('Failed to reject certificate.');
            }
          }
        }
      });
  }

  onSignatureUpload(event: any) {
    const file = event.target.files[0];
    if (file && this.certificateContainer?.nativeElement) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {  // 5MB limit
        alert('Please upload a valid image file under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          this.signaturePreview = reader.result;

          const certEl = this.certificateContainer.nativeElement.querySelector('img');
          if (certEl) {
            const certWidth = certEl.clientWidth;
            const certHeight = certEl.clientHeight;
            const maxSignatureWidth = certWidth * 0.2;
            const aspectRatio = img.width / img.height;

            this.signatureSize.width = Math.min(maxSignatureWidth, img.width);
            this.signatureSize.height = this.signatureSize.width / aspectRatio;
            this.signaturePosition = {
              x: (certWidth - this.signatureSize.width) / 2,
              y: certHeight - this.signatureSize.height - 40
            };
          }
        };
        img.onerror = () => console.error('Failed to load signature image');
        img.src = reader.result as string;
      };
      reader.onerror = () => alert('Failed to read signature file.');
      reader.readAsDataURL(file);
    }
  }

  startDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('cursor-se-resize')) return;
    this.offset = {
      x: event.clientX - this.signaturePosition.x,
      y: event.clientY - this.signaturePosition.y
    };
    this.dragging = true;
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.stopActions);
  }

  onDragMove = (event: MouseEvent) => {
    if (this.dragging) {
      this.signaturePosition.x = event.clientX - this.offset.x;
      this.signaturePosition.y = event.clientY - this.offset.y;
    }
  };

  startResize(event: MouseEvent) {
    this.resizing = true;
    this.offset = { x: event.clientX, y: event.clientY };
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.stopActions);
    event.stopPropagation();
  }

  onResizeMove = (event: MouseEvent) => {
    if (this.resizing) {
      const dx = event.clientX - this.offset.x;
      const dy = event.clientY - this.offset.y;
      this.signatureSize.width += dx * 0.5;  // Slower resize for precision
      this.signatureSize.height += dy * 0.5;
      this.signatureSize.width = Math.max(50, this.signatureSize.width);  // Min width
      this.signatureSize.height = Math.max(20, this.signatureSize.height);  // Min height
      this.offset = { x: event.clientX, y: event.clientY };
    }
  };

  stopActions = () => {
    this.dragging = false;
    this.resizing = false;
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.stopActions);
  };
}