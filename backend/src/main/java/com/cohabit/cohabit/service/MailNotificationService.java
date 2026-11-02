package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "cohabit.mail.enabled", havingValue = "true")
public class MailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(MailNotificationService.class);

    private final JavaMailSender mailSender;
    private final String senderAddress;

    public MailNotificationService(JavaMailSender mailSender,
                                   @Value("${cohabit.mail.from:no-reply@cohabit.local}") String senderAddress) {
        this.mailSender = mailSender;
        this.senderAddress = senderAddress;
    }

    public void sendNotification(User user, String title, String message) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;
        SimpleMailMessage email = new SimpleMailMessage();
        email.setFrom(senderAddress);
        email.setTo(user.getEmail());
        email.setSubject("CoHabit · " + title);
        email.setText(message);
        try {
            mailSender.send(email);
        } catch (RuntimeException exception) {
            logger.warn("Could not send notification email to {}", user.getEmail(), exception);
        }
    }
}