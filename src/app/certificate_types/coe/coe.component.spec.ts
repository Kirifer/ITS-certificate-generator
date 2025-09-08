import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoeComponent } from './coe.component';

describe('CoeComponent', () => {
  let component: CoeComponent;
  let fixture: ComponentFixture<CoeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
