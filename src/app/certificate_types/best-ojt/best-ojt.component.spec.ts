import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BestOjtComponent } from './best-ojt.component';

describe('BestOjtComponent', () => {
  let component: BestOjtComponent;
  let fixture: ComponentFixture<BestOjtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BestOjtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BestOjtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
