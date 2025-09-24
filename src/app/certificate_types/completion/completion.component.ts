import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-completion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './completion.component.html',
  styleUrls: ['./completion.component.css']
})
export class CompletionComponent {
  certificateForm: FormGroup;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/completion.png';

  showCertificatePreview = false;
  isModalOpen = false;

  @ViewChild('certificatePreview', { static: false }) certificatePreview!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.certificateForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      pronoun: ['', Validators.required],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      signatory1Name: ['', [Validators.required]],
      signatory1Role: ['', [Validators.required]],
      signatory2Name: ['', [Validators.required]],
      signatory2Role: ['', [Validators.required]]
    });
  }

  get f() {
    return this.certificateForm.controls;
  }

  async requestApproval() {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }

    try {

      const canvas = await html2canvas(this.certificatePreview.nativeElement);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate PNG');

      const formData = new FormData();
      formData.append('recipientName', this.certificateForm.value.recipientName);
      formData.append('issueDate', this.certificateForm.value.issueDate);
      formData.append('numberOfSignatories', '2');
      formData.append('signatory1Name', this.certificateForm.value.signatory1Name);
      formData.append('signatory1Role', this.certificateForm.value.signatory1Role);
      formData.append('signatory2Name', this.certificateForm.value.signatory2Name);
      formData.append('signatory2Role', this.certificateForm.value.signatory2Role);
      formData.append('certificatePng', blob, 'certificate.png');
      
      await this.http.post('https://its-certificate-generator.onrender.com/api/pending-certificates', formData).toPromise();
      alert('Certificate request sent successfully!');
    } catch (err) {
      console.error('Error submitting certificate:', err);
      alert('Failed to send request.');
    }
  }

  goBack() {
    this.router.navigate(['/certificates']);
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  submitForm(form: any) {
    if (form.valid) {
      console.log('Request submitted:', form.value);
      this.closeModal();
    }
  }

  openCertificatePreview() {
    this.showCertificatePreview = true;
  }

  closeCertificatePreview() {
    this.showCertificatePreview = false;
  }
}
