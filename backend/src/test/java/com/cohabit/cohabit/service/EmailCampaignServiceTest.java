package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.EmailCampaign;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.EmailCampaignRepository;
import com.cohabit.cohabit.repository.UserRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailCampaignServiceTest {

    @Mock private EmailCampaignRepository campaigns;
    @Mock private UserRepository users;
    @Mock private JavaMailSender mailSender;

    @Test
    void futureDateSchedulesCampaignAndClearingDateRestoresDraft() {
        EmailCampaignService service = service();
        EmailCampaign details = details();
        details.setScheduledAt(LocalDateTime.now(ZoneOffset.UTC).plusHours(1));
        when(campaigns.save(any(EmailCampaign.class))).thenAnswer(call -> call.getArgument(0));

        EmailCampaign campaign = service.createCampaign(details);
        assertEquals("SCHEDULED", campaign.getStatus());
        assertEquals(details.getScheduledAt(), campaign.getScheduledAt());

        when(campaigns.findByIdForUpdate(1L)).thenReturn(Optional.of(campaign));
        service.sendScheduledCampaign(1L);
        verifyNoInteractions(mailSender);

        details.setScheduledAt(null);
        EmailCampaign draft = service.updateCampaign(1L, details);
        assertEquals("DRAFT", draft.getStatus());
        assertNull(draft.getScheduledAt());
    }

    @Test
    void pastSendDateIsRejected() {
        EmailCampaign details = details();
        details.setScheduledAt(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1));
        assertThrows(IllegalArgumentException.class, () -> service().createCampaign(details));
        verifyNoInteractions(campaigns, mailSender);
    }

    @Test
    void dueCampaignIsSentOnceAndMarkedSent() {
        EmailCampaign campaign = details();
        campaign.setStatus("SCHEDULED");
        campaign.setScheduledAt(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1));
        User recipient = new User();
        recipient.setEmail("recipient@example.test");
        recipient.setSuspended(false);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(campaigns.findByIdForUpdate(1L)).thenReturn(Optional.of(campaign));
        when(users.findAll()).thenReturn(List.of(recipient));
        when(mailSender.createMimeMessage()).thenReturn(message);

        EmailCampaignService service = service();
        service.sendScheduledCampaign(1L);
        service.sendScheduledCampaign(1L);

        verify(mailSender).send(message);
        verify(campaigns).save(campaign);
        assertEquals("SENT", campaign.getStatus());
        assertEquals(1, campaign.getRecipientCount());
    }

    private EmailCampaignService service() {
        return new EmailCampaignService(campaigns, users, mailSender, "sender@example.test");
    }

    private EmailCampaign details() {
        EmailCampaign campaign = new EmailCampaign();
        campaign.setSubject("Newsletter");
        campaign.setContent("<p>Hello</p>");
        return campaign;
    }
}
