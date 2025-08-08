import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternCocComponent } from './intern-coc.component';

describe('InternCocComponent', () => {
  let component: InternCocComponent;
  let fixture: ComponentFixture<InternCocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternCocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InternCocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
