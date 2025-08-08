import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-outstanding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './outstanding.component.html',
  styleUrl: './outstanding.component.css'
})
export class OutstandingComponent {
  outstandingForm: FormGroup;
  popupData: { name: string, email: string, date: string } | null = null;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png';
  showCertificatePreview = false;
  isModalOpen = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.outstandingForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
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
    return this.outstandingForm.controls;
  }

  requestApproval() {
    if (this.outstandingForm.invalid) {
      this.outstandingForm.markAllAsTouched();
      return;
    }
    console.log('Approval requested:', this.outstandingForm.value);
  }

  onSignatoryCountChange() {
    const count = this.outstandingForm.value.numberOfSignatories;
    this.updateSignatoryValidators(parseInt(count, 10)); 
  }
  
  updateSignatoryValidators(count: number) {
    if (count === 1) {
      this.outstandingForm.get('signatory2Name')?.clearValidators();
      this.outstandingForm.get('signatory2Role')?.clearValidators();
    } else {
      this.outstandingForm.get('signatory2Name')?.setValidators([Validators.required]);
      this.outstandingForm.get('signatory2Role')?.setValidators([Validators.required]);
    }
    
    this.outstandingForm.get('signatory2Name')?.updateValueAndValidity();
    this.outstandingForm.get('signatory2Role')?.updateValueAndValidity();
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
    this.isModalOpen = true;
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
}
