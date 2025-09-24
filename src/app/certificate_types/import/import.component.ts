import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.css']
})
export class ImportComponent implements AfterViewInit {
  certificateForm: FormGroup;
  approvalForm: FormGroup;
  popupData: { name: string, email: string, date: string } | null = null;
  importYear = new Date().getFullYear();
  showCertificatePreview = false;
  isModalOpen = false;
  imageUrl: string | ArrayBuffer | null = null;
  signatories: number[] = [];

  textColor: string = '#000000';
  boxColor: string = '#ffffff';

  @ViewChild('modalCertificate', { static: false }) modalCertificate!: ElementRef;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private http: HttpClient
  ) {
    this.certificateForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      description: ['', [Validators.required, Validators.maxLength(300)]],
      certificateType: ['', [Validators.required, Validators.maxLength(50)]],
      typeOfAward: ['', [Validators.required, Validators.maxLength(50)]],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      numberOfSignatories: ['1', Validators.required],
      signatory1Name: ['', [Validators.required]],
      signatory1Role: ['', [Validators.required]],
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

  // Called when dropdown value changes
  onSignatoryCountChange() {
    const count = this.certificateForm.value.numberOfSignatories;
    this.updateSignatoryValidators(parseInt(count, 10)); 
  }

  // Applies/removes validators for signatory 2 based on count
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
      formData.append('certificate_type', cert.typeOfAward || 'Import Certificate');

      // Append additional fields if needed (e.g., description, certificateType)
      formData.append('description', cert.description || '');
      formData.append('certificateType', cert.certificateType || '');

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
          certificate_type: cert.typeOfAward || 'Import Certificate',
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
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
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

  openModal() {
    if (this.certificateForm.valid) {
      this.isModalOpen = true;
    } else {
      this.certificateForm.markAllAsTouched();
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

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  changeBoxColor(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.boxColor = input.value;
  }

  changeTextColor(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.textColor = input.value;
  }
}