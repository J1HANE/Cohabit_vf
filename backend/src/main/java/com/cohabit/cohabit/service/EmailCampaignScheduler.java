package com.cohabit.cohabit.service;

import com.cohabit.cohabit.repository.EmailCampaignRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Component
public class EmailCampaignScheduler {

    private static final Logger logger = LoggerFactory.getLogger(EmailCampaignScheduler.class);

    private final EmailCampaignRepository repository;
    private final EmailCampaignService campaignService;

    public EmailCampaignScheduler(EmailCampaignRepository repository, EmailCampaignService campaignService) {
        this.repository = repository;
        this.campaignService = campaignService;
    }

    @Scheduled(fixedDelay = 30_000)
    public void sendDueCampaigns() {
        for (Long id : repository.findDueCampaignIds(LocalDateTime.now(ZoneOffset.UTC))) {
            try {
                campaignService.sendScheduledCampaign(id);
            } catch (RuntimeException exception) {
                logger.error("Could not process scheduled campaign {}", id, exception);
            }
        }
    }
}
