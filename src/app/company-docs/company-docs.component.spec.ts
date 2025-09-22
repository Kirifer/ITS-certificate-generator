import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyDocsComponent } from './company-docs.component';

describe('CompanyDocsComponent', () => {
  let component: CompanyDocsComponent;
  let fixture: ComponentFixture<CompanyDocsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyDocsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
