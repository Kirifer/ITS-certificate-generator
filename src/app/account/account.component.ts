import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent {
  accountForm: FormGroup;
  isEditable: boolean = false;

  constructor(private fb: FormBuilder) {
    this.accountForm = this.fb.group({
      name: [''],
      email: [''],
      role: [''],
      password: ['']
    });

    this.accountForm.disable();
  }

  toggleEdit(): void {
    this.isEditable = !this.isEditable;

    if (this.isEditable) {
      this.accountForm.enable();
    } else {
      this.accountForm.disable();
    }
  }

  onSave(): void {
    if (this.accountForm.valid) {
      console.log('Saved Data:', this.accountForm.value);
      this.isEditable = false;
      this.accountForm.disable();
    } else {
      console.log('Form is invalid.');
    }
  }
}
