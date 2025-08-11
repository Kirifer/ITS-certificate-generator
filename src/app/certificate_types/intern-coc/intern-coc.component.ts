import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

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
export class InternCocComponent {
  certificateForm: FormGroup;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/coc.png';
  showCertificatePreview = false;
  isModalOpen = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.certificateForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      numberOfHours: [null, [Validators.required, Validators.min(1)]],
      internsPosition: ['', [Validators.required, Validators.maxLength(200)]],
      internsDepartment: ['', [Validators.required, Validators.maxLength(200)]],
      pronoun: ['', Validators.required],
      signatory1Name: ['', [Validators.required]],
      signatory1Role: ['', [Validators.required]],
      signatory2Name: [''],
      signatory2Role: ['']
    });
  this.updateSignatoryValidators
}

get f() {
    return this.certificateForm.controls;
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

  openCertificatePreview() {
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
}
