import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TaskListComponent } from './task-list.component';
import { provideTestQueryClient, createMockActivatedRoute } from '../../../../test/test-utils';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TaskListComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        ...provideTestQueryClient(),
        {
          provide: ActivatedRoute,
          useValue: createMockActivatedRoute({ projectId: '1' })
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
