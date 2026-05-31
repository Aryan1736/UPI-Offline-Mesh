package com.demo.UpiMesh.Repository;

import com.demo.UpiMesh.Entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, String> {
}
