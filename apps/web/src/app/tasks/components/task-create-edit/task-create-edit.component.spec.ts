import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TaskCreateEditComponent } from './task-create-edit.component';
import { provideTestQueryClient } from '../../../../test/test-utils';

describe('TaskCreateEditComponent', () => {
  let component: TaskCreateEditComponent;
  let fixture: ComponentFixture<TaskCreateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TaskCreateEditComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        ...provideTestQueryClient()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCreateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
