package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Notification;
import com.cohabit.cohabit.service.NotificationService;
import com.cohabit.cohabit.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @Autowired
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getNotificationsForUser(@PathVariable Long userId, @AuthenticationPrincipal User actor) {
        if (!userId.equals(actor.getId())) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        return ResponseEntity.ok(notificationService.getNotificationsForUser(actor.getId()));
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<?> getUnreadCount(@PathVariable Long userId, @AuthenticationPrincipal User actor) {
        if (!userId.equals(actor.getId())) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        long count = notificationService.getUnreadCount(actor.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        return notificationService.markAsRead(id, actor.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<?> markAllAsRead(@PathVariable Long userId, @AuthenticationPrincipal User actor) {
        if (!userId.equals(actor.getId())) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        notificationService.markAllAsRead(actor.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        if (!notificationService.deleteNotification(id, actor.getId())) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }
}
