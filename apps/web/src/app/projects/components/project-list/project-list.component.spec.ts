import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ProjectListComponent } from './project-list.component';
import { provideTestQueryClient, createMockActivatedRoute } from '../../../../test/test-utils';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProjectListComponent,
        HttpClientTestingModule
      ],      providers: [
        ...provideTestQueryClient(),
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
