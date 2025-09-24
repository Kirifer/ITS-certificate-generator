import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-intern-coc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './intern-coc.component.html',
  styleUrl: './intern-coc.component.css'
})
export class InternCocComponent implements AfterViewInit {
  certificateForm: FormGroup;
  approvalForm: FormGroup;
  certificateBgImage = '/coc-bg.png';
  showCertificatePreview = false;
  signatories: number[] = [];

  @ViewChild('modalCertificate', { static: false }) modalCertificate!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.certificateForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      numberOfHours: ['', [Validators.required, Validators.min(1)]],
      internsPosition: ['', [Validators.required, Validators.maxLength(200)]],
      internsDepartment: ['', [Validators.required, Validators.maxLength(200)]],
      pronoun: ['', Validators.required],
      numberOfSignatories: ['2', Validators.required],
      signatory1Name: ['', Validators.required],
      signatory1Role: ['', Validators.required],
      signatory2Name: ['', Validators.required],
      signatory2Role: ['', Validators.required],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required]
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
    this.signatories = Array.from({ length: num }, (_, i) => i);

    const group: any = {
      creatorName: ['', Validators.required]
    };

    this.signatories.forEach(index => {
      group[`approverName${index}`] = ['', Validators.required];
      group[`approverEmail${index}`] = ['', [Validators.required, Validators.email]];
    });

    this.approvalForm = this.fb.group(group);
  }

  async submitApprovalFromPreview() {
    if (this.approvalForm.invalid) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Ensure DOM rendered

      const canvas = await html2canvas(this.modalCertificate.nativeElement, { scale: 2 });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate certificate PNG');

      const formData = new FormData();
      const cert = this.certificateForm.value;

      // Certificate details
      formData.append('recipientName', cert.recipientName);
      formData.append('issueDate', cert.issueDate);
      formData.append('numberOfSignatories', cert.numberOfSignatories);
      formData.append('signatory1Name', cert.signatory1Name);
      formData.append('signatory1Role', cert.signatory1Role);
      formData.append('signatory2Name', cert.signatory2Name || '');
      formData.append('signatory2Role', cert.signatory2Role || '');
      formData.append('certificatePng', blob, 'certificate.png');
      formData.append('creator_name', this.approvalForm.value.creatorName);
      formData.append('certificate_type', 'Certificate of Completion');

      this.signatories.forEach(index => {
        formData.append(`approverName${index}`, this.approvalForm.value[`approverName${index}`]);
        formData.append(`approverEmail${index}`, this.approvalForm.value[`approverEmail${index}`]);
      });

      await this.http.post('https://its-certificate-generator.onrender.com/api/pending-certificates', formData).toPromise();
      alert('Certificate request sent successfully!');
      this.closeCertificatePreview();
    } catch (err) {
      console.error('Error submitting certificate:', err);
      alert('Failed to send request.');
    }
  }

  goBack() {
    this.router.navigate(['/company-documents']);
  }

  openCertificatePreview() {
    this.initializeApprovalForm();
    this.showCertificatePreview = true;
  }

  closeCertificatePreview() {
    this.showCertificatePreview = false;
  }
}
