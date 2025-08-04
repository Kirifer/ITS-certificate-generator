import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExemplaryComponent } from './exemplary.component';

describe('ExemplaryComponent', () => {
  let component: ExemplaryComponent;
  let fixture: ComponentFixture<ExemplaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExemplaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExemplaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
