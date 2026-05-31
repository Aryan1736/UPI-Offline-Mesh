package com.demo.UpiMesh.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

// Simulated Bank Account

@Entity
@Table(name = "accounts")
@Data
public class Account {

    @Id
    private String vpa; // Virtual Payment Address

    @Column(nullable = false)
    private String holderName;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance;

    @Version // Optimistic locking — prevents lost updates on concurrent transfers
    private Long version;

    public Account(){}

    public Account(String vpa, String holderName, BigDecimal balance){
        this.vpa = vpa;
        this.balance = balance;
        this.holderName = holderName;
    }

}