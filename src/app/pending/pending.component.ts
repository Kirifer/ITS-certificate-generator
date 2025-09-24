import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  openModal(cert: any) {
    this.selectedCert = { ...cert };
    const fullPath = cert.png_path || '';
    const filename = fullPath.split('\\').pop()?.split('/').pop();
    this.selectedCert.png_path = `uploads/${filename}`;
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

    html2canvas(this.certificateContainer.nativeElement, {
      allowTaint: true,
      useCORS: true,
      scale: 2
    }).then(canvas => {
      canvas.toBlob(blob => {
        if (blob) {
          const formData = new FormData();
          formData.append('certificatePng', blob, 'approved_cert.png');
          formData.append('id', cert.id);

          this.http.post('https://its-certificate-generator.onrender.com/api/approve-certificate-with-signature', formData)
            .subscribe({
              next: () => {
                alert('Certificate approved and saved with signature!');
                this.fetchPendingCertificates();
                this.closeModal();
              },
              error: err => {
                console.error('Error saving certificate with signature:', err);
                alert('Failed to save certificate');
              }
            });
        }
      }, 'image/png');
    });
  }

  rejectCert(cert: any) {
    if (this.userRole !== 'approval_authority' && this.userRole !== 'both') {
      alert('You are not authorized to reject certificates.');
      return;
    }

    this.http.post(`https://its-certificate-generator.onrender.com/api/pending-certificates/${cert.id}/reject`, {}).subscribe({
      next: () => {
        this.fetchPendingCertificates();
        this.closeModal();
      },
      error: (err) => console.error('Rejection failed:', err)
    });
  }

  onSignatureUpload(event: any) {
    const file = event.target.files[0];
    if (file && this.certificateContainer?.nativeElement) {
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

            this.signatureSize.width = maxSignatureWidth;
            this.signatureSize.height = maxSignatureWidth / aspectRatio;
            this.signaturePosition = {
              x: (certWidth - this.signatureSize.width) / 2,
              y: certHeight - this.signatureSize.height - 40
            };
          }
        };
        img.src = reader.result as string;
      };
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
      this.signatureSize.width += dx;
      this.signatureSize.height += dy;
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
