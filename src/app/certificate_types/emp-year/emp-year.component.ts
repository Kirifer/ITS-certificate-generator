import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-emp-year',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './emp-year.component.html',
  styleUrls: ['./emp-year.component.css']
})
export class EmpYearComponent implements AfterViewInit {
  certificateForm: FormGroup;
  approvalForm: FormGroup;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png';
  showCertificatePreview = false;
  signatories: any[] = [];

  @ViewChild('modalCertificate', { static: false }) modalCertificate!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.certificateForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      numberOfSignatories: ['2', Validators.required],
      signatory1Name: ['', [Validators.required]],
      signatory1Role: ['', [Validators.required]],
      signatory2Name: ['', [Validators.required]],
      signatory2Role: ['', [Validators.required]]
    });

    this.approvalForm = this.fb.group({});
  }

  ngAfterViewInit() {
    this.initializeApprovalForm();
  }

  get f() {
    return this.certificateForm.controls;
  }

  onSignatoriesChange() {
    const num = parseInt(this.certificateForm.value.numberOfSignatories, 10);
    if (num === 1) {
      this.certificateForm.patchValue({
        signatory2Name: '',
        signatory2Role: ''
      });
    }
    this.initializeApprovalForm();
  }

  initializeApprovalForm() {
    const num = parseInt(this.certificateForm.value.numberOfSignatories, 10) || 1;
    this.signatories = Array.from({ length: num });
    this.approvalForm = this.fb.group({});
    this.signatories.forEach((_, index) => {
      this.approvalForm.addControl(`approverName${index}`, this.fb.control('', Validators.required));
      this.approvalForm.addControl(`approverEmail${index}`, this.fb.control('', [Validators.required, Validators.email]));
    });
  }

  // Submit approval from the main preview modal
  async submitApprovalFromPreview() {
    if (this.approvalForm.invalid) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    try {
      // Wait a bit to ensure DOM is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(this.modalCertificate.nativeElement, { scale: 2 });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate PNG');

      const formData = new FormData();
      formData.append('recipientName', this.certificateForm.value.recipientName);
      formData.append('issueDate', this.certificateForm.value.issueDate);
      formData.append('numberOfSignatories', this.certificateForm.value.numberOfSignatories);
      formData.append('signatory1Name', this.certificateForm.value.signatory1Name);
      formData.append('signatory1Role', this.certificateForm.value.signatory1Role);
      formData.append('signatory2Name', this.certificateForm.value.signatory2Name || '');
      formData.append('signatory2Role', this.certificateForm.value.signatory2Role || '');
      formData.append('certificatePng', blob, 'certificate.png');

      this.signatories.forEach((_, index) => {
        formData.append(`approverName${index}`, this.approvalForm.value[`approverName${index}`]);
        formData.append(`approverEmail${index}`, this.approvalForm.value[`approverEmail${index}`]);
      });

      await this.http.post('http://localhost:4000/api/pending-certificates', formData).toPromise();
      alert('Certificate request sent successfully!');
      this.closeCertificatePreview();
    } catch (err) {
      console.error('Error submitting certificate:', err);
      alert('Failed to send request.');
    }
  }

  goBack() {
    this.router.navigate(['/certificates']);
  }

  openCertificatePreview() {
    this.initializeApprovalForm();
    this.showCertificatePreview = true;
  }

  closeCertificatePreview() {
    this.showCertificatePreview = false;
  }
}
