import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

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
export class ImportComponent {
  certificateForm: FormGroup;
  popupData: { name: string, email: string, date: string } | null = null;
  importYear = new Date().getFullYear();
  showCertificatePreview = false;
  isModalOpen = false;
  imageUrl: string | ArrayBuffer | null = null;

  constructor(private fb: FormBuilder, private router: Router) {
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

    this.updateSignatoryValidators(1);
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
  boxColor: string = '#ffffff';

changeBoxColor(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.boxColor = input.value;
}
textColor: string = '#000000'; // default black

changeTextColor(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.textColor = input.value;
  }
}
