import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpYearComponent } from './emp-year.component';

describe('EmpYearComponent', () => {
  let component: EmpYearComponent;
  let fixture: ComponentFixture<EmpYearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpYearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpYearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
