import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VibesAwardComponent } from './vibes-award.component';

describe('VibesAwardComponent', () => {
  let component: VibesAwardComponent;
  let fixture: ComponentFixture<VibesAwardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VibesAwardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VibesAwardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
