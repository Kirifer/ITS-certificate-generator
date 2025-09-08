import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-vibes-award',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vibes-award.component.html',
  styleUrls: ['./vibes-award.component.css']
})
export class VibesAwardComponent implements AfterViewInit {
  certificateForm: FormGroup;
  approvalForm: FormGroup;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png';
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
      email: ['', [Validators.required, Validators.email]],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      numberOfSignatories: ['1', Validators.required],
      signatory1Name: ['', Validators.required],
      signatory1Role: ['', Validators.required],
      signatory2Name: [''],
      signatory2Role: ['']
    });

    this.approvalForm = this.fb.group({});
    this.updateSignatoryValidators(1);
  }

  ngAfterViewInit() {
    this.initializeApprovalForm();
  }

  get f() {
    return this.certificateForm.controls;
  }

  onSignatoriesChange() {
    const num = parseInt(this.certificateForm.value.numberOfSignatories, 10);
    this.updateSignatoryValidators(num);
    if (num === 1) {
      this.certificateForm.patchValue({
        signatory2Name: '',
        signatory2Role: ''
      });
    }
    this.initializeApprovalForm();
  }

  updateSignatoryValidators(count: number) {
    if (count === 1) {
      this.certificateForm.get('signatory2Name')?.clearValidators();
      this.certificateForm.get('signatory2Role')?.clearValidators();
    } else {
      this.certificateForm.get('signatory2Name')?.setValidators([Validators.required]);
      this.certificateForm.get('signatory2Role')?.setValidators([Validators.required]);
    }
    this.certificateForm.get('signatory2Name')?.updateValueAndValidity();
    this.certificateForm.get('signatory2Role')?.updateValueAndValidity();
  }

  initializeApprovalForm() {
    const num = parseInt(this.certificateForm.value.numberOfSignatories, 10) || 1;
    this.signatories = Array.from({ length: num }, (_, i) => i);
    const group: any = {};
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
      await new Promise(resolve => setTimeout(resolve, 300)); 

      const canvas = await html2canvas(this.modalCertificate.nativeElement, { scale: 2 });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate certificate PNG');

      const formData = new FormData();
      const cert = this.certificateForm.value;

      formData.append('recipientName', cert.recipientName);
      formData.append('email', cert.email);
      formData.append('issueDate', cert.issueDate);
      formData.append('numberOfSignatories', cert.numberOfSignatories);
      formData.append('signatory1Name', cert.signatory1Name);
      formData.append('signatory1Role', cert.signatory1Role);
      formData.append('signatory2Name', cert.signatory2Name || '');
      formData.append('signatory2Role', cert.signatory2Role || '');
      formData.append('certificatePng', blob, 'certificate.png');

      this.signatories.forEach(index => {
        formData.append(`approverName${index}`, this.approvalForm.value[`approverName${index}`]);
        formData.append(`approverEmail${index}`, this.approvalForm.value[`approverEmail${index}`]);
      });

      await this.http.post('http://localhost:4000/api/pending-certificates', formData).toPromise();
      alert('Vibes Award request sent successfully!');
      this.closeCertificatePreview();
    } catch (err) {
      console.error('Error submitting vibes award:', err);
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
