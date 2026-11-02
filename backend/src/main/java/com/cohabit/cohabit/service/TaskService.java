package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Task;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.TaskRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository, NotificationService notificationService,
                       UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    public Task createTask(Task task, Long actorId) {
        requireMember(task.getHouseholdId(), actorId);
        if (task.getAssignedUserId() != null) requireMember(task.getHouseholdId(), task.getAssignedUserId());
        task.setStatus("PENDING");
        Task saved = taskRepository.save(task);

        try {
            if (saved.getHouseholdId() != null) {
                String msg = "Une nouvelle tâche a été ajoutée : '" + saved.getName() + "'";
                notificationService.notifyHouseholdMembers(
                        saved.getHouseholdId(),
                        null,
                        "Nouvelle tâche",
                        msg,
                        "TASK",
                        "/tasks"
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return saved;
    }

    public Task updateTask(Long id, Task taskDetails, Long actorId) {
        return taskRepository.findById(id).map(task -> {
            requireMember(task.getHouseholdId(), actorId);
            if (taskDetails.getStatus() != null && !task.getStatus().equalsIgnoreCase(taskDetails.getStatus())) {
                throw new SecurityException("Task status can only be changed by its assigned member");
            }
            if (!task.getHouseholdId().equals(taskDetails.getHouseholdId())) {
                throw new IllegalArgumentException("A task cannot be moved to another household");
            }
            if (taskDetails.getAssignedUserId() != null) {
                requireMember(task.getHouseholdId(), taskDetails.getAssignedUserId());
            }
            task.setName(taskDetails.getName());
            task.setFrequencyDays(taskDetails.getFrequencyDays());
            task.setDueDate(taskDetails.getDueDate());
            task.setAssignedUserId(taskDetails.getAssignedUserId());
            task.setRotationIndex(taskDetails.getRotationIndex());
            return taskRepository.save(task);
        }).orElseThrow(() -> new RuntimeException("Task not found with id " + id));
    }

    public Task completeTask(Long id, Long actorId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id " + id));
        requireMember(task.getHouseholdId(), actorId);
        if (task.getAssignedUserId() == null || !actorId.equals(task.getAssignedUserId())) {
            throw new SecurityException("Only the assigned member can complete this task");
        }
        if ("COMPLETED".equalsIgnoreCase(task.getStatus())) {
            throw new IllegalStateException("Task is already completed");
        }
        task.setStatus("COMPLETED");
        task.setLastCompletedAt(java.time.LocalDateTime.now());
        return taskRepository.save(task);
    }

    public void deleteTask(Long id, Long actorId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id " + id));
        requireMember(task.getHouseholdId(), actorId);
        taskRepository.delete(task);
    }

    private User requireMember(Long householdId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (householdId == null || !householdId.equals(user.getHouseholdId())) {
            throw new SecurityException("User does not belong to this household");
        }
        return user;
    }
}
