package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.EmailCampaign;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.EmailCampaignRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.internet.MimeMessage;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Service
public class EmailCampaignService {

    private static final Logger logger = LoggerFactory.getLogger(EmailCampaignService.class);

    private final EmailCampaignRepository emailCampaignRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final String senderAddress;

    @Autowired
    public EmailCampaignService(EmailCampaignRepository emailCampaignRepository,
                                UserRepository userRepository,
                                JavaMailSender mailSender,
                                @Value("${cohabit.mail.from:no-reply@cohabit.local}") String senderAddress) {
        this.emailCampaignRepository = emailCampaignRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.senderAddress = senderAddress;
    }

    @Transactional(readOnly = true)
    public List<EmailCampaign> getAllCampaigns() {
        return emailCampaignRepository.findAllOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<EmailCampaign> getCampaignsByStatus(String status) {
        return emailCampaignRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional(readOnly = true)
    public Optional<EmailCampaign> getCampaign(Long id) {
        return emailCampaignRepository.findById(id);
    }

    @Transactional
    public EmailCampaign createCampaign(EmailCampaign campaignDetails) {
        EmailCampaign campaign = new EmailCampaign();
        campaign.setCreatedAt(LocalDateTime.now());
        applyDetails(campaign, campaignDetails);
        return emailCampaignRepository.save(campaign);
    }

    @Transactional
    public EmailCampaign updateCampaign(Long id, EmailCampaign campaignDetails) {
        EmailCampaign campaign = lockCampaign(id);

        if ("SENT".equals(campaign.getStatus())) {
            throw new IllegalStateException("Cannot modify a sent campaign");
        }

        applyDetails(campaign, campaignDetails);
        return emailCampaignRepository.save(campaign);
    }

    @Transactional
    public EmailCampaign sendCampaign(Long id) {
        EmailCampaign campaign = lockCampaign(id);

        if ("SENT".equals(campaign.getStatus())) {
            throw new IllegalStateException("Campaign already sent");
        }

        return deliverCampaign(campaign);
    }

    @Transactional
    public void sendScheduledCampaign(Long id) {
        emailCampaignRepository.findByIdForUpdate(id)
                .filter(campaign -> "SCHEDULED".equals(campaign.getStatus()))
                .filter(campaign -> campaign.getScheduledAt() != null
                        && !campaign.getScheduledAt().isAfter(LocalDateTime.now(ZoneOffset.UTC)))
                .ifPresent(this::deliverCampaign);
    }

    private EmailCampaign deliverCampaign(EmailCampaign campaign) {
        // Get all active users
        List<User> users = userRepository.findAll();
        int sentCount = 0;

        for (User user : users) {
            if (user.getEmail() != null && !user.getEmail().isBlank() && !user.getSuspended()) {
                try {
                    sendMarketingEmail(user, campaign.getSubject(), campaign.getContent());
                    sentCount++;
                } catch (Exception e) {
                    logger.error("Failed to send email to user {}: {}", user.getEmail(), e.getMessage());
                }
            }
        }

        campaign.setStatus("SENT");
        campaign.setSentAt(LocalDateTime.now());
        campaign.setRecipientCount(sentCount);

        return emailCampaignRepository.save(campaign);
    }

    @Transactional
    public void deleteCampaign(Long id) {
        EmailCampaign campaign = lockCampaign(id);

        if ("SENT".equals(campaign.getStatus())) {
            throw new IllegalStateException("Cannot delete a sent campaign");
        }

        emailCampaignRepository.delete(campaign);
    }

    private EmailCampaign lockCampaign(Long id) {
        return emailCampaignRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalStateException("Campaign not found with id " + id));
    }

    private void applyDetails(EmailCampaign campaign, EmailCampaign details) {
        LocalDateTime scheduledAt = details.getScheduledAt();
        if (scheduledAt != null && !scheduledAt.isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new IllegalArgumentException("Choose a send date and time in the future.");
        }

        campaign.setSubject(details.getSubject());
        campaign.setContent(details.getContent());
        campaign.setScheduledAt(scheduledAt);
        campaign.setStatus(scheduledAt == null ? "DRAFT" : "SCHEDULED");
    }

    private void sendMarketingEmail(User user, String subject, String content) throws Exception {
        MimeMessage email = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(email, true, StandardCharsets.UTF_8.name());

        helper.setFrom(senderAddress);
        helper.setTo(user.getEmail());
        helper.setSubject("CoHabit - " + subject);
        helper.setText(buildEmailContent(user, subject, content), true);

        mailSender.send(email);
    }

    private String buildEmailContent(User user, String subject, String content) {
        return "<!doctype html><html><body style=\"margin:0;padding:0;background:#f1f5f3;font-family:Arial,Helvetica,sans-serif;color:#192722\">" +
                "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f1f5f3;padding:30px 12px\">" +
                "<tr><td align=\"center\">" +
                "<table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%;max-width:600px;background:#ffffff;border:1px solid #e1e9e5;border-radius:18px;overflow:hidden\">" +
                "<tr><td style=\"padding:23px 28px;background:#10201c\">" +
                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\">" +
                "<tr><td style=\"width:34px;height:34px;background:#a8d5c4;border-radius:9px;text-align:center;color:#153c31;font-size:19px;font-weight:bold\">C</td>" +
                "<td style=\"padding-left:11px;color:#ffffff;font-weight:700;font-size:19px;letter-spacing:-.3px\">CoHabit</td>" +
                "</tr></table></td></tr>" +
                "<tr><td style=\"padding:28px 28px\">" +
                "<h1 style=\"font-size:25px;line-height:32px;margin:0 0 16px;color:#192722\">" + subject + "</h1>" +
                "<div style=\"color:#61716b;font-size:14px;line-height:22px\">" + content + "</div>" +
                "</td></tr>" +
                "<tr><td style=\"padding:0 28px 24px;text-align:center;color:#87948f;font-size:11px;line-height:18px\">" +
                "Vous recevez cet e-mail car vous êtes inscrit sur CoHabit.<br>" +
                "<a href=\"#\" style=\"color:#52806f;text-decoration:underline\">Se désabonner</a>" +
                "</td></tr>" +
                "</table></td></tr></table></body></html>";
    }
}
