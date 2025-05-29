package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Project;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.repository.TaskPriorityRepository;
import com.example.demo.repository.TaskStatusRepository;

@Service
@Transactional
public class ProjectSettingsService {
    
    @Autowired
    private TaskStatusRepository taskStatusRepository;
    
    @Autowired
    private TaskPriorityRepository taskPriorityRepository;
    
    // Task Status Management
    public List<TaskStatus> getProjectStatuses(Project project) {
        return taskStatusRepository.findByProjectOrderByOrderIndexAsc(project);
    }
    
    public List<TaskStatus> getProjectStatuses(Long projectId) {
        return taskStatusRepository.findByProjectIdOrderByOrderIndexAsc(projectId);
    }
    
    public TaskStatus createTaskStatus(Project project, String name, String description, String color, Integer orderIndex) {
        if (taskStatusRepository.existsByProjectAndName(project, name)) {
            throw new IllegalArgumentException("Un statut avec ce nom existe déjà pour ce projet");
        }
        
        TaskStatus taskStatus = new TaskStatus();
        taskStatus.setProject(project);
        taskStatus.setName(name);
        taskStatus.setDescription(description);
        taskStatus.setColor(color != null ? color : "#6B7280");
        taskStatus.setOrderIndex(orderIndex != null ? orderIndex : getNextStatusOrder(project));
        taskStatus.setIsDefault(false);
        
        return taskStatusRepository.save(taskStatus);
    }
    
    public TaskStatus updateTaskStatus(Long statusId, String name, String description, String color, Integer orderIndex) {
        TaskStatus taskStatus = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Statut non trouvé"));
        
        if (name != null && !name.equals(taskStatus.getName())) {
            if (taskStatusRepository.existsByProjectAndName(taskStatus.getProject(), name)) {
                throw new IllegalArgumentException("Un statut avec ce nom existe déjà pour ce projet");
            }
            taskStatus.setName(name);
        }
        
        if (description != null) taskStatus.setDescription(description);
        if (color != null) taskStatus.setColor(color);
        if (orderIndex != null) taskStatus.setOrderIndex(orderIndex);
        
        return taskStatusRepository.save(taskStatus);
    }
    
    public void deleteTaskStatus(Long statusId) {
        TaskStatus taskStatus = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Statut non trouvé"));
        
        if (taskStatus.getIsDefault()) {
            throw new IllegalArgumentException("Impossible de supprimer le statut par défaut");
        }
        
        taskStatusRepository.delete(taskStatus);
    }
    
    public TaskStatus setDefaultStatus(Long statusId) {
        TaskStatus taskStatus = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Statut non trouvé"));
        
        // Remove default from other statuses in the same project
        List<TaskStatus> projectStatuses = taskStatusRepository.findByProjectOrderByOrderIndexAsc(taskStatus.getProject());
        for (TaskStatus status : projectStatuses) {
            status.setIsDefault(false);
        }
        taskStatusRepository.saveAll(projectStatuses);
        
        // Set this status as default
        taskStatus.setIsDefault(true);
        return taskStatusRepository.save(taskStatus);
    }
    
    // Task Priority Management
    public List<TaskPriority> getProjectPriorities(Project project) {
        return taskPriorityRepository.findByProjectOrderByLevelDesc(project);
    }
    
    public List<TaskPriority> getProjectPriorities(Long projectId) {
        return taskPriorityRepository.findByProjectIdOrderByLevelDesc(projectId);
    }
    
    public TaskPriority createTaskPriority(Project project, String name, String description, String color, 
                                          Integer level, String todoState, String doingState, String finishState) {
        if (taskPriorityRepository.existsByProjectAndName(project, name)) {
            throw new IllegalArgumentException("Une priorité avec ce nom existe déjà pour ce projet");
        }
        
        TaskPriority taskPriority = new TaskPriority();
        taskPriority.setProject(project);
        taskPriority.setName(name);
        taskPriority.setDescription(description);
        taskPriority.setColor(color != null ? color : "#6B7280");
        taskPriority.setLevel(level != null ? level : getNextPriorityLevel(project));
        taskPriority.setIsDefault(false);
        
        // Set state mappings
        if (todoState != null) {
            taskPriority.setTodoState(TaskPriority.State.valueOf(todoState));
        }
        if (doingState != null) {
            taskPriority.setDoingState(TaskPriority.State.valueOf(doingState));
        }
        if (finishState != null) {
            taskPriority.setFinishState(TaskPriority.State.valueOf(finishState));
        }
        
        return taskPriorityRepository.save(taskPriority);
    }
    
    public TaskPriority updateTaskPriority(Long priorityId, String name, String description, String color, 
                                          Integer level, String todoState, String doingState, String finishState) {
        TaskPriority taskPriority = taskPriorityRepository.findById(priorityId)
                .orElseThrow(() -> new IllegalArgumentException("Priorité non trouvée"));
        
        if (name != null && !name.equals(taskPriority.getName())) {
            if (taskPriorityRepository.existsByProjectAndName(taskPriority.getProject(), name)) {
                throw new IllegalArgumentException("Une priorité avec ce nom existe déjà pour ce projet");
            }
            taskPriority.setName(name);
        }
        
        if (description != null) taskPriority.setDescription(description);
        if (color != null) taskPriority.setColor(color);
        if (level != null) taskPriority.setLevel(level);
        
        // Update state mappings
        if (todoState != null) {
            taskPriority.setTodoState(TaskPriority.State.valueOf(todoState));
        }
        if (doingState != null) {
            taskPriority.setDoingState(TaskPriority.State.valueOf(doingState));
        }
        if (finishState != null) {
            taskPriority.setFinishState(TaskPriority.State.valueOf(finishState));
        }
        
        return taskPriorityRepository.save(taskPriority);
    }
    
    public void deleteTaskPriority(Long priorityId) {
        TaskPriority taskPriority = taskPriorityRepository.findById(priorityId)
                .orElseThrow(() -> new IllegalArgumentException("Priorité non trouvée"));
        
        if (taskPriority.getIsDefault()) {
            throw new IllegalArgumentException("Impossible de supprimer la priorité par défaut");
        }
        
        taskPriorityRepository.delete(taskPriority);
    }
    
    public TaskPriority setDefaultPriority(Long priorityId) {
        TaskPriority taskPriority = taskPriorityRepository.findById(priorityId)
                .orElseThrow(() -> new IllegalArgumentException("Priorité non trouvée"));
        
        // Remove default from other priorities in the same project
        List<TaskPriority> projectPriorities = taskPriorityRepository.findByProjectOrderByLevelDesc(taskPriority.getProject());
        for (TaskPriority priority : projectPriorities) {
            priority.setIsDefault(false);
        }
        taskPriorityRepository.saveAll(projectPriorities);
        
        // Set this priority as default
        taskPriority.setIsDefault(true);
        return taskPriorityRepository.save(taskPriority);
    }
    
    // Helper methods
    private Integer getNextStatusOrder(Project project) {
        List<TaskStatus> statuses = taskStatusRepository.findByProjectOrderByOrderIndexAsc(project);
        return statuses.isEmpty() ? 1 : statuses.get(statuses.size() - 1).getOrderIndex() + 1;
    }
    
    private Integer getNextPriorityLevel(Project project) {
        List<TaskPriority> priorities = taskPriorityRepository.findByProjectOrderByLevelDesc(project);
        return priorities.isEmpty() ? 1 : priorities.get(0).getLevel() + 1;
    }
    
    // Initialize default statuses and priorities for new projects
    public void initializeDefaultProjectSettings(Project project) {
        // Create default statuses
        if (taskStatusRepository.countByProjectId(project.getId()) == 0) {
            createTaskStatus(project, "À faire", "Tâches qui doivent être commencées", "#6B7280", 1);
            createTaskStatus(project, "En cours", "Tâches actuellement en développement", "#F59E0B", 2);
            createTaskStatus(project, "Terminé", "Tâches complètement achevées", "#10B981", 3);
            
            // Set first status as default
            Optional<TaskStatus> firstStatus = taskStatusRepository.findByProjectAndName(project, "À faire");
            if (firstStatus.isPresent()) {
                setDefaultStatus(firstStatus.get().getId());
            }
        }
        
        // Create default priorities
        if (taskPriorityRepository.countByProjectId(project.getId()) == 0) {
            createTaskPriority(project, "Basse", "Priorité faible - peut être fait plus tard", "#6B7280", 1, "TODO", "DOING", "FINISH");
            createTaskPriority(project, "Normale", "Priorité normale - travail standard", "#3B82F6", 2, "TODO", "DOING", "FINISH");
            createTaskPriority(project, "Haute", "Priorité élevée - doit être fait rapidement", "#EF4444", 3, "TODO", "DOING", "FINISH");
            
            // Set normal priority as default
            Optional<TaskPriority> normalPriority = taskPriorityRepository.findByProjectAndName(project, "Normale");
            if (normalPriority.isPresent()) {
                setDefaultPriority(normalPriority.get().getId());
            }
        }
    }
}
