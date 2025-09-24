import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-leadership',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './leadership.component.html',
  styleUrls: ['./leadership.component.css']
})
export class LeadershipComponent implements AfterViewInit {
  leadershipForm: FormGroup;
  approvalForm: FormGroup;
  signatories: number[] = [];
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png';
  showCertificatePreview = false;
  isModalOpen = false;

  @ViewChild('modalCertificate', { static: false }) modalCertificate!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.leadershipForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      pronoun: ['', Validators.required],
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
    return this.leadershipForm.controls;
  }

  onSignatoryCountChange() {
    const count = parseInt(this.leadershipForm.value.numberOfSignatories, 10);
    this.updateSignatoryValidators(count);
    this.initializeApprovalForm();
  }

  updateSignatoryValidators(count: number) {
    if (count === 1) {
      this.leadershipForm.get('signatory2Name')?.clearValidators();
      this.leadershipForm.get('signatory2Role')?.clearValidators();
    } else {
      this.leadershipForm.get('signatory2Name')?.setValidators([Validators.required]);
      this.leadershipForm.get('signatory2Role')?.setValidators([Validators.required]);
    }

    this.leadershipForm.get('signatory2Name')?.updateValueAndValidity();
    this.leadershipForm.get('signatory2Role')?.updateValueAndValidity();
  }

  initializeApprovalForm() {
    const num = parseInt(this.leadershipForm.value.numberOfSignatories, 10) || 1;
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

  openCertificatePreview() {
    this.initializeApprovalForm();
    this.showCertificatePreview = true;
  }

  closeCertificatePreview() {
    this.showCertificatePreview = false;
  }

  goBack() {
    this.router.navigate(['/intern-certs']);
  }

  openModal() {
    if (this.leadershipForm.valid && this.approvalForm.valid) {
      this.isModalOpen = true;
    } else {
      this.leadershipForm.markAllAsTouched();
      this.approvalForm.markAllAsTouched();
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  submitForm(form: any) {
    if (form.valid) {
      const { name, email } = form.value;
      console.log('Send to Outlook:', name, email);
      this.closeModal();
    }
  }


  //Submit Leadership Approval Form

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
      const cert = this.leadershipForm.value;

      formData.append('recipientName', cert.recipientName);
      formData.append('issueDate', cert.issueDate);
      formData.append('numberOfSignatories', cert.numberOfSignatories);
      formData.append('signatory1Name', cert.signatory1Name);
      formData.append('signatory1Role', cert.signatory1Role);
      formData.append('signatory2Name', cert.signatory2Name || '');
      formData.append('signatory2Role', cert.signatory2Role || '');
      formData.append('certificatePng', blob, 'certificate.png');
      formData.append('creator_name', this.approvalForm.value.creatorName);
      formData.append('certificate_type', 'Leadership Award');

      this.signatories.forEach(index => {
        formData.append(`approverName${index}`, this.approvalForm.value[`approverName${index}`]);
        formData.append(`approverEmail${index}`, this.approvalForm.value[`approverEmail${index}`]);
      });

      // Replace with your backend endpoint
      await this.http.post('https://its-certificate-generator.onrender.com/api/pending-certificates', formData).toPromise();

      // Send approval emails via EmailJS
      const emailPromises = this.signatories.map(index => {
        const templateParams = {
          to_name: this.approvalForm.value[`approverName${index}`],
          to_email: this.approvalForm.value[`approverEmail${index}`],
          recipient_name: cert.recipientName,
          certificate_type: 'Leadership Award',
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
}