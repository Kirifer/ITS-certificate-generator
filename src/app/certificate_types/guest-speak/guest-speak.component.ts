import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

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
export class GuestSpeakComponent {
  speakerForm: FormGroup;
  popupData: { name: string, email: string, date: string } | null = null;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png'; 
  showCertificatePreview = false;
  isModalOpen = false;

  constructor(private fb: FormBuilder, private router: Router) {
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
    
    this.updateSignatoryValidators(1);
  }

  get f() {
    return this.speakerForm.controls;
  }
  
  onSignatoryCountChange() {
    const count = this.speakerForm.value.numberOfSignatories;
    this.updateSignatoryValidators(parseInt(count, 10)); 
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

  requestApproval() {
    if (this.speakerForm.invalid) {
      this.speakerForm.markAllAsTouched();
      return;
    }
    console.log('Approval requested:', this.speakerForm.value);
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
    if (this.speakerForm.valid) {
      this.isModalOpen = true;
    } else {
      this.speakerForm.markAllAsTouched();
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

}
