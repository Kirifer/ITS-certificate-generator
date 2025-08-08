import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vibes-award',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule],
  templateUrl: './vibes-award.component.html',
  styleUrl: './vibes-award.component.css'
})
export class VibesAwardComponent {
 certificateForm: FormGroup;
  popupData: {name: string, email: string, date: string } | null = null;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png'; 
  showCertificatePreview = false;
  isModalOpen = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.certificateForm = this.fb.group({
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
    return this.certificateForm.controls;
  }
  
  requestApproval() {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }
    console.log('Approval requested:', this.certificateForm.value);
  }

  goBack() {
    this.router.navigate(['/certificates']);
  }

  onSignatoryCountChange() {
    const count = this.certificateForm.value.numberOfSignatories;
    this.updateSignatoryValidators(parseInt(count, 10)); 
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
