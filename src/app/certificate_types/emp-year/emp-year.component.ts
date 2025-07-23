import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-emp-year',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './emp-year.component.html',
  styleUrls: ['./emp-year.component.css']
})
export class EmpYearComponent {
  certificateForm: FormGroup;
  currentYear = new Date().getFullYear();
  certificateBgImage = '/certificate-bg.png'; 

  constructor(private fb: FormBuilder, private router: Router) {
    this.certificateForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(50)]],
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
}
