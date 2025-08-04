import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PunctualityComponent } from './punctuality.component';

describe('PunctualityComponent', () => {
  let component: PunctualityComponent;
  let fixture: ComponentFixture<PunctualityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PunctualityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PunctualityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
