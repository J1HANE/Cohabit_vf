package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Task;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.TaskRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private NotificationService notificationService;
    @Mock private UserRepository userRepository;
    @InjectMocks private TaskService taskService;

    @Test
    void onlyAssignedMemberCanCompleteTask() {
        Task task = new Task();
        task.setId(7L);
        task.setHouseholdId(4L);
        task.setAssignedUserId(22L);
        task.setStatus("PENDING");
        when(taskRepository.findById(7L)).thenReturn(Optional.of(task));
        when(userRepository.findById(11L)).thenReturn(Optional.of(member(11L, 4L)));

        assertThrows(SecurityException.class, () -> taskService.completeTask(7L, 11L));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void assignedMemberCanCompleteTask() {
        Task task = new Task();
        task.setId(7L);
        task.setHouseholdId(4L);
        task.setAssignedUserId(22L);
        task.setStatus("PENDING");
        when(taskRepository.findById(7L)).thenReturn(Optional.of(task));
        when(userRepository.findById(22L)).thenReturn(Optional.of(member(22L, 4L)));
        when(taskRepository.save(task)).thenReturn(task);

        assertEquals("COMPLETED", taskService.completeTask(7L, 22L).getStatus());
    }

    private User member(Long id, Long householdId) {
        User user = new User();
        user.setId(id);
        user.setHouseholdId(householdId);
        return user;
    }
}