import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NombreDelComponente } from './nombre-del-componente';

describe('NombreDelComponente', () => {
  let component: NombreDelComponente;
  let fixture: ComponentFixture<NombreDelComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NombreDelComponente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NombreDelComponente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
