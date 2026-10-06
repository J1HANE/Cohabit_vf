package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Task;
import com.cohabit.cohabit.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, Task taskDetails) {
        return taskRepository.findById(id).map(task -> {
            task.setHouseholdId(taskDetails.getHouseholdId());
            task.setName(taskDetails.getName());
            task.setFrequencyDays(taskDetails.getFrequencyDays());
            task.setDueDate(taskDetails.getDueDate());
            task.setStatus(taskDetails.getStatus());
            task.setAssignedUserId(taskDetails.getAssignedUserId());
            task.setRotationIndex(taskDetails.getRotationIndex());
            task.setLastCompletedAt(taskDetails.getLastCompletedAt());
            return taskRepository.save(task);
        }).orElseThrow(() -> new RuntimeException("Task not found with id " + id));
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}
