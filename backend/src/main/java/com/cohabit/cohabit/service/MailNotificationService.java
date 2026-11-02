package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class MailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(MailNotificationService.class);

    private final JavaMailSender mailSender;
    private final String senderAddress;
    private final String smtpHost;
    private final boolean enabled;
    private final String appUrl;

    public MailNotificationService(JavaMailSender mailSender,
                                   @Value("${cohabit.mail.from:no-reply@cohabit.local}") String senderAddress,
                                   @Value("${spring.mail.host:}") String smtpHost,
                                   @Value("${cohabit.mail.enabled:false}") boolean enabled,
                                   @Value("${cohabit.app.url:http://localhost:5173}") String appUrl) {
        this.mailSender = mailSender;
        this.senderAddress = senderAddress;
        this.smtpHost = smtpHost;
        this.enabled = enabled;
        this.appUrl = appUrl.replaceAll("/+$", "");
        logger.info("Email notifications {} (SMTP host={}, from={})",
                enabled ? "enabled" : "disabled", smtpHost, senderAddress);
    }

    public void sendNotification(User user, String title, String message) {
        sendNotification(user, title, message, null, new MailDetails(java.util.List.of()));
    }

    public void sendNotification(User user, String title, String message, String link, MailDetails details) {
        if (!enabled) return;
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            logger.warn("Skipping notification email for user {} because their account has no email address", user.getId());
            return;
        }
        try {
            MimeMessage email = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(email, false, StandardCharsets.UTF_8.name());
            String subject = "CoHabit · " + title;
            helper.setFrom(senderAddress);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(buildPlainText(message, link, details), buildHtml(title, message, link, details));
            mailSender.send(email);
            logger.info("Notification email accepted by SMTP host={} for {} (subject={})",
                    smtpHost, user.getEmail(), subject);
        } catch (RuntimeException exception) {
            logger.warn("SMTP host={} could not send notification email to {} (subject={})",
                    smtpHost, user.getEmail(), "CoHabit · " + title, exception);
        } catch (jakarta.mail.MessagingException exception) {
            logger.warn("Could not build notification email for {} (subject=CoHabit · {})",
                    user.getEmail(), title, exception);
        }
    }

    private String buildHtml(String title, String message, String link, MailDetails details) {
        StringBuilder rows = new StringBuilder();
        if (details != null) {
            for (MailDetails.Row row : details.rows()) {
                rows.append("<tr><td style=\"padding:13px 16px;border-bottom:1px solid #e8efec;color:#61716b;font-size:13px;vertical-align:top;width:38%\">")
                        .append(escape(row.label()))
                        .append("</td><td style=\"padding:13px 16px;border-bottom:1px solid #e8efec;color:#192722;font-size:14px;font-weight:600;vertical-align:top\">")
                        .append(escape(row.value()).replace("\n", "<br>"))
                        .append("</td></tr>");
            }
        }

        String button = link == null || link.isBlank() ? "" : "<div style=\"padding:24px 28px 28px;text-align:center\"><a href=\""
                + escape(appUrl + link) + "\" style=\"display:inline-block;background:#224f43;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 22px;border-radius:10px\">Voir dans CoHabit&nbsp; →</a></div>";
        String sentDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'à' HH:mm", Locale.FRENCH));
        return "<!doctype html><html><body style=\"margin:0;padding:0;background:#f1f5f3;font-family:Arial,Helvetica,sans-serif;color:#192722\">"
                + "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0\">" + escape(message) + "</div>"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f1f5f3;padding:30px 12px\"><tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%;max-width:600px;background:#ffffff;border:1px solid #e1e9e5;border-radius:18px;overflow:hidden\">"
                + "<tr><td style=\"padding:23px 28px;background:#10201c\"><table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\"><tr><td style=\"width:34px;height:34px;background:#a8d5c4;border-radius:9px;text-align:center;color:#153c31;font-size:19px;font-weight:bold\">C</td><td style=\"padding-left:11px;color:#ffffff;font-weight:700;font-size:19px;letter-spacing:-.3px\">CoHabit</td></tr></table></td></tr>"
                + "<tr><td style=\"padding:28px 28px 8px\"><div style=\"font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#52806f\">Notification de colocation</div><h1 style=\"font-size:25px;line-height:32px;margin:8px 0 8px;color:#192722\">" + escape(title) + "</h1><p style=\"margin:0;color:#61716b;font-size:14px;line-height:22px\">" + escape(message) + "</p><p style=\"margin:10px 0 0;color:#83918c;font-size:12px\">" + escape(sentDate) + "</p></td></tr>"
                + (rows.length() == 0 ? "" : "<tr><td style=\"padding:18px 28px 0\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border:1px solid #e4ece8;border-radius:12px;border-spacing:0;overflow:hidden\">" + rows + "</table></td></tr>")
                + "<tr><td>" + button + "</td></tr><tr><td style=\"padding:0 28px 24px;text-align:center;color:#87948f;font-size:11px;line-height:18px\">Vous recevez cet e-mail car vous faites partie de cette colocation.<br>CoHabit · La vie à plusieurs, simplement.</td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    private String buildPlainText(String message, String link, MailDetails details) {
        StringBuilder text = new StringBuilder(message).append("\n\nDate : ")
                .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("d MMMM yyyy 'à' HH:mm", Locale.FRENCH)));
        if (details != null) {
            for (MailDetails.Row row : details.rows()) text.append("\n").append(row.label()).append(" : ").append(row.value());
        }
        if (link != null && !link.isBlank()) text.append("\n\nVoir dans CoHabit : ").append(appUrl).append(link);
        return text.toString();
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
