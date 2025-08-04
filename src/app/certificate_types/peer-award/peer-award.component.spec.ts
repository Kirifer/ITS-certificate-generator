import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeerAwardComponent } from './peer-award.component';

describe('PeerAwardComponent', () => {
  let component: PeerAwardComponent;
  let fixture: ComponentFixture<PeerAwardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeerAwardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeerAwardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
