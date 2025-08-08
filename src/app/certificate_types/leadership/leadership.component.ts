import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-leadership',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './leadership.component.html',
  styleUrl: './leadership.component.css'
})
export class LeadershipComponent {
  leadershipForm: FormGroup;
  popupData: { name: string, email: string, date: string } | null = null;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png';
  showCertificatePreview = false;
  isModalOpen = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.leadershipForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      numberOfSignatories: ['1', Validators.required],
      signatory1Name: ['', [Validators.required]],
      signatory1Role: ['', [Validators.required]],
      signatory2Name: [''],
      signatory2Role: ['']
    });
    this.updateSignatoryValidators
  }

  get f() {
    return this.leadershipForm.controls;
  }
  
  onSignatoryCountChange() {
    const count = this.leadershipForm.value.numberOfSignatories;
    this.updateSignatoryValidators(parseInt(count, 10)); 
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

  requestApproval() {
    if (this.leadershipForm.invalid) {
      this.leadershipForm.markAllAsTouched();
      return;
    }
    console.log('Approval requested:', this.leadershipForm.value);
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
    if (this.leadershipForm.valid) {
      this.isModalOpen = true;
    } else {
      this.leadershipForm.markAllAsTouched();
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
