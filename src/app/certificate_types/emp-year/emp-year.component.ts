import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import html2canvas from 'html2canvas';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-emp-year',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './emp-year.component.html',
  styleUrls: ['./emp-year.component.css']
})
export class EmpYearComponent implements OnInit {
  certificateForm!: FormGroup;

  // UI state used by your template
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png';
  showCertificatePreview = false;
  isModalOpen = false;
  isSubmitting = false;

  // Adjust if you use envs / proxy
  private readonly API_BASE = 'http://localhost:4000';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.certificateForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      numberOfSignatories: ['1', Validators.required],
      signatory1Name: ['', [Validators.required]],
      signatory1Role: ['', [Validators.required]],
      signatory2Name: [''],
      signatory2Role: ['']
    });

    this.updateSignatoryValidators(1);
  }

  get f() {
    return this.certificateForm.controls;
  }

  goBack() {
    this.router.navigate(['/certificates']);
  }

  openCertificatePreview() {
    this.showCertificatePreview = true;
  }

  closeCertificatePreview() {
    this.showCertificatePreview = false;
  }

  openModal() {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onSignatoryCountChange() {
    const count = parseInt(this.certificateForm.value.numberOfSignatories, 10);
    this.updateSignatoryValidators(count);
  }

  private updateSignatoryValidators(count: number) {
    const s2Name = this.certificateForm.get('signatory2Name');
    const s2Role = this.certificateForm.get('signatory2Role');

    if (count === 1) {
      s2Name?.clearValidators();
      s2Role?.clearValidators();
    } else {
      s2Name?.setValidators([Validators.required]);
      s2Role?.setValidators([Validators.required]);
    }
    s2Name?.updateValueAndValidity();
    s2Role?.updateValueAndValidity();
  }

  // Safely capture the certificate DOM as a PNG
  private captureCertificateAsPng(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const certificateElement = document.querySelector('.certificate') as HTMLElement | null;
      if (!certificateElement) {
        reject(new Error('Certificate element not found.'));
        return;
      }

      html2canvas(certificateElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2
      })
        .then((canvas) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create PNG blob.'));
            }
          }, 'image/png');
        })
        .catch((err) => reject(err));
    });
  }

  // Called by your modal form: (ngSubmit)="submitForm(requestForm)"
  async submitForm(requestForm: NgForm) {
    if (requestForm.invalid || this.certificateForm.invalid) {
      Object.values(this.certificateForm.controls).forEach(c => c.markAsTouched());
      return;
    }

    this.isSubmitting = true;

    try {
      // Make the PNG from the DOM
      const pngBlob = await this.captureCertificateAsPng();

      // Build multipart/form-data that your Node server (multer) expects
      const fd = new FormData();
      fd.append('recipientName', this.certificateForm.value.recipientName);
      fd.append('issueDate', this.certificateForm.value.issueDate); // YYYY-MM-DD
      fd.append('numberOfSignatories', this.certificateForm.value.numberOfSignatories); // server will parseInt
      fd.append('signatory1Name', this.certificateForm.value.signatory1Name);
      fd.append('signatory1Role', this.certificateForm.value.signatory1Role);
      fd.append('signatory2Name', this.certificateForm.value.signatory2Name || '');
      fd.append('signatory2Role', this.certificateForm.value.signatory2Role || '');
      fd.append('certificatePng', pngBlob, 'certificate.png');

      // Optional JWT support (kept non-breaking). If you protect the route, this will work.
      const token = localStorage.getItem('token');
      const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

      await lastValueFrom(this.http.post(`${this.API_BASE}/api/pending-certificates`, fd, { headers }));

      // Done
      this.isModalOpen = false;
      alert('Certificate saved to pending.');
    } catch (err) {
      console.error('Error saving pending certificate:', err);
      alert('Failed to save certificate. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  // Used by (ngSubmit) on the main form; you can keep it or route everything through the modal
  requestApproval() {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }

    this.openModal();
  }
}
