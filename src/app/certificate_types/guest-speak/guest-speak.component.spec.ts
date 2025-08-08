import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestSpeakComponent } from './guest-speak.component';

describe('GuestSpeakComponent', () => {
  let component: GuestSpeakComponent;
  let fixture: ComponentFixture<GuestSpeakComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestSpeakComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestSpeakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
