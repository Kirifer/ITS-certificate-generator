import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertficateDownloadComponent } from './certficate-download.component';

describe('CertficateDownloadComponent', () => {
  let component: CertficateDownloadComponent;
  let fixture: ComponentFixture<CertficateDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertficateDownloadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertficateDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});