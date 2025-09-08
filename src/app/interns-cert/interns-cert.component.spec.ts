import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternsCertComponent } from './interns-cert.component';

describe('InternsCertComponent', () => {
  let component: InternsCertComponent;
  let fixture: ComponentFixture<InternsCertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternsCertComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InternsCertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
