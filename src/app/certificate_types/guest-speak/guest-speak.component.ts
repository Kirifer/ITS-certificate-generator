import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-guest-speak',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './guest-speak.component.html',
  styleUrl: './guest-speak.component.css'
})
export class GuestSpeakComponent implements AfterViewInit {
  speakerForm: FormGroup;
  approvalForm: FormGroup;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png';
  showCertificatePreview = false;
  signatories: number[] = [];

 @ViewChild('modalCertificate', { static: false }) modalCertificate!: ElementRef;
 

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.speakerForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      programName: ['', [Validators.required, Validators.maxLength(50)]],
      expertiseOn: ['', [Validators.required, Validators.maxLength(200)]],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      numberOfSignatories: ['1', Validators.required],
      signatory1Name: ['', [Validators.required]],
      signatory1Role: ['', [Validators.required]],
      signatory2Name: [''],
      signatory2Role: ['']
    });
    
       this.approvalForm = this.fb.group({});
  }

  ngAfterViewInit() {
    this.initializeApprovalForm();
  }

  get f() {
    return this.speakerForm.controls;
  }

  onSignatoriesChange() {
    const num = parseInt(this.speakerForm.value.numberOfSignatories, 10);
    if (num === 1) {
      this.speakerForm.patchValue({
        signatory2Name: '',
        signatory2Role: ''
      });
    }
    this.initializeApprovalForm();
  }

  onSignatoryCountChange() {
    const count = parseInt(this.speakerForm.value.numberOfSignatories, 10);
    this.updateSignatoryValidators(count);
  }

  updateSignatoryValidators(count: number) {
    if (count === 1) {
      this.speakerForm.get('signatory2Name')?.clearValidators();
      this.speakerForm.get('signatory2Role')?.clearValidators();
    } else {
      this.speakerForm.get('signatory2Name')?.setValidators([Validators.required]);
      this.speakerForm.get('signatory2Role')?.setValidators([Validators.required]);
    }

    this.speakerForm.get('signatory2Name')?.updateValueAndValidity();
    this.speakerForm.get('signatory2Role')?.updateValueAndValidity();
  }


  initializeApprovalForm() {
    const num = parseInt(this.speakerForm.value.numberOfSignatories, 10) || 1;
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
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(this.modalCertificate.nativeElement, { scale: 2 });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate certificate PNG');

      const formData = new FormData();
      const cert = this.speakerForm.value;

      // Certificate Details
      formData.append('recipientName', cert.recipientName);
      formData.append('issueDate', cert.issueDate);
      formData.append('numberOfSignatories', cert.numberOfSignatories);
      formData.append('signatory1Name', cert.signatory1Name);
      formData.append('signatory1Role', cert.signatory1Role);
      formData.append('signatory2Name', cert.signatory2Name || '');
      formData.append('signatory2Role', cert.signatory2Role || '');
      formData.append('certificatePng', blob, 'certificate.png');
      formData.append('creator_name', this.approvalForm.value.creatorName);
      formData.append('certificate_type', 'Guest Speaker Award');

      this.signatories.forEach(index => {
        formData.append(`approverName${index}`, this.approvalForm.value[`approverName${index}`]);
        formData.append(`approverEmail${index}`, this.approvalForm.value[`approverEmail${index}`]);
      });

      await this.http.post('https://its-certificate-generator.onrender.com/api/pending-certificates', formData).toPromise();

      // Send approval emails via EmailJS
      const emailPromises = this.signatories.map(index => {
        const templateParams = {
          to_name: this.approvalForm.value[`approverName${index}`],
          to_email: this.approvalForm.value[`approverEmail${index}`],
          recipient_name: cert.recipientName,
          certificate_type: 'Guest Speaker Award',
          creator_name: this.approvalForm.value.creatorName,
          issue_date: cert.issueDate
        };

        return emailjs.send(
          'service_hfi91vc',    
          'template_684vrld',     
          templateParams,
          'UOxJjtpEhb22IFi9x'    
        );
      });

      await Promise.all(emailPromises);

      alert('Certificate saved and approval emails sent successfully!');
      this.closeCertificatePreview();
    } catch (err) {
      console.error('Error submitting certificate or sending emails:', err);
      alert('Failed to submit certificate or send emails.');
    }
  }

  requestApproval() {
    if (this.speakerForm.invalid) {
      this.speakerForm.markAllAsTouched();
      return;
    }
    this.openCertificatePreview();
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