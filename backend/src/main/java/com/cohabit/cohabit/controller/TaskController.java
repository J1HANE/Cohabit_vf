package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Task;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> getAllTasks(@AuthenticationPrincipal User actor) {
        return actor.getHouseholdId() == null ? List.of()
                : taskService.getAllTasks().stream()
                .filter(task -> actor.getHouseholdId().equals(task.getHouseholdId())).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        return taskService.getTaskById(id)
                .filter(task -> actor.getHouseholdId() != null && actor.getHouseholdId().equals(task.getHouseholdId()))
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createTask(@Valid @RequestBody Task task, @AuthenticationPrincipal User actor) {
        try {
            return ResponseEntity.ok(taskService.createTask(task, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @Valid @RequestBody Task task,
                                        @AuthenticationPrincipal User actor) {
        try {
            return ResponseEntity.ok(taskService.updateTask(id, task, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeTask(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        try {
            return ResponseEntity.ok(taskService.completeTask(id, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        try {
            taskService.deleteTask(id, actor.getId());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
