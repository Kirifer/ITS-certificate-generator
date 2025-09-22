import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CosSalaryComponent } from './cos-salary.component';

describe('CosSalaryComponent', () => {
  let component: CosSalaryComponent;
  let fixture: ComponentFixture<CosSalaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CosSalaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CosSalaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
