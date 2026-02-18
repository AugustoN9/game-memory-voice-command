// Altere de { Tabuleiro } para { TabuleiroComponent }
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabuleiroComponent } from './tabuleiro';

describe('TabuleiroComponent', () => {
  let component: TabuleiroComponent;
  let fixture: ComponentFixture<TabuleiroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabuleiroComponent] // Componentes Standalone devem estar em imports
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabuleiroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
