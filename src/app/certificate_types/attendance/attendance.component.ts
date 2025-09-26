import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';  

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements AfterViewInit {
  certificateForm: FormGroup;
  approvalForm: FormGroup;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png';
  showCertificatePreview = false;
  signatories: number[] = [];

  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  @ViewChild('modalCertificate', { static: false }) modalCertificate!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.certificateForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      attendanceMonth: ['', Validators.required],
      attendanceYear: [this.currentYear, [Validators.required, Validators.min(2000), Validators.max(2100)]],
      numberOfSignatories: ['2', Validators.required],
      signatory1Name: ['', Validators.required],
      signatory1Role: ['', Validators.required],
      signatory2Name: ['', Validators.required],
      signatory2Role: ['', Validators.required]
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
      formData.append('certificate_type', 'Perfect Attendance');

      this.signatories.forEach(index => {
        formData.append(`approverName${index}`, this.approvalForm.value[`approverName${index}`]);
        formData.append(`approverEmail${index}`, this.approvalForm.value[`approverEmail${index}`]);
      });

      // Save to backend (backend uploads to Cloudinary & returns URL)
      const response: any = await this.http.post(
        'https://its-certificate-generator.onrender.com/api/pending-certificates',
        formData
      ).toPromise();

      if (response?.cloudinary_url) {
        console.log('Cloudinary URL:', response.cloudinary_url);
        // Store in localStorage so AccountComponent can use it
        localStorage.setItem('latestCertificateUrl', response.cloudinary_url);
      }

      // Send approval emails via EmailJS
      const emailPromises = this.signatories.map(index => {
        const templateParams = {
          to_name: this.approvalForm.value[`approverName${index}`],
          to_email: this.approvalForm.value[`approverEmail${index}`],
          recipient_name: cert.recipientName,
          certificate_type: 'Perfect Attendance',
          creator_name: this.approvalForm.value.creatorName,
          issue_date: cert.issueDate,
          certificate_url: response?.cloudinary_url || '' 
        };

        return emailjs.send(
          'service_hfi91vc',
          'template_684vrld',
          templateParams,
          'UOxJjtpEhb22IFi9x'
        );
      });

      await Promise.all(emailPromises);

      alert('Certificate saved to Cloudinary and approval emails sent!');
      this.closeCertificatePreview();
    } catch (err) {
      console.error('Error submitting certificate or sending emails:', err);
      alert('Failed to submit certificate or send emails.');
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
