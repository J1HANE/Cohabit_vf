package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Notification;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.NotificationRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_IdAndIsReadFalse(userId);
    }

    @Transactional
    public Optional<Notification> markAsRead(Long notificationId) {
        return notificationRepository.findById(notificationId).map(notif -> {
            notif.setIsRead(true);
            return notificationRepository.save(notif);
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUser_IdAndIsReadFalse(userId);
        for (Notification notif : unread) {
            notif.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public Notification createNotification(Long userId, Long householdId, String title, String message, String type, String link) {
        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setHouseholdId(householdId);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setType(type);
        notif.setLink(link);
        notif.setIsRead(false);
        return notificationRepository.save(notif);
    }

    @Transactional
    public void notifyHouseholdMembers(Long householdId, Long excludeUserId, String title, String message, String type, String link) {
        if (householdId == null) return;
        List<User> members = userRepository.findByHouseholdId(householdId);
        for (User member : members) {
            if (excludeUserId == null || !member.getId().equals(excludeUserId)) {
                createNotification(member.getId(), householdId, title, message, type, link);
            }
        }
    }

    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}
