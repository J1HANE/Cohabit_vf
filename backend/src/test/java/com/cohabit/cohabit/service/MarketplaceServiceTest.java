package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class MarketplaceServiceTest {

    @Mock private JdbcTemplate jdbc;
    @InjectMocks private MarketplaceService marketplaceService;

    @Test
    void rejectsEmptyTitle() {
        User actor = new User();
        actor.setId(1L);

        MarketplaceService.Details details = new MarketplaceService.Details(
                "",
                "Description",
                new BigDecimal("100.00"),
                "FIXED",
                "FURNITURE",
                null,
                "GOOD",
                "AVAILABLE",
                List.of()
        );

        assertThrows(IllegalArgumentException.class, () ->
                marketplaceService.createItem(actor, details, List.of()));
    }

    @Test
    void rejectsZeroOrNegativePrice() {
        User actor = new User();
        actor.setId(1L);

        MarketplaceService.Details details = new MarketplaceService.Details(
                "Table",
                "Description",
                BigDecimal.ZERO,
                "FIXED",
                "FURNITURE",
                null,
                "GOOD",
                "AVAILABLE",
                List.of()
        );

        assertThrows(IllegalArgumentException.class, () ->
                marketplaceService.createItem(actor, details, List.of()));
    }
}
