package com.traceflow;

import com.traceflow.model.User;
import com.traceflow.repository.UserRepository;
import com.traceflow.util.SecurityUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class TraceFlowApplication {

    private static final Logger log = LoggerFactory.getLogger(TraceFlowApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(TraceFlowApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDefaultUser(UserRepository userRepository, SecurityUtil securityUtil) {
        return args -> {
            if (userRepository.count() == 0) {
                User demoUser = new User("demo", "demo@traceflow.local", securityUtil.hashPassword("password123"));
                userRepository.save(demoUser);
                log.info("Initialized default offline demo user: username='demo', password='password123'");
            }
        };
    }
}
