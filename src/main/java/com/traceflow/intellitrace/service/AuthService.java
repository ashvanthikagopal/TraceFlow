package com.traceflow.intellitrace.service;

import com.traceflow.intellitrace.model.User;
import com.traceflow.intellitrace.util.Validation;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.io.File;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.sql.*;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

public class AuthService {

    private final String dbUrl;
    private static final String DB_USER = "sa";
    private static final String DB_PASSWORD = "";

    static {
        try {
            Class.forName("org.h2.Driver");
        } catch (ClassNotFoundException ignored) {
        }
    }

    public AuthService() {
        File dataDir = new File("./data");
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }
        this.dbUrl = "jdbc:h2:file:./data/intellitrace-db;DB_CLOSE_DELAY=-1;AUTO_SERVER=TRUE";
        initDatabase();
    }

    public AuthService(String customDbUrl) {
        this.dbUrl = customDbUrl;
        initDatabase();
    }

    private void initDatabase() {
        String sql = "CREATE TABLE IF NOT EXISTS users ("
                + "id BIGINT AUTO_INCREMENT PRIMARY KEY, "
                + "name VARCHAR(100) NOT NULL, "
                + "email VARCHAR(100) NOT NULL UNIQUE, "
                + "mobile_no VARCHAR(10) NOT NULL, "
                + "password VARCHAR(255) NOT NULL"
                + ");";

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            System.out.println("[AuthService Error] Failed to initialize users table: " + e.getMessage());
        }
    }

    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUrl, DB_USER, DB_PASSWORD);
    }

    public boolean register(String name, String email, String mobileNo, String password) {
        if (!Validation.isValidName(name)) return false;
        if (!Validation.isValidEmail(email)) return false;
        if (!Validation.isValidMobileNumber(mobileNo)) return false;
        if (!Validation.isValidPassword(password)) return false;

        String checkSql = "SELECT COUNT(*) FROM users WHERE email = ?";
        try (Connection conn = getConnection();
             PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
            checkStmt.setString(1, email.trim());
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next() && rs.getInt(1) > 0) {
                    System.out.println("[Auth Error] Email '" + email + "' is already registered.");
                    return false;
                }
            }
        } catch (SQLException e) {
            System.out.println("[Auth Error] Check existing user failed: " + e.getMessage());
            return false;
        }

        String hashedPassword = hashPassword(password);
        String insertSql = "INSERT INTO users (name, email, mobile_no, password) VALUES (?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
            insertStmt.setString(1, name.trim());
            insertStmt.setString(2, email.trim());
            insertStmt.setString(3, mobileNo.trim());
            insertStmt.setString(4, hashedPassword);

            int rowsAffected = insertStmt.executeUpdate();
            if (rowsAffected > 0) {
                System.out.println("[Auth] User registered successfully: " + email);
                return true;
            }
        } catch (SQLException e) {
            System.out.println("[Auth Error] Registration failed: " + e.getMessage());
        }
        return false;
    }

    public User login(String email, String password) {
        if (!Validation.isValidEmail(email)) return null;
        if (!Validation.isValidPassword(password)) return null;

        String selectSql = "SELECT id, name, email, mobile_no, password FROM users WHERE email = ?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(selectSql)) {
            stmt.setString(1, email.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Long id = rs.getLong("id");
                    String name = rs.getString("name");
                    String userEmail = rs.getString("email");
                    String mobileNo = rs.getString("mobile_no");
                    String storedHash = rs.getString("password");

                    if (verifyPassword(password, storedHash)) {
                        System.out.println("[Auth] Login successful for user: " + name + " (" + email + ")");
                        return new User(id, name, userEmail, mobileNo, storedHash);
                    } else {
                        System.out.println("[Auth Error] Incorrect password for: " + email);
                        return null;
                    }
                } else {
                    System.out.println("[Auth Error] No user account found with email: " + email);
                    return null;
                }
            }
        } catch (SQLException e) {
            System.out.println("[Auth Error] Login query failed: " + e.getMessage());
            return null;
        }
    }

    public List<User> getAllUsers() {
        List<User> list = new ArrayList<>();
        String query = "SELECT id, name, email, mobile_no, password FROM users ORDER BY id ASC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(new User(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("mobile_no"),
                        rs.getString("password")
                ));
            }
        } catch (SQLException e) {
            System.out.println("[Auth Error] Failed to fetch users: " + e.getMessage());
        }
        return list;
    }

    public String hashPassword(String password) {
        try {
            byte[] salt = new byte[16];
            SecureRandom random = new SecureRandom();
            random.nextBytes(salt);

            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 128);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = factory.generateSecret(spec).getEncoded();

            return HexFormat.of().formatHex(salt) + ":" + HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new RuntimeException("Error hashing password with PBKDF2", e);
        }
    }

    public boolean verifyPassword(String password, String storedHash) {
        if (storedHash == null || !storedHash.contains(":")) {
            // Backward compatibility check for plain text
            return storedHash != null && storedHash.equals(password);
        }
        try {
            String[] parts = storedHash.split(":");
            if (parts.length != 2) return false;

            byte[] salt = HexFormat.of().parseHex(parts[0]);
            byte[] expectedHash = HexFormat.of().parseHex(parts[1]);

            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 128);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] actualHash = factory.generateSecret(spec).getEncoded();

            int diff = expectedHash.length ^ actualHash.length;
            for (int i = 0; i < expectedHash.length && i < actualHash.length; i++) {
                diff |= expectedHash[i] ^ actualHash[i];
            }
            return diff == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
