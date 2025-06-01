import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TaskDetailComponent } from './task-detail.component';
import { provideTestQueryClient, createMockActivatedRoute } from '../../../../test/test-utils';

describe('TaskDetailComponent', () => {
  let component: TaskDetailComponent;
  let fixture: ComponentFixture<TaskDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TaskDetailComponent,
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

    fixture = TestBed.createComponent(TaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
