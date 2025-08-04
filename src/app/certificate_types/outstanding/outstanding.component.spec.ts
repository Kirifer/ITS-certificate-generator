import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutstandingComponent } from './outstanding.component';

describe('OutstandingComponent', () => {
  let component: OutstandingComponent;
  let fixture: ComponentFixture<OutstandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutstandingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutstandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
