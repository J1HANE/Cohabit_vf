package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Notification;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.NotificationRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectProvider<MailNotificationService> mailNotificationService;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository,
                               ObjectProvider<MailNotificationService> mailNotificationService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.mailNotificationService = mailNotificationService;
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
    public Optional<Notification> markAsRead(Long notificationId, Long userId) {
        return notificationRepository.findById(notificationId)
                .filter(notif -> userId.equals(notif.getUserId())).map(notif -> {
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
        return createNotification(userId, householdId, title, message, type, link, new MailDetails(List.of()));
    }

    @Transactional
    public Notification createNotification(Long userId, Long householdId, String title, String message,
                                           String type, String link, MailDetails mailDetails) {
        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setHouseholdId(householdId);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setType(type);
        notif.setLink(link);
        notif.setIsRead(false);
        Notification saved = notificationRepository.save(notif);
        userRepository.findById(userId).ifPresent(user ->
            mailNotificationService.ifAvailable(mail -> mail.sendNotification(user, title, message, link, mailDetails)));
        return saved;
    }

    @Transactional
    public void notifyHouseholdMembers(Long householdId, Long excludeUserId, String title, String message, String type, String link) {
        notifyHouseholdMembers(householdId, excludeUserId, title, message, type, link, new MailDetails(List.of()));
    }

    @Transactional
    public void notifyHouseholdMembers(Long householdId, Long excludeUserId, String title, String message,
                                       String type, String link, MailDetails mailDetails) {
        if (householdId == null) return;
        List<User> members = userRepository.findByHouseholdId(householdId);
        for (User member : members) {
            if (excludeUserId == null || !member.getId().equals(excludeUserId)) {
                createNotification(member.getId(), householdId, title, message, type, link, mailDetails);
            }
        }
    }

    @Transactional
    public boolean deleteNotification(Long id, Long userId) {
        return notificationRepository.findById(id)
                .filter(notification -> userId.equals(notification.getUserId()))
                .map(notification -> {
                    notificationRepository.delete(notification);
                    return true;
                }).orElse(false);
    }
}
