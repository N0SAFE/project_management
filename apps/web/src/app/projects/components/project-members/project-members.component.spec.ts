import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ProjectMembersComponent } from './project-members.component';
import { provideTestQueryClient, createMockActivatedRoute } from '../../../../test/test-utils';

describe('ProjectMembersComponent', () => {
  let component: ProjectMembersComponent;
  let fixture: ComponentFixture<ProjectMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProjectMembersComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        ...provideTestQueryClient(),
        {
          provide: ActivatedRoute,
          useValue: createMockActivatedRoute({ id: '1' })
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
