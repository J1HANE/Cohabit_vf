package com.cohabit.cohabit.service;

import java.util.List;

public record MailDetails(List<Row> rows) {
    public MailDetails {
        rows = rows == null ? List.of() : List.copyOf(rows);
    }

    public record Row(String label, String value) {}
}
