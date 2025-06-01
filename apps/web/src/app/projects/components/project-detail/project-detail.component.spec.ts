import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { ProjectDetailComponent } from './project-detail.component';
import { provideTestQueryClient, createMockActivatedRoute } from '../../../../test/test-utils';

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProjectDetailComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],      providers: [
        ...provideTestQueryClient(),
        {
          provide: ActivatedRoute,
          useValue: createMockActivatedRoute({ id: '1' })
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
